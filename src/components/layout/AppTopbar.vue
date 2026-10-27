<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUiStore, type ActiveTab } from "@/stores/useUiStore";
import { useVaultStore } from "@/stores/useVaultStore";
import { useShortcutsStore } from "@/stores/useShortcutsStore";
import { useLicenseStore } from "@/stores/useLicenseStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { kokoroVoice } from "@/services/voiceGuide";
import { voiceControl, type VoiceControlStatus } from "@/services/voiceControl";

const uiStore = useUiStore();
const vaultStore = useVaultStore();
const shortcutsStore = useShortcutsStore();
const licenseStore = useLicenseStore();
const notesStore = useNotesStore();
const isDev = import.meta.env.DEV;

const navItems: { id: ActiveTab; label: string; icon?: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "studio", label: "Studio" },
  { id: "roadmap", label: "Roadmap" },
  { id: "bookmarks", label: "Bookmarks", icon: "📑" },
  { id: "secrets", label: "Secret Vault", icon: "🔐" },
  { id: "settings", label: "Settings" },
];

// Voice control status
const voiceStatus = ref<VoiceControlStatus>(voiceControl.getStatus());

onMounted(() => {
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
  ]);

  voiceControl.onStatusChange((status) => {
    voiceStatus.value = status;
  });
});

function toggleVoiceControl() {
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
    <!-- Left: Brand Logo & Title -->
    <div class="topbar-brand" @click="uiStore.setTab('timeline')">
      <div class="brand-icon-wrapper">
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
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

    <!-- Center: Main Navigation Tabs -->
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
          <span v-if="item.icon" class="tab-emoji-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Right: Search Button & Security Badge -->
    <div class="topbar-right">
      <!-- Search Trigger ⌘K -->
      <button
        type="button"
        class="topbar-search-btn"
        @click="uiStore.showCommandPalette = true"
        title="Search (⌘K)"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>Search</span>
        <kbd class="search-kbd">{{ shortcutsStore.formatShortcut('command_palette') }}</kbd>
      </button>

      <!-- Import Bookmarks Trigger -->
      <button
        type="button"
        class="topbar-action-icon-btn"
        @click="uiStore.showBookmarkImporter = true"
        title="Import Bookmarks from Chrome, Firefox, Safari, Brave (Safe & Offline)"
      >
        <span class="btn-icon">📑</span>
        <span class="btn-label-desktop">Import Bookmarks</span>
      </button>

      <!-- Kokoro Voice Heart Companion Trigger -->
      <button
        type="button"
        class="topbar-kokoro-btn"
        @click="uiStore.showVoiceGuideModal = true"
        title="Kokoro Voice Heart — Audio Companion & Guidance"
      >
        <span class="kokoro-icon-pulse">💖</span>
        <span class="btn-label-desktop">Kokoro Voice</span>
      </button>

      <!-- Hands-Free Voice Control Toggle -->
      <button
        type="button"
        class="topbar-voice-control-btn"
        :class="{ listening: voiceStatus.isListening }"
        @click="toggleVoiceControl"
        :title="voiceStatus.isListening ? 'Voice Control Listening... Click to Pause' : 'Enable Hands-Free Voice Control'"
      >
        <span class="mic-icon">{{ voiceStatus.isListening ? '🎙️' : '🎤' }}</span>
        <span>{{ voiceStatus.isListening ? 'Listening...' : 'Voice Control' }}</span>
        <span v-if="voiceStatus.isListening" class="listening-wave-dot"></span>
      </button>

      <!-- License / Tier Status Trigger -->
      <button
        type="button"
        class="topbar-license-btn"
        :class="{
          activated: licenseStore.isPaid,
          'tier-team': licenseStore.isTeam,
          'tier-comm': licenseStore.isCommercialSolo,
          'tier-free': licenseStore.isFree,
        }"
        @click="uiStore.showLicenseModal = true"
        :title="licenseStore.isPaid ? `${licenseStore.tierLabel} (Active)` : 'Solo Personal Node (Free) — Upgrade for Commercial / Team'"
      >
        <span class="license-icon">{{ licenseStore.isTeam ? '👥' : licenseStore.isCommercialSolo ? '⚡' : '🐺' }}</span>
        <span>{{ licenseStore.isTeam ? 'Pack Mesh (Team)' : licenseStore.isCommercialSolo ? 'Commercial Solo' : 'Free Solo' }}</span>
      </button>

      <!-- Quick Theme Switcher (Amber & Black <-> Solar Light) -->
      <button
        type="button"
        class="topbar-theme-toggle-btn"
        @click="toggleTheme"
        :title="isLightTheme ? 'Switch to Wolfitway Amber & Black' : 'Switch to Wolfitway Solar Light'"
        aria-label="Toggle Theme"
      >
        <span class="theme-icon">{{ isLightTheme ? '☀️' : '🐺' }}</span>
        <span class="btn-label-desktop">{{ isLightTheme ? 'Solar' : 'Amber' }}</span>
      </button>

      <!-- Mobile-only Quick Capture Button -->
      <button
        type="button"
        class="topbar-mobile-qc-btn"
        @click="uiStore.showQuickCapture = true"
        title="Quick Capture (⌘+Enter)"
        aria-label="Quick Capture"
      >
        <span>+</span>
      </button>

      <!-- Security / Encryption Status Badge -->
      <button
        type="button"
        class="security-pill-badge"
        @click="handleSecurityBadgeClick"
        title="Local-First Hardware Cryptography Engine"
      >
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lock-icon"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Local-First AES-256</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-topbar {
  height: 56px;
  min-height: 56px;
  background: var(--bg-inner, #070e0b);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  user-select: none;
  z-index: 100;
  border-bottom: 1px solid var(--border-subtle, #12221b);
}

/* Left Brand */
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.topbar-brand:hover {
  opacity: 0.9;
}

.brand-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--emerald-bright, #34d399);
  filter: drop-shadow(0 0 6px var(--border-glow, rgba(16, 185, 129, 0.45)));
}

.wolf-icon {
  display: block;
}

.brand-title {
  font-family: var(--font-display, "Outfit", sans-serif);
  font-size: 15.5px;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
  letter-spacing: -0.01em;
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
  gap: 4px;
}

.nav-tab-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-emoji-icon {
  font-size: 13px;
}

.nav-tab-pill:hover {
  color: var(--text-primary, #f1f5f9);
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.06));
}

.nav-tab-pill.active {
  background: var(--emerald-pill-bg, #082117);
  border-color: var(--border-selected, #10b981);
  color: var(--emerald-bright, #34d399);
  font-weight: 600;
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.15));
}

/* Right Section */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-search-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card, #061610);
  border: 1px solid var(--border-card, #113424);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-gray, #94a3b8);
  cursor: pointer;
  transition: all 0.15s ease;
}

.topbar-search-btn:hover {
  border-color: var(--border-selected, rgba(16, 185, 129, 0.4));
  color: var(--text-primary, #ffffff);
  background: var(--bg-card-hover, #092017);
}

.search-kbd {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  background: var(--bg-surface, #092419);
  color: var(--emerald-bright, #34d399);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--border-card, #14432c);
}

.topbar-action-icon-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card, #061610);
  border: 1px solid var(--border-card, #113424);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
  cursor: pointer;
  transition: all 0.15s ease;
}

.topbar-action-icon-btn:hover {
  background: var(--bg-card-hover, #092017);
  border-color: var(--emerald-main, #10b981);
  color: var(--text-primary, #fff);
  transform: translateY(-1px);
}

.topbar-kokoro-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card, #140b10);
  border: 1px solid var(--border-card, #3b1424);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--emerald-bright, #fda4af);
  cursor: pointer;
  transition: all 0.18s ease;
}

.topbar-kokoro-btn:hover {
  background: var(--bg-card-hover, #2a0e1c);
  border-color: var(--emerald-main, #f43f5e);
  box-shadow: 0 0 12px var(--border-glow, rgba(244, 63, 94, 0.3));
  color: var(--text-primary, #fff);
  transform: translateY(-1px);
}

.kokoro-icon-pulse {
  font-size: 13px;
  animation: heartPulse 2s infinite ease-in-out;
}

@keyframes heartPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.topbar-voice-control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card, #061610);
  border: 1px solid var(--border-card, #113424);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-gray, #94a3b8);
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
}

.topbar-voice-control-btn:hover {
  background: var(--bg-card-hover, #092017);
  border-color: var(--border-selected, rgba(16, 185, 129, 0.4));
  color: var(--text-primary, #fff);
}

.topbar-voice-control-btn.listening {
  background: var(--emerald-pill-bg, #092017);
  border-color: var(--emerald-bright, #34d399);
  color: var(--emerald-bright, #34d399);
  box-shadow: 0 0 14px var(--border-glow, rgba(16, 185, 129, 0.35));
}

.listening-wave-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--emerald-bright, #34d399);
  animation: listenPulse 1s infinite alternate ease-in-out;
}

@keyframes listenPulse {
  from {
    transform: scale(0.8);
    opacity: 0.6;
  }
  to {
    transform: scale(1.4);
    opacity: 1;
    box-shadow: 0 0 8px var(--emerald-bright, #34d399);
  }
}

.topbar-license-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--emerald-pill-bg, #092017);
  border: 1px solid var(--emerald-pill-border, #143d2a);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--emerald-bright, #34d399);
  cursor: pointer;
  transition: all 0.18s ease;
}

.topbar-license-btn:hover {
  background: var(--emerald-main, #10b981);
  color: var(--bg-body, #022c22);
  box-shadow: 0 0 12px var(--border-glow, rgba(16, 185, 129, 0.4));
}

.topbar-license-btn.activated {
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.12));
  border-color: var(--border-selected, #10b981);
  color: var(--emerald-bright, #34d399);
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.2));
}

.topbar-license-btn.activated:hover {
  background: var(--emerald-main, #10b981);
  color: var(--bg-body, #022c22);
}

.license-icon {
  font-size: 12px;
}

.security-pill-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--bg-card, #061610);
  border: 1px solid var(--border-card, #113424);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-gray, #94a3b8);
  cursor: pointer;
  transition: all 0.15s ease;
}

.security-pill-badge:hover {
  border-color: var(--border-selected, rgba(16, 185, 129, 0.4));
  color: var(--text-primary, #e2e8f0);
  background: var(--bg-card-hover, #092017);
}

.lock-icon {
  color: var(--text-muted, #94a3b8);
}

.security-pill-badge:hover .lock-icon {
  color: var(--emerald-bright, #34d399);
}

/* Theme Toggle Button */
.topbar-theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card, #120e06);
  border: 1px solid var(--border-card, #33220a);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--emerald-bright, #fbbf24);
  cursor: pointer;
  min-height: 36px;
  min-width: 36px;
  justify-content: center;
  transition: all 0.15s ease;
  user-select: none;
}

.topbar-theme-toggle-btn:hover {
  background: var(--bg-card-hover, #1c160a);
  border-color: var(--border-focus, #fbbf24);
  box-shadow: 0 0 10px var(--border-glow, rgba(245, 158, 11, 0.25));
}

.theme-icon {
  font-size: 13px;
  line-height: 1;
}

/* Mobile Quick Capture Button (hidden on desktop) */
.topbar-mobile-qc-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  background: var(--emerald-main, #f59e0b);
  color: var(--bg-canvas, #000000);
  border: none;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 0 12px var(--border-glow, rgba(245, 158, 11, 0.35));
  transition: transform 0.15s ease;
}

.topbar-mobile-qc-btn:active {
  transform: scale(0.92);
}

/* Responsive Breakpoints & Mobile Optimization */
@media (max-width: 1024px) {
  .topbar-right .btn-label-desktop {
    display: none;
  }
}

@media (max-width: 768px) {
  .app-topbar {
    height: 52px;
    min-height: 52px;
    padding: 0 12px;
  }

  /* Defer navigation tabs to MobileBottomNav */
  .topbar-nav {
    display: none;
  }

  .brand-title {
    font-size: 13.5px;
  }

  .topbar-right {
    gap: 6px;
  }

  /* Show mobile quick capture */
  .topbar-mobile-qc-btn {
    display: flex;
  }

  /* Hide secondary desktop buttons on mobile to avoid overflow */
  .topbar-action-icon-btn,
  .topbar-kokoro-btn,
  .topbar-voice-control-btn,
  .topbar-license-btn,
  .security-pill-badge span {
    display: none;
  }

  .security-pill-badge {
    padding: 8px 10px;
    min-height: 40px;
    min-width: 40px;
    justify-content: center;
  }

  .topbar-search-btn {
    padding: 8px 10px;
    min-height: 40px;
  }

  .topbar-search-btn kbd {
    display: none;
  }

  .topbar-theme-toggle-btn {
    min-height: 40px;
    min-width: 40px;
    padding: 8px 10px;
  }
}

@media (max-width: 480px) {
  .brand-title {
    display: none;
  }

  .topbar-search-btn span {
    display: none;
  }

  .topbar-search-btn {
    min-width: 40px;
    justify-content: center;
  }
}
</style>
