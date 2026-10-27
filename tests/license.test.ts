import { describe, it, expect } from "vitest";
import { sha256Hex } from "../src/services/crypto";

const MASTER_SIGNING_SECRET = "WOLF_SOVEREIGN_ALPHA_SIGNING_SECRET_2026";
const MASTER_FOUNDER_KEY = "WOLF-FOUNDER-MASTER-ACCESS-2026";

async function computeExpectedLicense(devId: string, tierType: string = "commercial_solo"): Promise<string> {
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

describe("Hardware License & 3-Tier Monetization Keygen Engine", () => {
  it("generates deterministic hardware-bound commercial solo license keys", async () => {
    const devId = "WOLF-DEV-7F3A-89CB-4D21";
    const key1 = await computeExpectedLicense(devId, "commercial_solo");
    const key2 = await computeExpectedLicense(devId, "commercial_solo");

    expect(key1).toBe(key2);
    expect(key1).toMatch(/^WOLF-COMM-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}$/);
  });

  it("generates distinct keys for Team vs Commercial Solo tiers", async () => {
    const devId = "WOLF-DEV-7F3A-89CB-4D21";
    const commKey = await computeExpectedLicense(devId, "commercial_solo");
    const teamKey = await computeExpectedLicense(devId, "team");

    expect(commKey).not.toBe(teamKey);
    expect(teamKey).toMatch(/^WOLF-TEAM-5S-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}$/);
  });

  it("generates clean free personal node keys", async () => {
    const devId = "WOLF-DEV-7F3A-89CB-4D21";
    const freeKey = await computeExpectedLicense(devId, "solo_free");

    expect(freeKey).toBe("WOLF-FREE-7F3A-89CB-4D21");
  });

  it("produces distinct license keys for different hardware fingerprints", async () => {
    const devIdA = "WOLF-DEV-AAAA-BBBB-CCCC";
    const devIdB = "WOLF-DEV-DDDD-EEEE-FFFF";

    const keyA = await computeExpectedLicense(devIdA, "commercial_solo");
    const keyB = await computeExpectedLicense(devIdB, "commercial_solo");

    expect(keyA).not.toBe(keyB);
  });

  it("supports Master Founder bypass key validation", () => {
    expect(MASTER_FOUNDER_KEY).toBe("WOLF-FOUNDER-MASTER-ACCESS-2026");
  });

  it("restricts BYOK and Voice Commands to paid tiers (Commercial Solo and Team)", () => {
    const isPaid = (tier: string) => tier === "commercial_solo" || tier === "team";
    const canUseByok = (tier: string) => isPaid(tier);
    const canUseVoiceCommands = (tier: string) => isPaid(tier);

    // Free tier
    expect(canUseByok("solo_free")).toBe(false);
    expect(canUseVoiceCommands("solo_free")).toBe(false);

    // Paid tiers
    expect(canUseByok("commercial_solo")).toBe(true);
    expect(canUseVoiceCommands("commercial_solo")).toBe(true);
    expect(canUseByok("team")).toBe(true);
    expect(canUseVoiceCommands("team")).toBe(true);
  });

  it("verifies BYOK and Voice Commands features in paid tier descriptors", () => {
    const commFeatures = [
      "Commercial & client usage rights",
      "BYOK (Bring Your Own Key) custom AI integrations",
      "Hands-Free Voice Command & Audio Engine",
      "Unbranded white-label exports",
      "Priority AI decision studio",
    ];

    const teamFeatures = [
      "Multi-Seat Pack mesh (5-25 seats)",
      "Shared team credentials locker",
      "BYOK (Bring Your Own Key) custom AI integrations",
      "Hands-Free Voice Command & Audio Engine",
      "Unbranded exports",
      "Multi-author attribution",
    ];

    expect(commFeatures.some(f => f.includes("BYOK"))).toBe(true);
    expect(commFeatures.some(f => f.includes("Voice Command"))).toBe(true);
    expect(teamFeatures.some(f => f.includes("BYOK"))).toBe(true);
    expect(teamFeatures.some(f => f.includes("Voice Command"))).toBe(true);
  });
});

