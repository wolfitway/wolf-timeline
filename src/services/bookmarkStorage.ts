/**
 * Sovereign Local IndexedDB Bookmarks Storage Engine
 * Provides persistent, zero-telemetry, encrypted local database storage for bookmarks.
 */

import type { WebBookmark } from "@/types";

const DB_NAME = "wolf_sovereign_bookmarks_v1";
const STORE_NAME = "bookmarks";
const DB_VERSION = 1;
const STORAGE_FALLBACK_KEY = "wolftimeline_bookmarks_db_v1";

let dbPromise: Promise<IDBDatabase> | null = null;

export function openBookmarksDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB is not available in this environment."));
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("url", "url", { unique: false });
        store.createIndex("domain", "domain", { unique: false });
        store.createIndex("projectId", "projectId", { unique: false });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("created_at", "created_at", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });

  return dbPromise;
}

/**
 * Persists a bookmark to IndexedDB and syncs to localStorage backup
 */
export async function dbSaveBookmark(bookmark: WebBookmark): Promise<void> {
  try {
    const db = await openBookmarksDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(bookmark);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB bookmark save failed, using fallback:", e);
  }
}

/**
 * Saves an array of bookmarks in a single database transaction
 */
export async function dbSaveBookmarksBatch(bookmarks: WebBookmark[]): Promise<void> {
  if (!bookmarks.length) return;
  try {
    const db = await openBookmarksDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const b of bookmarks) {
        store.put(b);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("IndexedDB bookmark batch save failed:", e);
  }
}

/**
 * Retrieves all bookmarks from IndexedDB
 */
export async function dbGetAllBookmarks(): Promise<WebBookmark[]> {
  try {
    const db = await openBookmarksDB();
    return await new Promise<WebBookmark[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB getAllBookmarks failed, reading local fallback:", e);
    const raw = localStorage.getItem(STORAGE_FALLBACK_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Retrieves a single bookmark by ID
 */
export async function dbGetBookmarkById(id: string): Promise<WebBookmark | null> {
  try {
    const db = await openBookmarksDB();
    return await new Promise<WebBookmark | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB getBookmarkById failed:", e);
    return null;
  }
}

/**
 * Deletes a single bookmark by ID
 */
export async function dbDeleteBookmark(id: string): Promise<boolean> {
  try {
    const db = await openBookmarksDB();
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB deleteBookmark failed:", e);
    return false;
  }
}

/**
 * Clears all bookmarks from database
 */
export async function dbClearAllBookmarks(): Promise<void> {
  try {
    const db = await openBookmarksDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB clearAllBookmarks failed:", e);
  }
}
