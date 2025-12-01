import { MediaItem } from '../types';
import { getSupabaseClient } from '../services/supabaseClient';

const TABLE_NAME = 'media_items';

// Helpers to map between DB snake_case and App camelCase
const mapToAppModel = (dbItem: any): MediaItem => ({
  id: dbItem.id,
  appId: dbItem.app_id,
  type: dbItem.type,
  url: dbItem.url,
  thumbnailUrl: dbItem.thumbnail_url,
  title: dbItem.title || '',
  description: dbItem.description || '',
  tags: dbItem.tags || [],
  createdAt: dbItem.created_at ? Number(dbItem.created_at) : Date.now(),
  width: dbItem.width,
  height: dbItem.height
});

const mapToDbModel = (item: MediaItem): any => ({
  id: item.id,
  app_id: item.appId,
  type: item.type,
  url: item.url,
  thumbnail_url: item.thumbnailUrl,
  title: item.title,
  description: item.description,
  tags: item.tags,
  created_at: item.createdAt,
  width: item.width,
  height: item.height
});

/**
 * Retrieves all media items from Supabase.
 */
export const getAllMediaItems = async (): Promise<MediaItem[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("Supabase not configured. Returning empty list.");
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase fetch error:", error);
    throw error;
  }

  return (data || []).map(mapToAppModel);
};

/**
 * Saves or updates a media item in Supabase.
 */
export const saveMediaItem = async (item: MediaItem): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Please check Settings.");
  }

  const dbItem = mapToDbModel(item);

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(dbItem);

  if (error) {
    console.error("Supabase save error:", error);
    throw error;
  }
};

/**
 * Deletes a media item by ID.
 */
export const deleteMediaItem = async (id: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Supabase delete error:", error);
    throw error;
  }
};
