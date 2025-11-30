export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string; // Base64 data URI for this local demo
  thumbnailUrl?: string; // For videos
  title: string;
  description: string;
  tags: string[];
  createdAt: number;
  width?: number;
  height?: number;
}

export interface AiMetadataResponse {
  title: string;
  description: string;
  tags: string[];
}

export interface AppState {
  items: MediaItem[];
  view: 'dashboard' | 'upload' | 'api-preview' | 'ai-generator' | 'settings';
}