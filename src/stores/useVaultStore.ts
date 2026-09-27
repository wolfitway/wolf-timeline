import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { VaultSecretItem } from "@/types";
import {
  bytesToHex,
  hexToBytes,
  deriveVaultKey,
  encryptVaultPayload,
  decryptVaultPayload,
} from "@/services/crypto";
import {
  tauriGetVaultSecrets,
  tauriSaveVaultSecret,
  tauriDeleteVaultSecret,
  tauriGetVaultMeta,
  tauriSetVaultMeta,
} from "@/services/tauriIpc";

const LOCAL_SECRETS_KEY = "wolf_vault_secrets_v2";

export const useVaultStore = defineStore("vault", () => {
  const isUnlocked = ref<boolean>(false);
  const isInitialized = ref<boolean>(false);
  const cryptoKey = ref<CryptoKey | null>(null);
  const decryptedSecrets = ref<VaultSecretItem[]>([]);
  const activeCategory = ref<string>("all");
  const searchQuery = ref<string>("");
  const autoLockCountdown = ref<number>(300);
  let autoLockTimer: any = null;

  // Computed
  const filteredSecrets = computed(() => {
    return decryptedSecrets.value.filter((sec) => {
      if (activeCategory.value !== "all" && sec.category !== activeCategory.value) {
        return false;
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase().trim();
        const servMatch = sec.service.toLowerCase().includes(q);
        const userMatch = (sec.username || "").toLowerCase().includes(q);
        const hostMatch = (sec.host || "").toLowerCase().includes(q);
        return servMatch || userMatch || hostMatch;
      }
      return true;
    });
  });

  const categoryCounts = computed(() => {
    return {
      all: decryptedSecrets.value.length,
      api: decryptedSecrets.value.filter((s) => s.category === "api").length,
      login: decryptedSecrets.value.filter((s) => s.category === "login").length,
      db: decryptedSecrets.value.filter((s) => s.category === "db").length,
      token: decryptedSecrets.value.filter((s) => s.category === "token").length,
    };
  });

  // Helpers
  async function getMeta(key: string): Promise<string | null> {
    const tauriVal = await tauriGetVaultMeta(key);
    if (tauriVal !== null) return tauriVal;
    return localStorage.getItem("wolf_vault_meta_" + key);
  }

  async function setMeta(key: string, val: string): Promise<void> {
    await tauriSetVaultMeta(key, val);
    try {
      localStorage.setItem("wolf_vault_meta_" + key, val);
    } catch {}
  }

  async function checkInit(): Promise<boolean> {
    const canary = await getMeta("vault_canary");
    isInitialized.value = Boolean(canary);
    return isInitialized.value;
  }

  function startAutoLockTimer() {
    if (autoLockTimer) clearInterval(autoLockTimer);
    autoLockCountdown.value = 300;
    autoLockTimer = setInterval(() => {
      if (autoLockCountdown.value > 0) {
        autoLockCountdown.value--;
      } else {
        lockVault();
      }
    }, 1000);
  }

  function resetAutoLock() {
    if (isUnlocked.value) {
      autoLockCountdown.value = 300;
    }
  }

  // Unlock / Lock
  async function unlockVault(passphrase: string): Promise<{ success: boolean; error?: string }> {
    if (!passphrase || passphrase.length < 6) {
      return { success: false, error: "Master passphrase must be at least 6 characters long." };
    }

    try {
      const canaryStr = await getMeta("vault_canary");
      let saltHex = await getMeta("vault_salt");

      if (!canaryStr || !saltHex) {
        // Initial setup
        const saltBytes = crypto.getRandomValues(new Uint8Array(16));
        saltHex = bytesToHex(saltBytes);
        const derivedKey = await deriveVaultKey(passphrase, saltBytes);

        const canaryObj = { marker: "WOLF_SOVEREIGN_VAULT", created_at: Date.now() };
        const encCanary = await encryptVaultPayload(derivedKey, canaryObj);

        await setMeta("vault_salt", saltHex);
        await setMeta("vault_canary", JSON.stringify(encCanary));

        cryptoKey.value = derivedKey;
        isUnlocked.value = true;
        isInitialized.value = true;
        decryptedSecrets.value = [];
      } else {
        // Unlock existing
        const saltBytes = hexToBytes(saltHex);
        const derivedKey = await deriveVaultKey(passphrase, saltBytes);

        let canaryPayload;
        try {
          const canaryEnc = JSON.parse(canaryStr);
          canaryPayload = await decryptVaultPayload(derivedKey, canaryEnc.ciphertextHex, canaryEnc.ivHex);
        } catch {
          return { success: false, error: "Incorrect master passphrase. Decryption failed." };
        }

        if (!canaryPayload || canaryPayload.marker !== "WOLF_SOVEREIGN_VAULT") {
          return { success: false, error: "Passphrase verification failed. Integrity mismatch." };
        }

        cryptoKey.value = derivedKey;
        isUnlocked.value = true;

        // Fetch & decrypt secrets
        const rawDbSecrets = await tauriGetVaultSecrets();
        let encryptedRows: VaultSecretItem[] = [];

        if (rawDbSecrets && rawDbSecrets.length > 0) {
          encryptedRows = rawDbSecrets;
        } else {
          const localRaw = localStorage.getItem(LOCAL_SECRETS_KEY);
          if (localRaw) {
            try {
              encryptedRows = JSON.parse(localRaw);
            } catch {}
          }
        }

        const decrypted: VaultSecretItem[] = [];
        for (const row of encryptedRows) {
          if (row.ciphertext && row.iv) {
            try {
              const p = await decryptVaultPayload(derivedKey, row.ciphertext, row.iv);
              decrypted.push({
                id: row.id,
                service: row.service || p.service || "Unnamed Secret",
                category: row.category || p.category || "api",
                username: row.username || p.username || "",
                password: p.password || "",
                host: p.host || "",
                notes: row.notes || p.notes || "",
                created_at: row.created_at || new Date().toISOString(),
                updated_at: row.updated_at || new Date().toISOString(),
              });
            } catch (e) {
              console.warn(`Could not decrypt secret ${row.id}:`, e);
            }
          }
        }

        decryptedSecrets.value = decrypted;
      }

      startAutoLockTimer();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Decryption error." };
    }
  }

  function lockVault() {
    isUnlocked.value = false;
    cryptoKey.value = null;
    decryptedSecrets.value = [];
    if (autoLockTimer) {
      clearInterval(autoLockTimer);
      autoLockTimer = null;
    }
  }

  async function saveSecret(item: Partial<VaultSecretItem> & { service: string; password?: string }) {
    if (!cryptoKey.value) return;

    const id = item.id || `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const payloadToEncrypt = {
      service: item.service,
      category: item.category || "api",
      username: item.username || "",
      password: item.password || "",
      host: item.host || "",
      notes: item.notes || "",
    };

    const enc = await encryptVaultPayload(cryptoKey.value, payloadToEncrypt);

    const secretRow: VaultSecretItem = {
      id,
      service: item.service,
      username: item.username || "",
      category: item.category || "api",
      ciphertext: enc.ciphertextHex,
      iv: enc.ivHex,
      notes: item.notes || "",
      created_at: item.created_at || now,
      updated_at: now,
    };

    // Save to SQLite
    await tauriSaveVaultSecret(secretRow);

    // Save to LocalStorage fallback
    try {
      let list: VaultSecretItem[] = [];
      const raw = localStorage.getItem(LOCAL_SECRETS_KEY);
      if (raw) list = JSON.parse(raw);
      const idx = list.findIndex((x) => x.id === id);
      if (idx >= 0) list[idx] = secretRow;
      else list.unshift(secretRow);
      localStorage.setItem(LOCAL_SECRETS_KEY, JSON.stringify(list));
    } catch {}

    // Update in-memory decrypted secrets
    const decItem: VaultSecretItem = {
      id,
      service: item.service,
      username: item.username || "",
      password: item.password || "",
      category: item.category || "api",
      host: item.host || "",
      notes: item.notes || "",
      created_at: item.created_at || now,
      updated_at: now,
    };

    const inMemIdx = decryptedSecrets.value.findIndex((s) => s.id === id);
    if (inMemIdx >= 0) decryptedSecrets.value[inMemIdx] = decItem;
    else decryptedSecrets.value.unshift(decItem);
  }

  async function deleteSecret(id: string) {
    decryptedSecrets.value = decryptedSecrets.value.filter((s) => s.id !== id);
    await tauriDeleteVaultSecret(id);

    try {
      let list: VaultSecretItem[] = [];
      const raw = localStorage.getItem(LOCAL_SECRETS_KEY);
      if (raw) list = JSON.parse(raw);
      list = list.filter((x) => x.id !== id);
      localStorage.setItem(LOCAL_SECRETS_KEY, JSON.stringify(list));
    } catch {}
  }

  return {
    isUnlocked,
    isInitialized,
    decryptedSecrets,
    filteredSecrets,
    activeCategory,
    searchQuery,
    categoryCounts,
    autoLockCountdown,
    checkInit,
    unlockVault,
    lockVault,
    saveSecret,
    deleteSecret,
    resetAutoLock,
  };
});
