
import { MediaItem } from '../types';

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

// --- API CONFIGURATION ---
const getApiUrl = () => {
    return localStorage.getItem('custom_api_url') || '';
};

// --- UNIFIED API ---

/**
 * Retrieves all media items from Custom Server API (if configured) OR IndexedDB.
 */
export const getAllMediaItems = async (): Promise<MediaItem[]> => {
  const apiUrl = getApiUrl();

  // 1. Try Custom API
  if (apiUrl) {
    try {
        const response = await fetch(`${apiUrl}?action=get_all`);
        if (!response.ok) throw new Error("API Network error");
        const data = await response.json();
        
        if (data.status === 'success') {
            return data.items.map((item: any) => ({
                id: item.id,
                appId: item.app_id,
                type: item.type,
                url: item.url, // Full URL from server
                title: item.title,
                description: item.description,
                tags: item.tags ? (Array.isArray(item.tags) ? item.tags : JSON.parse(item.tags)) : [],
                createdAt: parseInt(item.created_at) || Date.now()
            }));
        }
    } catch (e) {
        console.error("API Fetch Error:", e);
        // Fallback or just return empty? Let's just log.
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
 * If API URL is set: Uploads to Server (PHP).
 * If Local: Saves Base64 directly to IndexedDB.
 */
export const saveMediaItem = async (item: MediaItem): Promise<void> => {
  const apiUrl = getApiUrl();

  // 1. Try Custom API
  if (apiUrl) {
    try {
        const formData = new FormData();
        formData.append('action', 'save');
        formData.append('id', item.id);
        formData.append('app_id', item.appId);
        formData.append('type', item.type);
        formData.append('title', item.title);
        formData.append('description', item.description);
        formData.append('tags', JSON.stringify(item.tags));
        formData.append('created_at', item.createdAt.toString());

        // Handle File Upload
        if (item.url.startsWith('data:')) {
            // Convert Base64 to Blob
            const base64Content = item.url.split(',')[1];
            const mimeType = item.url.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)?.[0] || 'image/png';
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
            const filename = `${item.id}.${item.type === 'IMAGE' ? 'png' : 'mp4'}`;
            formData.append('file', blob, filename);
        } else {
            // Already a URL (Edit mode without changing file)
            formData.append('existing_url', item.url);
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || "Unknown API Error");
        }
        return; // Success

    } catch (err: any) {
        console.error("Server Save Failed:", err);
        alert(`Sunucuya kayıt başarısız oldu:\n${err.message}\n\nYerel veritabanına kaydediliyor...`);
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
  const apiUrl = getApiUrl();

  // 1. Try Custom API
  if (apiUrl) {
    try {
        await fetch(`${apiUrl}?action=delete&id=${id}`);
        // We assume it worked
    } catch (e) {
        console.error("API Delete Error", e);
    }
  }

  // 2. Fallback to IndexedDB (Always try to delete local copy too)
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
