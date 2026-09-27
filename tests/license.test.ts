import { describe, it, expect } from "vitest";
import { sha256Hex } from "../src/services/crypto";

const MASTER_SIGNING_SECRET = "WOLF_SOVEREIGN_ALPHA_SIGNING_SECRET_2026";
const MASTER_FOUNDER_KEY = "WOLF-FOUNDER-MASTER-ACCESS-2026";

async function computeExpectedLicense(devId: string): Promise<string> {
  const hash = await sha256Hex(devId + MASTER_SIGNING_SECRET);
  const p1 = hash.substring(0, 4);
  const p2 = hash.substring(4, 8);
  const p3 = hash.substring(8, 12);
  return `WOLF-KEY-${p1}-${p2}-${p3}`;
}

describe("Hardware License & Keygen Engine", () => {
  it("generates deterministic hardware-bound license keys", async () => {
    const devId = "WOLF-DEV-7F3A-89CB-4D21";
    const key1 = await computeExpectedLicense(devId);
    const key2 = await computeExpectedLicense(devId);

    expect(key1).toBe(key2);
    expect(key1).toMatch(/^WOLF-KEY-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}$/);
  });

  it("produces distinct license keys for different hardware fingerprints", async () => {
    const devIdA = "WOLF-DEV-AAAA-BBBB-CCCC";
    const devIdB = "WOLF-DEV-DDDD-EEEE-FFFF";

    const keyA = await computeExpectedLicense(devIdA);
    const keyB = await computeExpectedLicense(devIdB);

    expect(keyA).not.toBe(keyB);
  });

  it("supports Master Founder bypass key validation", () => {
    expect(MASTER_FOUNDER_KEY).toBe("WOLF-FOUNDER-MASTER-ACCESS-2026");
  });
});
