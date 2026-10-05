import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { WebBookmark } from "@/types";
import {
  dbGetAllBookmarks,
  dbSaveBookmark,
  dbSaveBookmarksBatch,
  dbDeleteBookmark,
  dbClearAllBookmarks,
} from "@/services/bookmarkStorage";
import { autoClassifyBookmark } from "@/services/bookmarkClassifier";
import { useNotesStore } from "@/stores/useNotesStore";

const STORAGE_BACKUP_KEY = "wolftimeline_bookmarks_db_v1";

export const useBookmarksStore = defineStore("bookmarks", () => {
  const bookmarks = ref<WebBookmark[]>([]);
  const isLoaded = ref(false);
  const searchQuery = ref("");
  const selectedTag = ref("all");
  const selectedDomain = ref("all");
  const selectedProjectId = ref<number | "all">("all");
  const sortBy = ref<"newest" | "title" | "domain">("newest");

  // Save current in-memory bookmarks to localStorage backup
  function syncToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(bookmarks.value));
    } catch (e) {
      console.warn("LocalStorage bookmarks backup error:", e);
    }
  }

  // Load all bookmarks from IndexedDB database with migration/sync from existing notes
  async function loadBookmarks() {
    try {
      const dbRecords = await dbGetAllBookmarks();
      if (dbRecords && dbRecords.length > 0) {
        bookmarks.value = dbRecords;
      } else {
        // Migration: extract any existing bookmarks found in notesStore
        const notesStore = useNotesStore();
        const extracted: WebBookmark[] = [];
        notesStore.notes.forEach((note) => {
          if (note.bookmarks && Array.isArray(note.bookmarks)) {
            note.bookmarks.forEach((bm) => {
              extracted.push({
                ...bm,
                projectId: bm.projectId || note.id,
              });
            });
          }
        });

        if (extracted.length > 0) {
          bookmarks.value = extracted;
          await dbSaveBookmarksBatch(extracted);
        } else {
          // Check localStorage fallback
          const raw = localStorage.getItem(STORAGE_BACKUP_KEY);
          if (raw) {
            try {
              bookmarks.value = JSON.parse(raw);
            } catch {
              bookmarks.value = [];
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error loading bookmarks from DB:", e);
    } finally {
      isLoaded.value = true;
      syncToLocalStorage();
    }
  }

  // Pure isolated Bookmark Tags (Completely separated from Timeline tags)
  const bookmarkTags = computed<string[]>(() => {
    const tagSet = new Set<string>();
    bookmarks.value.forEach((b) => {
      b.tags?.forEach((t) => {
        if (t && t.trim()) tagSet.add(t.trim().toLowerCase());
      });
    });
    return Array.from(tagSet).sort();
  });

  // Unique Domains
  const bookmarkDomains = computed<string[]>(() => {
    const domainSet = new Set<string>();
    bookmarks.value.forEach((b) => {
      if (b.domain && b.domain.trim()) domainSet.add(b.domain.trim().toLowerCase());
    });
    return Array.from(domainSet).sort();
  });

  // Filtered & Sorted Bookmarks
  const filteredBookmarks = computed(() => {
    let list = [...bookmarks.value];

    // Project filter
    if (selectedProjectId.value !== "all") {
      list = list.filter((b) => b.projectId === selectedProjectId.value);
    }

    // Tag filter
    if (selectedTag.value !== "all") {
      list = list.filter((b) => b.tags?.some((t) => t.toLowerCase() === selectedTag.value.toLowerCase()));
    }

    // Domain filter
    if (selectedDomain.value !== "all") {
      list = list.filter((b) => b.domain?.toLowerCase() === selectedDomain.value.toLowerCase());
    }

    // Search query filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      list = list.filter((b) => {
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchUrl = b.url.toLowerCase().includes(q);
        const matchDomain = b.domain.toLowerCase().includes(q);
        const matchNote = (b.note || "").toLowerCase().includes(q);
        const matchTag = b.tags?.some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchUrl || matchDomain || matchNote || matchTag;
      });
    }

    // Sort order
    if (sortBy.value === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy.value === "domain") {
      list.sort((a, b) => a.domain.localeCompare(b.domain));
    } else {
      // Newest
      list.sort((a, b) => {
        const dateA = a.created_at || a.date || "";
        const dateB = b.created_at || b.date || "";
        return dateB.localeCompare(dateA);
      });
    }

    return list;
  });

  // CRUD Operations

  /**
   * CREATE: Add a new bookmark to DB and state
   */
  async function addBookmark(newBm: {
    url: string;
    title?: string;
    domain?: string;
    note?: string;
    tags?: string[];
    projectId?: number;
    favicon?: string;
    preview_image?: string;
    description?: string;
  }): Promise<WebBookmark> {
    let cleanDomain = newBm.domain || "web";
    try {
      const parsed = new URL(newBm.url.trim());
      cleanDomain = parsed.hostname.replace(/^www\./, "");
    } catch {}

    const bookmark: WebBookmark = {
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: newBm.url.trim(),
      title: newBm.title?.trim() || cleanDomain,
      domain: cleanDomain,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      note: newBm.note?.trim() || "",
      tags: newBm.tags || ["bookmark"],
      projectId: newBm.projectId,
      favicon: newBm.favicon,
      preview_image: newBm.preview_image,
      description: newBm.description,
      fetch_status: "idle",
      created_at: new Date().toISOString(),
    };

    bookmarks.value.unshift(bookmark);
    syncToLocalStorage();
    await dbSaveBookmark(bookmark);

    // Also mirror to note if projectId provided
    if (newBm.projectId) {
      const notesStore = useNotesStore();
      const note = notesStore.notes.find((n) => n.id === newBm.projectId);
      if (note) {
        if (!note.bookmarks) note.bookmarks = [];
        const exists = note.bookmarks.find((b) => b.id === bookmark.id);
        if (!exists) {
          note.bookmarks.unshift(bookmark);
          notesStore.saveToLocal();
        }
      }
    }

    return bookmark;
  }

  /**
   * READ: Find a bookmark by ID
   */
  function getBookmarkById(id: string): WebBookmark | undefined {
    return bookmarks.value.find((b) => b.id === id);
  }

  /**
   * UPDATE: Modify an existing bookmark in DB and state
   */
  async function updateBookmark(id: string, updates: Partial<WebBookmark>): Promise<boolean> {
    const idx = bookmarks.value.findIndex((b) => b.id === id);
    if (idx === -1) return false;

    const updated = {
      ...bookmarks.value[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    bookmarks.value[idx] = updated;

    syncToLocalStorage();
    await dbSaveBookmark(updated);

    // Sync to notesStore if relevant
    const notesStore = useNotesStore();
    notesStore.notes.forEach((note) => {
      if (note.bookmarks) {
        const bIdx = note.bookmarks.findIndex((b) => b.id === id);
        if (bIdx !== -1) {
          note.bookmarks[bIdx] = { ...note.bookmarks[bIdx], ...updates };
          notesStore.saveToLocal();
        }
      }
    });

    return true;
  }

  async function deleteBookmark(id: string): Promise<boolean> {
    const exists = bookmarks.value.some((b) => b.id === id);
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id);
    syncToLocalStorage();
    await dbDeleteBookmark(id);

    // Sync to notesStore
    const notesStore = useNotesStore();
    notesStore.notes.forEach((note) => {
      if (note.bookmarks) {
        note.bookmarks = note.bookmarks.filter((b) => b.id !== id);
        notesStore.saveToLocal();
      }
    });

    return exists;
  }

  /**
   * BATCH IMPORT: Ingest a list of parsed bookmarks into DB
   */
  async function importBatchBookmarks(newBookmarks: WebBookmark[], targetProjectId?: number): Promise<number> {
    const enriched = newBookmarks.map((b) => ({
      ...b,
      id: b.id || `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId: targetProjectId || b.projectId,
      date: b.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      created_at: b.created_at || new Date().toISOString(),
      tags: b.tags && b.tags.length ? b.tags : ["bookmark", "imported"],
    }));

    bookmarks.value.unshift(...enriched);
    syncToLocalStorage();
    await dbSaveBookmarksBatch(enriched);

    // Sync to target project
    if (targetProjectId) {
      const notesStore = useNotesStore();
      const note = notesStore.notes.find((n) => n.id === targetProjectId);
      if (note) {
        if (!note.bookmarks) note.bookmarks = [];
        note.bookmarks.unshift(...enriched);
        notesStore.saveToLocal();
      }
    }

    return enriched.length;
  }

  /**
   * CLEAR: Permanently delete all bookmarks
   */
  async function clearAllBookmarks(): Promise<void> {
    bookmarks.value = [];
    syncToLocalStorage();
    await dbClearAllBookmarks();

    const notesStore = useNotesStore();
    notesStore.notes.forEach((note) => {
      note.bookmarks = [];
    });
    notesStore.saveToLocal();
  }

  /**
   * BATCH AUTO-CLASSIFY: Runs neural taxonomy engine on all bookmarks in DB
   */
  async function autoClassifyAll(): Promise<number> {
    let count = 0;
    const batchUpdates: WebBookmark[] = [];

    for (const bm of bookmarks.value) {
      const { suggestedTags } = autoClassifyBookmark(bm.url, bm.title, bm.tags || []);
      if (suggestedTags.length > (bm.tags?.length || 0)) {
        bm.tags = suggestedTags;
        batchUpdates.push(bm);
        count++;
      }
    }

    if (count > 0) {
      syncToLocalStorage();
      await dbSaveBookmarksBatch(batchUpdates);
    }
    return count;
  }

  /**
   * Quick tag toggle
   */
  async function addTagToBookmark(id: string, tag: string) {
    const cleanTag = tag.trim().toLowerCase();
    const bm = bookmarks.value.find((b) => b.id === id);
    if (bm) {
      const current = bm.tags || [];
      if (!current.includes(cleanTag)) {
        await updateBookmark(id, { tags: [...current, cleanTag] });
      }
    }
  }

  async function removeTagFromBookmark(id: string, tag: string) {
    const cleanTag = tag.trim().toLowerCase();
    const bm = bookmarks.value.find((b) => b.id === id);
    if (bm && bm.tags) {
      await updateBookmark(id, { tags: bm.tags.filter((t) => t.toLowerCase() !== cleanTag) });
    }
  }

  return {
    bookmarks,
    isLoaded,
    searchQuery,
    selectedTag,
    selectedDomain,
    selectedProjectId,
    sortBy,
    bookmarkTags,
    bookmarkDomains,
    filteredBookmarks,
    loadBookmarks,
    addBookmark,
    getBookmarkById,
    updateBookmark,
    deleteBookmark,
    importBatchBookmarks,
    clearAllBookmarks,
    autoClassifyAll,
    addTagToBookmark,
    removeTagFromBookmark,
  };
});
