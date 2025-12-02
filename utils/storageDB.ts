import { MediaItem } from '../types';

const DB_NAME = 'PurrfectDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_items';

/**
 * Opens the IndexedDB database.
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      reject("Your browser doesn't support IndexedDB.");
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as any).error);
      reject("Database error: " + (event.target as any).error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create object store with 'id' as the key path
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Retrieves all media items from IndexedDB.
 */
export const getAllMediaItems = async (): Promise<MediaItem[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort explicitly in JS because basic IndexedDB getAll doesn't sort by createdAt easily without an index
        const items = (request.result || []) as MediaItem[];
        items.sort((a, b) => b.createdAt - a.createdAt); // Newest first
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error getting items:", error);
    return [];
  }
};

/**
 * Saves or updates a media item in IndexedDB.
 */
export const saveMediaItem = async (item: MediaItem): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(item); // 'put' acts as upsert (insert or update)

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Deletes a media item by ID.
 */
export const deleteMediaItem = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
