
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MediaItem } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const url = localStorage.getItem('supabase_url');
  const key = localStorage.getItem('supabase_key');

  if (url && key) {
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  }
  return null;
};

export const isSupabaseConfigured = (): boolean => {
  return !!localStorage.getItem('supabase_url') && !!localStorage.getItem('supabase_key');
};

/**
 * Uploads a Base64 string as a file to Supabase Storage and returns the public URL.
 */
export const uploadFileToSupabase = async (base64Data: string, filePath: string): Promise<string> => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not configured");

    // 1. Convert Base64 to Blob
    const base64Content = base64Data.split(',')[1];
    const mimeType = base64Data.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)?.[0] || 'image/png';
    
    const byteCharacters = atob(base64Content);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: mimeType });
    const fileFile = new File([blob], "filename", { type: mimeType });

    // 2. Upload to 'wallpapers' bucket
    const { data, error } = await supabase.storage
        .from('wallpapers')
        .upload(filePath, fileFile, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) {
        console.error("Storage upload error:", error);
        throw error;
    }

    // 3. Get Public URL
    const { data: publicUrlData } = supabase.storage
        .from('wallpapers')
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
};
