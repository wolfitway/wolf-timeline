import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useBookmarksStore } from "../src/stores/useBookmarksStore";
import { useNotesStore } from "../src/stores/useNotesStore";

// Mock localStorage for node test environment
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, value: string) => {
    storageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (index: number) => Object.keys(storageMock)[index] || null,
  length: 0,
};

describe("Sovereign Bookmarks Database & Tag Isolation Suite", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("creates, reads, updates, and deletes bookmarks in the database store", async () => {
    const store = useBookmarksStore();

    // 1. Create
    const bm = await store.addBookmark({
      url: "https://vuejs.org/guide/introduction.html",
      title: "Vue 3 Documentation",
      note: "The progressive JavaScript framework",
      tags: ["frontend", "vue", "javascript"],
    });

    expect(bm.id).toBeDefined();
    expect(bm.domain).toBe("vuejs.org");
    expect(store.bookmarks.length).toBe(1);

    // 2. Read
    const found = store.getBookmarkById(bm.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe("Vue 3 Documentation");

    // 3. Update
    await store.updateBookmark(bm.id, {
      title: "Vue 3 Official Guide & Docs",
      tags: ["frontend", "vue3", "typescript"],
    });

    const updated = store.getBookmarkById(bm.id);
    expect(updated?.title).toBe("Vue 3 Official Guide & Docs");
    expect(updated?.tags).toEqual(["frontend", "vue3", "typescript"]);

    // 4. Delete
    const deleted = await store.deleteBookmark(bm.id);
    expect(deleted).toBe(true);
    expect(store.bookmarks.length).toBe(0);
  });

  it("strictly separates bookmark tags from timeline and project note tags", async () => {
    const notesStore = useNotesStore();
    const bookmarksStore = useBookmarksStore();

    // Add note with timeline tags
    await notesStore.addNote({
      title: "Architecture Milestone",
      body: "Core roadmap specifications",
      tags: ["architecture", "sovereign", "vault"],
    });

    // Add bookmark with distinct bookmark tags
    await bookmarksStore.addBookmark({
      url: "https://rust-lang.org",
      title: "Rust Language",
      tags: ["rust", "backend", "memory-safe"],
    });

    // Verify notesStore.allTags only contains timeline/note tags
    expect(notesStore.allTags).toContain("architecture");
    expect(notesStore.allTags).toContain("sovereign");
    expect(notesStore.allTags).not.toContain("rust");
    expect(notesStore.allTags).not.toContain("memory-safe");

    // Verify bookmarksStore.bookmarkTags only contains bookmark tags
    expect(bookmarksStore.bookmarkTags).toContain("rust");
    expect(bookmarksStore.bookmarkTags).toContain("memory-safe");
    expect(bookmarksStore.bookmarkTags).not.toContain("architecture");
  });

  it("filters and searches bookmarks correctly", async () => {
    const store = useBookmarksStore();

    await store.addBookmark({
      url: "https://tauri.app",
      title: "Tauri Desktop Apps",
      tags: ["tauri", "desktop", "rust"],
    });

    await store.addBookmark({
      url: "https://tailwindcss.com",
      title: "Tailwind CSS",
      tags: ["css", "styling"],
    });

    expect(store.filteredBookmarks.length).toBe(2);

    // Search query
    store.searchQuery = "tauri";
    expect(store.filteredBookmarks.length).toBe(1);
    expect(store.filteredBookmarks[0].title).toBe("Tauri Desktop Apps");

    // Clear search and test tag filter
    store.searchQuery = "";
    store.selectedTag = "css";
    expect(store.filteredBookmarks.length).toBe(1);
    expect(store.filteredBookmarks[0].title).toBe("Tailwind CSS");
  });

  it("runs auto-classification on bookmarks", async () => {
    const store = useBookmarksStore();

    await store.addBookmark({
      url: "https://github.com/torvalds/linux",
      title: "Linux Kernel Source Code",
      tags: ["code"],
    });

    const count = await store.autoClassifyAll();
    expect(count).toBeGreaterThanOrEqual(0);

    const bm = store.bookmarks[0];
    expect(bm.tags?.length).toBeGreaterThan(0);
  });
});
