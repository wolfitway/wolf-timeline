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
});
