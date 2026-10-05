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

import crypto from "crypto";

const MASTER_SIGNING_SECRET = "WOLF_SOVEREIGN_ALPHA_SIGNING_SECRET_2026";
const MASTER_FOUNDER_KEY = "WOLF-FOUNDER-MASTER-ACCESS-2026";

function generateKeyForDevice(deviceId, tierType = "commercial_solo") {
  const cleanId = String(deviceId).trim().toUpperCase();
  if (!cleanId.startsWith("WOLF-DEV-")) {
    console.error("❌ Error: Device ID must start with WOLF-DEV- (e.g. WOLF-DEV-7F3A-89CB-4D21)");
    process.exit(1);
  }

  if (tierType === "solo_free") {
    return `WOLF-FREE-${cleanId.replace("WOLF-DEV-", "")}`;
  }

  const hash = crypto
    .createHash("sha256")
    .update(cleanId + tierType + MASTER_SIGNING_SECRET)
    .digest("hex")
    .toUpperCase();

  const clean = hash.replace(/[^0-9A-F]/g, "");
  const p1 = clean.substring(0, 4);
  const p2 = clean.substring(4, 8);
  const p3 = clean.substring(8, 12);

  if (tierType === "team") {
    return `WOLF-TEAM-5S-${p1}-${p2}-${p3}`;
  }
  return `WOLF-COMM-${p1}-${p2}-${p3}`;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
🐺 Wolf Timeline — Sovereign Key Generator CLI
========================================================================
Usage:
  node scripts/keygen.js <DEVICE_ID> [commercial_solo | team | solo_free] [ORG_NAME]

Example:
  node scripts/keygen.js WOLF-DEV-7F3A-89CB-4D21 commercial_solo
  node scripts/keygen.js WOLF-DEV-7F3A-89CB-4D21 team "Acme Studio"

Master Founder Bypass Key (Runs on ALL machines):
  ${MASTER_FOUNDER_KEY}
========================================================================
`);
  process.exit(0);
}

const targetDevice = args[0];
const tierType = args[1] || "commercial_solo";
const orgName = args[2] || "Sovereign Pack";
const key = generateKeyForDevice(targetDevice, tierType);

console.log(`
🐺 ==================================================================== 🐺
               WOLF TIMELINE — SOVEREIGN LICENSE ISSUED
========================================================================
  Target Device ID : \x1b[36m${targetDevice}\x1b[0m
  Issued License   : \x1b[32m\x1b[1m${key}\x1b[0m
  Tier / Seat      : ${tierType.toUpperCase()} (${tierType === 'team' ? orgName + ' • 5 Seats' : 'Single Seat'})
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
