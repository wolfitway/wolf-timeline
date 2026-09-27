<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useNotesStore } from "@/stores/useNotesStore";
import { useUiStore } from "@/stores/useUiStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { optimizeImageFile } from "@/services/imageStorage";
import { fetchSmartResource } from "@/services/resourceFetcher";
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

// Mood file upload dropzone state
const isGalleryDraggingFiles = ref(false);
const moodFileInput = ref<HTMLInputElement | null>(null);

/* =========================================================================
   UNIVERSAL DRAG & DROP ENGINE (ID-BASED WITH VISUAL FEEDBACK)
   ========================================================================= */

// 1. Note Cards
const draggedNoteId = ref<number | null>(null);
const dragOverNoteId = ref<number | null>(null);

function onNoteDragStart(e: DragEvent, id: number) {
  draggedNoteId.value = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(id));
  }
}
function onNoteDragOver(e: DragEvent, id: number) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  dragOverNoteId.value = id;
}
function onNoteDragLeave(id: number) {
  if (dragOverNoteId.value === id) dragOverNoteId.value = null;
}
function onNoteDrop(e: DragEvent, targetId: number) {
  e.preventDefault();
  dragOverNoteId.value = null;
  if (draggedNoteId.value === null || draggedNoteId.value === targetId) return;

  const list = [...notesStore.notes];
  const fromIdx = list.findIndex((n) => n.id === draggedNoteId.value);
  const toIdx = list.findIndex((n) => n.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [removed] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, removed);
  notesStore.reorderNotes(list);
  draggedNoteId.value = null;
  uiStore.showToast("Project cards reordered ✓");
}
function onNoteDragEnd() {
  draggedNoteId.value = null;
  dragOverNoteId.value = null;
}

// 2. Timeline Events
const draggedEventId = ref<string | null>(null);
const dragOverEventId = ref<string | null>(null);

function onEventDragStart(e: DragEvent, id: string) {
  draggedEventId.value = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
}
function onEventDragOver(e: DragEvent, id: string) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  dragOverEventId.value = id;
}
function onEventDragLeave(id: string) {
  if (dragOverEventId.value === id) dragOverEventId.value = null;
}
function onEventDrop(e: DragEvent, targetId: string) {
  e.preventDefault();
  dragOverEventId.value = null;
  if (!draggedEventId.value || draggedEventId.value === targetId || !notesStore.selectedNote?.events) return;

  const list = [...notesStore.selectedNote.events];
  const fromIdx = list.findIndex((ev) => ev.id === draggedEventId.value);
  const toIdx = list.findIndex((ev) => ev.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [removed] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, removed);
  notesStore.reorderTimelineEvents(notesStore.selectedNote.id, list);
  draggedEventId.value = null;
  uiStore.showToast("Timeline events reordered ✓");
}
function onEventDragEnd() {
  draggedEventId.value = null;
  dragOverEventId.value = null;
}

// 3. AI Explorations
const draggedAiId = ref<string | null>(null);
const dragOverAiId = ref<string | null>(null);

function onAiDragStart(e: DragEvent, id: string) {
  draggedAiId.value = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
}
function onAiDragOver(e: DragEvent, id: string) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  dragOverAiId.value = id;
}
function onAiDragLeave(id: string) {
  if (dragOverAiId.value === id) dragOverAiId.value = null;
}
function onAiDrop(e: DragEvent, targetId: string) {
  e.preventDefault();
  dragOverAiId.value = null;
  if (!draggedAiId.value || draggedAiId.value === targetId || !notesStore.selectedNote?.ai_explorations) return;

  const list = [...notesStore.selectedNote.ai_explorations];
  const fromIdx = list.findIndex((ai) => ai.id === draggedAiId.value);
  const toIdx = list.findIndex((ai) => ai.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [removed] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, removed);
  notesStore.reorderAiExplorations(notesStore.selectedNote.id, list);
  draggedAiId.value = null;
  uiStore.showToast("AI explorations reordered ✓");
}
function onAiDragEnd() {
  draggedAiId.value = null;
  dragOverAiId.value = null;
}

// 4. Docs & Bookmarks
const draggedDocId = ref<string | null>(null);
const dragOverDocId = ref<string | null>(null);

function onDocDragStart(e: DragEvent, id: string) {
  draggedDocId.value = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
}
function onDocDragOver(e: DragEvent, id: string) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  dragOverDocId.value = id;
}
function onDocDragLeave(id: string) {
  if (dragOverDocId.value === id) dragOverDocId.value = null;
}
function onDocDrop(e: DragEvent, targetId: string) {
  e.preventDefault();
  dragOverDocId.value = null;
  if (!draggedDocId.value || draggedDocId.value === targetId || !notesStore.selectedNote?.bookmarks) return;

  const list = [...notesStore.selectedNote.bookmarks];
  const fromIdx = list.findIndex((b) => b.id === draggedDocId.value);
  const toIdx = list.findIndex((b) => b.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [removed] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, removed);
  notesStore.reorderBookmarks(notesStore.selectedNote.id, list);
  draggedDocId.value = null;
  uiStore.showToast("Docs reordered ✓");
}
function onDocDragEnd() {
  draggedDocId.value = null;
  dragOverDocId.value = null;
}

// 5. Mood Gallery Cards
const draggedMoodId = ref<string | null>(null);
const dragOverMoodId = ref<string | null>(null);

function onMoodCardDragStart(e: DragEvent, id: string) {
  draggedMoodId.value = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
}
function onMoodCardDragOver(e: DragEvent, id: string) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  dragOverMoodId.value = id;
}
function onMoodCardDragLeave(id: string) {
  if (dragOverMoodId.value === id) dragOverMoodId.value = null;
}
function onMoodCardDrop(e: DragEvent, targetId: string) {
  e.preventDefault();
  dragOverMoodId.value = null;
  const sourceId = draggedMoodId.value || e.dataTransfer?.getData("text/plain");
  if (!sourceId || sourceId === targetId || !notesStore.selectedNote?.mood_gallery) return;

  const list = [...notesStore.selectedNote.mood_gallery];
  const fromIdx = list.findIndex((m) => m.id === sourceId);
  const toIdx = list.findIndex((m) => m.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [removed] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, removed);
  notesStore.reorderMoodImages(notesStore.selectedNote.id, list);
  draggedMoodId.value = null;
  uiStore.showToast("Mood gallery images reordered ✓");
}
function onMoodCardDragEnd() {
  draggedMoodId.value = null;
  dragOverMoodId.value = null;
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
const isFetchingResource = ref(false);

async function handleAutoFetchResource() {
  if (!newDocUrl.value.trim() || !notesStore.selectedNote) {
    uiStore.showToast("Enter a URL first (e.g. github.com, sqlite.org, vuejs.org)...");
    return;
  }
  isFetchingResource.value = true;
  uiStore.showToast("⚡ Fetching page snapshot & consulting Council of Experts...");
  try {
    const fetched = await fetchSmartResource(newDocUrl.value.trim());
    const bm: WebBookmark = {
      id: `bm_${Date.now()}`,
      title: fetched.title,
      url: newDocUrl.value.trim().startsWith("http") ? newDocUrl.value.trim() : `https://${newDocUrl.value.trim()}`,
      domain: fetched.domain,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      description: fetched.description,
      preview_image: fetched.preview_image,
      expert_reviews: fetched.expert_reviews,
      tags: fetched.tags,
      fetch_status: "fetched",
    };
    notesStore.addBookmark(notesStore.selectedNote.id, bm);
    newDocTitle.value = "";
    newDocUrl.value = "";
    newDocNote.value = "";
    newDocTags.value = "";
    showAddDoc.value = false;
    uiStore.showToast(`Resource snapshot & Council review generated ✓`);
  } catch (err) {
    console.error("Auto fetch error:", err);
    uiStore.showToast("Failed to fetch resource preview.");
  } finally {
    isFetchingResource.value = false;
  }
}

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
   4. MOOD GALLERY CRUD, INSTANT FILE UPLOAD & CLIPBOARD PASTE
   ========================================================================= */
const showAddMood = ref(false);
const newMoodUrl = ref("");
const newMoodCaption = ref("");
const newMoodTags = ref("");

const editingMoodId = ref<string | null>(null);
const editMoodUrl = ref("");
const editMoodCaption = ref("");
const editMoodTags = ref("");

/**
 * Ingest image files instantly from file picker OR drag-drop.
 * Uses smart client-side optimization and IndexedDB media storage.
 */
async function ingestMoodFiles(files: FileList | File[]) {
  if (!files || files.length === 0 || !notesStore.selectedNote) return;
  const noteId = notesStore.selectedNote.id;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith("image/")) continue;
    try {
      const { dataUrl, sizeBytes } = await optimizeImageFile(file, 1920, 0.88);
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const img: MoodImage = {
        id: `mood_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
        url: dataUrl,
        caption: cleanName || "Visual Reference",
        tags: ["upload", "photo"],
        created_at: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
      await notesStore.addMoodImage(noteId, img);
      uiStore.showToast(`Saved "${cleanName}" (${Math.round(sizeBytes / 1024)} KB) to Vault ✓`);
    } catch (err) {
      console.error("Failed to process image file:", err);
      uiStore.showToast(`Failed to process ${file.name}`);
    }
  }
}

function onMoodFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    ingestMoodFiles(target.files);
    target.value = ""; // reset for next upload
  }
}

function onGalleryDropFiles(e: DragEvent) {
  e.preventDefault();
  isGalleryDraggingFiles.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    ingestMoodFiles(e.dataTransfer.files);
  }
}

function handleAddMoodManual() {
  if (!newMoodUrl.value.trim() || !notesStore.selectedNote) return;
  const tagList = newMoodTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  const img: MoodImage = {
    id: `mood_${Date.now()}`,
    url: newMoodUrl.value.trim(),
    caption: newMoodCaption.value.trim() || "Visual Reference",
    tags: tagList.length ? tagList : ["moodboard"],
    created_at: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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

async function handleDeleteMood(imgId: string) {
  if (!notesStore.selectedNote) return;
  await notesStore.deleteMoodImage(notesStore.selectedNote.id, imgId);
  uiStore.showToast("Photo permanently deleted from database & vault ✓");
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
async function handleGlobalPaste(e: ClipboardEvent) {
  if (!e.clipboardData || !notesStore.selectedNote) return;
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      if (!file) continue;
      e.preventDefault();
      await ingestMoodFiles([file]);
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
          v-for="note in filteredNotesList"
          :key="note.id"
          class="project-card"
          :class="{
            selected: notesStore.selectedNote?.id === note.id,
            'is-dragging': draggedNoteId === note.id,
            'drag-over-item': dragOverNoteId === note.id && draggedNoteId !== note.id
          }"
          draggable="true"
          @dragstart="onNoteDragStart($event, note.id)"
          @dragover="onNoteDragOver($event, note.id)"
          @dragleave="onNoteDragLeave(note.id)"
          @drop="onNoteDrop($event, note.id)"
          @dragend="onNoteDragEnd"
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
            <span class="section-reorder-hint">Drag items to reorder</span>
          </div>

          <div class="vertical-timeline-tree">
            <div
              v-for="ev in filteredEvents"
              :key="ev.id"
              class="timeline-node-row"
              :class="{
                'is-dragging': draggedEventId === ev.id,
                'drag-over-item': dragOverEventId === ev.id && draggedEventId !== ev.id
              }"
              draggable="true"
              @dragstart="onEventDragStart($event, ev.id)"
              @dragover="onEventDragOver($event, ev.id)"
              @dragleave="onEventDragLeave(ev.id)"
              @drop="onEventDrop($event, ev.id)"
              @dragend="onEventDragEnd"
            >
              <div class="timeline-axis">
                <div class="timeline-dot" title="Drag to reorder"></div>
                <div class="timeline-connector-line"></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-header-line">
                  <div class="event-title-wrap">
                    <span class="card-drag-handle sm" title="Drag to reorder">⋮</span>
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

        <!-- 2. Collapsible AI Explorations Section with Decision Studio & Multi-Model Debates -->
        <div class="collapsible-section">
          <button
            type="button"
            class="collapsible-header"
            @click="showAiExplorations = !showAiExplorations"
          >
            <div class="collapsible-left">
              <span class="chevron-icon">{{ showAiExplorations ? "⌃" : "⌄" }}</span>
              <span class="collapsible-title">AI Explorations &amp; Decision Debates</span>
            </div>
            <div class="header-right-badges">
              <button
                type="button"
                class="btn-open-studio-header"
                @click.stop="uiStore.openAiExplorationModal()"
                title="Launch full AI debate studio"
              >
                <span>⚔️ Open Debate Studio</span>
              </button>
              <span class="collapsible-count-pill">{{ filteredAiExplorations.length }}</span>
            </div>
          </button>

          <div v-if="showAiExplorations" class="collapsible-content">
            <div v-if="filteredAiExplorations.length" class="ai-cards-stack">
              <div
                v-for="ai in filteredAiExplorations"
                :key="ai.id"
                class="ai-exploration-banner"
                :class="{
                  'is-dragging': draggedAiId === ai.id,
                  'drag-over-item': dragOverAiId === ai.id && draggedAiId !== ai.id
                }"
                draggable="true"
                @dragstart="onAiDragStart($event, ai.id)"
                @dragover="onAiDragOver($event, ai.id)"
                @dragleave="onAiDragLeave(ai.id)"
                @drop="onAiDrop($event, ai.id)"
                @dragend="onAiDragEnd"
                @click="uiStore.openAiExplorationModal(ai.id)"
              >
                <div class="ai-banner-left">
                  <span class="ai-drag-dots" title="Drag to reorder" @click.stop>⋮⋮</span>
                  <div class="ai-banner-info">
                    <div class="ai-banner-title-row">
                      <span class="ai-banner-title">{{ ai.title }}</span>
                      <span class="ai-banner-model-pill">{{ ai.model }}</span>
                      <span v-if="ai.debate_turns?.length" class="ai-debates-count-pill">
                        ⚔️ {{ ai.debate_turns.length }} Model Debates
                      </span>
                      <span class="ai-banner-meta">• {{ ai.date }}</span>
                    </div>

                    <p v-if="ai.decision_outcome || ai.rationale" class="ai-inline-rationale">
                      <strong class="rationale-lead">🎯 Consensus: </strong>{{ ai.decision_outcome || ai.rationale }}
                    </p>

                    <div v-if="ai.key_takeaways?.length" class="ai-mini-takeaways">
                      <span v-for="(k, kidx) in ai.key_takeaways.slice(0, 2)" :key="kidx" class="mini-takeaway-item">
                        ✓ {{ k }}
                      </span>
                    </div>

                    <div v-if="ai.tags?.length" class="inline-tags-row">
                      <span
                        v-for="t in ai.tags"
                        :key="t"
                        class="resource-tag-pill clickable"
                        @click.stop="toggleDetailTag(t)"
                      >
                        #{{ t }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="ai-banner-actions" @click.stop>
                  <a v-if="ai.url" :href="ai.url" target="_blank" rel="noopener noreferrer" class="badge-link-pill" title="Open thread URL">
                    LINK ↗
                  </a>
                  <button type="button" class="btn-item-icon" @click="uiStore.openAiExplorationModal(ai.id)" title="Open Full Debate Studio">✏️</button>
                  <button type="button" class="btn-item-icon danger" @click="handleDeleteAi(ai.id)" title="Delete Record">✕</button>
                </div>
              </div>
            </div>

            <div v-else class="resource-empty-hint">
              <span>No AI explorations recorded. Click "+ Launch Decision & Debate Studio" to start.</span>
            </div>

            <button
              type="button"
              class="btn-inline-add"
              @click="uiStore.openAiExplorationModal()"
            >
              + Launch Full AI Decision &amp; Debate Studio
            </button>
          </div>
        </div>

        <!-- 3. Collapsible Docs & Bookmarks Section with Auto-Fetch Snapshot & Expert Reviews -->
        <div class="collapsible-section">
          <button
            type="button"
            class="collapsible-header"
            @click="showDocs = !showDocs"
          >
            <div class="collapsible-left">
              <span class="chevron-icon">{{ showDocs ? "⌃" : "⌄" }}</span>
              <span class="collapsible-title">Docs &amp; Verified Resources</span>
            </div>
            <span class="collapsible-count-pill">{{ filteredBookmarks.length }}</span>
          </button>

          <div v-if="showDocs" class="collapsible-content">
            <div v-if="filteredBookmarks.length" class="docs-stack">
              <div
                v-for="doc in filteredBookmarks"
                :key="doc.id"
                class="doc-item"
                :class="{
                  'is-dragging': draggedDocId === doc.id,
                  'drag-over-item': dragOverDocId === doc.id && draggedDocId !== doc.id,
                  'has-preview': !!doc.preview_image
                }"
                draggable="true"
                @dragstart="onDocDragStart($event, doc.id)"
                @dragover="onDocDragOver($event, doc.id)"
                @dragleave="onDocDragLeave(doc.id)"
                @drop="onDocDrop($event, doc.id)"
                @dragend="onDocDragEnd"
              >
                <!-- Optional Webpage Preview Snapshot -->
                <div v-if="doc.preview_image" class="doc-preview-banner">
                  <img :src="doc.preview_image" :alt="doc.title" class="doc-preview-img" loading="lazy" />
                  <a :href="doc.url" target="_blank" rel="noopener noreferrer" class="preview-hover-overlay">
                    <span>↗ Visit Resource</span>
                  </a>
                </div>

                <div class="doc-item-body">
                  <div class="doc-item-left">
                    <div class="doc-title-row">
                      <span class="card-drag-handle sm" title="Drag to reorder">⋮</span>
                      <span class="doc-title">{{ doc.title }}</span>
                      <span class="doc-domain-badge">{{ doc.domain }}</span>
                    </div>

                    <a :href="doc.url" target="_blank" rel="noopener noreferrer" class="doc-link">
                      🔗 {{ doc.url }}
                    </a>

                    <p v-if="doc.description" class="doc-desc-text">{{ doc.description }}</p>
                    <span v-else-if="doc.note" class="doc-note">{{ doc.note }}</span>

                    <!-- Sovereign Council of Experts Review Badges -->
                    <div v-if="doc.expert_reviews?.length" class="expert-reviews-row">
                      <span class="council-label">🐺 Council Verdicts:</span>
                      <div class="expert-badges-group">
                        <span
                          v-for="rev in doc.expert_reviews"
                          :key="rev.expert"
                          class="expert-review-badge"
                          :title="`${rev.expert} (${rev.role}): ${rev.comment}`"
                        >
                          <span class="rev-avatar">{{ rev.avatar }}</span>
                          <span class="rev-name">{{ rev.expert.split(' ')[0] }}:</span>
                          <span class="rev-score">{{ rev.score }}/10</span>
                        </span>
                      </div>
                    </div>

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
            </div>

            <div v-else class="resource-empty-hint">
              <span>No documentation links match the active tag filter.</span>
            </div>

            <!-- Smart Auto-Fetch / Link Resource Box -->
            <div v-if="!showAddDoc && !editingDocId" class="resource-quick-fetch-bar">
              <div class="quick-fetch-input-wrap">
                <span class="globe-icon">🌐</span>
                <input
                  v-model="newDocUrl"
                  type="text"
                  class="quick-url-input"
                  placeholder="Paste URL to auto-fetch snapshot & Council review (e.g. github.com, sqlite.org)..."
                  @keydown.enter="handleAutoFetchResource"
                />
                <button
                  type="button"
                  class="btn-quick-fetch"
                  :disabled="isFetchingResource"
                  @click="handleAutoFetchResource"
                >
                  <span v-if="isFetchingResource">⏳ Analyzing...</span>
                  <span v-else>⚡ Auto-Fetch</span>
                </button>
              </div>
              <button
                type="button"
                class="btn-manual-doc-toggle"
                @click="showAddDoc = true"
              >
                + Manual Entry
              </button>
            </div>

            <!-- Manual Add Doc Form -->
            <div v-else-if="showAddDoc" class="inline-adder-card">
              <div class="adder-header">
                <span class="card-edit-badge">New Resource Link</span>
                <button type="button" class="btn-item-icon" @click="showAddDoc = false">✕</button>
              </div>
              <input v-model="newDocUrl" type="text" class="adder-input" placeholder="https://... URL / spec link" />
              <input v-model="newDocTitle" type="text" class="adder-input" placeholder="Document title..." />
              <input v-model="newDocNote" type="text" class="adder-input" placeholder="Takeaway note (optional)..." />
              <input v-model="newDocTags" type="text" class="adder-input" placeholder="Tags (comma-separated)..." />
              <div class="adder-actions">
                <button type="button" class="btn-adder-cancel" @click="showAddDoc = false">Cancel</button>
                <button type="button" class="btn-adder-save" @click="handleAddDoc">Save Manual</button>
                <button type="button" class="btn-quick-fetch" @click="handleAutoFetchResource">⚡ Auto-Fetch &amp; Review</button>
              </div>
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
          </div>
        </div>

        <!-- 4. Refactored Mood Gallery Section with Drag & Drop Reorder, Instant Upload Dropzone -->
        <div
          class="collapsible-section mood-gallery-section"
          :class="{ 'gallery-drop-active': isGalleryDraggingFiles }"
          @dragover.prevent="isGalleryDraggingFiles = true"
          @dragleave.prevent="isGalleryDraggingFiles = false"
          @drop.prevent="onGalleryDropFiles"
        >
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

              <!-- Upload Button (Direct File Ingest) -->
              <label class="btn-add-mood-quick file-label" title="Upload image files from disk">
                📁 Upload
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden-file-input"
                  @change="onMoodFileInputChange"
                />
              </label>

              <!-- Manual URL Add Toggle -->
              <button
                type="button"
                class="btn-add-mood-quick"
                @click="showAddMood = !showAddMood"
                title="Paste Image URL or details"
              >
                + URL
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

            <!-- Instant Drag & Drop Upload Banner / Drop Target -->
            <div
              class="mood-drop-banner"
              :class="{ 'banner-active': isGalleryDraggingFiles }"
              @click="moodFileInput?.click()"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Click or Drop images anywhere to upload • Drag cards to reorder • Paste (⌘V)</span>
              <input
                ref="moodFileInput"
                type="file"
                accept="image/*"
                multiple
                class="hidden-file-input"
                @change="onMoodFileInputChange"
              />
            </div>

            <!-- Mood Gallery Grid with robust Drag & Drop -->
            <div
              v-if="filteredMoodGallery.length"
              class="mood-grid"
              :class="`cols-${moodGridCols}`"
            >
              <div
                v-for="img in filteredMoodGallery"
                :key="img.id"
                class="mood-card-item"
                :class="{
                  'is-dragging': draggedMoodId === img.id,
                  'drag-over-item': dragOverMoodId === img.id && draggedMoodId !== img.id
                }"
                draggable="true"
                @dragstart="onMoodCardDragStart($event, img.id)"
                @dragover="onMoodCardDragOver($event, img.id)"
                @dragleave="onMoodCardDragLeave(img.id)"
                @drop="onMoodCardDrop($event, img.id)"
                @dragend="onMoodCardDragEnd"
              >
                <div class="mood-img-wrap" @click="openMoodLightbox(filteredMoodGallery.findIndex(m => m.id === img.id))">
                  <img
                    :src="img.url"
                    :alt="img.caption"
                    class="mood-thumb"
                    draggable="false"
                    loading="lazy"
                  />
                  <div class="mood-img-overlay">
                    <span class="zoom-badge">🔍 Enlarge</span>
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
              <span>No mood images found. Drag & drop images onto this card or click "📁 Upload" to add some!</span>
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

            <!-- Add Mood Form (Manual URL Input) -->
            <div v-if="showAddMood" class="inline-adder-card">
              <div class="adder-header">
                <span class="card-edit-badge">Add Visual Reference by URL</span>
                <button type="button" class="btn-item-icon" @click="showAddMood = false">✕</button>
              </div>

              <input v-model="newMoodUrl" type="text" class="adder-input" placeholder="https://... image URL or data:image/..." />
              <input v-model="newMoodCaption" type="text" class="adder-input" placeholder="Caption / description (e.g. Obsidian Terminal)..." />
              <input v-model="newMoodTags" type="text" class="adder-input" placeholder="Tags (comma-separated, e.g. ui, obsidian, neon)..." />

              <div class="adder-actions">
                <button type="button" class="btn-adder-cancel" @click="showAddMood = false">Cancel</button>
                <button type="button" class="btn-adder-save" @click="handleAddMoodManual">Add to Gallery</button>
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
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, background-color 0.2s ease;
  display: flex;
  flex-direction: column;
  position: relative;
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

.project-card.is-dragging {
  opacity: 0.35;
  transform: scale(0.98);
  border-style: dashed;
}

.project-card.drag-over-item {
  border-color: #10b981;
  background: #0b2e20;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
  transform: translateY(-2px) scale(1.015);
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
  border-radius: 8px;
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.timeline-node-row:active {
  cursor: grabbing;
}

.timeline-node-row.is-dragging {
  opacity: 0.35;
  transform: scale(0.98);
}

.timeline-node-row.drag-over-item {
  background: #092017;
  outline: 1.5px dashed #10b981;
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.25);
  transform: translateX(4px);
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
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
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
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.ai-exploration-banner:active {
  cursor: grabbing;
}

.ai-exploration-banner.is-dragging {
  opacity: 0.35;
  transform: scale(0.98);
}

.ai-exploration-banner.drag-over-item {
  border-color: #10b981;
  background: #0b2e20;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
  transform: translateY(-2px) scale(1.01);
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

.btn-open-studio-header {
  background: #0d281c;
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: var(--emerald-bright, #34d399);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-open-studio-header:hover {
  background: #143d2b;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
}

.header-right-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-debates-count-pill {
  font-size: 10px;
  font-weight: 800;
  background: #231230;
  border: 1px solid #4a1d68;
  color: #c084fc;
  padding: 1px 7px;
  border-radius: 8px;
}

.rationale-lead {
  color: var(--emerald-bright, #34d399);
}

.ai-mini-takeaways {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.mini-takeaway-item {
  font-size: 10.5px;
  color: #94a3b8;
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
  line-height: 1.4;
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
  text-decoration: none;
}

/* Docs & Verified Resources */
.docs-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-item {
  background: #071912;
  border: 1px solid #112d20;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: grab;
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.doc-item:active {
  cursor: grabbing;
}

.doc-item.is-dragging {
  opacity: 0.35;
  transform: scale(0.98);
}

.doc-item.drag-over-item {
  border-color: #10b981;
  background: #0b2e20;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
  transform: translateY(-2px) scale(1.01);
}

/* Preview Banner */
.doc-preview-banner {
  position: relative;
  width: 100%;
  height: 120px;
  background: #040a07;
  border-bottom: 1px solid #0f241a;
  overflow: hidden;
}

.doc-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.doc-preview-banner:hover .preview-hover-overlay {
  opacity: 1;
}

.doc-item-body {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.doc-desc-text {
  font-size: 11.5px;
  color: #94a3b8;
  margin: 3px 0;
  line-height: 1.4;
}

/* Council of Experts Reviews */
.expert-reviews-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
  flex-wrap: wrap;
}

.council-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
}

.expert-badges-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.expert-review-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #040e09;
  border: 1px solid #133323;
  border-radius: 10px;
  padding: 2px 7px;
  font-size: 10px;
}

.rev-avatar {
  font-size: 10px;
}

.rev-name {
  color: #d1d5db;
  font-weight: 600;
}

.rev-score {
  color: #10b981;
  font-weight: 700;
}

/* Quick Fetch Bar */
.resource-quick-fetch-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.quick-fetch-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #06150e;
  border: 1px solid #143324;
  border-radius: 8px;
  padding: 4px 6px 4px 10px;
}

.globe-icon {
  font-size: 13px;
  opacity: 0.8;
}

.quick-url-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 11.5px;
  color: #fff;
  font-family: inherit;
}

.quick-url-input::placeholder {
  color: #64748b;
}

.btn-quick-fetch {
  background: #10b981;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  color: #03140b;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-quick-fetch:hover {
  background: #34d399;
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.4);
}

.btn-manual-doc-toggle {
  background: #091a13;
  border: 1px solid #143828;
  border-radius: 8px;
  padding: 8px 12px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-manual-doc-toggle:hover {
  background: #0f2b1f;
  color: #fff;
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
.mood-gallery-section.gallery-drop-active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.04);
}

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
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-add-mood-quick.file-label {
  cursor: pointer;
}

.btn-add-mood-quick:hover {
  background: #10b981;
  color: #022c22;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
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

/* Mood Drop Banner */
.mood-drop-banner {
  border: 1.5px dashed #14432c;
  background: #040e09;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #34d399;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.mood-drop-banner:hover,
.mood-drop-banner.banner-active {
  border-color: #10b981;
  background: #082117;
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.2);
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
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  display: flex;
  flex-direction: column;
  cursor: grab;
  position: relative;
}

.mood-card-item:active {
  cursor: grabbing;
}

.mood-card-item:hover {
  transform: translateY(-2px);
  border-color: #10b981;
}

.mood-card-item.is-dragging {
  opacity: 0.35;
  transform: scale(0.96);
  border-style: dashed;
}

.mood-card-item.drag-over-item {
  border-color: #34d399;
  background: #08291e;
  box-shadow: 0 0 18px rgba(16, 185, 129, 0.5);
  transform: scale(1.03) translateY(-2px);
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
  pointer-events: none;
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
  background: rgba(0, 0, 0, 0.65);
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

.hidden-file-input {
  display: none;
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
