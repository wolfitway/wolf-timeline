<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useNotesStore } from "@/stores/useNotesStore";
import { useUiStore } from "@/stores/useUiStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import type { Note, TimelineEvent, AiExploration, WebBookmark, MoodImage } from "@/types";

const notesStore = useNotesStore();
const uiStore = useUiStore();
const roadmapStore = useRoadmapStore();

// Accordion states
const showAiExplorations = ref(true);
const showDocs = ref(true);
const showMoodGallery = ref(true);

// Active tag filters
const activeFeedTag = ref<string | null>(null);
const activeDetailTag = ref<string | null>(null);
const activeMoodTag = ref<string | null>(null);

// Layout & Grid options for Mood Gallery
const moodGridCols = ref<number>(3); // 2, 3, or 4

// Drag & Drop tracking
const draggedNoteIndex = ref<number | null>(null);
const draggedEventIndex = ref<number | null>(null);
const draggedAiIndex = ref<number | null>(null);
const draggedDocIndex = ref<number | null>(null);
const draggedMoodIndex = ref<number | null>(null);

/* --- Note Cards Drag & Drop --- */
function onNoteDragStart(index: number) {
  draggedNoteIndex.value = index;
}
function onNoteDragOver(e: DragEvent) {
  e.preventDefault();
}
function onNoteDrop(targetIndex: number) {
  if (draggedNoteIndex.value === null || draggedNoteIndex.value === targetIndex) return;
  const list = [...notesStore.notes];
  const [removed] = list.splice(draggedNoteIndex.value, 1);
  list.splice(targetIndex, 0, removed);
  notesStore.reorderNotes(list);
  draggedNoteIndex.value = null;
  uiStore.showToast("Project cards reordered ✓");
}

/* --- Timeline Events Drag & Drop --- */
function onEventDragStart(index: number) {
  draggedEventIndex.value = index;
}
function onEventDragOver(e: DragEvent) {
  e.preventDefault();
}
function onEventDrop(targetIndex: number) {
  if (draggedEventIndex.value === null || !notesStore.selectedNote?.events) return;
  const list = [...notesStore.selectedNote.events];
  const [removed] = list.splice(draggedEventIndex.value, 1);
  list.splice(targetIndex, 0, removed);
  notesStore.reorderTimelineEvents(notesStore.selectedNote.id, list);
  draggedEventIndex.value = null;
  uiStore.showToast("Timeline events reordered ✓");
}

/* --- AI Explorations Drag & Drop --- */
function onAiDragStart(index: number) {
  draggedAiIndex.value = index;
}
function onAiDragOver(e: DragEvent) {
  e.preventDefault();
}
function onAiDrop(targetIndex: number) {
  if (draggedAiIndex.value === null || !notesStore.selectedNote?.ai_explorations) return;
  const list = [...notesStore.selectedNote.ai_explorations];
  const [removed] = list.splice(draggedAiIndex.value, 1);
  list.splice(targetIndex, 0, removed);
  notesStore.reorderAiExplorations(notesStore.selectedNote.id, list);
  draggedAiIndex.value = null;
  uiStore.showToast("AI explorations reordered ✓");
}

/* --- Bookmarks / Docs Drag & Drop --- */
function onDocDragStart(index: number) {
  draggedDocIndex.value = index;
}
function onDocDragOver(e: DragEvent) {
  e.preventDefault();
}
function onDocDrop(targetIndex: number) {
  if (draggedDocIndex.value === null || !notesStore.selectedNote?.bookmarks) return;
  const list = [...notesStore.selectedNote.bookmarks];
  const [removed] = list.splice(draggedDocIndex.value, 1);
  list.splice(targetIndex, 0, removed);
  notesStore.reorderBookmarks(notesStore.selectedNote.id, list);
  draggedDocIndex.value = null;
  uiStore.showToast("Docs & bookmarks reordered ✓");
}

/* --- Mood Gallery Drag & Drop --- */
function onMoodDragStart(index: number) {
  draggedMoodIndex.value = index;
}
function onMoodDragOver(e: DragEvent) {
  e.preventDefault();
}
function onMoodDrop(targetIndex: number) {
  if (draggedMoodIndex.value === null || !notesStore.selectedNote?.mood_gallery) return;
  const list = [...notesStore.selectedNote.mood_gallery];
  const [removed] = list.splice(draggedMoodIndex.value, 1);
  list.splice(targetIndex, 0, removed);
  notesStore.reorderMoodImages(notesStore.selectedNote.id, list);
  draggedMoodIndex.value = null;
  uiStore.showToast("Mood gallery images reordered ✓");
}

/* =========================================================================
   1. TIMELINE EVENTS CRUD
   ========================================================================= */
const showAddEvent = ref(false);
const newEventTitle = ref("");
const newEventTime = ref("Just now");
const newEventAuthor = ref("You");
const newEventDesc = ref("");
const newEventTags = ref("");

const editingEventId = ref<string | null>(null);
const editEventTitle = ref("");
const editEventTime = ref("");
const editEventAuthor = ref("");
const editEventDesc = ref("");
const editEventTags = ref("");

function handleAddEvent() {
  if (!newEventTitle.value.trim() || !notesStore.selectedNote) return;
  const tagList = newEventTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  const ev: TimelineEvent = {
    id: `ev_${Date.now()}`,
    title: newEventTitle.value.trim(),
    time: newEventTime.value.trim() || "Just now",
    author: newEventAuthor.value.trim() || "You",
    desc: newEventDesc.value.trim(),
    tags: tagList,
  };
  notesStore.addTimelineEvent(notesStore.selectedNote.id, ev);
  newEventTitle.value = "";
  newEventDesc.value = "";
  newEventTags.value = "";
  showAddEvent.value = false;
  uiStore.showToast("Event logged to timeline ✓");
}

function startEditEvent(ev: TimelineEvent) {
  editingEventId.value = ev.id;
  editEventTitle.value = ev.title;
  editEventTime.value = ev.time;
  editEventAuthor.value = ev.author || "You";
  editEventDesc.value = ev.desc;
  editEventTags.value = ev.tags ? ev.tags.join(", ") : "";
}

function handleSaveEditEvent() {
  if (!editingEventId.value || !notesStore.selectedNote) return;
  const tagList = editEventTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  notesStore.updateTimelineEvent(notesStore.selectedNote.id, editingEventId.value, {
    title: editEventTitle.value.trim(),
    time: editEventTime.value.trim() || "Just now",
    author: editEventAuthor.value.trim() || "You",
    desc: editEventDesc.value.trim(),
    tags: tagList,
  });
  editingEventId.value = null;
  uiStore.showToast("Timeline event updated ✓");
}

function handleDeleteEvent(eventId: string) {
  if (!notesStore.selectedNote) return;
  notesStore.deleteTimelineEvent(notesStore.selectedNote.id, eventId);
  uiStore.showToast("Timeline event removed ✓");
}

/* =========================================================================
   2. AI EXPLORATIONS CRUD
   ========================================================================= */
const showAddAi = ref(false);
const newAiTitle = ref("");
const newAiModel = ref("Gemini 2.5 Pro");
const newAiRationale = ref("");
const newAiTranscript = ref("");
const newAiTags = ref("");

const editingAiId = ref<string | null>(null);
const editAiTitle = ref("");
const editAiModel = ref("Gemini 2.5 Pro");
const editAiRationale = ref("");
const editAiTranscript = ref("");
const editAiTags = ref("");

const expandedAiIds = ref<Set<string>>(new Set());

function toggleAiExpanded(id: string) {
  if (expandedAiIds.value.has(id)) {
    expandedAiIds.value.delete(id);
  } else {
    expandedAiIds.value.add(id);
  }
}

function handleAddAi() {
  if (!newAiTitle.value.trim() || !notesStore.selectedNote) return;
  const tagList = newAiTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  const exp: AiExploration = {
    id: `ai_${Date.now()}`,
    title: newAiTitle.value.trim(),
    date: "Just now",
    model: newAiModel.value,
    rationale: newAiRationale.value.trim(),
    transcript: newAiTranscript.value.trim(),
    tags: tagList,
  };
  notesStore.addAiExploration(notesStore.selectedNote.id, exp);
  newAiTitle.value = "";
  newAiRationale.value = "";
  newAiTranscript.value = "";
  newAiTags.value = "";
  showAddAi.value = false;
  uiStore.showToast("AI exploration logged ✓");
}

function startEditAi(ai: AiExploration) {
  editingAiId.value = ai.id;
  editAiTitle.value = ai.title;
  editAiModel.value = ai.model;
  editAiRationale.value = ai.rationale;
  editAiTranscript.value = ai.transcript;
  editAiTags.value = ai.tags ? ai.tags.join(", ") : "";
}

function handleSaveEditAi() {
  if (!editingAiId.value || !notesStore.selectedNote) return;
  const tagList = editAiTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  notesStore.updateAiExploration(notesStore.selectedNote.id, editingAiId.value, {
    title: editAiTitle.value.trim(),
    model: editAiModel.value,
    rationale: editAiRationale.value.trim(),
    transcript: editAiTranscript.value.trim(),
    tags: tagList,
  });
  editingAiId.value = null;
  uiStore.showToast("AI exploration updated ✓");
}

function handleDeleteAi(aiId: string) {
  if (!notesStore.selectedNote) return;
  notesStore.deleteAiExploration(notesStore.selectedNote.id, aiId);
  uiStore.showToast("AI exploration deleted ✓");
}

/* =========================================================================
   3. DOCS & WEB BOOKMARKS CRUD
   ========================================================================= */
const showAddDoc = ref(false);
const newDocTitle = ref("");
const newDocUrl = ref("");
const newDocNote = ref("");
const newDocTags = ref("");

const editingDocId = ref<string | null>(null);
const editDocTitle = ref("");
const editDocUrl = ref("");
const editDocNote = ref("");
const editDocTags = ref("");

function handleAddDoc() {
  if (!newDocTitle.value.trim() || !notesStore.selectedNote) return;
  let domain = "";
  try {
    const parsed = new URL(newDocUrl.value.trim());
    domain = parsed.hostname.replace("www.", "");
  } catch {
    domain = "doc";
  }

  const tagList = newDocTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  const bm: WebBookmark = {
    id: `bm_${Date.now()}`,
    title: newDocTitle.value.trim(),
    url: newDocUrl.value.trim() || "https://wolfnote.local",
    domain,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    note: newDocNote.value.trim() || undefined,
    tags: tagList,
  };
  notesStore.addBookmark(notesStore.selectedNote.id, bm);
  newDocTitle.value = "";
  newDocUrl.value = "";
  newDocNote.value = "";
  newDocTags.value = "";
  showAddDoc.value = false;
  uiStore.showToast("Doc & bookmark linked ✓");
}

function startEditDoc(doc: WebBookmark) {
  editingDocId.value = doc.id;
  editDocTitle.value = doc.title;
  editDocUrl.value = doc.url;
  editDocNote.value = doc.note || "";
  editDocTags.value = doc.tags ? doc.tags.join(", ") : "";
}

function handleSaveEditDoc() {
  if (!editingDocId.value || !notesStore.selectedNote) return;
  let domain = "";
  try {
    const parsed = new URL(editDocUrl.value.trim());
    domain = parsed.hostname.replace("www.", "");
  } catch {
    domain = "doc";
  }
  const tagList = editDocTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  notesStore.updateBookmark(notesStore.selectedNote.id, editingDocId.value, {
    title: editDocTitle.value.trim(),
    url: editDocUrl.value.trim(),
    domain,
    note: editDocNote.value.trim() || undefined,
    tags: tagList,
  });
  editingDocId.value = null;
  uiStore.showToast("Document bookmark updated ✓");
}

function handleDeleteDoc(docId: string) {
  if (!notesStore.selectedNote) return;
  notesStore.deleteBookmark(notesStore.selectedNote.id, docId);
  uiStore.showToast("Document bookmark removed ✓");
}

/* =========================================================================
   4. MOOD GALLERY CRUD & SMART UPLOAD/PASTE
   ========================================================================= */
const showAddMood = ref(false);
const newMoodUrl = ref("");
const newMoodCaption = ref("");
const newMoodTags = ref("");
const moodFileInput = ref<HTMLInputElement | null>(null);
const isDraggingOverDropzone = ref(false);

const editingMoodId = ref<string | null>(null);
const editMoodUrl = ref("");
const editMoodCaption = ref("");
const editMoodTags = ref("");

function handleMoodFileUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUri = uploadEvent.target?.result as string;
      if (files.length === 1) {
        newMoodUrl.value = dataUri;
        if (!newMoodCaption.value) {
          newMoodCaption.value = file.name.replace(/\.[^/.]+$/, "");
        }
      } else {
        // Multi-file upload adds directly to store
        if (notesStore.selectedNote) {
          notesStore.addMoodImage(notesStore.selectedNote.id, {
            id: `mood_${Date.now()}_${i}`,
            url: dataUri,
            caption: file.name.replace(/\.[^/.]+$/, ""),
            tags: ["upload"],
            created_at: new Date().toLocaleDateString(),
          });
        }
      }
    };
    reader.readAsDataURL(file);
  }

  if (files.length > 1) {
    uiStore.showToast(`${files.length} images added to Mood Gallery ✓`);
    showAddMood.value = false;
  }
}

function handleAddMood() {
  if (!newMoodUrl.value.trim() || !notesStore.selectedNote) return;
  const tagList = newMoodTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  const img: MoodImage = {
    id: `mood_${Date.now()}`,
    url: newMoodUrl.value.trim(),
    caption: newMoodCaption.value.trim() || "Visual Reference",
    tags: tagList,
    created_at: new Date().toLocaleDateString(),
  };
  notesStore.addMoodImage(notesStore.selectedNote.id, img);
  newMoodUrl.value = "";
  newMoodCaption.value = "";
  newMoodTags.value = "";
  showAddMood.value = false;
  uiStore.showToast("Visual reference added to Mood Gallery ✓");
}

function startEditMood(img: MoodImage) {
  editingMoodId.value = img.id;
  editMoodUrl.value = img.url;
  editMoodCaption.value = img.caption;
  editMoodTags.value = img.tags ? img.tags.join(", ") : "";
}

function handleSaveEditMood() {
  if (!editingMoodId.value || !notesStore.selectedNote) return;
  const tagList = editMoodTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  notesStore.updateMoodImage(notesStore.selectedNote.id, editingMoodId.value, {
    url: editMoodUrl.value.trim(),
    caption: editMoodCaption.value.trim(),
    tags: tagList,
  });
  editingMoodId.value = null;
  uiStore.showToast("Mood reference updated ✓");
}

function handleDeleteMood(imgId: string) {
  if (!notesStore.selectedNote) return;
  notesStore.deleteMoodImage(notesStore.selectedNote.id, imgId);
  uiStore.showToast("Mood reference removed ✓");
}

function openMoodLightbox(index: number) {
  if (!notesStore.selectedNote?.mood_gallery) return;
  const galleryList = filteredMoodGallery.value.map((m) => ({
    url: m.url,
    caption: m.caption,
    tags: m.tags,
  }));
  uiStore.openGalleryLightbox(galleryList, index);
}

// Clipboard Paste support for images
function handleGlobalPaste(e: ClipboardEvent) {
  if (!e.clipboardData) return;
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUri = uploadEvent.target?.result as string;
        if (notesStore.selectedNote) {
          notesStore.addMoodImage(notesStore.selectedNote.id, {
            id: `mood_${Date.now()}`,
            url: dataUri,
            caption: `Pasted Visual (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
            tags: ["clipboard", "moodboard"],
            created_at: new Date().toLocaleDateString(),
          });
          uiStore.showToast("Pasted image added to Mood Gallery ✓");
          showMoodGallery.value = true;
        }
      };
      reader.readAsDataURL(file);
      break;
    }
  }
}

onMounted(() => {
  window.addEventListener("paste", handleGlobalPaste);
});

onUnmounted(() => {
  window.removeEventListener("paste", handleGlobalPaste);
});

/* =========================================================================
   5. PROJECT NOTE ACTIONS & STATUS PICKER
   ========================================================================= */
const isEditingNoteTitle = ref(false);
const editNoteTitle = ref("");

function startEditingNoteTitle() {
  if (!notesStore.selectedNote) return;
  editNoteTitle.value = notesStore.selectedNote.title;
  isEditingNoteTitle.value = true;
}

function saveNoteTitle() {
  if (!notesStore.selectedNote || !editNoteTitle.value.trim()) return;
  notesStore.updateNote(notesStore.selectedNote.id, { title: editNoteTitle.value.trim() });
  isEditingNoteTitle.value = false;
  uiStore.showToast("Project title updated ✓");
}

function cycleNoteStatus() {
  if (!notesStore.selectedNote) return;
  const statuses: Array<Note["status"]> = ["ideation", "research", "design", "in_progress", "shipped", "backlog"];
  const curIdx = statuses.indexOf(notesStore.selectedNote.status);
  const nextStatus = statuses[(curIdx + 1) % statuses.length];
  notesStore.updateNote(notesStore.selectedNote.id, { status: nextStatus });
  uiStore.showToast(`Status changed to ${getStatusBadge(nextStatus).label} ✓`);
}

function handlePushToRoadmap() {
  if (!notesStore.selectedNote) return;
  const note = notesStore.selectedNote;
  roadmapStore.addPhase(note.title);
  uiStore.showToast(`Pushed "${note.title}" to Roadmap Canvas ✓`);
  uiStore.setTab("roadmap");
}

function handleAddToVault() {
  if (!notesStore.selectedNote) return;
  uiStore.showSecretEditor = true;
}

function handleOpenInStudio() {
  uiStore.setTab("studio");
}

function handleDeleteSelectedNote() {
  if (!notesStore.selectedNote) return;
  if (confirm(`Delete project "${notesStore.selectedNote.title}"?`)) {
    notesStore.deleteNote(notesStore.selectedNote.id);
    uiStore.showToast("Note deleted ✓");
  }
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "research":
      return { label: "Research", color: "#06b6d4" };
    case "design":
      return { label: "Design", color: "#a855f7" };
    case "backlog":
      return { label: "Backlog", color: "#6b7280" };
    case "in_progress":
      return { label: "In Progress", color: "#10b981" };
    case "live":
    case "shipped":
      return { label: "Shipped", color: "#22c55e" };
    case "ideation":
    default:
      return { label: "Ideation", color: "#10b981" };
  }
}

function getRelativeTime(note: any): string {
  if (note.id === 1) return "10m ago";
  if (note.id === 2) return "5h ago";
  if (note.id === 3) return "2h ago";
  if (note.id === 4) return "6h ago";
  if (note.id === 5) return "2d ago";
  return "Recent";
}

/* =========================================================================
   6. COMPUTED FILTERING & COUNTS
   ========================================================================= */
const allTopTags = computed(() => {
  const map = new Map<string, number>();
  notesStore.notes.forEach((n) => {
    n.tags?.forEach((t) => map.set(t, (map.get(t) || 0) + 1));
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);
});

const filteredNotesList = computed(() => {
  let list = notesStore.filteredNotes;
  if (activeFeedTag.value) {
    list = list.filter((n) => n.tags?.includes(activeFeedTag.value!));
  }
  return list;
});

const selectedNoteAllTags = computed(() => {
  if (!notesStore.selectedNote) return [];
  const set = new Set<string>();
  notesStore.selectedNote.tags?.forEach((t) => set.add(t));
  notesStore.selectedNote.events?.forEach((e) => e.tags?.forEach((t) => set.add(t)));
  notesStore.selectedNote.ai_explorations?.forEach((a) => a.tags?.forEach((t) => set.add(t)));
  notesStore.selectedNote.bookmarks?.forEach((b) => b.tags?.forEach((t) => set.add(t)));
  notesStore.selectedNote.mood_gallery?.forEach((m) => m.tags?.forEach((t) => set.add(t)));
  return Array.from(set);
});

const noteMoodTags = computed(() => {
  if (!notesStore.selectedNote?.mood_gallery) return [];
  const set = new Set<string>();
  notesStore.selectedNote.mood_gallery.forEach((m) => m.tags?.forEach((t) => set.add(t)));
  return Array.from(set);
});

const filteredMoodGallery = computed(() => {
  const gallery = notesStore.selectedNote?.mood_gallery || [];
  if (activeMoodTag.value) {
    return gallery.filter((m) => m.tags?.includes(activeMoodTag.value!));
  }
  if (activeDetailTag.value) {
    return gallery.filter((m) => m.tags?.includes(activeDetailTag.value!));
  }
  return gallery;
});

const filteredEvents = computed(() => {
  const events = notesStore.selectedNote?.events || [];
  if (activeDetailTag.value) {
    return events.filter((e) => e.tags?.includes(activeDetailTag.value!));
  }
  return events;
});

const filteredAiExplorations = computed(() => {
  const exps = notesStore.selectedNote?.ai_explorations || [];
  if (activeDetailTag.value) {
    return exps.filter((a) => a.tags?.includes(activeDetailTag.value!));
  }
  return exps;
});

const filteredBookmarks = computed(() => {
  const bms = notesStore.selectedNote?.bookmarks || [];
  if (activeDetailTag.value) {
    return bms.filter((b) => b.tags?.includes(activeDetailTag.value!));
  }
  return bms;
});

function toggleFeedTag(tag: string) {
  if (activeFeedTag.value === tag) {
    activeFeedTag.value = null;
  } else {
    activeFeedTag.value = tag;
  }
}

function toggleDetailTag(tag: string) {
  if (activeDetailTag.value === tag) {
    activeDetailTag.value = null;
  } else {
    activeDetailTag.value = tag;
  }
}

function toggleMoodTag(tag: string) {
  if (activeMoodTag.value === tag) {
    activeMoodTag.value = null;
  } else {
    activeMoodTag.value = tag;
  }
}
</script>

<template>
  <div class="timeline-view">
    <!-- Left Column: Cards Feed with Search & Drag-and-Drop -->
    <div class="cards-column">
      <!-- Full Width Glowing Green Quick Capture Button -->
      <button
        type="button"
        class="btn-quick-capture-hero"
        @click="uiStore.showQuickCapture = true"
        title="Quick Capture (⌘+Enter)"
      >
        <span class="plus-symbol">+</span>
        <span>Quick Capture</span>
      </button>

      <!-- Search Filter Bar -->
      <div class="feed-search-wrap">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" class="search-icon-left">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="notesStore.searchQuery"
          type="text"
          class="feed-search-input"
          placeholder="Filter projects, tags, text... (⌘K)"
        />
        <button
          v-if="notesStore.searchQuery"
          type="button"
          class="btn-clear-search"
          @click="notesStore.searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Feed Tags Filter Strip -->
      <div v-if="allTopTags.length" class="feed-tags-strip">
        <button
          type="button"
          class="tag-filter-chip"
          :class="{ active: activeFeedTag === null }"
          @click="activeFeedTag = null"
        >
          All
        </button>
        <button
          v-for="tag in allTopTags"
          :key="tag"
          type="button"
          class="tag-filter-chip"
          :class="{ active: activeFeedTag === tag }"
          @click="toggleFeedTag(tag)"
        >
          #{{ tag }}
        </button>
      </div>

      <!-- Cards Feed List -->
      <div class="cards-feed-list">
        <div
          v-for="(note, index) in filteredNotesList"
          :key="note.id"
          class="project-card"
          :class="{ selected: notesStore.selectedNote?.id === note.id }"
          draggable="true"
          @dragstart="onNoteDragStart(index)"
          @dragover="onNoteDragOver"
          @drop="onNoteDrop(index)"
          @click="notesStore.selectedNoteId = note.id"
        >
          <div class="card-title-row">
            <h3 class="card-title">{{ note.title }}</h3>
            <span class="card-drag-handle" title="Drag to reorder">⋮</span>
          </div>

          <p class="card-body-preview">{{ note.body }}</p>

          <div class="card-footer-row">
            <!-- Status Pill -->
            <div class="card-status-pill">
              <span
                class="status-dot"
                :style="{ background: getStatusBadge(note.status).color, boxShadow: `0 0 6px ${getStatusBadge(note.status).color}` }"
              ></span>
              <span class="status-label">{{ getStatusBadge(note.status).label }}</span>
            </div>

            <!-- Tags -->
            <div class="card-tags-list">
              <span
                v-for="tag in note.tags"
                :key="tag"
                class="card-tag-pill"
                @click.stop="toggleFeedTag(tag)"
                title="Filter by tag"
              >
                #{{ tag }}
              </span>
            </div>

            <!-- Timestamp -->
            <span class="card-time-ago">{{ getRelativeTime(note) }}</span>
          </div>
        </div>

        <div v-if="filteredNotesList.length === 0" class="cards-empty-state">
          <span>No projects match your filter.</span>
          <button v-if="activeFeedTag || notesStore.searchQuery" type="button" class="btn-reset-filters" @click="activeFeedTag = null; notesStore.searchQuery = ''">
            Clear filters
          </button>
        </div>
      </div>
    </div>

    <!-- Right Column: Detail Inspector Panel -->
    <div v-if="notesStore.selectedNote" class="detail-column">
      <div class="detail-card-panel">
        <!-- Detail Header: Title, Status Picker & Actions -->
        <div class="detail-header-section">
          <div class="detail-title-top-row">
            <div v-if="!isEditingNoteTitle" class="title-display-wrap" @dblclick="startEditingNoteTitle">
              <h1 class="detail-title">{{ notesStore.selectedNote.title }}</h1>
              <button type="button" class="btn-edit-title" @click="startEditingNoteTitle" title="Edit project title">✏️</button>
            </div>
            <div v-else class="title-edit-wrap">
              <input
                v-model="editNoteTitle"
                type="text"
                class="title-inline-input"
                @keydown.enter="saveNoteTitle"
                @keydown.esc="isEditingNoteTitle = false"
                autofocus
              />
              <button type="button" class="btn-title-save" @click="saveNoteTitle">Save</button>
              <button type="button" class="btn-title-cancel" @click="isEditingNoteTitle = false">✕</button>
            </div>

            <div class="header-action-group">
              <button
                type="button"
                class="btn-icon-action"
                @click="handleDeleteSelectedNote"
                title="Delete Project Note"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="detail-meta-pills">
            <div class="meta-status-pill clickable" @click="cycleNoteStatus" title="Click to cycle status">
              <span
                class="status-dot"
                :style="{ background: getStatusBadge(notesStore.selectedNote.status).color, boxShadow: `0 0 6px ${getStatusBadge(notesStore.selectedNote.status).color}` }"
              ></span>
              <span>{{ getStatusBadge(notesStore.selectedNote.status).label }} ▾</span>
            </div>
            <div class="meta-updated-pill">
              <span>Updated {{ getRelativeTime(notesStore.selectedNote) }}</span>
            </div>
            <div v-if="notesStore.selectedNote.funnel_stage" class="meta-stage-pill">
              <span>Funnel: {{ notesStore.selectedNote.funnel_stage }}</span>
            </div>
          </div>

          <!-- Selected Note Tag Filter Strip -->
          <div v-if="selectedNoteAllTags.length" class="detail-tags-bar">
            <span class="detail-tag-label">Filter Resource Tags:</span>
            <button
              type="button"
              class="tag-filter-chip sm"
              :class="{ active: activeDetailTag === null }"
              @click="activeDetailTag = null"
            >
              All
            </button>
            <button
              v-for="t in selectedNoteAllTags"
              :key="t"
              type="button"
              class="tag-filter-chip sm"
              :class="{ active: activeDetailTag === t }"
              @click="toggleDetailTag(t)"
            >
              #{{ t }}
            </button>
          </div>
        </div>

        <!-- Notes Section with Deep Focus Trigger -->
        <div class="detail-section">
          <div class="section-title-row">
            <h2 class="section-title">Notes</h2>
            <button
              type="button"
              class="btn-expand-focus"
              @click="uiStore.showFocusEditor = true"
              title="Expand to Full Focus Mode (⤢)"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
          </div>
          <p class="notes-body-text">{{ notesStore.selectedNote.body }}</p>
        </div>

        <!-- 1. Timeline Section with Drag & Drop Reordering and Full CRUD -->
        <div class="detail-section timeline-section">
          <div class="section-title-row">
            <h2 class="section-title">Timeline ({{ filteredEvents.length }})</h2>
            <span class="section-reorder-hint">Drag dots to reorder</span>
          </div>

          <div class="vertical-timeline-tree">
            <div
              v-for="(ev, idx) in filteredEvents"
              :key="ev.id"
              class="timeline-node-row"
              draggable="true"
              @dragstart="onEventDragStart(idx)"
              @dragover="onEventDragOver"
              @drop="onEventDrop(idx)"
            >
              <div class="timeline-axis">
                <div
                  class="timeline-dot"
                  :class="{ 'first-dot': idx === 0, 'subsequent-dot': idx > 0 }"
                  title="Drag dot to reorder event"
                ></div>
                <div
                  v-if="idx < filteredEvents.length - 1"
                  class="timeline-connector-line"
                ></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-header-line">
                  <div class="event-title-wrap">
                    <span class="timeline-event-title">{{ ev.title }}</span>
                    <span v-if="ev.author" class="timeline-event-author">by {{ ev.author }}</span>
                  </div>
                  <div class="timeline-item-actions">
                    <span class="timeline-event-time">{{ ev.time }}</span>
                    <button type="button" class="btn-item-icon" @click="startEditEvent(ev)" title="Edit Event">✏️</button>
                    <button type="button" class="btn-item-icon danger" @click="handleDeleteEvent(ev.id)" title="Delete Event">✕</button>
                  </div>
                </div>
                <p class="timeline-event-desc">{{ ev.desc }}</p>
                <div v-if="ev.tags?.length" class="inline-tags-row">
                  <span
                    v-for="t in ev.tags"
                    :key="t"
                    class="resource-tag-pill clickable"
                    @click="toggleDetailTag(t)"
                  >
                    #{{ t }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="filteredEvents.length === 0" class="resource-empty-hint">
              <span>No timeline events match the active tag filter.</span>
            </div>
          </div>

          <!-- Edit Event Inline Modal/Card -->
          <div v-if="editingEventId" class="inline-adder-card edit-mode">
            <div class="adder-header">
              <span class="card-edit-badge">Editing Timeline Event</span>
              <button type="button" class="btn-item-icon" @click="editingEventId = null">✕</button>
            </div>
            <input v-model="editEventTitle" type="text" class="adder-input" placeholder="Event title..." />
            <div class="adder-input-row">
              <input v-model="editEventTime" type="text" class="adder-input" placeholder="Time (e.g. 10m ago)..." />
              <input v-model="editEventAuthor" type="text" class="adder-input" placeholder="Author (e.g. You)..." />
            </div>
            <textarea v-model="editEventDesc" class="adder-textarea" placeholder="Event details..."></textarea>
            <input v-model="editEventTags" type="text" class="adder-input" placeholder="Tags (comma-separated, e.g. canary, k8s)..." />
            <div class="adder-actions">
              <button type="button" class="btn-adder-cancel" @click="editingEventId = null">Cancel</button>
              <button type="button" class="btn-adder-save" @click="handleSaveEditEvent">Update Event</button>
            </div>
          </div>

          <!-- Add Event Trigger -->
          <div class="add-event-wrap">
            <button
              v-if="!showAddEvent && !editingEventId"
              type="button"
              class="btn-add-timeline-link"
              @click="showAddEvent = true"
            >
              <span class="plus-icon">+</span>
              <span>Add Timeline Event</span>
            </button>

            <!-- Inline Add Event Form -->
            <div v-else-if="showAddEvent" class="inline-adder-card">
              <div class="adder-header">
                <span class="card-edit-badge">New Timeline Event</span>
                <button type="button" class="btn-item-icon" @click="showAddEvent = false">✕</button>
              </div>
              <input
                v-model="newEventTitle"
                type="text"
                class="adder-input"
                placeholder="Event title (e.g. Canary Deploy Initiated)..."
                @keydown.enter="handleAddEvent"
              />
              <div class="adder-input-row">
                <input v-model="newEventTime" type="text" class="adder-input" placeholder="Time (default: Just now)" />
                <input v-model="newEventAuthor" type="text" class="adder-input" placeholder="Author (default: You)" />
              </div>
              <textarea
                v-model="newEventDesc"
                class="adder-textarea"
                placeholder="Event details & summary..."
              ></textarea>
              <input
                v-model="newEventTags"
                type="text"
                class="adder-input"
                placeholder="Tags (comma-separated, e.g. capture, devops)..."
                @keydown.enter="handleAddEvent"
              />
              <div class="adder-actions">
                <button type="button" class="btn-adder-cancel" @click="showAddEvent = false">Cancel</button>
                <button type="button" class="btn-adder-save" @click="handleAddEvent">Save Event</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Collapsible AI Explorations Section with Full CRUD & Reasoning Drawer -->
        <div class="collapsible-section">
          <button
            type="button"
            class="collapsible-header"
            @click="showAiExplorations = !showAiExplorations"
          >
            <div class="collapsible-left">
              <span class="chevron-icon">{{ showAiExplorations ? "⌃" : "⌄" }}</span>
              <span class="collapsible-title">AI Explorations</span>
            </div>
            <span class="collapsible-count-pill">{{ filteredAiExplorations.length }}</span>
          </button>

          <div v-if="showAiExplorations" class="collapsible-content">
            <div v-if="filteredAiExplorations.length" class="ai-cards-stack">
              <div
                v-for="(ai, idx) in filteredAiExplorations"
                :key="ai.id"
                class="ai-exploration-banner"
                draggable="true"
                @dragstart="onAiDragStart(idx)"
                @dragover="onAiDragOver"
                @drop="onAiDrop(idx)"
              >
                <div class="ai-banner-left">
                  <span class="ai-drag-dots" title="Drag to reorder">⋮⋮</span>
                  <div class="ai-banner-info">
                    <div class="ai-banner-title-row">
                      <span class="ai-banner-title">{{ ai.title }}</span>
                      <span class="ai-banner-model-pill">{{ ai.model }}</span>
                      <span class="ai-banner-meta">• {{ ai.date }}</span>
                    </div>

                    <p v-if="ai.rationale" class="ai-inline-rationale">{{ ai.rationale }}</p>

                    <button
                      v-if="ai.transcript"
                      type="button"
                      class="btn-toggle-transcript"
                      @click="toggleAiExpanded(ai.id)"
                    >
                      {{ expandedAiIds.has(ai.id) ? "Hide AI Reasoning ▲" : "View AI Reasoning / Transcript ▼" }}
                    </button>

                    <div v-if="expandedAiIds.has(ai.id) && ai.transcript" class="ai-transcript-box">
                      <pre class="ai-transcript-text">{{ ai.transcript }}</pre>
                    </div>

                    <div v-if="ai.tags?.length" class="inline-tags-row">
                      <span
                        v-for="t in ai.tags"
                        :key="t"
                        class="resource-tag-pill clickable"
                        @click="toggleDetailTag(t)"
                      >
                        #{{ t }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="ai-banner-actions">
                  <span class="badge-link-pill">LINK</span>
                  <button type="button" class="btn-item-icon" @click="startEditAi(ai)" title="Edit AI Exploration">✏️</button>
                  <button type="button" class="btn-item-icon danger" @click="handleDeleteAi(ai.id)" title="Delete AI Exploration">✕</button>
                </div>
              </div>
            </div>

            <div v-else class="resource-empty-hint">
              <span>No AI explorations match the active tag filter.</span>
            </div>

            <!-- Edit AI Exploration Form -->
            <div v-if="editingAiId" class="inline-adder-card edit-mode">
              <div class="adder-header">
                <span class="card-edit-badge">Editing AI Exploration</span>
                <button type="button" class="btn-item-icon" @click="editingAiId = null">✕</button>
              </div>
              <input v-model="editAiTitle" type="text" class="adder-input" placeholder="Exploration topic..." />
              <select v-model="editAiModel" class="adder-input">
                <option value="Gemini 2.5 Pro">Gemini 2.5 Pro</option>
                <option value="Gemini 2.5 Flash">Gemini 2.5 Flash</option>
                <option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="DeepSeek R1">DeepSeek R1</option>
                <option value="Local LLM">Local LLM</option>
              </select>
              <input v-model="editAiRationale" type="text" class="adder-input" placeholder="Decision rationale / takeaway..." />
              <textarea v-model="editAiTranscript" class="adder-textarea" placeholder="AI transcript / reasoning..."></textarea>
              <input v-model="editAiTags" type="text" class="adder-input" placeholder="Tags (comma-separated)..." />
              <div class="adder-actions">
                <button type="button" class="btn-adder-cancel" @click="editingAiId = null">Cancel</button>
                <button type="button" class="btn-adder-save" @click="handleSaveEditAi">Update Exploration</button>
              </div>
            </div>

            <button
              v-if="!showAddAi && !editingAiId"
              type="button"
              class="btn-inline-add"
              @click="showAddAi = true"
            >
              + Log AI Exploration
            </button>

            <!-- Add AI Form -->
            <div v-else-if="showAddAi" class="inline-adder-card">
              <div class="adder-header">
                <span class="card-edit-badge">New AI Exploration</span>
                <button type="button" class="btn-item-icon" @click="showAddAi = false">✕</button>
              </div>
              <input v-model="newAiTitle" type="text" class="adder-input" placeholder="Exploration topic..." />
              <select v-model="newAiModel" class="adder-input">
                <option value="Gemini 2.5 Pro">Gemini 2.5 Pro</option>
                <option value="Gemini 2.5 Flash">Gemini 2.5 Flash</option>
                <option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="DeepSeek R1">DeepSeek R1</option>
                <option value="Local LLM">Local LLM</option>
              </select>
              <input v-model="newAiRationale" type="text" class="adder-input" placeholder="Decision rationale / takeaway..." />
              <textarea v-model="newAiTranscript" class="adder-textarea" placeholder="AI transcript / reasoning..."></textarea>
              <input v-model="newAiTags" type="text" class="adder-input" placeholder="Tags (comma-separated, e.g. canary, rag)..." />
              <div class="adder-actions">
                <button type="button" class="btn-adder-cancel" @click="showAddAi = false">Cancel</button>
                <button type="button" class="btn-adder-save" @click="handleAddAi">Save Exploration</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Collapsible Docs & Bookmarks Section with Full CRUD -->
        <div class="collapsible-section">
          <button
            type="button"
            class="collapsible-header"
            @click="showDocs = !showDocs"
          >
            <div class="collapsible-left">
              <span class="chevron-icon">{{ showDocs ? "⌃" : "⌄" }}</span>
              <span class="collapsible-title">Docs & Specs</span>
            </div>
            <span class="collapsible-count-pill">{{ filteredBookmarks.length }}</span>
          </button>

          <div v-if="showDocs" class="collapsible-content">
            <div v-if="filteredBookmarks.length" class="docs-stack">
              <div
                v-for="(doc, idx) in filteredBookmarks"
                :key="doc.id"
                class="doc-item"
                draggable="true"
                @dragstart="onDocDragStart(idx)"
                @dragover="onDocDragOver"
                @drop="onDocDrop(idx)"
              >
                <div class="doc-item-left">
                  <div class="doc-title-row">
                    <span class="card-drag-handle sm" title="Drag to reorder">⋮</span>
                    <span class="doc-title">{{ doc.title }}</span>
                    <span class="doc-domain-badge">{{ doc.domain }}</span>
                  </div>
                  <a :href="doc.url" target="_blank" rel="noopener noreferrer" class="doc-link">
                    🔗 {{ doc.url }}
                  </a>
                  <span v-if="doc.note" class="doc-note">{{ doc.note }}</span>
                  <div v-if="doc.tags?.length" class="inline-tags-row">
                    <span
                      v-for="t in doc.tags"
                      :key="t"
                      class="resource-tag-pill clickable"
                      @click="toggleDetailTag(t)"
                    >
                      #{{ t }}
                    </span>
                  </div>
                </div>
                <div class="doc-item-actions">
                  <button type="button" class="btn-item-icon" @click="startEditDoc(doc)" title="Edit Doc">✏️</button>
                  <button type="button" class="btn-item-icon danger" @click="handleDeleteDoc(doc.id)" title="Delete Doc">✕</button>
                </div>
              </div>
            </div>

            <div v-else class="resource-empty-hint">
              <span>No documentation links match the active tag filter.</span>
            </div>

            <!-- Edit Doc Form -->
            <div v-if="editingDocId" class="inline-adder-card edit-mode">
              <div class="adder-header">
                <span class="card-edit-badge">Editing Document</span>
                <button type="button" class="btn-item-icon" @click="editingDocId = null">✕</button>
              </div>
              <input v-model="editDocTitle" type="text" class="adder-input" placeholder="Document title..." />
              <input v-model="editDocUrl" type="text" class="adder-input" placeholder="URL / spec link..." />
              <input v-model="editDocNote" type="text" class="adder-input" placeholder="Takeaway note..." />
              <input v-model="editDocTags" type="text" class="adder-input" placeholder="Tags (comma-separated)..." />
              <div class="adder-actions">
                <button type="button" class="btn-adder-cancel" @click="editingDocId = null">Cancel</button>
                <button type="button" class="btn-adder-save" @click="handleSaveEditDoc">Update Doc</button>
              </div>
            </div>

            <button
              v-if="!showAddDoc && !editingDocId"
              type="button"
              class="btn-inline-add"
              @click="showAddDoc = true"
            >
              + Link Document
            </button>

            <!-- Add Doc Form -->
            <div v-else-if="showAddDoc" class="inline-adder-card">
              <div class="adder-header">
                <span class="card-edit-badge">New Document Bookmark</span>
                <button type="button" class="btn-item-icon" @click="showAddDoc = false">✕</button>
              </div>
              <input v-model="newDocTitle" type="text" class="adder-input" placeholder="Document title..." />
              <input v-model="newDocUrl" type="text" class="adder-input" placeholder="https://... URL / spec link" />
              <input v-model="newDocNote" type="text" class="adder-input" placeholder="Takeaway note (optional)..." />
              <input v-model="newDocTags" type="text" class="adder-input" placeholder="Tags (comma-separated)..." />
              <div class="adder-actions">
                <button type="button" class="btn-adder-cancel" @click="showAddDoc = false">Cancel</button>
                <button type="button" class="btn-adder-save" @click="handleAddDoc">Save Doc</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Refactored Mood Gallery Section with Full CRUD, Tags, Drag & Drop, and Lightbox -->
        <div class="collapsible-section mood-gallery-section">
          <div class="collapsible-header-row">
            <button
              type="button"
              class="collapsible-header"
              @click="showMoodGallery = !showMoodGallery"
            >
              <div class="collapsible-left">
                <span class="chevron-icon">{{ showMoodGallery ? "⌃" : "⌄" }}</span>
                <span class="collapsible-title">Mood Gallery & Visual References</span>
              </div>
              <span class="collapsible-count-pill">{{ filteredMoodGallery.length }}</span>
            </button>

            <!-- Gallery Controls Toolbar -->
            <div v-if="showMoodGallery" class="gallery-controls-toolbar">
              <div class="grid-layout-buttons">
                <button
                  type="button"
                  class="btn-grid-layout"
                  :class="{ active: moodGridCols === 2 }"
                  @click="moodGridCols = 2"
                  title="2 Columns"
                >
                  2col
                </button>
                <button
                  type="button"
                  class="btn-grid-layout"
                  :class="{ active: moodGridCols === 3 }"
                  @click="moodGridCols = 3"
                  title="3 Columns"
                >
                  3col
                </button>
                <button
                  type="button"
                  class="btn-grid-layout"
                  :class="{ active: moodGridCols === 4 }"
                  @click="moodGridCols = 4"
                  title="4 Columns"
                >
                  4col
                </button>
              </div>

              <button
                type="button"
                class="btn-add-mood-quick"
                @click="showAddMood = !showAddMood"
                title="Add Image"
              >
                + Add Image
              </button>
            </div>
          </div>

          <div v-if="showMoodGallery" class="collapsible-content">
            <!-- Mood Gallery Dedicated Tags Filter Strip -->
            <div v-if="noteMoodTags.length" class="mood-tags-filter-bar">
              <span class="mood-tag-label">Mood Tags:</span>
              <button
                type="button"
                class="tag-filter-chip sm"
                :class="{ active: activeMoodTag === null }"
                @click="activeMoodTag = null"
              >
                All ({{ notesStore.selectedNote.mood_gallery?.length || 0 }})
              </button>
              <button
                v-for="tag in noteMoodTags"
                :key="tag"
                type="button"
                class="tag-filter-chip sm"
                :class="{ active: activeMoodTag === tag }"
                @click="toggleMoodTag(tag)"
              >
                #{{ tag }}
              </button>
            </div>

            <!-- Mood Gallery Grid -->
            <div
              v-if="filteredMoodGallery.length"
              class="mood-grid"
              :class="`cols-${moodGridCols}`"
            >
              <div
                v-for="(img, idx) in filteredMoodGallery"
                :key="img.id"
                class="mood-card-item"
                draggable="true"
                @dragstart="onMoodDragStart(idx)"
                @dragover="onMoodDragOver"
                @drop="onMoodDrop(idx)"
              >
                <div class="mood-img-wrap" @click="openMoodLightbox(idx)">
                  <img :src="img.url" :alt="img.caption" class="mood-thumb" loading="lazy" />
                  <div class="mood-img-overlay">
                    <span class="zoom-badge">🔍 Enlarge ({{ idx + 1 }}/{{ filteredMoodGallery.length }})</span>
                  </div>
                  <span class="card-drag-handle-badge" title="Drag to reorder">⋮</span>
                </div>

                <div class="mood-meta-row">
                  <span class="mood-caption-label" :title="img.caption">{{ img.caption }}</span>
                  <div class="mood-btn-group">
                    <button type="button" class="btn-item-icon" @click="startEditMood(img)" title="Edit Image">✏️</button>
                    <button type="button" class="btn-item-icon danger" @click="handleDeleteMood(img.id)" title="Delete Image">✕</button>
                  </div>
                </div>

                <div v-if="img.tags?.length" class="mood-tags-row">
                  <span
                    v-for="t in img.tags"
                    :key="t"
                    class="resource-tag-pill clickable"
                    @click="toggleMoodTag(t)"
                  >
                    #{{ t }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="resource-empty-hint">
              <span>No mood images found. Click "+ Add Image" or paste (⌘V) an image from your clipboard!</span>
            </div>

            <!-- Edit Mood Item Form -->
            <div v-if="editingMoodId" class="inline-adder-card edit-mode">
              <div class="adder-header">
                <span class="card-edit-badge">Editing Visual Reference</span>
                <button type="button" class="btn-item-icon" @click="editingMoodId = null">✕</button>
              </div>
              <input v-model="editMoodCaption" type="text" class="adder-input" placeholder="Caption / title..." />
              <input v-model="editMoodUrl" type="text" class="adder-input" placeholder="Image URL / data URI..." />
              <input v-model="editMoodTags" type="text" class="adder-input" placeholder="Tags (comma-separated)..." />
              <div class="adder-actions">
                <button type="button" class="btn-adder-cancel" @click="editingMoodId = null">Cancel</button>
                <button type="button" class="btn-adder-save" @click="handleSaveEditMood">Update Reference</button>
              </div>
            </div>

            <!-- Add Mood Form with File Dropzone & URL Input -->
            <div v-if="showAddMood" class="inline-adder-card">
              <div class="adder-header">
                <span class="card-edit-badge">Add Visual Reference</span>
                <button type="button" class="btn-item-icon" @click="showAddMood = false">✕</button>
              </div>

              <div
                class="mood-upload-zone"
                :class="{ 'dropzone-active': isDraggingOverDropzone }"
                @dragover.prevent="isDraggingOverDropzone = true"
                @dragleave.prevent="isDraggingOverDropzone = false"
                @drop.prevent="isDraggingOverDropzone = false; handleMoodFileUpload($event)"
                @click="moodFileInput?.click()"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Click or Drag & Drop Images Here (.jpg, .png, .webp, .svg)</span>
                <span class="upload-hint-sub">Supports multi-file upload & direct clipboard paste (⌘V)</span>
                <input
                  ref="moodFileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden-file-input"
                  @change="handleMoodFileUpload"
                />
              </div>

              <span class="upload-or-divider">─── or paste image URL ───</span>

              <input v-model="newMoodUrl" type="text" class="adder-input" placeholder="https://... or data:image/..." />
              <input v-model="newMoodCaption" type="text" class="adder-input" placeholder="Caption / description (e.g. Cyber-Obsidian UI)..." />
              <input v-model="newMoodTags" type="text" class="adder-input" placeholder="Tags (comma-separated, e.g. ui, obsidian, neon)..." />

              <div class="adder-actions">
                <button type="button" class="btn-adder-cancel" @click="showAddMood = false">Cancel</button>
                <button type="button" class="btn-adder-save" @click="handleAddMood">Add to Gallery</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Actions Row -->
        <div class="detail-actions-row">
          <button type="button" class="btn-panel-action" @click="handlePushToRoadmap">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>Push to Roadmap</span>
          </button>

          <button type="button" class="btn-panel-action" @click="handleAddToVault">
            <span class="action-icon">🔐</span>
            <span>Add to Vault</span>
          </button>

          <button type="button" class="btn-panel-action" @click="handleOpenInStudio">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Open in Studio</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-view {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  height: calc(100vh - 56px);
  padding: 16px 24px 20px 24px;
  overflow: hidden;
  box-sizing: border-box;
}

/* =========================================================================
   Left Column: Hero Quick Capture, Search Bar, and Cards Feed
   ========================================================================= */
.cards-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow: hidden;
}

.btn-quick-capture-hero {
  width: 100%;
  height: 42px;
  min-height: 42px;
  background: #10b981;
  border: none;
  border-radius: 8px;
  color: #03120a;
  font-size: 13.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.3);
}

.btn-quick-capture-hero:hover {
  background: #34d399;
  transform: translateY(-1px);
  box-shadow: 0 0 22px rgba(16, 185, 129, 0.5);
}

.plus-symbol {
  font-size: 16px;
  font-weight: 800;
}

/* Search Bar in Feed */
.feed-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #05120c;
  border: 1px solid #0f271d;
  border-radius: 8px;
  padding: 8px 12px;
}

.search-icon-left {
  color: #64748b;
}

.feed-search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 12px;
  color: #ffffff;
  outline: none;
}

.feed-search-input::placeholder {
  color: #64748b;
}

.btn-clear-search {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 11px;
}

/* Feed Tags Strip */
.feed-tags-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding: 2px 0 4px 0;
}

.feed-tags-strip::-webkit-scrollbar {
  height: 3px;
}

.tag-filter-chip {
  background: #061710;
  border: 1px solid #0f2d20;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.tag-filter-chip:hover {
  border-color: #10b981;
  color: #a7f3d0;
}

.tag-filter-chip.active {
  background: #10b981;
  color: #03140b;
  border-color: #10b981;
  font-weight: 700;
}

.tag-filter-chip.sm {
  font-size: 10px;
  padding: 2px 7px;
}

/* Cards Feed */
.cards-feed-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}

.project-card {
  background: #071510;
  border: 1px solid #0f271d;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: grab;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.project-card:active {
  cursor: grabbing;
}

.project-card:hover {
  background: #091a13;
  border-color: #143829;
}

.project-card.selected {
  background: #061912;
  border: 1.5px solid #10b981;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.08);
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
}

.card-drag-handle {
  color: #4b5563;
  font-size: 14px;
}

.card-drag-handle.sm {
  font-size: 11px;
  margin-right: 4px;
}

.card-body-preview {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.45;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #092017;
  border: 1px solid #143d2a;
  border-radius: 16px;
  padding: 2px 9px;
  font-size: 11px;
  font-weight: 600;
  color: #a7f3d0;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-label {
  line-height: 1;
}

.card-tags-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.card-tag-pill {
  background: #071912;
  border: 1px solid #112d20;
  border-radius: 14px;
  padding: 2px 8px;
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.card-tag-pill:hover {
  color: #34d399;
  border-color: #10b981;
}

.card-time-ago {
  font-size: 11px;
  color: #64748b;
  margin-left: auto;
  white-space: nowrap;
}

.cards-empty-state {
  padding: 30px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.btn-reset-filters {
  background: #092017;
  border: 1px solid #10b98144;
  color: #34d399;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}

/* =========================================================================
   Right Column: Detail Inspector Card
   ========================================================================= */
.detail-column {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-card-panel {
  background: #06140f;
  border: 1px solid #0f271d;
  border-radius: 16px;
  height: 100%;
  overflow-y: auto;
  padding: 24px 30px;
  display: flex;
  flex-direction: column;
}

/* Header */
.detail-header-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 22px;
}

.detail-title-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-display-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-title {
  font-family: var(--font-display, "Outfit", sans-serif);
  font-size: 23px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin: 0;
}

.btn-edit-title {
  background: transparent;
  border: none;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.btn-edit-title:hover {
  opacity: 1;
}

.title-edit-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.title-inline-input {
  flex: 1;
  background: #040e0a;
  border: 1.5px solid #10b981;
  border-radius: 6px;
  padding: 6px 10px;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  outline: none;
}

.btn-title-save {
  background: #10b981;
  color: #040c08;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-title-cancel {
  background: transparent;
  border: 1px solid #112d20;
  color: #94a3b8;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.header-action-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-icon-action {
  background: transparent;
  border: 1px solid #112d20;
  border-radius: 6px;
  padding: 5px 8px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-icon-action:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.detail-meta-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #092017;
  border: 1px solid #143d2a;
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: #34d399;
}

.meta-status-pill.clickable {
  cursor: pointer;
  transition: all 0.15s ease;
}

.meta-status-pill.clickable:hover {
  border-color: #10b981;
  background: #0b291e;
}

.meta-updated-pill {
  display: inline-flex;
  align-items: center;
  background: #071912;
  border: 1px solid #112d20;
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 11.5px;
  color: #94a3b8;
}

.meta-stage-pill {
  display: inline-flex;
  align-items: center;
  background: #061710;
  border: 1px solid #0f2d20;
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 11.5px;
  color: #6ee7b7;
  text-transform: capitalize;
}

.detail-tags-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 4px;
}

.detail-tag-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

/* Sections */
.detail-section {
  margin-bottom: 22px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #10b981;
  margin: 0;
  letter-spacing: -0.01em;
}

.section-reorder-hint {
  font-size: 10.5px;
  color: #64748b;
}

.btn-expand-focus {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px;
}

.btn-expand-focus:hover {
  color: #34d399;
}

.notes-body-text {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.6;
  margin: 0;
}

/* Timeline Vertical Tree */
.vertical-timeline-tree {
  display: flex;
  flex-direction: column;
  position: relative;
  margin-top: 6px;
}

.timeline-node-row {
  display: flex;
  position: relative;
  min-height: 48px;
  cursor: grab;
}

.timeline-node-row:active {
  cursor: grabbing;
}

.timeline-axis {
  width: 22px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 4px;
  z-index: 2;
  box-sizing: border-box;
}

.timeline-dot.first-dot {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
}

.timeline-dot.subsequent-dot {
  background: #1c3d2e;
  border: 2px solid #06140f;
}

.timeline-connector-line {
  width: 1.5px;
  background: #153828;
  position: absolute;
  top: 13px;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.timeline-content {
  flex: 1;
  padding-left: 10px;
  padding-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-header-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.event-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.timeline-event-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.timeline-event-author {
  font-size: 10.5px;
  color: #64748b;
}

.timeline-item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.timeline-event-time {
  font-size: 11px;
  color: #64748b;
}

.btn-item-icon {
  background: transparent;
  border: none;
  font-size: 11px;
  color: #64748b;
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 4px;
}

.btn-item-icon:hover {
  color: #ffffff;
  background: rgba(16, 185, 129, 0.1);
}

.btn-item-icon.danger:hover {
  color: #ef4444;
}

.timeline-event-desc {
  font-size: 11.5px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
}

.inline-tags-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.resource-tag-pill {
  font-size: 9.5px;
  background: #081a13;
  color: #34d399;
  border: 1px solid #113424;
  border-radius: 10px;
  padding: 1px 6px;
  line-height: 1.3;
}

.resource-tag-pill.clickable {
  cursor: pointer;
  transition: all 0.15s ease;
}

.resource-tag-pill.clickable:hover {
  background: #10b981;
  color: #040c08;
  border-color: #10b981;
}

.resource-empty-hint {
  padding: 12px 0;
  color: #64748b;
  font-size: 11.5px;
  font-style: italic;
}

/* Add Event Link */
.add-event-wrap {
  margin-top: 2px;
  padding-left: 2px;
}

.btn-add-timeline-link {
  background: transparent;
  border: none;
  color: var(--emerald-bright, #34d399);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  transition: opacity 0.15s ease;
}

.btn-add-timeline-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* Collapsible Sections */
.collapsible-section {
  border-top: 1px solid #0e271c;
  padding: 14px 0;
}

.collapsible-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.collapsible-header {
  flex: 1;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: #ffffff;
  padding: 2px 0;
}

.collapsible-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chevron-icon {
  font-size: 13px;
  color: #94a3b8;
  font-weight: bold;
}

.collapsible-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.collapsible-count-pill {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
}

.collapsible-content {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* AI Banner Card */
.ai-cards-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-exploration-banner {
  background: #071912;
  border: 1px solid #112d20;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  cursor: grab;
}

.ai-exploration-banner:active {
  cursor: grabbing;
}

.ai-banner-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

.ai-drag-dots {
  color: #4b5563;
  font-size: 12px;
  margin-top: 2px;
}

.ai-banner-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.ai-banner-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ai-banner-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff;
}

.ai-banner-model-pill {
  font-size: 10px;
  font-weight: 600;
  color: #34d399;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 1px 6px;
  border-radius: 8px;
}

.ai-banner-meta {
  font-size: 11px;
  color: #94a3b8;
}

.ai-inline-rationale {
  font-size: 11px;
  color: #cbd5e1;
  margin: 2px 0 0 0;
}

.btn-toggle-transcript {
  background: transparent;
  border: none;
  color: #34d399;
  font-size: 10.5px;
  cursor: pointer;
  align-self: flex-start;
  padding: 2px 0;
  font-weight: 600;
}

.btn-toggle-transcript:hover {
  text-decoration: underline;
}

.ai-transcript-box {
  background: #030a07;
  border: 1px solid #0d2319;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.ai-transcript-text {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: #a7f3d0;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-banner-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 10px;
}

.badge-link-pill {
  background: #092017;
  border: 1px solid #143d2a;
  color: #34d399;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Docs */
.docs-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-item {
  background: #071912;
  border: 1px solid #112d20;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
}

.doc-item:active {
  cursor: grabbing;
}

.doc-item-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.doc-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.doc-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff;
}

.doc-domain-badge {
  font-size: 9.5px;
  color: #64748b;
  background: #040d09;
  padding: 1px 6px;
  border-radius: 6px;
  border: 1px solid #0f291c;
}

.doc-link {
  font-size: 11px;
  color: #34d399;
  text-decoration: none;
}

.doc-link:hover {
  text-decoration: underline;
}

.doc-note {
  font-size: 11px;
  color: #94a3b8;
}

.doc-item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* =========================================================================
   Mood Gallery Refactored
   ========================================================================= */
.gallery-controls-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-layout-buttons {
  display: flex;
  align-items: center;
  background: #040e0a;
  border: 1px solid #0f271d;
  border-radius: 6px;
  overflow: hidden;
}

.btn-grid-layout {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-grid-layout:hover {
  color: #a7f3d0;
}

.btn-grid-layout.active {
  background: #10b981;
  color: #03140b;
  font-weight: 700;
}

.btn-add-mood-quick {
  background: #092017;
  border: 1px solid #143d2a;
  color: #34d399;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-add-mood-quick:hover {
  background: #10b981;
  color: #022c22;
}

.mood-tags-filter-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 4px;
}

.mood-tag-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.mood-grid {
  display: grid;
  gap: 12px;
}

.mood-grid.cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.mood-grid.cols-3 {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.mood-grid.cols-4 {
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
}

.mood-card-item {
  background: #050e0a;
  border: 1px solid #112d20;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.15s ease, border-color 0.15s ease;
  display: flex;
  flex-direction: column;
  cursor: grab;
}

.mood-card-item:active {
  cursor: grabbing;
}

.mood-card-item:hover {
  transform: translateY(-2px);
  border-color: #10b981;
}

.mood-img-wrap {
  position: relative;
  width: 100%;
  height: 110px;
  cursor: pointer;
  background: #020805;
}

.mood-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mood-img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.zoom-badge {
  background: rgba(16, 185, 129, 0.9);
  color: #03140b;
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
}

.mood-img-wrap:hover .mood-img-overlay {
  opacity: 1;
}

.card-drag-handle-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #94a3b8;
  font-size: 12px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mood-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 4px 10px;
}

.mood-caption-label {
  font-size: 11px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.mood-btn-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mood-tags-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px 8px 10px;
  flex-wrap: wrap;
}

.mood-upload-zone {
  border: 1.5px dashed #14432c;
  background: #040e09;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #34d399;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.mood-upload-zone:hover,
.mood-upload-zone.dropzone-active {
  border-color: #10b981;
  background: #071912;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.15);
}

.upload-hint-sub {
  font-size: 10px;
  color: #64748b;
  font-weight: normal;
}

.hidden-file-input {
  display: none;
}

.upload-or-divider {
  text-align: center;
  font-size: 10px;
  color: #64748b;
  margin: 4px 0;
}

.btn-inline-add {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: #34d399;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}

.btn-inline-add:hover {
  text-decoration: underline;
}

/* Inline Adder & Edit Cards */
.inline-adder-card {
  background: #071912;
  border: 1px solid #143d2a;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inline-adder-card.edit-mode {
  border-color: #10b981;
  background: #082117;
}

.adder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-edit-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #34d399;
}

.adder-inputs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.adder-input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.adder-input,
.adder-textarea,
select.adder-input {
  background: #040e0a;
  border: 1px solid #112d20;
  border-radius: 6px;
  padding: 7px 10px;
  color: #ffffff;
  font-size: 12px;
  outline: none;
}

.adder-input:focus,
.adder-textarea:focus,
select.adder-input:focus {
  border-color: #10b981;
}

.adder-textarea {
  font-family: var(--font-mono, monospace);
  min-height: 60px;
  resize: vertical;
}

.adder-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-adder-cancel {
  background: transparent;
  border: 1px solid #112d20;
  border-radius: 6px;
  padding: 4px 10px;
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
}

.btn-adder-save {
  background: #10b981;
  color: #040c08;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

/* =========================================================================
   Bottom Action Buttons Toolbar
   ========================================================================= */
.detail-actions-row {
  margin-top: auto;
  padding-top: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-panel-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #081a13;
  border: 1px solid #133827;
  border-radius: 8px;
  padding: 8px 16px;
  color: #e2e8f0;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-panel-action:hover {
  background: #0c261c;
  border-color: #10b981;
  color: #ffffff;
}

.action-icon {
  font-size: 14px;
  font-weight: 700;
}
</style>
