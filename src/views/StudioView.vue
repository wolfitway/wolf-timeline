<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useNotesStore } from "@/stores/useNotesStore";
import { useUiStore } from "@/stores/useUiStore";
import { useShortcutsStore } from "@/stores/useShortcutsStore";
import type { Note } from "@/types";

const notesStore = useNotesStore();
const uiStore = useUiStore();
const shortcutsStore = useShortcutsStore();

// Textarea reference for cursor positioning
const editorTextarea = ref<HTMLTextAreaElement | null>(null);

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

// Advanced Markdown Renderer
function renderMarkdown(raw: string): string {
  if (!raw) return "";

  // 1. Sanitize raw HTML tags to prevent XSS while preserving Markdown
  let text = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Restore blockquote indicators for markdown processing
  text = text.replace(/^&gt; ?/gm, "> ");

  // 2. Code blocks (```lang ... ```)
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const cleanLang = lang || "plaintext";
    const encoded = encodeURIComponent(code.trim());
    return `<div class="md-codeblock-wrapper">
      <div class="codeblock-header">
        <span class="codeblock-lang">${cleanLang}</span>
        <button type="button" class="btn-code-copy" data-code="${encoded}">📋 Copy</button>
      </div>
      <pre class="md-pre"><code class="md-code-multiline">${code.trim()}</code></pre>
    </div>`;
  });

  // 3. Callout Alerts (> [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT])
  text = text.replace(
    /^> \[!(NOTE|TIP|WARNING|IMPORTANT)\]\n((?:> .*\n?)+)/gm,
    (_match, type, content) => {
      const cleanContent = content.replace(/^> /gm, "").trim();
      const iconMap: Record<string, string> = {
        NOTE: "ℹ️ NOTE",
        TIP: "💡 TIP",
        WARNING: "⚠️ WARNING",
        IMPORTANT: "🚨 IMPORTANT",
      };
      return `<div class="md-callout md-callout-${type.toLowerCase()}">
        <div class="callout-header">${iconMap[type] || type}</div>
        <div class="callout-body">${cleanContent}</div>
      </div>`;
    }
  );

  // 4. Blockquotes
  text = text.replace(/^> (.*$)/gim, '<blockquote class="md-blockquote">$1</blockquote>');

  // 5. Tables
  text = text.replace(/((?:\|[^\n]+\|\n?)+)/g, (match) => {
    const lines = match.trim().split("\n");
    if (lines.length < 2) return match;

    const parseRow = (line: string, isHeader: boolean) => {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      const tag = isHeader ? "th" : "td";
      return `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;
    };

    // Check if line 1 is separator | :--- | :--- |
    const hasSep = /^\|[\s\-:]+\|\s*$/.test(lines[1]);
    const headerRow = parseRow(lines[0], true);
    const bodyRows = lines
      .slice(hasSep ? 2 : 1)
      .map((l) => parseRow(l, false))
      .join("");

    return `<div class="table-responsive"><table class="md-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table></div>`;
  });

  // 6. Interactive Task Checklist (- [ ] and - [x])
  let taskCounter = 0;
  text = text.replace(/^(\s*)-\s*\[([ xX])\]\s*(.*$)/gm, (_match, _spaces, state, label) => {
    const checked = state.toLowerCase() === "x";
    const idx = taskCounter++;
    return `<div class="md-task-item ${checked ? 'checked' : ''}">
      <input type="checkbox" ${checked ? "checked" : ""} class="task-checkbox" data-task-index="${idx}" />
      <span class="task-label">${label}</span>
    </div>`;
  });

  // 7. Headings
  text = text
    .replace(/^#### (.*$)/gim, '<h4 class="md-h4">$1</h4>')
    .replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // 8. Text Formatting: Bold, Italic, Strikethrough, Inline Code, KBD
  text = text
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/~~(.*?)~~/gim, "<del>$1</del>")
    .replace(/`([^`]+)`/gim, '<code class="md-code-inline">$1</code>');

  // 9. Links & Images
  text = text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<figure class="md-figure"><img src="$2" alt="$1" class="md-img" /><figcaption>$1</figcaption></figure>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1 ↗</a>');

  // 10. Unordered & Ordered Lists
  text = text
    .replace(/^\- (.*$)/gim, '<li class="md-li">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="md-li-numbered">$1</li>');

  // 11. Horizontal Rule
  text = text.replace(/^---$/gm, '<hr class="md-divider" />');

  // 12. Paragraphs & Line Breaks
  text = text.replace(/\n\n+/gim, '<div class="md-spacer"></div>').replace(/\n/gim, "<br/>");

  return text;
}

// Interactive Task Checkbox Toggle in Preview
function handlePreviewClick(e: MouseEvent) {
  const target = e.target as HTMLElement;

  // Copy code block button
  if (target.classList.contains("btn-code-copy") || target.closest(".btn-code-copy")) {
    const btn = target.classList.contains("btn-code-copy") ? target : (target.closest(".btn-code-copy") as HTMLElement);
    const code = btn.getAttribute("data-code");
    if (code) {
      navigator.clipboard.writeText(decodeURIComponent(code));
      uiStore.showToast("Code block copied to clipboard ✓");
    }
    return;
  }

  // Task list checkbox click
  if (target.classList.contains("task-checkbox") && notesStore.selectedNote) {
    const input = target as HTMLInputElement;
    const taskIdx = parseInt(input.getAttribute("data-task-index") || "-1", 10);
    if (taskIdx >= 0) {
      toggleTaskCheckbox(taskIdx, input.checked);
    }
  }
}

function toggleTaskCheckbox(targetIndex: number, newChecked: boolean) {
  if (!notesStore.selectedNote) return;
  const lines = notesStore.selectedNote.body.split("\n");
  let currentCheckboxIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*-\s*\[)([ xX])(\]\s*.*)$/);
    if (match) {
      if (currentCheckboxIndex === targetIndex) {
        lines[i] = `${match[1]}${newChecked ? "x" : " "}${match[3]}`;
        break;
      }
      currentCheckboxIndex++;
    }
  }

  const updatedBody = lines.join("\n");
  notesStore.updateNote(notesStore.selectedNote.id, { body: updatedBody });
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
        <div v-show="viewMode !== 'preview'" class="studio-editor-pane">
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
          ></textarea>
        </div>

        <!-- Right Live Preview Pane -->
        <div v-show="viewMode !== 'editor'" class="studio-preview-pane">
          <div class="pane-meta-strip">
            <span class="pane-label">SOVEREIGN LIVE PREVIEW</span>
            <span class="pane-sync">Interactive Checklists Enabled ✓</span>
          </div>
          <div
            class="preview-content"
            @click="handlePreviewClick"
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
  height: calc(100vh - 60px);
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
  background: #060e0a;
  border-right: 1px solid #14281f;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px 18px 12px 18px;
  border-bottom: 1px solid #12241b;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  color: #fff;
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
  border: 1px solid #34d399;
  border-radius: 6px;
  color: #040c08;
  font-size: 12px;
  font-weight: 800;
  padding: 7px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-new-doc:hover {
  background: #34d399;
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.35);
}

.template-dropdown-wrapper {
  position: relative;
}

.btn-template-trigger {
  background: #0e2017;
  border: 1px solid #1f4231;
  border-radius: 6px;
  color: var(--emerald-bright, #34d399);
  font-size: 12px;
  font-weight: 700;
  padding: 7px 10px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-template-trigger:hover {
  background: #153225;
}

.template-menu-popup {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 6px;
  width: 280px;
  background: #07120d;
  border: 1px solid var(--emerald-main, #10b981);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(16, 185, 129, 0.2);
  z-index: 100;
  padding: 8px 0;
}

.menu-header {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #4b6357;
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
  background: #0f241a;
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
  color: #f3f4f6;
}

.tmpl-desc {
  font-size: 10.5px;
  color: #6b7280;
  line-height: 1.3;
}

.sidebar-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.sidebar-search-input {
  width: 100%;
  background: #040907;
  border: 1px solid #12241b;
  border-radius: 6px;
  padding: 6px 28px 6px 28px;
  color: #e5e7eb;
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
  color: #4b6357;
  pointer-events: none;
}

.btn-clear-search {
  position: absolute;
  right: 6px;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
}

.sidebar-filter-pills {
  display: flex;
  gap: 4px;
}

.filter-pill {
  flex: 1;
  background: #050b08;
  border: 1px solid #102117;
  border-radius: 4px;
  color: #6b7280;
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 0;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill.active {
  background: #0f241a;
  border-color: var(--emerald-main, #10b981);
  color: var(--emerald-bright, #34d399);
}

.sidebar-notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.doc-list-item {
  background: #050b08;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.doc-list-item:hover {
  background: #091610;
  border-color: #142f22;
}

.doc-list-item.active {
  background: #0d2017;
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
  color: #f3f4f6;
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
  background: #11281e;
  color: #34d399;
}

.doc-status-badge.live {
  background: #064e3b;
  color: #6ee7b7;
}

.doc-status-badge.in_progress {
  background: #1e3a8a;
  color: #93c5fd;
}

.doc-preview {
  font-size: 11px;
  color: #6b7280;
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
  color: #4b6357;
  font-weight: 600;
}

.doc-tags {
  display: flex;
  gap: 4px;
}

.mini-tag {
  font-size: 9px;
  color: var(--emerald-bright, #34d399);
  background: #06150e;
  padding: 1px 4px;
  border-radius: 3px;
}

/* ========================================================
   MAIN STUDIO WORKSPACE
   ======================================================== */
.studio-main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #040c08;
}

/* Top Control Bar */
.studio-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #11221a;
  background: #07100c;
  gap: 16px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.btn-toggle-sidebar {
  background: #0d1e16;
  border: 1px solid #1a3c2d;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-toggle-sidebar:hover {
  background: #132d21;
  color: #fff;
}

.studio-title-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
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
  background: #0a1711;
  border: 1px solid #1b3829;
  border-radius: 6px;
  color: var(--emerald-bright, #34d399);
  font-size: 11.5px;
  font-weight: 700;
  padding: 6px 10px;
  outline: none;
  cursor: pointer;
}

.view-mode-group {
  display: flex;
  background: #040906;
  border: 1px solid #14281f;
  border-radius: 6px;
  padding: 2px;
}

.btn-mode {
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-mode.active {
  background: #11281e;
  color: var(--emerald-bright, #34d399);
}

.action-btn-group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-action-icon {
  background: #0a1610;
  border: 1px solid #173223;
  color: #9ca3af;
  font-size: 11.5px;
  font-weight: 700;
  padding: 6px 9px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action-icon:hover {
  background: #11281e;
  color: #fff;
}

.btn-action-icon.delete:hover {
  background: #450a0a;
  border-color: #ef4444;
  color: #fca5a5;
}

.btn-focus-trigger {
  background: #10241b;
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--emerald-bright, #34d399);
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.btn-focus-trigger:hover {
  background: #173829;
}

/* Tag Management Strip */
.studio-tags-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 20px;
  background: #050b08;
  border-bottom: 1px solid #0f1d16;
}

.tags-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #4b6357;
}

.tag-chips-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.studio-tag-chip {
  background: #091711;
  border: 1px solid #143526;
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
  color: #6b7280;
  font-size: 10px;
  cursor: pointer;
  padding: 0;
}

.btn-remove-tag:hover {
  color: #ef4444;
}

.new-tag-input {
  background: #030805;
  border: 1px solid var(--emerald-main, #10b981);
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  width: 90px;
  outline: none;
}

.btn-add-tag-pill {
  background: transparent;
  border: 1px dashed #1f4231;
  color: #6b7280;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add-tag-pill:hover {
  color: #fff;
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
  background: #060e0a;
  border-bottom: 1px solid #11221a;
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
  background: #14281f;
  margin: 0 4px;
}

.btn-tool {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-tool:hover {
  background: #0f241a;
  border-color: #1b442f;
  color: #fff;
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
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
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
  flex: 1;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  border-bottom: 1px solid #102117;
  background: #050b08;
}

.pane-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #4b6357;
}

.pane-hint,
.pane-sync {
  font-size: 10px;
  color: var(--emerald-bright, #34d399);
}

.studio-editor-pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #11221a;
  background: #040906;
}

.studio-preview-pane {
  display: flex;
  flex-direction: column;
  background: #050c08;
}

.studio-textarea {
  flex: 1;
  background: transparent;
  border: none;
  padding: 24px;
  color: #e5e7eb;
  font-family: var(--font-mono, "JetBrains Mono", monospace);
  font-size: 13.5px;
  line-height: 1.7;
  resize: none;
  outline: none;
  tab-size: 2;
}

/* ========================================================
   RICH PREVIEW CONTENT STYLING
   ======================================================== */
.preview-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  color: #e5e7eb;
  line-height: 1.7;
  font-size: 14px;
}

.preview-content :deep(.md-h1) {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  margin: 18px 0 10px 0;
  border-bottom: 1px solid #14281f;
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
  color: #f3f4f6;
  margin: 14px 0 6px 0;
}

.preview-content :deep(.md-h4) {
  font-size: 13.5px;
  font-weight: 700;
  color: #9ca3af;
  margin: 12px 0 4px 0;
}

.preview-content :deep(.md-code-inline) {
  background: #0d1e16;
  border: 1px solid #1b3d2c;
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.preview-content :deep(.md-codeblock-wrapper) {
  background: #060d09;
  border: 1px solid #14281f;
  border-radius: 8px;
  margin: 16px 0;
  overflow: hidden;
}

.preview-content :deep(.codeblock-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #091610;
  padding: 6px 14px;
  border-bottom: 1px solid #12241b;
}

.preview-content :deep(.codeblock-lang) {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--emerald-bright, #34d399);
}

.preview-content :deep(.btn-code-copy) {
  background: #11281d;
  border: 1px solid #1d4632;
  color: #9ca3af;
  font-size: 10.5px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.preview-content :deep(.btn-code-copy:hover) {
  background: #1a3c2c;
  color: #fff;
}

.preview-content :deep(.md-pre) {
  margin: 0;
  padding: 14px;
  overflow-x: auto;
}

.preview-content :deep(.md-code-multiline) {
  font-family: var(--font-mono, monospace);
  font-size: 12.5px;
  color: #a7f3d0;
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
  background: rgba(16, 185, 129, 0.08);
  border-left-color: #10b981;
  border-top: 1px solid rgba(16, 185, 129, 0.2);
  border-right: 1px solid rgba(16, 185, 129, 0.2);
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
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
  background: #081510;
  color: #9ca3af;
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
  background: #07100c;
  border: 1px solid #14281f;
  border-radius: 6px;
  font-size: 13px;
}

.preview-content :deep(.md-table th) {
  background: #0c1c14;
  border-bottom: 1px solid #183325;
  padding: 10px 14px;
  text-align: left;
  font-weight: 700;
  color: #fff;
}

.preview-content :deep(.md-table td) {
  padding: 9px 14px;
  border-bottom: 1px solid #102117;
  color: #d1d5db;
}

.preview-content :deep(.md-table tr:hover td) {
  background: #0a1711;
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
  color: #6b7280;
}

/* Links & Media */
.preview-content :deep(.md-link) {
  color: var(--emerald-bright, #34d399);
  text-decoration: none;
  border-bottom: 1px dashed rgba(52, 211, 153, 0.4);
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
  border: 1px solid #14281f;
}

.preview-content :deep(figcaption) {
  font-size: 11px;
  color: #6b7280;
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
  background: #14281f;
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
  background: #040906;
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
  color: #fff;
  margin: 0 0 10px 0;
  letter-spacing: -0.02em;
}

.welcome-sub {
  font-size: 14px;
  color: #88929b;
  margin: 0 0 28px 0;
  line-height: 1.6;
  max-width: 580px;
}

.welcome-actions {
  margin-bottom: 36px;
}

.btn-welcome-primary {
  background: var(--emerald-main, #10b981);
  border: 1px solid #34d399;
  border-radius: 8px;
  color: #040c08;
  font-size: 14px;
  font-weight: 800;
  padding: 12px 28px;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
  transition: all 0.15s ease;
}

.btn-welcome-primary:hover {
  background: #34d399;
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(52, 211, 153, 0.5);
}

.template-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  text-align: left;
  width: 100%;
}

.tmpl-card {
  background: #07120d;
  border: 1px solid #14281f;
  border-radius: 10px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.tmpl-card:hover {
  background: #0b1f14;
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
  color: #fff;
  margin: 0 0 6px 0;
}

.card-desc {
  font-size: 12px;
  color: #88929b;
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
  height: 38px;
  background: #060e0a;
  border-top: 1px solid #11221a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 11.5px;
  color: #6b7280;
}

.footer-metrics {
  display: flex;
  gap: 16px;
  align-items: center;
}

.metric-item strong {
  color: #e5e7eb;
}

.metric-item.complexity {
  color: var(--emerald-bright, #34d399);
  background: #091711;
  border: 1px solid #143526;
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
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.8);
}

.security-text {
  font-size: 11px;
  font-weight: 600;
  color: #88929b;
}
</style>
