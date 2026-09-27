<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import AppTopbar from "@/components/layout/AppTopbar.vue";
import TimelineView from "@/views/TimelineView.vue";
import StudioView from "@/views/StudioView.vue";
import RoadmapView from "@/views/RoadmapView.vue";
import VaultView from "@/views/VaultView.vue";
import SettingsView from "@/views/SettingsView.vue";

import CommandPalette from "@/components/modals/CommandPalette.vue";
import QuickCaptureModal from "@/components/modals/QuickCaptureModal.vue";
import SecretScannerModal from "@/components/modals/SecretScannerModal.vue";
import SecretEditorModal from "@/components/modals/SecretEditorModal.vue";
import LicenseActivationModal from "@/components/modals/LicenseActivationModal.vue";
import FocusEditorModal from "@/components/modals/FocusEditorModal.vue";
import ImageLightboxModal from "@/components/modals/ImageLightboxModal.vue";

import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { useVaultStore } from "@/stores/useVaultStore";
import { useLicenseStore } from "@/stores/useLicenseStore";

const uiStore = useUiStore();
const notesStore = useNotesStore();
const roadmapStore = useRoadmapStore();
const vaultStore = useVaultStore();
const licenseStore = useLicenseStore();

function handleGlobalKeyDown(e: KeyboardEvent) {
  // ⌘K for Command Palette
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    uiStore.showCommandPalette = !uiStore.showCommandPalette;
  }
  // ⌘+Enter for Quick Capture (if not in text area)
  else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !uiStore.showQuickCapture && !uiStore.showFocusEditor) {
    e.preventDefault();
    uiStore.showQuickCapture = true;
  }
}

function handleUserActivity() {
  vaultStore.resetAutoLock();
}

onMounted(async () => {
  window.addEventListener("keydown", handleGlobalKeyDown);
  window.addEventListener("mousemove", handleUserActivity, { passive: true });
  window.addEventListener("click", handleUserActivity, { passive: true });

  await licenseStore.checkLicense();
  await notesStore.loadNotes();
  roadmapStore.loadRoadmap();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeyDown);
  window.removeEventListener("mousemove", handleUserActivity);
  window.removeEventListener("click", handleUserActivity);
});
</script>

<template>
  <div class="wolf-app-shell">
    <!-- Main Content Area -->
    <div class="app-main-viewport">
      <AppTopbar />

      <!-- Active Workspace View -->
      <main class="view-container">
        <TimelineView v-if="uiStore.activeTab === 'timeline'" />
        <StudioView v-else-if="uiStore.activeTab === 'studio'" />
        <RoadmapView v-else-if="uiStore.activeTab === 'roadmap'" />
        <VaultView v-else-if="uiStore.activeTab === 'secrets'" />
        <SettingsView v-else-if="uiStore.activeTab === 'settings'" />
      </main>
    </div>

    <!-- Modals & Overlays -->
    <CommandPalette />
    <QuickCaptureModal />
    <SecretScannerModal />
    <SecretEditorModal />
    <LicenseActivationModal />
    <FocusEditorModal />
    <ImageLightboxModal />

    <!-- Toast Notification -->
    <div v-if="uiStore.toastMessage" class="global-toast">
      {{ uiStore.toastMessage }}
    </div>
  </div>
</template>

<style scoped>
.wolf-app-shell {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-canvas, #040c08);
}

.app-main-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.view-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-canvas, #040c08);
}


.global-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #091a12;
  border: 1px solid var(--emerald-bright, #34d399);
  color: #fff;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(16, 185, 129, 0.2);
  z-index: 20000;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
