<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBookmarksStore } from "@/stores/useBookmarksStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { useUiStore } from "@/stores/useUiStore";
import { kokoroVoice } from "@/services/voiceGuide";
import { autoClassifyBookmark } from "@/services/bookmarkClassifier";
import type { WebBookmark } from "@/types";

const bookmarksStore = useBookmarksStore();
const notesStore = useNotesStore();
const roadmapStore = useRoadmapStore();
const uiStore = useUiStore();

// Voice speaking status
const isSpeakingId = ref<string | null>(null);

// New / Edit modal states
const showAddModal = ref(false);
const editingBookmark = ref<EnrichedBookmark | null>(null);
const targetProjectForAdd = ref<number | undefined>(notesStore.selectedNoteId || notesStore.notes[0]?.id);

// Send to Roadmap Picker modal state
const showRoadmapPickerModal = ref(false);
const roadmapTargetBookmark = ref<EnrichedBookmark | null>(null);
const selectedRoadmapPhaseId = ref<string>("");

// Add / Edit form
const formUrl = ref("");
const formTitle = ref("");
const formNote = ref("");
const formTags = ref("");
const autoClassifyStatus = ref<string>("");

// Aggregate enriched bookmarks with project context
interface EnrichedBookmark extends WebBookmark {
  projectTitle?: string;
}

const enrichedFilteredBookmarks = computed<EnrichedBookmark[]>(() => {
  return bookmarksStore.filteredBookmarks.map((bm) => {
    let projectTitle = "Global Bookmark";
    if (bm.projectId) {
      const parent = notesStore.notes.find((n) => n.id === bm.projectId);
      if (parent) {
        projectTitle = parent.title;
      }
    }
    return {
      ...bm,
      projectTitle,
    };
  });
});

// Auto-classify single bookmark form in real-time
function triggerAutoClassifyForm() {
  if (!formUrl.value.trim()) return;
  const existing = formTags.value
    ? formTags.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const res = autoClassifyBookmark(formUrl.value, formTitle.value, existing);
  formTags.value = res.suggestedTags.join(", ");
  autoClassifyStatus.value = `Tagged as [${res.category}] ✓`;
  setTimeout(() => {
    autoClassifyStatus.value = "";
  }, 2500);
}

// Batch Auto-Classifier for ALL existing bookmarks in DB
const isAutoClassifyingBatch = ref(false);
async function runBatchAutoClassifier() {
  isAutoClassifyingBatch.value = true;
  const countUpdated = await bookmarksStore.autoClassifyAll();
  isAutoClassifyingBatch.value = false;
  kokoroVoice.playHeartChime("success");
  kokoroVoice.speak(`Auto-classified ${countUpdated} bookmarks across your database vault.`);
  uiStore.showToast(`Auto-classified & enriched ${countUpdated} bookmarks in DB ✓`);
}

// Add / Edit Bookmark
function openAddModal() {
  formUrl.value = "";
  formTitle.value = "";
  formNote.value = "";
  formTags.value = "";
  targetProjectForAdd.value = notesStore.selectedNoteId || notesStore.notes[0]?.id;
  editingBookmark.value = null;
  showAddModal.value = true;
}

async function handleSaveBookmark() {
  if (!formUrl.value.trim()) {
    uiStore.showToast("Please enter a valid URL");
    return;
  }

  let domain = "web";
  try {
    const parsed = new URL(formUrl.value.trim());
    domain = parsed.hostname.replace(/^www\./, "");
  } catch {}

  const tags = formTags.value
    ? formTags.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : ["bookmark"];

  if (editingBookmark.value) {
    // Update in database store
    await bookmarksStore.updateBookmark(editingBookmark.value.id, {
      url: formUrl.value.trim(),
      title: formTitle.value.trim() || domain,
      domain,
      note: formNote.value.trim(),
      tags,
      projectId: targetProjectForAdd.value,
    });
    uiStore.showToast("Bookmark updated in database ✓");
  } else {
    // Add new to database store
    await bookmarksStore.addBookmark({
      url: formUrl.value.trim(),
      title: formTitle.value.trim() || domain,
      domain,
      note: formNote.value.trim(),
      tags,
      projectId: targetProjectForAdd.value,
    });
    kokoroVoice.playHeartChime("affirm");
    uiStore.showToast("Bookmark saved to sovereign database ✓");
  }

  showAddModal.value = false;
}

function openEditModal(bm: EnrichedBookmark) {
  editingBookmark.value = bm;
  formUrl.value = bm.url;
  formTitle.value = bm.title;
  formNote.value = bm.note || "";
  formTags.value = bm.tags?.join(", ") || "";
  targetProjectForAdd.value = bm.projectId;
  showAddModal.value = true;
}

async function handleDeleteBookmark(bm: EnrichedBookmark) {
  if (confirm(`Remove bookmark "${bm.title}" from database?`)) {
    await bookmarksStore.deleteBookmark(bm.id);
    uiStore.showToast("Bookmark deleted from database ✓");
  }
}

// Kokoro voice read summary
function speakBookmark(bm: EnrichedBookmark) {
  if (isSpeakingId.value === bm.id) {
    kokoroVoice.stop();
    isSpeakingId.value = null;
    return;
  }
  isSpeakingId.value = bm.id;
  kokoroVoice.speak(
    `Bookmark: ${bm.title}. Hosted on ${bm.domain}. ${bm.note ? 'Note: ' + bm.note : ''}`,
    () => {
      isSpeakingId.value = null;
    }
  );
}

// Auto-tag quick click
async function addTagToBookmark(bm: EnrichedBookmark, tag: string) {
  await bookmarksStore.addTagToBookmark(bm.id, tag);
  uiStore.showToast(`Tagged #${tag} ✓`);
}

// Direct Actions: Link to Timeline & Roadmap
function sendToTimeline(bm: EnrichedBookmark) {
  const targetId = bm.projectId || notesStore.selectedNoteId || notesStore.notes[0]?.id;
  if (!targetId) return;

  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const desc = `${bm.url}\n${bm.note ? 'Notes: ' + bm.note : ''}`.trim();
  notesStore.addTimelineEvent(targetId, {
    id: `ev_bm_${Date.now()}`,
    title: `🔖 ${bm.title}`,
    time: timeStr,
    author: "Bookmark Link",
    desc,
    tags: bm.tags || ["resource", "bookmark"],
  });
  kokoroVoice.playHeartChime("affirm");
  uiStore.showToast(`Linked "${bm.title}" as timeline event ✓`);
}

function openSendToRoadmap(bm: EnrichedBookmark) {
  roadmapTargetBookmark.value = bm;
  if (!selectedRoadmapPhaseId.value && roadmapStore.phases.length > 0) {
    selectedRoadmapPhaseId.value = roadmapStore.phases[0].id;
  }
  showRoadmapPickerModal.value = true;
}

function handleConfirmRoadmapLink() {
  if (!roadmapTargetBookmark.value || !selectedRoadmapPhaseId.value) return;
  const practiceText = `${roadmapTargetBookmark.value.title} (${roadmapTargetBookmark.value.url})`;
  roadmapStore.addPractice(selectedRoadmapPhaseId.value, practiceText);
  kokoroVoice.playHeartChime("affirm");
  const targetPhase = roadmapStore.phases.find((p) => p.id === selectedRoadmapPhaseId.value);
  uiStore.showToast(`Added practice to Roadmap "${targetPhase?.title || 'Phase'}" ✓`);
  showRoadmapPickerModal.value = false;
  roadmapTargetBookmark.value = null;
}

onMounted(() => {
  if (!bookmarksStore.isLoaded) {
    bookmarksStore.loadBookmarks();
  }
});
</script>

<template>
  <div class="bookmarks-view-root">
    <!-- Top Control Bar -->
    <header class="bookmarks-header">
      <div class="header-left">
        <div class="header-title-row">
          <div class="bookmarks-icon-badge">
            <span class="icon-emoji">🔖</span>
            <span class="pulse-indicator"></span>
          </div>
          <div>
            <h1 class="bookmarks-main-title">Sovereign Bookmarks Hub</h1>
            <p class="bookmarks-sub">
              Dedicated high-speed discovery center • {{ bookmarksStore.bookmarks.length }} indexed resources across database vault
            </p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn-action-emerald"
          @click="openAddModal"
        >
          <span class="btn-icon">✚</span>
          <span>New Bookmark</span>
        </button>

        <button
          type="button"
          class="btn-action-cyan"
          :disabled="isAutoClassifyingBatch"
          @click="runBatchAutoClassifier"
          title="Analyze all bookmarks and automatically assign category tags"
        >
          <span class="btn-icon">⚡</span>
          <span>Auto-Classify All</span>
        </button>

        <button
          type="button"
          class="btn-action-ghost"
          @click="uiStore.showBookmarkImporter = true"
          title="Import Netscape HTML bookmarks export from Chrome, Brave, Safari, Firefox"
        >
          <span class="btn-icon">📥</span>
          <span>Import HTML</span>
        </button>
      </div>
    </header>

    <!-- Search & Filter Ribbon -->
    <div class="filter-ribbon-card">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="bookmarksStore.searchQuery"
          type="text"
          class="search-input"
          placeholder="Fast search bookmarks by title, domain, URL, or #tag..."
          autofocus
        />
        <button
          v-if="bookmarksStore.searchQuery"
          type="button"
          class="clear-search-btn"
          @click="bookmarksStore.searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <div class="filter-controls-row">
        <!-- Project Filter -->
        <div class="filter-item">
          <label class="filter-label">Vault Project:</label>
          <select v-model="bookmarksStore.selectedProjectId" class="filter-select">
            <option value="all">All Projects ({{ bookmarksStore.bookmarks.length }})</option>
            <option v-for="n in notesStore.notes" :key="n.id" :value="n.id">
              {{ n.title }}
            </option>
          </select>
        </div>

        <!-- Tag Filter -->
        <div class="filter-item">
          <label class="filter-label">Bookmark Tags:</label>
          <select v-model="bookmarksStore.selectedTag" class="filter-select">
            <option value="all">All Tags ({{ bookmarksStore.bookmarkTags.length }})</option>
            <option v-for="t in bookmarksStore.bookmarkTags" :key="t" :value="t">
              #{{ t }}
            </option>
          </select>
        </div>

        <!-- Sort Filter -->
        <div class="filter-item">
          <label class="filter-label">Sort By:</label>
          <select v-model="bookmarksStore.sortBy" class="filter-select">
            <option value="newest">Recently Added</option>
            <option value="title">Title (A-Z)</option>
            <option value="domain">Domain (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Quick Tag Chips Row -->
      <div v-if="bookmarksStore.bookmarkTags.length > 0" class="tag-chips-scroll">
        <span class="tag-chips-label">Bookmark Tags:</span>
        <button
          type="button"
          class="chip-tag"
          :class="{ active: bookmarksStore.selectedTag === 'all' }"
          @click="bookmarksStore.selectedTag = 'all'"
        >
          All
        </button>
        <button
          v-for="tag in bookmarksStore.bookmarkTags.slice(0, 16)"
          :key="tag"
          type="button"
          class="chip-tag"
          :class="{ active: bookmarksStore.selectedTag === tag }"
          @click="bookmarksStore.selectedTag = bookmarksStore.selectedTag === tag ? 'all' : tag"
        >
          #{{ tag }}
        </button>
      </div>
    </div>

    <!-- Main Bookmark Grid -->
    <div class="bookmarks-content-area">
      <div v-if="enrichedFilteredBookmarks.length > 0" class="bookmarks-grid">
        <div
          v-for="bm in enrichedFilteredBookmarks"
          :key="bm.id"
          class="bookmark-card"
        >
          <div class="card-header-bar">
            <div class="domain-tag-badge">
              <span class="globe-dot"></span>
              <span class="domain-text">{{ bm.domain }}</span>
            </div>

            <div class="card-top-actions">
              <button
                type="button"
                class="btn-card-icon speak"
                :class="{ active: isSpeakingId === bm.id }"
                title="Kokoro Neural Audio Readout"
                @click="speakBookmark(bm)"
              >
                {{ isSpeakingId === bm.id ? '🔊' : '🗣️' }}
              </button>
              <button
                type="button"
                class="btn-card-icon"
                title="Edit bookmark"
                @click="openEditModal(bm)"
              >
                ✏️
              </button>
              <button
                type="button"
                class="btn-card-icon danger"
                title="Delete bookmark"
                @click="handleDeleteBookmark(bm)"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-title">
              <a
                :href="bm.url"
                target="_blank"
                rel="noopener noreferrer"
                class="card-title-link"
              >
                {{ bm.title }}
              </a>
            </h3>

            <a
              :href="bm.url"
              target="_blank"
              rel="noopener noreferrer"
              class="card-url-link"
            >
              <span class="link-arrow">↗</span>
              <span class="url-text">{{ bm.url }}</span>
            </a>

            <p v-if="bm.note" class="card-note-text">
              {{ bm.note }}
            </p>

            <!-- Tags -->
            <div class="card-tags-row">
              <span
                v-for="t in bm.tags"
                :key="t"
                class="card-tag-pill"
                :class="{ highlight: bookmarksStore.selectedTag === t }"
                @click="bookmarksStore.selectedTag = t"
              >
                #{{ t }}
              </span>
            </div>

            <!-- Direct Actions: Link to Timeline & Roadmap -->
            <div class="card-link-actions-row">
              <button
                type="button"
                class="btn-card-link-action"
                @click="sendToTimeline(bm)"
                title="Send and embed this bookmark into the project timeline as an event"
              >
                <span class="action-icon">📌</span>
                <span>Add to Timeline</span>
              </button>
              <button
                type="button"
                class="btn-card-link-action"
                @click="openSendToRoadmap(bm)"
                title="Send and link this bookmark to a Roadmap Phase as a key practice"
              >
                <span class="action-icon">🗺️</span>
                <span>Add to Roadmap</span>
              </button>
            </div>
          </div>

          <!-- Card Footer with Parent Project Info -->
          <div class="card-footer-bar">
            <span class="project-pill" :title="`Stored in ${bm.projectTitle}`">
              📁 {{ bm.projectTitle }}
            </span>
            <span class="date-text">{{ bm.date }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-bookmarks-state">
        <div class="empty-icon-wrap">📑</div>
        <h3 class="empty-title">No bookmarks found</h3>
        <p class="empty-desc">
          {{ bookmarksStore.searchQuery ? `No bookmarks match "${bookmarksStore.searchQuery}".` : 'Start organizing your sovereign research by adding or importing bookmarks into the database.' }}
        </p>
        <div class="empty-actions">
          <button
            v-if="bookmarksStore.searchQuery || bookmarksStore.selectedTag !== 'all' || bookmarksStore.selectedProjectId !== 'all'"
            type="button"
            class="btn-reset-filters"
            @click="bookmarksStore.searchQuery = ''; bookmarksStore.selectedTag = 'all'; bookmarksStore.selectedProjectId = 'all'"
          >
            Clear Active Filters
          </button>
          <button
            v-else
            type="button"
            class="btn-action-emerald"
            @click="openAddModal"
          >
            + Create First Bookmark
          </button>
        </div>
      </div>
    </div>

    <!-- Send to Roadmap Phase Picker Modal -->
    <div v-if="showRoadmapPickerModal" class="modal-backdrop" @click.self="showRoadmapPickerModal = false">
      <div class="modal-dialog sm">
        <div class="modal-header">
          <h3 class="modal-title">
            🗺️ Link Bookmark to Roadmap
          </h3>
          <button type="button" class="btn-close" @click="showRoadmapPickerModal = false">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-intro-text">
            Add <strong>"{{ roadmapTargetBookmark?.title }}"</strong> as a Key Practice in a Roadmap Phase:
          </p>

          <div class="form-group">
            <label class="form-label">Target Roadmap Phase:</label>
            <select v-model="selectedRoadmapPhaseId" class="form-select">
              <option v-for="phase in roadmapStore.phases" :key="phase.id" :value="phase.id">
                Phase {{ phase.number }}: {{ phase.title }} ({{ phase.practices.length }} practices)
              </option>
            </select>
          </div>

          <div class="bookmark-preview-snippet">
            <span class="snippet-label">Practice entry preview:</span>
            <span class="snippet-value">
              {{ roadmapTargetBookmark?.title }} ({{ roadmapTargetBookmark?.url }})
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="showRoadmapPickerModal = false">Cancel</button>
          <button type="button" class="btn-save" @click="handleConfirmRoadmapLink">
            Confirm &amp; Add Practice
          </button>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ editingBookmark ? "Edit Bookmark" : "Add Sovereign Bookmark" }}
          </h3>
          <button type="button" class="btn-close" @click="showAddModal = false">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Destination URL:</label>
            <div class="url-input-action-row">
              <input
                v-model="formUrl"
                type="text"
                class="form-input"
                placeholder="https://example.com/research-spec..."
                @blur="triggerAutoClassifyForm"
              />
              <button
                type="button"
                class="btn-auto-tag-inline"
                @click="triggerAutoClassifyForm"
                title="Classify and suggest smart tags"
              >
                ⚡ Auto-Tag
              </button>
            </div>
            <span v-if="autoClassifyStatus" class="classify-feedback-text">{{ autoClassifyStatus }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Bookmark Title:</label>
            <input
              v-model="formTitle"
              type="text"
              class="form-input"
              placeholder="e.g. Kokoro TTS Architecture Specification"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Tags (comma-separated):</label>
            <input
              v-model="formTags"
              type="text"
              class="form-input"
              placeholder="ai, voice, fast, research, docs"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Target Project / Vault Document:</label>
            <select
              v-model="targetProjectForAdd"
              class="form-select"
              :disabled="!!editingBookmark"
            >
              <option v-for="n in notesStore.notes" :key="n.id" :value="n.id">
                {{ n.title }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Takeaway Note (optional):</label>
            <textarea
              v-model="formNote"
              class="form-textarea"
              rows="3"
              placeholder="Key concepts, quotes, or why this link matters..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="showAddModal = false">Cancel</button>
          <button type="button" class="btn-save" @click="handleSaveBookmark">
            {{ editingBookmark ? "Update Bookmark" : "Save Bookmark" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bookmarks-view-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  padding: 1.25rem 2rem 5rem 2rem;
  background: var(--bg-surface, #071510);
  color: var(--text-main, #f0fdf4);
  overflow-y: auto;
  scrollbar-gutter: stable;
  gap: 1.25rem;
}

/* Header */
.bookmarks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-card, #10291e);
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bookmarks-icon-badge {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.12));
  border: 1px solid var(--emerald-pill-border, rgba(52, 211, 153, 0.35));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.pulse-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--emerald-main, #10b981);
  box-shadow: 0 0 8px var(--emerald-bright, #10b981);
}

.bookmarks-main-title {
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary, #fff);
  margin: 0;
}

.bookmarks-sub {
  font-size: 0.85rem;
  color: var(--text-muted, #94a3b8);
  margin: 0.2rem 0 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.btn-action-emerald,
.btn-action-cyan,
.btn-action-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-action-emerald {
  background: var(--emerald-main, #10b981);
  color: var(--bg-body, #04120a);
}
.btn-action-emerald:hover {
  background: var(--emerald-bright, #34d399);
  box-shadow: 0 0 15px var(--border-glow, rgba(16, 185, 129, 0.35));
}

.btn-action-cyan {
  background: var(--emerald-pill-bg, rgba(6, 182, 212, 0.15));
  color: var(--emerald-bright, #22d3ee);
  border: 1px solid var(--emerald-pill-border, rgba(6, 182, 212, 0.35));
}
.btn-action-cyan:hover {
  background: var(--bg-card-hover, rgba(6, 182, 212, 0.25));
  border-color: var(--emerald-bright, #22d3ee);
}

.btn-action-ghost {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-gray, #cbd5e1);
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.1));
}
.btn-action-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary, #fff);
}

/* Filter Ribbon */
.filter-ribbon-card {
  background: var(--bg-card, #0a1e16);
  border: 1px solid var(--border-card, #143526);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  font-size: 1rem;
  color: var(--text-muted, #64748b);
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--bg-surface, rgba(4, 12, 8, 0.7));
  border: 1px solid var(--border-card, rgba(52, 211, 153, 0.25));
  border-radius: 8px;
  padding: 0.65rem 2.2rem 0.65rem 2.5rem;
  color: var(--text-primary, #fff);
  font-size: 0.95rem;
  outline: none;
  transition: all 0.15s ease;
}

.search-input:focus {
  border-color: var(--border-selected, #10b981);
  box-shadow: 0 0 12px var(--border-glow, rgba(16, 185, 129, 0.25));
}

.clear-search-btn {
  position: absolute;
  right: 0.85rem;
  background: none;
  border: none;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  font-size: 0.9rem;
}
.clear-search-btn:hover {
  color: var(--text-primary, #fff);
}

.filter-controls-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.8rem;
  color: var(--text-muted, #94a3b8);
  font-weight: 500;
}

.filter-select {
  background: var(--bg-surface, rgba(4, 12, 8, 0.85));
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.12));
  color: var(--text-primary, #e2e8f0);
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  font-size: 0.85rem;
  outline: none;
  font-family: inherit;
}
.filter-select option {
  background-color: var(--bg-card, #0b1410);
  color: var(--text-primary, #f0fdf4);
}
.filter-select option:checked {
  background-color: var(--bg-card-selected, #0e1c15);
  color: var(--emerald-bright, #34d399);
}
.filter-select:focus {
  border-color: var(--border-selected, #10b981);
}

.tag-chips-scroll {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  padding-top: 0.35rem;
  border-top: 1px solid var(--border-card, rgba(255, 255, 255, 0.05));
}

.tag-chips-label {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-right: 0.25rem;
}

.chip-tag {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.08));
  color: var(--text-gray, #94a3b8);
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.chip-tag:hover {
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.15));
  color: var(--emerald-bright, #34d399);
  border-color: var(--emerald-pill-border, rgba(52, 211, 153, 0.3));
}
.chip-tag.active {
  background: var(--emerald-main, #10b981);
  color: var(--bg-body, #04120a);
  border-color: var(--emerald-main, #10b981);
  font-weight: 600;
}

/* Grid */
.bookmarks-content-area {
  flex: 1;
}

.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.15rem;
}

.bookmark-card {
  background: var(--bg-card, #091a13);
  border: 1px solid var(--border-card, #133425);
  border-radius: 12px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s ease;
  position: relative;
}

.bookmark-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-selected, rgba(52, 211, 153, 0.4));
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px var(--border-glow, rgba(16, 185, 129, 0.1));
}

.card-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.domain-tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.12));
  border: 1px solid var(--emerald-pill-border, rgba(52, 211, 153, 0.25));
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
}

.globe-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--emerald-bright, #34d399);
}

.domain-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--emerald-bright, #34d399);
}

.card-top-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-card-icon {
  background: none;
  border: 1px solid transparent;
  color: var(--text-muted, #64748b);
  border-radius: 6px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-card-icon:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary, #fff);
  border-color: var(--border-card, rgba(255, 255, 255, 0.15));
}
.btn-card-icon.speak.active {
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.25));
  color: var(--emerald-bright, #34d399);
  border-color: var(--emerald-bright, #34d399);
}
.btn-card-icon.danger:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: #ef4444;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
}

.card-title-link {
  color: var(--text-primary, #f8fafc);
  text-decoration: none;
  transition: color 0.15s ease;
}
.card-title-link:hover {
  color: var(--emerald-bright, #34d399);
}

.card-url-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-muted, #64748b);
  font-size: 0.8rem;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-url-link:hover {
  color: var(--text-gray, #94a3b8);
  text-decoration: underline;
}

.link-arrow {
  color: var(--emerald-main, #10b981);
  font-weight: 700;
}

.card-note-text {
  font-size: 0.8rem;
  color: var(--text-gray, #94a3b8);
  line-height: 1.4;
  margin: 0.2rem 0 0 0;
  background: var(--bg-surface, rgba(0, 0, 0, 0.2));
  padding: 0.45rem 0.65rem;
  border-radius: 6px;
  border-left: 2px solid var(--emerald-main, #10b981);
}

.card-tags-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.card-tag-pill {
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.08));
  color: var(--text-muted, #94a3b8);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.card-tag-pill:hover {
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.15));
  color: var(--emerald-bright, #34d399);
}
.card-tag-pill.highlight {
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.25));
  border-color: var(--border-selected, #10b981);
  color: var(--emerald-bright, #34d399);
  font-weight: 600;
}

.card-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.65rem;
  border-top: 1px solid var(--border-card, rgba(255, 255, 255, 0.05));
  font-size: 0.75rem;
}

.project-pill {
  color: var(--text-muted, #64748b);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-text {
  color: var(--text-muted, #475569);
}

/* Empty State */
.empty-bookmarks-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
}

.empty-icon-wrap {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  opacity: 0.6;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #f1f5f9);
  margin: 0 0 0.4rem 0;
}

.empty-desc {
  font-size: 0.9rem;
  color: var(--text-muted, #64748b);
  max-width: 420px;
  margin: 0 0 1.25rem 0;
}

.btn-reset-filters {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.15));
  color: var(--text-primary, #fff);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}
.btn-reset-filters:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(4, 12, 8, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-dialog {
  background: var(--bg-surface, #06140f);
  border: 1px solid var(--border-card, #10291e);
  border-radius: 14px;
  width: 90vw;
  max-width: 580px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px var(--border-glow, rgba(16, 185, 129, 0.15));
  overflow: hidden;
}

.modal-header {
  padding: 1.1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-card, #10291e);
}

.modal-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted, #64748b);
  font-size: 1.1rem;
  cursor: pointer;
}
.btn-close:hover {
  color: var(--text-primary, #fff);
}

.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.8rem;
  color: var(--text-muted, #94a3b8);
  font-weight: 600;
}

.url-input-action-row {
  display: flex;
  gap: 0.5rem;
}

.btn-auto-tag-inline {
  background: var(--emerald-pill-bg, rgba(6, 182, 212, 0.15));
  border: 1px solid var(--emerald-pill-border, rgba(6, 182, 212, 0.35));
  color: var(--emerald-bright, #22d3ee);
  padding: 0 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-auto-tag-inline:hover {
  background: var(--bg-card-hover, rgba(6, 182, 212, 0.25));
}

.classify-feedback-text {
  font-size: 0.75rem;
  color: var(--emerald-bright, #34d399);
  font-weight: 500;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  background: var(--bg-surface, rgba(4, 12, 8, 0.7));
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  color: var(--text-primary, #fff);
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;
}
.form-select option {
  background-color: var(--bg-card, #0b1410);
  color: var(--text-primary, #f0fdf4);
}
.form-select option:checked {
  background-color: var(--bg-card-selected, #0e1c15);
  color: var(--emerald-bright, #34d399);
}
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--border-selected, #10b981);
}

.modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid var(--border-card, #10291e);
}

.btn-cancel {
  background: none;
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.12));
  color: var(--text-muted, #94a3b8);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}
.btn-cancel:hover {
  color: var(--text-primary, #fff);
  background: rgba(255, 255, 255, 0.05);
}

.btn-save {
  background: var(--emerald-main, #10b981);
  border: none;
  color: var(--bg-body, #04120a);
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-save:hover {
  background: var(--emerald-bright, #34d399);
}

/* Card Quick Link Actions */
.card-link-actions-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px dashed var(--border-card, #12281e);
}

.btn-card-link-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.08));
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.22));
  color: var(--emerald-bright, #34d399);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}
.btn-card-link-action:hover {
  background: var(--emerald-main, rgba(16, 185, 129, 0.2));
  color: var(--bg-body, #04120a);
  border-color: var(--emerald-main, #10b981);
  transform: translateY(-1px);
}
.btn-card-link-action:active {
  transform: translateY(0);
}

.btn-card-link-action .action-icon {
  font-size: 0.85rem;
}

/* Small dialog variant */
.modal-dialog.sm {
  max-width: 480px;
}

.modal-intro-text {
  font-size: 0.88rem;
  color: var(--text-gray, #d1fae5);
  line-height: 1.45;
  margin-bottom: 0.25rem;
}

.bookmark-preview-snippet {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  background: var(--bg-surface, rgba(0, 0, 0, 0.35));
  border: 1px solid var(--border-card, #12281e);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  margin-top: 0.5rem;
}

.snippet-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #86efac);
  font-weight: 700;
}

.snippet-value {
  font-size: 0.82rem;
  color: var(--text-primary, #fff);
  font-family: var(--font-mono, monospace);
  word-break: break-all;
}

/* High-Contrast Bookmarks Cyber Scrollbars */
.bookmarks-view-root::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.bookmarks-view-root::-webkit-scrollbar-track {
  background: var(--scrollbar-track, rgba(4, 12, 8, 0.8));
  border-radius: 6px;
}

.bookmarks-view-root::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, rgba(16, 185, 129, 0.45));
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.bookmarks-view-root::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #34d399);
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.4));
}

.bookmarks-view-root {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb, rgba(16, 185, 129, 0.5)) var(--scrollbar-track, rgba(4, 12, 8, 0.8));
}
</style>
