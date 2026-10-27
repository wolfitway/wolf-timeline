<script setup lang="ts">
import { useUiStore, type ActiveTab } from "@/stores/useUiStore";
import WolfIcon from "@/components/common/WolfIcon.vue";

const uiStore = useUiStore();

function handleTabClick(id: ActiveTab) {
  uiStore.setTab(id);
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

function handleQuickCapture() {
  uiStore.showQuickCapture = true;
  if (navigator.vibrate) {
    navigator.vibrate(15);
  }
}
</script>

<template>
  <nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
    <div class="bottom-nav-inner">
      <!-- 1. Timeline Tab -->
      <button
        type="button"
        class="nav-tab-button"
        :class="{ active: uiStore.activeTab === 'timeline' }"
        @click="handleTabClick('timeline')"
        aria-label="Timeline"
        :aria-current="uiStore.activeTab === 'timeline' ? 'page' : undefined"
      >
        <span class="nav-icon">
          <WolfIcon name="timeline" :size="19" />
        </span>
        <span class="nav-label">Timeline</span>
        <span v-if="uiStore.activeTab === 'timeline'" class="active-indicator-dot"></span>
      </button>

      <!-- 2. Studio Tab -->
      <button
        type="button"
        class="nav-tab-button"
        :class="{ active: uiStore.activeTab === 'studio' }"
        @click="handleTabClick('studio')"
        aria-label="Studio"
        :aria-current="uiStore.activeTab === 'studio' ? 'page' : undefined"
      >
        <span class="nav-icon">
          <WolfIcon name="studio" :size="19" />
        </span>
        <span class="nav-label">Studio</span>
        <span v-if="uiStore.activeTab === 'studio'" class="active-indicator-dot"></span>
      </button>

      <!-- 3. Center Elevated Action Button (+ Quick Capture) -->
      <div class="fab-center-slot">
        <button
          type="button"
          class="center-fab-btn"
          @click="handleQuickCapture"
          aria-label="Quick Capture Note"
          title="Quick Capture Note / Task"
        >
          <WolfIcon name="plus" :size="22" :strokeWidth="2.5" />
        </button>
      </div>

      <!-- 4. Roadmap Tab -->
      <button
        type="button"
        class="nav-tab-button"
        :class="{ active: uiStore.activeTab === 'roadmap' }"
        @click="handleTabClick('roadmap')"
        aria-label="Roadmap"
        :aria-current="uiStore.activeTab === 'roadmap' ? 'page' : undefined"
      >
        <span class="nav-icon">
          <WolfIcon name="roadmap" :size="19" />
        </span>
        <span class="nav-label">Roadmap</span>
        <span v-if="uiStore.activeTab === 'roadmap'" class="active-indicator-dot"></span>
      </button>

      <!-- 5. Vault Tab -->
      <button
        type="button"
        class="nav-tab-button"
        :class="{ active: uiStore.activeTab === 'secrets' }"
        @click="handleTabClick('secrets')"
        aria-label="Vault"
        :aria-current="uiStore.activeTab === 'secrets' ? 'page' : undefined"
      >
        <span class="nav-icon">
          <WolfIcon name="vault" :size="19" />
        </span>
        <span class="nav-label">Vault</span>
        <span v-if="uiStore.activeTab === 'secrets'" class="active-indicator-dot"></span>
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
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.55);
}

.bottom-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 56px;
  max-width: 520px;
  margin: 0 auto;
  padding: 0 8px;
  position: relative;
}

.nav-tab-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 48px;
  min-width: 52px;
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
  touch-action: manipulation;
}

.nav-tab-button:active {
  transform: scale(0.92);
}

.nav-icon {
  font-size: 18px;
  line-height: 1;
  opacity: 0.8;
  transition: transform 0.15s ease, opacity 0.15s ease;
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
  opacity: 1;
  transform: translateY(-1px);
}

.active-indicator-dot {
  position: absolute;
  top: 3px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--emerald-bright, #fbbf24);
  box-shadow: 0 0 6px var(--emerald-bright, #fbbf24);
}

/* Center Elevated FAB */
.fab-center-slot {
  flex: 0 0 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.center-fab-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #080501;
  border: 3px solid var(--bg-card, #120e06);
  box-shadow: 0 4px 18px rgba(245, 158, 11, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transform: translateY(-12px);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.center-fab-btn:active {
  transform: translateY(-8px) scale(0.94);
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.35);
}

/* Accessible focus ring */
.nav-tab-button:focus-visible,
.center-fab-btn:focus-visible {
  outline: 2px solid var(--border-focus, #fbbf24);
  outline-offset: -2px;
}

@media (max-width: 768px) {
  .mobile-bottom-nav {
    display: block;
  }
}
</style>

