<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";

const uiStore = useUiStore();
const notesStore = useNotesStore();

const localTitle = ref("");
const localBody = ref("");
const previewTab = ref<"split" | "edit" | "preview">("split");
const textareaRef = ref<HTMLTextAreaElement | null>(null);

watch(
  () => uiStore.showFocusEditor,
  (open) => {
    if (open && notesStore.selectedNote) {
      localTitle.value = notesStore.selectedNote.title;
      localBody.value = notesStore.selectedNote.body;
      nextTick(() => textareaRef.value?.focus());
    }
  }
);

// Analytics
const wordCount = computed(() => {
  const words = localBody.value.trim().split(/\s+/).filter(Boolean);
  return words.length;
});

const charCount = computed(() => localBody.value.length);
const readingTimeMin = computed(() => Math.ceil(wordCount.value / 200));

function renderSimpleMarkdown(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/`([^`]+)`/gim, '<code class="md-code">$1</code>')
    .replace(/^\- (.*$)/gim, '<li class="md-li">$1</li>')
    .replace(/\n\n/gim, "<p></p>")
    .replace(/\n/gim, "<br/>");
  return html;
}

async function handleSave() {
  if (notesStore.selectedNote) {
    await notesStore.updateNote(notesStore.selectedNote.id, {
      title: localTitle.value,
      body: localBody.value,
    });
    uiStore.showToast("Changes saved to encrypted vault ✓");
  }
}

function handleSaveAndClose() {
  handleSave();
  uiStore.showFocusEditor = false;
}

function handleKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
    e.preventDefault();
    handleSave();
  } else if (e.key === "Escape") {
    handleSaveAndClose();
  }
}
</script>

<template>
  <div v-if="uiStore.showFocusEditor" class="focus-overlay" @keydown="handleKeyDown">
    <!-- Top Bar -->
    <header class="focus-topbar">
      <div class="focus-brand">
        <img src="/assets/wolf-logo.png" alt="Wolf Logo" class="brand-img" />
        <span class="brand-tag">DEEP FOCUS MODE</span>
      </div>

      <div class="focus-view-toggle">
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: previewTab === 'edit' }"
          @click="previewTab = 'edit'"
        >
          Editor
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: previewTab === 'split' }"
          @click="previewTab = 'split'"
        >
          Split View
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: previewTab === 'preview' }"
          @click="previewTab = 'preview'"
        >
          Live Preview
        </button>
      </div>

      <div class="focus-actions">
        <button type="button" class="btn-save-inline" @click="handleSave">
          <span>Save</span>
          <kbd class="kbd-pill">⌘S</kbd>
        </button>
        <button type="button" class="btn-done" @click="handleSaveAndClose">
          Save &amp; Return
        </button>
      </div>
    </header>

    <!-- Main Editor Pane -->
    <main class="focus-canvas">
      <!-- Title Input -->
      <div class="focus-title-wrap">
        <input
          v-model="localTitle"
          type="text"
          class="focus-title-input"
          placeholder="Note Title..."
        />
      </div>

      <!-- Split / Full Content -->
      <div class="focus-panes-grid" :class="previewTab">
        <!-- Editor Pane -->
        <div v-show="previewTab === 'edit' || previewTab === 'split'" class="pane-editor">
          <textarea
            ref="textareaRef"
            v-model="localBody"
            class="focus-textarea"
            placeholder="Type strategic notes, goals, context and markdown..."
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Live Preview Pane -->
        <div v-show="previewTab === 'preview' || previewTab === 'split'" class="pane-preview">
          <div class="markdown-rendered" v-html="renderSimpleMarkdown(localBody)"></div>
        </div>
      </div>
    </main>

    <!-- Writing Analytics Footer -->
    <footer class="focus-footer">
      <div class="analytics-metrics">
        <span><strong>{{ wordCount }}</strong> words</span>
        <span><strong>{{ charCount }}</strong> characters</span>
        <span><strong>{{ readingTimeMin }}</strong> min read</span>
      </div>
      <span class="focus-esc-hint">Press <kbd>Esc</kbd> or <kbd>⌘S</kbd> to save</span>
    </footer>
  </div>
</template>

<style scoped>
.focus-overlay {
  position: fixed;
  inset: 0;
  background: #060b09;
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

.focus-topbar {
  height: 54px;
  background: #08110d;
  border-bottom: 1px solid #142820;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.focus-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.brand-tag {
  font-size: 11px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  letter-spacing: 0.1em;
}

.focus-view-toggle {
  display: flex;
  background: #050b08;
  border: 1px solid #142820;
  border-radius: 8px;
  padding: 2px;
}

.toggle-btn {
  background: transparent;
  border: none;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.1s ease;
}

.toggle-btn.active {
  background: #11221a;
  color: #fff;
}

.focus-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-save-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid #142820;
  border-radius: 6px;
  padding: 6px 12px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.btn-save-inline:hover {
  background: #0e1c15;
  color: #fff;
}

.kbd-pill {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  background: #11221a;
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--emerald-bright, #34d399);
}

.btn-done {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #03100a;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.btn-done:hover {
  filter: brightness(1.15);
}

.focus-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 40px;
  overflow: hidden;
}

.focus-title-wrap {
  margin-bottom: 16px;
}

.focus-title-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid #142820;
  padding: 8px 0;
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  outline: none;
  transition: border-color 0.15s ease;
}

.focus-title-input:focus {
  border-bottom-color: var(--emerald-bright, #34d399);
}

.focus-panes-grid {
  flex: 1;
  display: grid;
  gap: 24px;
  overflow: hidden;
}

.focus-panes-grid.split {
  grid-template-columns: 1fr 1fr;
}

.focus-panes-grid.edit {
  grid-template-columns: 1fr;
}

.focus-panes-grid.preview {
  grid-template-columns: 1fr;
}

.pane-editor,
.pane-preview {
  height: 100%;
  overflow-y: auto;
}

.focus-textarea {
  width: 100%;
  height: 100%;
  background: #050b08;
  border: 1px solid #142820;
  border-radius: 12px;
  padding: 20px 24px;
  color: #e5e7eb;
  font-family: var(--font-mono, monospace);
  font-size: 13.5px;
  line-height: 1.65;
  resize: none;
  outline: none;
}

.focus-textarea:focus {
  border-color: rgba(16, 185, 129, 0.4);
}

.pane-preview {
  background: #050b08;
  border: 1px solid #142820;
  border-radius: 12px;
  padding: 20px 24px;
  color: #e5e7eb;
}

.markdown-rendered :deep(.md-h1) {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  margin: 16px 0 8px 0;
}

.markdown-rendered :deep(.md-h2) {
  font-size: 16px;
  font-weight: 700;
  color: var(--emerald-bright, #34d399);
  margin: 14px 0 6px 0;
}

.markdown-rendered :deep(.md-h3) {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin: 12px 0 4px 0;
}

.markdown-rendered :deep(.md-code) {
  background: #11221a;
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
}

.markdown-rendered :deep(.md-li) {
  margin-left: 20px;
  margin-bottom: 4px;
}

.focus-footer {
  height: 38px;
  background: #08110d;
  border-top: 1px solid #142820;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 11.5px;
  color: #6b7280;
}

.analytics-metrics {
  display: flex;
  gap: 16px;
}

.analytics-metrics strong {
  color: #e5e7eb;
}

.focus-esc-hint kbd {
  background: #11221a;
  color: var(--emerald-bright, #34d399);
  padding: 1px 4px;
  border-radius: 3px;
}
</style>
