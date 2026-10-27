<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useNotesStore } from "@/stores/useNotesStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { useVaultStore } from "@/stores/useVaultStore";
import { useUiStore } from "@/stores/useUiStore";
import { useLicenseStore } from "@/stores/useLicenseStore";
import { useShortcutsStore, type KeyCombo } from "@/stores/useShortcutsStore";
import { kokoroVoice } from "@/services/voiceGuide";
import { voiceControl } from "@/services/voiceControl";
import WolfIcon, { type IconName } from "@/components/common/WolfIcon.vue";

const notesStore = useNotesStore();
const roadmapStore = useRoadmapStore();
const vaultStore = useVaultStore();
const uiStore = useUiStore();
const licenseStore = useLicenseStore();
const shortcutsStore = useShortcutsStore();

// Navigation Tabs
export type SettingsCategory =
  | "themes"
  | "fonts"
  | "shortcuts"
  | "voice"
  | "export"
  | "license"
  | "performance";

const activeCategory = ref<SettingsCategory>("themes");
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

// Themes State
const currentTheme = ref<string>("amber");
const themesList = [
  { id: "amber", name: "Wolfitway Amber Sovereign", desc: "Signature warm gold & amber on velvet obsidian black", primary: "#f59e0b", bg: "#080603" },
  { id: "light", name: "Wolfitway Solar Light", desc: "Crisp alabaster & warm parchment with burnished amber", primary: "#b45309", bg: "#fcfbfa" },
  { id: "obsidian", name: "Cyber Obsidian", desc: "Emerald neon on deep obsidian black", primary: "#10b981", bg: "#060b09" },
  { id: "cyan", name: "Cyber Neon Cyan", desc: "Vibrant high-contrast cyan on dark navy slate", primary: "#06b6d4", bg: "#030a0e" },
  { id: "sapphire", name: "Midnight Sapphire", desc: "Deep indigo and violet on midnight stealth", primary: "#818cf8", bg: "#050612" },
  { id: "crimson", name: "Crimson Terminal", desc: "Aggressive blood cyber-red on dark carbon", primary: "#f87171", bg: "#0e0404" },
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
  const savedScale = localStorage.getItem("wolf_font_scale") || "14";
  fontScale.value = savedScale;
  const numericScale = Number(savedScale) || 14;
  const ratio = (numericScale / 14).toFixed(4);
  document.documentElement.style.fontSize = `${numericScale}px`;
  document.documentElement.style.setProperty("--base-font-size", `${numericScale}px`);
  document.documentElement.style.setProperty("--font-scale-ratio", ratio);
  document.documentElement.style.zoom = "";

  // Load glow & glass
  const savedGlow = localStorage.getItem("wolf_glow");
  if (savedGlow !== null) {
    glowEffects.value = savedGlow !== "false";
    document.documentElement.classList.toggle("no-glow", !glowEffects.value);
  }

  const savedGlass = localStorage.getItem("wolf_glass");
  if (savedGlass !== null) {
    glassmorphism.value = savedGlass !== "false";
    document.documentElement.classList.toggle("no-glass", !glassmorphism.value);
  }

  const savedSpeed = localStorage.getItem("wolf_reorder_speed") || "smooth";
  applyReorderSpeed(savedSpeed);
});

function applyTheme(themeId: string) {
  currentTheme.value = themeId;
  localStorage.setItem("wolf_theme", themeId);
  document.documentElement.dataset.theme = themeId;
}

function applyFont(fontId: string) {
  currentFont.value = fontId;
  localStorage.setItem("wolf_font", fontId);
  document.documentElement.dataset.font = fontId;
}

function changeFontScale(size: string, notify = true) {
  fontScale.value = size;
  localStorage.setItem("wolf_font_scale", size);
  const numericScale = Number(size) || 14;
  const ratio = (numericScale / 14).toFixed(4);
  document.documentElement.style.fontSize = `${numericScale}px`;
  document.documentElement.style.setProperty("--base-font-size", `${numericScale}px`);
  document.documentElement.style.setProperty("--font-scale-ratio", ratio);
  document.documentElement.style.zoom = "";
  if (notify) {
    uiStore.showToast(`Display & font scale set to ${size}px ✓`);
  }
}

function toggleGlow() {
  glowEffects.value = !glowEffects.value;
  localStorage.setItem("wolf_glow", String(glowEffects.value));
  document.documentElement.classList.toggle("no-glow", !glowEffects.value);
  uiStore.showToast(glowEffects.value ? "Neon glow effects enabled" : "Neon glow effects dimmed");
}

function toggleGlass() {
  glassmorphism.value = !glassmorphism.value;
  localStorage.setItem("wolf_glass", String(glassmorphism.value));
  document.documentElement.classList.toggle("no-glass", !glassmorphism.value);
  uiStore.showToast(glassmorphism.value ? "Backdrop blur enabled" : "Backdrop blur disabled");
}

function applyReorderSpeed(speed: string) {
  reorderSpeed.value = speed;
  localStorage.setItem("wolf_reorder_speed", speed);
  let transitionVal = "transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease";
  if (speed === "fast") {
    transitionVal = "transform 0.15s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.15s ease";
  } else if (speed === "cinematic") {
    transitionVal = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.3s ease";
  }
  document.documentElement.style.setProperty("--drag-transition", transitionVal);
}

// Wolfitway Connection Handlers

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
  const isUnbranded = licenseStore.isPaid;
  let md = isUnbranded
    ? `# 🐺 Workspace Export\nGenerated: ${new Date().toISOString()}\nLicense: ${licenseStore.tierLabel} (${licenseStore.companyName || 'Commercial License'})\n\n---\n\n`
    : `# 🐺 Wolf Timeline Vault Export\nGenerated: ${new Date().toISOString()}\nSovereign Guarantee: 100% Offline-First Zero-Telemetry • Wolf Community Solo Free Tier\n\n---\n\n`;

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

  if (!isUnbranded) {
    md += `\n---\n_Exported with Wolf Timeline (Free Solo Personal Edition). Upgrade to Commercial Solo or Team for White-Label unbranded exports._\n`;
  }

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wolf_timeline_${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  uiStore.showToast(isUnbranded ? "White-Label Timeline Markdown exported ✓" : "Timeline Markdown exported ✓");
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

// Categories definitions for sidebar
export interface SettingsCategoryItem {
  id: SettingsCategory;
  label: string;
  icon: IconName;
  count: string | number;
}

const categories = computed<SettingsCategoryItem[]>(() => [
  { id: "themes", label: "Appearance & Themes", icon: "palette", count: themesList.length },
  { id: "fonts", label: "Typography & Fonts", icon: "font", count: fontsList.length },
  { id: "shortcuts", label: "Keyboard Shortcuts", icon: "keyboard", count: shortcutsStore.shortcuts.length },
  { id: "voice", label: "Kokoro Voice & Audio", icon: "voice", count: "ACTIVE" },
  { id: "export", label: "Data Export & Backup", icon: "export", count: 4 },
  { id: "license", label: "Hardware & Licensing", icon: "key", count: licenseStore.isActivated ? "ACTIVE" : "FREE" },
  { id: "performance", label: "Reordering & Physics", icon: "sliders", count: "SMOOTH" },
]);

// Filtered categories based on search
const filteredCategories = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return categories.value;
  return categories.value.filter((cat) => {
    if (cat.label.toLowerCase().includes(q)) return true;
    if (cat.id === "shortcuts" && ("shortcuts keybindings hotkeys keys command".includes(q) || shortcutsStore.shortcuts.some((s) => s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)))) return true;
    if (cat.id === "export" && ("json markdown csv backup restore export import".includes(q))) return true;
    if (cat.id === "themes" && themesList.some((t) => t.name.toLowerCase().includes(q))) return true;
    if (cat.id === "fonts" && fontsList.some((f) => f.name.toLowerCase().includes(q))) return true;
    if (cat.id === "voice" && ("voice audio sound kokoro chime speech speech synthesis speech control".includes(q))) return true;
    if (cat.id === "license" && ("license tier hardware fingerprint machine cryptographic free pro".includes(q))) return true;
    if (cat.id === "performance" && ("performance reordering physics animation speed drag haptic".includes(q))) return true;
    return false;
  });
});

// Search results items
const isSearching = computed(() => searchQuery.value.trim().length > 0);

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return [];
  const results: Array<{ categoryId: SettingsCategory; categoryLabel: string; title: string; desc: string }> = [];

  // 1. Themes
  themesList.forEach((t) => {
    if (t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || "themes appearance color".includes(q)) {
      results.push({ categoryId: "themes", categoryLabel: "Appearance & Themes", title: t.name, desc: t.desc });
    }
  });

  // 2. Fonts
  fontsList.forEach((f) => {
    if (f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q) || "typography font monospace ligatures".includes(q)) {
      results.push({ categoryId: "fonts", categoryLabel: "Typography & Fonts", title: f.name, desc: f.type });
    }
  });

  // 3. Shortcuts
  shortcutsStore.shortcuts.forEach((s) => {
    if (s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || shortcutsStore.formatShortcut(s.id).toLowerCase().includes(q) || "shortcuts keybindings keys".includes(q)) {
      results.push({ categoryId: "shortcuts", categoryLabel: "Keyboard Shortcuts", title: `${s.label} (${shortcutsStore.formatShortcut(s.id)})`, desc: s.desc });
    }
  });

  // 4. Voice
  if ("voice audio sound kokoro chime speech speech synthesis mic".includes(q)) {
    results.push({ categoryId: "voice", categoryLabel: "Kokoro Voice & Audio", title: "Kokoro Voice & Spoken Chimes", desc: "Procedural audio companion guidance and hands-free voice commands." });
  }

  // 5. Export
  if ("export json markdown csv backup data restore import".includes(q)) {
    results.push({ categoryId: "export", categoryLabel: "Data Export & Backup", title: "JSON & Markdown Vault Export", desc: "Download zero-telemetry offline database backups and import browser bookmarks." });
  }

  // 6. License
  if ("license hardware fingerprint machine tier pro community keygen".includes(q)) {
    results.push({ categoryId: "license", categoryLabel: "Hardware & Licensing", title: "Hardware Cryptography & Tier", desc: "Local hardware fingerprint derivation and node activation." });
  }

  // 7. Performance
  if ("performance physics drag speed animation haptics smooth".includes(q)) {
    results.push({ categoryId: "performance", categoryLabel: "Reordering & Physics", title: "Reordering Velocity & Physics", desc: "Adjust drag-and-drop animation curves and tactile haptics." });
  }

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
          <WolfIcon name="settings" :size="18" class="settings-gear-icon" />
          <h2 class="sidebar-title">Settings &amp; Vault</h2>
        </div>
        <p class="sidebar-sub">Sovereign workspace configuration</p>

        <!-- Search Input -->
        <div class="settings-search-box">
          <WolfIcon name="search" :size="13" class="search-icon" />
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
          <WolfIcon :name="cat.icon" :size="15" class="nav-item-icon" />
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
          <WolfIcon name="search" :size="28" class="empty-icon" />
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

      <!-- Section: Keyboard Shortcuts -->
      <div v-else-if="activeCategory === 'shortcuts'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title"><WolfIcon name="keyboard" :size="18" /> Keyboard Shortcuts &amp; Ergonomics</h3>
            <p class="pane-desc">Customize global application hotkeys, resolve key conflicts, and tailor your sovereign deep-work flow.</p>
          </div>
          <div class="header-action-group">
            <button type="button" class="btn-secondary-action" @click="resetAllShortcuts">
              <WolfIcon name="reset" :size="12" /> <span>Reset All Defaults</span>
            </button>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="shortcuts-filter-bar">
          <div class="filter-input-wrap">
            <WolfIcon name="search" :size="13" class="filter-icon" />
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
              <WolfIcon name="keyboard" :size="14" /> Press your desired key combination on your keyboard (e.g. <kbd>{{ shortcutsStore.isMac ? '⌘' : 'Ctrl' }}</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>)
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
              <WolfIcon name="alert" :size="14" class="alert-icon" />
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
                <WolfIcon :name="recordingActionId === item.id ? 'clock' : 'write'" :size="11" /> <span>{{ recordingActionId === item.id ? 'Recording...' : 'Edit' }}</span>
              </button>

              <button
                v-if="item.isCustom"
                type="button"
                class="btn-reset-key"
                title="Reset to factory default"
                @click="resetShortcutToDefault(item.id)"
              >
                <WolfIcon name="reset" :size="11" />
              </button>
            </div>
          </div>
        </div>

        <!-- Cheatsheet & Sovereign Keyboard Overview -->
        <div class="shortcuts-cheatsheet-card">
          <div class="cheatsheet-header">
            <WolfIcon name="wolf" :size="20" class="cheatsheet-icon" />
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
            <h3 class="pane-title"><WolfIcon name="export" :size="18" /> Sovereign Data Backup &amp; Portability</h3>
            <p class="pane-desc">Download encrypted JSON archives, Markdown documents, or tabular CSV sheets.</p>
          </div>
        </div>

        <div class="export-cards-grid">
          <div class="export-feature-card">
            <div class="export-icon-box"><WolfIcon name="file-text" :size="22" /></div>
            <div class="export-card-body">
              <h4 class="export-item-title">Wolfitway JSON Vault</h4>
              <p class="export-item-desc">Complete sovereign database snapshot containing all projects, timeline milestones, AI explorations, and roadmap phases.</p>
              <div class="export-actions">
                <button type="button" class="btn-primary-export" @click="exportJson">
                  <WolfIcon name="download" :size="13" /> <span>Download JSON Vault</span>
                </button>
              </div>
            </div>
          </div>

          <div class="export-feature-card">
            <div class="export-icon-box"><WolfIcon name="markdown" :size="22" /></div>
            <div class="export-card-body">
              <h4 class="export-item-title">Markdown Timeline Document</h4>
              <p class="export-item-desc">GitHub-flavored markdown document perfect for publishing to static sites, documentation wikis, or Git commit logs.</p>
              <div class="export-actions">
                <button type="button" class="btn-primary-export" @click="exportMarkdown">
                  <WolfIcon name="download" :size="13" /> <span>Download .md Document</span>
                </button>
              </div>
            </div>
          </div>

          <div class="export-feature-card">
            <div class="export-icon-box"><WolfIcon name="table" :size="22" /></div>
            <div class="export-card-body">
              <h4 class="export-item-title">CSV Project Matrix Sheet</h4>
              <p class="export-item-desc">Structured tabular spreadsheet with all project statuses, event counts, tags, and timestamps for Excel or Google Sheets.</p>
              <div class="export-actions">
                <button type="button" class="btn-primary-export" @click="exportCsv">
                  <WolfIcon name="download" :size="13" /> <span>Download CSV Matrix</span>
                </button>
              </div>
            </div>
          </div>

          <div class="export-feature-card">
            <div class="export-icon-box"><WolfIcon name="bookmarks" :size="22" /></div>
            <div class="export-card-body">
              <h4 class="export-item-title">Import Browser Bookmarks (Chrome / Firefox / Safari)</h4>
              <p class="export-item-desc">Import bookmarks from any browser export (.html). Extracted into verified offline web research resources with tag clustering and zero cloud tracking.</p>
              <div class="export-actions">
                <button type="button" class="btn-primary-export" @click="uiStore.showBookmarkImporter = true">
                  <WolfIcon name="import" :size="13" /> <span>Launch Bookmark Importer</span>
                </button>
              </div>
            </div>
          </div>

          <div class="export-feature-card">
            <div class="export-icon-box"><WolfIcon name="reset" :size="22" /></div>
            <div class="export-card-body">
              <h4 class="export-item-title">Restore / Import Vault</h4>
              <p class="export-item-desc">Load a previously exported Wolfitway JSON file into your local node database without losing offline sovereignty.</p>
              <div class="export-actions">
                <button type="button" class="btn-secondary-action" @click="triggerImportFile">
                  <WolfIcon name="folder" :size="13" /> <span>Select JSON Backup File</span>
                </button>
              </div>
            </div>
          </div>

          <div class="export-feature-card danger-feature-card">
            <div class="export-icon-box"><WolfIcon name="alert" :size="22" /></div>
            <div class="export-card-body">
              <h4 class="export-item-title">Reload Sample Default Workspace</h4>
              <p class="export-item-desc">Revert the active workspace to default sovereign sample projects, roadmap phases, and timeline logs.</p>
              <div class="export-actions">
                <button type="button" class="btn-danger-action" @click="handleResetWorkspace">
                  <WolfIcon name="reset" :size="13" /> <span>Reload Sovereign Defaults</span>
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
            <h3 class="pane-title"><WolfIcon name="palette" :size="18" /> Appearance &amp; Cyber Themes</h3>
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
                <WolfIcon name="sparkles" :size="16" class="toggle-icon" />
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
                <WolfIcon name="shield" :size="16" class="toggle-icon" />
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
            <h3 class="pane-title"><WolfIcon name="font" :size="18" /> Typography &amp; Editor Fonts</h3>
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
          <div class="subgroup-header-row">
            <h4 class="subgroup-title">Display &amp; Font Scaling (Power Users)</h4>
            <span class="active-scale-pill">{{ fontScale }}px Active</span>
          </div>
          <div class="font-scale-slider-wrap">
            <input
              type="range"
              min="11"
              max="20"
              step="1"
              :value="fontScale"
              class="scale-range-slider"
              @input="(e) => changeFontScale((e.target as HTMLInputElement).value, false)"
              @change="(e) => changeFontScale((e.target as HTMLInputElement).value, true)"
            />
            <div class="scale-ticks-row">
              <span class="scale-tick">11px (Micro)</span>
              <span class="scale-tick">14px (Standard)</span>
              <span class="scale-tick">16px (Dense Power)</span>
              <span class="scale-tick">20px (Ultra Large)</span>
            </div>
          </div>
          <div class="font-scale-selector">
            <button
              type="button"
              class="scale-btn"
              :class="{ active: fontScale === '12' }"
              @click="changeFontScale('12')"
            >
              Dense (12px)
            </button>
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
            <button
              type="button"
              class="scale-btn"
              :class="{ active: fontScale === '16' }"
              @click="changeFontScale('16')"
            >
              Large (16px)
            </button>
            <button
              type="button"
              class="scale-btn"
              :class="{ active: fontScale === '18' }"
              @click="changeFontScale('18')"
            >
              Executive (18px)
            </button>
          </div>
        </div>
      </div>

      <!-- Section: Kokoro Voice Heart & Voice Control -->
      <div v-else-if="activeCategory === 'voice'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title"><WolfIcon name="voice" :size="18" /> Kokoro Voice Heart &amp; Voice Control Engine</h3>
            <p class="pane-desc">Audio companion guidance, procedural heart chimes, and hands-free voice command system.</p>
          </div>
          <button type="button" class="btn-primary-export" @click="uiStore.showVoiceGuideModal = true">
            <WolfIcon name="settings" :size="13" /> <span>Open Voice Companion Studio</span>
          </button>
        </div>

        <div class="voice-settings-cards-grid">
          <!-- Kokoro Status Card -->
          <div class="voice-feature-card">
            <div class="voice-card-top">
              <div class="voice-avatar-mini"><WolfIcon name="voice" :size="20" /></div>
              <div>
                <h4 class="voice-card-title">Kokoro Voice Heart Presence</h4>
                <p class="voice-card-sub">Warm spoken confirmations, focus encouragement, and milestone celebrations</p>
              </div>
            </div>
            <div class="voice-card-actions">
              <button
                type="button"
                class="btn-secondary-action"
                @click="() => { kokoroVoice.playHeartChime('affirm'); kokoroVoice.speak('Kokoro Voice Heart online.'); }"
              >
                <WolfIcon name="volume" :size="13" /> <span>Test Voice Audio</span>
              </button>
              <button
                type="button"
                class="btn-primary-export"
                @click="uiStore.showVoiceGuideModal = true"
              >
                Configure Voice &amp; Pitch
              </button>
            </div>
          </div>

          <!-- Hands-Free Voice Commands Card -->
          <div class="voice-feature-card">
            <div class="voice-card-top">
              <div class="voice-avatar-mini mic"><WolfIcon name="mic" :size="20" /></div>
              <div>
                <h4 class="voice-card-title">Supported Hands-Free Voice Commands</h4>
                <p class="voice-card-sub">Speak naturally while writing or ideating to command your workspace</p>
              </div>
            </div>
            <div class="voice-commands-list">
              <div class="voice-cmd-row">
                <span class="cmd-phrase">"go to timeline" / "open timeline"</span>
                <span class="cmd-action">&rarr; Switch to Timeline Chronology</span>
              </div>
              <div class="voice-cmd-row">
                <span class="cmd-phrase">"go to studio" / "open studio"</span>
                <span class="cmd-action">&rarr; Switch to Studio Deep-Focus Writer</span>
              </div>
              <div class="voice-cmd-row">
                <span class="cmd-phrase">"go to roadmap" / "open roadmap"</span>
                <span class="cmd-action">&rarr; Switch to Roadmap Phases</span>
              </div>
              <div class="voice-cmd-row">
                <span class="cmd-phrase">"open vault" / "lock vault"</span>
                <span class="cmd-action">&rarr; View Credentials / Emergency Lock</span>
              </div>
              <div class="voice-cmd-row">
                <span class="cmd-phrase">"quick capture"</span>
                <span class="cmd-action">&rarr; Open Instant Quick Capture Modal</span>
              </div>
              <div class="voice-cmd-row">
                <span class="cmd-phrase">"import bookmarks"</span>
                <span class="cmd-action">&rarr; Launch Browser Bookmarks Importer</span>
              </div>
              <div class="voice-cmd-row">
                <span class="cmd-phrase">"new note"</span>
                <span class="cmd-action">&rarr; Create New Note &amp; Jump to Studio</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Hardware & Licensing -->
      <div v-else-if="activeCategory === 'license'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title"><WolfIcon name="key" :size="18" /> Hardware Cryptography &amp; Sovereign Licensing</h3>
            <p class="pane-desc">Dual-use licensing engine: 100% Free for solo personal projects; paid licenses for commercial &amp; multi-seat teams.</p>
          </div>
          <button type="button" class="btn-primary-export" @click="uiStore.showLicenseModal = true">
            <WolfIcon name="zap" :size="13" /> <span>Switch Tier or Enter Key</span>
          </button>
        </div>

        <div class="license-overview-grid">
          <div class="license-status-card" :class="{ activated: licenseStore.isPaid, team: licenseStore.isTeam }">
            <div class="license-card-badge">
              <span class="status-glow-dot" :class="{ 'team-glow': licenseStore.isTeam, 'comm-glow': licenseStore.isCommercialSolo }"></span>
              <span class="status-badge-text">{{ licenseStore.tierLabel.toUpperCase() }}</span>
            </div>

            <div class="license-id-group">
              <span class="license-label">Machine Hardware Fingerprint</span>
              <div class="license-id-row">
                <code class="code-fingerprint">{{ licenseStore.deviceId }}</code>
                <button type="button" class="btn-copy-sm" @click="copyDeviceId">Copy</button>
              </div>
            </div>

            <div class="license-id-group" v-if="licenseStore.isPaid">
              <span class="license-label">Active Cryptographic Key</span>
              <code class="code-license-key">{{ licenseStore.licenseKey }}</code>
            </div>

            <div class="license-id-group" v-if="licenseStore.seats > 1">
              <span class="license-label">Multi-Seat Allocation</span>
              <span class="license-val-text">{{ licenseStore.seats }} Team Seats • Sovereign Mesh Relay</span>
            </div>

            <div class="license-features-summary">
              <span class="license-label">Active Entitlements:</span>
              <ul class="features-list">
                <li v-for="(feat, idx) in licenseStore.features" :key="idx">
                  ✓ {{ feat }}
                </li>
              </ul>
            </div>

            <div class="license-actions-row">
              <button
                type="button"
                class="btn-open-keygen"
                @click="uiStore.showLicenseModal = true"
              >
                <WolfIcon name="key" :size="13" /> <span>Manage Tier &amp; Licenses</span>
              </button>
              <button
                v-if="licenseStore.isPaid"
                type="button"
                class="btn-secondary-action"
                @click="uiStore.showToast('Compliance Certificate generated & verified offline ✓')"
              >
                <WolfIcon name="shield-check" :size="13" /> <span>Export Compliance Certificate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Performance & Reordering -->
      <div v-else-if="activeCategory === 'performance'" class="category-pane">
        <div class="pane-header">
          <div>
            <h3 class="pane-title"><WolfIcon name="sliders" :size="18" /> Smooth Reordering &amp; Drag Physics</h3>
            <p class="pane-desc">Fine-tune animations, drag elevation physics, and canvas reactivity.</p>
          </div>
        </div>

        <div class="settings-subgroup">
          <h4 class="subgroup-title">Drag &amp; Drop Animation Velocity</h4>
          <div class="physics-options-grid">
            <div
              class="physics-card"
              :class="{ active: reorderSpeed === 'fast' }"
              @click="applyReorderSpeed('fast'); uiStore.showToast('Reorder animation set to Ultra Fast 150ms ✓')"
            >
              <WolfIcon name="zap" :size="18" class="physics-icon" />
              <span class="physics-name">Ultra Fast</span>
              <span class="physics-sub">150ms cubic-bezier transition</span>
            </div>

            <div
              class="physics-card"
              :class="{ active: reorderSpeed === 'smooth' }"
              @click="applyReorderSpeed('smooth'); uiStore.showToast('Reorder animation set to Smooth Silk 220ms ✓')"
            >
              <WolfIcon name="sliders" :size="18" class="physics-icon" />
              <span class="physics-name">Smooth Silk</span>
              <span class="physics-sub">220ms organic easing with elevation</span>
            </div>

            <div
              class="physics-card"
              :class="{ active: reorderSpeed === 'cinematic' }"
              @click="applyReorderSpeed('cinematic'); uiStore.showToast('Reorder animation set to Cinematic 350ms ✓')"
            >
              <WolfIcon name="clock" :size="18" class="physics-icon" />
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
                <WolfIcon name="check-square" :size="16" class="toggle-icon" />
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
  height: 100%;
  max-height: 100%;
  background: var(--bg-body, #040c08);
  overflow: hidden;
}

/* Master Sidebar */
.settings-sidebar {
  width: 280px;
  min-width: 280px;
  background: var(--bg-card, #060e0a);
  border-right: 1px solid var(--border-card, #14281f);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 20px 18px 14px;
  border-bottom: 1px solid var(--border-subtle, #102419);
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
  color: var(--text-white, #fff);
  letter-spacing: -0.01em;
  margin: 0;
}

.sidebar-sub {
  font-size: 11px;
  color: var(--text-muted, #6b7280);
  margin: 0;
}

/* Search Box */
.settings-search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-inner, #030805);
  border: 1px solid var(--border-subtle, #14281f);
  border-radius: 8px;
  padding: 6px 10px;
  margin-top: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.settings-search-box:focus-within {
  border-color: var(--emerald-main, #10b981);
  box-shadow: 0 0 8px var(--border-glow, rgba(16, 185, 129, 0.2));
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
  color: var(--text-white, #fff);
  font-family: inherit;
}

.settings-search-input::placeholder {
  color: var(--text-dim, #4b5563);
}

.btn-clear-search {
  background: transparent;
  border: none;
  color: var(--text-muted, #6b7280);
  font-size: 10px;
  cursor: pointer;
  padding: 0 2px;
}

.btn-clear-search:hover {
  color: var(--text-white, #fff);
}

/* Nav items */
.settings-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
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
  color: var(--text-secondary, #9ca3af);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.nav-item-btn:hover {
  background: var(--bg-card-hover, #0a1711);
  color: var(--text-primary, #e5e7eb);
}

.nav-item-btn.active {
  background: var(--emerald-pill-bg, #0d2419);
  border-color: var(--emerald-main, rgba(16, 185, 129, 0.4));
  color: var(--text-white, #fff);
  box-shadow: 0 0 12px var(--border-glow, rgba(16, 185, 129, 0.1));
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
  background: var(--emerald-pill-bg, #06150e);
  border: 1px solid var(--emerald-pill-border, #142c20);
  border-radius: 10px;
  color: var(--emerald-bright, #34d399);
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 12px 14px;
  border-top: 1px solid var(--border-subtle, #102419);
}

.node-badge-card {
  background: var(--bg-inner, #040a07);
  border: 1px solid var(--border-card, #14281f);
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
  background: var(--emerald-main, #10b981);
  box-shadow: 0 0 6px var(--emerald-main, #10b981);
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
  color: var(--text-muted, #6b7280);
}

/* Main Detail Pane */
.settings-main-pane {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 30px 40px 80px 40px;
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
  border-bottom: 1px solid var(--border-subtle, #102419);
}

.pane-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-white, #fff);
  margin: 0 0 4px;
}

.pane-desc {
  font-size: 12px;
  color: var(--text-secondary, #9ca3af);
  margin: 0;
}

/* Connections Grid */
.connections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.connection-card {
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.connection-card:hover {
  border-color: var(--border-glow, #1a3c2c);
}

.connection-card.active {
  border-color: var(--emerald-main, rgba(16, 185, 129, 0.45));
  box-shadow: 0 0 14px var(--border-glow, rgba(16, 185, 129, 0.08));
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
  color: var(--text-white, #fff);
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
  color: var(--text-secondary, #9ca3af);
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
  background: var(--emerald-main, #10b981);
  box-shadow: 0 0 6px var(--emerald-main, #10b981);
}

.dot-gray {
  background: var(--text-muted, #6b7280);
}

.conn-desc {
  font-size: 11.5px;
  color: var(--text-secondary, #9ca3af);
  line-height: 1.4;
  margin: 0;
}

.conn-action-row {
  display: flex;
  gap: 8px;
}

.conn-token-input {
  flex: 1;
  background: var(--bg-inner, #050b08);
  border: 1px solid var(--border-subtle, #142820);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-white, #fff);
  font-size: 11px;
  outline: none;
}

.btn-conn-toggle {
  background: var(--emerald-pill-bg, #10241b);
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.3));
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-conn-toggle:hover {
  background: var(--bg-card-hover, #163627);
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
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 12px;
  padding: 18px;
  align-items: center;
  transition: border-color 0.2s ease;
}

.export-feature-card:hover {
  border-color: var(--border-glow, rgba(16, 185, 129, 0.3));
}

.export-icon-box {
  font-size: 26px;
  width: 48px;
  height: 48px;
  background: var(--bg-inner, #040a07);
  border: 1px solid var(--border-subtle, #14281f);
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
  color: var(--text-white, #fff);
  margin: 0;
}

.export-item-desc {
  font-size: 11.5px;
  color: var(--text-secondary, #9ca3af);
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
  background: var(--emerald-pill-bg, #0d281c);
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.4));
  border-radius: 6px;
  padding: 7px 14px;
  color: var(--emerald-bright, #34d399);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary-export:hover {
  background: var(--bg-card-hover, #143d2b);
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.2));
}

.btn-secondary-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-inner, #0b1812);
  border: 1px solid var(--border-card, #1a382b);
  border-radius: 6px;
  padding: 7px 14px;
  color: var(--text-primary, #d1d5db);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary-action:hover {
  background: var(--bg-card-hover, #12241c);
  color: var(--text-white, #fff);
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
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-card-option:hover {
  border-color: var(--border-glow, rgba(16, 185, 129, 0.4));
  transform: translateY(-2px);
}

.theme-card-option.selected {
  border-color: var(--emerald-main, #10b981);
  box-shadow: 0 0 16px var(--border-glow, rgba(16, 185, 129, 0.15));
}

.theme-color-preview {
  height: 60px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle, #102419);
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
  color: var(--text-white, #fff);
  margin: 0 0 4px;
}

.theme-desc {
  font-size: 11px;
  color: var(--text-secondary, #9ca3af);
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
  color: var(--text-primary, #e5e7eb);
  margin: 0;
}

.effects-row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.toggle-card {
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.toggle-card:hover {
  border-color: var(--border-glow, rgba(16, 185, 129, 0.3));
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
  color: var(--text-white, #fff);
}

.toggle-sub {
  display: block;
  font-size: 10.5px;
  color: var(--text-secondary, #9ca3af);
}

/* Custom Switch */
.custom-switch {
  width: 38px;
  height: 20px;
  background: var(--border-card, #14281f);
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
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.font-card-option:hover {
  border-color: var(--border-glow, rgba(16, 185, 129, 0.4));
}

.font-card-option.selected {
  border-color: var(--emerald-main, #10b981);
  box-shadow: 0 0 16px var(--border-glow, rgba(16, 185, 129, 0.12));
}

.font-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.font-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-white, #fff);
}

.font-type-pill {
  font-size: 9.5px;
  background: var(--emerald-pill-bg, #0a1c14);
  border: 1px solid var(--emerald-pill-border, #143827);
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 8px;
}

.font-preview-box {
  background: var(--bg-inner, #040a07);
  border: 1px solid var(--border-subtle, #102419);
  border-radius: 6px;
  padding: 10px;
}

.font-sample-text {
  font-size: 12px;
  color: var(--text-primary, #e5e7eb);
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
  color: var(--text-muted, #6b7280);
}

.subgroup-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.active-scale-pill {
  background: var(--emerald-pill-bg, #092017);
  border: 1px solid var(--emerald-pill-border, #143d2a);
  color: var(--emerald-bright, #34d399);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  font-family: var(--font-mono);
}

.font-scale-slider-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-inner, #06110c);
  border: 1px solid var(--border-card, #10261b);
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 12px;
}

.scale-range-slider {
  width: 100%;
  accent-color: var(--emerald-main, #10b981);
  cursor: pointer;
}

.scale-ticks-row {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: var(--text-dim, #64748b);
  font-family: var(--font-mono);
}

/* Font Scale Buttons */
.font-scale-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.scale-btn {
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 8px;
  padding: 8px 16px;
  color: var(--text-secondary, #9ca3af);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scale-btn:hover {
  background: var(--bg-card-hover, #0d1e16);
  color: var(--text-white, #fff);
}

.scale-btn.active {
  background: var(--emerald-pill-bg, #0d281c);
  border-color: var(--emerald-main, #10b981);
  color: var(--text-white, #fff);
}

/* Voice Settings */
.voice-settings-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.voice-feature-card {
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.voice-card-top {
  display: flex;
  align-items: center;
  gap: 14px;
}

.voice-avatar-mini {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--bg-inner, #190d14);
  border: 1px solid var(--border-card, #3d1c2b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.voice-avatar-mini.mic {
  background: var(--emerald-pill-bg, #081a12);
  border-color: var(--emerald-pill-border, #123d29);
}

.voice-card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-white, #fff);
  margin: 0;
}

.voice-card-sub {
  font-size: 12px;
  color: var(--text-secondary, #94a3b8);
  margin: 3px 0 0;
}

.voice-card-actions {
  display: flex;
  gap: 10px;
}

.voice-commands-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-inner, #050d09);
  border: 1px solid var(--border-subtle, #0d2116);
  border-radius: 8px;
  padding: 12px 16px;
}

.voice-cmd-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.cmd-phrase {
  font-family: var(--font-mono);
  color: var(--emerald-bright, #34d399);
  font-weight: 600;
}

.cmd-action {
  color: var(--text-secondary, #94a3b8);
}

/* License overview */
.license-overview-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.license-status-card {
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.license-status-card.activated {
  border-color: var(--emerald-main, rgba(16, 185, 129, 0.45));
  box-shadow: 0 0 20px var(--border-glow, rgba(16, 185, 129, 0.08));
}

.license-card-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: var(--emerald-pill-bg, #05140d);
  border: 1px solid var(--emerald-pill-border, #103624);
  border-radius: 20px;
  align-self: flex-start;
}

.status-glow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--emerald-main, #10b981);
  box-shadow: 0 0 8px var(--emerald-main, #10b981);
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
  color: var(--text-secondary, #9ca3af);
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
  color: var(--text-white, #fff);
  background: var(--bg-inner, #040906);
  border: 1px solid var(--border-card, #102419);
  border-radius: 6px;
  padding: 6px 12px;
}

.btn-copy-sm {
  background: var(--emerald-pill-bg, #0a1c14);
  border: 1px solid var(--emerald-pill-border, #143827);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.btn-copy-sm:hover {
  background: var(--bg-card-hover, #123022);
}

.btn-open-keygen {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--emerald-main, #10b981);
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  color: var(--bg-canvas, #040a07);
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.btn-open-keygen:hover {
  background: var(--emerald-bright, #34d399);
  box-shadow: 0 0 16px var(--border-glow, rgba(52, 211, 153, 0.4));
}

/* Experts Grid */
.experts-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expert-card {
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
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
  color: var(--text-white, #fff);
}

.expert-handle {
  font-size: 11px;
  color: var(--emerald-bright, #34d399);
}

.expert-status {
  font-size: 10.5px;
  color: var(--emerald-main, #10b981);
  font-weight: 600;
}

.expert-mandate {
  font-size: 11.5px;
  color: var(--text-secondary, #9ca3af);
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
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.physics-card:hover {
  border-color: var(--border-glow, rgba(16, 185, 129, 0.3));
}

.physics-card.active {
  background: var(--emerald-pill-bg, #0a1f16);
  border-color: var(--emerald-main, #10b981);
}

.physics-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.physics-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-white, #fff);
}

.physics-sub {
  font-size: 10.5px;
  color: var(--text-secondary, #9ca3af);
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
  border-bottom: 1px solid var(--border-subtle, #102419);
}

.results-count {
  font-size: 11.5px;
  color: var(--emerald-bright, #34d399);
  font-weight: 700;
}

.empty-search {
  text-align: center;
  padding: 40px;
  color: var(--text-muted, #6b7280);
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
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
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
  background: var(--bg-card-hover, #0b1c15);
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
  background: var(--emerald-pill-bg, #071911);
  border: 1px solid var(--emerald-pill-border, #123826);
  color: var(--emerald-bright, #34d399);
  padding: 2px 8px;
  border-radius: 10px;
}

.jump-arrow {
  font-size: 11px;
  color: var(--text-muted, #6b7280);
}

.match-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-white, #fff);
  margin: 0;
}

.match-desc {
  font-size: 11.5px;
  color: var(--text-secondary, #9ca3af);
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
  background: var(--bg-inner, #060e0a);
  border: 1px solid var(--border-subtle, #14281f);
  border-radius: 8px;
  padding: 10px 36px 10px 36px;
  color: var(--text-primary, #e5e7eb);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.shortcuts-filter-input:focus {
  border-color: var(--emerald-main, #10b981);
  box-shadow: 0 0 12px var(--border-glow, rgba(16, 185, 129, 0.2));
}

.shortcuts-count-pill {
  font-size: 11px;
  font-weight: 700;
  background: var(--emerald-pill-bg, #081711);
  border: 1px solid var(--emerald-pill-border, #143526);
  color: var(--emerald-bright, #34d399);
  padding: 6px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

/* Key Recorder Card */
.key-recorder-card {
  background: var(--bg-card, #091711);
  border: 2px solid var(--emerald-main, #10b981);
  border-radius: 12px;
  padding: 18px 24px;
  margin-bottom: 24px;
  box-shadow: 0 0 25px var(--border-glow, rgba(16, 185, 129, 0.25));
  animation: pulseRecorder 2s infinite ease-in-out;
  outline: none;
}

@keyframes pulseRecorder {
  0% { box-shadow: 0 0 15px var(--border-glow, rgba(16, 185, 129, 0.2)); }
  50% { box-shadow: 0 0 30px var(--border-glow, rgba(16, 185, 129, 0.4)); }
  100% { box-shadow: 0 0 15px var(--border-glow, rgba(16, 185, 129, 0.2)); }
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
  color: var(--text-white, #fff);
}

.recorder-heading strong {
  color: var(--emerald-bright, #34d399);
}

.btn-close-recorder {
  background: transparent;
  border: none;
  color: var(--text-muted, #6b7280);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
}

.btn-close-recorder:hover {
  color: var(--text-white, #fff);
}

.recorder-prompt-box {
  background: var(--bg-inner, #050b08);
  border: 1px dashed var(--emerald-main, rgba(16, 185, 129, 0.4));
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  margin-bottom: 16px;
}

.prompt-text {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-secondary, #9ca3af);
}

.recorded-keys-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.recorded-label {
  font-size: 12px;
  color: var(--text-muted, #6b7280);
  font-weight: 600;
  text-transform: uppercase;
}

.keys-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.live-kbd {
  background: var(--emerald-pill-bg, #11281e);
  border: 1px solid var(--emerald-main, #10b981);
  color: var(--text-white, #fff);
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
  background: var(--bg-card, #101c16);
  border: 1px solid var(--border-card, #233e31);
  color: var(--text-secondary, #9ca3af);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--bg-card-hover, #162a20);
  color: var(--text-white, #fff);
}

.btn-save-key {
  background: var(--emerald-main, #10b981);
  border: 1px solid var(--emerald-bright, #34d399);
  color: var(--bg-canvas, #040c08);
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-save-key:hover:not(:disabled) {
  background: var(--emerald-bright, #34d399);
  box-shadow: 0 0 15px var(--border-glow, rgba(52, 211, 153, 0.4));
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
  background: var(--bg-card, #07100c);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 10px;
  padding: 14px 20px;
  transition: all 0.15s ease;
}

.shortcut-row-card:hover {
  border-color: var(--border-glow, rgba(16, 185, 129, 0.4));
  background: var(--bg-card-hover, #0a1711);
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
  color: var(--text-primary, #f3f4f6);
}

.badge-custom {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.15));
  border: 1px solid var(--emerald-main, #10b981);
  color: var(--emerald-bright, #34d399);
  padding: 1px 6px;
  border-radius: 4px;
}

.category-tag-pill {
  font-size: 9.5px;
  text-transform: uppercase;
  color: var(--text-muted, #6b7280);
  background: var(--bg-inner, #0c1c14);
  padding: 2px 7px;
  border-radius: 4px;
}

.shortcut-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary, #88929b);
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
  background: var(--bg-inner, #050b08);
  border: 1px solid var(--border-card, #1b3528);
  color: var(--text-primary, #e5e7eb);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 5px;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.4);
}

.btn-record-key {
  background: var(--bg-card, #0d1e17);
  border: 1px solid var(--border-card, #1a3c2d);
  color: var(--emerald-bright, #34d399);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-record-key:hover {
  background: var(--bg-card-hover, #143224);
  border-color: var(--emerald-main, #10b981);
}

.btn-record-key.recording {
  background: #1e3a8a;
  border-color: #3b82f6;
  color: #fff;
}

.btn-reset-key {
  background: transparent;
  border: 1px solid var(--border-subtle, #233e31);
  color: var(--text-muted, #6b7280);
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
  color: var(--text-white, #fff);
  border-color: var(--emerald-main, #4b6357);
}

/* Cheatsheet Card */
.shortcuts-cheatsheet-card {
  background: var(--bg-card, #060e0a);
  border: 1px solid var(--border-card, #14281f);
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
  color: var(--text-white, #fff);
}

.cheatsheet-sub {
  margin: 0;
  font-size: 11.5px;
  color: var(--text-muted, #6b7280);
}

.cheatsheet-chips {
  display: flex;
  gap: 10px;
}

.chip-item code {
  background: var(--emerald-pill-bg, #091711);
  border: 1px solid var(--emerald-pill-border, #143526);
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
  background: linear-gradient(135deg, var(--bg-card, #07170f) 0%, var(--bg-inner, #030805) 100%);
  border: 1px solid var(--emerald-main, #10b981);
  border-radius: 14px;
  padding: 28px 32px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px var(--border-glow, rgba(16, 185, 129, 0.15));
}

.founder-hero-glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--border-glow, rgba(16, 185, 129, 0.25)) 0%, transparent 70%);
  pointer-events: none;
}

.founder-badge-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.founder-flag-badge {
  background: var(--emerald-pill-bg, #11281e);
  border: 1px solid var(--emerald-main, #10b981);
  color: var(--text-white, #fff);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
}

.founder-role-badge {
  background: var(--border-glow, rgba(16, 185, 129, 0.15));
  border: 1px solid var(--emerald-pill-border, #1f4f39);
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

.founder-speed-badge {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid #9333ea;
  color: #c084fc;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

.founder-cert-badge {
  background: rgba(14, 165, 233, 0.15);
  border: 1px solid #0284c7;
  color: #38bdf8;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

.founder-ai-badge {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid #d97706;
  color: #fbbf24;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

.founder-zero-badge {
  background: var(--bg-card, #081510);
  border: 1px solid var(--border-card, #183325);
  color: var(--text-secondary, #9ca3af);
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
  background: var(--emerald-pill-bg, #0a2015);
  border: 2px solid var(--emerald-main, #10b981);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px var(--border-glow, rgba(16, 185, 129, 0.3));
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
  color: var(--text-white, #fff);
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
  background: var(--bg-inner, #08160f);
  border: 1px solid var(--border-card, #1a3c2c);
  color: var(--text-primary, #d1d5db);
  font-size: 11.5px;
  padding: 3px 10px;
  border-radius: 6px;
}

.founder-manifesto-quote {
  margin: 0;
  padding: 16px 20px;
  background: var(--bg-card, rgba(4, 12, 8, 0.7));
  border-left: 3px solid var(--emerald-bright, #34d399);
  border-radius: 0 8px 8px 0;
  font-style: italic;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text-primary, #e5e7eb);
}

/* Founder Ventures & Ecosystem Grid */
.founder-ventures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.venture-card {
  background: var(--bg-card, #060e0a);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 12px;
  padding: 18px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.venture-card:hover {
  background: var(--bg-card-hover, #091a11);
  border-color: var(--emerald-main, #10b981);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--border-glow, rgba(16, 185, 129, 0.15));
}

.venture-card.highlight {
  border-color: rgba(239, 68, 68, 0.35);
}

.venture-card.highlight:hover {
  border-color: #ef4444;
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.2);
}

.venture-card.highlight-cyan {
  border-color: rgba(6, 182, 212, 0.35);
  background: #031114;
}

.venture-card.highlight-cyan:hover {
  border-color: #06b6d4;
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.2);
}

.venture-card.highlight-cyan .venture-link-pill {
  border-color: rgba(6, 182, 212, 0.4);
  color: #67e8f9;
  background: #08232c;
}

.venture-card.highlight-cyan .venture-role {
  color: #22d3ee;
}

.venture-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.venture-icon {
  font-size: 22px;
}

.venture-link-pill {
  font-size: 10px;
  font-weight: 700;
  background: var(--emerald-pill-bg, #091711);
  border: 1px solid var(--emerald-pill-border, #143526);
  color: var(--emerald-bright, #34d399);
  padding: 2px 8px;
  border-radius: 12px;
}

.venture-card.highlight .venture-link-pill {
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  background: #180909;
}

.venture-title {
  margin: 0 0 2px 0;
  font-size: 14.5px;
  font-weight: 800;
  color: var(--text-white, #fff);
}

.venture-role {
  font-size: 11px;
  font-weight: 700;
  color: var(--emerald-bright, #34d399);
  margin-bottom: 8px;
}

.venture-card.highlight .venture-role {
  color: #f87171;
}

.venture-desc {
  margin: 0;
  font-size: 11.5px;
  color: var(--text-secondary, #88929b);
  line-height: 1.5;
  flex: 1;
}

/* Origin Story Grid */
.story-columns-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.story-columns-grid.three-col {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 1024px) {
  .story-columns-grid.three-col {
    grid-template-columns: 1fr;
  }
}

.story-card {
  background: var(--bg-card, #07100c);
  border: 1px solid var(--border-card, #14281f);
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
  color: var(--text-white, #fff);
}

.story-text {
  font-size: 13px;
  color: var(--text-secondary, #9ca3af);
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.story-text:last-child {
  margin-bottom: 0;
}

.story-text strong {
  color: var(--text-white, #fff);
}

/* Sovereign Pillars */
.sovereign-pillars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.pillar-card {
  background: var(--bg-card, #060d09);
  border: 1px solid var(--border-card, #12241b);
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
  color: var(--text-white, #fff);
}

.pillar-sub {
  margin: 0;
  font-size: 11.5px;
  color: var(--text-secondary, #88929b);
  line-height: 1.5;
}

/* Origin Specs Card */
.origin-specs-card {
  background: var(--bg-card, #060e0a);
  border: 1px solid var(--border-card, #14281f);
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
  color: var(--text-white, #fff);
}

.specs-sub {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted, #6b7280);
}

.specs-table-grid {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle, #11221a);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 18px;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-subtle, #101d16);
  background: var(--bg-inner, #040906);
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-row:nth-child(even) {
  background: var(--bg-surface, #060d09);
}

.spec-k {
  font-size: 12px;
  color: var(--text-muted, #6b7280);
  font-weight: 600;
}

.spec-v {
  font-size: 12px;
  color: var(--text-primary, #e5e7eb);
  font-weight: 700;
}

.spec-v.highlight {
  color: var(--emerald-bright, #34d399);
}

.spec-v.font-mono {
  font-family: var(--font-mono, monospace);
  background: var(--emerald-pill-bg, #0d1e16);
  border: 1px solid var(--emerald-pill-border, #183827);
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
  background: var(--emerald-pill-bg, #0e2017);
  border: 1px solid var(--emerald-pill-border, #1f4432);
  color: var(--text-primary, #e5e7eb);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-node:hover {
  background: var(--bg-card-hover, #153424);
  border-color: var(--emerald-main, #10b981);
  color: var(--text-white, #fff);
}

.footer-links-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.link-sep {
  color: var(--border-card, #1f3f2f);
  font-size: 11px;
}

/* ========================================================
   PROOF OF WORK & BUILD TIMELINE STYLES
   ======================================================== */
.proof-hero-card {
  position: relative;
  background: linear-gradient(135deg, var(--bg-card, #091c13) 0%, var(--bg-inner, #030a06) 100%);
  border: 1px solid var(--emerald-main, #10b981);
  border-radius: 14px;
  padding: 26px 30px;
  margin-bottom: 22px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 24px var(--border-glow, rgba(16, 185, 129, 0.15));
}

.proof-hero-glow {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, var(--border-glow, rgba(16, 185, 129, 0.28)) 0%, transparent 70%);
  pointer-events: none;
}

.proof-hero-content {
  position: relative;
  z-index: 1;
}

.proof-badge-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.proof-badge-primary {
  background: var(--emerald-pill-bg, #11281e);
  border: 1px solid var(--emerald-main, #10b981);
  color: var(--text-white, #fff);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
}

.proof-badge-commits {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid #0891b2;
  color: #22d3ee;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
}

.proof-badge-loc {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid #9333ea;
  color: #c084fc;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
}

.proof-badge-stack {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid #d97706;
  color: #fbbf24;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
}

.proof-badge-offline {
  background: var(--border-glow, rgba(16, 185, 129, 0.1));
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.3));
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.proof-badge-origin {
  background: #1e1b4b;
  border: 1px solid #4338ca;
  color: #a5b4fc;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
}

.proof-header-row {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.proof-avatar-box {
  position: relative;
  width: 58px;
  height: 58px;
  border-radius: 12px;
  background: var(--emerald-pill-bg, #0d281a);
  border: 1.5px solid var(--emerald-main, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.proof-timer-icon {
  font-size: 26px;
}

.proof-pulse-ring {
  position: absolute;
  inset: -4px;
  border: 1px solid var(--emerald-bright, #34d399);
  border-radius: 16px;
  opacity: 0.35;
  animation: pulse-ring 2.5s infinite;
}

.proof-title-col {
  flex: 1;
}

.proof-heading {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-white, #fff);
  margin: 0 0 6px 0;
  letter-spacing: -0.01em;
}

.proof-subheading {
  font-size: 13px;
  color: var(--text-secondary, #94a3b8);
  line-height: 1.45;
  margin: 0 0 14px 0;
}

.proof-action-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-copy-proof {
  background: linear-gradient(135deg, var(--emerald-main, #10b981) 0%, var(--emerald-deep, #059669) 100%);
  color: var(--bg-canvas, #03140b);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 4px 12px var(--border-glow, rgba(16, 185, 129, 0.3));
}

.btn-copy-proof:hover {
  background: linear-gradient(135deg, var(--emerald-bright, #34d399) 0%, var(--emerald-main, #10b981) 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px var(--border-glow, rgba(16, 185, 129, 0.45));
}

.proof-meta-note {
  font-size: 11px;
  color: var(--text-dim, #64748b);
  font-style: italic;
}

/* Metric Cards 6-Grid */
.proof-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.proof-stat-card {
  background: var(--bg-card, #06140f);
  border: 1px solid var(--border-card, #112d20);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.18s ease;
}

.proof-stat-card:hover {
  border-color: var(--border-glow, rgba(16, 185, 129, 0.35));
  background: var(--bg-card-hover, #081a13);
}

.stat-card-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-dim, #64748b);
  letter-spacing: 0.08em;
}

.stat-card-val-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.stat-card-value {
  font-size: 18px;
  font-weight: 800;
}

.stat-card-value.text-emerald {
  color: var(--emerald-bright, #34d399);
}

.stat-card-value.text-cyan {
  color: #38bdf8;
}

.stat-card-value.text-amber {
  color: #fbbf24;
}

.stat-card-tag {
  font-size: 9px;
  font-weight: 800;
  background: var(--emerald-pill-bg, #092017);
  color: var(--emerald-main, #10b981);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--emerald-pill-border, #143d2a);
}

.stat-card-desc {
  font-size: 11px;
  color: var(--text-secondary, #94a3b8);
  line-height: 1.35;
  margin: 0;
}

/* Timeline Container */
.proof-timeline-container,
.proof-ledger-container,
.proof-fs-container {
  background: var(--bg-inner, #040e0a);
  border: 1px solid var(--border-subtle, #0f271d);
  border-radius: 12px;
  padding: 20px 22px;
  margin-bottom: 24px;
}

.proof-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle, #0f271d);
}

.section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-tag-glow {
  font-size: 9.5px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  letter-spacing: 0.08em;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-white, #fff);
  margin: 0;
}

.section-badge {
  font-size: 10px;
  font-weight: 700;
  background: var(--emerald-pill-bg, #092017);
  color: var(--emerald-bright, #34d399);
  border: 1px solid var(--emerald-pill-border, #143d2a);
  border-radius: 4px;
  padding: 3px 8px;
}

/* Phases List */
.proof-phases-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.proof-phase-item {
  display: flex;
  gap: 16px;
}

.phase-left-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 44px;
}

.phase-hours-bubble {
  background: var(--emerald-main, #10b981);
  color: var(--bg-canvas, #03140b);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.4));
}

.phase-axis-line {
  flex: 1;
  width: 2px;
  background: var(--border-card, #112d20);
  margin-top: 6px;
}

.phase-card {
  flex: 1;
  background: var(--bg-card, #061610);
  border: 1px solid var(--border-card, #113424);
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.15s ease;
}

.phase-card:hover {
  border-color: var(--border-glow, rgba(16, 185, 129, 0.4));
  background: var(--bg-card-hover, #081d14);
}

.phase-card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.phase-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.phase-pill-badge {
  font-size: 9.5px;
  font-weight: 800;
  background: var(--emerald-pill-bg, #092017);
  color: var(--emerald-bright, #34d399);
  border: 1px solid var(--emerald-pill-border, #143d2a);
  border-radius: 4px;
  padding: 2px 7px;
}

.phase-card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-white, #fff);
  margin: 0;
}

.phase-time-window {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dim, #64748b);
  font-family: var(--font-mono, monospace);
}

.phase-card-summary {
  font-size: 12px;
  color: var(--text-secondary, #94a3b8);
  line-height: 1.4;
  margin: 0;
}

.phase-deliverables-box {
  background: var(--bg-inner, rgba(0, 0, 0, 0.25));
  border: 1px solid var(--border-subtle, #0d261a);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.deliverables-heading {
  font-size: 10px;
  font-weight: 800;
  color: var(--emerald-main, #10b981);
  letter-spacing: 0.06em;
}

.deliverables-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.deliverables-list li {
  font-size: 11.5px;
  color: var(--text-primary, #cbd5e1);
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.35;
}

.deliv-bullet {
  color: var(--emerald-main, #10b981);
  font-weight: 700;
}

.phase-files-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.files-heading {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-dim, #64748b);
}

.files-tag-wrap {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.file-code-tag {
  font-size: 10px;
  font-family: var(--font-mono, monospace);
  background: var(--bg-inner, #040e0a);
  border: 1px solid var(--border-card, #112d20);
  color: var(--emerald-bright, #6ee7b7);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Ledger Table */
.ledger-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-subtle, #0f271d);
  border-radius: 8px;
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.ledger-table th {
  background: var(--bg-card, #06140f);
  color: var(--text-dim, #64748b);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, #0f271d);
}

.ledger-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, #091a13);
  color: var(--text-gray, #cbd5e1);
}

.ledger-table tr:hover td {
  background: var(--border-glow, rgba(16, 185, 129, 0.04));
}

.commit-hash {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--emerald-bright, #34d399);
  background: var(--emerald-pill-bg, #092017);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--emerald-pill-border, #143d2a);
}

.commit-time {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--text-secondary, #94a3b8);
  white-space: nowrap;
}

.commit-category-tag {
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.commit-category-tag.scaffold {
  background: #1e1b4b;
  color: #a5b4fc;
}

.commit-category-tag.engine {
  background: var(--emerald-pill-bg, #092017);
  color: var(--emerald-bright, #34d399);
}

.commit-category-tag.uiux {
  background: var(--emerald-pill-bg, #143026);
  color: var(--emerald-bright, #6ee7b7);
}

.commit-category-tag.ai {
  background: #2e1065;
  color: #d8b4fe;
}

.commit-category-tag.docs {
  background: #292524;
  color: #d6d3d1;
}

.commit-category-tag.ergonomics {
  background: #082f49;
  color: #38bdf8;
}

.commit-category-tag.security {
  background: #451a03;
  color: #fcd34d;
}

.commit-subject {
  color: var(--text-primary, #e2e8f0);
}

/* Filesystem Audit Grid */
.fs-records-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fs-record-card {
  background: var(--bg-card, #061610);
  border: 1px solid var(--border-card, #113424);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fs-record-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.fs-file-path {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--emerald-bright, #34d399);
}

.fs-role-tag {
  font-size: 10.5px;
  color: var(--text-secondary, #94a3b8);
}

.fs-times-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.fs-time-label {
  font-size: 10px;
  color: var(--text-dim, #64748b);
}

.fs-time-val {
  font-family: var(--font-mono, monospace);
  color: var(--text-gray, #cbd5e1);
}

/* High-Contrast Settings Cyber Scrollbars */
.settings-main-pane::-webkit-scrollbar,
.settings-nav::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.settings-main-pane::-webkit-scrollbar-track,
.settings-nav::-webkit-scrollbar-track {
  background: var(--scrollbar-track, rgba(4, 12, 8, 0.8));
  border-radius: 6px;
}

.settings-main-pane::-webkit-scrollbar-thumb,
.settings-nav::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, rgba(16, 185, 129, 0.45));
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.settings-main-pane::-webkit-scrollbar-thumb:hover,
.settings-nav::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #34d399);
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.4));
}

.settings-main-pane,
.settings-nav {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb, rgba(16, 185, 129, 0.5)) var(--scrollbar-track, rgba(4, 12, 8, 0.8));
}

/* =========================================================================
   SOVEREIGN MOBILE-FIRST RESPONSIVE MEDIA QUERIES (SettingsView)
   ========================================================================= */
@media (max-width: 768px) {
  .settings-view-layout {
    flex-direction: column;
    overflow-y: auto;
    height: 100%;
  }

  .settings-sidebar {
    width: 100%;
    min-width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-card, #14281f);
  }

  .sidebar-header {
    padding: 12px 14px 8px;
  }

  .sidebar-footer {
    display: none;
  }

  .settings-nav {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    padding: 6px 12px 10px;
    gap: 8px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .settings-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-item-btn {
    white-space: nowrap;
    min-height: 44px;
    padding: 8px 14px;
    flex-shrink: 0;
    font-size: 13px;
  }

  .settings-main-pane {
    padding: 14px 14px calc(80px + env(safe-area-inset-bottom, 0px));
    height: auto;
    overflow: visible;
  }

  .themes-selector-grid {
    grid-template-columns: 1fr;
  }

  .theme-color-swatches {
    flex-wrap: wrap;
  }

  .pane-header {
    margin-bottom: 16px;
  }
}
</style>
