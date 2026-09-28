<script setup lang="ts">
import { useUiStore, type ActiveTab } from "@/stores/useUiStore";
import { useVaultStore } from "@/stores/useVaultStore";
import { useShortcutsStore } from "@/stores/useShortcutsStore";
import { useLicenseStore } from "@/stores/useLicenseStore";

const uiStore = useUiStore();
const vaultStore = useVaultStore();
const shortcutsStore = useShortcutsStore();
const licenseStore = useLicenseStore();
const isDev = import.meta.env.DEV;

const navItems: { id: ActiveTab; label: string; icon?: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "studio", label: "Studio" },
  { id: "roadmap", label: "Roadmap" },
  { id: "secrets", label: "Secret Vault", icon: "🔐" },
  { id: "settings", label: "Settings" },
];

function handleSecurityBadgeClick() {
  if (uiStore.activeTab === "secrets") {
    uiStore.showSecretScanner = true;
  } else {
    uiStore.setTab("secrets");
  }
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

      <!-- License / Founder Pass Trigger -->
      <button
        type="button"
        class="topbar-license-btn"
        :class="{ activated: licenseStore.isActivated }"
        @click="uiStore.showLicenseModal = true"
        :title="licenseStore.isActivated ? 'Sovereign Founder Node (Active)' : 'Claim Founder Alpha Pass'"
      >
        <span class="license-icon">{{ licenseStore.isActivated ? '👑' : (isDev ? '⚡' : '🛡️') }}</span>
        <span>{{ licenseStore.isActivated ? 'Founder VIP' : (isDev ? 'Keygen (Dev)' : 'Founder Pass') }}</span>
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
  background: #040c08;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  user-select: none;
  z-index: 100;
  border-bottom: 1px solid rgba(16, 185, 129, 0.08);
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
  filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.45));
}

.wolf-icon {
  display: block;
}

.brand-title {
  font-family: var(--font-display, "Outfit", sans-serif);
  font-size: 15.5px;
  font-weight: 700;
  color: #ffffff;
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
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-emoji-icon {
  font-size: 13px;
}

.nav-tab-pill:hover {
  color: #f1f5f9;
  background: rgba(16, 185, 129, 0.06);
}

.nav-tab-pill.active {
  background: #082117;
  border-color: #10b981;
  color: #34d399;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.15);
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
  background: #061610;
  border: 1px solid #113424;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.topbar-search-btn:hover {
  border-color: rgba(16, 185, 129, 0.4);
  color: #ffffff;
  background: #092017;
}

.search-kbd {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  background: #092419;
  color: #34d399;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #14432c;
}

.topbar-license-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #092017;
  border: 1px solid #143d2a;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #34d399;
  cursor: pointer;
  transition: all 0.18s ease;
}

.topbar-license-btn:hover {
  background: #10b981;
  color: #022c22;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
}

.topbar-license-btn.activated {
  background: rgba(16, 185, 129, 0.12);
  border-color: #10b981;
  color: #34d399;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
}

.topbar-license-btn.activated:hover {
  background: #10b981;
  color: #022c22;
}

.license-icon {
  font-size: 12px;
}

.security-pill-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #061610;
  border: 1px solid #113424;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.security-pill-badge:hover {
  border-color: rgba(16, 185, 129, 0.4);
  color: #e2e8f0;
  background: #092017;
}

.lock-icon {
  color: #94a3b8;
}

.security-pill-badge:hover .lock-icon {
  color: var(--emerald-bright, #34d399);
}
</style>
