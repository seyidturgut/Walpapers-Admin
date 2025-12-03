
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface AppProfile {
  id: string;
  name: string; // e.g. "Cat Wallpapers"
  description: string; // e.g. "Cute and funny cat wallpapers for felinelovers"
  aiContext: string; // e.g. "cat, kitten, feline, pet, meow" (Keywords for AI generation)
}

export interface MediaItem {
  id: string;
  appId: string; // Belongs to which app?
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
  apps: AppProfile[];
  activeAppId: string;
  items: MediaItem[];
  view: 'dashboard' | 'upload' | 'api-preview' | 'ai-generator' | 'settings';
}
