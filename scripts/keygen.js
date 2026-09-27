#!/usr/bin/env node

/**
 * 🐺 WOLF TIMELINE — SOVEREIGN LICENSE KEY GENERATOR
 * Generates hardware-bound cryptographic activation keys for private alpha testers on X.
 * 
 * Usage:
 *   node scripts/keygen.js <DEVICE_ID> [TIER]
 * 
 * Example:
 *   node scripts/keygen.js WOLF-DEV-7F3A-89CB-4D21
 *   node scripts/keygen.js WOLF-DEV-7F3A-89CB-4D21 "Founder Alpha"
 */

const crypto = require("crypto");

const MASTER_SIGNING_SECRET = "WOLF_SOVEREIGN_ALPHA_SIGNING_SECRET_2026";
const MASTER_FOUNDER_KEY = "WOLF-FOUNDER-MASTER-ACCESS-2026";

function generateKeyForDevice(deviceId) {
  const cleanId = String(deviceId).trim().toUpperCase();
  if (!cleanId.startsWith("WOLF-DEV-")) {
    console.error("❌ Error: Device ID must start with WOLF-DEV- (e.g. WOLF-DEV-7F3A-89CB-4D21)");
    process.exit(1);
  }

  const hash = crypto
    .createHash("sha256")
    .update(cleanId + MASTER_SIGNING_SECRET)
    .digest("hex")
    .toUpperCase();

  const clean = hash.replace(/[^0-9A-F]/g, "");
  const p1 = clean.substring(0, 4);
  const p2 = clean.substring(4, 8);
  const p3 = clean.substring(8, 12);

  return `WOLF-KEY-${p1}-${p2}-${p3}`;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
🐺 Wolf Timeline — Sovereign Key Generator CLI
========================================================================
Usage:
  node scripts/keygen.js <DEVICE_ID> [TIER_LABEL]

Example:
  node scripts/keygen.js WOLF-DEV-7F3A-89CB-4D21

Master Founder Bypass Key (Runs on ALL machines):
  ${MASTER_FOUNDER_KEY}
========================================================================
`);
  process.exit(0);
}

const targetDevice = args[0];
const tier = args[1] || "Founder Alpha Access (Lifetime Seat)";
const key = generateKeyForDevice(targetDevice);

console.log(`
🐺 ==================================================================== 🐺
               WOLF TIMELINE — SOVEREIGN LICENSE ISSUED
========================================================================
  Target Device ID : \x1b[36m${targetDevice}\x1b[0m
  Issued License   : \x1b[32m\x1b[1m${key}\x1b[0m
  Tier / Seat      : ${tier}
  Issued At        : ${new Date().toISOString()}
========================================================================
💬 Message to paste on X / DM:
------------------------------------------------------------------------
Hey! Here is your private alpha activation key for Wolf Timeline:

🔑 License Key: ${key}

Paste this into the activation screen on launch to unlock your desktop seat.
Enjoy testing and let me know your thoughts! 🐺
========================================================================
`);
