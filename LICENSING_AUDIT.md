# 🛡️ Software Protection & Licensing Audit: Wolf Timeline
**Discipline:** Systems Cryptography (`@systems-crypto`), Product Architecture (`@product-strategist`), & Growth (`@cro-strategist`)  
**Target Platforms:** Linux (`.AppImage`, `.deb`), macOS (`.dmg`, `.app`), Windows (`.msi`, `.exe`)  
**Core Directive:** Maximum protection against unauthorized sharing & reselling with **zero user friction** and **zero-telemetry offline integrity**.

---

## 1. Executive Summary & Verdict

When sharing proprietary desktop binaries publicly (especially while building in public on X), unkeyed binaries can be copied, re-hosted, or resold in minutes. However, traditional DRM (continuous cloud checks, account logins, intrusive background services) destroys user trust and directly violates Wolf Timeline's **sovereign, local-first** brand promise.

The **industry-standard, zero-friction solution** across Linux, Windows, and macOS is:
> **Sovereign Offline Machine-Bound Signed Licensing (Ed25519 / HMAC-SHA256)**

### The Core Loop
1. **App reads a stable OS-level machine identifier** (`/etc/machine-id` on Linux, `IOPlatformUUID` on macOS, `MachineGuid` on Windows).
2. The app passes it through an application salt and displays a clean, non-sensitive identifier:  
   `WOLF-DEV-7F3A-89CB-4D21` with a **1-click Copy** button.
3. The user replies to your build-in-public post or DMs you on X with their Device ID.
4. You run your 1-second key generator to produce:  
   `WOLF-KEY-9X4A-B821-4E10` (cryptographically bound to that exact machine).
5. The user pastes the key. The Tauri app validates the signature **100% locally and offline**. It encrypts the token to local storage and never asks again.

---

## 2. Evaluation of Protection Methods

| Method | Protection Level | User Friction | Offline Support | Fits Wolf Brand? | Verdict |
|---|---|---|---|---|---|
| **1. Cloud Phone-Home DRM** | High | 🔴 High (Requires internet, accounts, accounts can get banned) | ❌ Broken (Fails without internet) | ❌ Violates Zero-Telemetry | **REJECTED** |
| **2. Global Promo Code** | 🔴 Zero (Leaks in 5 min on Discord/Reddit) | 🟢 Very Low | 🟢 Works offline | ⚠️ Unprofessional | **REJECTED** |
| **3. Code Obfuscation Only** | 🟡 Low (Slows down reverse engineers only) | 🟢 Invisible | 🟢 Works offline | 🟢 Good supplementary layer | **SUPPLEMENTARY** |
| **4. Time-Bombed Builds** | 🟡 Medium (Hard expiration date, e.g., 30 days) | 🟢 Zero (Automatic) | 🟢 Works offline | 🟢 Excellent for alpha betas | **RECOMMENDED COMBINATION** |
| **5. Offline Machine-Bound Signed Key** | 🟢 **High (Locked per device)** | 🟢 **Low (1-time paste, no account needed)** | 🟢 **100% Offline** | 🟢 **100% Sovereign & Local** | **WINNER (GOLD STANDARD)** |

---

## 3. Cross-Platform Hardware Fingerprinting (Zero Root / Zero Admin)

To prevent friction, the fingerprint must:
1. **Never require root/administrator privileges**.
2. **Be stable across reboots, minor peripheral updates, and network changes** (never use MAC address, which breaks when switching between Wi-Fi and Ethernet).
3. **Never expose the user's raw hardware serials or private information**.

### OS Implementation Breakdown
- **Linux:** `/etc/machine-id` (fallback `/var/lib/dbus/machine-id`). Standard across all systemd and D-Bus distros. 100% stable; readable without root.
- **macOS:** `IOPlatformExpertDevice` -> `IOPlatformUUID` (or `gethostuuid(2)`). Native to Apple logic board; survives OS updates.
- **Windows:** Registry `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography\MachineGuid`. Standard cryptographic GUID; read-only for standard users.

All inputs are salted and hashed via SHA-256 so no real hardware ID is ever leaked or transmitted.

---

## 4. The "Build in Public on X" Growth Loop

Using machine-locked keys when building in public on X is not just a security safeguard—**it is a massive viral growth catalyst**:

1. **YOU POST ON X:**  
   *"Building Wolf Timeline in public 🐺 Cyber-obsidian, local-first, AES-256 encrypted dev workspace. Releasing 50 private alpha seats today! Download the build, copy your Device ID from the launch screen, and drop it in replies or DMs!"*
2. **USER DOWNLOADS APP:**  
   Launches the app, sees the obsidian Sovereign Node Activation screen, and clicks **[📋 Copy Device ID]**.
3. **USER REPLIES ON X:**  
   *"Looks amazing! Here's my Device ID: `WOLF-DEV-8F21-33C1`"*  
   *(Every reply triggers the X algorithm, multiplying impressions and visibility)*
4. **YOU REPLY WITH KEY:**  
   *"Key issued: `WOLF-KEY-9X42-B811-4E10`. Welcome to the pack!"*
5. **COMMUNITY TRUST & ZERO RESELLING:**  
   That key ONLY executes on their machine. If an opportunistic reseller tries to package and resell the binary, it fails on every customer's machine.

---

## 5. Security Threat Model

- **Can a friend forward the binary to 100 people?** No. The binary fails on the other 99 machines.
- **Can someone resell the binary?** No. Buyers will be blocked at the activation screen.
- **Does it require internet?** No. The mathematical signature check is 100% offline in Rust.
- **What about the creator (You)?** A master founder bypass key lets you run anywhere without generating keys for yourself.
