/**
 * Sovereign Local Vault Database Engine (IndexedDB)
 * Provides persistent, multi-store, zero-telemetry local database persistence
 * for Notes, Roadmap Phases, Vault Secrets, and Point-in-Time Snapshots.
 */

import type { Note, RoadmapPhase, VaultSecretItem } from "@/types";

const DB_NAME = "wolf_sovereign_vault_db_v1";
const DB_VERSION = 2;

export const STORES = {
  NOTES: "notes",
  ROADMAP: "roadmap",
  SECRETS: "encrypted_secrets",
  SNAPSHOTS: "snapshots",
  META: "vault_meta",
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openVaultDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB is not available in this environment."));
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Notes Store
      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: "id" });
        notesStore.createIndex("kind", "kind", { unique: false });
        notesStore.createIndex("status", "status", { unique: false });
        notesStore.createIndex("created_at", "created_at", { unique: false });
      }

      // 2. Roadmap Store
      if (!db.objectStoreNames.contains(STORES.ROADMAP)) {
        const roadmapStore = db.createObjectStore(STORES.ROADMAP, { keyPath: "id" });
        roadmapStore.createIndex("status", "status", { unique: false });
      }

      // 3. Encrypted Secrets Store
      if (!db.objectStoreNames.contains(STORES.SECRETS)) {
        const secretsStore = db.createObjectStore(STORES.SECRETS, { keyPath: "id" });
        secretsStore.createIndex("category", "category", { unique: false });
        secretsStore.createIndex("service", "service", { unique: false });
      }

      // 4. Snapshots Store (for point-in-time recovery)
      if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
        const snapStore = db.createObjectStore(STORES.SNAPSHOTS, { keyPath: "id" });
        snapStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // 5. Vault Metadata Store (passphrase salt, canary, configuration)
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: "key" });
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

/* =========================================================================
   NOTES DATABASE OPERATIONS
   ========================================================================= */

export async function dbGetAllNotes(): Promise<Note[]> {
  try {
    const db = await openVaultDB();
    return new Promise<Note[]>((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, "readonly");
      const store = tx.objectStore(STORES.NOTES);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as Note[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("dbGetAllNotes falling back:", e);
    return [];
  }
}

export async function dbSaveAllNotes(notes: Note[]): Promise<void> {
  if (!notes || notes.length === 0) return;
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, "readwrite");
      const store = tx.objectStore(STORES.NOTES);
      // Clean and put each note
      for (const note of notes) {
        store.put(JSON.parse(JSON.stringify(note)));
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("dbSaveAllNotes failed:", e);
  }
}

export async function dbSaveNote(note: Note): Promise<void> {
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, "readwrite");
      const store = tx.objectStore(STORES.NOTES);
      const req = store.put(JSON.parse(JSON.stringify(note)));
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("dbSaveNote failed:", e);
  }
}

export async function dbDeleteNote(id: number): Promise<void> {
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, "readwrite");
      const store = tx.objectStore(STORES.NOTES);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("dbDeleteNote failed:", e);
  }
}

/* =========================================================================
   ROADMAP DATABASE OPERATIONS
   ========================================================================= */

export async function dbGetRoadmap(): Promise<RoadmapPhase[]> {
  try {
    const db = await openVaultDB();
    return new Promise<RoadmapPhase[]>((resolve, reject) => {
      const tx = db.transaction(STORES.ROADMAP, "readonly");
      const store = tx.objectStore(STORES.ROADMAP);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as RoadmapPhase[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("dbGetRoadmap falling back:", e);
    return [];
  }
}

export async function dbSaveRoadmap(phases: RoadmapPhase[]): Promise<void> {
  if (!phases || phases.length === 0) return;
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.ROADMAP, "readwrite");
      const store = tx.objectStore(STORES.ROADMAP);
      store.clear(); // Always keep clean ordered phases
      for (const p of phases) {
        store.put(JSON.parse(JSON.stringify(p)));
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("dbSaveRoadmap failed:", e);
  }
}

/* =========================================================================
   ENCRYPTED SECRETS DATABASE OPERATIONS
   ========================================================================= */

export async function dbGetAllVaultSecrets(): Promise<VaultSecretItem[]> {
  try {
    const db = await openVaultDB();
    return new Promise<VaultSecretItem[]>((resolve, reject) => {
      const tx = db.transaction(STORES.SECRETS, "readonly");
      const store = tx.objectStore(STORES.SECRETS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as VaultSecretItem[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("dbGetAllVaultSecrets falling back:", e);
    return [];
  }
}

export async function dbSaveVaultSecret(item: VaultSecretItem): Promise<void> {
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SECRETS, "readwrite");
      const store = tx.objectStore(STORES.SECRETS);
      const req = store.put(JSON.parse(JSON.stringify(item)));
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("dbSaveVaultSecret failed:", e);
  }
}

export async function dbDeleteVaultSecret(id: string): Promise<void> {
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SECRETS, "readwrite");
      const store = tx.objectStore(STORES.SECRETS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("dbDeleteVaultSecret failed:", e);
  }
}

export async function dbSaveAllVaultSecrets(secrets: VaultSecretItem[]): Promise<void> {
  if (!secrets || secrets.length === 0) return;
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SECRETS, "readwrite");
      const store = tx.objectStore(STORES.SECRETS);
      for (const item of secrets) {
        store.put(JSON.parse(JSON.stringify(item)));
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("dbSaveAllVaultSecrets failed:", e);
  }
}

/* =========================================================================
   VAULT METADATA OPERATIONS (Salt, Canary, Recovery)
   ========================================================================= */

export async function dbGetMeta(key: string): Promise<string | null> {
  try {
    const db = await openVaultDB();
    return new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORES.META, "readonly");
      const store = tx.objectStore(STORES.META);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result ? req.result.val : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function dbSetMeta(key: string, val: string): Promise<void> {
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.META, "readwrite");
      const store = tx.objectStore(STORES.META);
      const req = store.put({ key, val, updated_at: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("dbSetMeta failed:", e);
  }
}

/* =========================================================================
   SNAPSHOTS, RECOVERY & EXPORT
   ========================================================================= */

export interface SovereignSnapshot {
  id: string;
  timestamp: string;
  version: string;
  notes: Note[];
  roadmap: RoadmapPhase[];
  secrets?: VaultSecretItem[];
  meta: {
    noteCount: number;
    phaseCount: number;
  };
}

export async function dbCreateSnapshot(
  notes: Note[],
  roadmap: RoadmapPhase[],
  secrets?: VaultSecretItem[]
): Promise<string> {
  const now = new Date().toISOString();
  const id = `snap_${Date.now()}`;
  const snapshot: SovereignSnapshot = {
    id,
    timestamp: now,
    version: "2.0.0-SOVEREIGN",
    notes: JSON.parse(JSON.stringify(notes)),
    roadmap: JSON.parse(JSON.stringify(roadmap)),
    secrets: secrets ? JSON.parse(JSON.stringify(secrets)) : undefined,
    meta: {
      noteCount: notes.length,
      phaseCount: roadmap.length,
    },
  };

  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SNAPSHOTS, "readwrite");
      const store = tx.objectStore(STORES.SNAPSHOTS);
      const req = store.put(snapshot);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return id;
  } catch (e) {
    console.warn("dbCreateSnapshot error:", e);
    return id;
  }
}

export async function dbExportFullArchive(
  notes: Note[],
  roadmap: RoadmapPhase[],
  secrets?: VaultSecretItem[]
): Promise<string> {
  const archive = {
    app: "Wolf Timeline",
    exported_at: new Date().toISOString(),
    standard: "WCAG 2.1 AA / Zero-Knowledge Offline Vault",
    notes,
    roadmap,
    secrets: secrets || [],
  };
  return JSON.stringify(archive, null, 2);
}

export async function dbRestoreFullArchive(archiveJson: string): Promise<{
  success: boolean;
  notesCount: number;
  roadmapCount: number;
  secretsCount: number;
  error?: string;
}> {
  try {
    const data = JSON.parse(archiveJson);

    let notesCount = 0;
    let roadmapCount = 0;
    let secretsCount = 0;

    if (Array.isArray(data.notes) && data.notes.length > 0) {
      await dbSaveAllNotes(data.notes);
      notesCount = data.notes.length;
    }

    if (Array.isArray(data.roadmap) && data.roadmap.length > 0) {
      await dbSaveRoadmap(data.roadmap);
      roadmapCount = data.roadmap.length;
    }

    if (Array.isArray(data.secrets) && data.secrets.length > 0) {
      await dbSaveAllVaultSecrets(data.secrets);
      secretsCount = data.secrets.length;
    }

    return { success: true, notesCount, roadmapCount, secretsCount };
  } catch (err: any) {
    return {
      success: false,
      notesCount: 0,
      roadmapCount: 0,
      secretsCount: 0,
      error: err.message || "Failed to restore archive",
    };
  }
}

export async function dbCheckHealth(): Promise<{
  isSupported: boolean;
  notesCount: number;
  roadmapCount: number;
  secretsCount: number;
  status: "healthy" | "fallback";
}> {
  try {
    const notes = await dbGetAllNotes();
    const roadmap = await dbGetRoadmap();
    const secrets = await dbGetAllVaultSecrets();
    return {
      isSupported: typeof indexedDB !== "undefined",
      notesCount: notes.length,
      roadmapCount: roadmap.length,
      secretsCount: secrets.length,
      status: "healthy",
    };
  } catch {
    return {
      isSupported: false,
      notesCount: 0,
      roadmapCount: 0,
      secretsCount: 0,
      status: "fallback",
    };
  }
}
