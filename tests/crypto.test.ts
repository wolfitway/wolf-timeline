import { describe, it, expect } from "vitest";
import {
  bytesToHex,
  hexToBytes,
  sha256Hex,
  deriveVaultKey,
  encryptVaultPayload,
  decryptVaultPayload,
} from "../src/services/crypto";

describe("Zero-Knowledge Cryptography Engine", () => {
  it("converts bytes to hex and back without data corruption", () => {
    const original = new Uint8Array([0, 15, 16, 255, 128, 42]);
    const hex = bytesToHex(original);
    expect(hex).toBe("000f10ff802a");
    const restored = hexToBytes(hex);
    expect(restored).toEqual(original);
  });

  it("computes SHA-256 hashes deterministically", async () => {
    const hash = await sha256Hex("WOLF_SOVEREIGN_TEST_PAYLOAD");
    expect(hash.length).toBe(64);
    const hash2 = await sha256Hex("WOLF_SOVEREIGN_TEST_PAYLOAD");
    expect(hash).toBe(hash2);
  });

  it("encrypts and decrypts secret payloads with PBKDF2 derived keys", async () => {
    const salt = new Uint8Array(16).fill(7);
    const passphrase = "wolf_master_passphrase_2026";
    const key = await deriveVaultKey(passphrase, salt);

    const sensitiveData = {
      service: "OpenAI Production",
      apiKey: "sk-proj-test1234567890abcdef",
      timestamp: 1727450000,
    };

    const encrypted = await encryptVaultPayload(key, sensitiveData);
    expect(encrypted.ciphertextHex).toBeDefined();
    expect(encrypted.ivHex).toBeDefined();
    expect(encrypted.ciphertextHex).not.toContain("sk-proj");

    const decrypted = await decryptVaultPayload(key, encrypted.ciphertextHex, encrypted.ivHex);
    expect(decrypted).toEqual(sensitiveData);
  });
});
