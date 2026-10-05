<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import AppTopbar from "@/components/layout/AppTopbar.vue";
import TimelineView from "@/views/TimelineView.vue";
import StudioView from "@/views/StudioView.vue";
import RoadmapView from "@/views/RoadmapView.vue";
import BookmarksView from "@/views/BookmarksView.vue";
import VaultView from "@/views/VaultView.vue";
import SettingsView from "@/views/SettingsView.vue";

import CommandPalette from "@/components/modals/CommandPalette.vue";
import QuickCaptureModal from "@/components/modals/QuickCaptureModal.vue";
import SecretScannerModal from "@/components/modals/SecretScannerModal.vue";
import SecretEditorModal from "@/components/modals/SecretEditorModal.vue";
import LicenseActivationModal from "@/components/modals/LicenseActivationModal.vue";
import FocusEditorModal from "@/components/modals/FocusEditorModal.vue";
import ImageLightboxModal from "@/components/modals/ImageLightboxModal.vue";
import AiExplorationModal from "@/components/modals/AiExplorationModal.vue";
import BookmarkImporterModal from "@/components/modals/BookmarkImporterModal.vue";
import VoiceGuideModal from "@/components/modals/VoiceGuideModal.vue";

import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { useVaultStore } from "@/stores/useVaultStore";
import { useLicenseStore } from "@/stores/useLicenseStore";
import { useShortcutsStore } from "@/stores/useShortcutsStore";
import { useBookmarksStore } from "@/stores/useBookmarksStore";

const uiStore = useUiStore();
const notesStore = useNotesStore();
const roadmapStore = useRoadmapStore();
const vaultStore = useVaultStore();
const licenseStore = useLicenseStore();
const shortcutsStore = useShortcutsStore();
const bookmarksStore = useBookmarksStore();

function handleGlobalKeyDown(e: KeyboardEvent) {
  // Check if target is an editable input or textarea
  const target = e.target as HTMLElement | null;
  const isEditable = Boolean(
    target && (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    )
  );

  // 1. Command Palette (works everywhere)
  if (shortcutsStore.matchesEvent("command_palette", e)) {
    e.preventDefault();
    uiStore.showCommandPalette = !uiStore.showCommandPalette;
    return;
  }

  // 2. Navigation Tab switching (works everywhere with modifier)
  if (shortcutsStore.matchesEvent("tab_timeline", e)) {
    e.preventDefault();
    uiStore.setTab("timeline");
    return;
  }
  if (shortcutsStore.matchesEvent("tab_studio", e)) {
    e.preventDefault();
    uiStore.setTab("studio");
    return;
  }
  if (shortcutsStore.matchesEvent("tab_roadmap", e)) {
    e.preventDefault();
    uiStore.setTab("roadmap");
    return;
  }
  if (shortcutsStore.matchesEvent("tab_bookmarks", e)) {
    e.preventDefault();
    uiStore.setTab("bookmarks");
    return;
  }
  if (shortcutsStore.matchesEvent("tab_secrets", e)) {
    e.preventDefault();
    uiStore.setTab("secrets");
    return;
  }
  if (shortcutsStore.matchesEvent("tab_settings", e)) {
    e.preventDefault();
    uiStore.setTab("settings");
    return;
  }

  // 3. Emergency Vault Lock
  if (shortcutsStore.matchesEvent("lock_vault", e)) {
    e.preventDefault();
    vaultStore.lockVault();
    uiStore.showToast("🔒 Secret Vault locked immediately");
    return;
  }

  // 4. Focus Editor Mode
  if (shortcutsStore.matchesEvent("focus_mode", e)) {
    e.preventDefault();
    uiStore.showFocusEditor = !uiStore.showFocusEditor;
    return;
  }

  // 5. Export Data
  if (shortcutsStore.matchesEvent("export_data", e)) {
    e.preventDefault();
    uiStore.setTab("settings");
    uiStore.showToast("📦 Opening export and backup center...");
    return;
  }

  // 6. Quick Capture (if not inside an active modal)
  if (shortcutsStore.matchesEvent("quick_capture", e)) {
    if (!uiStore.showQuickCapture && !uiStore.showFocusEditor) {
      e.preventDefault();
      uiStore.showQuickCapture = true;
      return;
    }
  }

  // 7. New Note / Document
  if (shortcutsStore.matchesEvent("new_note", e)) {
    e.preventDefault();
    notesStore.addNote({
      title: "Untitled Document",
      body: "# Untitled Document\n\nBegin drafting sovereign strategy, architecture, or notes...",
      tags: ["draft"],
      kind: "idea",
      status: "ideation",
    }).then(() => {
      uiStore.showToast("Created new document ✓");
      uiStore.setTab("studio");
    });
    return;
  }
}

function handleUserActivity() {
  vaultStore.resetAutoLock();
}

onMounted(async () => {
  window.addEventListener("keydown", handleGlobalKeyDown);
  window.addEventListener("mousemove", handleUserActivity, { passive: true });
  window.addEventListener("click", handleUserActivity, { passive: true });

  // Initialize theme, font, scale & effects
  const savedTheme = localStorage.getItem("wolf_theme") || "obsidian";
  if (savedTheme === "obsidian") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = savedTheme;
  }

  const savedFont = localStorage.getItem("wolf_font") || "jakarta";
  document.documentElement.dataset.font = savedFont;

  const savedScale = localStorage.getItem("wolf_font_scale");
  if (savedScale) {
    document.documentElement.style.fontSize = `${savedScale}px`;
  }

  const savedGlow = localStorage.getItem("wolf_glow");
  if (savedGlow === "false") {
    document.documentElement.classList.add("no-glow");
  }

  const savedGlass = localStorage.getItem("wolf_glass");
  if (savedGlass === "false") {
    document.documentElement.classList.add("no-glass");
  }

  const savedSpeed = localStorage.getItem("wolf_reorder_speed") || "smooth";
  let transitionVal = "transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease";
  if (savedSpeed === "fast") {
    transitionVal = "transform 0.15s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.15s ease";
  } else if (savedSpeed === "cinematic") {
    transitionVal = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.3s ease";
  }
  document.documentElement.style.setProperty("--drag-transition", transitionVal);

  await licenseStore.checkLicense();
  await notesStore.loadNotes();
  await bookmarksStore.loadBookmarks();
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
        <BookmarksView v-else-if="uiStore.activeTab === 'bookmarks'" />
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
    <AiExplorationModal />
    <BookmarkImporterModal />
    <VoiceGuideModal />

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
  min-height: 0;
  overflow: hidden;
}

.view-container {
  flex: 1;
  display: flex;
  min-height: 0;
  height: calc(100vh - 56px);
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
