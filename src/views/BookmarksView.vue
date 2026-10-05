<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useNotesStore } from "@/stores/useNotesStore";
import { useUiStore } from "@/stores/useUiStore";
import { kokoroVoice } from "@/services/voiceGuide";
import { autoClassifyBookmark } from "@/services/bookmarkClassifier";
import type { WebBookmark } from "@/types";

const notesStore = useNotesStore();
const uiStore = useUiStore();

// Search & Filter state
const searchQuery = ref("");
const selectedTag = ref("all");
const selectedCategory = ref("all");
const selectedProjectFilter = ref<number | "all">("all");
const sortBy = ref<"newest" | "title" | "domain">("newest");
const isSpeakingId = ref<string | null>(null);

// New / Edit modal states
const showAddModal = ref(false);
const editingBookmark = ref<EnrichedBookmark | null>(null);
const targetProjectForAdd = ref<number>(notesStore.selectedNoteId || notesStore.notes[0]?.id || 1);

// Add / Edit form
const formUrl = ref("");
const formTitle = ref("");
const formNote = ref("");
const formTags = ref("");
const autoClassifyStatus = ref<string>("");

// Aggregate all bookmarks across all projects with project parent context
interface EnrichedBookmark extends WebBookmark {
  projectTitle: string;
  projectId: number;
}

const allBookmarks = computed<EnrichedBookmark[]>(() => {
  const result: EnrichedBookmark[] = [];
  notesStore.notes.forEach((note) => {
    if (note.bookmarks && Array.isArray(note.bookmarks)) {
      note.bookmarks.forEach((bm) => {
        result.push({
          ...bm,
          projectTitle: note.title,
          projectId: note.id,
        });
      });
    }
  });
  return result;
});

// All unique tags collected across bookmarks
const availableTags = computed(() => {
  const tagsSet = new Set<string>();
  allBookmarks.value.forEach((b) => {
    b.tags?.forEach((t) => tagsSet.add(t));
  });
  return Array.from(tagsSet).sort();
});

// All unique domains
const availableDomains = computed(() => {
  const domainSet = new Set<string>();
  allBookmarks.value.forEach((b) => {
    if (b.domain) domainSet.add(b.domain);
  });
  return Array.from(domainSet).sort();
});

// Filtered & sorted bookmarks
const filteredBookmarks = computed(() => {
  let list = [...allBookmarks.value];

  // Project filter
  if (selectedProjectFilter.value !== "all") {
    list = list.filter((b) => b.projectId === selectedProjectFilter.value);
  }

  // Tag filter
  if (selectedTag.value !== "all") {
    list = list.filter((b) => b.tags?.includes(selectedTag.value));
  }

  // Search filter
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

  // Sort
  if (sortBy.value === "title") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy.value === "domain") {
    list.sort((a, b) => a.domain.localeCompare(b.domain));
  } else {
    // Newest
    list.sort((a, b) => {
      return (b.date || "").localeCompare(a.date || "");
    });
  }

  return list;
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

// Batch Auto-Classifier for ALL existing bookmarks
const isAutoClassifyingBatch = ref(false);
function runBatchAutoClassifier() {
  isAutoClassifyingBatch.value = true;
  let countUpdated = 0;

  notesStore.notes.forEach((note) => {
    if (!note.bookmarks) return;
    note.bookmarks.forEach((bm) => {
      const { suggestedTags } = autoClassifyBookmark(bm.url, bm.title, bm.tags || []);
      if (suggestedTags.length > (bm.tags?.length || 0)) {
        notesStore.updateBookmark(note.id, bm.id, { tags: suggestedTags });
        countUpdated++;
      }
    });
  });

  isAutoClassifyingBatch.value = false;
  kokoroVoice.playHeartChime("success");
  kokoroVoice.speak(`Auto-classified ${countUpdated} bookmarks across your research vault.`);
  uiStore.showToast(`Auto-classified & enriched ${countUpdated} bookmarks ✓`);
}

// Add Bookmark
function openAddModal() {
  formUrl.value = "";
  formTitle.value = "";
  formNote.value = "";
  formTags.value = "";
  targetProjectForAdd.value = notesStore.selectedNoteId || notesStore.notes[0]?.id || 1;
  editingBookmark.value = null;
  showAddModal.value = true;
}

function handleSaveBookmark() {
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
    // Update
    notesStore.updateBookmark(editingBookmark.value.projectId, editingBookmark.value.id, {
      url: formUrl.value.trim(),
      title: formTitle.value.trim() || domain,
      domain,
      note: formNote.value.trim(),
      tags,
    });
    uiStore.showToast("Bookmark updated ✓");
  } else {
    // Add new
    const newBm: WebBookmark = {
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: formUrl.value.trim(),
      title: formTitle.value.trim() || domain,
      domain,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      note: formNote.value.trim(),
      tags,
      fetch_status: "idle",
    };
    notesStore.addBookmark(targetProjectForAdd.value, newBm);
    kokoroVoice.playHeartChime("affirm");
    uiStore.showToast("Bookmark saved to vault ✓");
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

function handleDeleteBookmark(bm: EnrichedBookmark) {
  if (confirm(`Remove bookmark "${bm.title}"?`)) {
    notesStore.deleteBookmark(bm.projectId, bm.id);
    uiStore.showToast("Bookmark deleted ✓");
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
function addTagToBookmark(bm: EnrichedBookmark, tag: string) {
  const currentTags = bm.tags || [];
  if (!currentTags.includes(tag)) {
    notesStore.updateBookmark(bm.projectId, bm.id, {
      tags: [...currentTags, tag],
    });
    uiStore.showToast(`Tagged #${tag} ✓`);
  }
}
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
              Dedicated high-speed discovery center • {{ allBookmarks.length }} indexed resources across {{ notesStore.notes.length }} projects
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
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Fast search bookmarks by title, domain, URL, or #tag..."
          autofocus
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-search-btn"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <div class="filter-controls-row">
        <!-- Project Filter -->
        <div class="filter-item">
          <label class="filter-label">Vault Project:</label>
          <select v-model="selectedProjectFilter" class="filter-select">
            <option value="all">All Projects ({{ allBookmarks.length }})</option>
            <option v-for="n in notesStore.notes" :key="n.id" :value="n.id">
              {{ n.title }} ({{ n.bookmarks?.length || 0 }})
            </option>
          </select>
        </div>

        <!-- Tag Filter -->
        <div class="filter-item">
          <label class="filter-label">Tag Filter:</label>
          <select v-model="selectedTag" class="filter-select">
            <option value="all">All Tags ({{ availableTags.length }})</option>
            <option v-for="t in availableTags" :key="t" :value="t">
              #{{ t }}
            </option>
          </select>
        </div>

        <!-- Sort Filter -->
        <div class="filter-item">
          <label class="filter-label">Sort By:</label>
          <select v-model="sortBy" class="filter-select">
            <option value="newest">Recently Added</option>
            <option value="title">Title (A-Z)</option>
            <option value="domain">Domain (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Quick Tag Chips Row -->
      <div v-if="availableTags.length > 0" class="tag-chips-scroll">
        <span class="tag-chips-label">Quick Tags:</span>
        <button
          type="button"
          class="chip-tag"
          :class="{ active: selectedTag === 'all' }"
          @click="selectedTag = 'all'"
        >
          All
        </button>
        <button
          v-for="tag in availableTags.slice(0, 14)"
          :key="tag"
          type="button"
          class="chip-tag"
          :class="{ active: selectedTag === tag }"
          @click="selectedTag = selectedTag === tag ? 'all' : tag"
        >
          #{{ tag }}
        </button>
      </div>
    </div>

    <!-- Main Bookmark Grid -->
    <div class="bookmarks-content-area">
      <div v-if="filteredBookmarks.length > 0" class="bookmarks-grid">
        <div
          v-for="bm in filteredBookmarks"
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
                :class="{ highlight: selectedTag === t }"
                @click="selectedTag = t"
              >
                #{{ t }}
              </span>
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
          {{ searchQuery ? `No bookmarks match "${searchQuery}".` : 'Start organizing your sovereign research by adding or importing bookmarks.' }}
        </p>
        <div class="empty-actions">
          <button
            v-if="searchQuery || selectedTag !== 'all'"
            type="button"
            class="btn-reset-filters"
            @click="searchQuery = ''; selectedTag = 'all'; selectedProjectFilter = 'all'"
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
  height: calc(100vh - 58px);
  padding: 1.25rem 2rem;
  background: var(--bg-surface, #071510);
  color: var(--text-main, #f0fdf4);
  overflow-y: auto;
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
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.35);
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
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.bookmarks-main-title {
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0;
}

.bookmarks-sub {
  font-size: 0.85rem;
  color: #94a3b8;
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
  background: #10b981;
  color: #04120a;
}
.btn-action-emerald:hover {
  background: #34d399;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.35);
}

.btn-action-cyan {
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.35);
}
.btn-action-cyan:hover {
  background: rgba(6, 182, 212, 0.25);
  border-color: #22d3ee;
}

.btn-action-ghost {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-action-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
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
  color: #64748b;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: rgba(4, 12, 8, 0.7);
  border: 1px solid rgba(52, 211, 153, 0.25);
  border-radius: 8px;
  padding: 0.65rem 2.2rem 0.65rem 2.5rem;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.15s ease;
}

.search-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
}

.clear-search-btn {
  position: absolute;
  right: 0.85rem;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.9rem;
}
.clear-search-btn:hover {
  color: #fff;
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
  color: #94a3b8;
  font-weight: 500;
}

.filter-select {
  background: rgba(4, 12, 8, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  font-size: 0.85rem;
  outline: none;
}
.filter-select:focus {
  border-color: #10b981;
}

.tag-chips-scroll {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.tag-chips-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-right: 0.25rem;
}

.chip-tag {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.chip-tag:hover {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.3);
}
.chip-tag.active {
  background: #10b981;
  color: #04120a;
  border-color: #10b981;
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
  border-color: rgba(52, 211, 153, 0.4);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(16, 185, 129, 0.1);
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
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.25);
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
}

.globe-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34d399;
}

.domain-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #34d399;
}

.card-top-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-card-icon {
  background: none;
  border: 1px solid transparent;
  color: #64748b;
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
  color: #fff;
  border-color: rgba(255, 255, 255, 0.15);
}
.btn-card-icon.speak.active {
  background: rgba(16, 185, 129, 0.25);
  color: #34d399;
  border-color: #34d399;
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
  color: #f8fafc;
  text-decoration: none;
  transition: color 0.15s ease;
}
.card-title-link:hover {
  color: #34d399;
}

.card-url-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #64748b;
  font-size: 0.8rem;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-url-link:hover {
  color: #94a3b8;
  text-decoration: underline;
}

.link-arrow {
  color: #10b981;
  font-weight: 700;
}

.card-note-text {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
  margin: 0.2rem 0 0 0;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.45rem 0.65rem;
  border-radius: 6px;
  border-left: 2px solid #10b981;
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.card-tag-pill:hover {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}
.card-tag-pill.highlight {
  background: rgba(16, 185, 129, 0.25);
  border-color: #10b981;
  color: #34d399;
  font-weight: 600;
}

.card-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.75rem;
}

.project-pill {
  color: #64748b;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-text {
  color: #475569;
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
  color: #f1f5f9;
  margin: 0 0 0.4rem 0;
}

.empty-desc {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 420px;
  margin: 0 0 1.25rem 0;
}

.btn-reset-filters {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.15);
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
  color: #fff;
}

.btn-close {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.1rem;
  cursor: pointer;
}
.btn-close:hover {
  color: #fff;
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
  color: #94a3b8;
  font-weight: 600;
}

.url-input-action-row {
  display: flex;
  gap: 0.5rem;
}

.btn-auto-tag-inline {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.35);
  color: #22d3ee;
  padding: 0 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-auto-tag-inline:hover {
  background: rgba(6, 182, 212, 0.25);
}

.classify-feedback-text {
  font-size: 0.75rem;
  color: #34d399;
  font-weight: 500;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  background: rgba(4, 12, 8, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;
}
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #10b981;
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
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}
.btn-cancel:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.btn-save {
  background: #10b981;
  border: none;
  color: #04120a;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-save:hover {
  background: #34d399;
}
</style>
