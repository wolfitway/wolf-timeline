import type { Note, VaultSecretItem, LicenseInfo } from "@/types";

declare global {
  interface Window {
    __TAURI__?: {
      invoke: <T = any>(cmd: string, args?: Record<string, any>) => Promise<T>;
    };
  }
}

export const isTauri = (): boolean => {
  return typeof window !== "undefined" && !!window.__TAURI__ && typeof window.__TAURI__.invoke === "function";
};

export async function invokeTauri<T>(cmd: string, args?: Record<string, any>): Promise<T | null> {
  if (isTauri()) {
    try {
      return await window.__TAURI__!.invoke<T>(cmd, args);
    } catch (e) {
      console.warn(`[Tauri IPC] Command "${cmd}" failed:`, e);
      return null;
    }
  }
  return null;
}

// Notes IPC
export async function tauriListNotes(): Promise<Note[] | null> {
  return invokeTauri<Note[]>("list_notes");
}

export async function tauriAddNote(note: Partial<Note>): Promise<Note | null> {
  return invokeTauri<Note>("add_note", { note });
}

export async function tauriUpdateNote(update: Partial<Note> & { id: number }): Promise<Note | null> {
  return invokeTauri<Note>("update_note", { update });
}

export async function tauriDeleteNote(id: number): Promise<boolean> {
  const res = await invokeTauri<void>("delete_note", { id });
  return res !== null;
}

// Vault IPC
export async function tauriGetVaultSecrets(): Promise<VaultSecretItem[] | null> {
  return invokeTauri<VaultSecretItem[]>("get_vault_secrets");
}

export async function tauriSaveVaultSecret(item: VaultSecretItem): Promise<boolean> {
  const res = await invokeTauri<void>("save_vault_secret", { item });
  return res !== null;
}

export async function tauriDeleteVaultSecret(id: string): Promise<boolean> {
  const res = await invokeTauri<void>("delete_vault_secret", { id });
  return res !== null;
}

export async function tauriGetVaultMeta(key: string): Promise<string | null> {
  return invokeTauri<string | null>("get_vault_meta", { key });
}

export async function tauriSetVaultMeta(key: string, value: string): Promise<boolean> {
  const res = await invokeTauri<void>("set_vault_meta", { key, value });
  return res !== null;
}

// License IPC
export async function tauriGetMachineFingerprint(): Promise<string | null> {
  return invokeTauri<string>("get_machine_fingerprint");
}

export async function tauriCheckLicenseStatus(): Promise<LicenseInfo | null> {
  return invokeTauri<LicenseInfo>("check_license_status");
}

export async function tauriActivateLicense(key: string): Promise<LicenseInfo | null> {
  return invokeTauri<LicenseInfo>("activate_license", { key });
}

export async function tauriDeactivateLicense(): Promise<boolean> {
  const res = await invokeTauri<void>("deactivate_license");
  return res !== null;
}

export async function tauriSystemTts(text: string, rate?: number, pitch?: number): Promise<boolean> {
  const res = await invokeTauri<boolean>("system_tts", { text, rate, pitch });
  return !!res;
}
