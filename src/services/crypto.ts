/**
 * Zero-Knowledge Cryptography Engine: PBKDF2 (100,000 rounds) + AES-256-GCM
 */

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", enc);
  return bytesToHex(new Uint8Array(hashBuf)).toUpperCase();
}

export async function deriveVaultKey(passphrase: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    passKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptVaultPayload(
  cryptoKey: CryptoKey,
  dataObj: Record<string, any>
): Promise<{ ciphertextHex: string; ivHex: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = enc.encode(JSON.stringify(dataObj));

  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    cryptoKey,
    plaintextBytes
  );

  return {
    ciphertextHex: bytesToHex(new Uint8Array(ciphertextBuf)),
    ivHex: bytesToHex(iv),
  };
}

export async function decryptVaultPayload(
  cryptoKey: CryptoKey,
  ciphertextHex: string,
  ivHex: string
): Promise<any> {
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);

  const decryptedBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    cryptoKey,
    ciphertext as unknown as BufferSource
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decryptedBuf));
}
