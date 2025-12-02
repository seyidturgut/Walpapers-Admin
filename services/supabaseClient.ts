
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MediaItem } from '../types';

// Default credentials
const DEFAULT_SUPABASE_URL = "https://wiikltoakhzuhocquvuo.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_zTzJLoe-0mqIIFlo9-p95A_h8fr9H8I";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns the active Supabase configuration (Local Storage > Defaults).
 */
export const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_key');
  
  return {
    url: localUrl || DEFAULT_SUPABASE_URL,
    key: localKey || DEFAULT_SUPABASE_KEY
  };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseConfig();

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
            persistSession: true, // Oturumu tarayıcıda sakla
            autoRefreshToken: true,
        }
      });
      return supabaseInstance;
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
      return null;
    }
  }
  return null;
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return !!url && !!key;
};

/**
 * Sign in with Email and Password using Supabase Auth.
 */
export const loginWithSupabase = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase bağlantısı yapılandırılmamış.");

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
};

/**
 * Sign out from Supabase.
 */
export const logoutFromSupabase = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.auth.signOut();
    }
};

/**
 * Check for existing session.
 */
export const getSupabaseSession = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
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
