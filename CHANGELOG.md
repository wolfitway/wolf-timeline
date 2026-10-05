# Changelog

All notable changes to **Wolf Timeline** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.1] - 2026-10-06

### ⚡ Smart Secret & Credential Scanner Engine
- **Expanded AI & Developer Key Detection**: Added native detection for DeepSeek API (`sk-[hex]{32}`), Google Gemini AI Studio (`AQ...`), Fal.ai (`uuid:secret`), and Paddle Merchant Sandbox/Production API keys.
- **cURL Basic Authentication Parsing**: Added extractor for `curl -u "user:password"` commands that parses basic credentials, passwords containing spaces, and associates the target host/endpoint automatically.
- **Multi-line Account Block Parsing**: Added resilient multi-line pattern matchers capable of extracting credentials formatted as consecutive lines of `service`, `username/email`, and high-entropy passwords (e.g. game dev portals, hosting platforms).
- **Inline Credential Scraper**: Added recognition for inline formats like `hetzner pass: <secret>`, `asura host:<secret>`, and dual-field lines (`erovinieta pass <secret> email <user>`).
- **Financial & Hardware Identifiers**: Added detection for International Bank Account Numbers (IBAN) and ISO 3779 Vehicle Identification Numbers (VIN).
- **Unit Test Coverage**: Added 4 new test suites in `tests/scanner.test.ts` (25/25 total passing unit tests).

---

## [1.1.0] - 2026-10-06

### 🎨 Themes & Design Tokens
- **Universal Dynamic Cascading Themes**: Fixed theme variables not cascading to non-bookmark views. Standardized CSS selectors to `:root[data-theme="..."], [data-theme="..."]` with explicit attribute handling on `document.documentElement`.
- **Dynamic Accent Color Mapping**: Replaced hardcoded `#10b981` status badges, borders, and SVG brand assets across TimelineView, RoadmapView, and StudioView with responsive custom properties (`var(--emerald-main)`, `var(--emerald-bright)`), allowing full real-time palette adaptation across *Cyber Obsidian*, *Cyber Neon Cyan*, *Amber Sovereign*, *Midnight Sapphire*, *Crimson Terminal*, and *Matrix Phosphor*.

### 🔤 Typography & Editor Fonts
- **Comprehensive Font Propagation**: Fixed font preference selector ignoring headers, buttons, cards, and inputs. Updated `[data-font="..."]` to synchronize both `--font-sans` and `--font-display` (and `--font-mono` where appropriate) across Plus Jakarta Sans, Inter UI, Outfit, JetBrains Mono, and Fira Code.
- **Universal Form Font Inheritance**: Added global reset rules for `button`, `input`, `optgroup`, `select`, and `textarea` to inherit the active font family seamlessly.

### 🔍 Display & Font Scaling (Power Users)
- **Proportional Scaling Engine**: Implemented real-time zoom & ratio calculation based on standard 14px scale (`--base-font-size`, `--font-scale-ratio`, and `document.documentElement.style.zoom`).
- **Responsive Percentage Containers**: Converted fixed `100vh`/`100vw` layout shells across `App.vue`, `TimelineView.vue`, `RoadmapView.vue`, `BookmarksView.vue`, `SettingsView.vue`, and `VaultView.vue` to relative percentage dimensions (`100%`), eliminating viewport overflow or scroll clipping when zooming from **11px (Micro)** to **20px (Ultra Large)**.
- **Debounced Slider Interaction**: Live real-time scaling on slider drag (`@input`) with settled toast confirmation (`@change` / preset buttons).

### 🔖 Bookmarks & Select Dropdown Accessibility
- **High-Contrast `<select>` & `<option>` Styling**: Resolved native OS/Linux GTK/WebKit dropdown contrast bugs where default options rendered illegibly with white-on-white or dark-on-dark text.
- Added explicit dark background (`var(--bg-card)`) and legible text color (`var(--text-primary)`) rules for all native selects and option menus across Bookmarks and Studio.

---

## [1.0.0] - 2026-10-05

### Initial Release
- **Sovereign Dev Notes & Timeline**: Local-first markdown editor, visual cards timeline, and tag filtering.
- **Encrypted Secret Vault**: AES-256-GCM hardware cryptography for API keys, env files, and credentials.
- **Interactive Roadmap Planner**: Phased milestone tracking with draggable priorities.
- **IndexedDB Bookmark Vault**: Database persistence, automatic classification, and strict timeline tag isolation.
- **Offline TTS Voice Guide**: Kokoro voice synthesis and speech control engine.
- **License System**: Solo Personal Free, Commercial Solo, and Pack Mesh Team tier activation.
