export interface ContentSource {
  id: string;
  type: 'youtube' | 'rss' | 'api' | 'file';
  url?: string;
  filePath?: string;
  metadata?: {
    title?: string;
    description?: string;
    duration?: number;
    fileType?: string;
    size?: number;
    channelId?: string;
    playlistIds?: string[];
    videoIds?: string[];
    thumbnails?: {
      default?: string;
      medium?: string;
      high?: string;
    };
    publishedAt?: string;
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    captions?: boolean;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
    categoryId?: string;
    tags?: string[];
    transcript?: string;
    subtitles?: {
      language: string;
      content: string;
    }[];
  };
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: Date;
  transformations?: TransformationConfig[];
  processingHistory?: ProcessingHistoryEntry[];
}

export interface ProcessingHistoryEntry {
  id: string;
  timestamp: Date;
  action: 'import' | 'transform' | 'export';
  status: 'success' | 'error';
  details: string;
  metadata?: Record<string, any>;
}

export interface ContentOutput {
  id: string;
  sourceId: string;
  type: 'blog' | 'social' | 'audio' | 'newsletter' | 'video-script' | 'transcription';
  format: string;
  content: string;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    seoScore?: number;
    readabilityScore?: number;
    aiInsights?: {
      topics: string[];
      tone: string;
      suggestions: string[];
    };
  };
  createdAt: Date;
}

export interface TransformationConfig {
  id: string;
  type: 'blog' | 'social' | 'audio' | 'newsletter' | 'video-script' | 'transcription';
  options: {
    writingStyle?: 'analytical' | 'conversational' | 'professional';
    seoOptimized?: boolean;
    platformFormat?: 'twitter' | 'linkedin' | 'facebook';
    audioVoice?: string;
    targetLength?: 'short' | 'medium' | 'long';
    includeKeyPoints?: boolean;
    addCallToAction?: boolean;
    optimizeForPlatform?: boolean;
    transcriptionLanguage?: string;
    transcriptionFormat?: 'full' | 'summary' | 'timestamps';
  };
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    startDate?: Date;
    endDate?: Date;
  };
}

export interface TransformationOptions {
  writingStyle?: 'analytical' | 'conversational' | 'professional';
  seoOptimized?: boolean;
  platformFormat?: 'twitter' | 'linkedin' | 'facebook';
  audioVoice?: string;
  targetLength?: 'short' | 'medium' | 'long';
  transcriptionLanguage?: string;
  transcriptionFormat?: 'full' | 'summary' | 'timestamps';
}

export interface YoutubeConfig {
  channelId?: string;
  playlistId?: string;
  videoId?: string;
}

export interface RSSConfig {
  feedUrl: string;
  updateInterval?: number;
}

export interface APIConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  interval?: number;
}