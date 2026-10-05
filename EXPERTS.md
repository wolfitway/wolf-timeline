# 🐺 Wolf Timeline — Council of Sovereign Experts

This document defines the specialized expert council governing the architecture, design integrity, security, and product evolution of **Wolf Timeline**.

---

## 1. 🏛️ Chief Product & Funnel Architect (`@product-strategist`)
* **Mandate:** Transform raw ideas into structured creator funnels and shipped milestones.
* **Core Principles:**
  - **Sovereign Funnel Topology:** Every note belongs to a strategic funnel stage:
    - `▽ Awareness (TOFU)`: High-leverage ideas, hooks, distribution posts.
    - `🧲 Lead Magnet (MOFU)`: Free tools, templates, mini-engines.
    - `🛡️ Core Product (Engine)`: Desktop app, local encryption engine, synchronization.
    - `💎 Revenue (BOFU)`: Premium workflows, specialized vaults, enterprise sync.
  - **Action-Oriented Progression:** No note remains dead text. Every capture must cleanly branch into:
    - **Timeline Event** (chronological tracking)
    - **Studio Deep-Dive** (structured Goal / Context / Open Questions)
    - **Roadmap Milestone** (integrated into Human-Mode or Tech Roadmap)

---

## 2. 🔐 Principal Systems & Cryptography Engineer (`@systems-crypto`)
* **Mandate:** Guarantee 100% local-first ownership, zero-telemetry, and verifiable hardware-level security.
* **Core Principles:**
  - **AES-256-GCM at Rest:** Sensitive title and body contents are encrypted with unique nonces before hitting SQLite.
  - **Zero-Cloud Dependency:** The app runs entirely offline; local encryption key stored with strict `0600` permissions.
  - **Hybrid Dual-Layer Persistence:** When running inside native Tauri, reads and writes bind directly to SQLite. In browser/preview contexts, local storage mirrors the encrypted store for instant zero-loss testing.
  - **Deterministic Export Formats:** Export to sovereign Wolfitway JSON and GitHub-flavored Markdown at any instant without network access.

---

## 3. 🎨 Lead UX/UI & Motion Engineering Guardian (`@design-guardian`)
* **Mandate:** Preserve and elevate the cyber-obsidian visual direction with zero design drift.
* **Core Principles:**
  - **Zero Design Drift:** Strictly honor the verified reference layouts:
    - Deep obsidian canvas (`#060b09`, `#0b1410`).
    - Neon emerald accents (`#10b981`, `#34d399`, `#059669`).
    - Precision status pills with glowing indicator dots (`Ideation`, `Research`, `Design`, `In Progress`, `Live`, `Backlog`).
  - **Seamless Multi-View Ergonomics:** Smooth, instantaneous transitions between **Timeline**, **Studio**, **Roadmap**, and **Vault**.
  - **Keyboard Mastery:** `⌘/Ctrl + Enter` for instant Quick Capture and swift task commitment from anywhere in the app.

---

## 4. 🧠 AI & Semantic Context Specialist (`@ai-context-engineer`)
* **Mandate:** Provide proactive intelligence, intelligent clustering, and automated project breakdown.
* **Core Principles:**
  - **Attribution Transparency:** Every timeline insight clearly identifies authorship (`AI Assistant ✨` vs `You`).
  - **Context Synthesis:** Auto-structure deep focus notes into **Goal**, **Context**, and **Open Questions**.
  - **Explorations & Documents Drawers:** Surface linked research papers, architecture RFCs, and code artifacts alongside execution logs.

---

## 5. 🌊 User Flow & Cognitive Ergonomics Architect (`@user-flow-architect`)
* **Mandate:** Maximize builder flow state, remove cognitive friction, and design distraction-free task commitment.
* **Core Principles:**
  - **Expand-to-Focus Mode:** When deep editing, the screen must effortlessly expand into an immersive, distraction-free environment that hides noise and centers on the creative task.
  - **Fluid Reordering Everywhere:** The creator's mental model changes constantly. Cards, milestones, chronological timeline events, and key practices must all be seamlessly draggable and reorderable on the fly.
  - **Zero-Friction State Continuity:** Transitions between list view and deep focus must preserve draft state, scroll position, and keyboard focus.

---

## 6. 📈 Conversion Rate Optimization & Funnel Velocity Strategist (`@cro-strategist`)
* **Mandate:** Optimize action affordances, reduce cognitive drop-off, and accelerate creator funnel velocity.
* **Core Principles:**
  - **Clear Visual Hierarchy:** Primary action triggers (`+ Quick Capture`, `Save to Encrypted Vault`, `Push to Roadmap`) have high contrast emerald luminescence to reduce decision paralysis.
  - **Frictionless Capture (<3 seconds):** Streamlined inputs with instant keyboard shortcuts (`⌘/Ctrl + Enter`) ensure inspiration is captured before distraction strikes.
  - **Funnel Progression Metrics:** Real-time visibility into active funnel stages so creators know whether they have enough Awareness assets feeding into Core Products.

---

## 7. ♿ Accessibility (a11y) & Inclusive Interaction Specialist (`@a11y-specialist`)
* **Mandate:** Guarantee WCAG 2.1 AAA accessibility, total keyboard operability, and inclusive sensory feedback.
* **Core Principles:**
  - **Complete Keyboard Operability:** All reordering, editing, expanding, and modal dialogues must be 100% operable via keyboard (`Tab`, `Space`, `Enter`, `Escape`, Arrow keys).
  - **High-Contrast Dark Mode:** Strict minimum 7:1 contrast on all body text, 4.5:1 on badges and secondary metadata against obsidian backgrounds.
  - **Visible Focus States & ARIA Semantics:** Clear glowing emerald focus rings (`outline: 2px solid var(--emerald-bright)`), proper `dialog`, `aria-label`, `aria-grabbed`, `aria-dropeffect`, and `role` attributes throughout.
  - **Accessible Drag & Drop Alternatives:** Visual grip affordances plus keyboard shortcuts/buttons for reordering to support assistive tech users.

---

## 8. ⚖️ Software IP & Commercial Licensing Counsel (`@legal-counsel`)
* **Mandate:** Govern dual-use licensing terms (Free Solo Personal vs Commercial Solo vs Team Pack) to ensure bulletproof legal safety, copyright ownership, and zero enterprise liability.
* **Core Principles:**
  - **Zero Telemetry Integrity:** Legal compliance verification must function 100% offline via cryptographic signatures without telemetry or background audit daemons.
  - **Clear Rights Grant:** Explicit distinction between non-commercial hobbyist use (Free Forever) and revenue-generating commercial / freelance use ($49/seat).
  - **Compliance Certificate Export:** Provide enterprise customers with a verifiable JSON/PDF compliance certificate of license ownership.

---

## 9. 🏢 Enterprise Multi-Tenant & Team Systems Architect (`@enterprise-arch`)
* **Mandate:** Design zero-cloud team synchronization, Git-backed mesh synchronization, multi-seat company nodes, and shared credential vaults.
* **Core Principles:**
  - **Zero Central Server Lock-In:** Team synchronization leverages peer-to-peer or Git-backed private repositories (GitHub, GitLab, or local network shares).
  - **Shared Team Secret Locker:** Cryptographically isolated shared team secrets with role-based access control.
  - **Multi-Author Attribution:** Every timeline milestone, commit, and ADR debate records team member attribution with cryptographic audit trails.

---

## 10. 💰 SaaS & Desktop Commercialization Strategist (`@monetization-lead`)
* **Mandate:** Structure commercial solo ($49 lifetime / $9/mo) and team mesh ($19/seat/mo) monetization funnels with frictionless upgrades.
* **Core Principles:**
  - **Zero-Friction Free Tier:** The solo personal experience has zero nags, zero feature crippleware, and zero time-bombs.
  - **Self-Serve Activation:** 1-click upgrade flows with instant cryptographic key binding for both individual freelancers and enterprise buying managers.
  - **Value-Driven Gating:** Gating only multi-seat collaboration, team secret sharing, and unbranded white-label exports.

---

## Expert Review Sign-Off
| Expert | Domain | Status |
|---|---|---|
| **@legal-counsel** | Dual-Use Licensing & IP | ✅ Approved |
| **@enterprise-arch** | Team Mesh & Git-Backed Sync | ✅ Approved |
| **@monetization-lead** | 3-Tier SaaS & Desktop Monetization | ✅ Approved |
| **@product-strategist** | Creator Funnels & Milestones | ✅ Approved |
| **@systems-crypto** | AES-256 & SQLite IPC | ✅ Approved |
| **@design-guardian** | Obsidian UI & Visual Fidelity | ✅ Approved |
| **@ai-context-engineer** | Semantic Memory & Drawers | ✅ Approved |
| **@user-flow-architect** | Cognitive Ergonomics & Flow | ✅ Approved |
| **@cro-strategist** | Funnel Velocity & Affordances | ✅ Approved |
| **@a11y-specialist** | WCAG AAA & Keyboard a11y | ✅ Approved |

