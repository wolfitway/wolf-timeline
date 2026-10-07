<script setup lang="ts">
import { ref, computed } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { useBookmarksStore } from "@/stores/useBookmarksStore";
import { parseNetscapeBookmarkHtml, convertToWebBookmark, type ParsedBookmark } from "@/services/bookmarkParser";
import { kokoroVoice } from "@/services/voiceGuide";

const uiStore = useUiStore();
const notesStore = useNotesStore();
const bookmarksStore = useBookmarksStore();

const fileInput = ref<HTMLInputElement | null>(null);
const rawFileName = ref<string>("");
const parsedBookmarks = ref<ParsedBookmark[]>([]);
const isImporting = ref<boolean>(false);
const selectedTargetNoteId = ref<number | null>(notesStore.selectedNoteId || notesStore.notes[0]?.id || null);
const createNewProjectWithBookmarks = ref<boolean>(false);
const newProjectTitle = ref<string>("Imported Bookmarks Research Vault");
const searchQuery = ref<string>("");
const selectedFolderFilter = ref<string>("all");

function triggerFilePicker() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function handleFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  rawFileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string;
      const parsed = parseNetscapeBookmarkHtml(content);
      if (parsed.length === 0) {
        uiStore.showToast("No valid bookmarks found in file. Ensure it is an HTML bookmark export.");
        return;
      }
      parsedBookmarks.value = parsed;
      kokoroVoice.playHeartChime("listen");
      kokoroVoice.speak(`Discovered ${parsed.length} bookmarks. Safe and ready to import.`);
      uiStore.showToast(`Loaded ${parsed.length} bookmarks from ${file.name} ✓`);
    } catch (err) {
      console.error(err);
      uiStore.showToast("Error parsing bookmarks HTML file.");
    }
  };
  reader.readAsText(file);
}

// Extracted folders
const uniqueFolders = computed(() => {
  const set = new Set<string>();
  parsedBookmarks.value.forEach((b) => {
    if (b.folder) set.add(b.folder);
  });
  return Array.from(set);
});

// Filtered list
const filteredList = computed(() => {
  let list = parsedBookmarks.value;
  if (selectedFolderFilter.value !== "all") {
    list = list.filter((b) => b.folder === selectedFolderFilter.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
  }
  return list;
});

async function commitImport() {
  if (parsedBookmarks.value.length === 0) return;
  isImporting.value = true;

  try {
    const converted = parsedBookmarks.value.map(convertToWebBookmark);

    let targetNoteId = selectedTargetNoteId.value;

    if (createNewProjectWithBookmarks.value || !targetNoteId) {
      const newNote = await notesStore.addNote({
        title: newProjectTitle.value.trim() || "Imported Sovereign Bookmarks",
        body: `# ${newProjectTitle.value.trim() || 'Imported Sovereign Bookmarks'}\n\nImported ${converted.length} bookmarks from browser on ${new Date().toLocaleDateString()}.\n\nAll links are indexed locally with zero telemetry tracking.`,
        tags: ["bookmarks", "research", "browser-import"],
        kind: "idea",
        status: "research",
        funnel_stage: "awareness",
      });
      targetNoteId = newNote.id;
    }

    if (targetNoteId) {
      notesStore.importBookmarks(targetNoteId, converted);
      notesStore.selectNote(targetNoteId);
    }

    // Persist to sovereign bookmarks database store
    const bookmarksStore = useBookmarksStore();
    await bookmarksStore.importBatchBookmarks(converted, targetNoteId);

    kokoroVoice.playHeartChime("success");
    kokoroVoice.speak(`Successfully imported ${converted.length} bookmarks into your secure vault.`);
    uiStore.showToast(`Imported ${converted.length} bookmarks safely into database vault ✓`);
    closeModal();
  } catch (err) {
    console.error("Import error:", err);
    uiStore.showToast("Failed to import bookmarks.");
  } finally {
    isImporting.value = false;
  }
}

function closeModal() {
  uiStore.showBookmarkImporter = false;
  parsedBookmarks.value = [];
  rawFileName.value = "";
}
</script>

<template>
  <div v-if="uiStore.showBookmarkImporter" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-dialog bookmark-importer-dialog">
      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept=".html,.htm"
        style="display: none"
        @change="handleFileSelected"
      />

      <!-- Header -->
      <div class="modal-header">
        <div class="header-title-wrap">
          <span class="header-icon">📑</span>
          <div>
            <h3 class="modal-title">Sovereign Browser Bookmark Importer</h3>
            <p class="modal-sub">
              Import all your bookmarks from Google Chrome, Mozilla Firefox, Safari, Brave, or Arc. 100% offline &amp; encrypted.
            </p>
          </div>
        </div>
        <button type="button" class="btn-close" @click="closeModal">✕</button>
      </div>

      <!-- Main Body -->
      <div class="modal-body">
        <!-- Step 1: Upload / Dropzone -->
        <div v-if="parsedBookmarks.length === 0" class="upload-dropzone-card" @click="triggerFilePicker">
          <div class="dropzone-glow"></div>
          <div class="dropzone-content">
            <div class="browser-logos-row">
              <span class="browser-chip">🦊 Firefox</span>
              <span class="browser-chip">🌐 Chrome</span>
              <span class="browser-chip">🦁 Brave</span>
              <span class="browser-chip">🧭 Safari</span>
              <span class="browser-chip">🌈 Arc</span>
            </div>
            <div class="dropzone-icon">📥</div>
            <h4 class="dropzone-title">Click to Select Bookmark Export (.html)</h4>
            <p class="dropzone-hint">
              Export bookmarks from your browser (<code>Ctrl/Cmd + Shift + O</code> &rarr; Export to HTML), then choose it here.
            </p>
            <div class="security-guarantee-badge">
              <span>🔒 100% Zero-Cloud Local-Only Encryption</span>
            </div>
          </div>
        </div>

        <!-- Step 2: Inspection & Target Configuration -->
        <div v-else class="imported-content-view">
          <div class="file-summary-bar">
            <div class="summary-left">
              <span class="file-icon">📄</span>
              <span class="file-name">{{ rawFileName }}</span>
              <span class="count-pill">{{ parsedBookmarks.length }} Bookmarks Found</span>
            </div>
            <button type="button" class="btn-reselect" @click="triggerFilePicker">
              Choose Different File
            </button>
          </div>

          <!-- Target Project Selector -->
          <div class="target-config-card">
            <h4 class="card-subtitle">Where should these bookmarks be saved?</h4>
            <div class="target-options-grid">
              <label class="radio-option-card" :class="{ selected: !createNewProjectWithBookmarks }">
                <input
                  v-model="createNewProjectWithBookmarks"
                  type="radio"
                  :value="false"
                  name="importTarget"
                />
                <div class="option-body">
                  <span class="option-title">Add to Existing Project</span>
                  <select
                    v-model="selectedTargetNoteId"
                    class="project-select"
                    :disabled="createNewProjectWithBookmarks"
                  >
                    <option v-for="n in notesStore.notes" :key="n.id" :value="n.id">
                      {{ n.title }} ({{ n.bookmarks?.length || 0 }} existing)
                    </option>
                  </select>
                </div>
              </label>

              <label class="radio-option-card" :class="{ selected: createNewProjectWithBookmarks }">
                <input
                  v-model="createNewProjectWithBookmarks"
                  type="radio"
                  :value="true"
                  name="importTarget"
                />
                <div class="option-body">
                  <span class="option-title">Create Dedicated New Project</span>
                  <input
                    v-model="newProjectTitle"
                    type="text"
                    class="project-title-input"
                    placeholder="Enter project name..."
                    :disabled="!createNewProjectWithBookmarks"
                  />
                </div>
              </label>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="preview-filter-toolbar">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="Search extracted bookmarks..."
              />
            </div>

            <div v-if="uniqueFolders.length" class="folder-filter-wrap">
              <span class="folder-label">Folder:</span>
              <select v-model="selectedFolderFilter" class="folder-select">
                <option value="all">All Folders ({{ parsedBookmarks.length }})</option>
                <option v-for="f in uniqueFolders" :key="f" :value="f">
                  {{ f }}
                </option>
              </select>
            </div>
          </div>

          <!-- Bookmarks Preview List -->
          <div class="bookmarks-scroll-list">
            <div
              v-for="(bm, idx) in filteredList.slice(0, 100)"
              :key="idx"
              class="preview-bookmark-row"
            >
              <span class="bm-index">{{ idx + 1 }}</span>
              <div class="bm-info">
                <div class="bm-title-row">
                  <span class="bm-title">{{ bm.title }}</span>
                  <span v-if="bm.folder" class="bm-folder-pill">📁 {{ bm.folder }}</span>
                </div>
                <span class="bm-url">{{ bm.url }}</span>
              </div>
            </div>

            <div v-if="filteredList.length > 100" class="more-items-notice">
              + {{ filteredList.length - 100 }} more bookmarks will be imported
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
        <button
          v-if="parsedBookmarks.length > 0"
          type="button"
          class="btn-confirm-import"
          :disabled="isImporting"
          @click="commitImport"
        >
          <span v-if="isImporting">⏳ Importing...</span>
          <span v-else>📥 Import All {{ parsedBookmarks.length }} Bookmarks</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  animation: fadeIn 0.15s ease-out;
}

.bookmark-importer-dialog {
  background: var(--bg-surface, #06140f);
  border: 1px solid var(--border-card, #10291e);
  border-radius: 14px;
  width: 90vw;
  max-width: 820px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px var(--emerald-glow, rgba(16, 185, 129, 0.15));
  overflow: hidden;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle, #0d2319);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon {
  font-size: 26px;
}

.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.modal-sub {
  font-size: 12px;
  color: var(--text-secondary, #94a3b8);
  margin: 3px 0 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-dim, #64748b);
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.btn-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Upload dropzone */
.upload-dropzone-card {
  position: relative;
  background: var(--bg-card, #071610);
  border: 2px dashed var(--border-card, #10291e);
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.upload-dropzone-card:hover {
  border-color: var(--emerald-main, #10b981);
  background: var(--bg-card-selected, #061912);
  transform: translateY(-2px);
}

.browser-logos-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.browser-chip {
  background: var(--bg-surface, #06140f);
  border: 1px solid var(--border-subtle, #0d2319);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  color: #e2e8f0;
}

.dropzone-icon {
  font-size: 44px;
  margin-bottom: 12px;
}

.dropzone-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
}

.dropzone-hint {
  font-size: 12.5px;
  color: var(--text-secondary, #94a3b8);
  margin: 0 0 18px;
}

.dropzone-hint code {
  background: var(--bg-surface, #06140f);
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
}

.security-guarantee-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--emerald-pill-bg, #092017);
  border: 1px solid var(--emerald-pill-border, #143d2a);
  color: var(--emerald-bright, #34d399);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 700;
}

/* File summary bar */
.file-summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card, #071610);
  border: 1px solid var(--border-subtle, #0d2319);
  padding: 10px 16px;
  border-radius: 8px;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.count-pill {
  background: var(--emerald-pill-bg, #092017);
  border: 1px solid var(--emerald-pill-border, #143d2a);
  color: var(--emerald-bright, #34d399);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 800;
}

.btn-reselect {
  background: transparent;
  border: 1px solid var(--border-card, #10291e);
  color: var(--text-secondary, #94a3b8);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
}

.btn-reselect:hover {
  color: #fff;
  border-color: var(--emerald-main, #10b981);
}

/* Target Config */
.target-config-card {
  background: var(--bg-card, #071610);
  border: 1px solid var(--border-subtle, #0d2319);
  padding: 14px 16px;
  border-radius: 10px;
}

.card-subtitle {
  font-size: 12.5px;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 10px;
}

.target-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.radio-option-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--bg-surface, #06140f);
  border: 1px solid var(--border-card, #10291e);
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.radio-option-card.selected {
  border-color: var(--emerald-main, #10b981);
  background: var(--bg-card-selected, #061912);
}

.option-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.option-title {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.project-select,
.project-title-input {
  background: var(--bg-input, #040e0a);
  border: 1px solid var(--border-subtle, #0d2319);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  width: 100%;
}

.project-select:focus,
.project-title-input:focus {
  outline: none;
  border-color: var(--emerald-bright, #34d399);
}

/* Filter toolbar */
.preview-filter-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input-wrap {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
}

.search-input {
  width: 100%;
  background: var(--bg-card, #071610);
  border: 1px solid var(--border-subtle, #0d2319);
  color: #fff;
  padding: 7px 10px 7px 32px;
  border-radius: 6px;
  font-size: 12px;
}

.folder-filter-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.folder-label {
  font-size: 12px;
  color: var(--text-dim, #64748b);
}

.folder-select {
  background: var(--bg-card, #071610);
  border: 1px solid var(--border-subtle, #0d2319);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
}

/* Bookmarks scroll list */
.bookmarks-scroll-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--border-subtle, #0d2319);
  border-radius: 8px;
  background: var(--bg-input, #040e0a);
}

.preview-bookmark-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.preview-bookmark-row:last-child {
  border-bottom: none;
}

.bm-index {
  font-size: 11px;
  color: var(--text-dim, #64748b);
  width: 24px;
  font-family: var(--font-mono);
}

.bm-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bm-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bm-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bm-folder-pill {
  background: var(--bg-surface, #06140f);
  border: 1px solid var(--border-card, #10291e);
  color: var(--emerald-bright, #34d399);
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.bm-url {
  font-size: 11px;
  color: var(--text-dim, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-mono);
}

.more-items-notice {
  text-align: center;
  padding: 10px;
  font-size: 11.5px;
  color: var(--text-dim, #64748b);
  font-style: italic;
}

/* Modal Footer */
.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--border-subtle, #0d2319);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-card, #10291e);
  color: var(--text-secondary, #94a3b8);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.btn-confirm-import {
  background: var(--emerald-main, #10b981);
  border: 1px solid var(--emerald-bright, #34d399);
  color: #040c08;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 0 16px var(--emerald-glow, rgba(16, 185, 129, 0.3));
  transition: all 0.15s ease;
}

.btn-confirm-import:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 24px var(--emerald-glow, rgba(16, 185, 129, 0.45));
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
