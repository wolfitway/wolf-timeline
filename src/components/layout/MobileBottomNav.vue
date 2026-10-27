<script setup lang="ts">
import { useUiStore, type ActiveTab } from "@/stores/useUiStore";

const uiStore = useUiStore();

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: "timeline", label: "Timeline", icon: "🕒" },
  { id: "studio", label: "Studio", icon: "📝" },
  { id: "roadmap", label: "Roadmap", icon: "🗺️" },
  { id: "bookmarks", label: "Bookmarks", icon: "📑" },
  { id: "secrets", label: "Vault", icon: "🔐" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

function handleTabClick(id: ActiveTab) {
  uiStore.setTab(id);
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}
</script>

<template>
  <nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
    <div class="bottom-nav-inner">
      <button
        v-for="item in navItems"
        :key="item.id"
        type="button"
        class="nav-tab-button"
        :class="{ active: uiStore.activeTab === item.id }"
        @click="handleTabClick(item.id)"
        :aria-label="item.label"
        :aria-current="uiStore.activeTab === item.id ? 'page' : undefined"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="uiStore.activeTab === item.id" class="active-indicator-dot"></span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--bg-card, #120e06);
  border-top: 1px solid var(--border-card, #33220a);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.45);
}

.bottom-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 58px;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 4px;
}

.nav-tab-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 50px;
  min-width: 48px;
  padding: 4px 2px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-muted, #d4a373);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.nav-tab-button:active {
  transform: scale(0.92);
}

.nav-icon {
  font-size: 17px;
  line-height: 1;
  filter: grayscale(0.2);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.nav-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: color 0.15s ease;
}

.nav-tab-button.active {
  color: var(--emerald-bright, #fbbf24);
}

.nav-tab-button.active .nav-icon {
  filter: none;
  transform: translateY(-1px);
}

.active-indicator-dot {
  position: absolute;
  top: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--emerald-bright, #fbbf24);
  box-shadow: 0 0 6px var(--emerald-bright, #fbbf24);
}

/* Accessible focus ring */
.nav-tab-button:focus-visible {
  outline: 2px solid var(--border-focus, #fbbf24);
  outline-offset: -2px;
}

@media (max-width: 768px) {
  .mobile-bottom-nav {
    display: block;
  }
}
</style>
