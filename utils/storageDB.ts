
import { MediaItem } from '../types';
import { getSupabaseClient, isSupabaseConfigured, uploadFileToSupabase } from '../services/supabaseClient';

// --- INDEXED DB (LOCAL FALLBACK) ---
const DB_NAME = 'PurrfectDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_items';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject("Your browser doesn't support IndexedDB.");
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject("Database error: " + (event.target as any).error);
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// --- UNIFIED API ---

/**
 * Retrieves all media items from Supabase (if connected) OR IndexedDB.
 */
export const getAllMediaItems = async (): Promise<MediaItem[]> => {
  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        // Map snake_case to camelCase
        return data.map((item: any) => ({
          id: item.id,
          appId: item.app_id,
          type: item.type,
          url: item.url,
          title: item.title,
          description: item.description,
          tags: item.tags || [],
          createdAt: item.created_at
        }));
      }
    }
  }

  // 2. Fallback to IndexedDB
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = (request.result || []) as MediaItem[];
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB Error:", error);
    return [];
  }
};

/**
 * Saves a media item. 
 * If Supabase is active: Uploads file to Storage -> Saves metadata to DB.
 * If Local: Saves Base64 directly to IndexedDB.
 */
export const saveMediaItem = async (item: MediaItem): Promise<void> => {
  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
        try {
            let fileUrl = item.url;

            // Check if it's base64 (newly generated), if so upload it
            if (item.url.startsWith('data:')) {
                const extension = item.type === 'IMAGE' ? 'png' : 'mp4';
                const fileName = `${item.appId}/${item.id}.${extension}`;
                fileUrl = await uploadFileToSupabase(item.url, fileName);
            }

            // Upsert into DB
            const { error } = await supabase.from('media_items').upsert({
                id: item.id,
                app_id: item.appId,
                type: item.type,
                url: fileUrl, // Save the cloud URL, not base64
                title: item.title,
                description: item.description,
                tags: item.tags,
                created_at: item.createdAt
            });

            if (error) throw error;
            return; // Success
        } catch (err: any) {
            console.error("Supabase Save Failed:", err);
            const errMsg = err.message || JSON.stringify(err);
            
            // Show detailed error to help user fix RLS issues
            alert(`Bulut kaydı başarısız oldu (Supabase Hatası):\n\n${errMsg}\n\nYerel veritabanına kaydediliyor...`);
            
            // Fallthrough to IndexedDB on error
        }
    }
  }

  // 2. Fallback to IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteMediaItem = async (id: string): Promise<void> => {
  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
       await supabase.from('media_items').delete().eq('id', id);
       // Note: We're not deleting the file from storage to keep it simple, but you could.
       return;
    }
  }

  // 2. Fallback to IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
