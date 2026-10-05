import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { LicenseInfo, LicenseTier } from "@/types";
import { sha256Hex } from "@/services/crypto";
import {
  tauriGetMachineFingerprint,
  tauriCheckLicenseStatus,
  tauriActivateLicense,
  tauriDeactivateLicense,
} from "@/services/tauriIpc";

const MASTER_SIGNING_SECRET = "WOLF_SOVEREIGN_ALPHA_SIGNING_SECRET_2026";
const MASTER_FOUNDER_KEY = "WOLF-FOUNDER-MASTER-ACCESS-2026";
const LOCAL_LICENSE_KEY = "wolf_sovereign_license_v3";

export const useLicenseStore = defineStore("license", () => {
  const isActivated = ref<boolean>(false);
  const deviceId = ref<string>("WOLF-DEV-7F3A-89CB-4D21");
  const licenseKey = ref<string>("");
  const tier = ref<LicenseTier>("solo_free");
  const tierLabel = ref<string>("Solo Personal (Free Node)");
  const companyName = ref<string>("");
  const seats = ref<number>(1);
  const activatedAt = ref<string | null>(null);
  const features = ref<string[]>([
    "Local AES-256-GCM vault",
    "Unlimited solo personal notes & timeline",
    "Standard Markdown/JSON export",
  ]);

  // Tier Status Getters
  const isFree = computed(() => tier.value === "solo_free");
  const isCommercialSolo = computed(() => tier.value === "commercial_solo");
  const isTeam = computed(() => tier.value === "team");
  const isPaid = computed(() => isCommercialSolo.value || isTeam.value);

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

  async function computeExpectedLicense(devId: string, tierType: LicenseTier = "commercial_solo"): Promise<string> {
    const hash = await sha256Hex(devId + tierType + MASTER_SIGNING_SECRET);
    const p1 = hash.substring(0, 4);
    const p2 = hash.substring(4, 8);
    const p3 = hash.substring(8, 12);

    if (tierType === "commercial_solo") {
      return `WOLF-COMM-${p1}-${p2}-${p3}`;
    } else if (tierType === "team") {
      return `WOLF-TEAM-5S-${p1}-${p2}-${p3}`;
    }
    return `WOLF-FREE-${devId.replace("WOLF-DEV-", "")}`;
  }

  // Legacy key compatibility
  async function computeLegacyAlphaLicense(devId: string): Promise<string> {
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
      tierLabel.value = tauriStatus.tier_label || "Solo Personal (Free Node)";
      companyName.value = tauriStatus.company_name || "";
      seats.value = tauriStatus.seats || 1;
      activatedAt.value = tauriStatus.activated_at || null;
      if (tauriStatus.features?.length) features.value = tauriStatus.features;
      return tauriStatus;
    }

    // 2. Browser fallback
    deviceId.value = await computeFallbackDeviceId();
    const local = localStorage.getItem(LOCAL_LICENSE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        const expectedComm = await computeExpectedLicense(deviceId.value, "commercial_solo");
        const expectedTeam = await computeExpectedLicense(deviceId.value, "team");
        const expectedLegacy = await computeLegacyAlphaLicense(deviceId.value);

        if (
          parsed.key === MASTER_FOUNDER_KEY ||
          parsed.key === expectedComm ||
          parsed.key === expectedTeam ||
          parsed.key === expectedLegacy ||
          parsed.key?.startsWith("WOLF-FREE-")
        ) {
          isActivated.value = parsed.tier !== "solo_free";
          licenseKey.value = parsed.key;
          tier.value = parsed.tier || "commercial_solo";
          tierLabel.value = parsed.tier_label || (tier.value === "team" ? "Team / Pack Mesh License" : "Commercial Solo License");
          companyName.value = parsed.company_name || "";
          seats.value = parsed.seats || (tier.value === "team" ? 5 : 1);
          activatedAt.value = parsed.activated_at;
          features.value = parsed.features || [
            "Full commercial rights",
            "Unbranded export suite",
          ];
          return {
            activated: isActivated.value,
            machine_id: deviceId.value,
            key: parsed.key,
            tier: tier.value,
            tier_label: tierLabel.value,
            company_name: companyName.value,
            seats: seats.value,
            activated_at: activatedAt.value || undefined,
            features: features.value,
          };
        }
      } catch {}
    }

    isActivated.value = false;
    tier.value = "solo_free";
    tierLabel.value = "Solo Personal (Free Node)";
    seats.value = 1;
    return {
      activated: false,
      machine_id: deviceId.value,
      tier: "solo_free",
      tier_label: "Solo Personal (Free Node)",
      seats: 1,
      features: features.value,
    };
  }

  async function activate(key: string, selectedTierName?: LicenseTier): Promise<{ success: boolean; error?: string }> {
    const cleanKey = key.trim().toUpperCase();

    // Free node activation
    if (cleanKey.startsWith("WOLF-FREE-") || selectedTierName === "solo_free") {
      tier.value = "solo_free";
      tierLabel.value = "Solo Personal (Free Sovereign Node)";
      isActivated.value = false;
      licenseKey.value = `WOLF-FREE-${deviceId.value.replace("WOLF-DEV-", "")}`;
      seats.value = 1;
      localStorage.setItem(
        LOCAL_LICENSE_KEY,
        JSON.stringify({
          activated: false,
          machine_id: deviceId.value,
          key: licenseKey.value,
          tier: "solo_free",
          tier_label: tierLabel.value,
          seats: 1,
        })
      );
      return { success: true };
    }

    // Tauri IPC
    const tauriRes = await tauriActivateLicense(cleanKey);
    if (tauriRes && tauriRes.tier) {
      isActivated.value = tauriRes.activated;
      licenseKey.value = tauriRes.key || cleanKey;
      tier.value = tauriRes.tier;
      tierLabel.value = tauriRes.tier_label;
      companyName.value = tauriRes.company_name || "";
      seats.value = tauriRes.seats || 1;
      activatedAt.value = tauriRes.activated_at || new Date().toISOString();
      features.value = tauriRes.features || [];
      return { success: true };
    }

    // Browser validation
    const expectedComm = await computeExpectedLicense(deviceId.value, "commercial_solo");
    const expectedTeam = await computeExpectedLicense(deviceId.value, "team");
    const expectedLegacy = await computeLegacyAlphaLicense(deviceId.value);

    let resolvedTier: LicenseTier = "commercial_solo";
    let resolvedLabel = "Commercial Solo License";
    let resolvedSeats = 1;

    if (cleanKey === MASTER_FOUNDER_KEY) {
      resolvedTier = "commercial_solo";
      resolvedLabel = "Founder Sovereign VIP";
    } else if (cleanKey === expectedComm || cleanKey === expectedLegacy) {
      resolvedTier = "commercial_solo";
      resolvedLabel = "Commercial Solo License";
      resolvedSeats = 1;
    } else if (cleanKey === expectedTeam || cleanKey.startsWith("WOLF-TEAM-")) {
      resolvedTier = "team";
      resolvedLabel = "Team / Pack Mesh License (5 Seats)";
      resolvedSeats = 5;
    } else {
      return { success: false, error: "Invalid license key for this device identifier or tier." };
    }

    tier.value = resolvedTier;
    tierLabel.value = resolvedLabel;
    isActivated.value = true;
    licenseKey.value = cleanKey;
    seats.value = resolvedSeats;
    activatedAt.value = new Date().toISOString();
    features.value = resolvedTier === "team"
      ? ["Multi-Seat Pack mesh", "Shared team credentials locker", "Unbranded exports", "Multi-author attribution"]
      : ["Commercial & client usage rights", "Unbranded white-label exports", "Priority AI decision studio"];

    localStorage.setItem(
      LOCAL_LICENSE_KEY,
      JSON.stringify({
        activated: true,
        machine_id: deviceId.value,
        key: cleanKey,
        tier: tier.value,
        tier_label: tierLabel.value,
        seats: seats.value,
        activated_at: activatedAt.value,
        features: features.value,
      })
    );

    return { success: true };
  }

  async function generateKeyForDevice(
    targetDeviceId?: string,
    selectedTier: LicenseTier = "commercial_solo",
    orgName: string = "Acme Corp"
  ): Promise<{ key: string; deviceId: string; tier: LicenseTier; tierLabel: string; message: string }> {
    const target = (targetDeviceId && targetDeviceId.trim()) ? targetDeviceId.trim().toUpperCase() : deviceId.value;
    const generated = await computeExpectedLicense(target, selectedTier);

    const tierLabels: Record<LicenseTier, string> = {
      solo_free: "Solo Personal Node (Free)",
      commercial_solo: "Commercial Solo License ($49 Lifetime / $9/mo)",
      team: `Team / Pack Mesh License (${orgName} • 5 Seats)`,
    };

    const label = tierLabels[selectedTier] || "Commercial Solo License";
    const message = `🐺 Wolf Timeline License Provisioned:\n\n🔑 License Key: ${generated}\n💻 Device Fingerprint: ${target}\n🏷️ Tier: ${label}\n🏢 Organization: ${selectedTier === 'team' ? orgName : 'Individual'}\n\n100% offline-verifiable. Paste this into Wolf Timeline Settings or the activation modal to unlock your seat!`;

    return {
      key: generated,
      deviceId: target,
      tier: selectedTier,
      tierLabel: label,
      message,
    };
  }

  async function autoActivateHardware(selectedTier: LicenseTier = "commercial_solo"): Promise<{ success: boolean; key: string }> {
    const expected = await computeExpectedLicense(deviceId.value, selectedTier);
    const res = await activate(expected, selectedTier);
    return { success: res.success, key: expected };
  }

  async function selectFreeSoloTier() {
    return activate(`WOLF-FREE-${deviceId.value.replace("WOLF-DEV-", "")}`, "solo_free");
  }

  async function deactivate() {
    await tauriDeactivateLicense();
    localStorage.removeItem(LOCAL_LICENSE_KEY);
    isActivated.value = false;
    licenseKey.value = "";
    tier.value = "solo_free";
    tierLabel.value = "Solo Personal (Free Node)";
    seats.value = 1;
  }

  return {
    isActivated,
    deviceId,
    licenseKey,
    tier,
    tierLabel,
    companyName,
    seats,
    activatedAt,
    features,
    isFree,
    isCommercialSolo,
    isTeam,
    isPaid,
    MASTER_FOUNDER_KEY,
    checkLicense,
    activate,
    deactivate,
    generateKeyForDevice,
    autoActivateHardware,
    selectFreeSoloTier,
  };
});

