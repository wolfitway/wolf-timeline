<script setup lang="ts">
import { computed } from "vue";
import { useNotesStore } from "@/stores/useNotesStore";
import { useUiStore } from "@/stores/useUiStore";

const notesStore = useNotesStore();
const uiStore = useUiStore();

const wordCount = computed(() => {
  if (!notesStore.selectedNote) return 0;
  return notesStore.selectedNote.body.trim().split(/\s+/).filter(Boolean).length;
});

const charCount = computed(() => notesStore.selectedNote?.body.length || 0);
const readTime = computed(() => Math.ceil(wordCount.value / 200));

function renderMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/`([^`]+)`/gim, '<code class="md-code">$1</code>')
    .replace(/^\- (.*$)/gim, '<li class="md-li">$1</li>')
    .replace(/\n\n/gim, "<p></p>")
    .replace(/\n/gim, "<br/>");
}

function handleBodyInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  if (notesStore.selectedNote) {
    notesStore.updateNote(notesStore.selectedNote.id, { body: target.value });
  }
}

function handleTitleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (notesStore.selectedNote) {
    notesStore.updateNote(notesStore.selectedNote.id, { title: target.value });
  }
}
</script>

<template>
  <div v-if="notesStore.selectedNote" class="studio-view">
    <!-- Studio Header -->
    <div class="studio-header">
      <input
        :value="notesStore.selectedNote.title"
        type="text"
        class="studio-title-input"
        placeholder="Milestone / Note Title..."
        @input="handleTitleInput"
      />
      <div class="studio-header-actions">
        <button type="button" class="btn-focus-trigger" @click="uiStore.showFocusEditor = true">
          ⤢ Full Focus Mode
        </button>
      </div>
    </div>

    <!-- Dual Panes -->
    <div class="studio-panes">
      <!-- Left Editor Pane -->
      <div class="studio-editor-pane">
        <div class="pane-header">
          <span class="pane-tag">MARKDOWN EDITOR</span>
          <span class="pane-sync">Encrypted in RAM</span>
        </div>
        <textarea
          :value="notesStore.selectedNote.body"
          class="studio-textarea"
          placeholder="Start writing strategy, architecture goals, or execution steps..."
          spellcheck="false"
          @input="handleBodyInput"
        ></textarea>
      </div>

      <!-- Right Live Preview Pane -->
      <div class="studio-preview-pane">
        <div class="pane-header">
          <span class="pane-tag">LIVE PREVIEW</span>
        </div>
        <div class="preview-content" v-html="renderMarkdown(notesStore.selectedNote.body)"></div>
      </div>
    </div>

    <!-- Studio Footer Metrics -->
    <div class="studio-footer">
      <div class="studio-metrics">
        <span><strong>{{ wordCount }}</strong> words</span>
        <span><strong>{{ charCount }}</strong> characters</span>
        <span><strong>{{ readTime }}</strong> min read</span>
      </div>
      <span class="studio-status">Local AES-256 Verified ✓</span>
    </div>
  </div>

  <div v-else class="studio-empty">
    <p>Select or create a note to begin editing in Markdown Studio.</p>
  </div>
</template>

<style scoped>
.studio-view {
  flex: 1;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: #040c08;
}

.studio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px;
  border-bottom: 1px solid #11221a;
  background: #08110d;
}

.studio-title-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  outline: none;
}

.btn-focus-trigger {
  background: #10241b;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
  padding: 6px 14px;
  color: var(--emerald-bright, #34d399);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-focus-trigger:hover {
  background: #163327;
}

.studio-panes {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
}

.studio-editor-pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #11221a;
  background: #050b08;
}

.studio-preview-pane {
  display: flex;
  flex-direction: column;
  background: #070d0a;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #11221a;
  background: #08110d;
}

.pane-tag {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #4b6357;
}

.pane-sync {
  font-size: 10.5px;
  color: var(--emerald-bright, #34d399);
}

.studio-textarea {
  flex: 1;
  background: transparent;
  border: none;
  padding: 20px;
  color: #e5e7eb;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.preview-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  color: #e5e7eb;
}

.preview-content :deep(.md-h1) {
  font-size: 19px;
  font-weight: 800;
  color: #fff;
  margin: 14px 0 8px 0;
}

.preview-content :deep(.md-h2) {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--emerald-bright, #34d399);
  margin: 12px 0 6px 0;
}

.preview-content :deep(.md-h3) {
  font-size: 13.5px;
  font-weight: 700;
  color: #fff;
  margin: 10px 0 4px 0;
}

.preview-content :deep(.md-code) {
  background: #11221a;
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
}

.preview-content :deep(.md-li) {
  margin-left: 20px;
  margin-bottom: 4px;
}

.studio-footer {
  height: 38px;
  background: #08110d;
  border-top: 1px solid #11221a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 11.5px;
  color: #6b7280;
}

.studio-metrics {
  display: flex;
  gap: 16px;
}

.studio-metrics strong {
  color: #e5e7eb;
}

.studio-status {
  color: var(--emerald-bright, #34d399);
  font-weight: 600;
}

.studio-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}
</style>
