<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { renderMarkdown, toggleTaskInMarkdown } from "@/services/markdownRenderer";

const uiStore = useUiStore();
const notesStore = useNotesStore();

const localTitle = ref("");
const localBody = ref("");
const previewTab = ref<"split" | "edit" | "preview">("split");
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// Zen Customization
type CanvasWidth = "narrow" | "normal" | "wide";
const canvasWidth = ref<CanvasWidth>("normal");

type ZenTheme = "default" | "oled" | "pine";
const zenTheme = ref<ZenTheme>("default");

const isFullscreen = ref(false);

watch(
  () => uiStore.showFocusEditor,
  (open) => {
    if (open && notesStore.selectedNote) {
      localTitle.value = notesStore.selectedNote.title || "";
      localBody.value = notesStore.selectedNote.body || "";
      nextTick(() => textareaRef.value?.focus());
    }
  }
);

// Cognitive Writing Metrics
const wordCount = computed(() => {
  const words = localBody.value.trim().split(/\s+/).filter(Boolean);
  return words.length;
});

const charCount = computed(() => localBody.value.length);
const lineCount = computed(() => (localBody.value ? localBody.value.split("\n").length : 0));
const readingTimeMin = computed(() => Math.max(1, Math.ceil(wordCount.value / 200)));
const speakTimeMin = computed(() => Math.max(1, Math.ceil(wordCount.value / 130)));

// Complexity
const complexityScore = computed(() => {
  if (wordCount.value < 10) return "Draft";
  const avgLen = charCount.value / (wordCount.value || 1);
  if (avgLen > 6.2) return "Technical / High Density";
  if (avgLen > 5.2) return "Executive Spec";
  return "Clear & Accessible";
});

// Formatting Helpers
function insertFormatting(prefix: string, suffix = "", placeholder = "") {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = localBody.value;
  const selected = text.substring(start, end) || placeholder;

  localBody.value = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
  nextTick(() => {
    textarea.focus();
    const newCursor = start + prefix.length + selected.length;
    textarea.setSelectionRange(newCursor, newCursor);
  });
}

function insertLinePrefix(prefix: string) {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const text = localBody.value;
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;

  localBody.value = text.substring(0, lineStart) + prefix + text.substring(lineStart);
  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length);
  });
}

function insertTable() {
  const table = "\n| Feature | Status | Details |\n| :--- | :--- | :--- |\n| **Sovereign Arch** | Ready ✓ | Local-first |\n| **AES-256 Vault** | Sealed | Zero leaks |\n";
  insertFormatting(table);
}

function insertCallout(type: "NOTE" | "TIP" | "WARNING") {
  const template = `\n> [!${type}]\n> Enter crucial context or sovereign advisory notes here.\n`;
  insertFormatting(template);
}

// Interactive Preview Click: Toggle Tasks & Copy Code
function handlePreviewClick(e: MouseEvent) {
  const target = e.target as HTMLElement;

  // 1. Copy code block button
  if (target.classList.contains("btn-code-copy") || target.closest(".btn-code-copy")) {
    const btn = target.classList.contains("btn-code-copy") ? target : (target.closest(".btn-code-copy") as HTMLElement);
    const code = btn.getAttribute("data-code");
    if (code) {
      navigator.clipboard.writeText(decodeURIComponent(code));
      uiStore.showToast("Code copied to clipboard ✓");
    }
    return;
  }

  // 2. Interactive task checkbox click
  if (target.classList.contains("task-checkbox")) {
    const input = target as HTMLInputElement;
    const taskIdx = parseInt(input.getAttribute("data-task-index") || "-1", 10);
    if (taskIdx >= 0) {
      localBody.value = toggleTaskInMarkdown(localBody.value, taskIdx, input.checked);
      uiStore.showToast(`Task ${input.checked ? "checked" : "unchecked"} ✓`);
    }
  }
}

async function handleSave() {
  if (notesStore.selectedNote) {
    await notesStore.updateNote(notesStore.selectedNote.id, {
      title: localTitle.value,
      body: localBody.value,
    });
    uiStore.showToast("Saved to encrypted sovereign vault ✓");
  }
}

function handleSaveAndClose() {
  handleSave();
  uiStore.showFocusEditor = false;
}

function handleKeyDown(e: KeyboardEvent) {
  // Save shortcut (⌘S / Ctrl+S)
  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
    e.preventDefault();
    handleSave();
    return;
  }

  // Bold shortcut (⌘B / Ctrl+B)
  if ((e.metaKey || e.ctrlKey) && e.key === "b") {
    e.preventDefault();
    insertFormatting("**", "**", "bold text");
    return;
  }

  // Italic shortcut (⌘I / Ctrl+I)
  if ((e.metaKey || e.ctrlKey) && e.key === "i") {
    e.preventDefault();
    insertFormatting("*", "*", "italic text");
    return;
  }

  // Tab indent
  if (e.key === "Tab") {
    e.preventDefault();
    const textarea = textareaRef.value;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    localBody.value = localBody.value.substring(0, start) + "  " + localBody.value.substring(end);
    nextTick(() => {
      textarea.setSelectionRange(start + 2, start + 2);
    });
    return;
  }

  // Escape to close
  if (e.key === "Escape") {
    handleSaveAndClose();
  }
}

function toggleNativeFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}
</script>

<template>
  <div
    v-if="uiStore.showFocusEditor"
    class="focus-overlay"
    :class="[zenTheme, { 'is-fullscreen': isFullscreen }]"
    @keydown="handleKeyDown"
  >
    <!-- Top Sovereign Control Bar -->
    <header class="focus-topbar">
      <div class="topbar-left">
        <div class="brand-pill">
          <span class="wolf-glyph">🐺</span>
          <span class="brand-label">DEEP ZEN FOCUS</span>
        </div>

        <!-- View Mode Switcher -->
        <div class="focus-view-toggle">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: previewTab === 'edit' }"
            @click="previewTab = 'edit'"
          >
            ✎ Write
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: previewTab === 'split' }"
            @click="previewTab = 'split'"
          >
            ◫ Split
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: previewTab === 'preview' }"
            @click="previewTab = 'preview'"
          >
            👁 Preview
          </button>
        </div>
      </div>

      <!-- Center Ribbon: Zen Formatting Strip (shown in edit/split) -->
      <div v-show="previewTab !== 'preview'" class="focus-mini-ribbon">
        <button type="button" class="btn-ribbon" title="Heading 1" @click="insertLinePrefix('# ')">H1</button>
        <button type="button" class="btn-ribbon" title="Heading 2" @click="insertLinePrefix('## ')">H2</button>
        <button type="button" class="btn-ribbon" title="Bold" @click="insertFormatting('**', '**', 'bold')"><strong>B</strong></button>
        <button type="button" class="btn-ribbon" title="Italic" @click="insertFormatting('*', '*', 'italic')"><em>I</em></button>
        <button type="button" class="btn-ribbon" title="Checklist" @click="insertLinePrefix('- [ ] ')">☑</button>
        <button type="button" class="btn-ribbon" title="Quote" @click="insertLinePrefix('> ')">❝</button>
        <button type="button" class="btn-ribbon" title="Code" @click="insertFormatting('`', '`', 'code')">`</button>
        <button type="button" class="btn-ribbon" title="Table" @click="insertTable">⊞</button>
        <button type="button" class="btn-ribbon note" title="Note Alert" @click="insertCallout('NOTE')">ℹ</button>
        <button type="button" class="btn-ribbon tip" title="Tip Alert" @click="insertCallout('TIP')">💡</button>
        <button type="button" class="btn-ribbon warn" title="Warn Alert" @click="insertCallout('WARNING')">⚠️</button>
      </div>

      <!-- Right Actions: Width, Theme, Fullscreen, Save -->
      <div class="topbar-right">
        <!-- Canvas Width Switcher -->
        <div class="control-pill-group">
          <button
            type="button"
            class="pill-btn"
            :class="{ active: canvasWidth === 'narrow' }"
            title="Comfortable Reading Width (760px)"
            @click="canvasWidth = 'narrow'"
          >
            Narrow
          </button>
          <button
            type="button"
            class="pill-btn"
            :class="{ active: canvasWidth === 'normal' }"
            title="Balanced Width (1050px)"
            @click="canvasWidth = 'normal'"
          >
            Normal
          </button>
          <button
            type="button"
            class="pill-btn"
            :class="{ active: canvasWidth === 'wide' }"
            title="Full Canvas Width"
            @click="canvasWidth = 'wide'"
          >
            Full
          </button>
        </div>

        <!-- Zen Theme Toggle -->
        <div class="control-pill-group">
          <button
            type="button"
            class="pill-btn"
            :class="{ active: zenTheme === 'default' }"
            title="Emerald Dark"
            @click="zenTheme = 'default'"
          >
            🌲
          </button>
          <button
            type="button"
            class="pill-btn"
            :class="{ active: zenTheme === 'oled' }"
            title="OLED Pure Black"
            @click="zenTheme = 'oled'"
          >
            ⚫
          </button>
          <button
            type="button"
            class="pill-btn"
            :class="{ active: zenTheme === 'pine' }"
            title="Deep Navy Night"
            @click="zenTheme = 'pine'"
          >
            🌌
          </button>
        </div>

        <!-- Fullscreen Button -->
        <button
          type="button"
          class="btn-icon-fullscreen"
          :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F11)'"
          @click="toggleNativeFullscreen"
        >
          {{ isFullscreen ? '⤡' : '⤢' }}
        </button>

        <!-- Save & Close Actions -->
        <button type="button" class="btn-save-inline" @click="handleSave" title="Save changes (⌘S)">
          <span>Save</span>
          <kbd class="kbd-pill">⌘S</kbd>
        </button>

        <button type="button" class="btn-done" @click="handleSaveAndClose">
          Done (Esc)
        </button>
      </div>
    </header>

    <!-- Main Distraction-Free Canvas -->
    <main class="focus-canvas" :class="[canvasWidth]">
      <div class="focus-container">
        <!-- Title Header -->
        <div class="focus-title-wrap">
          <input
            v-model="localTitle"
            type="text"
            class="focus-title-input"
            placeholder="Document Title..."
          />
        </div>

        <!-- Dual Panes: Write & Live Preview -->
        <div class="focus-panes-grid" :class="previewTab">
          <!-- Editor Pane -->
          <div v-show="previewTab === 'edit' || previewTab === 'split'" class="pane-editor">
            <textarea
              ref="textareaRef"
              v-model="localBody"
              class="focus-textarea"
              placeholder="Draft sovereign architecture, roadmap vision, or specs in pure uninterrupted focus..."
              spellcheck="false"
            ></textarea>
          </div>

          <!-- Live Markdown Preview with Interactive Checklists -->
          <div
            v-show="previewTab === 'preview' || previewTab === 'split'"
            class="pane-preview"
          >
            <div
              class="markdown-rendered preview-content"
              @click="handlePreviewClick"
              v-html="renderMarkdown(localBody)"
            ></div>
          </div>
        </div>
      </div>
    </main>

    <!-- Writing Analytics & Security Status Footer -->
    <footer class="focus-footer">
      <div class="footer-metrics">
        <span class="metric"><strong>{{ wordCount }}</strong> words</span>
        <span class="metric"><strong>{{ charCount }}</strong> characters</span>
        <span class="metric"><strong>{{ lineCount }}</strong> lines</span>
        <span class="metric">⏱ <strong>{{ readingTimeMin }}</strong>m read</span>
        <span class="metric">🗣 <strong>{{ speakTimeMin }}</strong>m speak</span>
        <span class="metric complexity">📊 {{ complexityScore }}</span>
      </div>

      <div class="footer-status">
        <span class="save-status">🔒 Vault AES-256 Memory Encrypted</span>
        <span class="esc-hint">Press <kbd>Esc</kbd> to return • <kbd>⌘S</kbd> to save</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.focus-overlay {
  position: fixed;
  inset: 0;
  background: #040c08;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: text;
}

/* Zen Themes */
.focus-overlay.oled {
  background: #000000;
}
.focus-overlay.oled .focus-topbar,
.focus-overlay.oled .focus-footer {
  background: #050505;
  border-color: #141414;
}

.focus-overlay.pine {
  background: #030a10;
}
.focus-overlay.pine .focus-topbar,
.focus-overlay.pine .focus-footer {
  background: #06111b;
  border-color: #0d2235;
}

/* Top Control Bar */
.focus-topbar {
  height: 52px;
  min-height: 52px;
  background: #06100b;
  border-bottom: 1px solid #102419;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-pill {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wolf-glyph {
  font-size: 16px;
}

.brand-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  letter-spacing: 0.12em;
}

.focus-view-toggle {
  display: flex;
  background: #030805;
  border: 1px solid #14281f;
  border-radius: 6px;
  padding: 2px;
}

.toggle-btn {
  background: transparent;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-btn.active {
  background: #0e2417;
  color: #fff;
  border: 1px solid #1b472e;
}

/* Mini Formatting Ribbon */
.focus-mini-ribbon {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #040906;
  border: 1px solid #102117;
  border-radius: 6px;
  padding: 2px 6px;
}

.btn-ribbon {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-ribbon:hover {
  background: #0d2017;
  color: #fff;
}

.btn-ribbon.note { color: #93c5fd; }
.btn-ribbon.tip { color: #6ee7b7; }
.btn-ribbon.warn { color: #fcd34d; }

/* Right Controls */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-pill-group {
  display: flex;
  background: #030805;
  border: 1px solid #14281f;
  border-radius: 6px;
  padding: 2px;
}

.pill-btn {
  background: transparent;
  border: none;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 700;
  color: #88929b;
  cursor: pointer;
}

.pill-btn.active {
  background: #0f2619;
  color: var(--emerald-bright, #34d399);
}

.btn-icon-fullscreen {
  background: #0a1711;
  border: 1px solid #153223;
  color: #9ca3af;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-icon-fullscreen:hover {
  color: #fff;
  border-color: var(--emerald-main, #10b981);
}

.btn-save-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #08160f;
  border: 1px solid #153825;
  border-radius: 6px;
  padding: 5px 12px;
  color: #9ca3af;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.btn-save-inline:hover {
  background: #0e2619;
  color: #fff;
  border-color: var(--emerald-main, #10b981);
}

.kbd-pill {
  font-family: var(--font-mono, monospace);
  font-size: 9.5px;
  background: #0f2b1d;
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--emerald-bright, #34d399);
}

.btn-done {
  background: var(--emerald-main, #10b981);
  color: #03100a;
  border: 1px solid #34d399;
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-done:hover {
  background: #34d399;
  box-shadow: 0 0 14px rgba(52, 211, 153, 0.4);
}

/* Canvas Layout */
.focus-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 32px;
  overflow: hidden;
  min-height: 0;
}

.focus-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: max-width 0.2s ease;
}

.focus-canvas.narrow .focus-container {
  max-width: 780px;
}
.focus-canvas.normal .focus-container {
  max-width: 1100px;
}
.focus-canvas.wide .focus-container {
  max-width: 100%;
}

.focus-title-wrap {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.focus-title-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid #14281f;
  padding: 8px 0;
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  outline: none;
  letter-spacing: -0.02em;
  transition: border-color 0.15s ease;
}

.focus-title-input:focus {
  border-bottom-color: var(--emerald-main, #10b981);
}

/* Panes Grid */
.focus-panes-grid {
  flex: 1;
  display: grid;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border: 1px solid #11241a;
  border-radius: 8px;
  background: #030805;
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

.pane-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border-right: 1px solid #102117;
  overflow: hidden;
}

.focus-textarea {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: transparent;
  border: none;
  padding: 24px;
  color: #e5e7eb;
  font-family: var(--font-mono, "JetBrains Mono", monospace);
  font-size: 14px;
  line-height: 1.8;
  resize: none;
  outline: none;
  tab-size: 2;
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.pane-preview {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: #040a06;
  overflow: hidden;
}

.preview-content {
  flex: 1;
  padding: 24px 32px 60px 32px;
  overflow-y: auto;
  overscroll-behavior: contain;
  color: #e5e7eb;
  line-height: 1.8;
  font-size: 14px;
  box-sizing: border-box;
}

/* Markdown typography in Zen Mode */
.preview-content :deep(.md-h1) {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  border-bottom: 1px solid #12241b;
  padding-bottom: 8px;
  margin: 16px 0 10px 0;
}

.preview-content :deep(.md-h2) {
  font-size: 18px;
  font-weight: 700;
  color: var(--emerald-bright, #34d399);
  margin: 16px 0 8px 0;
}

.preview-content :deep(.md-h3) {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin: 14px 0 6px 0;
}

.preview-content :deep(.md-code-inline) {
  background: #091710;
  border: 1px solid #143525;
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 12.5px;
}

.preview-content :deep(.md-codeblock-wrapper) {
  background: #040906;
  border: 1px solid #12261b;
  border-radius: 8px;
  margin: 14px 0;
  overflow: hidden;
}

.preview-content :deep(.codeblock-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #08140e;
  padding: 6px 14px;
  border-bottom: 1px solid #102117;
}

.preview-content :deep(.codeblock-lang) {
  font-size: 10px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  text-transform: uppercase;
}

.preview-content :deep(.btn-code-copy) {
  background: #0d2217;
  border: 1px solid #183e29;
  color: #9ca3af;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.preview-content :deep(.btn-code-copy:hover) {
  color: #fff;
  border-color: var(--emerald-main, #10b981);
}

.preview-content :deep(.md-pre) {
  margin: 0;
  padding: 14px 18px;
  overflow-x: auto;
  font-family: var(--font-mono, monospace);
  font-size: 12.5px;
  line-height: 1.6;
  color: #d1d5db;
}

.preview-content :deep(.md-task-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
}

.preview-content :deep(.task-checkbox) {
  accent-color: var(--emerald-main, #10b981);
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.preview-content :deep(.md-task-item.checked .task-label) {
  text-decoration: line-through;
  color: #6b7280;
}

.preview-content :deep(.md-callout) {
  border-radius: 8px;
  padding: 12px 16px;
  margin: 14px 0;
}
.preview-content :deep(.md-callout-note) {
  background: rgba(59, 130, 246, 0.08);
  border-left: 3px solid #3b82f6;
}
.preview-content :deep(.md-callout-tip) {
  background: rgba(16, 185, 129, 0.08);
  border-left: 3px solid #10b981;
}
.preview-content :deep(.md-callout-warning) {
  background: rgba(245, 158, 11, 0.08);
  border-left: 3px solid #f59e0b;
}

.preview-content :deep(.table-responsive) {
  overflow-x: auto;
  margin: 16px 0;
}

.preview-content :deep(.md-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.preview-content :deep(.md-table th) {
  background: #091710;
  color: var(--emerald-bright, #34d399);
  padding: 8px 12px;
  border: 1px solid #142e20;
  text-align: left;
}

.preview-content :deep(.md-table td) {
  padding: 8px 12px;
  border: 1px solid #12241a;
}

/* Custom Scrollbars */
.focus-textarea::-webkit-scrollbar,
.preview-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.focus-textarea::-webkit-scrollbar-track,
.preview-content::-webkit-scrollbar-track {
  background: #030805;
}
.focus-textarea::-webkit-scrollbar-thumb,
.preview-content::-webkit-scrollbar-thumb {
  background: #143525;
  border-radius: 4px;
  border: 1px solid #030805;
}
.focus-textarea::-webkit-scrollbar-thumb:hover,
.preview-content::-webkit-scrollbar-thumb:hover {
  background: var(--emerald-main, #10b981);
}

/* Footer Metrics */
.focus-footer {
  height: 38px;
  min-height: 38px;
  background: #06100b;
  border-top: 1px solid #102419;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 11px;
  color: #6b7280;
  flex-shrink: 0;
}

.footer-metrics {
  display: flex;
  align-items: center;
  gap: 14px;
}

.metric strong {
  color: #e5e7eb;
}

.metric.complexity {
  color: var(--emerald-bright, #34d399);
  background: #091a11;
  border: 1px solid #143525;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 700;
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 16px;
}

.save-status {
  color: #34d399;
  font-weight: 600;
}

.esc-hint kbd {
  font-family: var(--font-mono, monospace);
  background: #0e2017;
  padding: 1px 4px;
  border-radius: 3px;
  color: #d1d5db;
}
</style>
