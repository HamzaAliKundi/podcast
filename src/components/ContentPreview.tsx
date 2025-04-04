import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Share2,
  MessageSquare,
  FileText,
  Clock,
  Eye,
  ThumbsUp,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { YouTubeService } from "../services/youtube";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const youtubeService = new YouTubeService();

interface ContentPreviewProps {
  onClose?: () => void;
}

export function ContentPreview({ onClose }: ContentPreviewProps) {
  const { selectedSource, selectedContent } = useStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [transcript, setTranscript] = useState<any>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [videoDetails, setVideoDetails] = useState<any>(null);

  useEffect(() => {
    if (selectedContent?.type === "video" && selectedContent?.item?.id) {
      loadVideoDetails(selectedContent.item.id);
    }
  }, [selectedContent]);

  const loadVideoDetails = async (videoId: string) => {
    try {
      const details = await youtubeService.getVideoDetails(videoId);
      setVideoDetails(details);
      if (details.transcript) {
        setTranscript(details.transcript);
      }
    } catch (error) {
      console.error("Error loading video details:", error);
      toast.error("Failed to load video details");
    }
  };

  const handleDownloadTranscript = () => {
    if (transcript) {
      // Check if transcript is in JSON format with raw property
      const textToDownload =
        typeof transcript === "object" && transcript.raw
          ? transcript.raw
          : typeof transcript === "string"
          ? transcript.replace(/<[^>]*>/g, "") // fallback to remove HTML tags if string
          : JSON.stringify(transcript); // last resort

      const blob = new Blob([textToDownload], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcript-${selectedContent?.item?.id || "video"}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Downloading transcript");
    }
  };

  const handleCopyTranscript = () => {
    if (transcript) {
      // Check if transcript is in JSON format with raw property
      const textToCopy =
        typeof transcript === "object" && transcript.raw
          ? transcript.raw
          : typeof transcript === "string"
          ? transcript.replace(/<[^>]*>/g, "") // fallback to remove HTML tags if string
          : JSON.stringify(transcript); // last resort

      navigator.clipboard.writeText(textToCopy);
      toast.success("Transcript copied to clipboard");
    }
  };

  if (!selectedSource || !selectedContent?.item) return null;

  const { item } = selectedContent;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Video Player Section */}
      <div className="aspect-video bg-slate-900 relative">
        {selectedContent.type === "video" && (
          <iframe
            src={`https://www.youtube.com/embed/${item.id}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {/* Content Info */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-slate-600">
          {item.statistics && (
            <>
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {parseInt(
                  item.statistics.viewCount || "0"
                ).toLocaleString()}{" "}
                views
              </span>
              <span className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-1" />
                {parseInt(item.statistics.likeCount || "0").toLocaleString()}
              </span>
              <span className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                {parseInt(
                  item.statistics.commentCount || "0"
                ).toLocaleString()}{" "}
                comments
              </span>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-slate-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "transcript"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Transcript
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-2">
                  Description
                </h3>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {videoDetails && (
                <>
                  {videoDetails.tags?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-900 mb-2">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {videoDetails.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-slate-900 mb-2">
                      Channel Information
                    </h3>
                    <div className="flex items-center space-x-4">
                      {videoDetails.channelThumbnail && (
                        <img
                          src={videoDetails.channelThumbnail}
                          alt={videoDetails.channelTitle}
                          className="w-12 h-12 rounded-full"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {videoDetails.channelTitle}
                        </h4>
                        {videoDetails.statistics?.channelSubscriberCount && (
                          <p className="text-sm text-slate-500">
                            {parseInt(
                              videoDetails.statistics.channelSubscriberCount
                            ).toLocaleString()}{" "}
                            subscribers
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "transcript" && (
            <div className="space-y-6">
              {transcript ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-900">
                      Video Transcript
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCopyTranscript}
                        className="btn-secondary py-1"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </button>
                      <button
                        onClick={handleDownloadTranscript}
                        className="btn-secondary py-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Render HTML transcript using dangerouslySetInnerHTML */}
                  <div
                    className="transcript-container max-h-[600px] overflow-y-auto p-4 bg-slate-50 rounded-lg"
                    dangerouslySetInnerHTML={{
                      __html:
                        typeof transcript === "object" && transcript.html
                          ? transcript.html
                          : typeof transcript === "string"
                          ? transcript
                          : "Transcript format not supported",
                    }}
                  />

                  {/* CSS for transcript rendering */}
                  {/* @ts-ignore */}
                  <style jsx>{`
                    .transcript-container h1 {
                      font-size: 1.5rem;
                      font-weight: 700;
                      margin-bottom: 1rem;
                      color: #1e293b;
                    }
                    .transcript-container h2 {
                      font-size: 1.25rem;
                      font-weight: 600;
                      margin-top: 1.5rem;
                      margin-bottom: 0.75rem;
                      color: #334155;
                    }
                    .transcript-container h3 {
                      font-size: 1rem;
                      font-weight: 600;
                      margin-top: 1rem;
                      margin-bottom: 0.5rem;
                      color: #475569;
                    }
                    .transcript-container p {
                      margin-bottom: 0.75rem;
                      line-height: 1.6;
                    }
                    .transcript-container ul {
                      margin-left: 1.5rem;
                      margin-bottom: 1rem;
                      list-style-type: disc;
                    }
                    .transcript-container li {
                      margin-bottom: 0.5rem;
                    }
                    .transcript-container .timestamp {
                      color: #6366f1;
                      font-weight: 500;
                    }
                    .transcript-container .speaker {
                      font-weight: 600;
                      color: #0f172a;
                    }
                    .transcript-container .highlight {
                      background-color: #fef9c3;
                      padding: 0.125rem 0.25rem;
                      border-radius: 0.25rem;
                    }
                  `}</style>
                </>
              ) : isLoadingTranscript ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-slate-500">Loading transcript...</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No Transcript Available
                  </h3>
                  <p className="text-slate-500">
                    This video doesn't have a transcript or it hasn't been
                    processed yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
