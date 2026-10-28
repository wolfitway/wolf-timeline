<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useUiStore, type ActiveTab, type FocusLens } from "@/stores/useUiStore";
import { useVaultStore } from "@/stores/useVaultStore";
import { useShortcutsStore } from "@/stores/useShortcutsStore";
import { useLicenseStore } from "@/stores/useLicenseStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { kokoroVoice } from "@/services/voiceGuide";
import { voiceControl, type VoiceControlStatus } from "@/services/voiceControl";
import WolfIcon, { type IconName } from "@/components/common/WolfIcon.vue";

const uiStore = useUiStore();
const vaultStore = useVaultStore();
const shortcutsStore = useShortcutsStore();
const licenseStore = useLicenseStore();
const notesStore = useNotesStore();

// 5 Core Workspace Navigation Tabs
const navItems: { id: ActiveTab; label: string; icon: IconName }[] = [
  { id: "timeline", label: "Timeline", icon: "timeline" },
  { id: "studio", label: "Studio", icon: "studio" },
  { id: "roadmap", label: "Roadmap", icon: "roadmap" },
  { id: "bookmarks", label: "Bookmarks", icon: "bookmarks" },
  { id: "secrets", label: "Secret Vault", icon: "vault" },
];

export interface FocusLensItem {
  id: FocusLens;
  label: string;
  shortLabel: string;
  emoji: string;
  title: string;
}

const focusLenses: FocusLensItem[] = [
  { id: "all", label: "Full Suite", shortLabel: "All", emoji: "🐺", title: "Complete Creator Funnel (All Tabs)" },
  { id: "notes", label: "Notes App", shortLabel: "Notes", emoji: "✍️", title: "Notes & Writing Studio (Timeline + Markdown Studio)" },
  { id: "roadmap", label: "Roadmap App", shortLabel: "Roadmap", emoji: "🗺️", title: "Roadmap Canvas (Horizons & Execution Milestones)" },
  { id: "vault", label: "Vault & Research", shortLabel: "Vault", emoji: "🔐", title: "Encrypted Secrets & Smart Research Bookmarks" },
];

const visibleNavItems = computed(() => {
  if (uiStore.activeLens === "notes") {
    return navItems.filter((i) => i.id === "timeline" || i.id === "studio");
  }
  if (uiStore.activeLens === "roadmap") {
    return navItems.filter((i) => i.id === "roadmap");
  }
  if (uiStore.activeLens === "vault") {
    return navItems.filter((i) => i.id === "secrets" || i.id === "bookmarks");
  }
  return navItems;
});

function handleSelectLens(lens: FocusLens) {
  uiStore.setLens(lens);
  kokoroVoice.playHeartChime("affirm");
  const match = focusLenses.find((l) => l.id === lens);
  const msg = match ? `${match.emoji} Switched to ${match.label} lens` : "Switched workspace lens";
  uiStore.showToast(msg);
}

// Voice control status
const voiceStatus = ref<VoiceControlStatus>(voiceControl.getStatus());

// Control Center Popover State
const isControlCenterOpen = ref(false);
const controlCenterRef = ref<HTMLElement | null>(null);

function toggleControlCenter() {
  isControlCenterOpen.value = !isControlCenterOpen.value;
}

function closeControlCenter() {
  isControlCenterOpen.value = false;
}

function handleGlobalClick(e: MouseEvent) {
  if (controlCenterRef.value && !controlCenterRef.value.contains(e.target as Node)) {
    isControlCenterOpen.value = false;
  }
}

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && isControlCenterOpen.value) {
    isControlCenterOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener("click", handleGlobalClick);
  window.addEventListener("keydown", handleGlobalKeyDown);

  // Register hands-free voice commands
  voiceControl.registerCommands([
    {
      phrase: "go to timeline",
      description: "Navigate to Timeline",
      action: () => {
        uiStore.setTab("timeline");
        kokoroVoice.speak("Switched to timeline.");
      },
    },
    {
      phrase: "open timeline",
      description: "Navigate to Timeline",
      action: () => {
        uiStore.setTab("timeline");
        kokoroVoice.speak("Switched to timeline.");
      },
    },
    {
      phrase: "go to studio",
      description: "Navigate to Studio",
      action: () => {
        uiStore.setTab("studio");
        kokoroVoice.speak("Studio opened for focus writing.");
      },
    },
    {
      phrase: "open studio",
      description: "Navigate to Studio",
      action: () => {
        uiStore.setTab("studio");
        kokoroVoice.speak("Studio opened.");
      },
    },
    {
      phrase: "go to roadmap",
      description: "Navigate to Roadmap",
      action: () => {
        uiStore.setTab("roadmap");
        kokoroVoice.speak("Roadmap view displayed.");
      },
    },
    {
      phrase: "open roadmap",
      description: "Navigate to Roadmap",
      action: () => {
        uiStore.setTab("roadmap");
        kokoroVoice.speak("Roadmap opened.");
      },
    },
    {
      phrase: "go to bookmarks",
      description: "Navigate to Bookmarks",
      action: () => {
        uiStore.setTab("bookmarks");
        kokoroVoice.speak("Bookmarks hub opened.");
      },
    },
    {
      phrase: "open bookmarks",
      description: "Navigate to Bookmarks",
      action: () => {
        uiStore.setTab("bookmarks");
        kokoroVoice.speak("Bookmarks hub opened.");
      },
    },
    {
      phrase: "go to settings",
      description: "Navigate to Settings",
      action: () => {
        uiStore.setTab("settings");
        kokoroVoice.speak("Settings center opened.");
      },
    },
    {
      phrase: "open settings",
      description: "Navigate to Settings",
      action: () => {
        uiStore.setTab("settings");
        kokoroVoice.speak("Settings center opened.");
      },
    },
    {
      phrase: "open vault",
      description: "Navigate to Vault",
      action: () => {
        uiStore.setTab("secrets");
        kokoroVoice.speak("Hardware vault accessed.");
      },
    },
    {
      phrase: "lock vault",
      description: "Emergency Vault Lock",
      action: () => {
        vaultStore.lockVault();
        kokoroVoice.playHeartChime("notice");
        kokoroVoice.speak("Vault locked immediately.");
        uiStore.showToast("🔒 Secret Vault locked via Voice Command");
      },
    },
    {
      phrase: "quick capture",
      description: "Open Quick Capture Modal",
      action: () => {
        uiStore.showQuickCapture = true;
        kokoroVoice.speak("Quick capture ready.");
      },
    },
    {
      phrase: "import bookmarks",
      description: "Open Bookmarks Importer",
      action: () => {
        uiStore.showBookmarkImporter = true;
        kokoroVoice.speak("Opening browser bookmark importer.");
      },
    },
    {
      phrase: "new note",
      description: "Create New Project Document",
      action: () => {
        notesStore.addNote({
          title: "Voice Captured Note",
          body: "# Voice Captured Document\n\nInitiated via hands-free voice command.",
          tags: ["voice", "capture"],
          kind: "idea",
          status: "ideation",
        }).then(() => {
          uiStore.setTab("studio");
          kokoroVoice.playHeartChime("affirm");
          kokoroVoice.speak("Created new document and moved to Studio.");
          uiStore.showToast("Created new document via Voice ✓");
        });
      },
    },
    {
      phrase: "search",
      description: "Open Command Palette",
      action: () => {
        uiStore.showCommandPalette = true;
        kokoroVoice.speak("Search palette open.");
      },
    },
    {
      phrase: "notes app",
      description: "Switch to Notes App lens",
      action: () => {
        handleSelectLens("notes");
        kokoroVoice.speak("Notes and writing studio lens active.");
      },
    },
    {
      phrase: "roadmap app",
      description: "Switch to Roadmap App lens",
      action: () => {
        handleSelectLens("roadmap");
        kokoroVoice.speak("Roadmap planning lens active.");
      },
    },
    {
      phrase: "vault app",
      description: "Switch to Vault & Bookmarks lens",
      action: () => {
        handleSelectLens("vault");
        kokoroVoice.speak("Vault and research lens active.");
      },
    },
    {
      phrase: "all apps",
      description: "Switch to Full Suite lens",
      action: () => {
        handleSelectLens("all");
        kokoroVoice.speak("All workspaces active.");
      },
    },
  ]);

  voiceControl.onStatusChange((status) => {
    voiceStatus.value = status;
  });
});

onUnmounted(() => {
  window.removeEventListener("click", handleGlobalClick);
  window.removeEventListener("keydown", handleGlobalKeyDown);
});

function toggleVoiceControl() {
  if (!licenseStore.isPaid) {
    kokoroVoice.playHeartChime("notice");
    uiStore.showToast("⚡ Hands-Free Voice Commands are exclusive to Commercial Solo & Team tiers. Upgrade to unlock!");
    uiStore.showLicenseModal = true;
    return;
  }

  if (!voiceStatus.value.isSupported) {
    kokoroVoice.playHeartChime("notice");
    kokoroVoice.speak("Voice guidance and audio chimes are active. Hands-free speech recognition requires a Chromium or Edge environment.");
    uiStore.showToast("Kokoro voice audio active ♥ (Note: Speech input requires Chromium/Chrome on Linux)");
    return;
  }

  const active = voiceControl.toggleListening();
  if (active) {
    kokoroVoice.playHeartChime("listen");
    kokoroVoice.speak("Voice control active. Listening for commands.");
    uiStore.showToast("🎙️ Voice Control listening... (say 'go to studio', 'lock vault', etc.)");
  } else {
    kokoroVoice.playHeartChime("affirm");
    uiStore.showToast("Voice control stopped");
  }
}

function handleSecurityBadgeClick() {
  if (uiStore.activeTab === "secrets") {
    uiStore.showSecretScanner = true;
  } else {
    uiStore.setTab("secrets");
  }
}

// Quick Theme Switcher
const isLightTheme = ref(typeof document !== "undefined" && document.documentElement.dataset.theme === "light");

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "amber";
  const next = current === "light" ? "amber" : "light";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("wolf_theme", next);
  isLightTheme.value = next === "light";
  uiStore.showToast(next === "light" ? "Wolfitway Solar Light mode active ☀️" : "Wolfitway Amber & Black active 🐺");
}
</script>

<template>
  <header class="app-topbar">
    <!-- Left: Brand Logo, Title & Focus Lens Switcher -->
    <div class="topbar-left-cluster">
      <div class="topbar-brand" @click="uiStore.setTab('timeline')" title="Wolf Timeline Sovereign Node">
        <div class="brand-icon-wrapper">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="wolf-icon"
          >
            <polygon points="4,4 7,11 4,15 9,16 12,20 15,16 20,15 17,11 20,4 14,7 12,5 10,7" />
            <polyline points="8.5,11.5 10,13 12,11.5 14,13 15.5,11.5" />
            <circle cx="9" cy="9.5" r="0.75" fill="currentColor" />
            <circle cx="15" cy="9.5" r="0.75" fill="currentColor" />
          </svg>
        </div>
        <span class="brand-title">Wolf Timeline</span>
      </div>
    </div>

    <!-- Center: Segmented Navigation Pill Group -->
    <nav class="topbar-nav" aria-label="Main Navigation">
      <div class="nav-pill-group">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="nav-tab-pill"
          :class="{ active: uiStore.activeTab === item.id }"
          @click="uiStore.setTab(item.id)"
        >
          <WolfIcon :name="item.icon" :size="14" class="tab-svg-icon" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Right: Clean High-End Action Hub (Search, Quick Capture, Vault DB, Control Center) -->
    <div class="topbar-right">
      <!-- 1. Search Trigger (⌘K) -->
      <button
        type="button"
        class="topbar-search-btn"
        @click="uiStore.showCommandPalette = true"
        title="Search Workspace & Actions (⌘K)"
        aria-label="Search Command Palette"
      >
        <WolfIcon name="search" :size="13" />
        <span class="search-label">Search</span>
        <kbd class="search-kbd">{{ shortcutsStore.formatShortcut('command_palette') }}</kbd>
      </button>

      <!-- 2. Primary Quick Capture Button (+ Capture) -->
      <button
        type="button"
        class="topbar-capture-btn"
        @click="uiStore.showQuickCapture = true"
        title="Quick Capture Note / Task (⌘+Enter)"
        aria-label="Quick Capture"
      >
        <WolfIcon name="plus" :size="14" />
        <span class="capture-text">Capture</span>
      </button>

      <!-- 2b. New Project Workspace Button (+ Project) -->
      <button
        type="button"
        class="topbar-new-project-btn"
        @click="uiStore.openNewProjectModal"
        title="Create New Project Workspace (with dedicated notes & roadmap)"
        aria-label="New Project Workspace"
      >
        <span class="btn-emoji-icon">📁</span>
        <span class="project-btn-text">+ Project</span>
      </button>

      <!-- 3. Sovereign Vault DB Status Pill -->
      <button
        type="button"
        class="security-pill-badge"
        :class="{ unlocked: vaultStore.isUnlocked }"
        @click="handleSecurityBadgeClick"
        :title="vaultStore.isUnlocked ? 'Sovereign Vault DB: AES-256 Active & Unlocked' : 'Sovereign Vault DB: Local-First AES-256 (Locked)'"
      >
        <span class="vault-db-indicator-dot"></span>
        <WolfIcon :name="vaultStore.isUnlocked ? 'shield-check' : 'lock'" :size="13" />
        <span class="vault-label">{{ vaultStore.isUnlocked ? 'Vault Active' : 'Vault DB' }}</span>
      </button>

      <!-- 4. Wolfitway Control Center Popover Trigger -->
      <div class="control-center-anchor" ref="controlCenterRef">
        <button
          type="button"
          class="control-center-btn"
          :class="{ active: isControlCenterOpen, 'has-active': voiceStatus.isListening }"
          @click.stop="toggleControlCenter"
          title="Wolfitway Quick Control Center & Tools"
          aria-label="Control Center"
          aria-haspopup="true"
          :aria-expanded="isControlCenterOpen"
        >
          <WolfIcon name="sliders" :size="14" />
          <span v-if="voiceStatus.isListening" class="pulse-indicator-dot"></span>
        </button>

        <!-- Glassmorphic Dropdown Popover -->
        <Transition name="popover-fade">
          <div
            v-if="isControlCenterOpen"
            class="control-center-popover"
            role="dialog"
            aria-label="Wolfitway Control Center"
            @click.stop
          >
            <!-- Popover Header -->
            <div class="popover-header">
              <div class="popover-title-row">
                <span class="popover-title">Control Center</span>
                <span class="popover-node-chip">Offline Sovereign</span>
              </div>
              <p class="popover-subtitle">Quick toggles, companion audio & vault tools</p>
            </div>

            <!-- Quick Toggles Grid (Voice Control & Kokoro Companion) -->
            <div class="popover-toggles-grid">
              <!-- Voice Control Card -->
              <button
                type="button"
                class="toggle-card"
                :class="{ active: voiceStatus.isListening && licenseStore.isPaid, locked: !licenseStore.isPaid }"
                @click="toggleVoiceControl"
              >
                <div class="toggle-card-top">
                  <WolfIcon :name="!licenseStore.isPaid ? 'key' : (voiceStatus.isListening ? 'mic' : 'mic-off')" :size="16" />
                  <span class="toggle-pill" :class="{ on: voiceStatus.isListening && licenseStore.isPaid, pro: !licenseStore.isPaid }">
                    {{ !licenseStore.isPaid ? 'PRO' : (voiceStatus.isListening ? 'Active' : 'Off') }}
                  </span>
                </div>
                <div class="toggle-card-info">
                  <span class="toggle-card-title">Voice Control</span>
                  <span class="toggle-card-sub">{{ !licenseStore.isPaid ? 'Commercial Tier' : (voiceStatus.isListening ? 'Listening...' : 'Hands-free') }}</span>
                </div>
              </button>

              <!-- Kokoro Voice Audio Companion Card -->
              <button
                type="button"
                class="toggle-card audio-card"
                @click="uiStore.showVoiceGuideModal = true; closeControlCenter();"
              >
                <div class="toggle-card-top">
                  <WolfIcon name="voice" :size="16" />
                  <span class="toggle-pill on">Ready</span>
                </div>
                <div class="toggle-card-info">
                  <span class="toggle-card-title">Kokoro Voice</span>
                  <span class="toggle-card-sub">Audio guide</span>
                </div>
              </button>
            </div>

            <!-- Appearance / Theme Row -->
            <div class="popover-row-item theme-row" @click="toggleTheme">
              <div class="row-item-left">
                <WolfIcon :name="isLightTheme ? 'sun' : 'moon'" :size="15" />
                <div class="row-item-meta">
                  <span class="row-item-title">Color Mode</span>
                  <span class="row-item-sub">{{ isLightTheme ? 'Solar Light Mode ☀️' : 'Obsidian Amber 🐺' }}</span>
                </div>
              </div>
              <button type="button" class="theme-switch-pill" @click.stop="toggleTheme">
                {{ isLightTheme ? 'Switch Amber' : 'Switch Solar' }}
              </button>
            </div>

            <!-- Utilities Section -->
            <div class="popover-section-divider"></div>

            <div class="popover-actions-list">
              <!-- Import Bookmarks Action -->
              <button
                type="button"
                class="popover-action-row"
                @click="uiStore.showBookmarkImporter = true; closeControlCenter();"
              >
                <div class="action-row-left">
                  <div class="action-icon-box">
                    <WolfIcon name="import" :size="14" />
                  </div>
                  <div class="action-row-meta">
                    <span class="action-row-title">Import Browser Bookmarks</span>
                    <span class="action-row-sub">Chrome, Firefox, Safari, Brave HTML</span>
                  </div>
                </div>
                <WolfIcon name="chevron-right" :size="12" class="action-chevron" />
              </button>

              <!-- Settings & Vault Configuration Action -->
              <button
                type="button"
                class="popover-action-row"
                :class="{ selected: uiStore.activeTab === 'settings' }"
                @click="uiStore.setTab('settings'); closeControlCenter();"
              >
                <div class="action-row-left">
                  <div class="action-icon-box">
                    <WolfIcon name="settings" :size="14" />
                  </div>
                  <div class="action-row-meta">
                    <span class="action-row-title">Settings & Vault Center</span>
                    <span class="action-row-sub">Themes, typography, hotkeys & backups</span>
                  </div>
                </div>
                <WolfIcon name="chevron-right" :size="12" class="action-chevron" />
              </button>
            </div>

            <!-- Footer: Node License Tier & Security Lock -->
            <div class="popover-footer">
              <div class="license-footer-left">
                <WolfIcon name="shield-check" :size="13" class="license-shield" />
                <span class="license-tier-text">
                  {{ licenseStore.isTeam ? 'Pack Mesh' : licenseStore.isCommercialSolo ? 'Commercial Solo' : 'Free Solo Node' }}
                </span>
              </div>
              <button
                type="button"
                class="license-upgrade-btn"
                @click="uiStore.showLicenseModal = true; closeControlCenter();"
              >
                {{ licenseStore.isPaid ? 'License Details' : 'Upgrade' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-topbar {
  height: 50px;
  min-height: 50px;
  background: var(--bg-inner, #080603);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  user-select: none;
  z-index: 100;
  border-bottom: 1px solid var(--border-subtle, #1a140b);
}

/* Left Brand & Focus Lens Switcher */
.topbar-left-cluster {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.topbar-brand:hover {
  opacity: 0.9;
}

.brand-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--emerald-bright, #fbbf24);
  filter: drop-shadow(0 0 6px var(--border-glow, rgba(245, 158, 11, 0.45)));
}

.wolf-icon {
  display: block;
}

.brand-title {
  font-family: var(--font-display, "Outfit", sans-serif);
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
  letter-spacing: -0.01em;
}

.lens-switcher-wrap {
  display: flex;
  align-items: center;
  background: var(--bg-surface, #100b05);
  border: 1px solid var(--border-card, #261908);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.lens-switch-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.lens-switch-btn:hover {
  color: var(--text-primary, #ffffff);
  background: rgba(255, 255, 255, 0.04);
}

.lens-switch-btn.active {
  background: var(--emerald-pill-bg, #281b05);
  border-color: var(--border-selected, #f59e0b);
  color: var(--emerald-bright, #fbbf24);
  box-shadow: 0 0 8px var(--border-glow, rgba(245, 158, 11, 0.2));
}

.lens-btn-emoji {
  font-size: 11px;
}

.lens-btn-text {
  letter-spacing: 0.01em;
}

@media (max-width: 960px) {
  .lens-btn-text {
    display: none;
  }
}

/* Center Navigation */
.topbar-nav {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-pill-group {
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--bg-surface, #100b05);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--border-card, #261908);
}

.nav-tab-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 5px 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-muted, #d4a373);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-tab-pill:hover {
  color: var(--text-primary, #f1f5f9);
  background: rgba(245, 158, 11, 0.06);
}

.nav-tab-pill.active {
  background: var(--emerald-pill-bg, #281b05);
  border-color: var(--border-selected, #f59e0b);
  color: var(--emerald-bright, #fbbf24);
  font-weight: 600;
  box-shadow: 0 0 10px var(--border-glow, rgba(245, 158, 11, 0.18));
}

.tab-svg-icon {
  opacity: 0.85;
}

.nav-tab-pill.active .tab-svg-icon {
  opacity: 1;
}

/* Right Section */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 1. Search Trigger */
.topbar-search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card, #120e06);
  border: 1px solid var(--border-card, #261908);
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted, #d4a373);
  cursor: pointer;
  transition: all 0.15s ease;
}

.topbar-search-btn:hover {
  border-color: var(--border-selected, rgba(245, 158, 11, 0.45));
  color: var(--text-primary, #ffffff);
  background: var(--bg-card-hover, #181208);
}

.search-kbd {
  font-family: var(--font-mono, monospace);
  font-size: 9.5px;
  background: var(--bg-surface, #1e1509);
  color: var(--emerald-bright, #fbbf24);
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid var(--border-card, #33220a);
}

/* 2. Primary Capture Action */
.topbar-capture-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--emerald-main, #f59e0b);
  color: #080501;
  border: none;
  border-radius: 7px;
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 8px var(--border-glow, rgba(245, 158, 11, 0.3));
  transition: all 0.15s ease;
}

.topbar-capture-btn:hover {
  background: var(--emerald-bright, #fbbf24);
  transform: translateY(-1px);
  box-shadow: 0 2px 12px var(--border-glow, rgba(245, 158, 11, 0.45));
}

.topbar-capture-btn:active {
  transform: translateY(0);
}

.topbar-new-project-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-card, #120e06);
  color: var(--text-primary, #ffffff);
  border: 1px solid var(--border-card, #261908);
  border-radius: 7px;
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.topbar-new-project-btn:hover {
  border-color: var(--emerald-main, #10b981);
  color: var(--emerald-bright, #34d399);
  background: var(--emerald-pill-bg, #063324);
  transform: translateY(-1px);
}

.topbar-new-project-btn:active {
  transform: translateY(0);
}

.topbar-new-project-btn .btn-emoji-icon {
  font-size: 13px;
  line-height: 1;
}

/* 3. Security Status Pill */
.security-pill-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card, #120e06);
  border: 1px solid var(--border-card, #261908);
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted, #d4a373);
  cursor: pointer;
  transition: all 0.15s ease;
}

.security-pill-badge:hover {
  border-color: var(--border-selected, rgba(245, 158, 11, 0.4));
  color: var(--text-primary, #ffffff);
  background: var(--bg-card-hover, #181208);
}

.security-pill-badge.unlocked {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.4);
  color: var(--emerald-bright, #fbbf24);
}

.vault-db-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--emerald-main, #f59e0b);
  box-shadow: 0 0 6px var(--emerald-bright, #fbbf24);
}

/* 4. Control Center Anchor & Button */
.control-center-anchor {
  position: relative;
}

.control-center-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-card, #120e06);
  border: 1px solid var(--border-card, #261908);
  border-radius: 7px;
  color: var(--text-muted, #d4a373);
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.control-center-btn:hover {
  border-color: var(--border-selected, #f59e0b);
  color: var(--emerald-bright, #fbbf24);
  background: var(--bg-card-hover, #181208);
}

.control-center-btn.active {
  background: var(--emerald-pill-bg, #281b05);
  border-color: var(--emerald-bright, #fbbf24);
  color: var(--emerald-bright, #fbbf24);
  box-shadow: 0 0 10px var(--border-glow, rgba(245, 158, 11, 0.3));
}

.pulse-indicator-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
  animation: pulseListen 1.2s infinite alternate;
}

@keyframes pulseListen {
  from { opacity: 0.6; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1.3); }
}

/* Glassmorphic Control Center Popover */
.control-center-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 310px;
  max-width: calc(100vw - 24px);
  background: var(--bg-card, #120e06);
  border: 1px solid var(--border-card, #33220a);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(245, 158, 11, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 14px;
  z-index: 250;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.popover-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.popover-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.popover-title {
  font-family: var(--font-display, "Outfit", sans-serif);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
}

.popover-node-chip {
  font-size: 10px;
  font-weight: 600;
  color: var(--emerald-bright, #fbbf24);
  background: var(--emerald-pill-bg, #281b05);
  border: 1px solid var(--border-card, #33220a);
  border-radius: 4px;
  padding: 1px 5px;
}

.popover-subtitle {
  font-size: 11px;
  color: var(--text-muted, #d4a373);
  margin: 0;
}

/* Quick Toggles Grid */
.popover-toggles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.toggle-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  background: var(--bg-surface, #181208);
  border: 1px solid var(--border-card, #33220a);
  border-radius: 9px;
  padding: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.toggle-card:hover {
  background: var(--bg-card-hover, #20170a);
  border-color: var(--border-selected, rgba(245, 158, 11, 0.4));
}

.toggle-card.active {
  background: var(--emerald-pill-bg, #281b05);
  border-color: var(--emerald-bright, #fbbf24);
  box-shadow: 0 0 10px var(--border-glow, rgba(245, 158, 11, 0.25));
}

.toggle-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--emerald-bright, #fbbf24);
}

.toggle-pill {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted, #94a3b8);
}

.toggle-pill.on {
  background: rgba(245, 158, 11, 0.2);
  color: var(--emerald-bright, #fbbf24);
}

.toggle-pill.pro {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.toggle-card.locked {
  border-color: rgba(16, 185, 129, 0.2);
}

.toggle-card-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.toggle-card-title {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
}

.toggle-card-sub {
  font-size: 10px;
  color: var(--text-muted, #d4a373);
}

/* Theme Switch Row */
.popover-row-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface, #181208);
  border: 1px solid var(--border-card, #33220a);
  border-radius: 9px;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.popover-row-item:hover {
  background: var(--bg-card-hover, #20170a);
  border-color: var(--border-selected, rgba(245, 158, 11, 0.4));
}

.row-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--emerald-bright, #fbbf24);
}

.row-item-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.row-item-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
}

.row-item-sub {
  font-size: 10px;
  color: var(--text-muted, #d4a373);
}

.theme-switch-pill {
  font-size: 10px;
  font-weight: 700;
  background: var(--emerald-pill-bg, #281b05);
  border: 1px solid var(--border-card, #33220a);
  color: var(--emerald-bright, #fbbf24);
  padding: 3px 7px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-switch-pill:hover {
  border-color: var(--emerald-bright, #fbbf24);
}

.popover-section-divider {
  height: 1px;
  background: var(--border-card, #261908);
  margin: 1px 0;
}

/* Action Rows List */
.popover-actions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.popover-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 7px 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.popover-action-row:hover {
  background: var(--bg-surface, #181208);
  border-color: var(--border-card, #33220a);
}

.popover-action-row.selected {
  background: var(--emerald-pill-bg, #281b05);
  border-color: var(--border-selected, #f59e0b);
}

.action-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--bg-surface, #181208);
  border: 1px solid var(--border-card, #33220a);
  color: var(--emerald-bright, #fbbf24);
}

.action-row-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.action-row-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
}

.action-row-sub {
  font-size: 10px;
  color: var(--text-muted, #d4a373);
}

.action-chevron {
  color: var(--text-muted, #d4a373);
  opacity: 0.6;
}

/* Popover Footer */
.popover-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid var(--border-card, #261908);
}

.license-footer-left {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--emerald-bright, #fbbf24);
}

.license-shield {
  opacity: 0.9;
}

.license-tier-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #d4a373);
}

.license-upgrade-btn {
  font-size: 10.5px;
  font-weight: 700;
  background: transparent;
  color: var(--emerald-bright, #fbbf24);
  border: 1px solid var(--border-card, #33220a);
  border-radius: 5px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.license-upgrade-btn:hover {
  background: var(--emerald-pill-bg, #281b05);
  border-color: var(--emerald-bright, #fbbf24);
}

/* Popover Transitions */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

/* Responsive Breakpoints & Mobile Optimization */
@media (max-width: 900px) {
  .brand-version-pill {
    display: none;
  }
  .nav-tab-pill {
    padding: 5px 9px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .app-topbar {
    height: 48px;
    min-height: 48px;
    padding: 0 12px;
    background: var(--bg-card, #120e06);
    border-bottom: 1px solid var(--border-card, #33220a);
  }

  /* Center tabs hidden on mobile; handled elegantly by MobileBottomNav */
  .topbar-nav {
    display: none;
  }

  .brand-title {
    font-size: 13.5px;
  }

  /* Right actions: clean & compact */
  .security-pill-badge {
    display: none;
  }

  .search-kbd {
    display: none;
  }

  .topbar-search-btn {
    padding: 5px 8px;
  }

  .search-label {
    display: none;
  }

  .topbar-capture-btn {
    padding: 5px 8px;
  }

  .control-center-popover {
    right: -4px;
    width: 295px;
  }
}

@media (max-width: 360px) {
  .brand-title {
    font-size: 12.5px;
  }
}
</style>
