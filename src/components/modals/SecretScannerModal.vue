<script setup lang="ts">
import { ref } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useVaultStore } from "@/stores/useVaultStore";
import { scanTextForCredentials } from "@/services/scanner";
import type { ScannedCredentialCandidate } from "@/types";

const uiStore = useUiStore();
const vaultStore = useVaultStore();

const rawText = ref("");
const scannedItems = ref<ScannedCredentialCandidate[]>([]);
const hasScanned = ref(false);
const isDragOver = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

function handleDetect() {
  if (!rawText.value.trim()) return;
  scannedItems.value = scanTextForCredentials(rawText.value);
  hasScanned.value = true;
}

function handleFileDrop(e: DragEvent) {
  isDragOver.value = false;
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;
  processFile(files[0]);
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    processFile(target.files[0]);
  }
}

function processFile(file: File) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const text = ev.target?.result as string;
    if (text) {
      rawText.value = text;
      scannedItems.value = scanTextForCredentials(text);
      hasScanned.value = true;
    }
  };
  reader.readAsText(file);
}

function toggleSelectAll() {
  const allSelected = scannedItems.value.every((s) => s.selected);
  scannedItems.value.forEach((s) => {
    s.selected = !allSelected;
  });
}

async function handleSaveSelected() {
  const selected = scannedItems.value.filter((s) => s.selected);
  if (selected.length === 0) {
    alert("Please select at least one credential to encrypt.");
    return;
  }

  for (const s of selected) {
    await vaultStore.saveSecret({
      service: s.service,
      category: s.category,
      username: s.username,
      password: s.password,
      host: s.host,
      notes: s.notes,
    });
  }

  uiStore.showSecretScanner = false;
  uiStore.showToast(`Successfully encrypted ${selected.length} credentials into Secret Vault ✓`);
}
</script>

<template>
  <div v-if="uiStore.showSecretScanner" class="modal-overlay" @click.self="uiStore.showSecretScanner = false">
    <div class="modal-window scanner-modal-window">
      <!-- Modal Header -->
      <div class="modal-header-centered">
        <div class="modal-brand">
          <img src="/assets/wolf-logo.png" alt="Wolf Logo" class="modal-wolf-logo" />
          <span class="modal-brand-text">WOLF TIMELINE</span>
        </div>
        <h2 class="modal-title">⚡ Smart Secret &amp; Credential Scanner</h2>
        <p class="modal-subtitle">
          Drop a <code>.txt</code> or <code>.env</code> file or paste messy text. Original files remain 100% untouched.
        </p>
      </div>

      <!-- Scanner Body -->
      <div class="scanner-body">
        <!-- Dropzone -->
        <div
          class="scanner-dropzone"
          :class="{ dragover: isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleFileDrop"
          @click="fileInputRef?.click()"
        >
          <div class="drop-icon">📂</div>
          <div class="drop-text">
            <strong>Drag &amp; drop your .txt or .env file here</strong>, or <span class="browse-link">browse file</span>
          </div>
          <span class="drop-sub">OpenAI, Stripe, Google, GitHub, AWS, DB strings, user:pass formats</span>
          <input
            ref="fileInputRef"
            type="file"
            accept=".txt,.env,.json,.csv,.md,.conf,.cfg,.ini"
            style="display: none"
            @change="handleFileSelect"
          />
        </div>

        <!-- Raw Paste Area -->
        <div class="paste-section">
          <label class="paste-label">Or Paste Raw Content Directly:</label>
          <textarea
            v-model="rawText"
            class="paste-textarea"
            rows="4"
            placeholder="Paste .env, notes, or credentials text here...&#10;e.g. OPENAI_API_KEY=sk-proj-...&#10;postgres://admin:secret@db.host.com:5432/main"
          ></textarea>
        </div>

        <button type="button" class="btn-detect" @click="handleDetect">
          ⚡ Detect &amp; Extract Credentials
        </button>

        <!-- Extraction Results View -->
        <div v-if="hasScanned" class="results-wrap">
          <div class="results-header">
            <span class="results-title">
              Detected Credentials ({{ scannedItems.length }})
            </span>
            <button type="button" class="btn-toggle-all" @click="toggleSelectAll">
              {{ scannedItems.every((s) => s.selected) ? "Deselect All" : "Select All" }}
            </button>
          </div>

          <div v-if="scannedItems.length > 0" class="results-list">
            <div v-for="item in scannedItems" :key="item.id" class="scanned-row">
              <input v-model="item.selected" type="checkbox" class="scanned-checkbox" />
              <div class="scanned-badge">{{ item.category.toUpperCase() }}</div>
              <div class="scanned-info">
                <span class="scanned-serv">{{ item.service }}</span>
                <span class="scanned-meta">
                  {{ item.username ? `User: ${item.username} • ` : "" }}{{ item.notes }}
                </span>
              </div>
              <span class="scanned-preview">••••••••••••</span>
            </div>
          </div>

          <div v-else class="results-empty">
            <span>No sensitive credentials detected in the provided text.</span>
          </div>

          <div v-if="scannedItems.length > 0" class="results-footer">
            <button type="button" class="btn-encrypt-selected" @click="handleSaveSelected">
              🔒 Encrypt Selected to Secret Vault
            </button>
          </div>
        </div>
      </div>

      <button type="button" class="btn-corner-close" @click="uiStore.showSecretScanner = false">✕</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 6, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.scanner-modal-window {
  position: relative;
  width: 640px;
  max-width: 95vw;
  background: var(--bg-card, #09120e);
  border: 1px solid var(--border-card, #162c21);
  border-radius: 18px;
  padding: 28px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.1);
}

.modal-header-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 16px;
}

.modal-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.modal-wolf-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.modal-brand-text {
  font-size: 11px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  letter-spacing: 0.1em;
}

.modal-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-primary, #fff);
  margin-bottom: 4px;
}

.modal-subtitle {
  font-size: 12px;
  color: var(--text-secondary, #9ca3af);
}

.modal-subtitle code {
  background: var(--bg-inner, #11221a);
  color: var(--emerald-bright, #34d399);
  padding: 1px 4px;
  border-radius: 4px;
}

.scanner-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.scanner-dropzone {
  border: 2px dashed var(--border-focus, rgba(16, 185, 129, 0.35));
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.04));
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scanner-dropzone:hover,
.scanner-dropzone.dragover {
  border-color: var(--emerald-bright, #34d399);
  background: var(--emerald-pill-border, rgba(16, 185, 129, 0.08));
}

.drop-icon {
  font-size: 26px;
  margin-bottom: 4px;
}

.drop-text {
  font-size: 13px;
  color: var(--text-primary, #e2e8f0);
  margin-bottom: 2px;
}

.browse-link {
  color: var(--emerald-bright, #34d399);
  text-decoration: underline;
  font-weight: 700;
}

.drop-sub {
  font-size: 11px;
  color: var(--text-dim, #6b7280);
}

.paste-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.paste-label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary, #9ca3af);
}

.paste-textarea {
  width: 100%;
  background: var(--bg-inner, #050b08);
  border: 1px solid var(--border-card, #142820);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: var(--font-mono, monospace);
  font-size: 11.5px;
  color: var(--text-primary, #fff);
  resize: vertical;
  outline: none;
}

.paste-textarea:focus {
  border-color: var(--emerald-bright, #34d399);
}

.btn-detect {
  width: 100%;
  background: var(--emerald-main, #10b981);
  color: #03100a;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.25);
  transition: all 0.15s ease;
}

.btn-detect:hover {
  filter: brightness(1.15);
}

.results-wrap {
  border-top: 1px solid var(--border-subtle, #142820);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary, #fff);
}

.btn-toggle-all {
  background: transparent;
  border: none;
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.results-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scanned-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-inner, #050b08);
  border: 1px solid var(--border-card, #142820);
  border-radius: 8px;
  padding: 8px 12px;
}

.scanned-checkbox {
  accent-color: var(--emerald-main, #10b981);
  width: 15px;
  height: 15px;
}

.scanned-badge {
  font-size: 9.5px;
  font-weight: 800;
  background: var(--emerald-pill-bg, #11221a);
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 4px;
}

.scanned-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scanned-serv {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary, #fff);
}

.scanned-meta {
  font-size: 10.5px;
  color: var(--text-dim, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scanned-preview {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--text-dim, #4b5563);
  letter-spacing: 0.1em;
}

.results-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-dim, #6b7280);
  font-size: 12px;
}

.results-footer {
  margin-top: 4px;
}

.btn-encrypt-selected {
  width: 100%;
  background: var(--emerald-main, #10b981);
  color: #03100a;
  border: none;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
}

.btn-corner-close {
  position: absolute;
  top: 16px;
  right: 18px;
  background: transparent;
  border: none;
  color: var(--text-dim, #6b7280);
  font-size: 16px;
  cursor: pointer;
}
</style>
