<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useNotesStore } from "@/stores/useNotesStore";
import { useUiStore } from "@/stores/useUiStore";
import { useShortcutsStore } from "@/stores/useShortcutsStore";
import { renderMarkdown, toggleTaskInMarkdown } from "@/services/markdownRenderer";
import type { Note } from "@/types";

const notesStore = useNotesStore();
const uiStore = useUiStore();
const shortcutsStore = useShortcutsStore();

// Textarea and preview references for scrolling & cursor
const editorTextarea = ref<HTMLTextAreaElement | null>(null);
const previewContentRef = ref<HTMLDivElement | null>(null);
const isSyncScrollEnabled = ref<boolean>(false);
const activeHoverPane = ref<"editor" | "preview" | null>(null);

function onEditorScroll() {
  if (!isSyncScrollEnabled.value || activeHoverPane.value !== "editor" || !editorTextarea.value || !previewContentRef.value) return;
  const textarea = editorTextarea.value;
  const preview = previewContentRef.value;
  const maxScrollTextarea = textarea.scrollHeight - textarea.clientHeight;
  if (maxScrollTextarea > 0) {
    const ratio = textarea.scrollTop / maxScrollTextarea;
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  }
}

function onPreviewScroll() {
  if (!isSyncScrollEnabled.value || activeHoverPane.value !== "preview" || !editorTextarea.value || !previewContentRef.value) return;
  const textarea = editorTextarea.value;
  const preview = previewContentRef.value;
  const maxScrollPreview = preview.scrollHeight - preview.clientHeight;
  if (maxScrollPreview > 0) {
    const ratio = preview.scrollTop / maxScrollPreview;
    textarea.scrollTop = ratio * (textarea.scrollHeight - textarea.clientHeight);
  }
}

// Studio Layout & View State
type ViewMode = "split" | "editor" | "preview";
const viewMode = ref<ViewMode>("split");
const showSidebar = ref<boolean>(true);
const sidebarSearch = ref<string>("");
const sidebarFilter = ref<string>("all");
const showTemplateMenu = ref<boolean>(false);
const newTagInput = ref<string>("");
const isAddingTag = ref<boolean>(false);

// Filtered notes list for Studio Navigator
const studioNotes = computed(() => {
  return notesStore.notes.filter((n) => {
    // Category / status filter
    if (sidebarFilter.value !== "all") {
      if (sidebarFilter.value === "milestone" && n.kind !== "milestone") return false;
      if (sidebarFilter.value === "idea" && n.kind !== "idea") return false;
      if (sidebarFilter.value === "live" && n.status !== "live" && n.status !== "shipped") return false;
      if (sidebarFilter.value === "in_progress" && n.status !== "in_progress") return false;
    }
    // Search query filter
    if (sidebarSearch.value.trim()) {
      const q = sidebarSearch.value.toLowerCase().trim();
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });
});

// Cognitive Intelligence & Writing Metrics
const wordCount = computed(() => {
  if (!notesStore.selectedNote?.body) return 0;
  return notesStore.selectedNote.body.trim().split(/\s+/).filter(Boolean).length;
});

const charCount = computed(() => notesStore.selectedNote?.body.length || 0);
const lineCount = computed(() => {
  if (!notesStore.selectedNote?.body) return 0;
  return notesStore.selectedNote.body.split("\n").length;
});
const readTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 200)));
const speakTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 130)));

// Readability Complexity Estimate
const readabilityScore = computed(() => {
  if (wordCount.value < 10) return "Draft";
  const avgWordLen = charCount.value / (wordCount.value || 1);
  if (avgWordLen > 6.2) return "Technical / High Density";
  if (avgWordLen > 5.2) return "Standard Executive";
  return "Clear & Accessible";
});

// Note Input Handlers
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

function handleStatusChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  if (notesStore.selectedNote) {
    notesStore.updateNote(notesStore.selectedNote.id, { status: target.value as any });
    uiStore.showToast(`Status changed to ${target.value} ✓`);
  }
}

// Tag Management
function removeTag(tagToRemove: string) {
  if (!notesStore.selectedNote) return;
  const updatedTags = notesStore.selectedNote.tags.filter((t) => t !== tagToRemove);
  notesStore.updateNote(notesStore.selectedNote.id, { tags: updatedTags });
}

function addTag() {
  if (!notesStore.selectedNote) return;
  const tag = newTagInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!tag) {
    isAddingTag.value = false;
    return;
  }
  if (!notesStore.selectedNote.tags.includes(tag)) {
    const updated = [...notesStore.selectedNote.tags, tag];
    notesStore.updateNote(notesStore.selectedNote.id, { tags: updated });
    uiStore.showToast(`Tag #${tag} added ✓`);
  }
  newTagInput.value = "";
  isAddingTag.value = false;
}

// Formatting Ribbon Actions
function insertFormatting(prefix: string, suffix: string = "", placeholder: string = "") {
  if (!editorTextarea.value || !notesStore.selectedNote) return;
  const textarea = editorTextarea.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const original = textarea.value;

  const selected = original.substring(start, end) || placeholder;
  const replacement = `${prefix}${selected}${suffix}`;

  const nextVal = original.substring(0, start) + replacement + original.substring(end);
  notesStore.updateNote(notesStore.selectedNote.id, { body: nextVal });

  nextTick(() => {
    textarea.focus();
    const newStart = start + prefix.length;
    const newEnd = newStart + selected.length;
    textarea.setSelectionRange(newStart, newEnd);
  });
}

function insertLinePrefix(prefix: string) {
  if (!editorTextarea.value || !notesStore.selectedNote) return;
  const textarea = editorTextarea.value;
  const start = textarea.selectionStart;
  const original = textarea.value;

  // Find start of current line
  const lineStart = original.lastIndexOf("\n", start - 1) + 1;
  const nextVal = original.substring(0, lineStart) + prefix + original.substring(lineStart);
  notesStore.updateNote(notesStore.selectedNote.id, { body: nextVal });

  nextTick(() => {
    textarea.focus();
    const newCursor = start + prefix.length;
    textarea.setSelectionRange(newCursor, newCursor);
  });
}

function insertTable() {
  const tableTemplate = `
| Column 1 | Column 2 | Column 3 |
| :--- | :--- | :--- |
| Item Alpha | Active | 100% |
| Item Beta | In Progress | 75% |
| Item Gamma | Review | 40% |
`;
  insertFormatting("\n" + tableTemplate.trim() + "\n");
}

function insertCallout(type: "NOTE" | "TIP" | "WARNING" | "IMPORTANT") {
  const template = `\n> [!${type}]\n> Summarize key architectural invariant or warning here.\n`;
  insertFormatting(template);
}

function insertTimestamp() {
  const now = new Date();
  const dateStr = now.toISOString().replace("T", " ").substring(0, 16);
  insertFormatting(`**[${dateStr}]** `);
}

function insertLinkPrompt() {
  const url = prompt("Enter URL:", "https://");
  if (!url) return;
  insertFormatting("[", `](${url})`, "Link Title");
}

function insertImagePrompt() {
  const url = prompt("Enter Image URL or Data URI:", "https://");
  if (!url) return;
  insertFormatting(`![Alt description](${url})\n`);
}

// Keyboard navigation inside Editor Textarea
function handleTextareaKeyDown(e: KeyboardEvent) {
  // Tab key indents by 2 spaces
  if (e.key === "Tab") {
    e.preventDefault();
    insertFormatting("  ");
    return;
  }
  // ⌘B / Ctrl+B for Bold
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
    e.preventDefault();
    insertFormatting("**", "**", "bold text");
    return;
  }
  // ⌘I / Ctrl+I for Italic
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
    e.preventDefault();
    insertFormatting("*", "*", "italic text");
    return;
  }
  // ⌘S / Ctrl+S for Save confirmation
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    uiStore.showToast("Sovereign document autosaved to vault ✓");
    return;
  }
}

// Interactive Preview Click: Toggle Tasks & Copy Code Blocks
function handlePreviewClick(e: MouseEvent) {
  const target = e.target as HTMLElement;

  // 1. Copy code block button
  const copyBtn = target.classList.contains("btn-code-copy")
    ? target
    : (target.closest(".btn-code-copy") as HTMLElement | null);
  if (copyBtn) {
    const code = copyBtn.getAttribute("data-code");
    if (code) {
      navigator.clipboard.writeText(decodeURIComponent(code));
      const labelSpan = copyBtn.querySelector(".btn-copy-label") || copyBtn;
      const originalText = labelSpan.textContent || "Copy";
      labelSpan.textContent = "Copied! ✓";
      copyBtn.style.color = "var(--emerald-bright)";
      setTimeout(() => {
        labelSpan.textContent = originalText;
        copyBtn.style.color = "";
      }, 1800);
      uiStore.showToast("Code block copied to clipboard ✓");
    }
    return;
  }

  // 2. Interactive task checkbox click
  if (target.classList.contains("task-checkbox") && notesStore.selectedNote) {
    const input = target as HTMLInputElement;
    const taskIdx = parseInt(input.getAttribute("data-task-index") || "-1", 10);
    if (taskIdx >= 0) {
      const updatedBody = toggleTaskInMarkdown(notesStore.selectedNote.body, taskIdx, input.checked);
      notesStore.updateNote(notesStore.selectedNote.id, { body: updatedBody });
      uiStore.showToast(`Task ${input.checked ? "checked" : "unchecked"} ✓`);
    }
  }
}

// Quick Export Handlers
function copyMarkdown() {
  if (!notesStore.selectedNote) return;
  navigator.clipboard.writeText(notesStore.selectedNote.body);
  uiStore.showToast("Markdown copied to clipboard ✓");
}

function copyHtml() {
  if (!notesStore.selectedNote) return;
  const rendered = renderMarkdown(notesStore.selectedNote.body);
  navigator.clipboard.writeText(rendered);
  uiStore.showToast("Formatted HTML copied to clipboard ✓");
}

function downloadMarkdown() {
  if (!notesStore.selectedNote) return;
  const title = notesStore.selectedNote.title || "untitled";
  const slug = title.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const blob = new Blob([notesStore.selectedNote.body], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.md`;
  a.click();
  URL.revokeObjectURL(url);
  uiStore.showToast(`Downloaded ${slug}.md ✓`);
}

// Note Management Actions
function handleCreateNewNote() {
  notesStore
    .addNote({
      title: "Untitled Document",
      body: "# Untitled Document\n\nBegin drafting sovereign strategy, architecture, or notes...",
      tags: ["draft"],
      kind: "idea",
      status: "ideation",
    })
    .then((created: any) => {
      uiStore.showToast("Created new document ✓");
      if (created?.id) notesStore.selectNote(created.id);
    });
}

function handleDuplicateCurrentNote() {
  if (!notesStore.selectedNote) return;
  notesStore.duplicateNote(notesStore.selectedNote.id);
  uiStore.showToast("Document duplicated ✓");
}

function handleDeleteCurrentNote() {
  if (!notesStore.selectedNote) return;
  if (confirm(`Are you sure you want to delete "${notesStore.selectedNote.title}"?`)) {
    notesStore.deleteNote(notesStore.selectedNote.id);
    uiStore.showToast("Document deleted ✓");
  }
}

// Sovereign Templates
const SOVEREIGN_TEMPLATES = [
  {
    id: "rfc",
    title: "Architecture RFC & Data Flow",
    icon: "🏗️",
    desc: "System context, invariants, proposed interfaces, and trade-off matrix.",
    body: `# [RFC] System Architecture & Sovereign Data Flow

**Author:** Sovereign Architect
**Status:** In Progress
**Target Date:** 2026-Q4

## 1. Executive Summary
Brief high-level context of what problem this architecture solves and why current approaches are insufficient.

## 2. Invariants & Guarantees
- [x] Zero cloud telemetry or external network leaks
- [x] 100% offline-first local persistence (IndexedDB + RAM cache)
- [ ] Sub-10ms query latency for 10,000+ notes

## 3. Proposed Architecture
\`\`\`typescript
interface SovereignNode {
  id: string;
  fingerprint: string;
  vaultStatus: "sealed" | "unlocked";
}
\`\`\`

> [!NOTE]
> All encryption keys are derived via PBKDF2 with 100,000 iterations in WebAssembly/WebCrypto.

## 4. Trade-offs & Alternatives Considered
| Approach | Latency | Security | Complexity |
| :--- | :--- | :--- | :--- |
| **Local SQLite** | Medium | High | High |
| **IndexedDB v2** | Low | High | Optimal |
| **Cloud Sync** | High | Low | High |

## 5. Action Plan & Milestones
- [ ] Implement chunked blob serializer
- [ ] Add cryptographic integrity hashes per node
- [ ] Verify cross-platform keybind triggers
`,
  },
  {
    id: "security",
    title: "Security & Zero-Telemetry Audit",
    icon: "🛡️",
    desc: "Cryptographic invariants, threat vectors, and verification checklist.",
    body: `# 🛡️ Sovereign Security & Zero-Telemetry Audit

**Node Fingerprint:** 0x7F-SOVEREIGN-LOCAL
**Auditor:** Council of Sovereign Cryptographers
**Audit Scope:** In-Memory Storage, Hardware Fingerprinting, Event Dispatch

## 1. Cryptographic Invariants
- AES-256-GCM authenticated encryption for all vault payloads
- Zero external analytics, tracking pixels, or phone-home pings
- Hardware-derived SHA-256 node license verification

> [!WARNING]
> Ensure all clipboard paste operations strip potential tracking parameters (utm_*, ref, gclid).

## 2. Threat Modeling & Attack Surfaces
| Threat Vector | Mitigation Strategy | Status |
| :--- | :--- | :--- |
| **RAM Scraping** | Zeroize key variables on vault lock | Verified ✓ |
| **XSS Injection** | Strict HTML entity escaping in markdown renderer | Verified ✓ |
| **Keylogging Overlap** | Normalized modifier verification engine | Verified ✓ |

## 3. Verification Checklist
- [x] WebCrypto subtle API native execution verified
- [x] IndexedDB media blobs stored with isolated keys
- [ ] Automated stress-test for 100MB payload encryption
`,
  },
  {
    id: "milestone",
    title: "Product Release Milestone",
    icon: "🚀",
    desc: "Objectives, key deliverables, and production readiness checklist.",
    body: `# 🚀 Release Milestone: Sovereign Studio v2.5

**Milestone Code:** PROJECT_WOLF_NEXUS
**Target Deployment:** Immediate Sovereign Build

## 1. Objectives & Deliverables
This release delivers full user keyboard customization and a god-tier deep-work Markdown Studio.

> [!TIP]
> Use \`Ctrl/Cmd+2\` to jump straight to Studio from anywhere in the application.

## 2. Key Deliverables
- [x] Universal customizable keyboard shortcuts in Settings
- [x] Interactive keybind recorder with conflict detection
- [x] Studio Document Navigator with real-time search & filter
- [x] Full Markdown formatting toolbar (H1-H3, Bold, Italic, Tables, Checklists)
- [x] Live Cognitive Telemetry (words, characters, read/speak time)

## 3. Release Checklist
- [ ] Run full Vitest regression suite
- [ ] Verify cross-browser layout & contrast ratios
- [ ] Create sovereign git commit snapshot
`,
  },
  {
    id: "ai_prompt",
    title: "AI Prompt & Guardrails Spec",
    icon: "🧠",
    desc: "System prompt framing, negative constraints, and few-shot evaluation cases.",
    body: `# 🧠 AI System Prompt & Cognitive Reasoning Spec

**Model Target:** Gemini 2.5 Flash / Claude 3.7 Sonnet
**Context Budget:** 128k Tokens
**Domain:** Autonomous Sovereign Pair Programming

## 1. System Prompt Definition
\`\`\`text
You are an elite sovereign systems engineer. You write uncompromising, resilient, offline-first code.
Every feature you touch must be visually stunning, tactile, accessible, and fast.
\`\`\`

## 2. Guardrails & Negative Constraints
> [!IMPORTANT]
> Never introduce cloud telemetry dependencies. Never store unencrypted secrets in plain localStorage.

## 3. Few-Shot Evaluation Cases
- **Case 1: Keybind Collision** -> Agent alerts user with visual warning badge.
- **Case 2: Large Document Rendering** -> Virtualized / debounced live preview pipeline.
`,
  },
  {
    id: "strategy",
    title: "Strategy & Decision Post-Mortem",
    icon: "📋",
    desc: "Historical motivation, options evaluated, and consensus summary.",
    body: `# 📋 Strategy & Technical Decision Post-Mortem

**Date:** 2026-09-28
**Participants:** Ava Vance, Kaelen Frost, Dr. Aris Thorne, Renata Cruz

## 1. Context & Motivation
Why did we overhaul the Studio tab and introduce customizable shortcuts?
- Users needed an integrated writing workspace that didn't force them back to the Timeline feed to switch notes.
- Power users require personalized keybindings that respect their muscle memory.

## 2. Decisions Reached
1. **Separation of Concerns:** \`useShortcutsStore\` manages keybinding registry and conflicts; \`SettingsView.vue\` provides interactive recording; \`App.vue\` dispatches.
2. **Studio Self-Sufficiency:** Studio now features an embedded Document Navigator, template generator, and full formatting ribbon.

> [!NOTE]
> All document mutations continue to persist directly to sovereign IndexedDB and local storage.
`,
  },
];

function applyTemplate(tmpl: (typeof SOVEREIGN_TEMPLATES)[0]) {
  showTemplateMenu.value = false;
  notesStore
    .addNote({
      title: tmpl.title,
      body: tmpl.body,
      tags: ["template", tmpl.id],
      kind: "milestone",
      status: "in_progress",
    })
    .then((created: any) => {
      uiStore.showToast(`Applied "${tmpl.title}" template ✓`);
      if (created?.id) notesStore.selectNote(created.id);
    });
}
</script>

<template>
  <div class="studio-view-layout">
    <!-- Left Collapsible Document Navigator -->
    <aside v-if="showSidebar" class="studio-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title-row">
          <span class="studio-icon">📝</span>
          <h2 class="sidebar-title">Documents</h2>
        </div>
        <div class="sidebar-actions-row">
          <button type="button" class="btn-new-doc" title="New Document" @click="handleCreateNewNote">
            + New Doc
          </button>

          <!-- Template Dropdown Trigger -->
          <div class="template-dropdown-wrapper">
            <button
              type="button"
              class="btn-template-trigger"
              title="Apply Sovereign Template"
              @click="showTemplateMenu = !showTemplateMenu"
            >
              📑 Templates ▾
            </button>

            <!-- Click Outside Backdrop -->
            <div
              v-if="showTemplateMenu"
              class="dropdown-backdrop"
              @click="showTemplateMenu = false"
            ></div>

            <!-- Dropdown Menu -->
            <div v-if="showTemplateMenu" class="template-menu-popup">
              <div class="menu-header">SOVEREIGN TEMPLATES</div>
              <div
                v-for="tmpl in SOVEREIGN_TEMPLATES"
                :key="tmpl.id"
                class="template-menu-item"
                @click="applyTemplate(tmpl)"
              >
                <span class="tmpl-icon">{{ tmpl.icon }}</span>
                <div class="tmpl-info">
                  <span class="tmpl-title">{{ tmpl.title }}</span>
                  <span class="tmpl-desc">{{ tmpl.desc }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="sidebar-search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="sidebarSearch"
            type="text"
            class="sidebar-search-input"
            placeholder="Filter docs..."
          />
          <button v-if="sidebarSearch" type="button" class="btn-clear-search" @click="sidebarSearch = ''">✕</button>
        </div>

        <!-- Filter Pills -->
        <div class="sidebar-filter-pills">
          <button
            type="button"
            class="filter-pill"
            :class="{ active: sidebarFilter === 'all' }"
            @click="sidebarFilter = 'all'"
          >
            All
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: sidebarFilter === 'milestone' }"
            @click="sidebarFilter = 'milestone'"
          >
            Milestones
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: sidebarFilter === 'in_progress' }"
            @click="sidebarFilter = 'in_progress'"
          >
            Active
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: sidebarFilter === 'live' }"
            @click="sidebarFilter = 'live'"
          >
            Live
          </button>
        </div>
      </div>

      <!-- Notes List -->
      <div class="sidebar-notes-list">
        <div
          v-for="n in studioNotes"
          :key="n.id"
          class="doc-list-item"
          :class="{ active: notesStore.selectedNote?.id === n.id }"
          @click="notesStore.selectNote(n.id)"
        >
          <div class="doc-item-top">
            <span class="doc-title">{{ n.title || "Untitled Document" }}</span>
            <span class="doc-status-badge" :class="n.status">{{ n.status || 'idea' }}</span>
          </div>
          <p class="doc-preview">{{ (n.body || '').replace(/^[#\s\-*`>]+/gm, '').substring(0, 65) }}...</p>
          <div class="doc-meta-row">
            <span class="doc-word-count">{{ (n.body || '').split(/\s+/).filter(Boolean).length }}w</span>
            <div class="doc-tags">
              <span v-for="t in (n.tags || []).slice(0, 2)" :key="t" class="mini-tag">#{{ t }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Studio Workspace Area -->
    <main class="studio-main-workspace">
      <!-- Top Control Bar -->
      <div class="studio-topbar">
        <div class="topbar-left">
          <!-- Toggle Sidebar Button -->
          <button
            type="button"
            class="btn-toggle-sidebar"
            :title="`Toggle Document Navigator (${shortcutsStore.formatShortcut('toggle_studio_sidebar')})`"
            @click="showSidebar = !showSidebar"
          >
            <span v-if="showSidebar">◀ Hide Sidebar</span>
            <span v-else>▶ Show Sidebar</span>
          </button>

          <!-- Note Title Input (if note selected) -->
          <input
            v-if="notesStore.selectedNote"
            :value="notesStore.selectedNote.title"
            type="text"
            class="studio-title-input"
            placeholder="Document Title..."
            @input="handleTitleInput"
          />
        </div>

        <div v-if="notesStore.selectedNote" class="topbar-right">
          <!-- Status Dropdown -->
          <select
            :value="notesStore.selectedNote.status || 'ideation'"
            class="status-select-box"
            @change="handleStatusChange"
          >
            <option value="ideation">Ideation</option>
            <option value="research">Research</option>
            <option value="design">Design</option>
            <option value="in_progress">In Progress</option>
            <option value="live">Live / Shipped</option>
          </select>

          <!-- View Mode Switcher -->
          <div class="view-mode-group">
            <button
              type="button"
              class="btn-mode"
              :class="{ active: viewMode === 'split' }"
              title="Split View (Editor + Live Preview)"
              @click="viewMode = 'split'"
            >
              ◫ Split
            </button>
            <button
              type="button"
              class="btn-mode"
              :class="{ active: viewMode === 'editor' }"
              title="Editor Only"
              @click="viewMode = 'editor'"
            >
              ✎ Write
            </button>
            <button
              type="button"
              class="btn-mode"
              :class="{ active: viewMode === 'preview' }"
              title="Preview Only"
              @click="viewMode = 'preview'"
            >
              👁 Read
            </button>
          </div>

          <!-- Quick Action Buttons -->
          <div class="action-btn-group">
            <button type="button" class="btn-action-icon" title="Copy Markdown" @click="copyMarkdown">
              📋 MD
            </button>
            <button type="button" class="btn-action-icon" title="Copy HTML" @click="copyHtml">
              📄 HTML
            </button>
            <button type="button" class="btn-action-icon" title="Download .md file" @click="downloadMarkdown">
              ⬇️ Export
            </button>
            <button type="button" class="btn-action-icon" title="Duplicate Document" @click="handleDuplicateCurrentNote">
              ⧉ Copy
            </button>
            <button type="button" class="btn-action-icon delete" title="Delete Document" @click="handleDeleteCurrentNote">
              🗑️
            </button>
            <button
              type="button"
              class="btn-focus-trigger"
              :title="`Zen Fullscreen Focus Mode (${shortcutsStore.formatShortcut('focus_mode')})`"
              @click="uiStore.showFocusEditor = true"
            >
              ⤢ Focus
            </button>
          </div>
        </div>
      </div>

      <!-- Tag Management Strip (if note selected) -->
      <div v-if="notesStore.selectedNote" class="studio-tags-strip">
        <span class="tags-label">TAGS:</span>
        <div class="tag-chips-wrap">
          <span
            v-for="tag in notesStore.selectedNote.tags"
            :key="tag"
            class="studio-tag-chip"
          >
            #{{ tag }}
            <button type="button" class="btn-remove-tag" @click="removeTag(tag)">✕</button>
          </span>

          <!-- Add Tag Input / Button -->
          <div v-if="isAddingTag" class="new-tag-input-wrap">
            <input
              v-model="newTagInput"
              type="text"
              class="new-tag-input"
              placeholder="tag name..."
              autofocus
              @keydown.enter="addTag"
              @keydown.esc="isAddingTag = false"
              @blur="addTag"
            />
          </div>
          <button v-else type="button" class="btn-add-tag-pill" @click="isAddingTag = true">
            + Tag
          </button>
        </div>
      </div>

      <!-- Markdown Formatting Ribbon Toolbar (shown in split & editor modes) -->
      <div v-if="notesStore.selectedNote && viewMode !== 'preview'" class="markdown-toolbar">
        <div class="toolbar-group">
          <button type="button" class="btn-tool" title="Heading 1" @click="insertLinePrefix('# ')">H1</button>
          <button type="button" class="btn-tool" title="Heading 2" @click="insertLinePrefix('## ')">H2</button>
          <button type="button" class="btn-tool" title="Heading 3" @click="insertLinePrefix('### ')">H3</button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-group">
          <button type="button" class="btn-tool" title="Bold (**text**)" @click="insertFormatting('**', '**', 'bold text')">
            <strong>B</strong>
          </button>
          <button type="button" class="btn-tool" title="Italic (*text*)" @click="insertFormatting('*', '*', 'italic text')">
            <em>I</em>
          </button>
          <button type="button" class="btn-tool" title="Strikethrough (~~text~~)" @click="insertFormatting('~~', '~~', 'strikethrough')">
            <del>S</del>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-group">
          <button type="button" class="btn-tool" title="Bullet List (- item)" @click="insertLinePrefix('- ')">• List</button>
          <button type="button" class="btn-tool" title="Numbered List (1. item)" @click="insertLinePrefix('1. ')">1. List</button>
          <button type="button" class="btn-tool" title="Interactive Task List (- [ ] task)" @click="insertLinePrefix('- [ ] ')">☑ Task</button>
          <button type="button" class="btn-tool" title="Blockquote (> quote)" @click="insertLinePrefix('> ')">❝ Quote</button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-group">
          <button type="button" class="btn-tool" title="Inline Code (`code`)" @click="insertFormatting('`', '`', 'code')">`Code`</button>
          <button type="button" class="btn-tool" title="Code Block (```lang)" @click="insertFormatting('```typescript\n', '\n```', '// code here')">{ } Block</button>
          <button type="button" class="btn-tool" title="Insert 3-Column Table" @click="insertTable">⊞ Table</button>
          <button type="button" class="btn-tool" title="Insert Hyperlink" @click="insertLinkPrompt">🔗 Link</button>
          <button type="button" class="btn-tool" title="Insert Image" @click="insertImagePrompt">🖼️ Image</button>
          <button type="button" class="btn-tool" title="Insert Timestamp" @click="insertTimestamp">⏱️ Time</button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Callout Alert Inserts -->
        <div class="toolbar-group">
          <button type="button" class="btn-tool-callout note" title="Note Alert" @click="insertCallout('NOTE')">ℹ️ Note</button>
          <button type="button" class="btn-tool-callout tip" title="Tip Alert" @click="insertCallout('TIP')">💡 Tip</button>
          <button type="button" class="btn-tool-callout warn" title="Warning Alert" @click="insertCallout('WARNING')">⚠️ Warn</button>
        </div>
      </div>

      <!-- Editor & Live Preview Panes (if note selected) -->
      <div v-if="notesStore.selectedNote" class="studio-panes" :class="viewMode">
        <!-- Left Editor Pane -->
        <div
          v-show="viewMode !== 'preview'"
          class="studio-editor-pane"
          @mouseenter="activeHoverPane = 'editor'"
          @mouseleave="activeHoverPane = null"
        >
          <div class="pane-meta-strip">
            <span class="pane-label">MARKDOWN SOURCE</span>
            <span class="pane-hint">Tab = 2 spaces • ⌘B / ⌘I / ⌘S enabled</span>
          </div>
          <textarea
            ref="editorTextarea"
            :value="notesStore.selectedNote.body"
            class="studio-textarea"
            placeholder="Start drafting architecture, strategic roadmap milestones, or technical specs..."
            spellcheck="false"
            @input="handleBodyInput"
            @keydown="handleTextareaKeyDown"
            @scroll="onEditorScroll"
          ></textarea>
        </div>

        <!-- Right Live Preview Pane -->
        <div
          v-show="viewMode !== 'editor'"
          class="studio-preview-pane"
          @mouseenter="activeHoverPane = 'preview'"
          @mouseleave="activeHoverPane = null"
        >
          <div class="pane-meta-strip">
            <span class="pane-label">SOVEREIGN LIVE PREVIEW</span>
            <div class="preview-meta-actions">
              <button
                type="button"
                class="btn-sync-toggle"
                :class="{ active: isSyncScrollEnabled }"
                :title="isSyncScrollEnabled ? 'Synchronized scrolling active (click to decouple)' : 'Independent scrolling active (click to sync)'"
                @click="isSyncScrollEnabled = !isSyncScrollEnabled"
              >
                <span>{{ isSyncScrollEnabled ? '🔗 Sync Scroll On' : '🔓 Independent' }}</span>
              </button>
              <span class="pane-sync">Interactive Checklists Enabled ✓</span>
            </div>
          </div>
          <div
            ref="previewContentRef"
            class="markdown-rendered preview-content cyber-scrollbar"
            @click="handlePreviewClick"
            @scroll="onPreviewScroll"
            v-html="renderMarkdown(notesStore.selectedNote.body)"
          ></div>
        </div>
      </div>

      <!-- Empty State / Welcome Screen when no note selected -->
      <div v-else class="studio-welcome-screen">
        <div class="welcome-box">
          <div class="welcome-icon">🐺</div>
          <h2 class="welcome-title">Sovereign Markdown Studio</h2>
          <p class="welcome-sub">
            Ultra-fast, distraction-free technical writing suite with zero telemetry, local RAM encryption, and interactive previews.
          </p>

          <div class="welcome-actions">
            <button type="button" class="btn-welcome-primary" @click="handleCreateNewNote">
              ✨ Create Blank Document
            </button>
          </div>

          <div class="template-cards-grid">
            <div
              v-for="tmpl in SOVEREIGN_TEMPLATES.slice(0, 4)"
              :key="tmpl.id"
              class="tmpl-card"
              @click="applyTemplate(tmpl)"
            >
              <span class="card-icon">{{ tmpl.icon }}</span>
              <h3 class="card-title">{{ tmpl.title }}</h3>
              <p class="card-desc">{{ tmpl.desc }}</p>
              <span class="card-action">Use Template →</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Studio Footer: Writing Intelligence & Sovereign Security Bar -->
      <footer v-if="notesStore.selectedNote" class="studio-footer">
        <div class="footer-metrics">
          <span class="metric-item"><strong>{{ wordCount }}</strong> words</span>
          <span class="metric-item"><strong>{{ charCount }}</strong> characters</span>
          <span class="metric-item"><strong>{{ lineCount }}</strong> lines</span>
          <span class="metric-item">⏱ <strong>{{ readTime }}</strong> min read</span>
          <span class="metric-item">🗣 <strong>{{ speakTime }}</strong> min speak</span>
          <span class="metric-item complexity">📊 {{ readabilityScore }}</span>
        </div>

        <div class="footer-security">
          <span class="security-dot"></span>
          <span class="security-text">🔒 AES-256 In-Memory RAM Buffer • Zero-Telemetry Guaranteed</span>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.studio-view-layout {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  background: var(--bg-body, #040c08);
  overflow: hidden;
}

/* ========================================================
   STUDIO DOCUMENT NAVIGATOR (SIDEBAR)
   ======================================================== */
.studio-sidebar {
  width: 290px;
  min-width: 290px;
  background: var(--bg-card, #060e0a);
  border-right: 1px solid var(--border-card, #14281f);
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  position: relative;
  z-index: 50;
  overflow: visible;
}

.sidebar-header {
  padding: 16px 18px 12px 18px;
  border-bottom: 1px solid var(--border-subtle, #12241b);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 60;
  overflow: visible;
}

.sidebar-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.studio-icon {
  font-size: 16px;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-white, #fff);
  margin: 0;
  letter-spacing: -0.02em;
}

.sidebar-actions-row {
  display: flex;
  gap: 8px;
}

.btn-new-doc {
  flex: 1;
  background: var(--emerald-main, #10b981);
  border: 1px solid var(--emerald-bright, #34d399);
  border-radius: 6px;
  color: var(--bg-canvas, #040c08);
  font-size: 12px;
  font-weight: 800;
  padding: 7px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-new-doc:hover {
  background: var(--emerald-bright, #34d399);
  box-shadow: 0 0 12px var(--border-glow, rgba(52, 211, 153, 0.35));
}

.template-dropdown-wrapper {
  position: relative;
  z-index: 70;
}

.btn-template-trigger {
  background: var(--emerald-pill-bg, #0e2017);
  border: 1px solid var(--emerald-pill-border, #1f4231);
  border-radius: 6px;
  color: var(--emerald-bright, #34d399);
  font-size: 12px;
  font-weight: 700;
  padding: 7px 10px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-template-trigger:hover {
  background: var(--bg-card-hover, #153225);
}

.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9990;
  background: transparent;
}

.template-menu-popup {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 305px;
  background: var(--bg-drawer, #07120d);
  border: 1px solid var(--emerald-main, #10b981);
  border-radius: 8px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.95), 0 0 22px var(--border-glow, rgba(16, 185, 129, 0.3));
  z-index: 9999;
  padding: 8px 0;
}

.menu-header {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-dim, #4b6357);
  padding: 6px 14px 4px 14px;
}

.template-menu-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.template-menu-item:hover {
  background: var(--bg-card-hover, #0f241a);
}

.tmpl-icon {
  font-size: 16px;
}

.tmpl-info {
  display: flex;
  flex-direction: column;
}

.tmpl-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary, #f3f4f6);
}

.tmpl-desc {
  font-size: 10.5px;
  color: var(--text-secondary, #6b7280);
  line-height: 1.3;
}

.sidebar-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.sidebar-search-input {
  width: 100%;
  background: var(--bg-inner, #040907);
  border: 1px solid var(--border-subtle, #12241b);
  border-radius: 6px;
  padding: 6px 28px 6px 28px;
  color: var(--text-primary, #e5e7eb);
  font-size: 12px;
  outline: none;
}

.sidebar-search-input:focus {
  border-color: var(--emerald-main, #10b981);
}

.search-icon {
  position: absolute;
  left: 8px;
  font-size: 11px;
  color: var(--text-dim, #4b6357);
  pointer-events: none;
}

.btn-clear-search {
  position: absolute;
  right: 6px;
  background: transparent;
  border: none;
  color: var(--text-muted, #6b7280);
  font-size: 12px;
  cursor: pointer;
}

.sidebar-filter-pills {
  display: flex;
  gap: 4px;
}

.filter-pill {
  flex: 1;
  background: var(--bg-surface, #050b08);
  border: 1px solid var(--border-subtle, #102117);
  border-radius: 4px;
  color: var(--text-muted, #6b7280);
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 0;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill.active {
  background: var(--emerald-pill-bg, #0f241a);
  border-color: var(--emerald-main, #10b981);
  color: var(--emerald-bright, #34d399);
}

.sidebar-notes-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.doc-list-item {
  background: var(--bg-surface, #050b08);
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.doc-list-item:hover {
  background: var(--bg-card-hover, #091610);
  border-color: var(--border-subtle, #142f22);
}

.doc-list-item.active {
  background: var(--bg-card-selected, #0d2017);
  border-color: var(--emerald-main, #10b981);
  box-shadow: inset 3px 0 0 var(--emerald-main, #10b981);
}

.doc-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.doc-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary, #f3f4f6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.doc-status-badge {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--emerald-pill-bg, #11281e);
  color: var(--emerald-bright, #34d399);
}

.doc-status-badge.live {
  background: var(--emerald-pill-bg, #064e3b);
  color: var(--emerald-bright, #6ee7b7);
}

.doc-status-badge.in_progress {
  background: var(--bg-card-hover, #1e3a8a);
  color: var(--emerald-bright, #93c5fd);
}

.doc-preview {
  font-size: 11px;
  color: var(--text-muted, #6b7280);
  margin: 0 0 6px 0;
  line-height: 1.3;
}

.doc-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.doc-word-count {
  font-size: 10px;
  color: var(--text-dim, #4b6357);
  font-weight: 600;
}

.doc-tags {
  display: flex;
  gap: 4px;
}

.mini-tag {
  font-size: 9px;
  color: var(--emerald-bright, #34d399);
  background: var(--emerald-pill-bg, #06150e);
  padding: 1px 4px;
  border-radius: 3px;
}

/* ========================================================
   MAIN STUDIO WORKSPACE
   ======================================================== */
.studio-main-workspace {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-body, #040c08);
}

/* Top Control Bar */
.studio-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-subtle, #11221a);
  background: var(--bg-inner, #07100c);
  gap: 16px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.btn-toggle-sidebar {
  background: var(--bg-card, #0d1e16);
  border: 1px solid var(--border-card, #1a3c2d);
  color: var(--text-secondary, #9ca3af);
  font-size: 11px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-toggle-sidebar:hover {
  background: var(--bg-card-hover, #132d21);
  color: var(--text-white, #fff);
}

.studio-title-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 18px;
  font-weight: 800;
  color: var(--text-white, #fff);
  outline: none;
}

.studio-title-input:focus {
  border-bottom: 1px solid var(--emerald-main, #10b981);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-select-box {
  background: var(--bg-card, #0a1711);
  border: 1px solid var(--border-card, #1b3829);
  border-radius: 6px;
  color: var(--emerald-bright, #34d399);
  font-size: 11.5px;
  font-weight: 700;
  padding: 6px 10px;
  outline: none;
  cursor: pointer;
  font-family: inherit;
}
.status-select-box option {
  background-color: var(--bg-card, #0b1410);
  color: var(--text-primary, #f0fdf4);
}
.status-select-box option:checked {
  background-color: var(--bg-card-selected, #0e1c15);
  color: var(--emerald-bright, #34d399);
}

.view-mode-group {
  display: flex;
  background: var(--bg-inner, #040906);
  border: 1px solid var(--border-subtle, #14281f);
  border-radius: 6px;
  padding: 2px;
}

.btn-mode {
  background: transparent;
  border: none;
  color: var(--text-muted, #6b7280);
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-mode.active {
  background: var(--emerald-pill-bg, #11281e);
  color: var(--emerald-bright, #34d399);
}

.action-btn-group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-action-icon {
  background: var(--bg-card, #0a1610);
  border: 1px solid var(--border-card, #173223);
  color: var(--text-secondary, #9ca3af);
  font-size: 11.5px;
  font-weight: 700;
  padding: 6px 9px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action-icon:hover {
  background: var(--bg-card-hover, #11281e);
  color: var(--text-white, #fff);
}

.btn-action-icon.delete:hover {
  background: #450a0a;
  border-color: #ef4444;
  color: #fca5a5;
}

.btn-focus-trigger {
  background: var(--emerald-pill-bg, #10241b);
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.4));
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--emerald-bright, #34d399);
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.btn-focus-trigger:hover {
  background: var(--bg-card-hover, #173829);
}

/* Tag Management Strip */
.studio-tags-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 20px;
  background: var(--bg-surface, #050b08);
  border-bottom: 1px solid var(--border-subtle, #0f1d16);
}

.tags-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-dim, #4b6357);
}

.tag-chips-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.studio-tag-chip {
  background: var(--emerald-pill-bg, #091711);
  border: 1px solid var(--emerald-pill-border, #143526);
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 11px;
  color: var(--emerald-bright, #34d399);
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-remove-tag {
  background: transparent;
  border: none;
  color: var(--text-muted, #6b7280);
  font-size: 10px;
  cursor: pointer;
  padding: 0;
}

.btn-remove-tag:hover {
  color: #ef4444;
}

.new-tag-input {
  background: var(--bg-inner, #030805);
  border: 1px solid var(--emerald-main, #10b981);
  border-radius: 4px;
  color: var(--text-white, #fff);
  font-size: 11px;
  padding: 2px 6px;
  width: 90px;
  outline: none;
}

.btn-add-tag-pill {
  background: transparent;
  border: 1px dashed var(--border-card, #1f4231);
  color: var(--text-muted, #6b7280);
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add-tag-pill:hover {
  color: var(--text-white, #fff);
  border-color: var(--emerald-main, #10b981);
}

/* ========================================================
   MARKDOWN FORMATTING TOOLBAR
   ======================================================== */
.markdown-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 20px;
  background: var(--bg-card, #060e0a);
  border-bottom: 1px solid var(--border-subtle, #11221a);
  overflow-x: auto;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 3px;
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  background: var(--border-card, #14281f);
  margin: 0 4px;
}

.btn-tool {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text-secondary, #9ca3af);
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-tool:hover {
  background: var(--bg-card-hover, #0f241a);
  border-color: var(--border-card, #1b442f);
  color: var(--text-white, #fff);
}

.btn-tool-callout {
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 7px;
  cursor: pointer;
}

.btn-tool-callout.note {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #93c5fd;
}

.btn-tool-callout.tip {
  background: var(--border-glow, rgba(16, 185, 129, 0.15));
  border: 1px solid var(--emerald-main, #10b981);
  color: var(--emerald-bright, #6ee7b7);
}

.btn-tool-callout.warn {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fcd34d;
}

/* ========================================================
   DUAL PANES: EDITOR & LIVE PREVIEW
   ======================================================== */
.studio-panes {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  overflow: hidden;
}

.studio-panes.split {
  grid-template-columns: 1fr 1fr;
}

.studio-panes.editor {
  grid-template-columns: 1fr;
}

.studio-panes.preview {
  grid-template-columns: 1fr;
}

.pane-meta-strip {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  border-bottom: 1px solid var(--border-subtle, #102117);
  background: var(--bg-surface, #050b08);
}

.preview-meta-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-sync-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-inner, #08160f);
  border: 1px solid var(--border-card, #153825);
  color: var(--text-secondary, #9ca3af);
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-sync-toggle:hover {
  border-color: var(--emerald-main, #10b981);
  color: var(--text-white, #fff);
}

.btn-sync-toggle.active {
  background: var(--emerald-pill-bg, #0d2619);
  border-color: var(--emerald-bright, #34d399);
  color: var(--emerald-bright, #34d399);
}

.pane-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-dim, #4b6357);
}

.pane-hint,
.pane-sync {
  font-size: 10px;
  color: var(--emerald-bright, #34d399);
}

.studio-editor-pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle, #11221a);
  background: var(--bg-canvas, #040906);
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.studio-preview-pane {
  display: flex;
  flex-direction: column;
  background: var(--bg-body, #050c08);
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.studio-textarea {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  background: transparent;
  border: none;
  padding: 24px 24px 72px 24px;
  color: var(--text-primary, #e5e7eb);
  font-family: var(--font-mono, "JetBrains Mono", monospace);
  font-size: 13.5px;
  line-height: 1.7;
  resize: none;
  outline: none;
  tab-size: 2;
  box-sizing: border-box;
}

/* ========================================================
   RICH PREVIEW CONTENT STYLING
   ======================================================== */
.preview-content {
  flex: 1;
  min-height: 0;
  height: 100%;
  padding: 24px 32px 80px 32px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  color: var(--text-gray, #e5e7eb);
  line-height: 1.7;
  font-size: 14px;
  box-sizing: border-box;
}

/* Sleek Scrollbars for Studio */
.studio-textarea::-webkit-scrollbar,
.preview-content::-webkit-scrollbar,
.sidebar-notes-list::-webkit-scrollbar,
.markdown-toolbar::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.studio-textarea::-webkit-scrollbar-track,
.preview-content::-webkit-scrollbar-track,
.sidebar-notes-list::-webkit-scrollbar-track,
.markdown-toolbar::-webkit-scrollbar-track {
  background: var(--scrollbar-track, rgba(4, 12, 8, 0.8));
  border-radius: 6px;
}

.studio-textarea::-webkit-scrollbar-thumb,
.preview-content::-webkit-scrollbar-thumb,
.sidebar-notes-list::-webkit-scrollbar-thumb,
.markdown-toolbar::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, rgba(16, 185, 129, 0.45));
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.studio-textarea::-webkit-scrollbar-thumb:hover,
.preview-content::-webkit-scrollbar-thumb:hover,
.sidebar-notes-list::-webkit-scrollbar-thumb:hover,
.markdown-toolbar::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #34d399);
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.4));
}

.studio-textarea,
.preview-content,
.sidebar-notes-list,
.markdown-toolbar {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb, rgba(16, 185, 129, 0.5)) var(--scrollbar-track, rgba(4, 12, 8, 0.8));
}

.preview-content :deep(.md-h1) {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-white, #fff);
  margin: 18px 0 10px 0;
  border-bottom: 1px solid var(--border-card, #14281f);
  padding-bottom: 8px;
}

.preview-content :deep(.md-h2) {
  font-size: 18px;
  font-weight: 700;
  color: var(--emerald-bright, #34d399);
  margin: 18px 0 8px 0;
}

.preview-content :deep(.md-h3) {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #f3f4f6);
  margin: 14px 0 6px 0;
}

.preview-content :deep(.md-h4) {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-secondary, #9ca3af);
  margin: 12px 0 4px 0;
}

.preview-content :deep(.md-code-inline) {
  background: var(--emerald-pill-bg, #0d1e16);
  border: 1px solid var(--emerald-pill-border, #1b3d2c);
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.preview-content :deep(.md-codeblock-wrapper) {
  background: var(--bg-inner, #060d09);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 8px;
  margin: 16px 0;
  overflow: hidden;
}

.preview-content :deep(.codeblock-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card, #091610);
  padding: 6px 14px;
  border-bottom: 1px solid var(--border-subtle, #12241b);
}

.preview-content :deep(.codeblock-lang) {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--emerald-bright, #34d399);
}

.preview-content :deep(.btn-code-copy) {
  background: var(--bg-card-hover, #11281d);
  border: 1px solid var(--border-card, #1d4632);
  color: var(--text-secondary, #9ca3af);
  font-size: 10.5px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.preview-content :deep(.btn-code-copy:hover) {
  background: var(--emerald-pill-bg, #1a3c2c);
  color: var(--text-white, #fff);
}

.preview-content :deep(.md-pre) {
  margin: 0;
  padding: 14px;
  overflow-x: auto;
}

.preview-content :deep(.md-code-multiline) {
  font-family: var(--font-mono, monospace);
  font-size: 12.5px;
  color: var(--text-gray, #a7f3d0);
  line-height: 1.6;
}

/* Callout Alerts */
.preview-content :deep(.md-callout) {
  border-radius: 8px;
  padding: 14px 18px;
  margin: 16px 0;
  border-left: 4px solid;
}

.preview-content :deep(.md-callout-note) {
  background: rgba(59, 130, 246, 0.08);
  border-left-color: #3b82f6;
  border-top: 1px solid rgba(59, 130, 246, 0.2);
  border-right: 1px solid rgba(59, 130, 246, 0.2);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.preview-content :deep(.md-callout-tip) {
  background: var(--border-glow, rgba(16, 185, 129, 0.08));
  border-left-color: var(--emerald-main, #10b981);
  border-top: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.2));
  border-right: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.2));
  border-bottom: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.2));
}

.preview-content :deep(.md-callout-warning) {
  background: rgba(245, 158, 11, 0.08);
  border-left-color: #f59e0b;
  border-top: 1px solid rgba(245, 158, 11, 0.2);
  border-right: 1px solid rgba(245, 158, 11, 0.2);
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
}

.preview-content :deep(.md-callout-important) {
  background: rgba(239, 68, 68, 0.08);
  border-left-color: #ef4444;
  border-top: 1px solid rgba(239, 68, 68, 0.2);
  border-right: 1px solid rgba(239, 68, 68, 0.2);
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
}

.preview-content :deep(.callout-header) {
  font-size: 11.5px;
  font-weight: 800;
  margin-bottom: 4px;
}

.preview-content :deep(.callout-body) {
  font-size: 13px;
  line-height: 1.5;
}

/* Blockquotes */
.preview-content :deep(.md-blockquote) {
  margin: 14px 0;
  padding: 8px 16px;
  border-left: 3px solid var(--emerald-main, #10b981);
  background: var(--bg-card, #081510);
  color: var(--text-secondary, #9ca3af);
  font-style: italic;
  border-radius: 0 6px 6px 0;
}

/* Tables */
.preview-content :deep(.table-responsive) {
  overflow-x: auto;
  margin: 16px 0;
}

.preview-content :deep(.md-table) {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-inner, #07100c);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 6px;
  font-size: 13px;
}

.preview-content :deep(.md-table th) {
  background: var(--bg-card, #0c1c14);
  border-bottom: 1px solid var(--border-card, #183325);
  padding: 10px 14px;
  text-align: left;
  font-weight: 700;
  color: var(--text-white, #fff);
}

.preview-content :deep(.md-table td) {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-subtle, #102117);
  color: var(--text-gray, #d1d5db);
}

.preview-content :deep(.md-table tr:hover td) {
  background: var(--bg-card-hover, #0a1711);
}

/* Task Checklists */
.preview-content :deep(.md-task-item) {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
}

.preview-content :deep(.task-checkbox) {
  width: 16px;
  height: 16px;
  accent-color: var(--emerald-main, #10b981);
  cursor: pointer;
}

.preview-content :deep(.md-task-item.checked .task-label) {
  text-decoration: line-through;
  color: var(--text-muted, #6b7280);
}

/* Links & Media */
.preview-content :deep(.md-link) {
  color: var(--emerald-bright, #34d399);
  text-decoration: none;
  border-bottom: 1px dashed var(--emerald-pill-border, rgba(52, 211, 153, 0.4));
}

.preview-content :deep(.md-link:hover) {
  border-bottom-style: solid;
}

.preview-content :deep(.md-figure) {
  margin: 16px 0;
  text-align: center;
}

.preview-content :deep(.md-img) {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border-card, #14281f);
}

.preview-content :deep(figcaption) {
  font-size: 11px;
  color: var(--text-muted, #6b7280);
  margin-top: 6px;
}

.preview-content :deep(.md-li),
.preview-content :deep(.md-li-numbered) {
  margin-left: 24px;
  margin-bottom: 4px;
}

.preview-content :deep(.md-divider) {
  border: none;
  height: 1px;
  background: var(--border-card, #14281f);
  margin: 24px 0;
}

.preview-content :deep(.md-spacer) {
  height: 14px;
}

/* ========================================================
   EMPTY STATE / WELCOME SCREEN
   ======================================================== */
.studio-welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--bg-canvas, #040906);
}

.welcome-box {
  max-width: 720px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 14px;
}

.welcome-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-white, #fff);
  margin: 0 0 10px 0;
  letter-spacing: -0.02em;
}

.welcome-sub {
  font-size: 14px;
  color: var(--text-secondary, #88929b);
  margin: 0 0 28px 0;
  line-height: 1.6;
  max-width: 580px;
}

.welcome-actions {
  margin-bottom: 36px;
}

.btn-welcome-primary {
  background: var(--emerald-main, #10b981);
  border: 1px solid var(--emerald-bright, #34d399);
  border-radius: 8px;
  color: var(--bg-canvas, #040c08);
  font-size: 14px;
  font-weight: 800;
  padding: 12px 28px;
  cursor: pointer;
  box-shadow: 0 0 20px var(--border-glow, rgba(16, 185, 129, 0.35));
  transition: all 0.15s ease;
}

.btn-welcome-primary:hover {
  background: var(--emerald-bright, #34d399);
  transform: translateY(-2px);
  box-shadow: 0 0 30px var(--border-glow, rgba(52, 211, 153, 0.5));
}

.template-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  text-align: left;
  width: 100%;
}

.tmpl-card {
  background: var(--bg-card, #07120d);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 10px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.tmpl-card:hover {
  background: var(--bg-card-hover, #0b1f14);
  border-color: var(--emerald-main, #10b981);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-white, #fff);
  margin: 0 0 6px 0;
}

.card-desc {
  font-size: 12px;
  color: var(--text-secondary, #88929b);
  margin: 0 0 12px 0;
  line-height: 1.4;
  flex: 1;
}

.card-action {
  font-size: 11px;
  font-weight: 700;
  color: var(--emerald-bright, #34d399);
}

/* ========================================================
   STUDIO FOOTER: COGNITIVE INTELLIGENCE & SECURITY
   ======================================================== */
.studio-footer {
  flex-shrink: 0;
  height: 38px;
  min-height: 38px;
  background: var(--bg-card, #060e0a);
  border-top: 1px solid var(--border-subtle, #11221a);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 11.5px;
  color: var(--text-muted, #6b7280);
}

.footer-metrics {
  display: flex;
  gap: 16px;
  align-items: center;
}

.metric-item strong {
  color: var(--text-primary, #e5e7eb);
}

.metric-item.complexity {
  color: var(--emerald-bright, #34d399);
  background: var(--emerald-pill-bg, #091711);
  border: 1px solid var(--emerald-pill-border, #143526);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 700;
}

.footer-security {
  display: flex;
  align-items: center;
  gap: 8px;
}

.security-dot {
  width: 7px;
  height: 7px;
  background: var(--emerald-bright, #34d399);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--emerald-bright, rgba(52, 211, 153, 0.8));
}

.security-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #88929b);
}
</style>
