import { supabase } from "./supabase";
import { YouTubeService } from "./youtube";
import { GeminiService } from "./gemini";

const youtubeService = new YouTubeService();
const geminiService = new GeminiService();

export class ContentService {
  private cachedContent: Map<string, any> = new Map();

  async extractContent(
    sourceId: string,
    contentType: "video" | "playlist",
    contentId: string
  ) {
    if (!sourceId || !contentId) {
      throw new Error("Source ID and content ID are required");
    }

    try {
      // Check cache first
      const cacheKey = `${sourceId}:${contentId}`;
      if (this.cachedContent.has(cacheKey)) {
        return this.cachedContent.get(cacheKey);
      }

      let metadata;
      let transcript = null;
      let tokensUsed = 0;

      if (contentType === "video") {
        // Get video details including transcript
        const videoDetails = await youtubeService.getVideoDetails(
          contentId,
          sourceId
        );
        metadata = videoDetails;
        transcript = videoDetails.transcript;

        // // Token implementation start from here

        // Calculate token usage based on video duration - 10 tokens per minute
        // First convert duration to minutes (rounded up)
        const durationInMinutes = Math.ceil(videoDetails.duration / 60);
        tokensUsed = durationInMinutes * 10;

        // Get user ID from the source
        const { data: sourceData } = await supabase
          .from("content_sources")
          .select("user_id")
          .eq("id", sourceId)
          .single();

        if (!sourceData) {
          throw new Error("Source not found");
        }

        // Check if user has enough tokens left - direct query
        const { data: userTokens } = await supabase
          .from("content_tokens")
          .select("tokens_used")
          .eq("user_id", sourceData.user_id);

        const totalUsedTokens =
          userTokens?.reduce((sum, record) => sum + record.tokens_used, 0) || 0;
        const tokensRemaining = 1000 - totalUsedTokens;

        // if (tokensRemaining < tokensUsed) {
        //   throw new Error("OUT_OF_TOKENS");
        // }

        // Record token usage
        // const { error } = await supabase.from("processing_history").insert({
        //   source_id: sourceId,
        //   action: "generation",
        //   status: "success",
        //   details: `Started generating content for formats: ${formats.join(", ")}`,
        //   metadata: { formats, options },
        // });

        // // Check if there was an error
        // if (error) {
        //   console.error("Error inserting into processing_history:", error.message);
        // } else {
        //   console.log("Insertion successful!");
        // }

        const { error: InsertToken } = await supabase
          .from("content_tokens")
          .insert({
            user_id: sourceData.user_id,
            source_id: sourceId,
            tokens_used: tokensUsed,
            action: "generation",
          });

        // // Check if there was an error
        if (InsertToken) {
          console.error("Error inserting tokens", InsertToken.message);
        } else {
          console.log("Insertion of token successful!");
        }

        // // Token implementation end  here

        // Add processing history for analysis
        const { error: proccError } = await supabase
          .from("processing_history")
          .insert({
            source_id: sourceId,
            action: "analysis",
            status: "success",
            details: "Analyzed video content and metadata",
            metadata: { contentType, contentId },
          });

        // // Check if there was an error
        if (proccError) {
          console.error("Error inserting tokens", proccError.message);
        } else {
          console.log("Insertion of token successful!");
        }

        // Update source metadata with transcript
        await supabase
          .from("content_sources")
          .update({
            metadata: {
              ...videoDetails,
              transcript,
            },
          })
          .eq("id", sourceId);
      } else {
        const playlistDetails = await youtubeService.getPlaylistItems(
          contentId
        );
        metadata = playlistDetails;

        await supabase.from("processing_history").insert({
          source_id: sourceId,
          action: "analysis",
          status: "success",
          details: "Analyzed playlist content and metadata",
          metadata: { contentType, contentId },
        });
      }

      // Save extraction to database
      const { data, error } = await supabase
        .from("content_extractions")
        .insert([
          {
            source_id: sourceId,
            content_type: contentType,
            content_id: contentId,
            metadata,
            transcript,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Cache the result
      this.cachedContent.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Content extraction error:", error);

      await supabase.from("processing_history").insert({
        source_id: sourceId,
        action: "analysis",
        status: "error",
        details: "Failed to extract content",
        metadata: { error: error.message },
      });

      throw new Error("Failed to extract content. Please try again.");
    }
  }

  async generateContent(
    sourceId: string,
    formats: string[],
    options: Record<string, any>
  ) {
    if (!sourceId || !formats.length) {
      throw new Error("Source ID and formats are required");
    }

    let finalSource;

    try {
      const { data: source } = await supabase
        .from("content_sources")
        .select("*")
        .eq("id", sourceId)
        .single();

      if (source) {
        const { data: transcript } = await supabase
          .from("content_transcriptions")
          .select("transcript") // Select only the transcript field
          .eq("source_id", source.id)
          .single();
        finalSource = transcript?.transcript || null; // Store only the transcript value
      } else {
        console.error("No source found");
        return;
      }

      const results: Record<string, any> = {};
      const cacheKey = `generated:${sourceId}:${formats.join(",")}`;

      // Check cache first
      if (this.cachedContent.has(cacheKey)) {
        return this.cachedContent.get(cacheKey);
      }

      // Add generation start to history
      const { error: genHistory } = await supabase
        .from("processing_history")
        .insert({
          source_id: sourceId,
          action: "generation",
          status: "success",
          details: `Started generating content for formats: ${formats.join(
            ", "
          )}`,
          metadata: { formats, options },
        });

      if (genHistory) {
        console.log("Gnerating processing history error");
      }

      // Track token usage
      let tokensUsed = 0;

      // Generate content for each format
      for (const format of formats) {
        let content;

        switch (format) {
          case "blog":
            if (!source) {
              console.error("❌ Source data is missing!");
              return;
            }

            content = await geminiService.generateContent(
              "Create a comprehensive blog post that captures the key points and adds value through additional context.",
              {
                transcript: finalSource, // Pass only the transcript
                options: options[format],
              }
            );
            console.log("1- switch statement blog-->", content);
            tokensUsed += content.length / 4; // Approximate token count
            break;

          case "social":
            const socialPosts = await geminiService.generateSocialPosts(
              source.metadata?.description || "",
              options[format]?.platforms || ["twitter", "linkedin"]
            );
            content = socialPosts;
            console.log("2- switch statement social posts-->", content);
            tokensUsed += JSON.stringify(socialPosts).length / 4;
            break;

          case "newsletter":
            content = await geminiService.generateNewsletter(
              source.metadata?.description || "",
              source
            );
            console.log("3- switch statement news letter-->", content);
            tokensUsed += content.length / 4;
            break;
        }

        if (content) {
          results[format] = content;
        }
      }

      ///check user haave enough token
      // Check if user has enough tokens left - direct query
      const { data: userTokens } = await supabase
        .from("content_tokens")
        .select("tokens_used")
        .eq("user_id", source.user_id);

      const totalUsedTokens =
        userTokens?.reduce((sum, record) => sum + record.tokens_used, 0) || 0;
      const tokensRemaining = 1000 - totalUsedTokens;

      // if (tokensRemaining < tokensUsed) {
      //   throw new Error("OUT_OF_TOKENS");
      // }

      // Save generated content
      const { data: savedContent, error } = await supabase
        .from("generated_content")
        .insert([
          {
            source_id: sourceId,
            content: results,
            metadata: {
              formats,
              options,
              tokensUsed,
              generatedAt: new Date().toISOString(),
            },
          },
        ])
        .select()
        .single();

      // // Check if there was an error
      if (error) {
        console.error("Error saving generated content", error.message);
      } else {
        console.log("Insertion of generated content successful!");
      }

      // Update token usage
      await supabase.from("content_tokens").insert({
        user_id: source.user_id,
        source_id: sourceId,
        tokens_used: tokensUsed,
        action: "generation",
      });

      // Cache the result
      this.cachedContent.set(cacheKey, savedContent);

      // Add completion to history
      const { error: compHistory } = await supabase
        .from("processing_history")
        .insert({
          source_id: sourceId,
          action: "generation",
          status: "success",
          details: `Successfully generated content for formats: ${formats.join(
            ", "
          )}`,
          metadata: { formats, contentId: savedContent.id, tokensUsed },
        });

      // // Check if there was an error
      if (compHistory) {
        console.error("complete processing history", compHistory.message);
      } else {
        console.log("complete processing history successful!");
      }

      /// i wan to get the transcriptionusing ource_id and apss to resposne so i can sue it
      const { data: transcript, error: TranscriptError } = await supabase
        .from("content_transcriptions")
        .select("transcript->html") // Fetch only the "html" field from the "transcript" JSON object
        .eq("source_id", sourceId)
        .maybeSingle(); // Prevent errors if no row is found

      if (TranscriptError) {
        console.error("Error fetching transcript:", TranscriptError);
        return { error: "Failed to fetch transcript" };
      }

      // Extract the HTML content
      const htmlContent = transcript?.html || null;

      // Include the transcript in the response
      return { savedContent, html: htmlContent };
    } catch (error) {
      console.error("Content generation error:", error);

      await supabase.from("processing_history").insert({
        source_id: sourceId,
        action: "generation",
        status: "error",
        details: "Failed to generate content",
        metadata: { error: error.message },
      });

      throw new Error("Failed to generate content. Please try again.");
    }
  }

  clearCache() {
    this.cachedContent.clear();
  }
}
