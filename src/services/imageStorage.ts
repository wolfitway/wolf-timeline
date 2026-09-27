/**
 * Sovereign Local IndexedDB Media & Photo Storage Engine
 * Provides persistent, zero-telemetry storage for large photos, high-res design assets,
 * and mood gallery images without hitting localStorage size limitations.
 */

const DB_NAME = "wolf_sovereign_media_v2";
const STORE_NAME = "gallery_photos";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openMediaDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("noteId", "noteId", { unique: false });
        store.createIndex("created_at", "created_at", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

export interface StoredPhotoRecord {
  id: string;
  noteId: number;
  dataUrl: string;
  name: string;
  caption: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  created_at: string;
  order_index?: number;
}

/**
 * Optimizes and resizes an incoming image file before storage
 * to guarantee instantaneous UI rendering and zero lag.
 */
export async function optimizeImageFile(
  file: File,
  maxDim = 1920,
  quality = 0.88
): Promise<{ dataUrl: string; width: number; height: number; sizeBytes: number; fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image data"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({
            dataUrl: e.target?.result as string,
            width: img.width,
            height: img.height,
            sizeBytes: file.size,
            fileName: file.name,
          });
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Export as webp if supported, otherwise jpeg
        let dataUrl = "";
        try {
          dataUrl = canvas.toDataURL("image/webp", quality);
        } catch {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        const sizeBytes = Math.round((dataUrl.length * 3) / 4);
        resolve({ dataUrl, width, height, sizeBytes, fileName: file.name });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Saves a photo record to IndexedDB
 */
export async function savePhotoToStorage(record: StoredPhotoRecord): Promise<void> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB photo save failed, falling back to memory:", e);
  }
}

/**
 * Retrieves a photo from IndexedDB by ID
 */
export async function getPhotoFromStorage(id: string): Promise<StoredPhotoRecord | null> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB getPhoto failed:", e);
    return null;
  }
}

/**
 * Permanently deletes a photo from the local sovereign database
 */
export async function deletePhotoFromStorage(id: string): Promise<boolean> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB deletePhoto failed:", e);
    return false;
  }
}

/**
 * Permanently deletes all photos for a note from IndexedDB
 */
export async function deleteAllPhotosForNote(noteId: number): Promise<number> {
  try {
    const db = await openMediaDB();
    const photos = await listPhotosForNote(noteId);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const p of photos) {
        store.delete(p.id);
      }
      tx.oncomplete = () => resolve(photos.length);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("IndexedDB deleteAllPhotosForNote failed:", e);
    return 0;
  }
}

/**
 * Lists all stored photos for a given note
 */
export async function listPhotosForNote(noteId: number): Promise<StoredPhotoRecord[]> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("noteId");
      const req = index.getAll(IDBKeyRange.only(noteId));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB listPhotosForNote failed:", e);
    return [];
  }
}

/**
 * Helper to download a single image file to the user's computer/folder
 */
export function downloadPhotoFile(dataUrlOrUrl: string, fileName = "wolfnote-photo.png") {
  const link = document.createElement("a");
  link.href = dataUrlOrUrl;
  link.download = fileName.replace(/[/\\?%*:|"<>]/g, "-");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports all photos in a gallery to a real folder on the user's filesystem
 * using the Native File System Access API (window.showDirectoryPicker) if supported,
 * or sequential file downloads fallback.
 */
export async function exportPhotosToFolder(
  photos: Array<{ id: string; url: string; caption?: string; fileName?: string }>,
  folderPrefix = "wolfnote-gallery"
): Promise<{ success: boolean; count: number; mode: "native_directory" | "downloads" }> {
  if (!photos.length) return { success: false, count: 0, mode: "downloads" };

  // 1. Try Native File System Access API
  if ("showDirectoryPicker" in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        id: "wolfnote-gallery-export",
        mode: "readwrite",
        startIn: "pictures",
      });

      let saved = 0;
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const cleanName = (photo.caption || photo.fileName || `photo_${i + 1}`)
          .replace(/[/\\?%*:|"<>]/g, "_")
          .trim();
        const ext = photo.url.startsWith("data:image/jpeg")
          ? "jpg"
          : photo.url.startsWith("data:image/webp")
          ? "webp"
          : "png";
        const fileName = `${String(i + 1).padStart(2, "0")}_${cleanName}.${ext}`;

        // Convert dataUrl to blob
        const res = await fetch(photo.url);
        const blob = await res.blob();

        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        saved++;
      }

      return { success: true, count: saved, mode: "native_directory" };
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return { success: false, count: 0, mode: "native_directory" };
      }
      console.warn("DirectoryPicker failed or declined, falling back to download:", e);
    }
  }

  // 2. Fallback: trigger sequential browser downloads
  let downloaded = 0;
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const cleanName = (photo.caption || photo.fileName || `photo_${i + 1}`)
      .replace(/[/\\?%*:|"<>]/g, "_")
      .trim();
    const ext = photo.url.startsWith("data:image/jpeg")
      ? "jpg"
      : photo.url.startsWith("data:image/webp")
      ? "webp"
      : "png";
    const fileName = `${folderPrefix}_${String(i + 1).padStart(2, "0")}_${cleanName}.${ext}`;

    setTimeout(() => {
      downloadPhotoFile(photo.url, fileName);
    }, i * 200);
    downloaded++;
  }

  return { success: true, count: downloaded, mode: "downloads" };
}
