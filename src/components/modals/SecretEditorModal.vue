<script setup lang="ts">
import { ref, watch } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useVaultStore } from "@/stores/useVaultStore";

const uiStore = useUiStore();
const vaultStore = useVaultStore();

const service = ref("");
const category = ref<"api" | "login" | "db" | "token">("api");
const username = ref("");
const password = ref("");
const host = ref("");
const notes = ref("");
const showPass = ref(false);

watch(
  () => uiStore.showSecretEditor,
  (open) => {
    if (open) {
      service.value = "";
      category.value = "api";
      username.value = "";
      password.value = "";
      host.value = "";
      notes.value = "";
      showPass.value = false;
    }
  }
);

async function handleSave() {
  if (!service.value.trim()) {
    alert("Please provide a service or credential title.");
    return;
  }
  if (!password.value) {
    alert("Please provide the key, token or password value.");
    return;
  }

  await vaultStore.saveSecret({
    service: service.value.trim(),
    category: category.value,
    username: username.value.trim(),
    password: password.value.trim(),
    host: host.value.trim(),
    notes: notes.value.trim(),
  });

  uiStore.showSecretEditor = false;
  uiStore.showToast(`Secret "${service.value}" encrypted into Secret Vault ✓`);
}
</script>

<template>
  <div v-if="uiStore.showSecretEditor" class="modal-overlay" @click.self="uiStore.showSecretEditor = false">
    <div class="modal-window">
      <!-- Modal Header -->
      <div class="modal-header-centered">
        <div class="modal-brand">
          <img src="/assets/wolf-logo.png" alt="Wolf Logo" class="modal-wolf-logo" />
          <span class="modal-brand-text">WOLF TIMELINE</span>
        </div>
        <h2 class="modal-title">+ Add Sovereign Secret</h2>
        <p class="modal-subtitle">Zero-knowledge AES-256 encrypted directly in memory before writing to disk.</p>
      </div>

      <form class="secret-form" @submit.prevent="handleSave">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Service / Key Name *</label>
            <input
              v-model="service"
              type="text"
              class="form-input"
              placeholder="e.g. Stripe Production API"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <select v-model="category" class="form-select">
              <option value="api">⚡ API Key</option>
              <option value="login">👤 Account Login</option>
              <option value="db">🗄️ Database URI</option>
              <option value="token">🔑 Access Token / SSH</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Key / Token / Secret Value *</label>
          <div class="pass-input-row">
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              class="form-input mono"
              placeholder="sk-live-... or secret password"
              required
            />
            <button type="button" class="btn-toggle-eye" @click="showPass = !showPass">
              {{ showPass ? "🙈" : "👁️" }}
            </button>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Username / Account (Optional)</label>
            <input
              v-model="username"
              type="text"
              class="form-input"
              placeholder="admin or user@domain.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Host / Endpoint (Optional)</label>
            <input
              v-model="host"
              type="text"
              class="form-input"
              placeholder="https://api.stripe.com"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes / Documentation</label>
          <textarea
            v-model="notes"
            class="form-textarea"
            rows="2"
            placeholder="Usage context, rotation schedules, scopes..."
          ></textarea>
        </div>

        <div class="modal-actions-row">
          <button type="button" class="btn-cancel" @click="uiStore.showSecretEditor = false">
            Cancel
          </button>
          <button type="submit" class="btn-submit">
            🔒 Encrypt &amp; Save
          </button>
        </div>
      </form>

      <button type="button" class="btn-corner-close" @click="uiStore.showSecretEditor = false">✕</button>
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

.modal-window {
  position: relative;
  width: 520px;
  max-width: 92vw;
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
  margin-bottom: 18px;
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

.secret-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary, #9ca3af);
}

.form-input,
.form-select,
.form-textarea {
  background: var(--bg-inner, #050b08);
  border: 1px solid var(--border-card, #142820);
  border-radius: 8px;
  padding: 9px 12px;
  color: var(--text-primary, #fff);
  font-size: 12.5px;
  outline: none;
  transition: border-color 0.15s ease;
}

.form-input.mono {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--emerald-bright, #34d399);
}

.pass-input-row {
  display: flex;
  gap: 8px;
}

.pass-input-row .form-input {
  flex: 1;
}

.btn-toggle-eye {
  background: var(--bg-inner, #050b08);
  border: 1px solid var(--border-card, #142820);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--text-secondary, #9ca3af);
  cursor: pointer;
}

.btn-toggle-eye:hover {
  background: var(--bg-card-hover, #0e1c15);
}

.form-textarea {
  font-size: 11.5px;
  resize: vertical;
}

.modal-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-card, #142820);
  border-radius: 8px;
  padding: 8px 16px;
  color: var(--text-secondary, #9ca3af);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--bg-card-hover, #0e1c15);
  color: var(--text-primary, #fff);
}

.btn-submit {
  background: var(--emerald-main, #10b981);
  color: #03100a;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.btn-submit:hover {
  filter: brightness(1.15);
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
