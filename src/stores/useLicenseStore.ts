import { defineStore } from "pinia";
import { ref } from "vue";
import type { LicenseInfo } from "@/types";
import { sha256Hex } from "@/services/crypto";
import {
  tauriGetMachineFingerprint,
  tauriCheckLicenseStatus,
  tauriActivateLicense,
  tauriDeactivateLicense,
} from "@/services/tauriIpc";

const MASTER_SIGNING_SECRET = "WOLF_SOVEREIGN_ALPHA_SIGNING_SECRET_2026";
const MASTER_FOUNDER_KEY = "WOLF-FOUNDER-MASTER-ACCESS-2026";
const LOCAL_LICENSE_KEY = "wolf_sovereign_license_v2";

export const useLicenseStore = defineStore("license", () => {
  const isActivated = ref<boolean>(false);
  const deviceId = ref<string>("WOLF-DEV-7F3A-89CB-4D21");
  const licenseKey = ref<string>("");
  const tier = ref<string>("Community Alpha Node");
  const activatedAt = ref<string | null>(null);

  async function computeFallbackDeviceId(): Promise<string> {
    let raw = localStorage.getItem("wolf_browser_device_seed");
    if (!raw) {
      raw = `browser_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      localStorage.setItem("wolf_browser_device_seed", raw);
    }
    const hash = await sha256Hex(raw + "_WOLF_DEVICE_SALT_2026");
    const p1 = hash.substring(0, 4);
    const p2 = hash.substring(4, 8);
    const p3 = hash.substring(8, 12);
    return `WOLF-DEV-${p1}-${p2}-${p3}`;
  }

  async function computeExpectedLicense(devId: string): Promise<string> {
    const hash = await sha256Hex(devId + MASTER_SIGNING_SECRET);
    const p1 = hash.substring(0, 4);
    const p2 = hash.substring(4, 8);
    const p3 = hash.substring(8, 12);
    return `WOLF-KEY-${p1}-${p2}-${p3}`;
  }

  async function checkLicense(): Promise<LicenseInfo> {
    // 1. Try Tauri IPC
    const tauriStatus = await tauriCheckLicenseStatus();
    if (tauriStatus && tauriStatus.machine_id) {
      isActivated.value = tauriStatus.activated;
      deviceId.value = tauriStatus.machine_id;
      licenseKey.value = tauriStatus.key || "";
      tier.value = tauriStatus.tier;
      activatedAt.value = tauriStatus.activated_at || null;
      return tauriStatus;
    }

    // 2. Browser fallback
    deviceId.value = await computeFallbackDeviceId();
    const local = localStorage.getItem(LOCAL_LICENSE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        const expected = await computeExpectedLicense(deviceId.value);
        if (parsed.key === MASTER_FOUNDER_KEY || parsed.key === expected) {
          isActivated.value = true;
          licenseKey.value = parsed.key;
          tier.value = parsed.tier || "Founder Alpha Access";
          activatedAt.value = parsed.activated_at;
          return {
            activated: true,
            machine_id: deviceId.value,
            key: parsed.key,
            tier: tier.value,
            activated_at: activatedAt.value || undefined,
          };
        }
      } catch {}
    }

    isActivated.value = false;
    tier.value = "Community Alpha Node";
    return {
      activated: false,
      machine_id: deviceId.value,
      tier: tier.value,
    };
  }

  async function activate(key: string): Promise<{ success: boolean; error?: string }> {
    const cleanKey = key.trim().toUpperCase();
    const expected = await computeExpectedLicense(deviceId.value);

    // Tauri IPC
    const tauriRes = await tauriActivateLicense(cleanKey);
    if (tauriRes && tauriRes.activated) {
      isActivated.value = true;
      licenseKey.value = tauriRes.key || cleanKey;
      tier.value = tauriRes.tier;
      activatedAt.value = tauriRes.activated_at || new Date().toISOString();
      return { success: true };
    }

    // Browser validation
    if (cleanKey !== MASTER_FOUNDER_KEY && cleanKey !== expected) {
      return { success: false, error: "Invalid license key for this device identifier." };
    }

    const isMaster = cleanKey === MASTER_FOUNDER_KEY;
    tier.value = isMaster ? "Founder Sovereign Access" : "Founder Alpha Access (Lifetime Seat)";
    isActivated.value = true;
    licenseKey.value = cleanKey;
    activatedAt.value = new Date().toISOString();

    localStorage.setItem(
      LOCAL_LICENSE_KEY,
      JSON.stringify({
        activated: true,
        machine_id: deviceId.value,
        key: cleanKey,
        tier: tier.value,
        activated_at: activatedAt.value,
      })
    );

    return { success: true };
  }

  async function generateKeyForDevice(
    targetDeviceId?: string,
    selectedTier: string = "Founder Alpha Access (Lifetime Seat)"
  ): Promise<{ key: string; deviceId: string; tier: string; message: string }> {
    const target = (targetDeviceId && targetDeviceId.trim()) ? targetDeviceId.trim().toUpperCase() : deviceId.value;
    const generated = await computeExpectedLicense(target);
    const message = `Hey! Here is your private alpha activation key for Wolf Timeline:\n\n🔑 License Key: ${generated}\n💻 Device ID: ${target}\n🏆 Tier: ${selectedTier}\n\nPaste this into the activation screen on launch to unlock your desktop seat. Enjoy testing! 🐺`;
    return {
      key: generated,
      deviceId: target,
      tier: selectedTier,
      message,
    };
  }

  async function autoActivateHardware(selectedTier: string = "Founder Alpha Access"): Promise<{ success: boolean; key: string }> {
    const expected = await computeExpectedLicense(deviceId.value);
    const res = await activate(expected);
    if (res.success) {
      tier.value = selectedTier;
      localStorage.setItem(
        LOCAL_LICENSE_KEY,
        JSON.stringify({
          activated: true,
          machine_id: deviceId.value,
          key: expected,
          tier: selectedTier,
          activated_at: new Date().toISOString(),
        })
      );
    }
    return { success: res.success, key: expected };
  }

  async function deactivate() {
    await tauriDeactivateLicense();
    localStorage.removeItem(LOCAL_LICENSE_KEY);
    isActivated.value = false;
    licenseKey.value = "";
    tier.value = "Community Alpha Node";
  }

  return {
    isActivated,
    deviceId,
    licenseKey,
    tier,
    activatedAt,
    MASTER_FOUNDER_KEY,
    checkLicense,
    activate,
    deactivate,
    generateKeyForDevice,
    autoActivateHardware,
  };
});
