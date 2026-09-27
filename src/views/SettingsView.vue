<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { WOLFITWAY_PRODUCTS, SOVEREIGN_EXPERTS } from "@/services/seedData";
import { useNotesStore } from "@/stores/useNotesStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { useVaultStore } from "@/stores/useVaultStore";
import { useUiStore } from "@/stores/useUiStore";
import { useLicenseStore } from "@/stores/useLicenseStore";
import { useShortcutsStore, type KeyCombo } from "@/stores/useShortcutsStore";

const notesStore = useNotesStore();
const roadmapStore = useRoadmapStore();
const vaultStore = useVaultStore();
const uiStore = useUiStore();
const licenseStore = useLicenseStore();
const shortcutsStore = useShortcutsStore();

// Navigation Tabs
export type SettingsCategory =
  | "about"
  | "connections"
  | "shortcuts"
  | "export"
  | "themes"
  | "fonts"
  | "license"
  | "experts"
  | "performance";

const activeCategory = ref<SettingsCategory>("connections");
const searchQuery = ref("");

// Shortcuts State
const recordingActionId = ref<string | null>(null);
const recordedCombo = ref<KeyCombo | null>(null);
const conflictWarning = ref<string | null>(null);
const shortcutFilterQuery = ref<string>("");

function startRecording(actionId: string) {
  recordingActionId.value = actionId;
  recordedCombo.value = null;
  conflictWarning.value = null;
}

function cancelRecording() {
  recordingActionId.value = null;
  recordedCombo.value = null;
  conflictWarning.value = null;
}

function handleRecorderKeyDown(e: KeyboardEvent) {
  if (!recordingActionId.value) return;
  e.preventDefault();
  e.stopPropagation();

  if (e.key === "Escape") {
    cancelRecording();
    return;
  }

  // Ignore bare modifier keys
  if (["Control", "Meta", "Alt", "Shift"].includes(e.key)) {
    return;
  }

  const hasMod = e.metaKey || e.ctrlKey;
  let cleanKey = e.key;
  if (cleanKey === " ") cleanKey = "Space";

  const newCombo: KeyCombo = {
    key: cleanKey,
    mod: hasMod,
    alt: e.altKey || undefined,
    shift: e.shiftKey || undefined,
  };

  const isFunctionKey = /^F[1-9]|F1[0-2]$/i.test(e.key);
  if (!hasMod && !newCombo.alt && !isFunctionKey) {
    uiStore.showToast("Shortcuts must include Ctrl/Cmd or Alt modifier for system safety");
    return;
  }

  const conflict = shortcutsStore.findConflict(recordingActionId.value, newCombo);
  if (conflict) {
    conflictWarning.value = `Conflicts with "${conflict.label}" (${shortcutsStore.formatShortcut(conflict.id)})`;
  } else {
    conflictWarning.value = null;
  }

  recordedCombo.value = newCombo;
}

function saveRecordedShortcut() {
  if (recordingActionId.value && recordedCombo.value) {
    shortcutsStore.setShortcut(recordingActionId.value, recordedCombo.value);
    uiStore.showToast(`Saved shortcut for ${recordingActionId.value} ✓`);
    cancelRecording();
  }
}

function resetShortcutToDefault(actionId: string) {
  shortcutsStore.resetShortcut(actionId);
  uiStore.showToast("Shortcut restored to default ✓");
}

function resetAllShortcuts() {
  if (confirm("Reset all application shortcuts to default keybindings?")) {
    shortcutsStore.resetAllShortcuts();
    uiStore.showToast("All shortcuts reset to defaults ✓");
  }
}

const filteredShortcutsList = computed(() => {
  const q = shortcutFilterQuery.value.toLowerCase().trim();
  if (!q) return shortcutsStore.shortcuts;
  return shortcutsStore.shortcuts.filter((s) => {
    return (
      s.label.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      shortcutsStore.formatShortcut(s.id).toLowerCase().includes(q)
    );
  });
});

// Connections State
const connections = ref<Record<string, { connected: boolean; token: string }>>({});

// Themes State
const currentTheme = ref<string>("obsidian");
const themesList = [
  { id: "obsidian", name: "Cyber Obsidian", desc: "Signature emerald neon on deep obsidian black", primary: "#10b981", bg: "#060b09" },
  { id: "cyan", name: "Cyber Neon Cyan", desc: "Vibrant high-contrast cyan on dark navy slate", primary: "#06b6d4", bg: "#030a0e" },
  { id: "amber", name: "Amber Sovereign", desc: "Warm gold & amber terminal on dark tungsten", primary: "#f59e0b", bg: "#0d0a04" },
  { id: "sapphire", name: "Midnight Sapphire", desc: "Deep indigo and violet on midnight stealth", primary: "#6366f1", bg: "#050612" },
  { id: "crimson", name: "Crimson Terminal", desc: "Aggressive blood cyber-red on dark carbon", primary: "#ef4444", bg: "#0e0404" },
  { id: "matrix", name: "Matrix Phosphor", desc: "Raw CRT phosphor green on pitch black", primary: "#22c55e", bg: "#020803" },
];

// Fonts State
const currentFont = ref<string>("jakarta");
const fontsList = [
  { id: "jakarta", name: "Plus Jakarta Sans", type: "Modern Sans", sample: "Sovereign Engineering Alpha 2026" },
  { id: "inter", name: "Inter UI", type: "Neo-Grotesque", sample: "Fast, crisp system typography 12345" },
  { id: "outfit", name: "Outfit", type: "Geometric Tech", sample: "Bold cyberpunk headlines & cards" },
  { id: "mono", name: "JetBrains Mono", type: "Developer Monospace", sample: "const sovereign = true; // 0x7F" },
  { id: "fira", name: "Fira Code", type: "Code Ligatures", sample: "=> != <= == === -> |> [0..9]" },
];

const fontScale = ref<string>("14");
const tabularNums = ref<boolean>(true);
const glowEffects = ref<boolean>(true);
const glassmorphism = ref<boolean>(true);

// Performance / Reordering Settings
const reorderSpeed = ref<string>("smooth"); // fast | smooth | cinematic
const dragHaptics = ref<boolean>(true);
const autoSaveDebounce = ref<number>(200);

// File input for import
const importFileInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  // Load connections
  const localConn = localStorage.getItem("wolfitway_connections_state");
  if (localConn) {
    try {
      connections.value = JSON.parse(localConn);
    } catch {}
  }

  // Load theme
  const savedTheme = localStorage.getItem("wolf_theme") || "obsidian";
  currentTheme.value = savedTheme;
  applyTheme(savedTheme);

  // Load font
  const savedFont = localStorage.getItem("wolf_font") || "jakarta";
  currentFont.value = savedFont;
  applyFont(savedFont);

  // Load font scale
  const savedScale = localStorage.getItem("wolf_font_scale");
  if (savedScale) {
    fontScale.value = savedScale;
    document.documentElement.style.fontSize = `${savedScale}px`;
  }
});

function applyTheme(themeId: string) {
  currentTheme.value = themeId;
  localStorage.setItem("wolf_theme", themeId);
  if (themeId === "obsidian") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = themeId;
  }
}

function applyFont(fontId: string) {
  currentFont.value = fontId;
  localStorage.setItem("wolf_font", fontId);
  document.documentElement.dataset.font = fontId;
}

function changeFontScale(size: string) {
  fontScale.value = size;
  localStorage.setItem("wolf_font_scale", size);
  document.documentElement.style.fontSize = `${size}px`;
  uiStore.showToast(`Font scale set to ${size}px ✓`);
}

function toggleGlow() {
  glowEffects.value = !glowEffects.value;
  document.documentElement.classList.toggle("no-glow", !glowEffects.value);
  uiStore.showToast(glowEffects.value ? "Neon glow effects enabled" : "Neon glow effects dimmed");
}

function toggleGlass() {
  glassmorphism.value = !glassmorphism.value;
  uiStore.showToast(glassmorphism.value ? "Backdrop blur enabled" : "Backdrop blur disabled");
}

// Wolfitway Connection Handlers
function toggleConnection(prodId: string) {
  if (!connections.value[prodId]) {
    connections.value[prodId] = { connected: false, token: "" };
  }
  const next = !connections.value[prodId].connected;
  connections.value[prodId].connected = next;
  if (next && !connections.value[prodId].token) {
    connections.value[prodId].token = `wfw_${prodId}_live_${Math.random().toString(36).substring(2, 10)}`;
  }
  localStorage.setItem("wolfitway_connections_state", JSON.stringify(connections.value));
  uiStore.showToast(next ? `Connected to ${prodId.toUpperCase()} ✓` : `Disconnected from ${prodId.toUpperCase()}`);
}

function updateToken(prodId: string, val: string) {
  if (!connections.value[prodId]) {
    connections.value[prodId] = { connected: false, token: "" };
  }
  connections.value[prodId].token = val;
  localStorage.setItem("wolfitway_connections_state", JSON.stringify(connections.value));
}

// Export Handlers
function exportJson() {
  const payload = {
    notes: notesStore.notes,
    roadmap: roadmapStore.phases,
    exported_at: new Date().toISOString(),
    schema: "wolfitway_sovereign_v2",
    theme: currentTheme.value,
    font: currentFont.value,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wolf_timeline_vault_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  uiStore.showToast("Vault JSON exported successfully ✓");
}

function exportMarkdown() {
  let md = `# 🐺 Wolf Timeline Vault Export\nGenerated: ${new Date().toISOString()}\nSovereign Guarantee: 100% Offline-First Zero-Telemetry\n\n---\n\n`;
  notesStore.notes.forEach((n) => {
    md += `## [${n.status.toUpperCase()}] ${n.title}\n`;
    md += `**Date:** ${n.created_at} | **Tags:** ${n.tags.map((t) => "#" + t).join(" ")}\n\n`;
    md += `${n.body}\n\n`;
    if (n.events && n.events.length) {
      md += `### Chronological Timeline\n`;
      n.events.forEach((e) => {
        md += `- **${e.title}** (${e.time}): ${e.desc} [${e.author}]\n`;
      });
      md += `\n`;
    }
    if (n.ai_explorations && n.ai_explorations.length) {
      md += `### AI Explorations\n`;
      n.ai_explorations.forEach((ai) => {
        md += `- [${ai.model}] **${ai.title}**: ${(ai.rationale || ai.transcript || "").slice(0, 80)}...\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  });
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wolf_timeline_${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  uiStore.showToast("Timeline Markdown exported ✓");
}

function exportCsv() {
  let csv = "ID,Title,Status,Created At,Tags,Timeline Events Count,Explorations Count,Docs Count,Moods Count\n";
  notesStore.notes.forEach((n) => {
    const safeTitle = `"${n.title.replace(/"/g, '""')}"`;
    const safeTags = `"${n.tags.join("; ")}"`;
    csv += `${n.id},${safeTitle},${n.status},${n.created_at},${safeTags},${n.events?.length || 0},${n.ai_explorations?.length || 0},${n.bookmarks?.length || 0},${n.mood_gallery?.length || 0}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wolf_projects_matrix_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  uiStore.showToast("CSV Matrix exported ✓");
}

function triggerImportFile() {
  if (importFileInput.value) {
    importFileInput.value.click();
  }
}

function handleImportFile(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target?.result as string);
      if (data.notes && Array.isArray(data.notes)) {
        notesStore.reorderNotes(data.notes);
      }
      if (data.roadmap && Array.isArray(data.roadmap)) {
        roadmapStore.phases = data.roadmap;
      }
      uiStore.showToast(`Restored ${data.notes?.length || 0} projects & roadmap phases ✓`);
    } catch (err) {
      uiStore.showToast("Failed to parse JSON backup file");
    }
  };
  reader.readAsText(file);
  target.value = "";
}

function handleResetWorkspace() {
  if (confirm("Reset workspace with all sovereign sample projects, roadmap, and sample data?")) {
    notesStore.resetToDefaults();
    roadmapStore.resetToDefaults();
    uiStore.showToast("Sample data reloaded ✓");
  }
}

// Copy Device ID
function copyDeviceId() {
  navigator.clipboard.writeText(licenseStore.deviceId);
  uiStore.showToast("Device Hardware Fingerprint copied ✓");
}

function copyFounderKey() {
  navigator.clipboard.writeText("Drăgiuța Dan Ioan • WOLF-RO-DEV-BC66-AF84-F7F1 • wolfitway.com");
  uiStore.showToast("Founder signature & node fingerprint copied ✓");
}

// Categories definitions for sidebar
const categories = computed(() => [
  { id: "about" as SettingsCategory, label: "About & Founder Story", icon: "🐺", count: "RO" },
  { id: "connections" as SettingsCategory, label: "Wolfitway Connections", icon: "⚡", count: WOLFITWAY_PRODUCTS.length },
  { id: "shortcuts" as SettingsCategory, label: "Keyboard Shortcuts", icon: "⌨️", count: shortcutsStore.shortcuts.length },
  { id: "export" as SettingsCategory, label: "Data Export & Backup", icon: "📦", count: 4 },
  { id: "themes" as SettingsCategory, label: "Appearance & Themes", icon: "🎨", count: themesList.length },
  { id: "fonts" as SettingsCategory, label: "Typography & Fonts", icon: "🔤", count: fontsList.length },
  { id: "license" as SettingsCategory, label: "Hardware & Licensing", icon: "🔐", count: licenseStore.isActivated ? "ACTIVE" : "FREE" },
  { id: "experts" as SettingsCategory, label: "Council of Experts", icon: "🐺", count: SOVEREIGN_EXPERTS.length },
  { id: "performance" as SettingsCategory, label: "Reordering & Physics", icon: "🚀", count: "SMOOTH" },
]);

// Filtered categories based on search
const filteredCategories = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return categories.value;
  return categories.value.filter((cat) => {
    if (cat.label.toLowerCase().includes(q)) return true;
    if (cat.id === "about" && ("about founder dragiuta dan ioan wolfitway romania village solo builder origin manifesto vision".includes(q))) return true;
    if (cat.id === "shortcuts" && ("shortcuts keybindings hotkeys keys command".includes(q) || shortcutsStore.shortcuts.some((s) => s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)))) return true;
    if (cat.id === "connections" && WOLFITWAY_PRODUCTS.some((p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))) return true;
    if (cat.id === "export" && ("json markdown csv backup restore".includes(q))) return true;
    if (cat.id === "themes" && themesList.some((t) => t.name.toLowerCase().includes(q))) return true;
    if (cat.id === "fonts" && fontsList.some((f) => f.name.toLowerCase().includes(q))) return true;
    if (cat.id === "experts" && SOVEREIGN_EXPERTS.some((e) => e.role.toLowerCase().includes(q) || e.handle.toLowerCase().includes(q))) return true;
    return false;
  });
});

// Search results items
const isSearching = computed(() => searchQuery.value.trim().length > 0);

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return [];
  const results: Array<{ categoryId: SettingsCategory; categoryLabel: string; title: string; desc: string }> = [];

  // 0. About & Founder
  if ("about founder dragiuta dan ioan wolfitway romania village solo builder origin manifesto story".includes(q)) {
    results.push({
      categoryId: "about",
      categoryLabel: "About & Founder Story",
      title: "Drăgiuța Dan Ioan • Solo Sovereign Builder",
      desc: "Architected and built from a quiet village in Romania with zero telemetry, local AES-256 storage, and sovereign pride.",
    });
  }

  // 1. Shortcuts
  shortcutsStore.shortcuts.forEach((s) => {
    if (s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || shortcutsStore.formatShortcut(s.id).toLowerCase().includes(q) || "shortcuts keybindings keys".includes(q)) {
      results.push({ categoryId: "shortcuts", categoryLabel: "Keyboard Shortcuts", title: `${s.label} (${shortcutsStore.formatShortcut(s.id)})`, desc: s.desc });
    }
  });

  // 2. Connections
  WOLFITWAY_PRODUCTS.forEach((p) => {
    if (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q)) {
      results.push({ categoryId: "connections", categoryLabel: "Wolfitway Connections", title: p.name, desc: p.desc });
    }
  });

  // 3. Themes
  themesList.forEach((t) => {
    if (t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)) {
      results.push({ categoryId: "themes", categoryLabel: "Appearance & Themes", title: t.name, desc: t.desc });
    }
  });

  // 4. Fonts
  fontsList.forEach((f) => {
    if (f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)) {
      results.push({ categoryId: "fonts", categoryLabel: "Typography & Fonts", title: f.name, desc: f.type });
    }
  });

  // 5. Export
  if ("export json markdown csv backup data".includes(q)) {
    results.push({ categoryId: "export", categoryLabel: "Data Export & Backup", title: "JSON & Markdown Vault Export", desc: "Download zero-telemetry offline database backups." });
  }

  // 6. Experts
  SOVEREIGN_EXPERTS.forEach((e) => {
    if (e.role.toLowerCase().includes(q) || e.handle.toLowerCase().includes(q) || e.mandate.toLowerCase().includes(q)) {
      results.push({ categoryId: "experts", categoryLabel: "Council of Experts", title: `${e.avatar} ${e.role}`, desc: e.mandate });
    }
  });

  return results;
});

function jumpToCategory(catId: SettingsCategory) {
  activeCategory.value = catId;
  searchQuery.value = "";
}
</script>

<template>
  <div class="settings-view-layout">
    <!-- Left Master Sidebar -->
    <aside class="settings-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title-row">
          <span class="settings-gear-icon">⚙️</span>
          <h2 class="sidebar-title">Settings &amp; Vault</h2>
        </div>
        <p class="sidebar-sub">Sovereign workspace configuration</p>

        <!-- Search Input -->
        <div class="settings-search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            class="settings-search-input"
            placeholder="Search settings, tokens, themes..."
          />
          <button v-if="searchQuery" type="button" class="btn-clear-search" @click="searchQuery = ''">✕</button>
        </div>
      </div>

      <!-- Categories Nav -->
      <nav class="settings-nav">
        <button
          v-for="cat in filteredCategories"
          :key="cat.id"
          type="button"
          class="nav-item-btn"
          :class="{ active: activeCategory === cat.id && !isSearching }"
          @click="jumpToCategory(cat.id)"
        >
          <span class="nav-item-icon">{{ cat.icon }}</span>
          <span class="nav-item-label">{{ cat.label }}</span>
          <span class="nav-item-badge">{{ cat.count }}</span>
        </button>
      </nav>

      <!-- Sidebar Footer Hardware Status -->
      <div class="sidebar-footer">
        <div class="node-badge-card" @click="uiStore.showLicenseModal = true">
          <div class="node-badge-header">
            <span class="dot-live"></span>
            <span class="node-status-title">{{ licenseStore.isActivated ? 'PRO SOVEREIGN NODE' : 'COMMUNITY NODE' }}</span>
          </div>
          <span class="node-id-preview">{{ licenseStore.deviceId }}</span>
        </div>
      </div>
    </aside>

    <!-- Main Content Panel -->
    <main class="settings-main-pane">
      <!-- Hidden file input for restore -->
      <input
        ref="importFileInput"
        type="file"
        accept=".json"
        style="display: none"
        @change="handleImportFile"
      />

      <!-- If actively searching and has search results -->
      <div v-if="isSearching" class="search-results-pane">
        <div class="search-header-banner">
          <h3 class="pane-title">Search Results for "{{ searchQuery }}"</h3>
          <span class="results-count">{{ searchResults.length }} items matched</span>
        </div>

        <div v-if="searchResults.length === 0" class="empty-search">
          <span class="empty-icon">🔍</span>
          <p>No settings matched your query. Try searching for "theme", "token", "export", or "font".</p>
        </div>

        <div v-else class="search-cards-grid">
          <div
            v-for="(res, idx) in searchResults"
            :key="idx"
            class="search-match-card"
            @click="jumpToCategory(res.categoryId)"
          >
            <div class="search-card-top">
              <span class="match-category-pill">{{ res.categoryLabel }}</span>
              <span class="jump-arrow">Jump to tab →</span>
            </div>
            <h4 class="match-title">{{ res.title }}</h4>
            <p class="match-desc">{{ res.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Section: About & Founder Story -->
      <div v-else-if="activeCategory === 'about'" class="category-pane">
        <!-- Hero Founder Card -->
        <div class="founder-hero-card">
          <div class="founder-hero-glow"></div>
          <div class="founder-hero-content">
            <div class="founder-badge-row">
              <span class="founder-flag-badge">🇷🇴 ROMANIAN FORGE</span>
              <span class="founder-role-badge">SOLO SOVEREIGN BUILDER</span>
              <span class="founder-zero-badge">ZERO TELEMETRY GUARANTEED</span>
            </div>

            <div class="founder-profile-row">
              <div class="founder-avatar-box">
                <span class="founder-wolf-emoji">🐺</span>
                <span class="avatar-pulse-ring"></span>
              </div>
              <div class="founder-title-col">
                <h2 class="founder-name">Drăgiuța Dan Ioan</h2>
                <p class="founder-handle">@dan • Solo Architect &amp; Creator of Wolfitway OS</p>
                <div class="founder-location-pill">
                  <span>📍 Crafted line-by-line from a village in Romania</span>
                </div>
              </div>
            </div>

            <blockquote class="founder-manifesto-quote">
              "You don't need a 50-person venture-backed Silicon Valley team burning millions in cloud telemetry to build god-tier software.
              From a quiet village in Romania, with deep focus, Rust, clean code, and zero compromises, one maker can forge sovereign tools that respect human freedom and outpace entire tech giants."
            </blockquote>
          </div>
        </div>

        <!-- The Romanian Village Origin Story -->
        <div class="story-columns-grid">
          <div class="story-card">
            <div class="story-icon-row">
              <span class="story-icon">🌲</span>
              <h3 class="story-title">The Village Origin</h3>
            </div>
            <p class="story-text">
              While modern tech hubs in San Francisco and London optimize for investor pitches, VC burn rates, and relentless subscription surveillance, <strong>Dan Ioan Drăgiuța</strong> chose a different path: total isolation and extreme engineering craft in a Romanian village.
            </p>
            <p class="story-text">
              Surrounded by mountain air and rural silence, every feature in Wolf Timeline—from the in-memory AES-256 vault to the interactive markdown live-preview engine—was forged through thousands of hours of solitary focus.
            </p>
          </div>

          <div class="story-card">
            <div class="story-icon-row">
              <span class="story-icon">⚡</span>
              <h3 class="story-title">The Wolfitway OS Vision</h3>
            </div>
            <p class="story-text">
              The modern worker is trapped juggling 30+ fragmented SaaS tools: Jira, Notion, Linear, 1Password, Figma, Obsidian. Each tool rents your attention, sells your telemetry, and holds your files hostage in their cloud.
            </p>
            <p class="story-text">
              <strong>Wolfitway OS</strong> was born to shatter that paradigm: one unified sovereign command center hosted directly on your hardware. You own the code. You own the database. No tracking. No telemetry. Period.
            </p>
          </div>
        </div>

        <!-- Pillar Cards Grid -->
        <div class="sovereign-pillars-grid">
          <div class="pillar-card">
            <span class="pillar-number">01</span>
            <h4 class="pillar-heading">Zero Cloud Leaks</h4>
            <p class="pillar-sub">
              Your keystrokes, strategy notes, and passwords never leave your client machine. In-memory RAM buffer with instant zeroization on lock.
            </p>
          </div>

          <div class="pillar-card">
            <span class="pillar-number">02</span>
            <h4 class="pillar-heading">Uncompromising Speed</h4>
            <p class="pillar-sub">
              Sub-millisecond latency. Built on native Rust &amp; Tauri with a hyper-optimized 298KB frontend. No multi-gigabyte Electron bloat.
            </p>
          </div>

          <div class="pillar-card">
            <span class="pillar-number">03</span>
            <h4 class="pillar-heading">Offline-First Invariant</h4>
            <p class="pillar-sub">
              Whether on a flight, in an air-gapped lab, or off-grid in the Carpathian mountains, every timeline, roadmap, and gallery works at 100%.
            </p>
          </div>

          <div class="pillar-card">
            <span class="pillar-number">04</span>
            <h4 class="pillar-heading">Hardware Keygen</h4>
            <p class="pillar-sub">
              Cryptographic offline node activation using deterministic SHA-256 device hashing. No central license server phone-home checks.
            </p>
          </div>
        </div>

        <!-- Technical Telemetry & Builder Node Box -->
        <div class="origin-specs-card">
          <div class="specs-header">
            <span class="specs-icon">📡</span>
            <div>
              <h4 class="specs-title">Origin Node Specification &amp; Telemetry</h4>
              <p class="specs-sub">Cryptographic provenance and hardware origin details.</p>
            </div>
          </div>

          <div class="specs-table-grid">
            <div class="spec-row">
              <span class="spec-k">Architect &amp; Solo Maker</span>
              <span class="spec-v highlight">Drăgiuța Dan Ioan (@dan)</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Forge Geographic Origin</span>
              <span class="spec-v">Rural Village, Romania (Carpathian Basin) 🇷🇴</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Ecosystem Foundation</span>
              <span class="spec-v">Wolfitway OS (wolfitway.com)</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Engine Stack</span>
              <span class="spec-v">Rust (Tauri Core) + Vue 3 + TypeScript + Pinia</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Storage Subsystem</span>
              <span class="spec-v">Sovereign IndexedDB v2 + Local-First Filesystem Access</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Cryptography Invariants</span>
              <span class="spec-v">PBKDF2-SHA256 (100k iters) + AES-256-GCM Hardware Lock</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Production Bundle</span>
              <span class="spec-v">&lt; 300 KB Gzip (Ultra-lightweight)</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Offline Node Signature</span>
              <span class="spec-v font-mono">WOLF-RO-DEV-BC66-AF84-F7F1</span>
            </div>
          </div>

          <div class="specs-footer-links">
            <a href="https://wolfitway.com" target="_blank" rel="noopener noreferrer" class="link-wolfitway">
              🌐 wolfitway.com ↗
            </a>
            <button type="button" class="btn-copy-node" @click="copyFounderKey">
              📋 Copy Founder Fingerprint
            </button>
          </div>
        </div>
      </div>

      <!-- Section: Wolfitway Connections -->
      <div v-else-if="activeCategory === 'connections'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title">⚡ Wolfitway Ecosystem Connections</h3>
            <p class="pane-desc">Synchronize sovereign vault nodes with Wolfitway decentralized suite.</p>
          </div>
        </div>

        <div class="connections-grid">
          <div
            v-for="prod in WOLFITWAY_PRODUCTS"
            :key="prod.id"
            class="connection-card"
            :class="{ active: connections[prod.id]?.connected }"
          >
            <div class="conn-card-top">
              <div class="conn-brand">
                <span class="conn-icon">{{ prod.icon }}</span>
                <div class="conn-names">
                  <span class="conn-title">{{ prod.name }}</span>
                  <span class="conn-domain">{{ prod.domain }}</span>
                </div>
              </div>
              <span class="conn-status-badge" :class="{ on: connections[prod.id]?.connected }">
                <span class="dot" :class="connections[prod.id]?.connected ? 'dot-green' : 'dot-gray'"></span>
                {{ connections[prod.id]?.connected ? "Connected" : "Disconnected" }}
              </span>
            </div>

            <p class="conn-desc">{{ prod.desc }}</p>

            <div class="conn-action-row">
              <input
                :value="connections[prod.id]?.token || ''"
                type="password"
                class="conn-token-input"
                :placeholder="prod.placeholder"
                @input="(e) => updateToken(prod.id, (e.target as HTMLInputElement).value)"
              />
              <button
                type="button"
                class="btn-conn-toggle"
                :class="{ connected: connections[prod.id]?.connected }"
                @click="toggleConnection(prod.id)"
              >
                {{ connections[prod.id]?.connected ? "Disconnect" : "Connect Mock" }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Keyboard Shortcuts -->
      <div v-else-if="activeCategory === 'shortcuts'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title">⌨️ Keyboard Shortcuts &amp; Ergonomics</h3>
            <p class="pane-desc">Customize global application hotkeys, resolve key conflicts, and tailor your sovereign deep-work flow.</p>
          </div>
          <div class="header-action-group">
            <button type="button" class="btn-secondary-action" @click="resetAllShortcuts">
              ↺ Reset All Defaults
            </button>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="shortcuts-filter-bar">
          <div class="filter-input-wrap">
            <span class="filter-icon">🔍</span>
            <input
              v-model="shortcutFilterQuery"
              type="text"
              class="shortcuts-filter-input"
              placeholder="Filter shortcuts by name, action, or key..."
            />
            <button v-if="shortcutFilterQuery" type="button" class="btn-clear-search" @click="shortcutFilterQuery = ''">✕</button>
          </div>
          <span class="shortcuts-count-pill">{{ filteredShortcutsList.length }} Shortcuts</span>
        </div>

        <!-- Recording Banner / Card if active -->
        <div v-if="recordingActionId" class="key-recorder-card" tabindex="0" @keydown="handleRecorderKeyDown">
          <div class="recorder-top">
            <div class="recorder-title-row">
              <span class="pulse-recording-dot"></span>
              <span class="recorder-heading">
                Recording shortcut for: <strong>{{ shortcutsStore.shortcuts.find(s => s.id === recordingActionId)?.label }}</strong>
              </span>
            </div>
            <button type="button" class="btn-close-recorder" @click="cancelRecording">✕</button>
          </div>

          <div class="recorder-prompt-box">
            <p v-if="!recordedCombo" class="prompt-text">
              ⌨️ Press your desired key combination on your keyboard (e.g. <kbd>{{ shortcutsStore.isMac ? '⌘' : 'Ctrl' }}</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>)
            </p>
            <div v-else class="recorded-keys-display">
              <span class="recorded-label">Detected:</span>
              <div class="keys-row">
                <kbd v-for="(tok, idx) in shortcutsStore.formatComboTokens(recordedCombo)" :key="idx" class="live-kbd">
                  {{ tok }}
                </kbd>
              </div>
            </div>

            <div v-if="conflictWarning" class="conflict-alert-box">
              <span class="alert-icon">⚠️</span>
              <span>{{ conflictWarning }}</span>
            </div>
          </div>

          <div class="recorder-actions">
            <button type="button" class="btn-cancel" @click="cancelRecording">Cancel (Esc)</button>
            <button
              type="button"
              class="btn-save-key"
              :disabled="!recordedCombo"
              @click="saveRecordedShortcut"
            >
              Save Keybinding ✓
            </button>
          </div>
        </div>

        <!-- Shortcuts Table Grid -->
        <div class="shortcuts-grid">
          <div
            v-for="item in filteredShortcutsList"
            :key="item.id"
            class="shortcut-row-card"
            :class="{ custom: item.isCustom, recording: recordingActionId === item.id }"
          >
            <div class="shortcut-info">
              <div class="shortcut-title-row">
                <span class="shortcut-label">{{ item.label }}</span>
                <span v-if="item.isCustom" class="badge-custom">CUSTOMIZED</span>
                <span class="category-tag-pill">{{ item.category }}</span>
              </div>
              <p class="shortcut-desc">{{ item.desc }}</p>
            </div>

            <div class="shortcut-controls">
              <!-- Visual Key Badges -->
              <div class="key-badges-row">
                <kbd
                  v-for="(tok, idx) in shortcutsStore.formatComboTokens(item.currentKey)"
                  :key="idx"
                  class="kbd-badge"
                >
                  {{ tok }}
                </kbd>
              </div>

              <!-- Action buttons -->
              <button
                type="button"
                class="btn-record-key"
                :class="{ recording: recordingActionId === item.id }"
                @click="startRecording(item.id)"
              >
                {{ recordingActionId === item.id ? 'Recording...' : '✎ Edit' }}
              </button>

              <button
                v-if="item.isCustom"
                type="button"
                class="btn-reset-key"
                title="Reset to factory default"
                @click="resetShortcutToDefault(item.id)"
              >
                ↺
              </button>
            </div>
          </div>
        </div>

        <!-- Cheatsheet & Sovereign Keyboard Overview -->
        <div class="shortcuts-cheatsheet-card">
          <div class="cheatsheet-header">
            <span class="cheatsheet-icon">🐺</span>
            <div>
              <h4 class="cheatsheet-title">Sovereign Keyboard Ergonomics</h4>
              <p class="cheatsheet-sub">All shortcuts are intercepted locally before browser defaults and persisted offline.</p>
            </div>
          </div>
          <div class="cheatsheet-chips">
            <span class="chip-item"><code>Zero Network Leak</code></span>
            <span class="chip-item"><code>Platform: {{ shortcutsStore.isMac ? 'macOS (⌘ Command)' : 'Linux/Windows (Ctrl)' }}</code></span>
            <span class="chip-item"><code>Safe Inputs (Typing Protected)</code></span>
          </div>
        </div>
      </div>

      <!-- Section: Data Export & Backup -->
      <div v-else-if="activeCategory === 'export'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title">📦 Sovereign Data Backup &amp; Portability</h3>
            <p class="pane-desc">Download encrypted JSON archives, Markdown documents, or tabular CSV sheets.</p>
          </div>
        </div>

        <div class="export-cards-grid">
          <div class="export-feature-card">
            <div class="export-icon-box">📄</div>
            <div class="export-card-body">
              <h4 class="export-item-title">Wolfitway JSON Vault</h4>
              <p class="export-item-desc">Complete sovereign database snapshot containing all projects, timeline milestones, AI explorations, and roadmap phases.</p>
              <div class="export-actions">
                <button type="button" class="btn-primary-export" @click="exportJson">
                  <span>📥</span> Download JSON Vault
                </button>
              </div>
            </div>
          </div>

          <div class="export-feature-card">
            <div class="export-icon-box">📝</div>
            <div class="export-card-body">
              <h4 class="export-item-title">Markdown Timeline Document</h4>
              <p class="export-item-desc">GitHub-flavored markdown document perfect for publishing to static sites, documentation wikis, or Git commit logs.</p>
              <div class="export-actions">
                <button type="button" class="btn-primary-export" @click="exportMarkdown">
                  <span>📥</span> Download .md Document
                </button>
              </div>
            </div>
          </div>

          <div class="export-feature-card">
            <div class="export-icon-box">📊</div>
            <div class="export-card-body">
              <h4 class="export-item-title">CSV Project Matrix Sheet</h4>
              <p class="export-item-desc">Structured tabular spreadsheet with all project statuses, event counts, tags, and timestamps for Excel or Google Sheets.</p>
              <div class="export-actions">
                <button type="button" class="btn-primary-export" @click="exportCsv">
                  <span>📥</span> Download CSV Matrix
                </button>
              </div>
            </div>
          </div>

          <div class="export-feature-card">
            <div class="export-icon-box">🔄</div>
            <div class="export-card-body">
              <h4 class="export-item-title">Restore / Import Vault</h4>
              <p class="export-item-desc">Load a previously exported Wolfitway JSON file into your local node database without losing offline sovereignty.</p>
              <div class="export-actions">
                <button type="button" class="btn-secondary-action" @click="triggerImportFile">
                  <span>📂</span> Select JSON Backup File
                </button>
              </div>
            </div>
          </div>

          <div class="export-feature-card danger-feature-card">
            <div class="export-icon-box">⚠️</div>
            <div class="export-card-body">
              <h4 class="export-item-title">Reload Sample Default Workspace</h4>
              <p class="export-item-desc">Revert the active workspace to default sovereign sample projects, roadmap phases, and timeline logs.</p>
              <div class="export-actions">
                <button type="button" class="btn-danger-action" @click="handleResetWorkspace">
                  <span>↺</span> Reload Sovereign Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Appearance & Themes -->
      <div v-else-if="activeCategory === 'themes'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title">🎨 Appearance &amp; Cyber Themes</h3>
            <p class="pane-desc">Choose your visual aesthetic, neon intensity, and glassmorphism levels.</p>
          </div>
        </div>

        <div class="themes-selector-grid">
          <div
            v-for="th in themesList"
            :key="th.id"
            class="theme-card-option"
            :class="{ selected: currentTheme === th.id }"
            @click="applyTheme(th.id)"
          >
            <div class="theme-color-preview" :style="{ background: th.bg, borderColor: th.primary }">
              <div class="theme-accent-circle" :style="{ background: th.primary, boxShadow: `0 0 10px ${th.primary}` }"></div>
              <span v-if="currentTheme === th.id" class="theme-selected-check">✓ ACTIVE</span>
            </div>
            <div class="theme-info-box">
              <h4 class="theme-name">{{ th.name }}</h4>
              <p class="theme-desc">{{ th.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Visual Effects Toggles -->
        <div class="settings-subgroup">
          <h4 class="subgroup-title">Visual Effects &amp; Glassmorphism</h4>
          <div class="effects-row-grid">
            <div class="toggle-card" @click="toggleGlow">
              <div class="toggle-card-left">
                <span class="toggle-icon">✨</span>
                <div>
                  <span class="toggle-title">Cyber Neon Glows</span>
                  <span class="toggle-sub">Soft emerald and accent illumination on borders and active cards</span>
                </div>
              </div>
              <div class="custom-switch" :class="{ on: glowEffects }">
                <div class="switch-handle"></div>
              </div>
            </div>

            <div class="toggle-card" @click="toggleGlass">
              <div class="toggle-card-left">
                <span class="toggle-icon">💎</span>
                <div>
                  <span class="toggle-title">Backdrop Glassmorphism</span>
                  <span class="toggle-sub">Hardware-accelerated CSS backdrop-filter blur on modal drawers</span>
                </div>
              </div>
              <div class="custom-switch" :class="{ on: glassmorphism }">
                <div class="switch-handle"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Typography & Fonts -->
      <div v-else-if="activeCategory === 'fonts'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title">🔤 Typography &amp; Editor Fonts</h3>
            <p class="pane-desc">Customize UI typography, code ligatures, and reading scale.</p>
          </div>
        </div>

        <div class="fonts-selector-grid">
          <div
            v-for="f in fontsList"
            :key="f.id"
            class="font-card-option"
            :class="{ selected: currentFont === f.id }"
            @click="applyFont(f.id)"
          >
            <div class="font-card-header">
              <span class="font-name">{{ f.name }}</span>
              <span class="font-type-pill">{{ f.type }}</span>
            </div>
            <div class="font-preview-box">
              <p class="font-sample-text">{{ f.sample }}</p>
            </div>
            <div class="font-card-footer">
              <span v-if="currentFont === f.id" class="font-active-label">✓ Active Font</span>
              <span v-else class="font-select-hint">Click to activate</span>
            </div>
          </div>
        </div>

        <!-- Font Scale Slider -->
        <div class="settings-subgroup">
          <h4 class="subgroup-title">Base UI Scaling</h4>
          <div class="font-scale-selector">
            <button
              type="button"
              class="scale-btn"
              :class="{ active: fontScale === '13' }"
              @click="changeFontScale('13')"
            >
              Compact (13px)
            </button>
            <button
              type="button"
              class="scale-btn"
              :class="{ active: fontScale === '14' }"
              @click="changeFontScale('14')"
            >
              Standard (14px)
            </button>
            <button
              type="button"
              class="scale-btn"
              :class="{ active: fontScale === '15' }"
              @click="changeFontScale('15')"
            >
              Roomy (15px)
            </button>
          </div>
        </div>
      </div>

      <!-- Section: Hardware & Licensing -->
      <div v-else-if="activeCategory === 'license'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title">🔐 Hardware Cryptography &amp; Licensing</h3>
            <p class="pane-desc">Offline SHA-256 HMAC machine verification with zero-telemetry architecture.</p>
          </div>
        </div>

        <div class="license-overview-grid">
          <div class="license-status-card" :class="{ activated: licenseStore.isActivated }">
            <div class="license-card-badge">
              <span class="status-glow-dot"></span>
              <span class="status-badge-text">{{ licenseStore.isActivated ? "PRO FOUNDER NODE ACTIVATED" : "COMMUNITY ALPHA NODE" }}</span>
            </div>

            <div class="license-id-group">
              <span class="license-label">Machine Hardware Fingerprint</span>
              <div class="license-id-row">
                <code class="code-fingerprint">{{ licenseStore.deviceId }}</code>
                <button type="button" class="btn-copy-sm" @click="copyDeviceId">Copy</button>
              </div>
            </div>

            <div class="license-id-group" v-if="licenseStore.isActivated">
              <span class="license-label">Active License Key</span>
              <code class="code-license-key">{{ licenseStore.licenseKey }}</code>
            </div>

            <div class="license-actions-row">
              <button
                type="button"
                class="btn-open-keygen"
                @click="uiStore.showLicenseModal = true"
              >
                <span>🔑</span> Launch Sovereign Keygen &amp; Unlock
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Council of Sovereign Experts -->
      <div v-else-if="activeCategory === 'experts'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title">🐺 The Council of Sovereign Experts</h3>
            <p class="pane-desc">Specialized engineering and product council governing Wolf Timeline architecture.</p>
          </div>
        </div>

        <div class="experts-grid">
          <div
            v-for="expert in SOVEREIGN_EXPERTS"
            :key="expert.handle"
            class="expert-card"
          >
            <div class="expert-top">
              <span class="expert-avatar">{{ expert.avatar }}</span>
              <div class="expert-info">
                <span class="expert-role">{{ expert.role }}</span>
                <span class="expert-handle">{{ expert.handle }}</span>
              </div>
              <span class="expert-status">✅ {{ expert.status }}</span>
            </div>
            <p class="expert-mandate">{{ expert.mandate }}</p>
          </div>
        </div>
      </div>

      <!-- Section: Performance & Reordering -->
      <div v-else-if="activeCategory === 'performance'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title">🚀 Smooth Reordering &amp; Drag Physics</h3>
            <p class="pane-desc">Fine-tune animations, drag elevation physics, and canvas reactivity.</p>
          </div>
        </div>

        <div class="settings-subgroup">
          <h4 class="subgroup-title">Drag &amp; Drop Animation Velocity</h4>
          <div class="physics-options-grid">
            <div
              class="physics-card"
              :class="{ active: reorderSpeed === 'fast' }"
              @click="reorderSpeed = 'fast'; uiStore.showToast('Reorder animation set to Ultra Fast 150ms ✓')"
            >
              <span class="physics-icon">⚡</span>
              <span class="physics-name">Ultra Fast</span>
              <span class="physics-sub">150ms cubic-bezier transition</span>
            </div>

            <div
              class="physics-card"
              :class="{ active: reorderSpeed === 'smooth' }"
              @click="reorderSpeed = 'smooth'; uiStore.showToast('Reorder animation set to Smooth Silk 220ms ✓')"
            >
              <span class="physics-icon">🌊</span>
              <span class="physics-name">Smooth Silk</span>
              <span class="physics-sub">220ms organic easing with elevation</span>
            </div>

            <div
              class="physics-card"
              :class="{ active: reorderSpeed === 'cinematic' }"
              @click="reorderSpeed = 'cinematic'; uiStore.showToast('Reorder animation set to Cinematic 350ms ✓')"
            >
              <span class="physics-icon">🎬</span>
              <span class="physics-name">Cinematic</span>
              <span class="physics-sub">350ms fluid spring curve</span>
            </div>
          </div>
        </div>

        <div class="settings-subgroup">
          <h4 class="subgroup-title">Reactivity &amp; Haptics</h4>
          <div class="effects-row-grid">
            <div class="toggle-card" @click="dragHaptics = !dragHaptics; uiStore.showToast(dragHaptics ? 'Drag haptic cues enabled' : 'Drag haptic cues disabled')">
              <div class="toggle-card-left">
                <span class="toggle-icon">🎯</span>
                <div>
                  <span class="toggle-title">Drag Position Snapping Feedback</span>
                  <span class="toggle-sub">Visual scale pulse when hovering over valid dropzones</span>
                </div>
              </div>
              <div class="custom-switch" :class="{ on: dragHaptics }">
                <div class="switch-handle"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.settings-view-layout {
  display: flex;
  width: 100%;
  height: calc(100vh - 60px);
  background: var(--bg-body, #040c08);
  overflow: hidden;
}

/* Master Sidebar */
.settings-sidebar {
  width: 280px;
  min-width: 280px;
  background: #060e0a;
  border-right: 1px solid #14281f;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 20px 18px 14px;
  border-bottom: 1px solid #102419;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-gear-icon {
  font-size: 18px;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.01em;
  margin: 0;
}

.sidebar-sub {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

/* Search Box */
.settings-search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #030805;
  border: 1px solid #14281f;
  border-radius: 8px;
  padding: 6px 10px;
  margin-top: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.settings-search-box:focus-within {
  border-color: var(--emerald-main, #10b981);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
}

.search-icon {
  font-size: 12px;
  opacity: 0.7;
}

.settings-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 11.5px;
  color: #fff;
  font-family: inherit;
}

.settings-search-input::placeholder {
  color: #4b5563;
}

.btn-clear-search {
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 10px;
  cursor: pointer;
  padding: 0 2px;
}

.btn-clear-search:hover {
  color: #fff;
}

/* Nav items */
.settings-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.nav-item-btn:hover {
  background: #0a1711;
  color: #e5e7eb;
}

.nav-item-btn.active {
  background: #0d2419;
  border-color: rgba(16, 185, 129, 0.4);
  color: #fff;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);
}

.nav-item-icon {
  font-size: 15px;
}

.nav-item-label {
  flex: 1;
}

.nav-item-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  background: #06150e;
  border: 1px solid #142c20;
  border-radius: 10px;
  color: var(--emerald-bright, #34d399);
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 12px 14px;
  border-top: 1px solid #102419;
}

.node-badge-card {
  background: #040a07;
  border: 1px solid #14281f;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-badge-card:hover {
  border-color: var(--emerald-main, #10b981);
}

.node-badge-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot-live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.node-status-title {
  font-size: 10px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  letter-spacing: 0.04em;
}

.node-id-preview {
  font-size: 10px;
  font-family: var(--font-mono, monospace);
  color: #6b7280;
}

/* Main Detail Pane */
.settings-main-pane {
  flex: 1;
  overflow-y: auto;
  padding: 30px 40px;
  background: var(--bg-body, #040c08);
}

.category-pane {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 1px solid #102419;
}

.pane-title {
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 4px;
}

.pane-desc {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

/* Connections Grid */
.connections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.connection-card {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.connection-card:hover {
  border-color: #1a3c2c;
}

.connection-card.active {
  border-color: rgba(16, 185, 129, 0.45);
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.08);
}

.conn-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conn-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.conn-icon {
  font-size: 20px;
}

.conn-names {
  display: flex;
  flex-direction: column;
}

.conn-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
}

.conn-domain {
  font-size: 10.5px;
  color: var(--emerald-bright, #34d399);
}

.conn-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: #9ca3af;
}

.conn-status-badge.on {
  color: var(--emerald-bright, #34d399);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-green {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.dot-gray {
  background: #6b7280;
}

.conn-desc {
  font-size: 11.5px;
  color: #9ca3af;
  line-height: 1.4;
  margin: 0;
}

.conn-action-row {
  display: flex;
  gap: 8px;
}

.conn-token-input {
  flex: 1;
  background: #050b08;
  border: 1px solid #142820;
  border-radius: 6px;
  padding: 6px 10px;
  color: #fff;
  font-size: 11px;
  outline: none;
}

.btn-conn-toggle {
  background: #10241b;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-conn-toggle:hover {
  background: #163627;
}

.btn-conn-toggle.connected {
  background: transparent;
  border-color: #ef4444;
  color: #ef4444;
}

/* Export Cards */
.export-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-feature-card {
  display: flex;
  gap: 16px;
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 12px;
  padding: 18px;
  align-items: center;
  transition: border-color 0.2s ease;
}

.export-feature-card:hover {
  border-color: rgba(16, 185, 129, 0.3);
}

.export-icon-box {
  font-size: 26px;
  width: 48px;
  height: 48px;
  background: #040a07;
  border: 1px solid #14281f;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.export-item-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.export-item-desc {
  font-size: 11.5px;
  color: #9ca3af;
  margin: 0 0 10px;
  line-height: 1.4;
}

.export-actions {
  display: flex;
  gap: 10px;
}

.btn-primary-export {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0d281c;
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 6px;
  padding: 7px 14px;
  color: var(--emerald-bright, #34d399);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary-export:hover {
  background: #143d2b;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
}

.btn-secondary-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0b1812;
  border: 1px solid #1a382b;
  border-radius: 6px;
  padding: 7px 14px;
  color: #d1d5db;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary-action:hover {
  background: #12241c;
  color: #fff;
}

.danger-feature-card {
  border-color: rgba(239, 68, 68, 0.2);
  background: #0d0707;
}

.btn-danger-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 6px;
  padding: 7px 14px;
  color: #ef4444;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger-action:hover {
  background: rgba(239, 68, 68, 0.15);
}

/* Themes Grid */
.themes-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.theme-card-option {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-card-option:hover {
  border-color: rgba(16, 185, 129, 0.4);
  transform: translateY(-2px);
}

.theme-card-option.selected {
  border-color: var(--emerald-main, #10b981);
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.15);
}

.theme-color-preview {
  height: 60px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #102419;
}

.theme-accent-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.theme-selected-check {
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  padding: 3px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.theme-info-box {
  padding: 12px 14px;
}

.theme-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
}

.theme-desc {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.35;
}

/* Subgroups */
.settings-subgroup {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subgroup-title {
  font-size: 13px;
  font-weight: 700;
  color: #e5e7eb;
  margin: 0;
}

.effects-row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.toggle-card {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.toggle-card:hover {
  border-color: rgba(16, 185, 129, 0.3);
}

.toggle-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-icon {
  font-size: 18px;
}

.toggle-title {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
}

.toggle-sub {
  display: block;
  font-size: 10.5px;
  color: #9ca3af;
}

/* Custom Switch */
.custom-switch {
  width: 38px;
  height: 20px;
  background: #14281f;
  border-radius: 10px;
  padding: 2px;
  transition: background 0.2s ease;
}

.custom-switch.on {
  background: var(--emerald-main, #10b981);
}

.switch-handle {
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.custom-switch.on .switch-handle {
  transform: translateX(18px);
}

/* Fonts Grid */
.fonts-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.font-card-option {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.font-card-option:hover {
  border-color: rgba(16, 185, 129, 0.4);
}

.font-card-option.selected {
  border-color: var(--emerald-main, #10b981);
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.12);
}

.font-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.font-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.font-type-pill {
  font-size: 9.5px;
  background: #0a1c14;
  border: 1px solid #143827;
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 8px;
}

.font-preview-box {
  background: #040a07;
  border: 1px solid #102419;
  border-radius: 6px;
  padding: 10px;
}

.font-sample-text {
  font-size: 12px;
  color: #e5e7eb;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.font-card-footer {
  display: flex;
  justify-content: flex-end;
}

.font-active-label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--emerald-bright, #34d399);
}

.font-select-hint {
  font-size: 10.5px;
  color: #6b7280;
}

/* Font Scale Buttons */
.font-scale-selector {
  display: flex;
  gap: 10px;
}

.scale-btn {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 8px;
  padding: 8px 16px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scale-btn:hover {
  background: #0d1e16;
  color: #fff;
}

.scale-btn.active {
  background: #0d281c;
  border-color: var(--emerald-main, #10b981);
  color: #fff;
}

/* License overview */
.license-overview-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.license-status-card {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.license-status-card.activated {
  border-color: rgba(16, 185, 129, 0.45);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.08);
}

.license-card-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: #05140d;
  border: 1px solid #103624;
  border-radius: 20px;
  align-self: flex-start;
}

.status-glow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.status-badge-text {
  font-size: 11px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  letter-spacing: 0.04em;
}

.license-id-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.license-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.license-id-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.code-fingerprint, .code-license-key {
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: #fff;
  background: #040906;
  border: 1px solid #102419;
  border-radius: 6px;
  padding: 6px 12px;
}

.btn-copy-sm {
  background: #0a1c14;
  border: 1px solid #143827;
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.btn-copy-sm:hover {
  background: #123022;
}

.btn-open-keygen {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #10b981;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  color: #040a07;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.btn-open-keygen:hover {
  background: #34d399;
  box-shadow: 0 0 16px rgba(52, 211, 153, 0.4);
}

/* Experts Grid */
.experts-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expert-card {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expert-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expert-avatar {
  font-size: 18px;
}

.expert-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.expert-role {
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
}

.expert-handle {
  font-size: 11px;
  color: var(--emerald-bright, #34d399);
}

.expert-status {
  font-size: 10.5px;
  color: #10b981;
  font-weight: 600;
}

.expert-mandate {
  font-size: 11.5px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.4;
}

/* Physics Cards */
.physics-options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.physics-card {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.physics-card:hover {
  border-color: rgba(16, 185, 129, 0.3);
}

.physics-card.active {
  background: #0a1f16;
  border-color: var(--emerald-main, #10b981);
}

.physics-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.physics-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
}

.physics-sub {
  font-size: 10.5px;
  color: #9ca3af;
}

/* Search results pane */
.search-results-pane {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.search-header-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #102419;
}

.results-count {
  font-size: 11.5px;
  color: var(--emerald-bright, #34d399);
  font-weight: 700;
}

.empty-search {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-icon {
  font-size: 32px;
}

.search-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-match-card {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.search-match-card:hover {
  border-color: var(--emerald-main, #10b981);
  background: #0b1c15;
  transform: translateX(4px);
}

.search-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-category-pill {
  font-size: 10px;
  font-weight: 700;
  background: #071911;
  border: 1px solid #123826;
  color: var(--emerald-bright, #34d399);
  padding: 2px 8px;
  border-radius: 10px;
}

.jump-arrow {
  font-size: 11px;
  color: #6b7280;
}

.match-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.match-desc {
  font-size: 11.5px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.4;
}

/* ========================================================
   KEYBOARD SHORTCUTS CATEGORY STYLES
   ======================================================== */
.shortcuts-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.filter-input-wrap {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.shortcuts-filter-input {
  width: 100%;
  background: #060e0a;
  border: 1px solid #14281f;
  border-radius: 8px;
  padding: 10px 36px 10px 36px;
  color: #e5e7eb;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.shortcuts-filter-input:focus {
  border-color: var(--emerald-main, #10b981);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
}

.shortcuts-count-pill {
  font-size: 11px;
  font-weight: 700;
  background: #081711;
  border: 1px solid #143526;
  color: var(--emerald-bright, #34d399);
  padding: 6px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

/* Key Recorder Card */
.key-recorder-card {
  background: #091711;
  border: 2px solid var(--emerald-main, #10b981);
  border-radius: 12px;
  padding: 18px 24px;
  margin-bottom: 24px;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.25);
  animation: pulseRecorder 2s infinite ease-in-out;
  outline: none;
}

@keyframes pulseRecorder {
  0% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.2); }
  50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }
  100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.2); }
}

.recorder-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.recorder-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pulse-recording-dot {
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulseDot 1s infinite alternate;
}

@keyframes pulseDot {
  from { opacity: 0.4; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1.15); }
}

.recorder-heading {
  font-size: 14px;
  color: #fff;
}

.recorder-heading strong {
  color: var(--emerald-bright, #34d399);
}

.btn-close-recorder {
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
}

.btn-close-recorder:hover {
  color: #fff;
}

.recorder-prompt-box {
  background: #050b08;
  border: 1px dashed rgba(16, 185, 129, 0.4);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  margin-bottom: 16px;
}

.prompt-text {
  margin: 0;
  font-size: 13.5px;
  color: #9ca3af;
}

.recorded-keys-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.recorded-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
}

.keys-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.live-kbd {
  background: #11281e;
  border: 1px solid var(--emerald-main, #10b981);
  color: #fff;
  font-family: var(--font-mono, monospace);
  font-size: 15px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 6px;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.4);
}

.conflict-alert-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  border-radius: 6px;
  color: #fca5a5;
  font-size: 12px;
  font-weight: 600;
}

.recorder-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  background: #101c16;
  border: 1px solid #233e31;
  color: #9ca3af;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #162a20;
  color: #fff;
}

.btn-save-key {
  background: var(--emerald-main, #10b981);
  border: 1px solid #34d399;
  color: #040c08;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-save-key:hover:not(:disabled) {
  background: #34d399;
  box-shadow: 0 0 15px rgba(52, 211, 153, 0.4);
}

.btn-save-key:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Shortcuts List & Grid */
.shortcuts-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.shortcut-row-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #07100c;
  border: 1px solid #14281f;
  border-radius: 10px;
  padding: 14px 20px;
  transition: all 0.15s ease;
}

.shortcut-row-card:hover {
  border-color: rgba(16, 185, 129, 0.4);
  background: #0a1711;
}

.shortcut-row-card.custom {
  border-left: 3px solid var(--emerald-main, #10b981);
}

.shortcut-row-card.recording {
  border-color: #3b82f6;
  background: #081522;
}

.shortcut-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shortcut-label {
  font-size: 14px;
  font-weight: 700;
  color: #f3f4f6;
}

.badge-custom {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid var(--emerald-main, #10b981);
  color: var(--emerald-bright, #34d399);
  padding: 1px 6px;
  border-radius: 4px;
}

.category-tag-pill {
  font-size: 9.5px;
  text-transform: uppercase;
  color: #6b7280;
  background: #0c1c14;
  padding: 2px 7px;
  border-radius: 4px;
}

.shortcut-desc {
  margin: 0;
  font-size: 12px;
  color: #88929b;
}

.shortcut-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.key-badges-row {
  display: flex;
  gap: 5px;
  align-items: center;
}

.kbd-badge {
  background: #050b08;
  border: 1px solid #1b3528;
  color: #e5e7eb;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 5px;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.4);
}

.btn-record-key {
  background: #0d1e17;
  border: 1px solid #1a3c2d;
  color: var(--emerald-bright, #34d399);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-record-key:hover {
  background: #143224;
  border-color: var(--emerald-main, #10b981);
}

.btn-record-key.recording {
  background: #1e3a8a;
  border-color: #3b82f6;
  color: #fff;
}

.btn-reset-key {
  background: transparent;
  border: 1px solid #233e31;
  color: #6b7280;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
}

.btn-reset-key:hover {
  color: #fff;
  border-color: #4b6357;
}

/* Cheatsheet Card */
.shortcuts-cheatsheet-card {
  background: #060e0a;
  border: 1px solid #14281f;
  border-radius: 12px;
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cheatsheet-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cheatsheet-icon {
  font-size: 24px;
}

.cheatsheet-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.cheatsheet-sub {
  margin: 0;
  font-size: 11.5px;
  color: #6b7280;
}

.cheatsheet-chips {
  display: flex;
  gap: 10px;
}

.chip-item code {
  background: #091711;
  border: 1px solid #143526;
  color: var(--emerald-bright, #34d399);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
}

/* ========================================================
   ABOUT & FOUNDER STORY CATEGORY STYLES
   ======================================================== */
.founder-hero-card {
  position: relative;
  background: linear-gradient(135deg, #07170f 0%, #030805 100%);
  border: 1px solid var(--emerald-main, #10b981);
  border-radius: 14px;
  padding: 28px 32px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.15);
}

.founder-hero-glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%);
  pointer-events: none;
}

.founder-badge-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.founder-flag-badge {
  background: #11281e;
  border: 1px solid var(--emerald-main, #10b981);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
}

.founder-role-badge {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid #1f4f39;
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

.founder-zero-badge {
  background: #081510;
  border: 1px solid #183325;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.founder-profile-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 22px;
}

.founder-avatar-box {
  position: relative;
  width: 64px;
  height: 64px;
  background: #0a2015;
  border: 2px solid var(--emerald-main, #10b981);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
}

.founder-wolf-emoji {
  font-size: 32px;
}

.avatar-pulse-ring {
  position: absolute;
  inset: -4px;
  border: 1px solid var(--emerald-bright, #34d399);
  border-radius: 18px;
  opacity: 0.4;
  animation: pulseAvatar 2s infinite ease-out;
}

@keyframes pulseAvatar {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.15); opacity: 0; }
}

.founder-name {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.founder-handle {
  font-size: 13px;
  color: var(--emerald-bright, #34d399);
  margin: 0 0 8px 0;
  font-weight: 600;
}

.founder-location-pill {
  display: inline-flex;
  background: #08160f;
  border: 1px solid #1a3c2c;
  color: #d1d5db;
  font-size: 11.5px;
  padding: 3px 10px;
  border-radius: 6px;
}

.founder-manifesto-quote {
  margin: 0;
  padding: 16px 20px;
  background: rgba(4, 12, 8, 0.7);
  border-left: 3px solid var(--emerald-bright, #34d399);
  border-radius: 0 8px 8px 0;
  font-style: italic;
  font-size: 13.5px;
  line-height: 1.6;
  color: #e5e7eb;
}

/* Origin Story Grid */
.story-columns-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.story-card {
  background: #07100c;
  border: 1px solid #14281f;
  border-radius: 12px;
  padding: 22px;
}

.story-icon-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.story-icon {
  font-size: 20px;
}

.story-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
}

.story-text {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.story-text:last-child {
  margin-bottom: 0;
}

.story-text strong {
  color: #fff;
}

/* Sovereign Pillars */
.sovereign-pillars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.pillar-card {
  background: #060d09;
  border: 1px solid #12241b;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
}

.pillar-number {
  font-size: 12px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  margin-bottom: 8px;
  font-family: var(--font-mono, monospace);
}

.pillar-heading {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.pillar-sub {
  margin: 0;
  font-size: 11.5px;
  color: #88929b;
  line-height: 1.5;
}

/* Origin Specs Card */
.origin-specs-card {
  background: #060e0a;
  border: 1px solid #14281f;
  border-radius: 12px;
  padding: 22px 26px;
  margin-bottom: 20px;
}

.specs-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.specs-icon {
  font-size: 22px;
}

.specs-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.specs-sub {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.specs-table-grid {
  display: flex;
  flex-direction: column;
  border: 1px solid #11221a;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 18px;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #101d16;
  background: #040906;
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-row:nth-child(even) {
  background: #060d09;
}

.spec-k {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.spec-v {
  font-size: 12px;
  color: #e5e7eb;
  font-weight: 700;
}

.spec-v.highlight {
  color: var(--emerald-bright, #34d399);
}

.spec-v.font-mono {
  font-family: var(--font-mono, monospace);
  background: #0d1e16;
  border: 1px solid #183827;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.specs-footer-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.link-wolfitway {
  color: var(--emerald-bright, #34d399);
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
}

.link-wolfitway:hover {
  text-decoration: underline;
}

.btn-copy-node {
  background: #0e2017;
  border: 1px solid #1f4432;
  color: #e5e7eb;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-node:hover {
  background: #153424;
  border-color: var(--emerald-main, #10b981);
  color: #fff;
}
</style>
