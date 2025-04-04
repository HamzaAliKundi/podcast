import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Copy,
  Download,
  Share2,
  Edit,
  Sparkles,
  Send,
  Maximize2,
  Minimize2,
  FileText,
  Mail,
  Loader2,
  ArrowRight,
  X,
  ChevronLeft,
  PlayCircle,
  Subtitles,
  Info,
} from "lucide-react";
import { useStore } from "../store/useStore";
import toast from "react-hot-toast";
import { GeminiService } from "../services/gemini";
import { ContentService } from "../services/content";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "../hooks/useDebounce";
import { supabase } from "../services/supabase";

const gemini = new GeminiService();
const contentService = new ContentService();

interface ContentResultsProps {
  isFullscreen?: boolean;
  onClose?: () => void;
}

export function ContentResults({ isFullscreen, onClose }: ContentResultsProps) {
  const { selectedSource } = useStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
    }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    blog?: string;
    social?: { platform: string; content: string }[];
    newsletter?: string;
  }>({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [transcriptionData, setTranscriptionData] = useState<any>(null);

  // Debounce chat input to prevent excessive API calls
  const debouncedChatInput = useDebounce(chatInput, 500);

  useEffect(() => {
    if (selectedSource?.status === "completed") {
      loadGeneratedContent();
      loadTranscriptionData();
    }
  }, [selectedSource]);

  const loadTranscriptionData = async () => {
    if (!selectedSource?.metadata?.transcript) return;
    setTranscriptionData(selectedSource.metadata.transcript);
  };

  const loadGeneratedContent = async () => {
    if (!selectedSource) return;

    try {
      const { data, error } = await supabase
        .from("generated_content")
        .select("*")
        .eq("source_id", selectedSource.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data?.content) {
        setGeneratedContent(data.content);
        setActiveTab("overview");
      }
    } catch (error) {
      console.error("Error loading content:", error);
    }
  };

  let transcript: any;

  const generateContent = async () => {
    if (!selectedSource) {
      toast.error("No source selected");
      return;
    }

    setIsGenerating(true);
    try {
      // Only generate what's needed based on active tab
      let formats: string[] = [];

      if (activeTab === "overview") {
        formats = ["blog", "social", "newsletter"];
      } else {
        formats = [activeTab];
      }

      // Check if content already exists
      const existingContent = generatedContent[activeTab];
      if (existingContent) {
        toast.success("Content already generated");
        return;
      }

      const result = await contentService.generateContent(
        selectedSource.id,
        formats,
        {}
      );

      if (result?.content) {
        setGeneratedContent((prevContent) => ({
          ...prevContent,
          ...result.content,
        }));
        toast.success("Content generated successfully!");
        transcript = result?.html;
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  };

  const handleDownload = (format: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${
      selectedSource?.metadata?.title || "content"
    }-${format}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloading ${format} content`);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debouncedChatInput.trim()) return;

    const userMessage = debouncedChatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setIsChatLoading(true);

    try {
      const response = await gemini.generateContent(userMessage, {
        source: selectedSource,
        context: "content optimization",
      });

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      toast.error("Failed to get AI response");
    } finally {
      setIsChatLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "blog", label: "Blog Post", icon: FileText },
    { id: "social", label: "Social Media", icon: Share2 },
    { id: "newsletter", label: "Newsletter", icon: Mail },
    { id: "transcription", label: "Transcription", icon: Subtitles },
    { id: "chat", label: "AI Assistant", icon: MessageSquare },
  ];

  if (!selectedSource?.status === "completed") {
    return null;
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start space-x-4">
          <img
            src={selectedSource?.metadata?.thumbnail}
            alt={selectedSource?.metadata?.title}
            className="w-32 h-20 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {selectedSource?.metadata?.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {selectedSource?.metadata?.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-2xl font-semibold text-slate-900">
              {parseInt(
                selectedSource?.metadata?.statistics?.viewCount || "0"
              ).toLocaleString()}
            </div>
            <div className="text-sm text-slate-500">Views</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-2xl font-semibold text-slate-900">
              {parseInt(
                selectedSource?.metadata?.statistics?.likeCount || "0"
              ).toLocaleString()}
            </div>
            <div className="text-sm text-slate-500">Likes</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-2xl font-semibold text-slate-900">
              {parseInt(
                selectedSource?.metadata?.statistics?.commentCount || "0"
              ).toLocaleString()}
            </div>
            <div className="text-sm text-slate-500">Comments</div>
          </div>
        </div>
      </div>

      {generatedContent.blog && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">
            Generated Content Preview
          </h4>
          <div className="prose prose-slate max-w-none">
            {generatedContent.blog
              .split("\n")
              .slice(0, 3)
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>
          <button
            onClick={() => setActiveTab("blog")}
            className="mt-4 text-primary hover:text-primary-dark flex items-center"
          >
            Read more <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );

  const renderTranscriptionTab = () => (
    <div className="space-y-6">
      {transcriptionData ? (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">
            Video Transcription
          </h4>
          <div className="prose prose-slate max-w-none">
            {transcript && (
              <>
                <div
                  className="transcript-container max-h-[600px] overflow-y-auto p-4 bg-slate-50 rounded-lg"
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof transcript === "object" && transcript
                        ? transcript.html
                        : typeof transcript === "string"
                        ? transcript
                        : "Transcript format not supported",
                  }}
                />
                {/* @ts-ignore */}
                <style jsx="true">{`
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
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Subtitles className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-900 mb-2">
            No Transcription Available
          </h4>
          <p className="text-slate-500">
            This video doesn't have a transcription or it hasn't been processed
            yet.
          </p>
        </div>
      )}
    </div>
  );

  const contentWrapper = (
    <div
      className={`bg-white rounded-lg shadow-sm transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 overflow-hidden flex flex-col" : ""
      }`}
    >
      <div className="border-b border-slate-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100"
            >
              <ChevronLeft
                className={`h-5 w-5 transform transition-transform ${
                  showSidebar ? "" : "rotate-180"
                }`}
              />
            </button>
            <h3 className="text-lg font-semibold text-slate-900">
              Content Preview
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {!generatedContent.blog && activeTab !== "transcription" && (
              <button
                onClick={generateContent}
                disabled={isGenerating}
                className="btn-primary"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Content
                  </>
                )}
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <tab.icon className="h-4 w-4 inline-block mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${isFullscreen ? "flex-1 overflow-y-auto" : ""} p-6`}>
        {/* Overview Tab */}
        {activeTab === "overview" && renderOverviewTab()}

        {/* Blog Post Content */}
        {activeTab === "blog" && (
          <div className="space-y-6">
            {generatedContent.blog ? (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold text-slate-900">
                    {selectedSource.metadata?.title}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCopy(generatedContent.blog!)}
                      className="p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100"
                      title="Copy"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        handleDownload("blog", generatedContent.blog!)
                      }
                      className="p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  {generatedContent.blog.split("\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-900 mb-2">
                  No Blog Post Generated
                </h4>
                <p className="text-slate-500 mb-4">
                  Click generate to create a blog post from your content.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Social Media Content */}
        {activeTab === "social" && (
          <div className="space-y-6">
            {generatedContent.social ? (
              generatedContent.social.map((post, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-slate-900">
                      {post.platform} Post
                    </h5>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCopy(post.content)}
                        className="p-1 text-slate-400 hover:text-slate-500"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600">{post.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Share2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-900 mb-2">
                  No Social Posts Generated
                </h4>
                <p className="text-slate-500 mb-4">
                  Generate content to create optimized social media posts.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Newsletter Content */}
        {activeTab === "newsletter" && (
          <div className="space-y-6">
            {generatedContent.newsletter ? (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold text-slate-900">
                    Newsletter Version
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCopy(generatedContent.newsletter)}
                      className="p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(
                          "newsletter",
                          generatedContent.newsletter
                        )
                      }
                      className="p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none">
                  {generatedContent.newsletter
                    .split("\n")
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-900 mb-2">
                  No Newsletter Generated
                </h4>
                <p className="text-slate-500 mb-4">
                  Generate content to create an email-friendly newsletter
                  version.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transcription Tab */}
        {activeTab === "transcription" && renderTranscriptionTab()}

        {/* AI Chat Interface */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your content..."
                className="flex-1 rounded-lg border-slate-200 focus:border-primary focus:ring-primary"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="z-50"
        >
          {contentWrapper}
        </motion.div>
      </AnimatePresence>
    );
  }

  return contentWrapper;
}

export default ContentResults;
