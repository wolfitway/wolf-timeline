<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useVaultStore } from "@/stores/useVaultStore";
import { useUiStore } from "@/stores/useUiStore";
import type { VaultSecretItem } from "@/types";

const vaultStore = useVaultStore();
const uiStore = useUiStore();

const passphrase = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);
const visibleSecretIds = ref<Set<string>>(new Set());

onMounted(async () => {
  await vaultStore.checkInit();
});

async function handleUnlock() {
  if (!passphrase.value) {
    errorMessage.value = "Please enter your master passphrase.";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";
  const res = await vaultStore.unlockVault(passphrase.value);
  isSubmitting.value = false;

  if (res.success) {
    passphrase.value = "";
    uiStore.showToast("Secret Vault unlocked in RAM ✓");
  } else {
    errorMessage.value = res.error || "Unlock failed.";
  }
}

function toggleSecretVisibility(id: string) {
  if (visibleSecretIds.value.has(id)) {
    visibleSecretIds.value.delete(id);
  } else {
    visibleSecretIds.value.add(id);
  }
}

function copyToClipboard(val?: string) {
  if (!val) return;
  navigator.clipboard.writeText(val);
  uiStore.showToast("Copied to clipboard ✓");
}
</script>

<template>
  <div class="vault-view">
    <!-- LOCKED STATE SCREEN -->
    <div v-if="!vaultStore.isUnlocked" class="vault-locked-wrap">
      <div class="vault-locked-card">
        <div class="vault-shield-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <div class="vault-brand">
          <img src="/assets/wolf-logo.png" alt="Wolf Logo" class="brand-img" />
          <span class="brand-tag">WOLF TIMELINE</span>
        </div>

        <h2 class="vault-headline">
          {{ vaultStore.isInitialized ? "Unlock Sovereign Secret Vault" : "Initialize Sovereign Secret Vault" }}
        </h2>
        <p class="vault-sub">
          {{
            vaultStore.isInitialized
              ? "Enter your Master Passphrase to decrypt your API keys and tokens in RAM. Decrypted secrets exist in memory only."
              : "Create your Master Passphrase. Protected with PBKDF2 (100,000 iterations) & AES-256-GCM zero-knowledge encryption."
          }}
        </p>

        <form class="vault-unlock-form" @submit.prevent="handleUnlock">
          <div class="input-row">
            <input
              v-model="passphrase"
              type="password"
              class="pass-input"
              :placeholder="vaultStore.isInitialized ? 'Enter Master Passphrase...' : 'Create Master Passphrase (min 6 chars)...'"
              autocomplete="current-password"
            />
          </div>

          <div v-if="errorMessage" class="vault-error">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-unlock-vault" :disabled="isSubmitting">
            {{ isSubmitting ? "⚡ Decrypting..." : vaultStore.isInitialized ? "🔓 Decrypt & Unlock Vault" : "🔒 Create & Lock Vault" }}
          </button>
        </form>

        <div class="vault-guarantee">
          <span>🔒 Zero-Knowledge 100,000 PBKDF2 • AES-256-GCM • Offline Airgapped</span>
        </div>
      </div>
    </div>

    <!-- UNLOCKED ACTIVE SECRET LOCKER -->
    <div v-else class="vault-unlocked-wrap">
      <!-- Action Bar -->
      <div class="vault-action-bar">
        <div class="vault-search-box">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="vaultStore.searchQuery"
            type="text"
            class="vault-search-input"
            placeholder="Search credentials, services, hosts..."
          />
        </div>

        <div class="vault-category-tabs">
          <button
            type="button"
            class="cat-tab"
            :class="{ active: vaultStore.activeCategory === 'all' }"
            @click="vaultStore.activeCategory = 'all'"
          >
            All ({{ vaultStore.categoryCounts.all }})
          </button>
          <button
            type="button"
            class="cat-tab"
            :class="{ active: vaultStore.activeCategory === 'api' }"
            @click="vaultStore.activeCategory = 'api'"
          >
            ⚡ API Keys ({{ vaultStore.categoryCounts.api }})
          </button>
          <button
            type="button"
            class="cat-tab"
            :class="{ active: vaultStore.activeCategory === 'login' }"
            @click="vaultStore.activeCategory = 'login'"
          >
            👤 Logins ({{ vaultStore.categoryCounts.login }})
          </button>
          <button
            type="button"
            class="cat-tab"
            :class="{ active: vaultStore.activeCategory === 'db' }"
            @click="vaultStore.activeCategory = 'db'"
          >
            🗄️ Databases ({{ vaultStore.categoryCounts.db }})
          </button>
        </div>

        <div class="vault-header-actions">
          <button type="button" class="btn-scan-trigger" @click="uiStore.showSecretScanner = true">
            ⚡ Scan .txt / .env
          </button>
          <button type="button" class="btn-add-secret" @click="uiStore.showSecretEditor = true">
            + Add Secret
          </button>
          <button type="button" class="btn-lock-now" @click="vaultStore.lockVault">
            🔒 Lock ({{ vaultStore.autoLockCountdown }}s)
          </button>
        </div>
      </div>

      <!-- Secrets Grid -->
      <div class="secrets-grid-container">
        <div
          v-for="secret in vaultStore.filteredSecrets"
          :key="secret.id"
          class="secret-card"
        >
          <div class="secret-card-top">
            <span class="secret-category-badge">{{ secret.category.toUpperCase() }}</span>
            <span class="secret-date">{{ new Date(secret.updated_at).toLocaleDateString() }}</span>
          </div>

          <h3 class="secret-service-name">{{ secret.service }}</h3>

          <div v-if="secret.username" class="secret-field-row">
            <span class="field-label">Username:</span>
            <span class="field-value">{{ secret.username }}</span>
            <button type="button" class="btn-copy-mini" @click="copyToClipboard(secret.username)">📋</button>
          </div>

          <div class="secret-field-row password-row">
            <span class="field-label">Secret:</span>
            <span class="field-value mono">
              {{ visibleSecretIds.has(secret.id) ? secret.password : "••••••••••••••••••••" }}
            </span>
            <div class="field-actions">
              <button type="button" class="btn-eye-mini" @click="toggleSecretVisibility(secret.id)">
                {{ visibleSecretIds.has(secret.id) ? "🙈" : "👁️" }}
              </button>
              <button type="button" class="btn-copy-mini" @click="copyToClipboard(secret.password)">📋</button>
            </div>
          </div>

          <div v-if="secret.host" class="secret-field-row">
            <span class="field-label">Host:</span>
            <span class="field-value small">{{ secret.host }}</span>
          </div>

          <div v-if="secret.notes" class="secret-notes-preview">
            {{ secret.notes }}
          </div>

          <div class="secret-card-bottom">
            <button
              type="button"
              class="btn-secret-del"
              @click="vaultStore.deleteSecret(secret.id)"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        <div v-if="vaultStore.filteredSecrets.length === 0" class="secrets-empty-state">
          <div class="empty-icon">🛡️</div>
          <h3>Your Secret Locker is Empty</h3>
          <p>Click "⚡ Scan .txt / .env" or "+ Add Secret" to store zero-knowledge encrypted credentials.</p>
          <div class="empty-actions">
            <button type="button" class="btn-scan-trigger" @click="uiStore.showSecretScanner = true">
              ⚡ Scan .txt / .env
            </button>
            <button type="button" class="btn-add-secret" @click="uiStore.showSecretEditor = true">
              + Add Secret
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vault-view {
  flex: 1;
  height: 100%;
  max-height: 100%;
  background: var(--bg-body, #040c08);
  overflow: hidden;
  display: flex;
}

/* Locked Screen */
.vault-locked-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.vault-locked-card {
  width: 480px;
  max-width: 92vw;
  background: var(--bg-card, #09120e);
  border: 1px solid var(--border-card, #162c21);
  border-radius: 18px;
  padding: 34px 38px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px var(--border-glow, rgba(16, 185, 129, 0.1));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.vault-shield-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.1));
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--emerald-bright, #34d399);
  margin-bottom: 14px;
}

.vault-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.brand-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.brand-tag {
  font-size: 11px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  letter-spacing: 0.1em;
}

.vault-headline {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary, #fff);
  margin-bottom: 6px;
}

.vault-sub {
  font-size: 12px;
  color: var(--text-muted, #9ca3af);
  line-height: 1.5;
  margin-bottom: 18px;
}

.vault-unlock-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pass-input {
  width: 100%;
  background: var(--bg-surface, #050b08);
  border: 1px solid var(--border-card, #142820);
  border-radius: 8px;
  padding: 11px 14px;
  color: var(--text-primary, #fff);
  font-size: 13.5px;
  outline: none;
  text-align: center;
}

.pass-input:focus {
  border-color: var(--border-selected, #34d399);
}

.vault-error {
  font-size: 12px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 6px 10px;
  border-radius: 6px;
}

.btn-unlock-vault {
  width: 100%;
  background: linear-gradient(135deg, var(--emerald-main, #10b981) 0%, var(--emerald-deep, #059669) 100%);
  color: var(--bg-body, #03100a);
  border: none;
  border-radius: 8px;
  padding: 11px 18px;
  font-size: 13.5px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 0 16px var(--border-glow, rgba(16, 185, 129, 0.25));
  transition: all 0.15s ease;
}

.btn-unlock-vault:hover {
  filter: brightness(1.15);
}

.vault-guarantee {
  margin-top: 18px;
  font-size: 10.5px;
  color: var(--text-muted, #6b7280);
}

/* Unlocked Active Locker */
.vault-unlocked-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.vault-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-card, #08110d);
  border-bottom: 1px solid var(--border-subtle, #11221a);
  gap: 12px;
}

.vault-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface, #050b08);
  border: 1px solid var(--border-card, #142820);
  border-radius: 8px;
  padding: 6px 12px;
  width: 240px;
}

.vault-search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 12px;
  color: var(--text-primary, #fff);
  outline: none;
}

.vault-category-tabs {
  display: flex;
  gap: 6px;
}

.cat-tab {
  background: transparent;
  border: 1px solid var(--border-card, #142820);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-gray, #9ca3af);
  cursor: pointer;
}

.cat-tab.active {
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.15));
  border-color: var(--border-selected, rgba(16, 185, 129, 0.4));
  color: var(--text-primary, #fff);
}

.vault-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-scan-trigger {
  background: var(--emerald-pill-bg, #10241b);
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.3));
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--emerald-bright, #34d399);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-add-secret {
  background: linear-gradient(135deg, var(--emerald-main, #10b981) 0%, var(--emerald-deep, #059669) 100%);
  color: var(--bg-body, #03100a);
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.btn-lock-now {
  background: transparent;
  border: 1px solid var(--border-card, #142820);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-gray, #9ca3af);
  font-size: 11.5px;
  cursor: pointer;
}

.secrets-grid-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 24px 24px 80px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  align-content: flex-start;
}

.secret-card {
  background: var(--bg-card, #08120e);
  border: 1px solid var(--border-card, #14281f);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.18s ease;
}
.secret-card:hover {
  border-color: var(--border-selected, rgba(16, 185, 129, 0.4));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px var(--border-glow, rgba(16, 185, 129, 0.1));
}

.secret-card-top {
  display: flex;
  justify-content: space-between;
}

.secret-category-badge {
  font-size: 9.5px;
  font-weight: 800;
  background: var(--bg-surface, #11221a);
  color: var(--emerald-bright, #34d399);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.2));
}

.secret-date {
  font-size: 10.5px;
  color: var(--text-muted, #6b7280);
}

.secret-service-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-primary, #fff);
  margin: 0;
}

.secret-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.field-label {
  font-weight: 700;
  color: var(--text-gray, #9ca3af);
  width: 65px;
}

.field-value {
  flex: 1;
  color: var(--text-primary, #e5e7eb);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-value.mono {
  font-family: var(--font-mono, monospace);
  color: var(--emerald-bright, #34d399);
}

.field-value.small {
  font-size: 11px;
  color: var(--text-muted, #9ca3af);
}

.field-actions {
  display: flex;
  gap: 4px;
}

.btn-eye-mini,
.btn-copy-mini {
  background: var(--bg-surface, #050b08);
  border: 1px solid var(--border-card, #142820);
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 10px;
  color: var(--text-gray, #e2e8f0);
}

.secret-notes-preview {
  background: var(--bg-surface, #050b08);
  border: 1px solid var(--border-card, #142820);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-gray, #9ca3af);
  line-height: 1.4;
}

.secret-card-bottom {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.btn-secret-del {
  background: transparent;
  border: none;
  color: var(--text-muted, #6b7280);
  font-size: 11px;
  cursor: pointer;
}

.btn-secret-del:hover {
  color: #ef4444;
}

.secrets-empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 20px;
  gap: 12px;
}

.empty-icon {
  font-size: 40px;
  opacity: 0.5;
}

.secrets-empty-state h3 {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary, #fff);
  margin: 0;
}

.secrets-empty-state p {
  font-size: 12.5px;
  color: var(--text-muted, #9ca3af);
  max-width: 400px;
  margin: 0;
}

.empty-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

/* High-Contrast Vault Cyber Scrollbars */
.secrets-grid-container::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.secrets-grid-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track, rgba(4, 12, 8, 0.8));
  border-radius: 6px;
}

.secrets-grid-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, rgba(16, 185, 129, 0.45));
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.secrets-grid-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #34d399);
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.4));
}

.secrets-grid-container {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb, rgba(16, 185, 129, 0.5)) var(--scrollbar-track, rgba(4, 12, 8, 0.8));
}
</style>
