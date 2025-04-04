import React, { useState, useCallback, useEffect } from "react";
import {
  X,
  Upload,
  ArrowRight,
  Check,
  Youtube,
  Rss,
  Link,
  Settings,
  FileText,
  ExternalLink,
  Search,
  Loader2,
  Copy,
  BookOpen,
  PlayCircle,
  ListVideo,
  Users,
  Info,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useStore } from "../store/useStore";
import { TransformationOptions } from "../types";
import toast from "react-hot-toast";
import { YouTubeService } from "../services/youtube";
import { useDebounce } from "../hooks/useDebounce";

const youtubeService = new YouTubeService();

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: WizardStep[] = [
  {
    id: 1,
    title: "Select Content Source",
    description: "Choose where your content is coming from",
    icon: <Upload className="h-6 w-6 text-primary" />,
  },
  {
    id: 2,
    title: "Configure Source",
    description: "Set up your content source details",
    icon: <Settings className="h-6 w-6 text-primary" />,
  },
  {
    id: 3,
    title: "Review & Confirm",
    description: "Review and start content processing",
    icon: <Check className="h-6 w-6 text-primary" />,
  },
];

export function ContentWizard({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [channelSearch, setChannelSearch] = useState("");
  const [channelResults, setChannelResults] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [channelDetails, setChannelDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(channelSearch, 500);
  const { addSource } = useStore();

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchChannels();
    }
  }, [debouncedSearchTerm]);

  const searchChannels = async () => {
    if (!channelSearch.trim()) return;

    setIsLoading(true);
    setError(null);
    setChannelResults([]);

    try {
      const results = await youtubeService.searchChannels(channelSearch);
      setChannelResults(results);
    } catch (err) {
      setError("Unable to search channels. Please try again.");
      toast.error("Error searching channels");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceSelection = (type: string) => {
    setSelectedSource(type);
    setCurrentStep(2);
    setChannelSearch("");
    setChannelResults([]);
    setSelectedChannel(null);
    setChannelDetails(null);
    setError(null);
  };

  const handleChannelSelect = async (channel: any) => {
    setIsLoading(true);
    try {
      const details = await youtubeService.getChannelDetails(channel.id);
      setSelectedChannel(channel);
      setChannelDetails(details);
      setActiveTab("overview");
      toast.success("Channel selected successfully");
    } catch (error) {
      toast.error("Failed to fetch channel details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      if (currentStep === 1 && !selectedSource) {
        toast.error("Please select a content source");
        return;
      }
      if (currentStep === 2) {
        if (selectedSource === "youtube" && !selectedChannel) {
          toast.error("Please select a YouTube channel");
          return;
        }
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      if (selectedSource === "youtube" && selectedChannel) {
        const sourceData = {
          type: "youtube",
          status: "pending",
          metadata: {
            channelId: selectedChannel.id,
            title: selectedChannel.title,
            description: selectedChannel.description,
            thumbnails: selectedChannel.thumbnails,
            banner: channelDetails?.banner,
            statistics: {
              subscriberCount: channelDetails?.subscriberCount,
              videoCount: channelDetails?.videoCount,
              viewCount: channelDetails?.viewCount,
            },
            playlists: channelDetails?.playlists,
            keywords: channelDetails?.keywords,
          },
        };

        addSource(sourceData);
        toast.success("Content source added successfully");
        onClose();
      }
    } catch (error) {
      toast.error("Error adding content source");
      console.error("Error:", error);
    }
  };

  const renderChannelDetails = () => {
    if (!channelDetails) return null;

    const tabs = [
      { id: "overview", label: "Overview", icon: Info },
      { id: "videos", label: "Videos", icon: PlayCircle },
      { id: "playlists", label: "Playlists", icon: ListVideo },
      { id: "about", label: "About", icon: Users },
    ];

    return (
      <div className="space-y-6">
        {/* Channel Header */}
        <div className="relative">
          {channelDetails.banner && (
            <div className="w-full h-32 rounded-lg overflow-hidden">
              <img
                src={channelDetails.banner}
                alt="Channel Banner"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center space-x-4 mt-4">
            <img
              src={channelDetails.thumbnail}
              alt={channelDetails.title}
              className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
            />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {channelDetails.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <span>
                  {parseInt(channelDetails.subscriberCount).toLocaleString()}{" "}
                  subscribers
                </span>
                <span>
                  {parseInt(channelDetails.videoCount).toLocaleString()} videos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-1">
                    Description
                  </h4>
                  <p className="text-sm text-slate-600">
                    {channelDetails.description}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-1">
                    Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {parseInt(channelDetails.viewCount).toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-500">Total Views</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {new Date(
                          channelDetails.publishedAt
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-slate-500">Joined Date</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-1">
                    Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {channelDetails.keywords?.map(
                      (keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700"
                        >
                          {keyword}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-1">
                    Links
                  </h4>
                  <div className="space-y-2">
                    <a
                      href={`https://youtube.com/channel/${channelDetails.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-primary hover:text-primary-dark"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Channel
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "videos" && (
            <div className="text-center py-8">
              <PlayCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-900 mb-2">
                Videos will be loaded during content processing
              </h4>
              <p className="text-slate-500">
                Select this channel to start processing its videos
              </p>
            </div>
          )}

          {activeTab === "playlists" && (
            <div className="text-center py-8">
              <ListVideo className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-900 mb-2">
                Playlists will be loaded during content processing
              </h4>
              <p className="text-slate-500">
                Select this channel to start processing its playlists
              </p>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  About
                </h4>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {channelDetails.description}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Details
                </h4>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-slate-500">Location</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {channelDetails.country || "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Joined</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {new Date(
                        channelDetails.publishedAt
                      ).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Total Views</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {parseInt(channelDetails.viewCount).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Wizard Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl 
        transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Add Content Source
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${
                    step.id === currentStep
                      ? "bg-primary text-white"
                      : step.id < currentStep
                      ? "bg-success text-white"
                      : "bg-slate-200 text-slate-500"
                  }
                  transition-all duration-200
                `}
                >
                  {step.id < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-full h-1 mx-2 transition-colors duration-200 ${
                      step.id < currentStep ? "bg-success" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-medium text-slate-900">
              {STEPS[currentStep - 1].title}
            </h3>
            <p className="text-sm text-slate-500">
              {STEPS[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Step 1: Source Selection */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleSourceSelection("youtube")}
                  className={`group p-6 rounded-lg border-2 transition-all duration-200 ${
                    selectedSource === "youtube"
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-primary/50"
                  }`}
                >
                  <div className="relative">
                    <Youtube
                      className="h-12 w-12 text-red-500 mx-auto mb-2 
                      transition-transform duration-200 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                  </div>
                  <h3 className="font-medium text-center mb-1">YouTube</h3>
                  <p className="text-sm text-slate-600 text-center">
                    Import from channels or playlists
                  </p>
                </button>

                {/* <button
                  onClick={() => handleSourceSelection('blog')}
                  className={`group p-6 rounded-lg border-2 transition-all duration-200 ${
                    selectedSource === 'blog'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-primary/50'
                  }`}
                >
                  <div className="relative">
                    <BookOpen className="h-12 w-12 text-emerald-500 mx-auto mb-2 
                      transition-transform duration-200 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <h3 className="font-medium text-center mb-1">Blog Content</h3>
                  <p className="text-sm text-slate-600 text-center">
                    Import from URL or paste content
                  </p>
                </button> */}

                {/* <button
                  onClick={() => handleSourceSelection('rss')}
                  className={`group p-6 rounded-lg border-2 transition-all duration-200 ${
                    selectedSource === 'rss'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-primary/50'
                  }`}
                >
                  <div className="relative">
                    <Rss className="h-12 w-12 text-orange-500 mx-auto mb-2 
                      transition-transform duration-200 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <h3 className="font-medium text-center mb-1">RSS Feed</h3>
                  <p className="text-sm text-slate-600 text-center">
                    Connect RSS feeds for auto-import
                  </p>
                </button> */}

                {/* <div
                  className={`group p-6 rounded-lg border-2 border-dashed transition-all duration-200 ${
                    selectedSource === "file"
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-primary/50"
                  }`}
                >
                  <div className="relative">
                    <Upload
                      className="h-12 w-12 text-slate-400 mx-auto mb-2 
                      transition-transform duration-200 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-slate-400/20 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                  </div>
                  <h3 className="font-medium text-center mb-1">Upload Files</h3>
                  <p className="text-sm text-slate-600 text-center">
                    Drag & drop or click to upload
                  </p>
                </div> */}
              </div>
            )}

            {/* Step 2: Source Configuration */}
            {currentStep === 2 && selectedSource === "youtube" && (
              <div className="space-y-6">
                <div className="relative">
                  <div
                    className="flex items-center border-2 border-slate-200 rounded-lg 
                    focus-within:border-primary transition-colors duration-200"
                  >
                    <div className="pl-4">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={channelSearch}
                      onChange={(e) => setChannelSearch(e.target.value)}
                      placeholder="Search YouTube channels..."
                      className="flex-1 px-4 py-3 bg-transparent border-none focus:ring-0 
                        placeholder-slate-400 text-slate-900"
                    />
                    {isLoading && (
                      <div className="pr-4">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mt-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                      <p className="text-sm text-error flex items-center">
                        <X className="h-4 w-4 mr-2" />
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    {channelResults.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => handleChannelSelect(channel)}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                          selectedChannel?.id === channel.id
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={channel.thumbnail}
                            alt={channel.title}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1 text-left">
                            <h4 className="font-medium text-slate-900">
                              {channel.title}
                            </h4>
                            <p className="text-sm text-slate-500 line-clamp-2">
                              {channel.description}
                            </p>
                          </div>
                          {selectedChannel?.id === channel.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel Details Section */}
                {selectedChannel && renderChannelDetails()}
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-slate-900 mb-4">
                    Review Your Selection
                  </h4>

                  {selectedSource === "youtube" && selectedChannel && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={selectedChannel.thumbnail}
                          alt={selectedChannel.title}
                          className="w-16 h-16 rounded-full"
                        />
                        <div>
                          <h5 className="font-medium text-slate-900">
                            {selectedChannel.title}
                          </h5>
                          <p className="text-sm text-slate-500">
                            {selectedChannel.description}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <h6 className="text-sm font-medium text-slate-700 mb-2">
                          Channel Statistics
                        </h6>
                        <dl className="grid grid-cols-3 gap-4">
                          <div>
                            <dt className="text-sm text-slate-500">
                              Subscribers
                            </dt>
                            <dd className="text-sm font-medium text-slate-900">
                              {parseInt(
                                channelDetails?.subscriberCount
                              ).toLocaleString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-slate-500">Videos</dt>
                            <dd className="text-sm font-medium text-slate-900">
                              {parseInt(
                                channelDetails?.videoCount
                              ).toLocaleString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-slate-500">
                              Total Views
                            </dt>
                            <dd className="text-sm font-medium text-slate-900">
                              {parseInt(
                                channelDetails?.viewCount
                              ).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6">
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentStep === 1}
            >
              Back
            </button>

            <button
              onClick={
                currentStep === STEPS.length ? handleComplete : handleNext
              }
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  currentStep === STEPS.length
                    ? "bg-success hover:bg-success/90 text-white"
                    : "bg-primary hover:bg-primary/90 text-white"
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={
                (currentStep === 1 && !selectedSource) ||
                (currentStep === 2 &&
                  selectedSource === "youtube" &&
                  !selectedChannel)
              }
            >
              {currentStep === STEPS.length ? (
                <span className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Complete
                </span>
              ) : (
                <span className="flex items-center">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
