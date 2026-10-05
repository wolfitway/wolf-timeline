import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Note, TimelineEvent, AiExploration, MoodImage, WebBookmark } from "@/types";
import { INITIAL_NOTES } from "@/services/seedData";
import { tauriListNotes, tauriAddNote, tauriUpdateNote, tauriDeleteNote } from "@/services/tauriIpc";
import {
  savePhotoToStorage,
  deletePhotoFromStorage,
  deleteAllPhotosForNote,
  getPhotoFromStorage,
  listPhotosForNote,
} from "@/services/imageStorage";

const STORAGE_KEY = "wolftimeline_notes_v5";

export const useNotesStore = defineStore("notes", () => {
  const notes = ref<Note[]>([]);
  const selectedNoteId = ref<number | null>(1);
  const activeCategory = ref<string>("all");
  const searchQuery = ref<string>("");
  const isLoaded = ref<boolean>(false);

  // Computed
  const selectedNote = computed<Note | null>(() => {
    if (selectedNoteId.value) {
      const found = notes.value.find((n) => n.id === selectedNoteId.value);
      if (found) return found;
    }
    return notes.value[0] || null;
  });

  const filteredNotes = computed<Note[]>(() => {
    return notes.value.filter((note) => {
      // Category filter
      if (activeCategory.value !== "all") {
        if (note.kind !== activeCategory.value && note.funnel_stage !== activeCategory.value && note.status !== activeCategory.value) {
          return false;
        }
      }
      // Search filter
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase().trim();
        const titleMatch = note.title.toLowerCase().includes(q);
        const bodyMatch = note.body.toLowerCase().includes(q);
        const tagMatch = note.tags.some((t) => t.toLowerCase().includes(q));
        return titleMatch || bodyMatch || tagMatch;
      }
      return true;
    });
  });

  const counts = computed(() => {
    return {
      all: notes.value.length,
      ideas: notes.value.filter((n) => n.kind === "idea").length,
      builds: notes.value.filter((n) => n.kind === "milestone").length,
      posts: notes.value.filter((n) => n.kind === "post").length,
      links: notes.value.filter((n) => n.kind === "link").length,
    };
  });

  // Actions
  function saveToLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value));
    } catch (e) {
      console.warn("LocalStorage full, trimming large data URIs from cache:", e);
      try {
        // Fallback: strip inline heavy data URLs from localStorage JSON (IndexedDB keeps them intact)
        const lightweightNotes = notes.value.map((n) => ({
          ...n,
          mood_gallery: n.mood_gallery?.map((m) => ({
            ...m,
            url: m.url.startsWith("data:") && m.url.length > 5000 ? `idb://${m.id}` : m.url,
          })),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightNotes));
      } catch (err2) {
        console.error("Critical storage error:", err2);
      }
    }
  }

  async function loadNotes() {
    // 1. Try localStorage with fresh seed fallback
    const localRaw = localStorage.getItem(STORAGE_KEY);
    if (localRaw) {
      try {
        const parsed: Note[] = JSON.parse(localRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          notes.value = parsed;
        } else {
          notes.value = JSON.parse(JSON.stringify(INITIAL_NOTES));
        }
      } catch {
        notes.value = JSON.parse(JSON.stringify(INITIAL_NOTES));
      }
    } else {
      notes.value = JSON.parse(JSON.stringify(INITIAL_NOTES));
      saveToLocal();
    }

    // 2. Hydrate any IndexedDB photos for each note
    for (const note of notes.value) {
      try {
        const idbPhotos = await listPhotosForNote(note.id);
        if (idbPhotos && idbPhotos.length > 0) {
          if (!note.mood_gallery) note.mood_gallery = [];
          for (const stored of idbPhotos) {
            const existing = note.mood_gallery.find((m) => m.id === stored.id);
            if (existing) {
              if (existing.url.startsWith("idb://") || !existing.url) {
                existing.url = stored.dataUrl;
              }
              if (stored.sizeBytes) existing.sizeBytes = stored.sizeBytes;
              if (stored.name) existing.fileName = stored.name;
              if (stored.width) existing.width = stored.width;
              if (stored.height) existing.height = stored.height;
            } else {
              note.mood_gallery.push({
                id: stored.id,
                url: stored.dataUrl,
                caption: stored.caption || stored.name,
                fileName: stored.name,
                sizeBytes: stored.sizeBytes,
                width: stored.width,
                height: stored.height,
                tags: ["photo", "vault"],
                created_at: stored.created_at,
                order_index: stored.order_index ?? note.mood_gallery.length,
              });
            }
          }
          // Sort by order_index if available
          note.mood_gallery.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        }
      } catch (e) {
        console.warn(`Could not hydrate IDB photos for note ${note.id}:`, e);
      }
    }

    selectedNoteId.value = notes.value[0]?.id || 1;
    isLoaded.value = true;
  }


  async function addNote(newNote: {
    title: string;
    body: string;
    tags: string[];
    kind?: "idea" | "link" | "post" | "milestone";
    status?: "ideation" | "research" | "design" | "in_progress" | "live" | "backlog" | "exploring" | "shipped";
    funnel_stage?: "awareness" | "lead_magnet" | "product" | "revenue";
    remind_at?: string | null;
  }) {
    const created = await tauriAddNote(newNote);
    const noteId = created ? created.id : Date.now();
    const note: Note = {
      id: noteId,
      created_at: created?.created_at || new Date().toISOString(),
      title: newNote.title,
      body: newNote.body,
      tags: newNote.tags || [],
      kind: newNote.kind || "idea",
      status: newNote.status || "ideation",
      funnel_stage: newNote.funnel_stage || "lead_magnet",
      remind_at: newNote.remind_at || null,
      events: [
        {
          id: `ev_${Date.now()}`,
          title: "Captured to Sovereign Vault",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          author: "You",
          desc: "Note committed to local encrypted memory.",
        },
      ],
      ai_explorations: [],
      mood_gallery: [],
      bookmarks: [],
    };

    notes.value.unshift(note);
    selectedNoteId.value = note.id;
    saveToLocal();
    return note;
  }

  async function updateNote(id: number, updates: Partial<Note>) {
    const idx = notes.value.findIndex((n) => n.id === id);
    if (idx === -1) return;

    notes.value[idx] = { ...notes.value[idx], ...updates };
    await tauriUpdateNote({ id, ...updates });
    saveToLocal();
  }

  async function deleteNote(id: number) {
    notes.value = notes.value.filter((n) => n.id !== id);
    if (selectedNoteId.value === id) {
      selectedNoteId.value = notes.value[0]?.id || null;
    }
    await tauriDeleteNote(id);
    saveToLocal();
  }

  function selectNote(id: number | null) {
    selectedNoteId.value = id;
  }

  async function duplicateNote(id: number) {
    const orig = notes.value.find((n) => n.id === id);
    if (!orig) return;
    const duplicated: Note = {
      ...JSON.parse(JSON.stringify(orig)),
      id: Date.now(),
      title: `${orig.title} (Copy)`,
      created_at: new Date().toISOString(),
    };
    notes.value.unshift(duplicated);
    selectedNoteId.value = duplicated.id;
    await tauriAddNote({
      title: duplicated.title,
      body: duplicated.body,
      tags: duplicated.tags,
      kind: duplicated.kind,
      status: duplicated.status,
      funnel_stage: duplicated.funnel_stage,
    });
    saveToLocal();
    return duplicated;
  }

  function reorderNotes(newOrder: Note[]) {
    notes.value = newOrder;
    saveToLocal();
  }

  function addTimelineEvent(noteId: number, event: TimelineEvent) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note) return;
    if (!note.events) note.events = [];
    note.events.unshift(event);
    saveToLocal();
  }

  function updateTimelineEvent(noteId: number, eventId: string, updates: Partial<TimelineEvent>) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.events) return;
    const idx = note.events.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      note.events[idx] = { ...note.events[idx], ...updates };
      saveToLocal();
    }
  }

  function deleteTimelineEvent(noteId: number, eventId: string) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.events) return;
    note.events = note.events.filter((e) => e.id !== eventId);
    saveToLocal();
  }

  function addAiExploration(noteId: number, exp: AiExploration) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note) return;
    if (!note.ai_explorations) note.ai_explorations = [];
    note.ai_explorations.unshift(exp);
    saveToLocal();
  }

  function updateAiExploration(noteId: number, expId: string, updates: Partial<AiExploration>) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.ai_explorations) return;
    const idx = note.ai_explorations.findIndex((a) => a.id === expId);
    if (idx !== -1) {
      note.ai_explorations[idx] = { ...note.ai_explorations[idx], ...updates };
      saveToLocal();
    }
  }

  function deleteAiExploration(noteId: number, expId: string) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.ai_explorations) return;
    note.ai_explorations = note.ai_explorations.filter((a) => a.id !== expId);
    saveToLocal();
  }

  async function addMoodImage(noteId: number, img: MoodImage) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note) return;
    if (!note.mood_gallery) note.mood_gallery = [];
    
    // Assign order_index
    img.order_index = 0;
    note.mood_gallery.forEach((m, idx) => {
      m.order_index = idx + 1;
    });
    note.mood_gallery.unshift(img);
    saveToLocal();

    // Persist full image binary to IndexedDB
    if (img.url.startsWith("data:")) {
      await savePhotoToStorage({
        id: img.id,
        noteId,
        dataUrl: img.url,
        name: img.fileName || img.caption || "Photo",
        caption: img.caption || "Visual Reference",
        sizeBytes: img.sizeBytes || Math.round((img.url.length * 3) / 4),
        width: img.width,
        height: img.height,
        created_at: img.created_at || new Date().toISOString(),
        order_index: 0,
      });
    }
  }

  async function updateMoodImage(noteId: number, imgId: string, updates: Partial<MoodImage>) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.mood_gallery) return;
    const idx = note.mood_gallery.findIndex((m) => m.id === imgId);
    if (idx !== -1) {
      note.mood_gallery[idx] = { ...note.mood_gallery[idx], ...updates };
      saveToLocal();
      if (updates.url && updates.url.startsWith("data:")) {
        await savePhotoToStorage({
          id: imgId,
          noteId,
          dataUrl: updates.url,
          name: updates.fileName || updates.caption || "Photo",
          caption: updates.caption || "Visual Reference",
          sizeBytes: updates.sizeBytes || Math.round((updates.url.length * 3) / 4),
          width: updates.width,
          height: updates.height,
          created_at: new Date().toISOString(),
          order_index: idx,
        });
      }
    }
  }

  async function deleteMoodImage(noteId: number, imgId: string) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.mood_gallery) return;
    note.mood_gallery = note.mood_gallery.filter((m) => m.id !== imgId);
    note.mood_gallery.forEach((m, idx) => {
      m.order_index = idx;
    });
    saveToLocal();
    await deletePhotoFromStorage(imgId);
  }

  async function clearAllMoodImages(noteId: number) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.mood_gallery) return;
    note.mood_gallery = [];
    saveToLocal();
    await deleteAllPhotosForNote(noteId);
  }

  function moveMoodImage(
    noteId: number,
    imgId: string,
    direction: "left" | "right" | "first" | "last"
  ) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.mood_gallery || note.mood_gallery.length <= 1) return;
    const list = [...note.mood_gallery];
    const idx = list.findIndex((m) => m.id === imgId);
    if (idx === -1) return;

    const [item] = list.splice(idx, 1);
    if (direction === "first") {
      list.unshift(item);
    } else if (direction === "last") {
      list.push(item);
    } else if (direction === "left") {
      const targetIdx = Math.max(0, idx - 1);
      list.splice(targetIdx, 0, item);
    } else if (direction === "right") {
      const targetIdx = Math.min(list.length, idx + 1);
      list.splice(targetIdx, 0, item);
    }

    list.forEach((m, i) => {
      m.order_index = i;
    });
    note.mood_gallery = list;
    saveToLocal();
  }

  function addBookmark(noteId: number, bm: WebBookmark) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note) return;
    if (!note.bookmarks) note.bookmarks = [];
    note.bookmarks.unshift(bm);
    saveToLocal();
  }

  function importBookmarks(noteId: number, bms: WebBookmark[]) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note) return;
    if (!note.bookmarks) note.bookmarks = [];
    note.bookmarks.unshift(...bms);
    saveToLocal();
  }

  function updateBookmark(noteId: number, bmId: string, updates: Partial<WebBookmark>) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.bookmarks) return;
    const idx = note.bookmarks.findIndex((b) => b.id === bmId);
    if (idx !== -1) {
      note.bookmarks[idx] = { ...note.bookmarks[idx], ...updates };
      saveToLocal();
    }
  }

  function deleteBookmark(noteId: number, bmId: string) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note || !note.bookmarks) return;
    note.bookmarks = note.bookmarks.filter((b) => b.id !== bmId);
    saveToLocal();
  }

  function reorderTimelineEvents(noteId: number, newOrder: TimelineEvent[]) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note) return;
    note.events = newOrder;
    saveToLocal();
  }

  function reorderAiExplorations(noteId: number, newOrder: AiExploration[]) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note) return;
    note.ai_explorations = newOrder;
    saveToLocal();
  }

  function reorderMoodImages(noteId: number, newOrder: MoodImage[]) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note) return;
    newOrder.forEach((m, idx) => {
      m.order_index = idx;
    });
    note.mood_gallery = newOrder;
    saveToLocal();
  }

  function reorderBookmarks(noteId: number, newOrder: WebBookmark[]) {
    const note = notes.value.find((n) => n.id === noteId);
    if (!note) return;
    note.bookmarks = newOrder;
    saveToLocal();
  }

  function resetToDefaults() {
    notes.value = JSON.parse(JSON.stringify(INITIAL_NOTES));
    selectedNoteId.value = notes.value[0]?.id || null;
    saveToLocal();
  }

  const allTags = computed(() => {
    const tagSet = new Set<string>();
    notes.value.forEach((n) => {
      n.tags?.forEach((t) => tagSet.add(t));
      n.events?.forEach((e) => e.tags?.forEach((t) => tagSet.add(t)));
      n.ai_explorations?.forEach((a) => a.tags?.forEach((t) => tagSet.add(t)));
      n.mood_gallery?.forEach((m) => m.tags?.forEach((t) => tagSet.add(t)));
      n.bookmarks?.forEach((b) => b.tags?.forEach((t) => tagSet.add(t)));
    });
    return Array.from(tagSet);
  });

  return {
    notes,
    selectedNoteId,
    selectedNote,
    filteredNotes,
    activeCategory,
    searchQuery,
    counts,
    allTags,
    isLoaded,
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
    selectNote,
    duplicateNote,
    reorderNotes,
    addTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
    reorderTimelineEvents,
    addAiExploration,
    updateAiExploration,
    deleteAiExploration,
    reorderAiExplorations,
    addMoodImage,
    updateMoodImage,
    deleteMoodImage,
    clearAllMoodImages,
    moveMoodImage,
    reorderMoodImages,
    addBookmark,
    importBookmarks,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    resetToDefaults,
  };
});

