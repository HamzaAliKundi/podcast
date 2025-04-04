import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  Loader2,
  FileText,
  Youtube,
  Calendar,
  Eye,
  ThumbsUp,
  MessageCircle,
  Send,
  Settings,
  BookOpen,
  Share2,
  Mail,
  PlayCircle,
  ListVideo,
  ChevronLeft,
} from "lucide-react";
import { useStore } from "../store/useStore";
import toast from "react-hot-toast";
import { ContentService } from "../services/content";
import { YouTubeService } from "../services/youtube";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, isValid } from "date-fns";

const contentService = new ContentService();
const youtubeService = new YouTubeService();

interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return "Invalid date";
  }
};

export function ContentProcessor() {
  const {
    selectedSource,
    selectedContent,
    selectContent,
    updateSourceStatus,
    startProcessing,
    endProcessing,
    getProcessingStatus,
  } = useStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playlistVideos, setPlaylistVideos] = useState<any[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [channelVideos, setChannelVideos] = useState<any[]>([]);

  const processingStatus = selectedSource
    ? getProcessingStatus(selectedSource.id)
    : "idle";

  useEffect(() => {
    if (selectedSource?.metadata?.channelId) {
      loadChannelVideos(selectedSource.metadata.channelId);
    }
  }, [selectedSource]);

  useEffect(() => {
    if (selectedContent.type === "playlist" && selectedContent.item?.id) {
      loadPlaylistVideos(selectedContent.item.id);
    }
  }, [selectedContent]);

  const loadChannelVideos = async (channelId: string) => {
    setIsLoadingVideos(true);
    try {
      const channelDetails = await youtubeService.getChannelDetails(channelId);
      setChannelVideos(channelDetails.recentVideos || []);
    } catch (error) {
      console.error("Error loading channel videos:", error);
      toast.error("Failed to load channel videos");
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const loadPlaylistVideos = async (playlistId: string) => {
    setIsLoadingVideos(true);
    try {
      const videos = await youtubeService.getPlaylistItems(playlistId);
      setPlaylistVideos(videos);
    } catch (error) {
      console.error("Error loading playlist videos:", error);
      toast.error("Failed to load playlist videos");
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleContentTypeSelect = (type: "video" | "playlist") => {
    selectContent(type, null);
    setPlaylistVideos([]);
  };

  const handleItemSelect = async (item: ContentItem) => {
    if (!item?.id) {
      toast.error("Invalid video selection");
      return;
    }

    setIsLoadingVideo(true);
    try {
      if (selectedContent.type === "playlist") {
        selectContent("playlist", item);
      } else {
        // When selecting a video, get its details

        const videoDetails = await youtubeService.getVideoDetails(
          item.id,
          //@ts-ignore
          selectedSource.id
        );
        if (!videoDetails) {
          throw new Error("Failed to load video details");
        }
        selectContent("video", videoDetails);
        toast.success("Video selected");
      }
    } catch (error: any) {
      console.error("Error loading item details:", error);
      toast.error(error.message || "Failed to load video details");
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleVideoSelect = async (video: any) => {
    if (!video?.id) {
      toast.error("Invalid video selection");
      return;
    }

    setIsLoadingVideo(true);
    try {
      //@ts-ignore
      const videoDetails = await youtubeService.getVideoDetails(
        video.id,
        //@ts-ignore
        selectedSource.id
      );
      if (!videoDetails) {
        throw new Error("Failed to load video details");
      }
      selectContent("video", videoDetails);
      toast.success("Video selected");
    } catch (error: any) {
      console.error("Error loading video details:", error);
      toast.error(error.message || "Failed to load video details");
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedSource || !selectedContent.type || !selectedContent.item) {
      toast.error("Please select content to process");
      return;
    }

    const canStart = await startProcessing(selectedSource.id);
    if (!canStart) return;

    setIsProcessing(true);

    try {
      // Update source status
      await updateSourceStatus(selectedSource.id, "processing");

      // Step 1: Content Analysis
      setCurrentStep(0);
      setProgress(0);
      const analyzeToast = toast.loading("Analyzing content...", {
        id: "analyze",
      });

      // Try extracting content
      const extraction = await contentService.extractContent(
        selectedSource.id,
        selectedContent.type,
        selectedContent.item.id
      );

      for (let p = 0; p <= 100; p += 20) {
        setProgress(p);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      toast.success("Content analyzed", { id: analyzeToast });

      // Step 2: Content Generation -----> Here are some errors
      setCurrentStep(1);
      setProgress(0);
      const generateToast = toast.loading("Generating content...", {
        id: "generate",
      });

      const generatedContent = await contentService.generateContent(
        selectedSource.id,
        ["blog", "social", "newsletter"],
        {}
      );

      for (let p = 0; p <= 100; p += 20) {
        setProgress(p);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      toast.dismiss();
      toast.success("Content generated successfully", { id: generateToast });

      // Update source status
      await updateSourceStatus(selectedSource.id, "completed");
    } catch (error) {
      console.error("Processing error:", error);
      toast.dismiss();
      toast.error("Failed to process content");
      await updateSourceStatus(selectedSource.id, "error");
    } finally {
      setIsProcessing(false);
      endProcessing(selectedSource.id);
    }
  };

  if (!selectedSource) return null;

  const renderContentList = () => {
    if (isLoadingVideo) {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading video details...</p>
        </div>
      );
    }

    if (selectedContent.type === "playlist" && selectedContent.item) {
      // Show playlist videos
      return (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => selectContent("playlist", null)}
              className="flex items-center text-slate-600 hover:text-slate-900"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Playlists
            </button>
            <h4 className="text-sm font-medium text-slate-900">
              {selectedContent.item.title}
            </h4>
          </div>

          {isLoadingVideos ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                Loading playlist videos...
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {playlistVideos.map((video: any) => (
                <button
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className="w-full flex items-start space-x-4 p-4 rounded-lg border-2 border-slate-200 hover:border-primary/50 transition-all"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-medium text-slate-900 line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-slate-500">
                        {formatDate(video.publishedAt)}
                      </span>
                      {video.statistics?.viewCount && (
                        <span className="text-xs text-slate-500">
                          {parseInt(
                            video.statistics.viewCount
                          ).toLocaleString()}{" "}
                          views
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Show videos or playlists
    const videos =
      selectedContent.type === "video"
        ? channelVideos
        : selectedSource.metadata?.playlists;

    if (isLoadingVideos) {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading videos...</p>
        </div>
      );
    }

    if (!videos?.length) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            {selectedContent.type === "video"
              ? "No videos found. Please try refreshing the page."
              : "No playlists found."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {videos.map((video: ContentItem) => (
          <button
            key={video.id}
            onClick={() => handleItemSelect(video)}
            className={`w-full flex items-start space-x-4 p-4 rounded-lg border-2 transition-all ${
              selectedContent.item?.id === video.id
                ? "border-primary bg-primary/5"
                : "border-slate-200 hover:border-primary/50"
            }`}
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-24 h-16 object-cover rounded-lg"
            />
            <div className="flex-1 text-left">
              <h3 className="text-sm font-medium text-slate-900 line-clamp-2">
                {video.title}
              </h3>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-slate-500">
                  {formatDate(video.publishedAt)}
                </span>
                {video.statistics?.viewCount && (
                  <span className="text-xs text-slate-500">
                    {parseInt(video.statistics.viewCount).toLocaleString()}{" "}
                    views
                  </span>
                )}
              </div>
            </div>
            <CheckCircle
              className={`h-5 w-5 ${
                selectedContent.item?.id === video.id
                  ? "text-primary"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderContentSelection = () => (
    <div className="space-y-6">
      {/* Content Type Selection */}
      <div>
        <h4 className="text-sm font-medium text-slate-900 mb-4">
          Select Content Type
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleContentTypeSelect("video")}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedContent.type === "video"
                ? "border-primary bg-primary/5"
                : "border-slate-200 hover:border-primary/50"
            }`}
          >
            <PlayCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="text-sm font-medium text-slate-900">Single Video</h3>
            <p className="text-xs text-slate-500">Process a specific video</p>
          </button>

          <button
            onClick={() => handleContentTypeSelect("playlist")}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedContent.type === "playlist"
                ? "border-primary bg-primary/5"
                : "border-slate-200 hover:border-primary/50"
            }`}
          >
            <ListVideo className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="text-sm font-medium text-slate-900">Playlist</h3>
            <p className="text-xs text-slate-500">Process multiple videos</p>
          </button>
        </div>
      </div>

      {/* Content List */}
      {selectedContent.type && (
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-4">
            {selectedContent.type === "video"
              ? "Select a Video"
              : selectedContent.item
              ? "Select a Video from Playlist"
              : "Select a Playlist"}
          </h4>
          {renderContentList()}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Content Processing
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Select content to process and transform
            </p>
          </div>
          <div>
            {isProcessing ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing
              </span>
            ) : (
              <button
                onClick={handleStartProcessing}
                disabled={!selectedContent.item}
                className="btn-primary"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Processing
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Content Selection */}
        {renderContentSelection()}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="mt-8 space-y-4">
            {[
              {
                id: "analyze",
                title: "Content Analysis",
                description: "Analyzing content structure and metadata",
                icon: <Sparkles className="h-5 w-5" />,
              },
              {
                id: "extract",
                title: "Content Extraction",
                description: "Extracting key information and insights",
                icon: <Settings className="h-5 w-5" />,
              },
            ].map((step, index) => (
              <div
                key={step.id}
                className={`relative ${
                  index === currentStep ? "animate-pulse-slow" : ""
                }`}
              >
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      index === currentStep
                        ? "bg-primary text-white"
                        : index < currentStep
                        ? "bg-success text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-900">
                        {step.title}
                      </h3>
                      {index === currentStep && (
                        <span className="text-sm text-primary">
                          {progress}%
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {step.description}
                    </p>

                    {index === currentStep && (
                      <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
