<script setup lang="ts">
import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { useVaultStore } from "@/stores/useVaultStore";
import { useLicenseStore } from "@/stores/useLicenseStore";

const uiStore = useUiStore();
const notesStore = useNotesStore();
const vaultStore = useVaultStore();
const licenseStore = useLicenseStore();
</script>

<template>
  <aside class="app-sidebar">
    <!-- Brand Header -->
    <div class="sidebar-brand">
      <div class="brand-logo-wrap">
        <img src="/assets/wolf-logo.png" alt="Wolf Logo" class="brand-logo-img" />
        <div class="brand-glow-ring"></div>
      </div>
      <div class="brand-info">
        <span class="brand-name">WOLF TIMELINE</span>
        <span class="brand-sub">Sovereign Creator Funnel</span>
      </div>
    </div>

    <!-- Main Navigation Tabs -->
    <nav class="sidebar-nav">
      <div class="nav-section-title">WORKSPACES</div>

      <button
        type="button"
        class="nav-tab-btn"
        :class="{ active: uiStore.activeTab === 'timeline' }"
        @click="uiStore.setTab('timeline')"
      >
        <div class="tab-icon-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <span class="tab-label">Timeline &amp; Notes</span>
        <span class="tab-badge">{{ notesStore.notes.length }}</span>
      </button>

      <button
        type="button"
        class="nav-tab-btn"
        :class="{ active: uiStore.activeTab === 'studio' }"
        @click="uiStore.setTab('studio')"
      >
        <div class="tab-icon-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.586 7.586"></path>
            <circle cx="11" cy="11" r="2"></circle>
          </svg>
        </div>
        <span class="tab-label">Markdown Studio</span>
      </button>

      <button
        type="button"
        class="nav-tab-btn"
        :class="{ active: uiStore.activeTab === 'roadmap' }"
        @click="uiStore.setTab('roadmap')"
      >
        <div class="tab-icon-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        </div>
        <span class="tab-label">Roadmap Canvas</span>
      </button>

      <div class="nav-section-title">SOVEREIGN ENGINE</div>

      <button
        type="button"
        class="nav-tab-btn"
        :class="{ active: uiStore.activeTab === 'secrets' }"
        @click="uiStore.setTab('secrets')"
      >
        <div class="tab-icon-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <span class="tab-label">Secret Vault</span>
        <span v-if="vaultStore.isUnlocked" class="status-dot-unlocked" title="Unlocked in RAM"></span>
        <span v-else class="tab-badge-lock">🔒</span>
      </button>

      <button
        type="button"
        class="nav-tab-btn"
        :class="{ active: uiStore.activeTab === 'settings' }"
        @click="uiStore.setTab('settings')"
      >
        <div class="tab-icon-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </div>
        <span class="tab-label">Settings &amp; Council</span>
      </button>
    </nav>

    <!-- License & Security Footer -->
    <div class="sidebar-footer">
      <div class="license-status-card" @click="uiStore.showLicenseModal = true">
        <div class="license-dot" :class="{ active: licenseStore.isActivated }"></div>
        <div class="license-text-col">
          <span class="license-tier">{{ licenseStore.tier }}</span>
          <span class="license-id">{{ licenseStore.deviceId }}</span>
        </div>
        <span class="license-arrow">⚙️</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--bg-body, #060b09);
  border-right: 1px solid var(--border-subtle, #11221a);
  display: flex;
  flex-direction: column;
  user-select: none;
  z-index: 100;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px;
  border-bottom: 1px solid var(--border-subtle, #11221a);
}

.brand-logo-wrap {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px var(--border-glow, rgba(16, 185, 129, 0.4)));
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-family: var(--font-display, "Outfit", sans-serif);
  font-weight: 800;
  font-size: 13.5px;
  letter-spacing: 0.08em;
  color: var(--text-primary, #fff);
}

.brand-sub {
  font-size: 10.5px;
  color: var(--emerald-bright, #34d399);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-section-title {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--text-muted, #4b6357);
  opacity: 0.85;
  padding: 12px 10px 4px 10px;
}

.nav-tab-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--text-gray, #9ca3af);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.nav-tab-btn:hover {
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.06));
  color: var(--text-primary, #e5e7eb);
}

.nav-tab-btn.active {
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.12));
  border-color: var(--border-selected, rgba(16, 185, 129, 0.3));
  color: var(--text-primary, #fff);
  box-shadow: 0 0 15px var(--border-glow, rgba(16, 185, 129, 0.08));
}

.tab-icon-wrap {
  display: flex;
  align-items: center;
  color: inherit;
}

.nav-tab-btn.active .tab-icon-wrap {
  color: var(--emerald-bright, #34d399);
}

.tab-label {
  flex: 1;
}

.tab-badge {
  font-size: 11px;
  font-weight: 700;
  background: var(--bg-surface, #10241b);
  color: var(--emerald-bright, #34d399);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.2));
}

.tab-badge-lock {
  font-size: 11px;
  opacity: 0.6;
}

.status-dot-unlocked {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--emerald-main, #10b981);
  box-shadow: 0 0 8px var(--emerald-bright, #10b981);
}

.sidebar-footer {
  padding: 14px;
  border-top: 1px solid var(--border-subtle, #11221a);
}

.license-status-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-card, #09130e);
  border: 1px solid var(--border-card, #162c21);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.license-status-card:hover {
  border-color: var(--border-selected, rgba(16, 185, 129, 0.4));
  background: var(--bg-card-hover, #0c1a13);
}

.license-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
}

.license-dot.active {
  background: var(--emerald-main, #10b981);
  box-shadow: 0 0 8px var(--emerald-bright, #10b981);
}

.license-text-col {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.license-tier {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.license-id {
  font-family: var(--font-mono, monospace);
  font-size: 9.5px;
  color: var(--text-muted, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.license-arrow {
  font-size: 12px;
  opacity: 0.7;
}
</style>
