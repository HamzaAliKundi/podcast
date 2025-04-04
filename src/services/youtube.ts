import { source } from "framer-motion/client";
import { YoutubeConfig } from "../types";
import { GeminiService } from "./gemini";
import { supabase } from "./supabase";

import { ApifyClient } from "apify-client";
import toast from "react-hot-toast";

const geminiService = new GeminiService();

export class YouTubeService {
  // private client: ApifyClient;
  private apifyKey: string;
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheDuration: number = 30 * 60 * 1000; // 30 minutes cache
  private quotaError = "YouTube API quota exceeded. Please try again later.";

  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API;
    if (!this.apiKey) {
      throw new Error("YouTube API key is missing");
    }
    // apify key
    this.apifyKey = import.meta.env.VITE_APIFY_TOKEN;
    if (!this.apifyKey) {
      throw new Error("Apify key is missing");
    }
    // this.client = new ApifyClient({ token: this.apifyKey }); // ✅ Initialize the client inside the constructor

    this.baseUrl = "https://www.googleapis.com/youtube/v3";
    this.cache = new Map();
  }

  private getCacheKey(
    endpoint: string,
    params: Record<string, string>
  ): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(
        `yt_cache_${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      // Ignore storage errors
    }
  }

  private getFromLocalStorage(key: string): any | null {
    try {
      const stored = localStorage.getItem(`yt_cache_${key}`);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < this.cacheDuration) {
          return data;
        }
        localStorage.removeItem(`yt_cache_${key}`);
      }
    } catch (error) {
      // Ignore storage errors
    }
    return null;
  }

  private async fetchYouTubeAPI(
    endpoint: string,
    params: Record<string, string>
  ) {
    try {
      const cacheKey = this.getCacheKey(endpoint, params);

      // Try memory cache first
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Try localStorage cache
      const storedData = this.getFromLocalStorage(cacheKey);
      if (storedData) {
        this.setCache(cacheKey, storedData); // Restore to memory cache
        return storedData;
      }

      const queryParams = new URLSearchParams({
        key: this.apiKey,
        ...params,
      });

      const response = await fetch(
        `${this.baseUrl}/${endpoint}?${queryParams}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.error?.message ||
          `YouTube API error: ${response.statusText}`;

        // Check for quota exceeded error
        if (errorMessage.includes("quota")) {
          // Try to return cached data even if expired
          const expiredCache = localStorage.getItem(`yt_cache_${cacheKey}`);
          if (expiredCache) {
            const { data } = JSON.parse(expiredCache);
            return data;
          }
          throw new Error(this.quotaError);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "YouTube API error");
      }

      this.setCache(cacheKey, data);
      return data;
    } catch (error: any) {
      if (error.message.includes("quota")) {
        throw new Error(this.quotaError);
      }
      console.error("YouTube API Error:", error.message);
      throw new Error(`YouTube API request failed: ${error.message}`);
    }
  }

  async searchChannels(query: string) {
    if (!query.trim()) {
      throw new Error("Search query is required");
    }

    try {
      // First search for channels
      const searchData = await this.fetchYouTubeAPI("search", {
        part: "snippet",
        type: "channel",
        q: query,
        maxResults: "5",
      });

      if (!searchData.items?.length) {
        return [];
      }

      // Get detailed channel information
      const channelIds = searchData.items.map((item: any) => item.id.channelId);
      const channelsData = await this.fetchYouTubeAPI("channels", {
        part: "snippet,statistics,brandingSettings",
        id: channelIds.join(","),
      });

      // Combine search results with channel details
      return searchData.items.map((item: any) => {
        const channelDetails = channelsData.items?.find(
          (channel: any) => channel.id === item.id.channelId
        );

        return {
          id: item.id.channelId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url,
          statistics: channelDetails?.statistics || {},
          banner: channelDetails?.brandingSettings?.image?.bannerExternalUrl,
          customUrl: channelDetails?.snippet?.customUrl,
          country: channelDetails?.snippet?.country,
          publishedAt: channelDetails?.snippet?.publishedAt,
        };
      });
    } catch (error: any) {
      console.error("Error searching channels:", error.message);
      throw error; // Preserve the quota error message
    }
  }

  async getChannelDetails(channelId: string) {
    if (!channelId) {
      throw new Error("Channel ID is required");
    }

    try {
      // Get channel details
      const channelData = await this.fetchYouTubeAPI("channels", {
        part: "snippet,statistics,brandingSettings,contentDetails",
        id: channelId,
      });

      if (!channelData.items?.[0]) {
        throw new Error("Channel not found");
      }

      const channel = channelData.items[0];

      // Get channel playlists
      const playlistsData = await this.fetchYouTubeAPI("playlists", {
        part: "snippet,contentDetails",
        channelId: channelId,
        maxResults: "10",
      }).catch(() => ({ items: [] })); // Playlists are optional

      // Get latest videos
      const videosData = await this.fetchYouTubeAPI("search", {
        part: "snippet",
        channelId: channelId,
        order: "date",
        type: "video",
        maxResults: "10",
      }).catch(() => ({ items: [] })); // Videos are optional

      // Get full video details for recent videos
      const videoIds =
        videosData.items?.map((video: any) => video.id.videoId) || [];
      const fullVideoDetails =
        videoIds.length > 0
          ? await this.fetchYouTubeAPI("videos", {
              part: "snippet,statistics",
              id: videoIds.join(","),
            })
          : { items: [] };

      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail:
          channel.snippet.thumbnails?.high?.url ||
          channel.snippet.thumbnails?.default?.url,
        banner: channel.brandingSettings?.image?.bannerExternalUrl,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        viewCount: channel.statistics.viewCount,
        publishedAt: channel.snippet.publishedAt,
        country: channel.snippet.country,
        customUrl: channel.snippet.customUrl,
        keywords:
          channel.brandingSettings?.channel?.keywords
            ?.split("|")
            .map((k: string) => k.trim()) || [],
        topic: channel.brandingSettings?.channel?.defaultTab || "videos",
        featuredPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
        playlists:
          playlistsData.items?.map((playlist: any) => ({
            id: playlist.id,
            title: playlist.snippet.title,
            description: playlist.snippet.description,
            thumbnail: playlist.snippet.thumbnails?.medium?.url,
            itemCount: playlist.contentDetails?.itemCount || 0,
            publishedAt: playlist.snippet.publishedAt,
          })) || [],
        recentVideos:
          videosData.items?.map((video: any) => {
            const fullDetails = fullVideoDetails.items?.find(
              (v: any) => v.id === video.id.videoId
            );
            return {
              id: video.id.videoId,
              title: video.snippet.title,
              description: video.snippet.description,
              thumbnail: video.snippet.thumbnails?.medium?.url,
              publishedAt: video.snippet.publishedAt,
              statistics: fullDetails?.statistics || {},
            };
          }) || [],
      };
    } catch (error: any) {
      console.error("Error fetching channel details:", error.message);
      throw error; // Preserve the quota error message
    }
  }

  async getVideoDetails(videoId: string, sourceId: string) {
    if (!videoId) {
      throw new Error("Video ID is required");
    }

    try {
      // Get video details including statistics
      const data = await this.fetchYouTubeAPI("videos", {
        part: "snippet,statistics,contentDetails,topicDetails",
        id: videoId,
      });

      if (!data.items?.[0]) {
        throw new Error("Video not found");
      }

      const video = data.items[0];

      // Parse duration from ISO 8601 format
      const duration = video.contentDetails.duration;
      const durationMatch = duration.match(
        /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
      );
      const hours = parseInt(durationMatch?.[1] || "0");
      const minutes = parseInt(durationMatch?.[2] || "0");
      const seconds = parseInt(durationMatch?.[3] || "0");
      const durationInSeconds = hours * 3600 + minutes * 60 + seconds;

      // Calculate tokens: 10 tokens per minute = 1 token per 6 seconds
      const tokenCost = Math.floor(durationInSeconds / 6);

      // console.log("Video duration in seconds:", durationInSeconds);
      // console.log("Token cost:", tokenCost);
      // return;
      // Get channel details
      const channelData = await this.fetchYouTubeAPI("channels", {
        part: "snippet,statistics",
        id: video.snippet.channelId,
      });

      const channel = channelData.items?.[0];

      // Get captions if available
      let transcript = null;
      // if (video.contentDetails.caption === "true") {
      //@ts-ignore
      transcript = await this.getVideoTranscript(videoId, sourceId);
      // }

      if (!transcript) {
        console.warn("No transcript available for this video.");
        toast.error("No captions available.");
        return;
      }

      return {
        id: video.id,
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        channelThumbnail: channel?.snippet?.thumbnails?.default?.url,
        thumbnail:
          video.snippet.thumbnails?.high?.url ||
          video.snippet.thumbnails?.default?.url,
        duration: durationInSeconds,
        transcript,
        statistics: {
          viewCount: video.statistics.viewCount,
          likeCount: video.statistics.likeCount,
          commentCount: video.statistics.commentCount,
          channelSubscriberCount: channel?.statistics?.subscriberCount,
        },
        topics: video.topicDetails?.topicCategories || [],
        tags: video.snippet.tags || [],
        category: video.snippet.categoryId,
        language:
          video.snippet.defaultLanguage || video.snippet.defaultAudioLanguage,
      };
    } catch (error: any) {
      console.error("Error fetching video details:", error.message);
      throw error; // Preserve the quota error message
    }
  }

  async getPlaylistItems(playlistId: string, pageToken?: string) {
    if (!playlistId) {
      throw new Error("Playlist ID is required");
    }

    try {
      const params: Record<string, string> = {
        part: "snippet,contentDetails",
        playlistId: playlistId,
        maxResults: "10",
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const data = await this.fetchYouTubeAPI("playlistItems", params);

      if (!data.items?.length) {
        return { items: [], nextPageToken: null };
      }

      // Get full video details for all videos in the playlist
      const videoIds = data.items.map(
        (item: any) => item.contentDetails.videoId
      );
      const videoDetails = await this.fetchYouTubeAPI("videos", {
        part: "snippet,statistics",
        id: videoIds.join(","),
      });

      return {
        items: data.items.map((item: any) => {
          const fullDetails = videoDetails.items?.find(
            (v: any) => v.id === item.contentDetails.videoId
          );

          return {
            id: item.contentDetails.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.medium?.url,
            publishedAt: item.snippet.publishedAt,
            statistics: fullDetails?.statistics || {},
          };
        }),
        nextPageToken: data.nextPageToken || null,
      };
    } catch (error: any) {
      console.error("Error fetching playlist items:", error);
      throw error;
    }
  }
  private getVideoTranscript = async (videoId: string, sourceId: string) => {
    if (!videoId) throw new Error("Video ID is required");

    try {
      // Check if transcript exists in the database - using the video_id column
      const { data: existingTranscripts, error } = await supabase
        .from("content_transcriptions")
        .select("transcript")
        .eq("video_id", videoId);

      // If we have a transcript, return it
      if (existingTranscripts && existingTranscripts.length > 0) {
        console.log("Found existing transcript for video:", videoId);
        return existingTranscripts[0].transcript;
      }

      // We need to get a valid source_id from the content_sources table
      // First, let's try to find the YouTube source
      const { data: sourcesData, error: sourcesError } = await supabase
        .from("content_sources")
        .select("id")
        .eq("type", "youtube")
        .limit(1);

      if (sourcesError || !sourcesData || sourcesData.length === 0) {
        console.error(
          "Could not find a valid YouTube source ID:",
          sourcesError
        );
        throw new Error("No valid source ID found for YouTube content");
      }

      console.log("Using source ID:", sourceId);

      // Fetch transcript from Apify
      const response = await fetch(
        `https://api.apify.com/v2/acts/CTQcdDtqW5dvELvur/runs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apifyKey}`,
          },
          body: JSON.stringify({
            startUrls: [`https://www.youtube.com/watch?v=${videoId}`],
          }),
        }
      );

      const runData = await response.json();
      const runId = runData.data.id;

      // Poll for results until we get them
      while (true) {
        const statusResponse = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}?token=${this.apifyKey}`
        );
        const statusData = await statusResponse.json();

        if (statusData.data.status === "SUCCEEDED") {
          const datasetResponse = await fetch(
            `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${this.apifyKey}`
          );
          const items = await datasetResponse.json();
          const rawTranscript = items[0]?.transcript || null;

          if (rawTranscript) {
            console.log("Transcript found....");

            console.log("Calling Gemini for HTML formatted transcript...");
            // Get HTML formatted content from Gemini
            const htmlTranscript =
              await geminiService.videoTranscriptionStructured(rawTranscript);
            console.log("Finished Gemini HTML formatting...");

            if (!htmlTranscript) {
              console.warn("No transcript available for this video.");
              toast.error("No captions available.");
              return;
            }

            // Create JSON object with both raw and HTML transcript
            const transcriptJSON = {
              raw: rawTranscript,
              html: htmlTranscript,
            };

            try {
              // Generate UUID for content_id
              const contentUuid = crypto.randomUUID();

              // Save to database
              console.log("Saving Transcript JSON in DB....... ");
              const { data, error: insertError } = await supabase
                .from("content_transcriptions")
                .insert([
                  {
                    content_id: contentUuid, // UUID for content_id

                    source_id: sourceId, // Source ID for YouTube
                    updated_at: new Date().toISOString(),

                    video_id: videoId, // YouTube video ID
                    transcript: transcriptJSON, // JSON with both raw and HTML
                  },
                ]);

              if (insertError) {
                console.error("Error saving transcript to DB:", insertError);
              } else {
                console.log("Transcript saved successfully");
              }
            } catch (dbError) {
              console.error("Database operation failed:", dbError);
            }

            return transcriptJSON; // Return the complete JSON with both formats
          }
        }

        if (statusData.data.status === "FAILED") {
          throw new Error("Apify task failed");
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Error fetching transcript:", error);
      return null;
    }
  };

  private parseTranscript(srtTranscript: string) {
    const segments = srtTranscript.split("\n\n");
    const parsedSegments = segments.map((segment) => {
      const [index, timing, ...textLines] = segment.split("\n");
      const [start, end] = timing.split(" --> ").map(this.parseTimestamp);
      return {
        index: parseInt(index),
        start,
        end,
        text: textLines.join(" ").trim(),
      };
    });

    return {
      segments: parsedSegments,
      fullText: parsedSegments.map((s) => s.text).join("\n"),
      metadata: {
        totalSegments: parsedSegments.length,
        duration: parsedSegments[parsedSegments.length - 1]?.end || 0,
      },
    };
  }

  private parseTimestamp(timestamp: string) {
    const [hours, minutes, seconds] = timestamp.split(":");
    const [secs, ms] = seconds.split(",");
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(secs) +
      parseInt(ms) / 1000
    );
  }
}
