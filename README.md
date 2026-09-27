# 🐺 Wolf Timeline (Dev Timeline & Creator Funnel Engine)

Local-first, encrypted capture → auto-generated Markdown timelines, Explore Radar reminders, and Sovereign Funnel Architecture.
No cloud, no forced telemetry, pure local ownership.

---

## What It Does

1. **⚡ Quick Capture & Auto-Detection**
   - Typed Sovereign Entries: `💡 Ideas`, `🔗 Links / Resources`, `📝 Content / Posts`, and `🗺️ Build Milestones`.
   - URL auto-detection with 1-click external browser opening.
   - Tagging and Funnel Stage categorization (`Top: Awareness`, `Mid: Free Tool`, `Core: App Engine`, `Bottom: Monetization`).

2. **🔒 Sovereign Storage & Encryption**
   - SQLite with AES-256-GCM encryption at rest for sensitive title and note contents.
   - Key generation with Unix `0600` owner-only permissions in the OS app data directory.

3. **📡 Explore Radar & Proactive Reminders**
   - **Action Radar:** Scheduled resurfacing dates for posts, links, and ideas with "Due Today" and "Overdue" triggers.
   - **Active Sprint Board:** Quick prioritization of "In Progress" builds.
   - **Serendipity Radar:** Surfaces forgotten backlog gems to spark cross-pollination and new product ideas.

4. **📜 Timeline & Multi-Dimensional Filters**
   - Real-time search across titles, notes, tags, and URLs.
   - Filter by type, funnel stage, and status (`Backlog` ➔ `In Progress` ➔ `Shipped`).

5. **🚀 Ecosystem Exporter & Wolfitway Alignment**
   - Generates structured Markdown with smart "Next Steps" prioritized by active milestones.
   - Exports Wolfitway ecosystem JSON matching the 5 Human Value Pillars.
   - Live Funnel Health metrics breakdown (TOFU, MOFU, Core, BOFU).

---

## How to Run

Prerequisites: Rust toolchain, Tauri CLI (`cargo install tauri-cli` or `npx @tauri-apps/cli`).

```bash
# Run in dev mode with hot reloading
cargo tauri dev

# Build production native desktop binary
cargo tauri build
```

---

## Data Locations

- **Notes DB:** OS data dir → `dev-timeline/notes.db` (SQLite, encrypted fields)
- **Encryption Key:** OS data dir → `dev-timeline/local.key`
