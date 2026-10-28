<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";
import {
  generateClientDossierHtml,
  downloadClientDossierFile,
  openClientDossierInNewTab,
  type DossierOptions,
} from "@/services/clientDossierExporter";
import { kokoroVoice } from "@/services/voiceGuide";

const uiStore = useUiStore();
const notesStore = useNotesStore();

// Target note (either specifically targeted or currently active note)
const targetNote = computed(() => {
  if (uiStore.publishWebTargetNoteId) {
    const found = notesStore.notes.find((n) => n.id === uiStore.publishWebTargetNoteId);
    if (found) return found;
  }
  return notesStore.selectedNote || notesStore.notes[0] || null;
});

// Publishing Options
const selectedTheme = ref<"emerald" | "light" | "amber" | "cyan" | "obsidian">("emerald");
const includeToc = ref(true);
const includeTimeline = ref(true);
const includeResources = ref(true);
const includeMoodGallery = ref(true);
const includeAiDebates = ref(true);
const authorName = ref("Principal Sovereign Architect");
const organization = ref("Wolfitway Sovereign Node");
const previewViewport = ref<"desktop" | "tablet" | "mobile">("desktop");

// Live generated HTML
const generatedHtml = ref("");
const generatedFilename = ref("");
const generatedHash = ref("");
const isCompiling = ref(false);

async function compileSite() {
  if (!targetNote.value) return;
  isCompiling.value = true;
  try {
    const options: DossierOptions = {
      siteMode: true,
      theme: selectedTheme.value,
      includeTableOfContents: includeToc.value,
      includeTimeline: includeTimeline.value,
      includeResources: includeResources.value,
      includeMoodGallery: includeMoodGallery.value,
      includeAiDebates: includeAiDebates.value,
      authorName: authorName.value,
      organization: organization.value,
    };
    const res = await generateClientDossierHtml(targetNote.value, options);
    generatedHtml.value = res.html;
    generatedFilename.value = res.filename;
    generatedHash.value = res.integrityHash;
  } catch (err) {
    console.error("Site compilation error:", err);
  } finally {
    isCompiling.value = false;
  }
}

// Recompile whenever options or target note change
watch(
  [
    targetNote,
    selectedTheme,
    includeToc,
    includeTimeline,
    includeResources,
    includeMoodGallery,
    includeAiDebates,
    authorName,
    organization,
  ],
  () => {
    compileSite();
  },
  { deep: true }
);

onMounted(() => {
  compileSite();
});

function handleOpenInNewTab() {
  if (!generatedHtml.value) return;
  openClientDossierInNewTab(generatedHtml.value);
  kokoroVoice.playHeartChime("affirm");
  uiStore.showToast("🌐 Opened live interactive website in new browser tab ✓");
}

function handleDownloadHtml() {
  if (!generatedHtml.value || !generatedFilename.value) return;
  downloadClientDossierFile(generatedHtml.value, generatedFilename.value);
  kokoroVoice.playHeartChime("affirm");
  uiStore.showToast(`📥 Downloaded "${generatedFilename.value}" (Standalone HTML Website) ✓`);
}

function handleCopyHtml() {
  if (!generatedHtml.value) return;
  navigator.clipboard.writeText(generatedHtml.value).then(() => {
    kokoroVoice.playHeartChime("listen");
    uiStore.showToast("📋 Standalone Website HTML copied to clipboard ✓");
  });
}

function closeModal() {
  uiStore.closePublishWebModal();
}
</script>

<template>
  <div v-if="uiStore.showPublishWebModal" class="publish-modal-overlay" @click.self="closeModal">
    <div class="publish-modal-container" role="dialog" aria-modal="true" aria-label="Publish to Web &amp; Notion Sites">
      <!-- Modal Header -->
      <div class="publish-modal-header">
        <div class="modal-title-col">
          <div class="modal-title-row">
            <span class="globe-icon">🌐</span>
            <h2 class="modal-title">Publish to Web / Notion-Style Site</h2>
            <span class="badge-sovereign">Zero-Cloud Offline HTML</span>
          </div>
          <p class="modal-sub">
            Convert <strong>"{{ targetNote?.title || 'Selected Note' }}"</strong> into a self-contained, responsive interactive website ready for Vercel, Netlify, or direct sharing.
          </p>
        </div>
        <button type="button" class="btn-close-modal" @click="closeModal" title="Close (Esc)">✕</button>
      </div>

      <!-- Main Body: Config Sidebar + Live Preview Iframe -->
      <div class="publish-modal-content">
        <!-- Configuration Controls Panel -->
        <div class="publish-config-sidebar">
          <div class="config-group">
            <label class="config-label">Color Theme</label>
            <div class="theme-pill-selector">
              <button
                type="button"
                class="theme-pill-btn"
                :class="{ active: selectedTheme === 'emerald' }"
                @click="selectedTheme = 'emerald'"
              >
                🌲 Emerald
              </button>
              <button
                type="button"
                class="theme-pill-btn"
                :class="{ active: selectedTheme === 'obsidian' }"
                @click="selectedTheme = 'obsidian'"
              >
                🌑 Obsidian
              </button>
              <button
                type="button"
                class="theme-pill-btn"
                :class="{ active: selectedTheme === 'light' }"
                @click="selectedTheme = 'light'"
              >
                ☀️ Solar Light
              </button>
              <button
                type="button"
                class="theme-pill-btn"
                :class="{ active: selectedTheme === 'amber' }"
                @click="selectedTheme = 'amber'"
              >
                🐺 Amber
              </button>
              <button
                type="button"
                class="theme-pill-btn"
                :class="{ active: selectedTheme === 'cyan' }"
                @click="selectedTheme = 'cyan'"
              >
                💎 Cyan
              </button>
            </div>
          </div>

          <div class="config-group">
            <label class="config-label">Website Components</label>
            <div class="toggles-list">
              <label class="toggle-option">
                <input type="checkbox" v-model="includeToc" />
                <span>📑 Floating Table of Contents</span>
              </label>
              <label class="toggle-option">
                <input type="checkbox" v-model="includeTimeline" />
                <span>⏱️ Milestone Timeline Log</span>
              </label>
              <label class="toggle-option">
                <input type="checkbox" v-model="includeMoodGallery" />
                <span>🖼️ Visual Mood Gallery</span>
              </label>
              <label class="toggle-option">
                <input type="checkbox" v-model="includeResources" />
                <span>🔖 Reference Links &amp; Bookmarks</span>
              </label>
              <label class="toggle-option">
                <input type="checkbox" v-model="includeAiDebates" />
                <span>🤖 AI Multi-Model Decisions</span>
              </label>
            </div>
          </div>

          <div class="config-group">
            <label class="config-label">Author &amp; Attribution</label>
            <input
              type="text"
              v-model="authorName"
              class="config-text-input"
              placeholder="Author Name"
            />
            <input
              type="text"
              v-model="organization"
              class="config-text-input"
              placeholder="Organization / Workspace"
              style="margin-top: 6px;"
            />
          </div>

          <!-- Integrity Seal info -->
          <div class="seal-info-box">
            <span class="seal-title">🛡️ Cryptographic Integrity Seal</span>
            <span class="seal-hash">{{ generatedHash || 'Calculating SHA-256...' }}</span>
            <span class="seal-sub">Air-gapped verification baked directly into the standalone HTML file.</span>
          </div>
        </div>

        <!-- Live Interactive Website Preview Area -->
        <div class="publish-preview-area">
          <div class="preview-toolbar">
            <div class="viewport-buttons">
              <button
                type="button"
                class="btn-viewport"
                :class="{ active: previewViewport === 'desktop' }"
                @click="previewViewport = 'desktop'"
                title="Desktop View"
              >
                🖥️ Desktop
              </button>
              <button
                type="button"
                class="btn-viewport"
                :class="{ active: previewViewport === 'tablet' }"
                @click="previewViewport = 'tablet'"
                title="Tablet View"
              >
                📱 Tablet (768px)
              </button>
              <button
                type="button"
                class="btn-viewport"
                :class="{ active: previewViewport === 'mobile' }"
                @click="previewViewport = 'mobile'"
                title="Mobile View"
              >
                📱 Mobile (380px)
              </button>
            </div>
            <span class="preview-url-badge">live-sandbox://{{ generatedFilename }}</span>
          </div>

          <div class="preview-frame-wrapper" :class="`viewport-${previewViewport}`">
            <iframe
              v-if="generatedHtml"
              class="live-site-iframe"
              :srcdoc="generatedHtml"
              sandbox="allow-scripts allow-same-origin allow-popups"
              title="Interactive Website Live Preview"
            ></iframe>
            <div v-else class="preview-loading">
              <span>Compiling standalone website...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="publish-modal-footer">
        <div class="footer-left">
          <span class="status-indicator">● Standalone Ready</span>
          <span class="file-size-info">{{ generatedFilename }}</span>
        </div>
        <div class="footer-actions">
          <button type="button" class="btn-pub-action outline" @click="handleCopyHtml" title="Copy Raw HTML">
            <span>📋 Copy HTML</span>
          </button>
          <button type="button" class="btn-pub-action outline" @click="handleOpenInNewTab" title="Open in Full Browser Tab">
            <span>🌐 Open in Browser</span>
          </button>
          <button type="button" class="btn-pub-action primary" @click="handleDownloadHtml" title="Download standalone .html file">
            <span>📥 Download Website (.html)</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.publish-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.publish-modal-container {
  background: var(--bg-card, #0b1410);
  border: 1px solid var(--border-card, #162a21);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75), 0 0 32px var(--border-glow, rgba(16, 185, 129, 0.2));
  border-radius: 16px;
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  max-height: 880px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.publish-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-card, #162a21);
  background: var(--bg-surface, #0f1c16);
}

.modal-title-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.globe-icon {
  font-size: 20px;
}

.modal-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-white, #ffffff);
  margin: 0;
  letter-spacing: -0.01em;
}

.badge-sovereign {
  font-size: 11px;
  font-weight: 700;
  background: var(--emerald-pill-bg, #063324);
  color: var(--emerald-bright, #34d399);
  border: 1px solid var(--border-subtle, #14281f);
  padding: 2px 8px;
  border-radius: 12px;
}

.modal-sub {
  font-size: 12.5px;
  color: var(--text-secondary, #9ca3af);
  margin: 0;
}

.modal-sub strong {
  color: var(--text-white, #ffffff);
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: var(--text-muted, #6ee7b7);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.btn-close-modal:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-white, #ffffff);
}

.publish-modal-content {
  display: grid;
  grid-template-columns: 310px 1fr;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 860px) {
  .publish-modal-content {
    grid-template-columns: 1fr;
  }
  .publish-config-sidebar {
    display: none;
  }
}

.publish-config-sidebar {
  border-right: 1px solid var(--border-card, #162a21);
  background: var(--bg-card, #0b1410);
  padding: 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted, #6ee7b7);
}

.theme-pill-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.theme-pill-btn {
  background: var(--bg-inner, #070e0b);
  border: 1px solid var(--border-subtle, #14281f);
  color: var(--text-secondary, #9ca3af);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-pill-btn:hover {
  border-color: var(--emerald-main, #10b981);
  color: var(--text-white, #ffffff);
}

.theme-pill-btn.active {
  background: var(--emerald-pill-bg, #063324);
  border-color: var(--emerald-bright, #34d399);
  color: var(--emerald-bright, #34d399);
  font-weight: 700;
}

.toggles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-secondary, #9ca3af);
  cursor: pointer;
}

.toggle-option input[type="checkbox"] {
  accent-color: var(--emerald-main, #10b981);
  width: 15px;
  height: 15px;
}

.config-text-input {
  background: var(--bg-inner, #070e0b);
  border: 1px solid var(--border-card, #162a21);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text-white, #ffffff);
  font-size: 12.5px;
  outline: none;
}

.config-text-input:focus {
  border-color: var(--emerald-main, #10b981);
}

.seal-info-box {
  background: var(--bg-inner, #070e0b);
  border: 1px solid var(--border-card, #162a21);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.seal-title {
  font-size: 11px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
}

.seal-hash {
  font-family: monospace;
  font-size: 10px;
  color: var(--text-secondary, #9ca3af);
  word-break: break-all;
}

.seal-sub {
  font-size: 10.5px;
  color: var(--text-muted, #6ee7b7);
}

.publish-preview-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--bg-inner, #070e0b);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-card, #162a21);
  background: var(--bg-surface, #0f1c16);
  flex-wrap: wrap;
  gap: 10px;
}

.viewport-buttons {
  display: flex;
  gap: 6px;
}

.btn-viewport {
  background: var(--bg-card, #0b1410);
  border: 1px solid var(--border-card, #162a21);
  color: var(--text-secondary, #9ca3af);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-viewport.active {
  background: var(--emerald-pill-bg, #063324);
  border-color: var(--emerald-bright, #34d399);
  color: var(--emerald-bright, #34d399);
}

.preview-url-badge {
  font-family: monospace;
  font-size: 11px;
  color: var(--text-muted, #6ee7b7);
}

.preview-frame-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  padding: 12px;
  overflow: hidden;
  transition: all 0.25s ease;
}

.viewport-desktop .live-site-iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.viewport-tablet .live-site-iframe {
  width: 768px;
  max-width: 100%;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.8);
}

.viewport-mobile .live-site-iframe {
  width: 380px;
  max-width: 100%;
  height: 100%;
  border-radius: 16px;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.8);
}

.live-site-iframe {
  border: 1px solid var(--border-card, #162a21);
  background: #ffffff;
}

.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #9ca3af);
  font-size: 13px;
}

.publish-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--border-card, #162a21);
  background: var(--bg-surface, #0f1c16);
  flex-wrap: wrap;
  gap: 12px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary, #9ca3af);
}

.status-indicator {
  color: var(--emerald-bright, #34d399);
  font-weight: 700;
}

.file-size-info {
  font-family: monospace;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-pub-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-pub-action.outline {
  background: var(--bg-card, #0b1410);
  border: 1px solid var(--border-card, #162a21);
  color: var(--text-white, #ffffff);
}

.btn-pub-action.outline:hover {
  border-color: var(--emerald-main, #10b981);
  background: var(--bg-inner, #070e0b);
}

.btn-pub-action.primary {
  background: var(--emerald-main, #10b981);
  border: 1px solid var(--emerald-bright, #34d399);
  color: var(--bg-canvas, #040c08);
}

.btn-pub-action.primary:hover {
  background: var(--emerald-bright, #34d399);
  box-shadow: 0 0 16px var(--border-glow, rgba(16, 185, 129, 0.4));
  transform: translateY(-1px);
}
</style>
