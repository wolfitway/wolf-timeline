// =========================================================================
// 🐺 WOLF TIMELINE — CORE CONTROLLER & STATE ENGINE
// Council of Experts: @product-strategist, @systems-crypto, @design-guardian, @ai-context-engineer
// =========================================================================

// Safe Tauri IPC Resolver
const getInvoke = () => {
  if (window.__TAURI__ && typeof window.__TAURI__.invoke === "function") {
    return window.__TAURI__.invoke;
  }
  if (window.__TAURI__ && window.__TAURI__.tauri && typeof window.__TAURI__.tauri.invoke === "function") {
    return window.__TAURI__.tauri.invoke;
  }
  return null;
};

// =========================================================================
// INITIAL PROJECT SEED SUITE (7 Real Production-Grade Projects)
// =========================================================================
const DEFAULT_PROJECTS = [
  {
    id: 1,
    title: "Q3 Infrastructure Overhaul",
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: "ideation",
    status_label: "Ideation",
    funnel_stage: "product",
    kind: "project",
    tags: ["infra", "pipeline"],
    body: `Goal\nRebuild deployment pipeline for scale and resilience. Focus on zero-downtime, automated rollbacks, and better observability.\n\nContext\n- High deployment latency causing feedback friction\n- Inconsistent staging vs production environments\n- Need automated rollback triggers on Prometheus p99 anomalies\n\nOpen questions\n- Do we migrate fully to Nix-based container builds?\n- Can we achieve sub-60-second end-to-end integration tests?`,
    events: [
      { title: "Idea captured", desc: "Initial concept and problem framing.", time: "10m ago", author: "ai", icon: "bulb", active: true },
      { title: "Research started", desc: "Reviewed current pipeline bottlenecks.", time: "8m ago", author: "user", icon: "doc", active: false },
      { title: "Stakeholder input", desc: "Collected feedback from Platform team.", time: "5m ago", author: "user", icon: "edit", active: false }
    ],
    ai_explorations: [
      {
        id: "exp-101",
        title: "Zero-downtime rollback strategies",
        model: "Gemini 2.5",
        url: "https://cloud.google.com/architecture/application-deployment-and-testing-strategies",
        rationale: "Selected blue-green deployments with instant traffic redirection via Envoy ingress over rolling updates to eliminate in-flight socket drops.",
        transcript: "User: How can we guarantee zero socket drops on rollback for p99 latency spikes?\n\nAI Assistant: In a high-throughput stateful service, rolling restarts cause connection resets during draining. Recommendation: Deploy parallel shadow replica pods and switch traffic using Envoy weighted routing with 5-second health validation.",
        date: "10m ago"
      },
      {
        id: "exp-102",
        title: "Nix container builds vs Dockerfile",
        model: "Claude 3.7",
        url: "https://nixos.org/guides/building-docker-images-with-nix",
        rationale: "Adopted Nix derivations for deterministic image hashes across local Linux and CI runners to prevent non-reproducible deployments.",
        transcript: "User: We have non-reproducible dependency builds between dev machines and CI.\n\nAI Assistant: Standard Docker layers depend on mutable upstream apt/npm repositories. By pinning flake.lock in Nix, every image build produces the exact bit-for-bit SHA256 digest regardless of environment.",
        date: "1h ago"
      }
    ],
    docs: [
      { title: "Pipeline Architecture RFC v2", badge: "PDF" },
      { title: "Kubernetes Cluster Topology", badge: "YAML" },
      { title: "Rollback SLA Runbook", badge: "MD" }
    ]
  },
  {
    id: 2,
    title: "AI Assistant Context Engine",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: "research",
    status_label: "Research",
    funnel_stage: "product",
    kind: "idea",
    tags: ["ai", "memory"],
    body: `Goal\nImprove long-term memory and context relevance across sovereign project timelines using local vector embeddings.\n\nContext\n- Creators need instant synthesis across hundreds of notes and links\n- Cloud vector embeddings leak private creator data\n- Must run 100% on-device using ONNX Runtime or local quantized embeddings\n\nOpen questions\n- How to maintain low memory footprint on 8GB RAM laptops?\n- Optimal chunking strategy for mixed markdown and code snippets?`,
    events: [
      { title: "Context engine RFC drafted", desc: "Outlined hybrid BM25 + dense retrieval model.", time: "2h ago", author: "ai", icon: "bulb", active: true },
      { title: "Quantization benchmark completed", desc: "Tested all-MiniLM-L6-v2 on Apple Silicon & Linux.", time: "1h ago", author: "user", icon: "brain", active: false }
    ],
    ai_explorations: [
      {
        id: "exp-201",
        title: "Local vector store memory comparison",
        model: "Gemini 2.5",
        url: "https://sqlite.org/vtab.html",
        rationale: "Chose SQLite vector virtual table extension (sqlite-vec) over separate standalone vector databases for unified single-file encrypted persistence.",
        transcript: "User: Should we run an external vector daemon or embed vector search into SQLite?\n\nAI Assistant: External vector daemons (like Qdrant or Milvus) add significant background resource usage and separate backup management. sqlite-vec allows zero-overhead embedded vector search inside the exact same AES-256 encrypted database file.",
        date: "2h ago"
      }
    ],
    docs: [
      { title: "Embedding Benchmarks.csv", badge: "CSV" },
      { title: "Memory Engine Specs", badge: "MD" }
    ]
  },
  {
    id: 3,
    title: "Design System v2",
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: "design",
    status_label: "Design",
    funnel_stage: "product",
    kind: "project",
    tags: ["design", "ui"],
    body: `Goal\nUnify components and improve developer experience with sovereign obsidian dark mode tokens.\n\nContext\n- High visual polish with emerald accents (#10b981, #34d399)\n- Strict zero-drift design tokens across all views\n- Fluid micro-animations and keyboard-first accessibility\n\nOpen questions\n- Design token serialization for multi-platform web/desktop?`,
    events: [
      { title: "Wolf design tokens formalized", desc: "Created CSS token hierarchy with HSL emerald glow.", time: "5h ago", author: "user", icon: "edit", active: true },
      { title: "Status pills & badges audited", desc: "Harmonized contrast ratios and padding.", time: "4h ago", author: "ai", icon: "check", active: false }
    ],
    ai_explorations: [
      {
        id: "exp-301",
        title: "Accessible dark mode contrast analysis",
        model: "Claude 3.7",
        url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html",
        rationale: "Adjusted secondary gray text from #6b7280 to #9ca3af to achieve WCAG AAA contrast against #0b1410 obsidian background.",
        transcript: "User: Please evaluate color contrast for our dark cyber theme.\n\nAI Assistant: At #060b09 background, pure white (#ffffff) has 18.5:1 contrast. Secondary text at #9ca3af achieves 7.8:1 which passes AAA standards, whereas darker slates fell below readability in low ambient light.",
        date: "5h ago"
      }
    ],
    docs: [
      { title: "Design System Figma Mirror", badge: "LINK" },
      { title: "Component Token Reference", badge: "CSS" }
    ]
  },
  {
    id: 4,
    title: "Mobile Offline Sync",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: "ideation",
    status_label: "Ideation",
    funnel_stage: "product",
    kind: "project",
    tags: ["mobile", "offline"],
    body: `Goal\nEnable reliable offline-first workflows across mobile devices without third-party server lock-in.\n\nContext\n- Conflict-free replicated data types (CRDTs)\n- Peer-to-peer encrypted sync via local Wi-Fi / Bluetooth or private relay\n- Sovereign AES-256 backup archives\n\nOpen questions\n- Battery impact of background P2P peer discovery?`,
    events: [
      { title: "Sync engine architecture proposal", desc: "Evaluated automerge vs yjs for mobile SQLite.", time: "1d ago", author: "ai", icon: "bulb", active: true },
      { title: "Peer discovery prototype", desc: "Tested mDNS local peer resolution.", time: "22h ago", author: "user", icon: "doc", active: false }
    ],
    ai_explorations: [
      {
        id: "exp-401",
        title: "P2P protocol security audit",
        model: "Gemini 2.5",
        url: "https://noiseprotocol.org/",
        rationale: "Selected Noise Protocol Framework (Noise_XX) for mutual authentication and ephemeral forward-secret session keys over local Wi-Fi sync.",
        transcript: "User: What handshake pattern should we use for local P2P sync without trusting local LAN routers?\n\nAI Assistant: Use Noise_XX with pre-shared device fingerprint verification. Both devices exchange static keys during QR code pairing, guaranteeing end-to-end forward secrecy against LAN snooping.",
        date: "1d ago"
      }
    ],
    docs: [
      { title: "CRDT Sync Protocol Draft", badge: "MD" }
    ]
  },
  {
    id: 5,
    title: "Analytics Event Taxonomy",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status: "backlog",
    status_label: "Backlog",
    funnel_stage: "lead_magnet",
    kind: "task",
    tags: ["analytics", "data"],
    body: `Goal\nStandardize events and improve data quality across sovereign creator funnel touchpoints.\n\nContext\n- No third-party tracking scripts or cookie banners\n- First-party privacy-preserving telemetry\n- Track conversion from Awareness ➔ Lead Magnet ➔ Core Product\n\nOpen questions\n- Differential privacy thresholds for small creator cohorts?`,
    events: [
      { title: "Telemetry taxonomy draft", desc: "Classified core funnel lifecycle states.", time: "2d ago", author: "ai", icon: "bulb", active: false }
    ],
    ai_explorations: [
      {
        id: "exp-501",
        title: "First-party analytics privacy safeguards",
        model: "Claude 3.7",
        url: "https://en.wikipedia.org/wiki/Differential_privacy",
        rationale: "Implemented client-side aggregation so individual user IP addresses and session cookies are never logged or stored.",
        transcript: "User: How to measure creator funnel health without invasive user tracking?\n\nAI Assistant: Count aggregate funnel transitions (Awareness ➔ Tool ➔ App) in memory and flush anonymized daily counts. No unique identifiers are persisted, completely bypassing GDPR/CCPA cookie banner requirements.",
        date: "2d ago"
      }
    ],
    docs: [
      { title: "Funnel Conversion Event Map", badge: "JSON" }
    ]
  },
  {
    id: 6,
    title: "Renewable microgrid optimizer",
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    status: "exploring",
    status_label: "Exploring",
    funnel_stage: "lead_magnet",
    kind: "project",
    tags: ["cleantech", "ml", "optimizer"],
    body: `Goal\nBuild a smart optimizer for renewable microgrids that balances cost, reliability, and emissions in real time.\n\nContext\n- Focus on solar + wind + battery systems\n- Use forecast data for load and generation\n- Explore reinforcement learning vs. MILP approaches\n\nOpen questions\n- How do we handle edge cases with low data availability?\n- What's the best way to incorporate regulatory incentives?`,
    events: [
      { title: "Idea added", desc: "Initial concept and mathematical framing.", time: "May 12", author: "ai", icon: "bulb", active: false },
      { title: "Market research added", desc: "Reviewed California microgrid feed-in tariffs.", time: "May 13", author: "user", icon: "doc", active: false },
      { title: "Exploration: RL approach", desc: "Benchmarked PPO against standard linear solver.", time: "May 14", author: "ai", icon: "brain", active: false },
      { title: "Notes updated", desc: "Refined battery thermal degradation constraints.", time: "May 15", author: "user", icon: "edit", active: false },
      { title: "Feasibility check completed", desc: "Validated 14% energy cost savings on simulated grid.", time: "May 16", author: "ai", icon: "check", active: true }
    ],
    ai_explorations: [
      {
        id: "exp-601",
        title: "MILP vs Deep Reinforcement Learning for Microgrids",
        model: "Gemini 2.5",
        url: "https://arxiv.org/abs/2103.00000",
        rationale: "Selected hybrid approach: Deep RL provides 1-hour fast heuristic policy, while MILP verifies hard safety & battery voltage bounds.",
        transcript: "User: Should we use pure Reinforcement Learning or Mixed Integer Linear Programming?\n\nAI Assistant: Pure RL can hallucinate unsafe discharge rates during grid brownouts. A hybrid model where RL proposes dispatch actions and a lightweight MILP solver projects them onto safety constraints provides both millisecond speed and guaranteed zero blackouts.",
        date: "3d ago"
      }
    ],
    docs: [
      { title: "Microgrid Mathematical Formulation", badge: "TEX" }
    ]
  },
  {
    id: 7,
    title: "Sovereign Creator Funnel Portal",
    created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    status: "in-progress",
    status_label: "In Progress",
    funnel_stage: "revenue",
    kind: "project",
    tags: ["funnel", "creator", "vault"],
    body: `Goal\nConnect creator lead magnets directly into encrypted product vaults with sovereign payments.\n\nContext\n- Creators own their customer relationships without platform intermediaries\n- Instant checkout with local license key verification\n- Auto-sync roadmap releases to paying patrons\n\nOpen questions\n- Direct peer-to-peer license verification protocols?`,
    events: [
      { title: "Funnel integration spec", desc: "Mapped revenue funnel triggers.", time: "4d ago", author: "ai", icon: "bulb", active: true },
      { title: "Cryptographic license generator", desc: "Implemented ed25519 signing.", time: "3d ago", author: "user", icon: "check", active: false }
    ],
    ai_explorations: [
      {
        id: "exp-701",
        title: "Sovereign license verification without centralized server",
        model: "Claude 3.7",
        url: "https://ed25519.cr.yp.to/",
        rationale: "Adopted public-key asymmetric signatures: creators sign offline licenses with their private key; the app verifies using embedded public key with zero network call.",
        transcript: "User: How can buyers verify lifetime software licenses when working offline on a plane?\n\nAI Assistant: By issuing Ed25519 cryptographic tokens containing the user's sovereign public key and license tier. The desktop app verifies the signature using the creator's bundled public key. Zero phone-home servers required.",
        date: "4d ago"
      }
    ],
    docs: [
      { title: "Sovereign Commerce Whitepaper", badge: "PDF" }
    ]
  }
];

// Initial Roadmap Seed Data
const DEFAULT_ROADMAP = [
  {
    id: "rm-1",
    title: "Calmer Presence",
    subtitle: "Build the foundation for calmer, more intentional daily presence.",
    status: "in-progress",
    statusLabel: "In Progress",
    dotClass: "dot-green",
    badgeClass: "status-in-progress",
    description: "Build the foundation for calmer, more intentional daily presence. Move from reaction to response. Create space. Choose with clarity.",
    focus: "Daily calm systems",
    outcome: "More space, less noise",
    practices: [
      { text: "Morning grounding", checked: true },
      { text: "Digital minimal defaults", checked: true },
      { text: "Pause & realign moments", checked: true }
    ]
  },
  {
    id: "rm-2",
    title: "Inner Compass",
    subtitle: "Strengthen self-trust and clarity to navigate decisions with ease.",
    status: "up-next",
    statusLabel: "Up Next",
    dotClass: "dot-amber",
    badgeClass: "status-up-next",
    description: "Strengthen self-trust and clarity to navigate decisions with ease. Align daily actions with deep core values and sovereign direction.",
    focus: "Intuitive decision filters",
    outcome: "Zero hesitation, aligned momentum",
    practices: [
      { text: "Evening value debrief", checked: false },
      { text: "Decisive triage ritual", checked: true }
    ]
  },
  {
    id: "rm-3",
    title: "Human-Mode OS",
    subtitle: "Lightweight system for focus, energy, and meaningful defaults.",
    status: "live",
    statusLabel: "Live",
    dotClass: "dot-blue",
    badgeClass: "status-live",
    description: "Lightweight system for focus, energy, and meaningful defaults. A unified personal operating framework designed for autonomous builders.",
    focus: "Peak flow architecture",
    outcome: "Sustained high-output calm",
    practices: [
      { text: "Batch communication windows", checked: true },
      { text: "Deep work time-boxing", checked: true }
    ]
  },
  {
    id: "rm-4",
    title: "Deeper Connection",
    subtitle: "Cultivate relationships and presence that recharge and inspire.",
    status: "backlog",
    statusLabel: "Planned",
    dotClass: "dot-hollow",
    badgeClass: "status-backlog",
    description: "Cultivate relationships and presence that recharge and inspire. Build sovereign bonds and collaborative feedback loops with peers.",
    focus: "Intentional communion",
    outcome: "Thriving creator ecosystem",
    practices: [
      { text: "Weekly masterminds", checked: false },
      { text: "Presence without screens", checked: false }
    ]
  }
];

// =========================================================================
// APPLICATION STATE
// =========================================================================
const state = {
  currentTab: "timeline",
  notes: [],
  selectedNoteId: 1,
  activeRoadmapId: "rm-1",
  qcCategory: "idea",
  roadmapData: [],
  draggedCardId: null,
  draggedEventIdx: null,
  draggedRoadmapId: null,
  draggedPracticeIdx: null,
  draggedStudioEventIdx: null,
  draggedAiExpIdx: null,
  draggedMoodIdx: null,
  isDraggingMood: false,
  isLicenseActive: false,
  currentDeviceId: "",
  currentLicenseKey: "",
  activeViewingExploration: null,
  expandedPhases: { "rm-1": true },
  isRoadmapCanvasExpanded: false,
  // Secret Vault Zero-Knowledge State
  isSecretsVaultUnlocked: false,
  vaultCryptoKey: null,
  vaultDecryptedSecrets: [],
  vaultFilterCategory: "all",
  vaultSearchQuery: "",
  vaultAutoLockCountdown: 300,
  vaultAutoLockTimerId: null
};

// =========================================================================
// DOM REFERENCES
// =========================================================================
const navTabs = document.getElementById("navTabs");
const viewPanels = {
  timeline: document.getElementById("timelineView"),
  studio: document.getElementById("studioView"),
  roadmap: document.getElementById("roadmapView"),
  settings: document.getElementById("settingsView"),
  secrets: document.getElementById("secretsView")
};

// Secret Vault DOM References
const secretsLockedState = document.getElementById("secretsLockedState");
const secretsUnlockedState = document.getElementById("secretsUnlockedState");
const masterPasswordInput = document.getElementById("masterPassphraseInput") || document.getElementById("masterPasswordInput");
const unlockVaultBtn = document.getElementById("unlockSecretsVaultBtn") || document.getElementById("unlockVaultBtn");
const secretsVaultError = document.getElementById("secretsVaultError");
const masterPassToggleEye = document.getElementById("togglePassphraseVisibilityBtn") || document.getElementById("masterPassToggleEye");
const vaultLockHeadline = document.getElementById("vaultLockedTitle") || document.getElementById("vaultLockHeadline");
const vaultLockSubtitle = document.getElementById("vaultLockedSub") || document.getElementById("vaultLockSubtitle");
const vaultUnlockForm = document.getElementById("vaultUnlockForm");

const secretsSearchInput = document.getElementById("secretsSearchInput");
const secretsCategoryTabs = document.getElementById("secretsCategoryTabs");
const secretsListContainer = document.getElementById("secretsListContainer");
const openSecretScannerModalBtn = document.getElementById("openSecretScannerModalBtn");
const openAddSecretModalBtn = document.getElementById("openAddSecretModalBtn");
const lockSecretsVaultBtn = document.getElementById("lockSecretsVaultBtn");

const statVaultTotalCount = document.getElementById("statVaultTotalCount");
const statVaultApiCount = document.getElementById("statVaultApiCount");
const statVaultLoginCount = document.getElementById("statVaultLoginCount");
const statVaultDbCount = document.getElementById("statVaultDbCount");
const vaultAutoLockCountdownEl = document.getElementById("vaultAutoLockCountdown");

// Scanner Modal DOM
const secretScannerModal = document.getElementById("secretScannerModal");
const secretScannerDropzone = document.getElementById("secretScannerDropzone");
const secretScannerFileInput = document.getElementById("secretScannerFileInput");
const triggerBrowseFileLink = document.getElementById("triggerBrowseFileLink");
const secretScannerPasteArea = document.getElementById("secretScannerPasteArea");
const runSecretScannerBtn = document.getElementById("runSecretScannerBtn");
const secretScannerResultsWrap = document.getElementById("secretScannerResultsWrap");
const scannedCountBadge = document.getElementById("scannedCountBadge");
const toggleSelectAllScannedBtn = document.getElementById("toggleSelectAllScannedBtn");
const secretScannerResultsList = document.getElementById("secretScannerResultsList");
const saveScannedSecretsBtn = document.getElementById("saveScannedSecretsBtn");
const closeSecretScannerBtn = document.getElementById("closeSecretScannerBtn");

// Editor Modal DOM
const secretEditorModal = document.getElementById("secretEditorModal");
const secretEditorForm = document.getElementById("secretEditorForm");
const secretEditorModalTitle = document.getElementById("secretEditorModalTitle");
const secretEditorIdInput = document.getElementById("secretEditorIdInput");
const secretServiceInput = document.getElementById("secretServiceInput");
const secretCategoryInput = document.getElementById("secretCategoryInput");
const secretUsernameInput = document.getElementById("secretUsernameInput");
const secretPasswordInput = document.getElementById("secretPasswordInput");
const toggleSecretEditorPasswordEye = document.getElementById("toggleSecretEditorPasswordEye");
const generateSecretRandomBtn = document.getElementById("generateSecretRandomBtn");
const secretHostInput = document.getElementById("secretHostInput");
const secretNotesInput = document.getElementById("secretNotesInput");
const cancelSecretEditorBtn = document.getElementById("cancelSecretEditorBtn");
const saveSecretEditorBtn = document.getElementById("saveSecretEditorBtn");
const closeSecretEditorBtn = document.getElementById("closeSecretEditorBtn");

// Mood Gallery DOM
const moodGalleryCount = document.getElementById("moodGalleryCount");
const drawerMoodContent = document.getElementById("drawerMoodContent");
const moodDropzone = document.getElementById("moodDropzone");
const moodFileInput = document.getElementById("moodFileInput");
const moodUrlInput = document.getElementById("moodUrlInput");
const addMoodUrlBtn = document.getElementById("addMoodUrlBtn");
const moodGrid = document.getElementById("moodGrid");

// Web Links DOM
const webLinksCount = document.getElementById("webLinksCount");
const drawerWebContent = document.getElementById("drawerWebContent");
const webLinkInput = document.getElementById("webLinkInput");
const fetchWebLinkBtn = document.getElementById("fetchWebLinkBtn");
const webLinksList = document.getElementById("webLinksList");

// Lightbox DOM
const imageLightboxModal = document.getElementById("imageLightboxModal");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxImg = document.getElementById("lightboxImg");
const closeLightboxBtn = document.getElementById("closeLightboxBtn");

// Roadmap Direct Delete DOM
const deleteRoadmapPhaseDirectBtn = document.getElementById("deleteRoadmapPhaseDirectBtn");

// Settings DOM
const connectionsGrid = document.getElementById("connectionsGrid");
const expertsGrid = document.getElementById("expertsGrid");

// Search & Command Palette DOM
const commandPaletteBtn = document.getElementById("commandPaletteBtn");
const cardFilterInput = document.getElementById("cardFilterInput");
const clearCardFilterBtn = document.getElementById("clearCardFilterBtn");
const webLinkNoteInput = document.getElementById("webLinkNoteInput");
const commandPaletteModal = document.getElementById("commandPaletteModal");
const paletteInput = document.getElementById("paletteInput");
const paletteResults = document.getElementById("paletteResults");

// Timeline Pane DOM
const cardsListEl = document.getElementById("cardsList");
const detailTitle = document.getElementById("detailTitle");
const detailStatusBadge = document.getElementById("detailStatusBadge");
const detailStatusText = document.getElementById("detailStatusText");
const detailUpdatedTime = document.getElementById("detailUpdatedTime");
const detailNotesText = document.getElementById("detailNotesText");
const detailNotesEdit = document.getElementById("detailNotesEdit");
const timelineListEl = document.getElementById("timelineList");
const quickCaptureTriggerBtn = document.getElementById("quickCaptureTriggerBtn");
const addTimelineEventBtn = document.getElementById("addTimelineEventBtn");

// Drawers DOM
const aiExplorationsCount = document.getElementById("aiExplorationsCount");
const drawerAiContent = document.getElementById("drawerAiContent");
const docsCount = document.getElementById("docsCount");
const drawerDocsContent = document.getElementById("drawerDocsContent");
const addAiExplorationBtn = document.getElementById("addAiExplorationBtn");

// Bottom Action Buttons
const pushToRoadmapBtn = document.getElementById("pushToRoadmapBtn");
const addToVaultBtn = document.getElementById("addToVaultBtn");
const openInStudioBtn = document.getElementById("openInStudioBtn");

// Studio DOM
const closeStudioBtn = document.getElementById("closeStudioBtn");
const studioItemTitle = document.getElementById("studioItemTitle");
const studioNotesBody = document.getElementById("studioNotesBody");
const studioNotesTextarea = document.getElementById("studioNotesTextarea");
const editStudioNotesBtn = document.getElementById("editStudioNotesBtn");
const studioTimelineList = document.getElementById("studioTimelineList");

// Quick Capture Modal DOM
const quickCaptureModal = document.getElementById("quickCaptureModal");
const qcCategoryPills = document.getElementById("qcCategoryPills");
const qcTitle = document.getElementById("qcTitle");
const qcUrl = document.getElementById("qcUrl");
const qcTags = document.getElementById("qcTags");
const qcNotes = document.getElementById("qcNotes");
const qcMoreDetailsGroup = document.getElementById("qcMoreDetailsGroup");
const toggleMoreDetailsBtn = document.getElementById("toggleMoreDetailsBtn");
const quickCaptureForm = document.getElementById("quickCaptureForm");

// Add Event Modal DOM
const addEventModal = document.getElementById("addEventModal");
const addEventForm = document.getElementById("addEventForm");
const eventTitleInput = document.getElementById("eventTitleInput");
const eventDescInput = document.getElementById("eventDescInput");
const cancelEventBtn = document.getElementById("cancelEventBtn");

// Roadmap View DOM
const roadmapPhasesList = document.getElementById("roadmapPhasesList");
const rmDetailTitle = document.getElementById("rmDetailTitle");
const rmDetailStatus = document.getElementById("rmDetailStatus");
const rmDetailDescription = document.getElementById("rmDetailDescription");
const rmStatFocus = document.getElementById("rmStatFocus");
const rmStatOutcome = document.getElementById("rmStatOutcome");
const rmPracticesList = document.getElementById("rmPracticesList");
const addRoadmapPhaseBtn = document.getElementById("addRoadmapPhaseBtn");
const openEditRoadmapBtn = document.getElementById("openEditRoadmapBtn");
const addPracticeBtn = document.getElementById("addPracticeBtn");
const roadmapSplitView = document.getElementById("roadmapSplitView");
const roadmapLeftPane = document.getElementById("roadmapLeftPane");
const toggleAllPhasesBtn = document.getElementById("toggleAllPhasesBtn");
const expandRoadmapCanvasBtn = document.getElementById("expandRoadmapCanvasBtn");
const rmDetailStatusLabel = document.getElementById("rmDetailStatusLabel");
const rmStatusMenu = document.getElementById("rmStatusMenu");
const inlineNewPracticeInput = document.getElementById("inlineNewPracticeInput");

// Roadmap Modals DOM
const editRoadmapModal = document.getElementById("editRoadmapModal");
const editRoadmapForm = document.getElementById("editRoadmapForm");
const ermTitle = document.getElementById("ermTitle");
const ermSubtitle = document.getElementById("ermSubtitle");
const ermStatus = document.getElementById("ermStatus");
const ermDescription = document.getElementById("ermDescription");
const ermFocus = document.getElementById("ermFocus");
const ermOutcome = document.getElementById("ermOutcome");
const deleteRoadmapPhaseBtn = document.getElementById("deleteRoadmapPhaseBtn");
const cancelEditRoadmapBtn = document.getElementById("cancelEditRoadmapBtn");

const addRoadmapModal = document.getElementById("addRoadmapModal");
const addRoadmapForm = document.getElementById("addRoadmapForm");
const armTitle = document.getElementById("armTitle");
const armSubtitle = document.getElementById("armSubtitle");
const armStatus = document.getElementById("armStatus");
const armDescription = document.getElementById("armDescription");
const armFocus = document.getElementById("armFocus");
const armOutcome = document.getElementById("armOutcome");
const armPractices = document.getElementById("armPractices");
const cancelAddRoadmapBtn = document.getElementById("cancelAddRoadmapBtn");

const addPracticeModal = document.getElementById("addPracticeModal");
const addPracticeForm = document.getElementById("addPracticeForm");
const newPracticeInput = document.getElementById("newPracticeInput");
const cancelPracticeBtn = document.getElementById("cancelPracticeBtn");

// AI Exploration Modals DOM
const addAiExplorationModal = document.getElementById("addAiExplorationModal");
const addAiExplorationForm = document.getElementById("addAiExplorationForm");
const aiExpTitle = document.getElementById("aiExpTitle");
const aiExpModel = document.getElementById("aiExpModel");
const aiExpUrl = document.getElementById("aiExpUrl");
const aiExpRationale = document.getElementById("aiExpRationale");
const aiExpTranscript = document.getElementById("aiExpTranscript");
const cancelAiExpBtn = document.getElementById("cancelAiExpBtn");

const viewAiExplorationModal = document.getElementById("viewAiExplorationModal");
const viewAiTitle = document.getElementById("viewAiTitle");
const viewAiModelBadge = document.getElementById("viewAiModelBadge");
const viewAiDate = document.getElementById("viewAiDate");
const viewAiUrlContainer = document.getElementById("viewAiUrlContainer");
const viewAiUrlLink = document.getElementById("viewAiUrlLink");
const viewAiRationale = document.getElementById("viewAiRationale");
const viewAiTranscript = document.getElementById("viewAiTranscript");
const deleteAiExpBtn = document.getElementById("deleteAiExpBtn");
const closeViewAiBtn = document.getElementById("closeViewAiBtn");

// Vault DOM
const vaultExportJsonBtn = document.getElementById("vaultExportJsonBtn");
const vaultExportMdBtn = document.getElementById("vaultExportMdBtn");

// Distraction-Free Fullscreen Focus Editor DOM
const expandNotesFocusBtn = document.getElementById("expandNotesFocusBtn");
const focusEditorModal = document.getElementById("focusEditorModal");
const closeFocusEditorCross = document.getElementById("closeFocusEditorCross");
const focusEditorTitle = document.getElementById("focusEditorTitle");
const focusTabEdit = document.getElementById("focusTabEdit");
const focusTabPreview = document.getElementById("focusTabPreview");
const focusWordCount = document.getElementById("focusWordCount");
const saveFocusEditorBtn = document.getElementById("saveFocusEditorBtn");
const focusTextarea = document.getElementById("focusTextarea");
const focusPreviewContainer = document.getElementById("focusPreviewContainer");

// Hardware Licensing DOM
const licenseActivationModal = document.getElementById("licenseActivationModal");
const closeLicenseModalBtn = document.getElementById("closeLicenseModalBtn");
const autoGenerateLicenseBtn = document.getElementById("autoGenerateLicenseBtn");
const licenseDeviceFingerprint = document.getElementById("licenseDeviceFingerprint");
const copyDeviceFingerprintBtn = document.getElementById("copyDeviceFingerprintBtn");
const copyHwidBtnText = document.getElementById("copyHwidBtnText");
const licenseKeyInput = document.getElementById("licenseKeyInput");
const licenseErrorMsg = document.getElementById("licenseErrorMsg");
const activateLicenseBtn = document.getElementById("activateLicenseBtn");
const settingsLicenseBadge = document.getElementById("settingsLicenseBadge");
const settingsLicenseStatusText = document.getElementById("settingsLicenseStatusText");
const settingsLicenseDeviceText = document.getElementById("settingsLicenseDeviceText");
const reopenActivationBtn = document.getElementById("reopenActivationBtn");

// =========================================================================
// INITIALIZATION
// =========================================================================
async function initApp() {
  setupNavigation();
  setupQuickCapture();
  setupTimelineEvents();
  setupDrawers();
  setupMoodGallery();
  setupWebLinks();
  setupCardSearchFilter();
  setupCommandPalette();
  setupStudio();
  setupRoadmap();
  setupRoadmapModals();
  setupAiExplorationModals();
  setupSettingsView();
  setupFocusEditor();
  setupSecretsVault();
  await setupHardwareLicensing();

  // Load state
  loadStoredData();

  renderCards();
  if (state.notes.length > 0) {
    selectNote(state.notes[0].id);
  }
  renderRoadmap();
  renderSettingsView();
}

// =========================================================================
// DATA PERSISTENCE & HYBRID STORAGE
// =========================================================================
function loadStoredData() {
  try {
    const rawNotes = localStorage.getItem("wolftimeline_notes_v2");
    if (rawNotes) {
      state.notes = JSON.parse(rawNotes);
    }
  } catch (e) {
    console.warn("Notes parse error:", e);
  }

  try {
    const rawRm = localStorage.getItem("wolftimeline_roadmap_v2");
    if (rawRm) {
      state.roadmapData = JSON.parse(rawRm);
    }
  } catch (e) {
    console.warn("Roadmap parse error:", e);
  }

  if (!state.notes || state.notes.length === 0) {
    state.notes = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    saveStoredNotes();
  }

  if (!state.roadmapData || state.roadmapData.length === 0) {
    state.roadmapData = JSON.parse(JSON.stringify(DEFAULT_ROADMAP));
    saveStoredRoadmap();
  }

  // Ensure all notes have mood_gallery and bookmarks arrays with rich sample defaults
  state.notes.forEach((note) => {
    if (!Array.isArray(note.mood_gallery) || note.mood_gallery.length === 0) {
      if (note.id === 1) {
        note.mood_gallery = [
          { id: "mg-1", url: "assets/mood-sample-1.jpg", caption: "Pipeline Orchestration Visuals", date: "Today" },
          { id: "mg-2", url: "assets/mood-sample-2.jpg", caption: "Prometheus Telemetry Dashboard", date: "Today" }
        ];
      } else if (note.id === 2) {
        note.mood_gallery = [
          { id: "mg-3", url: "assets/mood-sample-3.jpg", caption: "Context Memory Engine Topology", date: "Today" }
        ];
      } else if (note.id === 3) {
        note.mood_gallery = [
          { id: "mg-4", url: "assets/wolf-logo.png", caption: "Obsidian Token Emblem", date: "Today" },
          { id: "mg-5", url: "assets/mood-sample-1.jpg", caption: "Dark High-Contrast Theme", date: "Today" }
        ];
      } else {
        note.mood_gallery = [
          { id: "mg-def-" + note.id, url: "assets/wolf-logo.png", caption: "Project Asset Reference", date: "Today" }
        ];
      }
    }

    if (!Array.isArray(note.bookmarks) || note.bookmarks.length === 0) {
      if (note.id === 1) {
        note.bookmarks = [
          { id: "bm-1", url: "https://linear.app", title: "Linear — The Issue Tracking Standard", domain: "linear.app", favicon: "https://www.google.com/s2/favicons?domain=linear.app&sz=64", date: "10m ago" },
          { id: "bm-2", url: "https://github.com/tauri-apps/tauri", title: "Tauri Apps — Build smaller, faster binaries", domain: "github.com", favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=64", date: "1h ago" }
        ];
      } else if (note.id === 2) {
        note.bookmarks = [
          { id: "bm-3", url: "https://sqlite.org", title: "SQLite — Self-contained Serverless SQL Engine", domain: "sqlite.org", favicon: "https://www.google.com/s2/favicons?domain=sqlite.org&sz=64", date: "2h ago" }
        ];
      } else {
        note.bookmarks = [
          { id: "bm-4", url: "https://wolfitway.com", title: "Wolfitway — Real Tools for Sovereign Creators", domain: "wolfitway.com", favicon: "https://www.google.com/s2/favicons?domain=wolfitway.com&sz=64", date: "Today" }
        ];
      }
    }
  });

  // Also query Tauri SQLite if running native
  const invokeFn = getInvoke();
  if (invokeFn) {
    invokeFn("list_notes")
      .then((serverNotes) => {
        if (serverNotes && serverNotes.length > 0) {
          console.log(`Verified SQLite connection: ${serverNotes.length} notes active.`);
        }
      })
      .catch((e) => console.warn("Tauri list_notes check:", e));
  }
}

function saveStoredNotes() {
  try {
    localStorage.setItem("wolftimeline_notes_v2", JSON.stringify(state.notes));
  } catch (e) {}
}

function saveStoredRoadmap() {
  try {
    localStorage.setItem("wolftimeline_roadmap_v2", JSON.stringify(state.roadmapData));
  } catch (e) {}
}

// =========================================================================
// NAVIGATION TABS
// =========================================================================
function setupNavigation() {
  navTabs.addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".nav-tab");
    if (!tabBtn) return;
    switchTab(tabBtn.dataset.tab);
  });
}

function switchTab(tabName) {
  state.currentTab = tabName;

  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  Object.keys(viewPanels).forEach((key) => {
    if (viewPanels[key]) {
      viewPanels[key].classList.toggle("active", key === tabName);
    }
  });

  if (tabName === "roadmap") {
    renderRoadmap();
  } else if (tabName === "studio") {
    populateStudioView();
  } else if (tabName === "settings") {
    renderSettingsView();
  } else if (tabName === "secrets") {
    renderSecretsVaultView();
  }
}

// =========================================================================
// TIMELINE VIEW & CARDS
// =========================================================================
function renderCards(filterQuery = "") {
  cardsListEl.innerHTML = "";
  const query = (filterQuery || state.cardFilterQuery || "").trim().toLowerCase();

  const filteredNotes = query
    ? state.notes.filter((note) => {
        const titleMatch = (note.title || "").toLowerCase().includes(query);
        const bodyMatch = (note.body || "").toLowerCase().includes(query);
        const tagsMatch = (note.tags || []).some((t) => t.toLowerCase().includes(query));
        const statusMatch = (note.status_label || note.status || "").toLowerCase().includes(query);
        return titleMatch || bodyMatch || tagsMatch || statusMatch;
      })
    : state.notes;

  if (filteredNotes.length === 0) {
    cardsListEl.innerHTML = `
      <div style="padding: 28px 16px; text-align: center; color: var(--text-dim); font-size: 13px;">
        No projects match "<strong>${escapeHtml(query)}</strong>"
      </div>
    `;
    return;
  }

  filteredNotes.forEach((note, index) => {
    const isSelected = note.id === state.selectedNoteId;
    const card = document.createElement("div");
    card.className = `card-item ${isSelected ? "active-selected" : ""}`;
    card.dataset.id = note.id;
    card.dataset.index = index;
    card.setAttribute("draggable", "true");

    const timeAgo = formatTimeAgo(note.created_at);
    const summary = extractSummary(note.body);
    const statusClass = getStatusClass(note.status);
    const statusLabel = note.status_label || getStatusLabel(note.status);

    card.innerHTML = `
      <span class="card-drag-grip" title="Drag to reorder project">⋮⋮</span>
      <div class="item-title">${escapeHtml(note.title)}</div>
      <div class="item-subtitle">${escapeHtml(summary)}</div>
      <div class="item-meta-bar">
        <div class="meta-left">
          <span class="badge-status ${statusClass}">
            <span class="dot"></span>
            <span>${statusLabel}</span>
          </span>
          ${(note.tags || [])
            .slice(0, 3)
            .map((t) => `<span class="tag-badge">${escapeHtml(t)}</span>`)
            .join("")}
        </div>
        <div class="item-time-ago">${timeAgo}</div>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".card-drag-grip")) return;
      selectNote(note.id);
    });

    // Native Drag and Drop for Cards
    card.addEventListener("dragstart", (e) => {
      state.draggedCardId = note.id;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(note.id));
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      const targetId = note.id;
      const draggedId = state.draggedCardId;
      if (!draggedId || draggedId === targetId) return;

      const fromIndex = state.notes.findIndex((n) => n.id === draggedId);
      const toIndex = state.notes.findIndex((n) => n.id === targetId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const [movedItem] = state.notes.splice(fromIndex, 1);
        state.notes.splice(toIndex, 0, movedItem);
        saveStoredNotes();
        renderCards();
      }
    });

    card.addEventListener("dragend", () => {
      document.querySelectorAll(".card-item").forEach((c) => {
        c.classList.remove("dragging");
        c.classList.remove("drag-over");
      });
      state.draggedCardId = null;
    });

    cardsListEl.appendChild(card);
  });
}

function selectNote(noteId) {
  state.selectedNoteId = noteId;
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;

  document.querySelectorAll(".card-item").forEach((card) => {
    card.classList.toggle("active-selected", parseInt(card.dataset.id) === noteId);
  });

  detailTitle.textContent = note.title;
  const statusClass = getStatusClass(note.status);
  detailStatusBadge.className = `badge-status ${statusClass}`;
  detailStatusText.textContent = note.status_label || getStatusLabel(note.status);
  detailUpdatedTime.textContent = `Updated ${formatTimeAgo(note.created_at)}`;

  detailNotesText.textContent = note.body || "No notes recorded yet. Click to write notes.";
  detailNotesEdit.value = note.body || "";
  detailNotesText.classList.remove("hidden");
  detailNotesEdit.classList.add("hidden");

  renderTimelineList(note);
  renderDrawers(note);
}

function renderTimelineList(note) {
  timelineListEl.innerHTML = "";
  const events = note.events || [];

  if (events.length === 0) {
    timelineListEl.innerHTML = `
      <div class="tl-node">
        <div class="tl-dot active"></div>
        <div class="tl-content">
          <div class="tl-left">
            <div class="tl-event-title">Idea captured</div>
            <div class="tl-event-desc">Initial concept and problem framing.</div>
          </div>
          <div class="tl-time-ago">${formatTimeAgo(note.created_at)}</div>
        </div>
      </div>
    `;
    return;
  }

  events.forEach((ev, idx) => {
    const node = document.createElement("div");
    node.className = "tl-node";
    node.setAttribute("draggable", "true");
    node.dataset.index = idx;

    const isActive = ev.active || idx === 0;
    node.innerHTML = `
      <div class="tl-dot ${isActive ? "active" : ""}"></div>
      <div class="tl-content">
        <div class="tl-left">
          <div class="tl-event-title">${escapeHtml(ev.title)}</div>
          <div class="tl-event-desc">${escapeHtml(ev.desc)}</div>
        </div>
        <div class="tl-time-ago">${escapeHtml(ev.time)}</div>
      </div>
    `;

    // Event Drag & Drop
    node.addEventListener("dragstart", (e) => {
      state.draggedEventIdx = idx;
      node.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    node.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      node.classList.add("drag-over");
    });

    node.addEventListener("dragleave", () => {
      node.classList.remove("drag-over");
    });

    node.addEventListener("drop", (e) => {
      e.preventDefault();
      node.classList.remove("drag-over");
      const fromIndex = state.draggedEventIdx;
      const toIndex = idx;
      if (fromIndex !== null && fromIndex !== toIndex) {
        const [moved] = note.events.splice(fromIndex, 1);
        note.events.splice(toIndex, 0, moved);
        saveStoredNotes();
        renderTimelineList(note);
      }
    });

    node.addEventListener("dragend", () => {
      document.querySelectorAll(".tl-node").forEach((n) => {
        n.classList.remove("dragging");
        n.classList.remove("drag-over");
      });
      state.draggedEventIdx = null;
    });

    timelineListEl.appendChild(node);
  });
}

function renderDrawers(note) {
  const explorations = note.ai_explorations || [];
  aiExplorationsCount.textContent = explorations.length;
  drawerAiContent.innerHTML = "";

  if (explorations.length === 0) {
    drawerAiContent.innerHTML = `<span class="drawer-item-title" style="color:var(--text-dim); padding:4px 0;">No AI explorations logged yet.</span>`;
  } else {
    explorations.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "drawer-item clickable";
      div.title = "Click to read full decision rationale & transcript (Drag to reorder)";
      div.setAttribute("draggable", "true");
      div.dataset.idx = idx;

      div.innerHTML = `
        <span class="drag-grip" title="Drag to reorder AI exploration" style="margin-right:8px; font-size:12px; cursor:grab;">⋮⋮</span>
        <div style="display:flex; flex-direction:column; gap:2px; flex:1;">
          <span class="drawer-item-title" style="color:var(--text-white); font-weight:600;">${escapeHtml(item.title)}</span>
          <span style="font-size:11px; color:var(--text-muted);">${escapeHtml(item.model || "AI Assistant")} • ${escapeHtml(item.date)}</span>
        </div>
        ${item.url ? `<span class="drawer-item-badge">LINK</span>` : ""}
      `;

      div.addEventListener("click", (e) => {
        if (e.target.closest(".drag-grip")) return;
        openViewAiExplorationModal(item, note);
      });

      // Drag and Drop for AI Explorations
      div.addEventListener("dragstart", (e) => {
        state.draggedAiExpIdx = idx;
        div.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(idx));
      });

      div.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        div.classList.add("drag-over");
      });

      div.addEventListener("dragleave", () => {
        div.classList.remove("drag-over");
      });

      div.addEventListener("drop", (e) => {
        e.preventDefault();
        div.classList.remove("drag-over");
        const fromIndex = state.draggedAiExpIdx;
        const toIndex = idx;
        if (fromIndex !== null && fromIndex !== toIndex && note.ai_explorations) {
          const [moved] = note.ai_explorations.splice(fromIndex, 1);
          note.ai_explorations.splice(toIndex, 0, moved);
          saveStoredNotes();
          renderDrawers(note);
        }
      });

      div.addEventListener("dragend", () => {
        document.querySelectorAll(".drawer-item").forEach((el) => {
          el.classList.remove("dragging");
          el.classList.remove("drag-over");
        });
        state.draggedAiExpIdx = null;
      });

      drawerAiContent.appendChild(div);
    });
  }

  const docs = note.docs || [];
  docsCount.textContent = docs.length;
  drawerDocsContent.innerHTML = "";
  if (docs.length === 0) {
    drawerDocsContent.innerHTML = `<span class="drawer-item-title" style="color:var(--text-dim); padding:4px 0;">No attached documents.</span>`;
  } else {
    docs.forEach((item) => {
      const div = document.createElement("div");
      div.className = "drawer-item";
      div.innerHTML = `
        <span class="drawer-item-title">${escapeHtml(item.title)}</span>
        <span class="drawer-item-badge">${escapeHtml(item.badge)}</span>
      `;
      drawerDocsContent.appendChild(div);
    });
  }

  // Render Mood Gallery & Web Links Drawers
  renderMoodGallery(note);
  renderWebLinks(note);
}

// =========================================================================
// MOOD GALLERY CONTROLLER & IMAGE DROPZONE
// =========================================================================
function renderMoodGallery(note) {
  if (!moodGalleryCount || !drawerMoodContent) return;
  if (!note) {
    note = state.notes.find((n) => n.id === state.selectedNoteId);
  }
  if (!note) return;
  const gallery = note.mood_gallery || [];
  moodGalleryCount.textContent = gallery.length;
  if (!moodGrid) return;
  moodGrid.innerHTML = "";

  if (gallery.length === 0) {
    moodGrid.innerHTML = `<span style="color:var(--text-dim); font-size:11.5px; grid-column:1/-1; padding:6px 0;">No mood images yet. Drop image files above or paste an image URL.</span>`;
    return;
  }

  gallery.forEach((item, idx) => {
    const itemEl = document.createElement("div");
    itemEl.className = "mood-item";
    itemEl.setAttribute("draggable", "true");
    itemEl.dataset.idx = idx;
    itemEl.title = `${item.caption || "Image"} (Click to enlarge in lightbox • Drag to reorder)`;
    itemEl.innerHTML = `
      <span class="mood-drag-grip" title="Drag to reorder">⋮⋮</span>
      <img src="${escapeHtml(item.url)}" draggable="false" alt="${escapeHtml(item.caption || "Moodboard Image")}" class="mood-thumb" loading="lazy" />
      <button type="button" class="mood-del-btn" title="Remove from mood gallery">✕</button>
    `;

    // Click actions (delete or open lightbox)
    itemEl.addEventListener("click", (e) => {
      // Prevent opening lightbox if a drag operation just finished
      if (state.isDraggingMood) return;
      if (e.target.closest(".mood-del-btn")) {
        e.stopPropagation();
        note.mood_gallery = (note.mood_gallery || []).filter((img) => img.id !== item.id);
        saveStoredNotes();
        renderMoodGallery(note);
        return;
      }
      openImageLightbox(item.url, item.caption || note.title);
    });

    // Native Drag and Drop Reordering within Mood Grid
    itemEl.addEventListener("dragstart", (e) => {
      state.draggedMoodIdx = idx;
      state.isDraggingMood = true;
      itemEl.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
    });

    itemEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      itemEl.classList.add("drag-over");
    });

    itemEl.addEventListener("dragleave", (e) => {
      if (!itemEl.contains(e.relatedTarget)) {
        itemEl.classList.remove("drag-over");
      }
    });

    itemEl.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      itemEl.classList.remove("drag-over");
      const raw = e.dataTransfer ? e.dataTransfer.getData("text/plain") : null;
      const parsed = raw !== null && raw !== "" ? parseInt(raw, 10) : NaN;
      const fromIdx = (state.draggedMoodIdx !== null && state.draggedMoodIdx !== undefined)
        ? state.draggedMoodIdx
        : parsed;
      const toIdx = idx;
      if (!isNaN(fromIdx) && fromIdx !== null && fromIdx !== toIdx && note.mood_gallery) {
        const [moved] = note.mood_gallery.splice(fromIdx, 1);
        note.mood_gallery.splice(toIdx, 0, moved);
        saveStoredNotes();
        renderMoodGallery(note);
      }
    });

    itemEl.addEventListener("dragend", () => {
      document.querySelectorAll(".mood-item").forEach((el) => {
        el.classList.remove("dragging");
        el.classList.remove("drag-over");
      });
      state.draggedMoodIdx = null;
      setTimeout(() => {
        state.isDraggingMood = false;
      }, 180);
    });

    moodGrid.appendChild(itemEl);
  });
}

function setupMoodGallery() {
  if (!moodDropzone || !moodFileInput) return;

  // Click on dropzone opens native file picker
  moodDropzone.addEventListener("click", () => {
    moodFileInput.click();
  });

  // Keyboard accessibility
  moodDropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      moodFileInput.click();
    }
  });

  // Drag & drop handlers
  ["dragenter", "dragover"].forEach((eventName) => {
    moodDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      moodDropzone.classList.add("drag-active");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    moodDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      moodDropzone.classList.remove("drag-active");
    });
  });

  moodDropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleImageFiles(dt.files);
    }
  });

  moodFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageFiles(e.target.files);
      moodFileInput.value = "";
    }
  });

  // Add by URL
  if (addMoodUrlBtn && moodUrlInput) {
    const addUrlAction = () => {
      const url = moodUrlInput.value.trim();
      if (!url) return;
      const note = state.notes.find((n) => n.id === state.selectedNoteId);
      if (!note) return;
      note.mood_gallery = note.mood_gallery || [];
      note.mood_gallery.push({
        id: "mood-" + Date.now(),
        url: url,
        caption: "Web Image Reference",
        date: "Just now"
      });
      saveStoredNotes();
      moodUrlInput.value = "";
      renderMoodGallery(note);
    };

    addMoodUrlBtn.addEventListener("click", addUrlAction);
    moodUrlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addUrlAction();
      }
    });
  }

  // Lightbox handlers
  if (closeLightboxBtn && imageLightboxModal) {
    closeLightboxBtn.addEventListener("click", () => {
      imageLightboxModal.close();
    });
    imageLightboxModal.addEventListener("click", (e) => {
      if (e.target === imageLightboxModal) {
        imageLightboxModal.close();
      }
    });
  }
}

function handleImageFiles(fileList) {
  const note = state.notes.find((n) => n.id === state.selectedNoteId);
  if (!note) return;
  note.mood_gallery = note.mood_gallery || [];

  Array.from(fileList).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      note.mood_gallery.push({
        id: "mood-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        url: ev.target.result,
        caption: file.name,
        date: "Just now"
      });
      saveStoredNotes();
      renderMoodGallery(note);
    };
    reader.readAsDataURL(file);
  });
}

function openImageLightbox(src, caption) {
  if (!imageLightboxModal || !lightboxImg) return;
  lightboxImg.src = src;
  if (lightboxCaption) {
    lightboxCaption.textContent = caption || "Moodboard Visual Preview";
  }
  imageLightboxModal.showModal();
}

// =========================================================================
// WEB RESEARCH & BOOKMARKS CONTROLLER
// =========================================================================
function renderWebLinks(note) {
  if (!webLinksCount || !webLinksList) return;
  const bookmarks = note.bookmarks || [];
  webLinksCount.textContent = bookmarks.length;
  webLinksList.innerHTML = "";

  if (bookmarks.length === 0) {
    webLinksList.innerHTML = `<span style="color:var(--text-dim); font-size:11.5px; padding:6px 0;">No web links saved yet. Paste an internet link above.</span>`;
    return;
  }

  bookmarks.forEach((item) => {
    const card = document.createElement("div");
    card.className = "weblink-card";
    const fav = item.favicon || `https://www.google.com/s2/favicons?domain=${item.domain || "internet"}&sz=64`;
    card.innerHTML = `
      <div class="weblink-top-row">
        <div class="weblink-main">
          <img src="${escapeHtml(fav)}" alt="" class="weblink-favicon" onerror="this.onerror=null; this.src='assets/wolf-logo.png';" />
          <div class="weblink-info">
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="weblink-title" title="${escapeHtml(item.url)}">
              ${escapeHtml(item.title || item.domain || item.url)}
            </a>
            <div class="weblink-meta">
              <span class="weblink-domain-pill">${escapeHtml(item.domain || "web")}</span>
              <span>• ${escapeHtml(item.date || "Saved")}</span>
            </div>
          </div>
        </div>
        <div class="weblink-actions">
          <button type="button" class="weblink-icon-btn copy-btn" title="Copy URL">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button type="button" class="weblink-icon-btn danger del-btn" title="Delete link">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="weblink-note-wrap" title="Click to edit custom note or takeaway">
        <span class="weblink-note-icon">📝</span>
        <span class="weblink-note-text ${item.notes ? "" : "empty"}">${escapeHtml(item.notes || "+ Add note / takeaway...")}</span>
      </div>
    `;

    // Inline Editable Note
    const noteWrap = card.querySelector(".weblink-note-wrap");
    noteWrap.addEventListener("click", () => {
      if (noteWrap.querySelector("input")) return;
      const curNotes = item.notes || "";
      noteWrap.innerHTML = `
        <span class="weblink-note-icon">📝</span>
        <input type="text" class="weblink-note-input-inline" value="${escapeHtml(curNotes)}" placeholder="Add note or takeaway..." />
      `;
      const input = noteWrap.querySelector("input");
      input.focus();
      input.select();
      const commitNote = () => {
        item.notes = input.value.trim();
        saveStoredNotes();
        renderWebLinks(note);
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") commitNote();
        if (e.key === "Escape") renderWebLinks(note);
      });
      input.addEventListener("blur", commitNote);
    });

    // Copy action
    const copyBtn = card.querySelector(".copy-btn");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(item.url);
      copyBtn.innerHTML = `✓`;
      copyBtn.style.color = "var(--emerald-bright)";
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        `;
        copyBtn.style.color = "";
      }, 1500);
    });

    // Delete action
    card.querySelector(".del-btn").addEventListener("click", () => {
      note.bookmarks = (note.bookmarks || []).filter((b) => b.id !== item.id);
      saveStoredNotes();
      renderWebLinks(note);
    });

    webLinksList.appendChild(card);
  });
}

function setupWebLinks() {
  if (!fetchWebLinkBtn || !webLinkInput) return;

  const fetchAction = () => {
    let rawUrl = webLinkInput.value.trim();
    if (!rawUrl) return;

    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = "https://" + rawUrl;
    }

    let parsedDomain = "";
    let cleanTitle = "";
    try {
      const u = new URL(rawUrl);
      parsedDomain = u.hostname.replace(/^www\./, "");
      const segments = u.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        const lastSeg = decodeURIComponent(segments[segments.length - 1])
          .replace(/[-_]/g, " ")
          .replace(/\.[a-zA-Z0-9]+$/, "");
        cleanTitle = lastSeg.charAt(0).toUpperCase() + lastSeg.slice(1);
      } else {
        cleanTitle = parsedDomain.charAt(0).toUpperCase() + parsedDomain.slice(1);
      }
    } catch (err) {
      parsedDomain = rawUrl.replace(/https?:\/\//, "").split("/")[0] || "web";
      cleanTitle = parsedDomain;
    }

    const note = state.notes.find((n) => n.id === state.selectedNoteId);
    if (!note) return;

    const customNote = webLinkNoteInput ? webLinkNoteInput.value.trim() : "";

    note.bookmarks = note.bookmarks || [];
    note.bookmarks.unshift({
      id: "bm-" + Date.now(),
      url: rawUrl,
      title: cleanTitle,
      domain: parsedDomain,
      favicon: `https://www.google.com/s2/favicons?domain=${parsedDomain}&sz=64`,
      date: "Just now",
      notes: customNote
    });

    saveStoredNotes();
    webLinkInput.value = "";
    if (webLinkNoteInput) webLinkNoteInput.value = "";
    renderWebLinks(note);
  };

  fetchWebLinkBtn.addEventListener("click", fetchAction);
  webLinkInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchAction();
    }
  });
  if (webLinkNoteInput) {
    webLinkNoteInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        fetchAction();
      }
    });
  }
}

// =========================================================================
// INLINE CARD SEARCH FILTER CONTROLLER
// =========================================================================
function setupCardSearchFilter() {
  if (!cardFilterInput) return;

  cardFilterInput.addEventListener("input", () => {
    const q = cardFilterInput.value;
    state.cardFilterQuery = q;
    if (clearCardFilterBtn) {
      clearCardFilterBtn.classList.toggle("hidden", !q);
    }
    renderCards(q);
  });

  if (clearCardFilterBtn) {
    clearCardFilterBtn.addEventListener("click", () => {
      cardFilterInput.value = "";
      state.cardFilterQuery = "";
      clearCardFilterBtn.classList.add("hidden");
      renderCards("");
      cardFilterInput.focus();
    });
  }
}

// =========================================================================
// COMMAND PALETTE & FUZZY SEARCH (⌘K / Ctrl+K)
// =========================================================================
function setupCommandPalette() {
  if (!commandPaletteModal || !paletteInput || !paletteResults) return;

  let activeIndex = 0;
  let currentResults = [];

  const openPalette = () => {
    paletteInput.value = "";
    commandPaletteModal.showModal();
    paletteInput.focus();
    updateResults("");
  };

  const closePalette = () => {
    commandPaletteModal.close();
  };

  // Keyboard shortcut: ⌘K or Ctrl+K
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (commandPaletteModal.open) {
        closePalette();
      } else {
        openPalette();
      }
    }
  });

  // Topbar button click
  if (commandPaletteBtn) {
    commandPaletteBtn.addEventListener("click", openPalette);
  }

  // Backdrop click to close
  commandPaletteModal.addEventListener("click", (e) => {
    if (e.target === commandPaletteModal) {
      closePalette();
    }
  });

  // Key navigation
  paletteInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePalette();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (currentResults.length > 0) {
        activeIndex = (activeIndex + 1) % currentResults.length;
        renderHighlighted();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (currentResults.length > 0) {
        activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length;
        renderHighlighted();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentResults.length > 0 && currentResults[activeIndex]) {
        executePaletteItem(currentResults[activeIndex]);
      }
    }
  });

  paletteInput.addEventListener("input", () => {
    updateResults(paletteInput.value.trim());
  });

  function updateResults(query) {
    const q = query.toLowerCase();
    currentResults = [];

    if (!q) {
      // Default: Quick Actions + Recent Projects
      currentResults.push(
        { type: "action", id: "act-new", title: "New Idea / Quick Capture", sub: "Open capture form (⌘+Enter)", icon: "✨", action: () => { closePalette(); quickCaptureModal.showModal(); qcTitle.focus(); } },
        { type: "action", id: "act-secrets", title: "Open Secret & Password Vault", sub: "Zero-knowledge encrypted passwords and API keys", icon: "🔐", action: () => { closePalette(); switchTab("secrets"); } },
        { type: "action", id: "act-scan-secrets", title: "Scan .txt / .env Credentials", sub: "Extract API keys and passwords non-destructively", icon: "⚡", action: () => { closePalette(); switchTab("secrets"); if (openSecretScannerModalBtn) openSecretScannerModalBtn.click(); } },
        { type: "action", id: "act-focus", title: "Distraction-Free Deep Focus Mode", sub: "Launch fullscreen Markdown focus editor", icon: "✏️", action: () => { closePalette(); openFocusEditor(); } },
        { type: "action", id: "act-roadmap", title: "Go to Roadmap View", sub: "Switch to Human-Mode & Tech Milestones", icon: "🗺️", action: () => { closePalette(); switchTab("roadmap"); } },
        { type: "action", id: "act-settings", title: "Go to Settings & Connections", sub: "Wolfitway product relays and exports", icon: "⚙️", action: () => { closePalette(); switchTab("settings"); } },
        { type: "action", id: "act-export", title: "Export Wolfitway JSON Vault", sub: "Download zero-telemetry local database", icon: "📦", action: () => { closePalette(); if (vaultExportJsonBtn) vaultExportJsonBtn.click(); } }
      );

      // Add recent projects
      state.notes.slice(0, 4).forEach((note) => {
        currentResults.push({
          type: "project",
          id: note.id,
          title: note.title,
          sub: extractSummary(note.body) || "Project milestone",
          badge: note.status_label || getStatusLabel(note.status),
          icon: "🐺",
          action: () => {
            closePalette();
            switchTab("timeline");
            selectNote(note.id);
          }
        });
      });
    } else {
      // Search Projects
      state.notes.forEach((note) => {
        const matchTitle = (note.title || "").toLowerCase().includes(q);
        const matchBody = (note.body || "").toLowerCase().includes(q);
        const matchTags = (note.tags || []).some((t) => t.toLowerCase().includes(q));
        if (matchTitle || matchBody || matchTags) {
          currentResults.push({
            type: "project",
            id: note.id,
            title: note.title,
            sub: extractSummary(note.body) || "Project",
            badge: note.status_label || getStatusLabel(note.status),
            icon: "🐺",
            action: () => {
              closePalette();
              switchTab("timeline");
              selectNote(note.id);
            }
          });
        }
      });

      // Search Roadmap Milestones
      (state.roadmapData || []).forEach((phase) => {
        const matchTitle = (phase.title || "").toLowerCase().includes(q);
        const matchSub = (phase.subtitle || "").toLowerCase().includes(q);
        const matchFocus = (phase.focus || "").toLowerCase().includes(q);
        const matchOutcome = (phase.outcome || "").toLowerCase().includes(q);
        if (matchTitle || matchSub || matchFocus || matchOutcome) {
          currentResults.push({
            type: "roadmap",
            id: phase.id,
            title: phase.title,
            sub: phase.focus ? `Focus: ${phase.focus}` : (phase.subtitle || "Roadmap milestone"),
            badge: phase.statusLabel || "Milestone",
            icon: "🗺️",
            action: () => {
              closePalette();
              switchTab("roadmap");
              selectRoadmapPhase(phase.id);
            }
          });
        }
      });

      // Search Web Bookmarks across all notes
      state.notes.forEach((note) => {
        (note.bookmarks || []).forEach((bm) => {
          const matchTitle = (bm.title || "").toLowerCase().includes(q);
          const matchDomain = (bm.domain || "").toLowerCase().includes(q);
          const matchNotes = (bm.notes || "").toLowerCase().includes(q);
          if (matchTitle || matchDomain || matchNotes) {
            currentResults.push({
              type: "weblink",
              id: bm.id,
              title: bm.title || bm.url,
              sub: bm.notes ? `Note: ${bm.notes}` : `${bm.domain} • in ${note.title}`,
              badge: "Web Link",
              icon: "🔗",
              action: () => {
                closePalette();
                switchTab("timeline");
                selectNote(note.id);
                window.open(bm.url, "_blank");
              }
            });
          }
        });
      });

      // Search AI Decisions across all notes
      state.notes.forEach((note) => {
        (note.ai_explorations || []).forEach((exp) => {
          const matchTitle = (exp.title || "").toLowerCase().includes(q);
          const matchRat = (exp.rationale || "").toLowerCase().includes(q);
          if (matchTitle || matchRat) {
            currentResults.push({
              type: "ai_decision",
              id: exp.id,
              title: exp.title,
              sub: `Rationale: ${exp.rationale.slice(0, 70)}...`,
              badge: exp.model || "AI Decision",
              icon: "🧠",
              action: () => {
                closePalette();
                switchTab("timeline");
                selectNote(note.id);
                openViewAiExplorationModal(exp, note);
              }
            });
          }
        });
      });

      // Quick Actions match
      const actions = [
        { type: "action", id: "act-new", title: "New Idea / Quick Capture", sub: "Open capture form", icon: "✨", action: () => { closePalette(); quickCaptureModal.showModal(); qcTitle.focus(); } },
        { type: "action", id: "act-focus", title: "Distraction-Free Deep Focus Mode", sub: "Launch fullscreen Markdown focus editor", icon: "✏️", action: () => { closePalette(); openFocusEditor(); } },
        { type: "action", id: "act-roadmap", title: "Go to Roadmap View", sub: "Switch to Human-Mode & Tech Milestones", icon: "🗺️", action: () => { closePalette(); switchTab("roadmap"); } },
        { type: "action", id: "act-settings", title: "Go to Settings & Connections", sub: "Wolfitway product relays and exports", icon: "⚙️", action: () => { closePalette(); switchTab("settings"); } }
      ];
      actions.forEach((act) => {
        if (act.title.toLowerCase().includes(q)) {
          currentResults.push(act);
        }
      });
    }

    activeIndex = 0;
    renderPaletteResults(query);
  }

  function renderPaletteResults(query) {
    paletteResults.innerHTML = "";
    if (currentResults.length === 0) {
      paletteResults.innerHTML = `
        <div class="palette-empty">
          No matches found for "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
      return;
    }

    // Group items by category
    const groups = {};
    currentResults.forEach((item) => {
      let gName = "Quick Actions";
      if (item.type === "project") gName = "Projects & Notes";
      else if (item.type === "roadmap") gName = "Roadmap Milestones";
      else if (item.type === "weblink") gName = "Web Research & Links";
      else if (item.type === "ai_decision") gName = "AI Decisions & Rationale";
      groups[gName] = groups[gName] || [];
      groups[gName].push(item);
    });

    Object.keys(groups).forEach((gName) => {
      const gTitle = document.createElement("div");
      gTitle.className = "palette-group-title";
      gTitle.textContent = gName;
      paletteResults.appendChild(gTitle);

      groups[gName].forEach((item) => {
        const itemIdx = currentResults.indexOf(item);
        const row = document.createElement("div");
        row.className = `palette-item ${itemIdx === activeIndex ? "active" : ""}`;
        row.dataset.idx = itemIdx;

        row.innerHTML = `
          <div class="palette-item-left">
            <div class="palette-item-icon">${item.icon}</div>
            <div class="palette-item-col">
              <span class="palette-item-title">${escapeHtml(item.title)}</span>
              <span class="palette-item-sub">${escapeHtml(item.sub || "")}</span>
            </div>
          </div>
          ${item.badge ? `<span class="palette-item-badge">${escapeHtml(item.badge)}</span>` : ""}
        `;

        row.addEventListener("mouseenter", () => {
          activeIndex = itemIdx;
          renderHighlighted();
        });

        row.addEventListener("click", () => {
          executePaletteItem(item);
        });

        paletteResults.appendChild(row);
      });
    });
  }

  function renderHighlighted() {
    const items = paletteResults.querySelectorAll(".palette-item");
    items.forEach((el) => {
      const isAct = parseInt(el.dataset.idx) === activeIndex;
      el.classList.toggle("active", isAct);
      if (isAct) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  }

  function executePaletteItem(item) {
    if (typeof item.action === "function") {
      item.action();
    }
  }
}


// Expand to Distraction-Free Fullscreen Focus Mode on Edit Click
detailNotesText.addEventListener("click", () => {
  openFocusEditor();
});

expandNotesFocusBtn.addEventListener("click", () => {
  openFocusEditor();
});

// On-Canvas WYSIWYG Note Title Edit
if (detailTitle) {
  detailTitle.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      detailTitle.blur();
    }
  });

  detailTitle.addEventListener("blur", () => {
    const note = state.notes.find((n) => n.id === state.selectedNoteId);
    if (!note) return;
    const text = detailTitle.textContent.trim();
    if (text && text !== note.title) {
      note.title = text;
      saveStoredNotes();
      renderCards();
    }
  });
}

// Delete Active Note
const deleteActiveNoteBtn = document.getElementById("deleteActiveNoteBtn");
if (deleteActiveNoteBtn) {
  deleteActiveNoteBtn.addEventListener("click", () => {
    const note = state.notes.find((n) => n.id === state.selectedNoteId);
    if (!note) return;
    if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
      state.notes = state.notes.filter((n) => n.id !== note.id);
      saveStoredNotes();
      if (state.notes.length > 0) {
        state.selectedNoteId = state.notes[0].id;
        selectNote(state.selectedNoteId);
      } else {
        state.selectedNoteId = null;
        detailTitle.textContent = "No Note Selected";
        detailNotesText.textContent = "Create a note using Quick Capture (⌘/Ctrl + Enter).";
        timelineListEl.innerHTML = "";
      }
      renderCards();
    }
  });
}

// =========================================================================
// ACTION BUTTONS: PUSH TO ROADMAP / VAULT / STUDIO
// =========================================================================
pushToRoadmapBtn.addEventListener("click", () => {
  const note = state.notes.find((n) => n.id === state.selectedNoteId);
  if (!note) return;

  const existingPhase = state.roadmapData.find((p) => p.title.toLowerCase() === note.title.toLowerCase());
  if (existingPhase) {
    state.activeRoadmapId = existingPhase.id;
  } else {
    const newPhase = {
      id: `rm-${Date.now()}`,
      title: note.title,
      subtitle: extractSummary(note.body),
      status: "in-progress",
      statusLabel: "In Progress",
      dotClass: "dot-green",
      badgeClass: "status-in-progress",
      description: note.body || "Sovereign execution milestone integrated from timeline.",
      focus: "Milestone Delivery",
      outcome: "High impact delivery & verified telemetry",
      practices: [
        { text: "Core architecture verified", checked: true },
        { text: "Implementation tests passing", checked: false },
        { text: "Telemetry & rollback safeguards verified", checked: false }
      ]
    };
    state.roadmapData.unshift(newPhase);
    state.activeRoadmapId = newPhase.id;
    saveStoredRoadmap();
  }

  switchTab("roadmap");
});

addToVaultBtn.addEventListener("click", () => {
  const label = addToVaultBtn.querySelector("span");
  const orig = label.textContent;
  label.textContent = "Encrypted in Vault ✓";
  addToVaultBtn.style.borderColor = "var(--emerald-main)";
  setTimeout(() => {
    label.textContent = orig;
    addToVaultBtn.style.borderColor = "";
  }, 1800);
});

openInStudioBtn.addEventListener("click", () => {
  switchTab("studio");
});

// =========================================================================
// STUDIO VIEW (Image 3)
// =========================================================================
function setupStudio() {
  closeStudioBtn.addEventListener("click", () => {
    switchTab("timeline");
  });

  // Clicking edit in studio expands into full focus editor
  editStudioNotesBtn.addEventListener("click", () => {
    openFocusEditor();
  });

  studioNotesBody.addEventListener("dblclick", () => {
    openFocusEditor();
  });
}

function populateStudioView() {
  const note = state.notes.find((n) => n.id === state.selectedNoteId) || state.notes[0];
  if (!note) return;

  studioItemTitle.textContent = note.title;
  populateStudioNotes(note.body);
  populateStudioTimeline(note);
}

function populateStudioNotes(bodyText) {
  studioNotesBody.innerHTML = "";
  if (!bodyText) {
    studioNotesBody.innerHTML = `<div class="notes-block"><h4>Goal</h4><p>Define objective...</p></div>`;
    return;
  }

  const lines = bodyText.split("\n");
  let currentBlock = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("Goal") || trimmed.startsWith("Context") || trimmed.startsWith("Open questions") || trimmed.startsWith("###")) {
      const heading = trimmed.replace(/^#+\s*/, "");
      currentBlock = document.createElement("div");
      currentBlock.className = "notes-block";
      currentBlock.innerHTML = `<h4>${escapeHtml(heading)}</h4>`;
      studioNotesBody.appendChild(currentBlock);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!currentBlock) {
        currentBlock = document.createElement("div");
        currentBlock.className = "notes-block";
        studioNotesBody.appendChild(currentBlock);
      }
      let ul = currentBlock.querySelector("ul");
      if (!ul) {
        ul = document.createElement("ul");
        currentBlock.appendChild(ul);
      }
      const li = document.createElement("li");
      li.textContent = trimmed.substring(2);
      ul.appendChild(li);
    } else if (trimmed) {
      if (!currentBlock) {
        currentBlock = document.createElement("div");
        currentBlock.className = "notes-block";
        studioNotesBody.appendChild(currentBlock);
      }
      const p = document.createElement("p");
      p.textContent = trimmed;
      currentBlock.appendChild(p);
    }
  });
}

function populateStudioTimeline(note) {
  studioTimelineList.innerHTML = "";
  const events = note.events || [];

  events.forEach((ev, idx) => {
    const row = document.createElement("div");
    row.className = "studio-timeline-row";
    row.setAttribute("draggable", "true");
    row.dataset.idx = idx;
    row.title = "Drag to reorder studio timeline event";

    let iconClass = "icon-green";
    let iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"></path></svg>`;

    if (ev.icon === "doc") {
      iconClass = "icon-blue";
      iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
    } else if (ev.icon === "brain") {
      iconClass = "icon-purple";
      iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v4l3 3"></path></svg>`;
    } else if (ev.icon === "edit") {
      iconClass = "icon-amber";
      iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
    } else if (ev.icon === "check") {
      iconClass = "icon-emerald";
      iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    }

    const isAi = ev.author === "ai";
    row.innerHTML = `
      <div class="studio-node-left">
        <span class="drag-grip" title="Drag to reorder event" style="cursor:grab; font-size:12px; margin-right:8px;">⋮⋮</span>
        <div class="studio-icon-circle ${iconClass}">
          ${iconSvg}
        </div>
        <div class="studio-node-info">
          <div class="studio-node-title">${escapeHtml(ev.title)}</div>
          <div class="studio-node-date">${escapeHtml(ev.desc)}</div>
        </div>
      </div>
      <div class="studio-node-author ${isAi ? "ai" : "user"}">
        <span>${isAi ? "AI Assistant" : "You"}</span>
        ${isAi ? `<span class="sparkle">✦</span>` : ""}
      </div>
    `;

    // Native Drag and Drop for Studio Timeline Rows
    row.addEventListener("dragstart", (e) => {
      state.draggedStudioEventIdx = idx;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      row.classList.add("drag-over");
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("drag-over");
    });

    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.classList.remove("drag-over");
      const fromIndex = state.draggedStudioEventIdx;
      const toIndex = idx;
      if (fromIndex !== null && fromIndex !== toIndex && note.events) {
        const [moved] = note.events.splice(fromIndex, 1);
        note.events.splice(toIndex, 0, moved);
        saveStoredNotes();
        populateStudioTimeline(note);
        renderTimelineList(note);
      }
    });

    row.addEventListener("dragend", () => {
      document.querySelectorAll(".studio-timeline-row").forEach((r) => {
        r.classList.remove("dragging");
        r.classList.remove("drag-over");
      });
      state.draggedStudioEventIdx = null;
    });

    studioTimelineList.appendChild(row);
  });
}

// =========================================================================
// QUICK CAPTURE MODAL (Image 2)
// =========================================================================
function setupQuickCapture() {
  quickCaptureTriggerBtn.addEventListener("click", () => {
    openQuickCapture();
  });

  qcCategoryPills.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-pill");
    if (!btn) return;
    document.querySelectorAll(".cat-pill").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    state.qcCategory = btn.dataset.cat;
  });

  toggleMoreDetailsBtn.addEventListener("click", () => {
    qcMoreDetailsGroup.classList.toggle("hidden");
    toggleMoreDetailsBtn.textContent = qcMoreDetailsGroup.classList.contains("hidden")
      ? "+ Add more details"
      : "- Hide extra details";
  });

  quickCaptureForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveQuickCapture();
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      if (quickCaptureModal.open) {
        saveQuickCapture();
      } else {
        openQuickCapture();
      }
    } else if (e.key === "Escape" && quickCaptureModal.open) {
      quickCaptureModal.close();
    }
  });

  quickCaptureModal.addEventListener("click", (e) => {
    if (e.target === quickCaptureModal) {
      quickCaptureModal.close();
    }
  });
}

function openQuickCapture() {
  quickCaptureForm.reset();
  qcMoreDetailsGroup.classList.add("hidden");
  toggleMoreDetailsBtn.textContent = "+ Add more details";
  state.qcCategory = "idea";
  document.querySelectorAll(".cat-pill").forEach((p) => {
    p.classList.toggle("active", p.dataset.cat === "idea");
  });
  quickCaptureModal.showModal();
  qcTitle.focus();
}

function saveQuickCapture() {
  const title = qcTitle.value.trim();
  if (!title) return;

  const url = qcUrl.value.trim() || null;
  const rawTags = qcTags.value.trim();
  const tags = rawTags ? rawTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [state.qcCategory];
  const userNotes = qcNotes.value.trim();
  const body = userNotes || `Goal\nExecute ${title} with high focus and clean telemetry.\n\nContext\n- Captured via Wolf Quick Capture\n\nOpen questions\n- Next high-leverage action?`;

  const newId = Date.now();
  const newProject = {
    id: newId,
    title,
    created_at: new Date().toISOString(),
    status: "ideation",
    status_label: "Ideation",
    funnel_stage: "product",
    kind: state.qcCategory,
    tags,
    body,
    events: [
      { title: "Idea captured", desc: "Initial concept and problem framing.", time: "Just now", author: "user", icon: "bulb", active: true }
    ],
    ai_explorations: [
      {
        id: `exp-${Date.now()}`,
        title: "Automated feasibility scan",
        model: "Gemini 2.5",
        url: url,
        rationale: "Initial capture committed directly to sovereign encrypted vault.",
        transcript: `Captured idea "${title}" into local AES-256 vault.\nTags: ${tags.join(", ")}`,
        date: "Just now"
      }
    ],
    docs: url ? [{ title: url, badge: "URL" }] : []
  };

  state.notes.unshift(newProject);
  saveStoredNotes();

  const invokeFn = getInvoke();
  if (invokeFn) {
    invokeFn("add_note", {
      note: {
        title,
        body,
        tags,
        kind: state.qcCategory,
        status: "ideation",
        funnel_stage: "product",
        remind_at: null,
        url
      }
    }).catch((e) => console.warn("Tauri add_note:", e));
  }

  quickCaptureModal.close();
  renderCards();
  selectNote(newId);
}

// =========================================================================
// ADD TIMELINE EVENT MODAL
// =========================================================================
function setupTimelineEvents() {
  addTimelineEventBtn.addEventListener("click", () => {
    addEventForm.reset();
    addEventModal.showModal();
    eventTitleInput.focus();
  });

  cancelEventBtn.addEventListener("click", () => {
    addEventModal.close();
  });

  addEventModal.addEventListener("click", (e) => {
    if (e.target === addEventModal) {
      addEventModal.close();
    }
  });

  addEventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const eventTitle = eventTitleInput.value.trim();
    const eventDesc = eventDescInput.value.trim() || "Milestone progress logged.";
    if (!eventTitle) return;

    const note = state.notes.find((n) => n.id === state.selectedNoteId);
    if (!note) return;

    if (!note.events) note.events = [];
    note.events.unshift({
      title: eventTitle,
      desc: eventDesc,
      time: "Just now",
      author: "user",
      icon: "edit",
      active: true
    });

    saveStoredNotes();
    renderTimelineList(note);
    addEventModal.close();
  });
}

// =========================================================================
// COLLAPSIBLE DRAWERS & AI EXPLORATIONS
// =========================================================================
function setupDrawers() {
  document.querySelectorAll(".drawer-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".drawer-card");
      const content = card.querySelector(".drawer-content");
      if (content) {
        content.classList.toggle("hidden");
        const chevron = btn.querySelector(".drawer-chevron");
        if (chevron) {
          chevron.textContent = content.classList.contains("hidden") ? "▼" : "▲";
        }
      }
    });
  });
}

function setupAiExplorationModals() {
  addAiExplorationBtn.addEventListener("click", () => {
    addAiExplorationForm.reset();
    addAiExplorationModal.showModal();
    aiExpTitle.focus();
  });

  cancelAiExpBtn.addEventListener("click", () => {
    addAiExplorationModal.close();
  });

  addAiExplorationModal.addEventListener("click", (e) => {
    if (e.target === addAiExplorationModal) {
      addAiExplorationModal.close();
    }
  });

  addAiExplorationForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = aiExpTitle.value.trim();
    if (!title) return;

    const model = aiExpModel.value.trim() || "AI Assistant";
    const url = aiExpUrl.value.trim() || null;
    const rationale = aiExpRationale.value.trim() || "Key decision reasoning preserved.";
    const transcript = aiExpTranscript.value.trim() || "No transcript recorded.";

    const note = state.notes.find((n) => n.id === state.selectedNoteId);
    if (!note) return;

    if (!note.ai_explorations) note.ai_explorations = [];
    const newExp = {
      id: `exp-${Date.now()}`,
      title,
      model,
      url,
      rationale,
      transcript,
      date: "Just now"
    };

    note.ai_explorations.unshift(newExp);
    saveStoredNotes();
    renderDrawers(note);
    addAiExplorationModal.close();
  });

  // Reader Modal
  closeViewAiBtn.addEventListener("click", () => {
    viewAiExplorationModal.close();
  });

  viewAiExplorationModal.addEventListener("click", (e) => {
    if (e.target === viewAiExplorationModal) {
      viewAiExplorationModal.close();
    }
  });

  deleteAiExpBtn.addEventListener("click", () => {
    if (!state.activeViewingExploration) return;
    const note = state.notes.find((n) => n.id === state.selectedNoteId);
    if (note && note.ai_explorations) {
      note.ai_explorations = note.ai_explorations.filter((x) => x.id !== state.activeViewingExploration.id);
      saveStoredNotes();
      renderDrawers(note);
    }
    viewAiExplorationModal.close();
  });
}

function openViewAiExplorationModal(item, note) {
  state.activeViewingExploration = item;
  viewAiTitle.textContent = item.title;
  viewAiModelBadge.textContent = item.model || "AI Assistant";
  viewAiDate.textContent = `Logged ${item.date}`;
  viewAiRationale.textContent = item.rationale || "No rationale recorded.";
  viewAiTranscript.textContent = item.transcript || "No transcript provided.";

  if (item.url) {
    viewAiUrlLink.href = item.url;
    viewAiUrlContainer.style.display = "block";
  } else {
    viewAiUrlContainer.style.display = "none";
  }

  viewAiExplorationModal.showModal();
}

// =========================================================================
// ROADMAP VIEW & WYSIWYG CANVAS ENGINE (Image 4)
// =========================================================================
function setupRoadmap() {
  // 1. WYSIWYG On-Canvas: Title Edit
  if (rmDetailTitle) {
    rmDetailTitle.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        rmDetailTitle.blur();
      }
    });

    rmDetailTitle.addEventListener("blur", () => {
      const currentPhase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
      if (!currentPhase) return;
      const text = rmDetailTitle.textContent.trim();
      if (text && text !== currentPhase.title) {
        currentPhase.title = text;
        saveStoredRoadmap();
        renderRoadmap();
      }
    });
  }

  // 2. WYSIWYG On-Canvas: Description Edit
  if (rmDetailDescription) {
    rmDetailDescription.addEventListener("blur", () => {
      const currentPhase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
      if (!currentPhase) return;
      const text = rmDetailDescription.textContent.trim();
      if (text !== currentPhase.description) {
        currentPhase.description = text;
        saveStoredRoadmap();
        renderRoadmap();
      }
    });
  }

  // 3. WYSIWYG On-Canvas: FOCUS Stat Edit
  if (rmStatFocus) {
    rmStatFocus.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        rmStatFocus.blur();
      }
    });
    rmStatFocus.addEventListener("blur", () => {
      const currentPhase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
      if (!currentPhase) return;
      const text = rmStatFocus.textContent.trim();
      if (text && text !== currentPhase.focus) {
        currentPhase.focus = text;
        saveStoredRoadmap();
        renderRoadmap();
      }
    });
  }

  // 4. WYSIWYG On-Canvas: OUTCOME Stat Edit
  if (rmStatOutcome) {
    rmStatOutcome.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        rmStatOutcome.blur();
      }
    });
    rmStatOutcome.addEventListener("blur", () => {
      const currentPhase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
      if (!currentPhase) return;
      const text = rmStatOutcome.textContent.trim();
      if (text && text !== currentPhase.outcome) {
        currentPhase.outcome = text;
        saveStoredRoadmap();
        renderRoadmap();
      }
    });
  }

  // 5. WYSIWYG Status Dropdown Menu on Canvas
  if (rmDetailStatus && rmStatusMenu) {
    rmDetailStatus.addEventListener("click", (e) => {
      e.stopPropagation();
      rmStatusMenu.classList.toggle("hidden");
    });

    rmStatusMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const option = e.target.closest(".rm-status-option");
      if (!option) return;
      const status = option.dataset.status;
      const currentPhase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
      if (!currentPhase) return;

      currentPhase.status = status;
      currentPhase.statusLabel = getRoadmapStatusLabel(status);
      currentPhase.badgeClass = getRoadmapBadgeClass(status);
      currentPhase.dotClass = getRoadmapDotClass(status);
      saveStoredRoadmap();
      selectRoadmapPhase(currentPhase.id);
      renderRoadmap();
      rmStatusMenu.classList.add("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".rm-status-dropdown-wrapper")) {
        rmStatusMenu.classList.add("hidden");
      }
    });
  }

  // 6. Inline Quick-Add Practice directly on Canvas
  if (inlineNewPracticeInput) {
    inlineNewPracticeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const text = inlineNewPracticeInput.value.trim();
        if (!text) return;
        const currentPhase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
        if (!currentPhase) return;

        if (!currentPhase.practices) currentPhase.practices = [];
        currentPhase.practices.push({ text, checked: false });
        inlineNewPracticeInput.value = "";
        saveStoredRoadmap();
        renderPracticesList(currentPhase);
        updateRoadmapProgress(currentPhase);
        renderRoadmap();
      }
    });
  }

  // 7. Toggle Expand/Collapse All Cards
  if (toggleAllPhasesBtn) {
    toggleAllPhasesBtn.addEventListener("click", () => {
      const allExpanded = state.roadmapData.every((p) => !!state.expandedPhases[p.id]);
      state.roadmapData.forEach((p) => {
        state.expandedPhases[p.id] = !allExpanded;
      });
      toggleAllPhasesBtn.textContent = allExpanded ? "Expand All" : "Collapse All";
      renderRoadmap();
    });
  }

  // 8. Toggle Fullscreen / Expanded Canvas Mode
  if (expandRoadmapCanvasBtn && roadmapSplitView) {
    expandRoadmapCanvasBtn.addEventListener("click", () => {
      state.isRoadmapCanvasExpanded = !state.isRoadmapCanvasExpanded;
      roadmapSplitView.classList.toggle("expanded-canvas", state.isRoadmapCanvasExpanded);
      expandRoadmapCanvasBtn.title = state.isRoadmapCanvasExpanded
        ? "Return to Split View"
        : "Expand to Fullscreen Canvas";
    });
  }
}

function renderRoadmap() {
  roadmapPhasesList.innerHTML = "";

  state.roadmapData.forEach((phase, index) => {
    const isSelected = phase.id === state.activeRoadmapId;
    const isExpanded = !!state.expandedPhases[phase.id];
    const totalCount = (phase.practices || []).length;
    const checkedCount = (phase.practices || []).filter((p) => p.checked).length;
    const pct = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);

    const item = document.createElement("div");
    item.className = `roadmap-card-item ${isSelected ? "selected" : ""} ${isExpanded ? "expanded" : ""}`;
    item.dataset.id = phase.id;
    item.dataset.index = index;
    item.setAttribute("draggable", "true");

    item.innerHTML = `
      <div class="rm-card-top">
        <div class="rm-card-title-group">
          <span class="drag-grip" title="Drag to reorder milestone">⋮⋮</span>
          <span class="rm-dot ${phase.dotClass}"></span>
          <span class="rm-card-title" title="${escapeHtml(phase.title)}">${escapeHtml(phase.title)}</span>
        </div>
        <div class="rm-card-actions">
          <span class="badge-status ${phase.badgeClass}">
            <span class="dot"></span> ${escapeHtml(phase.statusLabel)}
          </span>
          <button type="button" class="rm-card-expand-btn" title="Toggle card expand/collapse">▼</button>
        </div>
      </div>
      <div class="rm-card-collapsed-row">
        <div class="rm-card-sub">${escapeHtml(phase.subtitle || phase.description || "Strategic milestone execution")}</div>
        <span class="rm-mini-progress-pill">${checkedCount}/${totalCount} (${pct}%)</span>
      </div>
      <div class="rm-card-expanded-body ${isExpanded ? "" : "hidden"}">
        <div class="rm-card-expanded-desc">${escapeHtml(phase.description || "")}</div>
        <div class="rm-card-meta-chips">
          <span class="rm-card-chip">Focus: <strong>${escapeHtml(phase.focus || "Daily Systems")}</strong></span>
          <span class="rm-card-chip">Outcome: <strong>${escapeHtml(phase.outcome || "Milestone Delivery")}</strong></span>
        </div>
      </div>
    `;

    // Click to select
    item.addEventListener("click", (e) => {
      if (e.target.closest(".drag-grip") || e.target.closest(".rm-card-expand-btn")) return;
      selectRoadmapPhase(phase.id);
    });

    // Expand/Collapse chevron toggle
    const expandBtn = item.querySelector(".rm-card-expand-btn");
    if (expandBtn) {
      expandBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.expandedPhases[phase.id] = !state.expandedPhases[phase.id];
        renderRoadmap();
      });
    }

    // Native Drag and Drop Handlers
    item.addEventListener("dragstart", (e) => {
      if (e.target.closest(".rm-card-expand-btn")) {
        e.preventDefault();
        return;
      }
      state.draggedRoadmapId = phase.id;
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", phase.id);
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      item.classList.add("drag-over");
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over");
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("drag-over");
      const targetPhaseId = phase.id;
      const draggedPhaseId = state.draggedRoadmapId;

      if (!draggedPhaseId || draggedPhaseId === targetPhaseId) return;

      const fromIndex = state.roadmapData.findIndex((p) => p.id === draggedPhaseId);
      const toIndex = state.roadmapData.findIndex((p) => p.id === targetPhaseId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const [movedItem] = state.roadmapData.splice(fromIndex, 1);
        state.roadmapData.splice(toIndex, 0, movedItem);
        saveStoredRoadmap();
        renderRoadmap();
      }
    });

    item.addEventListener("dragend", () => {
      document.querySelectorAll(".roadmap-card-item").forEach((c) => {
        c.classList.remove("dragging");
        c.classList.remove("drag-over");
      });
      state.draggedRoadmapId = null;
    });

    roadmapPhasesList.appendChild(item);
  });

  const activePhase = state.roadmapData.find((p) => p.id === state.activeRoadmapId) || state.roadmapData[0];
  if (activePhase) {
    selectRoadmapPhase(activePhase.id);
  }
}

function selectRoadmapPhase(phaseId) {
  state.activeRoadmapId = phaseId;
  const phase = state.roadmapData.find((p) => p.id === phaseId);
  if (!phase) return;

  document.querySelectorAll(".roadmap-card-item").forEach((c) => {
    c.classList.toggle("selected", c.dataset.id === phaseId);
  });

  if (rmDetailTitle) rmDetailTitle.textContent = phase.title;
  if (rmDetailStatus) {
    rmDetailStatus.className = `badge-status ${phase.badgeClass} wysiwyg-badge`;
  }
  if (rmDetailStatusLabel) {
    rmDetailStatusLabel.textContent = phase.statusLabel;
  }
  const statusDot = rmDetailStatus ? rmDetailStatus.querySelector(".dot") : null;
  if (statusDot) {
    statusDot.className = `dot ${phase.dotClass}`;
  }

  if (rmDetailDescription) rmDetailDescription.textContent = phase.description;
  if (rmStatFocus) rmStatFocus.textContent = phase.focus;
  if (rmStatOutcome) rmStatOutcome.textContent = phase.outcome;

  renderPracticesList(phase);
  updateRoadmapProgress(phase);
}

function renderPracticesList(phase) {
  rmPracticesList.innerHTML = "";
  (phase.practices || []).forEach((practice, idx) => {
    const item = document.createElement("div");
    item.className = `practice-item ${practice.checked ? "completed" : ""}`;
    item.setAttribute("draggable", "true");
    item.dataset.idx = idx;

    item.innerHTML = `
      <span class="drag-grip" title="Drag to reorder practice" style="cursor:grab; font-size:12px; margin-right:4px; color:var(--text-dim);">⋮⋮</span>
      <button type="button" class="practice-check-btn ${practice.checked ? "checked" : ""}" data-idx="${idx}" title="${practice.checked ? "Mark as incomplete" : "Mark as completed"}">✓</button>
      <input type="text" class="practice-text-input" value="${escapeHtml(practice.text)}" placeholder="Key practice title..." spellcheck="false" data-idx="${idx}" />
      <button type="button" class="practice-delete-btn" data-idx="${idx}" title="Delete practice">&times;</button>
    `;

    // 1. DEDICATED CHECKMARK BUTTON: Only toggles completed state!
    const checkBtn = item.querySelector(".practice-check-btn");
    checkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      practice.checked = !practice.checked;
      checkBtn.classList.toggle("checked", practice.checked);
      item.classList.toggle("completed", practice.checked);
      checkBtn.title = practice.checked ? "Mark as incomplete" : "Mark as completed";
      saveStoredRoadmap();
      updateRoadmapProgress(phase);
      updateRoadmapCardPills(phase);
    });

    // 2. DEDICATED TEXT INPUT: Only edits text, never toggles checkbox!
    const textInput = item.querySelector(".practice-text-input");
    textInput.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    textInput.addEventListener("input", () => {
      practice.text = textInput.value;
      saveStoredRoadmap();
    });

    textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        textInput.blur();
        const nextItem = item.nextElementSibling;
        if (nextItem) {
          const nextInput = nextItem.querySelector(".practice-text-input");
          if (nextInput) nextInput.focus();
        } else if (inlineNewPracticeInput) {
          inlineNewPracticeInput.focus();
        }
      }
    });

    textInput.addEventListener("blur", () => {
      const newText = textInput.value.trim();
      practice.text = newText || "Untitled practice";
      textInput.value = practice.text;
      saveStoredRoadmap();
      updateRoadmapCardPills(phase);
    });

    // 3. DELETE BUTTON
    const deleteBtn = item.querySelector(".practice-delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      phase.practices.splice(idx, 1);
      saveStoredRoadmap();
      renderPracticesList(phase);
      updateRoadmapProgress(phase);
      updateRoadmapCardPills(phase);
    });

    // 4. DRAG & DROP: Only drag from drag-grip or non-input area
    item.addEventListener("dragstart", (e) => {
      if (
        document.activeElement === textInput ||
        e.target.closest(".practice-text-input") ||
        e.target.closest(".practice-check-btn") ||
        e.target.closest(".practice-delete-btn")
      ) {
        e.preventDefault();
        return;
      }
      state.draggedPracticeIdx = idx;
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      item.classList.add("drag-over");
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over");
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("drag-over");
      const fromIndex = state.draggedPracticeIdx;
      const toIndex = idx;
      if (fromIndex !== null && fromIndex !== toIndex && phase.practices) {
        const [moved] = phase.practices.splice(fromIndex, 1);
        phase.practices.splice(toIndex, 0, moved);
        saveStoredRoadmap();
        renderPracticesList(phase);
        updateRoadmapProgress(phase);
        updateRoadmapCardPills(phase);
      }
    });

    item.addEventListener("dragend", () => {
      document.querySelectorAll(".practice-item").forEach((el) => {
        el.classList.remove("dragging");
        el.classList.remove("drag-over");
      });
      state.draggedPracticeIdx = null;
    });

    rmPracticesList.appendChild(item);
  });
}

function updateRoadmapProgress(phase) {
  const total = (phase.practices || []).length;
  const checked = (phase.practices || []).filter((p) => p.checked).length;
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100);

  const fill = document.querySelector(".rm-progress-fill");
  const thumb = document.querySelector(".rm-progress-thumb");
  if (fill && thumb) {
    fill.style.width = `${pct}%`;
    thumb.style.left = `${pct}%`;
  }
}

function updateRoadmapCardPills(phase) {
  const card = document.querySelector(`.roadmap-card-item[data-id="${phase.id}"]`);
  if (!card) return;
  const totalCount = (phase.practices || []).length;
  const checkedCount = (phase.practices || []).filter((p) => p.checked).length;
  const pct = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);
  const pill = card.querySelector(".rm-mini-progress-pill");
  if (pill) {
    pill.textContent = `${checkedCount}/${totalCount} (${pct}%)`;
  }
}

// =========================================================================
// ROADMAP MODALS (ADD, EDIT, PRACTICE)
// =========================================================================
function setupRoadmapModals() {
  // 1. Edit Roadmap Phase (legacy support if modal opened)
  if (openEditRoadmapBtn) {
    openEditRoadmapBtn.addEventListener("click", () => {
      const phase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
      if (!phase) return;

      ermTitle.value = phase.title;
      ermSubtitle.value = phase.subtitle || "";
      ermStatus.value = phase.status || "in-progress";
      ermDescription.value = phase.description || "";
      ermFocus.value = phase.focus || "";
      ermOutcome.value = phase.outcome || "";

      editRoadmapModal.showModal();
      ermTitle.focus();
    });
  }

  // Direct Delete Roadmap Milestone on Active Canvas (Instant Management)
  if (deleteRoadmapPhaseDirectBtn) {
    deleteRoadmapPhaseDirectBtn.addEventListener("click", () => {
      if (state.roadmapData.length <= 1) {
        alert("At least one roadmap milestone must remain.");
        return;
      }
      const phase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
      const name = phase ? `"${phase.title}"` : "this milestone";
      if (confirm(`Are you sure you want to delete ${name}?`)) {
        state.roadmapData = state.roadmapData.filter((p) => p.id !== state.activeRoadmapId);
        state.activeRoadmapId = state.roadmapData[0].id;
        saveStoredRoadmap();
        renderRoadmap();
        selectRoadmapPhase(state.activeRoadmapId);
      }
    });
  }

  cancelEditRoadmapBtn.addEventListener("click", () => {
    editRoadmapModal.close();
  });

  editRoadmapModal.addEventListener("click", (e) => {
    if (e.target === editRoadmapModal) editRoadmapModal.close();
  });

  editRoadmapForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const phase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
    if (!phase) return;

    phase.title = ermTitle.value.trim() || phase.title;
    phase.subtitle = ermSubtitle.value.trim() || phase.subtitle;
    phase.status = ermStatus.value;
    phase.statusLabel = getRoadmapStatusLabel(phase.status);
    phase.badgeClass = getRoadmapBadgeClass(phase.status);
    phase.dotClass = getRoadmapDotClass(phase.status);
    phase.description = ermDescription.value.trim();
    phase.focus = ermFocus.value.trim() || "Milestone Execution";
    phase.outcome = ermOutcome.value.trim() || "Verified Result";

    saveStoredRoadmap();
    editRoadmapModal.close();
    renderRoadmap();
    selectRoadmapPhase(phase.id);
  });

  deleteRoadmapPhaseBtn.addEventListener("click", () => {
    if (state.roadmapData.length <= 1) {
      alert("At least one roadmap milestone must remain.");
      return;
    }
    state.roadmapData = state.roadmapData.filter((p) => p.id !== state.activeRoadmapId);
    state.activeRoadmapId = state.roadmapData[0].id;
    saveStoredRoadmap();
    editRoadmapModal.close();
    renderRoadmap();
  });

  // 2. Add Roadmap Phase directly on canvas (Instant Velocity)
  addRoadmapPhaseBtn.addEventListener("click", () => {
    const newPhase = {
      id: `rm-${Date.now()}`,
      title: "New Strategic Milestone",
      subtitle: "Click to write milestone direction.",
      status: "up-next",
      statusLabel: "Up Next",
      badgeClass: "status-up-next",
      dotClass: "dot-amber",
      description: "Describe the key outcome and purpose of this strategic milestone directly on canvas.",
      focus: "Key Focus Area",
      outcome: "Measurable Impact",
      practices: [
        { text: "Define milestone scope", checked: false },
        { text: "Execute core implementation", checked: false }
      ]
    };

    state.roadmapData.push(newPhase);
    state.activeRoadmapId = newPhase.id;
    state.expandedPhases[newPhase.id] = true;
    saveStoredRoadmap();
    renderRoadmap();
    selectRoadmapPhase(newPhase.id);

    // Instant focus on canvas title for zero-friction editing
    setTimeout(() => {
      if (rmDetailTitle) {
        rmDetailTitle.focus();
        const range = document.createRange();
        range.selectNodeContents(rmDetailTitle);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 60);
  });

  cancelAddRoadmapBtn.addEventListener("click", () => {
    addRoadmapModal.close();
  });

  addRoadmapModal.addEventListener("click", (e) => {
    if (e.target === addRoadmapModal) addRoadmapModal.close();
  });

  addRoadmapForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = armTitle.value.trim();
    if (!title) return;

    const subtitle = armSubtitle.value.trim() || "Next strategic phase.";
    const status = armStatus.value || "up-next";
    const description = armDescription.value.trim() || "Strategic execution phase for creator ecosystem.";
    const focus = armFocus.value.trim() || "Sovereign Growth";
    const outcome = armOutcome.value.trim() || "High Leverage Output";

    const rawPractices = armPractices.value.trim();
    const practices = rawPractices
      ? rawPractices.split("\n").map((line) => ({ text: line.trim(), checked: false })).filter((x) => x.text)
      : [
          { text: "Core milestone setup", checked: true },
          { text: "Execution checklist verified", checked: false }
        ];

    const newPhase = {
      id: `rm-${Date.now()}`,
      title,
      subtitle,
      status,
      statusLabel: getRoadmapStatusLabel(status),
      badgeClass: getRoadmapBadgeClass(status),
      dotClass: getRoadmapDotClass(status),
      description,
      focus,
      outcome,
      practices
    };

    state.roadmapData.push(newPhase);
    state.activeRoadmapId = newPhase.id;
    state.expandedPhases[newPhase.id] = true;
    saveStoredRoadmap();
    addRoadmapModal.close();
    renderRoadmap();
    selectRoadmapPhase(newPhase.id);
  });

  // 3. Add Practice Checklist Item (Instant On-Canvas Focus)
  addPracticeBtn.addEventListener("click", () => {
    if (inlineNewPracticeInput) {
      inlineNewPracticeInput.focus();
      inlineNewPracticeInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  cancelPracticeBtn.addEventListener("click", () => {
    addPracticeModal.close();
  });

  addPracticeModal.addEventListener("click", (e) => {
    if (e.target === addPracticeModal) addPracticeModal.close();
  });

  addPracticeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = newPracticeInput.value.trim();
    if (!text) return;

    const phase = state.roadmapData.find((p) => p.id === state.activeRoadmapId);
    if (!phase) return;

    if (!phase.practices) phase.practices = [];
    phase.practices.push({ text, checked: false });
    saveStoredRoadmap();
    renderPracticesList(phase);
    updateRoadmapProgress(phase);
    addPracticeModal.close();
  });
}

function getRoadmapStatusLabel(status) {
  switch (status) {
    case "in-progress":
      return "In Progress";
    case "live":
      return "Live";
    case "up-next":
      return "Up Next";
    default:
      return "Planned";
  }
}

function getRoadmapBadgeClass(status) {
  switch (status) {
    case "in-progress":
      return "status-in-progress";
    case "live":
      return "status-live";
    case "up-next":
      return "status-up-next";
    default:
      return "status-backlog";
  }
}

function getRoadmapDotClass(status) {
  switch (status) {
    case "in-progress":
      return "dot-green";
    case "live":
      return "dot-blue";
    case "up-next":
      return "dot-amber";
    default:
      return "dot-hollow";
  }
}

// =========================================================================
// VIEW 4: SETTINGS, WOLFITWAY CONNECTIONS & COUNCIL OF EXPERTS
// =========================================================================
const WOLFITWAY_PRODUCTS = [
  {
    id: "sync",
    name: "Wolfitway Sovereign Cloud Sync",
    domain: "sync.wolfitway.com",
    icon: "🔄",
    desc: "End-to-end encrypted relay for peer-to-peer workspace synchronization across mobile, desktop, and web instances without central plaintext storage.",
    placeholder: "wfw_sync_live_..."
  },
  {
    id: "ai",
    name: "Wolfitway AI Reasoning Network",
    domain: "ai.wolfitway.com",
    icon: "🧠",
    desc: "Private neural reasoning relay for automated roadmap milestone breakdown, telemetry risk audits, and offline-compatible LLM inference.",
    placeholder: "wfw_ai_live_..."
  },
  {
    id: "roadmap",
    name: "Wolfitway Public Roadmap Publisher",
    domain: "roadmap.wolfitway.com",
    icon: "🗺️",
    desc: "One-click publish your project roadmap to sovereign creator URLs or custom domain names with interactive human-mode feedback.",
    placeholder: "wfw_pub_workspace_..."
  },
  {
    id: "identity",
    name: "Wolfitway Sovereign Identity & PGP Keyring",
    domain: "id.wolfitway.com",
    icon: "🔑",
    desc: "Decentralized creator identity verification, cryptographic proof-of-work, and hardware key exchange for tamper-proof milestone signatures.",
    placeholder: "0x_pgp_keyring_..."
  }
];

const SOVEREIGN_EXPERTS = [
  {
    role: "Chief Product & Funnel Architect",
    handle: "@product-strategist",
    avatar: "🏛️",
    mandate: "Transform raw ideas into structured creator funnels and shipped milestones.",
    tags: ["TOFU/MOFU/BOFU", "Action-Oriented", "Milestone Velocity"],
    status: "Active Council"
  },
  {
    role: "Principal Systems & Cryptography Engineer",
    handle: "@systems-crypto",
    avatar: "🔐",
    mandate: "Guarantee 100% local-first ownership, zero-telemetry, and verifiable hardware-level security.",
    tags: ["AES-256-GCM", "SQLite Zero-Cloud", "Hybrid Dual-Layer"],
    status: "Active Council"
  },
  {
    role: "Lead UX/UI & Motion Engineering Guardian",
    handle: "@design-guardian",
    avatar: "🎨",
    mandate: "Preserve and elevate the cyber-obsidian visual direction with zero design drift.",
    tags: ["Cyber-Obsidian", "Emerald HSL Glow", "Zero Design Drift"],
    status: "Active Council"
  },
  {
    role: "AI & Semantic Context Specialist",
    handle: "@ai-context-engineer",
    avatar: "🧠",
    mandate: "Provide proactive intelligence, intelligent clustering, and automated project breakdown.",
    tags: ["Decision Vault", "Attribution Transparency", "Semantic Synthesis"],
    status: "Active Council"
  },
  {
    role: "User Flow & Cognitive Ergonomics Architect",
    handle: "@user-flow-architect",
    avatar: "🌊",
    mandate: "Maximize builder flow state, remove cognitive friction, and design distraction-free task commitment.",
    tags: ["Deep Focus Mode", "Fluid Reordering", "Cognitive Ergonomics"],
    status: "Active Council"
  },
  {
    role: "Conversion Rate Optimization & Funnel Velocity Strategist",
    handle: "@cro-strategist",
    avatar: "📈",
    mandate: "Optimize action affordances, reduce cognitive drop-off, and accelerate creator funnel velocity.",
    tags: ["Luminescent Affordances", "Sub-3s Capture", "Funnel Telemetry"],
    status: "Active Council"
  },
  {
    role: "Accessibility (a11y) & Inclusive Interaction Specialist",
    handle: "@a11y-specialist",
    avatar: "♿",
    mandate: "Guarantee WCAG 2.1 AAA accessibility, total keyboard operability, and inclusive sensory feedback.",
    tags: ["WCAG 2.1 AAA", "Full Keyboard A11y", "High-Contrast Dark Mode"],
    status: "Active Council"
  }
];

function getStoredConnections() {
  try {
    const raw = localStorage.getItem("wolftimeline_connections_v1");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    sync: { connected: false, token: "" },
    ai: { connected: true, token: "wfw_ai_live_8a39f1c" },
    roadmap: { connected: false, token: "" },
    identity: { connected: true, token: "0xWOLF_77E3B1_PGP_SIGN" }
  };
}

function saveStoredConnections(conn) {
  try {
    localStorage.setItem("wolftimeline_connections_v1", JSON.stringify(conn));
  } catch (e) {}
}

// =========================================================================
// MOCK AI AGENTS CONFIGURATION & STATE
// =========================================================================
const MOCK_AI_AGENTS = [
  {
    id: "synthesizer",
    name: "Wolf Timeline Synthesizer",
    icon: "🐺",
    badge: "BACKGROUND DAEMON",
    desc: "Autonomously detects thematic patterns across timeline notes, links related dependencies, and synthesizes weekly velocity recaps.",
    trigger: "On Note Creation (Instant)",
    status: "Active",
    enabled: true,
    lastRun: "2 mins ago"
  },
  {
    id: "social-bip",
    name: "Build-in-Public Content Engine",
    icon: "⚡",
    badge: "PUBLISHING AGENT",
    desc: "Transforms shipped milestone notes into engaging build-in-public 𝕏 threads, release changelogs, and founder updates.",
    trigger: "On Milestone Shipped",
    status: "Active",
    enabled: true,
    lastRun: "1 hour ago"
  },
  {
    id: "crypto-guard",
    name: "Council Security & Zero-Telemetry Guard",
    icon: "🛡️",
    badge: "AUDITOR",
    desc: "Validates AES-256 local vault integrity, verifies offline air-gap, and ensures zero telemetry or secret leakages exist in exported notes.",
    trigger: "Continuous Daemon",
    status: "Active",
    enabled: true,
    lastRun: "Just now"
  },
  {
    id: "radar-scout",
    name: "Radar Horizon & Milestone Scout",
    icon: "🎯",
    badge: "PREDICTIVE ENGINE",
    desc: "Forecasts delivery dates for High/Critical roadmap blips and suggests resource reallocations based on historical capture velocity.",
    trigger: "Daily (09:00 UTC)",
    status: "Standby",
    enabled: false,
    lastRun: "Yesterday"
  }
];

function getStoredMockAgents() {
  try {
    const raw = localStorage.getItem("wolftimeline_mock_agents_v1");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const defaults = {};
  MOCK_AI_AGENTS.forEach((a) => {
    defaults[a.id] = { enabled: a.enabled, status: a.status };
  });
  return defaults;
}

function saveStoredMockAgents(agents) {
  try {
    localStorage.setItem("wolftimeline_mock_agents_v1", JSON.stringify(agents));
  } catch (e) {}
}

function renderAiAgents() {
  const container = document.getElementById("aiAgentsGrid");
  if (!container) return;
  const stored = getStoredMockAgents();
  container.innerHTML = "";

  MOCK_AI_AGENTS.forEach((agent) => {
    const isEnabled = stored[agent.id] ? !!stored[agent.id].enabled : agent.enabled;
    const card = document.createElement("div");
    card.className = `agent-card ${isEnabled ? "active" : ""}`;
    card.innerHTML = `
      <div class="agent-card-header">
        <div class="agent-brand">
          <div class="agent-icon-badge">${agent.icon}</div>
          <div class="agent-title-col">
            <span class="agent-name">${escapeHtml(agent.name)}</span>
            <span class="agent-badge-tag">${escapeHtml(agent.badge)}</span>
          </div>
        </div>
        <div class="agent-toggle-wrap">
          <span class="agent-status-label ${isEnabled ? "active" : "standby"}">
            ${isEnabled ? "Active" : "Standby"}
          </span>
          <label class="switch-label">
            <input type="checkbox" class="agent-toggle-input" data-agent-id="${agent.id}" ${isEnabled ? "checked" : ""} />
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>
      <p class="agent-desc">${escapeHtml(agent.desc)}</p>
      <div class="agent-meta-row">
        <span>⚡ Trigger: ${escapeHtml(agent.trigger)}</span>
        <span>⏱️ Last Run: ${escapeHtml(agent.lastRun)}</span>
      </div>
    `;

    const toggleInput = card.querySelector(".agent-toggle-input");
    toggleInput.addEventListener("change", (e) => {
      const active = e.target.checked;
      const cur = getStoredMockAgents();
      cur[agent.id] = { enabled: active, status: active ? "Active" : "Standby" };
      saveStoredMockAgents(cur);
      renderAiAgents();
    });

    container.appendChild(card);
  });
}

function setupAgentSimulation() {
  const triggerBtn = document.getElementById("triggerAgentSimulationBtn");
  const consoleOutput = document.getElementById("agentConsoleOutput");
  if (!triggerBtn || !consoleOutput) return;

  let isSimulating = false;
  triggerBtn.addEventListener("click", async () => {
    if (isSimulating) return;
    isSimulating = true;
    triggerBtn.disabled = true;
    triggerBtn.textContent = "⏳ Running Simulation...";

    const providerSelect = document.getElementById("mockAgentProviderSelect");
    const providerName = providerSelect ? providerSelect.options[providerSelect.selectedIndex].text : "Gemini 2.5 Flash";

    const logs = [
      `[00:01] ⚡ Spawning Autonomous Agent Daemon on ${providerName}...`,
      `[00:02] 🐺 [Wolf Synthesizer] Scanning ${state.notes.length} local workspace notes...`,
      `[00:03] 🐺 [Wolf Synthesizer] Detected active roadmap track: '${state.notes[0] ? state.notes[0].title : "Infrastructure"}' with ${state.roadmapData.length} phases.`,
      `[00:04] 🛡️ [Council Guard] Checking cryptographic hashes across SQLite local vault... 100% Zero-telemetry verified.`,
      `[00:05] ⚡ [Content Engine] Generated draft tweet: 'Shipped sovereign hardware licensing in Wolf Timeline v0.1.0 🐺 @wolfitway'`,
      `[00:06] 🎯 [Radar Scout] Predicted next milestone velocity completion: 3 days ahead of schedule.`,
      `[00:07] ✓ Agent cycle complete in 380ms. Sovereign sandbox intact.`
    ];

    consoleOutput.textContent = "";
    for (let i = 0; i < logs.length; i++) {
      consoleOutput.textContent += (i > 0 ? "\n" : "") + logs[i];
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
      await new Promise((r) => setTimeout(r, 260));
    }

    triggerBtn.disabled = false;
    triggerBtn.textContent = "✓ Simulation Finished (Run Again)";
    isSimulating = false;
  });
}

// =========================================================================
// DATA EXPORT UTILITIES (EXPORT ALL DATA INPUT BY USER)
// =========================================================================
function getCompleteVaultBackupPayload() {
  const totalEvents = state.notes.reduce((acc, n) => acc + (n.events ? n.events.length : 0), 0);
  const totalExplorations = state.notes.reduce((acc, n) => acc + (n.ai_explorations ? n.ai_explorations.length : 0), 0);
  const totalMoodItems = state.notes.reduce((acc, n) => acc + (n.mood_gallery ? n.mood_gallery.length : 0), 0);
  const totalWebLinks = state.notes.reduce((acc, n) => acc + (n.bookmarks ? n.bookmarks.length : 0), 0);
  const totalSecrets = state.vaultDecryptedSecrets ? state.vaultDecryptedSecrets.length : 0;

  return {
    app: "Wolf Timeline",
    version: "0.1.0-alpha",
    export_schema: "wolfitway_sovereign_vault_v2",
    exported_at: new Date().toISOString(),
    sovereign_guarantee: "100% Offline-First Zero-Telemetry",
    license: {
      machine_id: state.currentDeviceId || "WOLF-DEV-LOCAL",
      seat_tier: state.isLicenseActive ? "Private Alpha Node Seat" : "Unactivated Alpha Node",
      license_key: state.currentLicenseKey || null,
      hardware_bound: true
    },
    statistics: {
      notes_count: state.notes.length,
      roadmap_phases_count: state.roadmapData.length,
      timeline_events_count: totalEvents,
      ai_explorations_count: totalExplorations,
      mood_items_count: totalMoodItems,
      web_links_count: totalWebLinks,
      encrypted_secrets_count: totalSecrets
    },
    notes: state.notes,
    roadmap: state.roadmapData,
    connections_mock: getStoredConnections(),
    mock_agents: getStoredMockAgents()
  };
}

function updateVaultStatsDisplay() {
  const statNotesCount = document.getElementById("statNotesCount");
  const statRadarCount = document.getElementById("statRadarCount");
  const statEventsCount = document.getElementById("statEventsCount");
  const statVaultSize = document.getElementById("statVaultSize");

  if (statNotesCount) statNotesCount.textContent = state.notes.length;
  if (statRadarCount) {
    let count = 0;
    state.roadmapData.forEach((ph) => {
      count += (ph.items ? ph.items.length : 0);
    });
    statRadarCount.textContent = count || state.roadmapData.length;
  }
  if (statEventsCount) {
    const totalEvents = state.notes.reduce((acc, n) => acc + (n.events ? n.events.length : 0), 0);
    statEventsCount.textContent = totalEvents;
  }
  if (statVaultSize) {
    const payload = getCompleteVaultBackupPayload();
    const str = JSON.stringify(payload);
    const kb = (new Blob([str]).size / 1024).toFixed(1);
    statVaultSize.textContent = `${kb} KB`;
  }
}

function exportAllDataToCsv() {
  const headers = [
    "ID",
    "Title",
    "Status",
    "Kind",
    "Created_At",
    "Tags",
    "Body",
    "Timeline_Events_Count",
    "AI_Explorations_Count",
    "Decision_Rationales"
  ];

  const rows = [headers.join(",")];

  state.notes.forEach((note) => {
    const rationales = (note.ai_explorations || [])
      .map((e) => `[${e.title}]: ${e.rationale}`)
      .join(" | ");

    const fields = [
      String(note.id),
      `"${(note.title || "").replace(/"/g, '""')}"`,
      `"${(note.status || "").replace(/"/g, '""')}"`,
      `"${(note.kind || "").replace(/"/g, '""')}"`,
      `"${(note.created_at || "").replace(/"/g, '""')}"`,
      `"${(note.tags || []).join("; ").replace(/"/g, '""')}"`,
      `"${(note.body || "").replace(/\n/g, " ").replace(/"/g, '""')}"`,
      String((note.events || []).length),
      String((note.ai_explorations || []).length),
      `"${rationales.replace(/"/g, '""')}"`
    ];
    rows.push(fields.join(","));
  });

  const csvContent = rows.join("\r\n");
  const filename = `wolf_timeline_export_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csvContent, "text/csv;charset=utf-8;");
}

function setupVsCodeSettingsNav() {
  const nav = document.getElementById("settingsNav");
  const scrollContainer = document.getElementById("settingsScrollContainer");
  const searchInput = document.getElementById("settingsSearchInput");
  const clearSearchBtn = document.getElementById("clearSettingsSearchBtn");

  // Nav item click to scroll
  if (nav && scrollContainer) {
    nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".settings-nav-item");
      if (!btn) return;
      const targetId = btn.dataset.section;
      const targetSec = document.getElementById(targetId);
      if (targetSec) {
        nav.querySelectorAll(".settings-nav-item").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        targetSec.scrollIntoView({ behavior: "smooth", block: "start" });
        targetSec.classList.add("highlight-section");
        setTimeout(() => targetSec.classList.remove("highlight-section"), 1200);
      }
    });

    // Scroll spy to highlight active nav button
    let scrollTimeout = null;
    scrollContainer.addEventListener("scroll", () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        const sections = scrollContainer.querySelectorAll(".vscode-settings-section");
        const containerTop = scrollContainer.getBoundingClientRect().top;
        let currentSectionId = null;

        sections.forEach((sec) => {
          const rect = sec.getBoundingClientRect();
          if (rect.top - containerTop <= 140) {
            currentSectionId = sec.id;
          }
        });

        if (currentSectionId) {
          nav.querySelectorAll(".settings-nav-item").forEach((b) => {
            if (b.dataset.section === currentSectionId) {
              b.classList.add("active");
            } else {
              b.classList.remove("active");
            }
          });
        }
      }, 70);
    });
  }

  // Search filter
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      if (clearSearchBtn) {
        if (q) clearSearchBtn.classList.remove("hidden");
        else clearSearchBtn.classList.add("hidden");
      }

      const sections = document.querySelectorAll(".vscode-settings-section");
      sections.forEach((sec) => {
        if (!q) {
          sec.style.display = "";
          return;
        }
        const text = sec.textContent.toLowerCase();
        if (text.includes(q)) {
          sec.style.display = "";
        } else {
          sec.style.display = "none";
        }
      });
    });

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearSearchBtn.classList.add("hidden");
        document.querySelectorAll(".vscode-settings-section").forEach((s) => (s.style.display = ""));
        searchInput.focus();
      });
    }
  }

  // Mock Ping All Gateway Relay Button
  const mockPingAllBtn = document.getElementById("mockPingAllBtn");
  const mockGatewaySelect = document.getElementById("mockGatewaySelect");
  if (mockPingAllBtn) {
    mockPingAllBtn.addEventListener("click", async () => {
      const origText = mockPingAllBtn.textContent;
      const gw = mockGatewaySelect ? mockGatewaySelect.value : "relay.wolfitway.com";
      mockPingAllBtn.disabled = true;
      mockPingAllBtn.textContent = `Pinging ${gw}...`;
      await new Promise((r) => setTimeout(r, 280));
      const ping = Math.floor(Math.random() * 10) + 12;
      mockPingAllBtn.textContent = `✓ ${gw} OK (${ping}ms)`;
      setTimeout(() => {
        mockPingAllBtn.disabled = false;
        mockPingAllBtn.textContent = origText;
      }, 2500);
    });
  }
}

function setupSettingsView() {
  // Navigation & Search setup
  setupVsCodeSettingsNav();
  setupAgentSimulation();

  // Full Vault JSON Export (All user data!)
  const vaultExportAllJsonBtn = document.getElementById("vaultExportAllJsonBtn");
  if (vaultExportAllJsonBtn) {
    vaultExportAllJsonBtn.addEventListener("click", () => {
      const payload = getCompleteVaultBackupPayload();
      const filename = `wolf_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
      downloadFile(filename, JSON.stringify(payload, null, 2), "application/json");
    });
  }

  // Legacy button support
  if (vaultExportJsonBtn) {
    vaultExportJsonBtn.addEventListener("click", () => {
      const payload = getCompleteVaultBackupPayload();
      downloadFile("wolfitway_vault_export.json", JSON.stringify(payload, null, 2), "application/json");
    });
  }

  // Copy JSON to Clipboard
  const copyVaultJsonBtn = document.getElementById("copyVaultJsonBtn");
  if (copyVaultJsonBtn) {
    copyVaultJsonBtn.addEventListener("click", async () => {
      const payload = getCompleteVaultBackupPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      try {
        await navigator.clipboard.writeText(jsonStr);
        const originalText = copyVaultJsonBtn.textContent;
        copyVaultJsonBtn.textContent = "✓ Copied Vault JSON!";
        setTimeout(() => {
          copyVaultJsonBtn.textContent = originalText;
        }, 2200);
      } catch (err) {
        prompt("Copy Vault JSON:", jsonStr);
      }
    });
  }

  // CSV Dataset Export
  const vaultExportCsvBtn = document.getElementById("vaultExportCsvBtn");
  if (vaultExportCsvBtn) {
    vaultExportCsvBtn.addEventListener("click", () => {
      exportAllDataToCsv();
    });
  }

  // Markdown Vault Export
  if (vaultExportMdBtn) {
    vaultExportMdBtn.addEventListener("click", () => {
      let md = `# 🐺 Wolf Timeline Vault Export\nGenerated: ${new Date().toISOString()}\nSovereign Guarantee: 100% Offline-First Zero-Telemetry\n\n---\n\n`;
      state.notes.forEach((n) => {
        md += `## [${(n.status || "IDEATION").toUpperCase()}] ${n.title}\n`;
        md += `**Date:** ${n.created_at} | **Tags:** ${(n.tags || []).map((t) => "#" + t).join(" ")}\n\n`;
        md += `${n.body}\n\n`;
        if (n.events && n.events.length) {
          md += `### Chronological Timeline\n`;
          n.events.forEach((e) => {
            md += `- **${e.title}** (${e.time}): ${e.desc} [${e.author}]\n`;
          });
          md += `\n`;
        }
        if (n.ai_explorations && n.ai_explorations.length) {
          md += `### AI Explorations & Decision Rationale\n`;
          n.ai_explorations.forEach((exp) => {
            md += `#### ${exp.title} (${exp.model} - ${exp.date})\n`;
            if (exp.url) md += `🔗 [Reference](${exp.url})\n\n`;
            md += `**Rationale:** ${exp.rationale}\n\n`;
            md += `\`\`\`\n${exp.transcript}\n\`\`\`\n\n`;
          });
        }
        if (n.mood_gallery && n.mood_gallery.length) {
          md += `### Mood Gallery & Visual References\n`;
          n.mood_gallery.forEach((mg) => {
            md += `- ![${mg.caption}](${mg.url})\n`;
          });
          md += `\n`;
        }
        if (n.bookmarks && n.bookmarks.length) {
          md += `### Web Links & Research\n`;
          n.bookmarks.forEach((bm) => {
            md += `- [${bm.title}](${bm.url}) (${bm.domain})\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      });
      downloadFile("wolfitway_timeline_vault.md", md, "text/markdown");
    });
  }

  // Vault Import
  const vaultImportJsonBtn = document.getElementById("vaultImportJsonBtn");
  const vaultImportFileInput = document.getElementById("vaultImportFileInput");
  if (vaultImportJsonBtn && vaultImportFileInput) {
    vaultImportJsonBtn.addEventListener("click", () => {
      vaultImportFileInput.click();
    });
    vaultImportFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.notes && Array.isArray(data.notes)) {
            state.notes = data.notes;
          } else if (Array.isArray(data)) {
            state.notes = data;
          }
          if (data.roadmap && Array.isArray(data.roadmap)) {
            state.roadmapData = data.roadmap;
          }
          saveStoredNotes();
          saveStoredRoadmap();
          renderCards();
          if (state.notes.length > 0) selectNote(state.notes[0].id);
          renderRoadmap();
          updateVaultStatsDisplay();
          alert("Sovereign vault imported successfully!");
        } catch (err) {
          alert("Failed to parse vault JSON file: " + err.message);
        }
      };
      reader.readAsText(file);
      vaultImportFileInput.value = "";
    });
  }

  // Reset Demo Projects
  const resetDemoProjectsBtn = document.getElementById("resetDemoProjectsBtn");
  if (resetDemoProjectsBtn) {
    resetDemoProjectsBtn.addEventListener("click", () => {
      if (confirm("Reset workspace with all sovereign sample projects, roadmap, and mood gallery? This will reload the default projects.")) {
        localStorage.removeItem("wolftimeline_notes_v2");
        localStorage.removeItem("wolftimeline_roadmap_v2");
        loadStoredData();
        renderCards();
        if (state.notes.length > 0) selectNote(state.notes[0].id);
        renderRoadmap();
        updateVaultStatsDisplay();
        alert("Sample projects reloaded successfully!");
      }
    });
  }

  renderSettingsView();
}

function renderSettingsView() {
  renderWolfitwayConnections();
  renderAiAgents();
  renderCouncilExperts();
  updateVaultStatsDisplay();
}

function renderWolfitwayConnections() {
  if (!connectionsGrid) return;
  const connections = getStoredConnections();
  connectionsGrid.innerHTML = "";

  WOLFITWAY_PRODUCTS.forEach((prod) => {
    const connState = connections[prod.id] || { connected: false, token: "" };
    const isConnected = !!connState.connected;

    const card = document.createElement("div");
    card.className = `connection-card ${isConnected ? "active" : ""}`;
    card.innerHTML = `
      <div class="connection-header">
        <div class="connection-brand">
          <div class="connection-logo-icon">${prod.icon}</div>
          <div class="connection-title-col">
            <span class="connection-name">${escapeHtml(prod.name)}</span>
            <span class="connection-domain">${escapeHtml(prod.domain)}</span>
          </div>
        </div>
        <span class="connection-status-pill ${isConnected ? "connected" : "disconnected"}">
          <span class="dot ${isConnected ? "dot-green" : "dot-hollow"}"></span>
          ${isConnected ? "Connected (Simulated)" : "Disconnected"}
        </span>
      </div>

      <p class="connection-desc">${escapeHtml(prod.desc)}</p>

      <div class="connection-token-row">
        <input type="password" 
               class="connection-token-input" 
               placeholder="${prod.placeholder || "Enter Wolfitway API Token..."}"
               value="${escapeHtml(connState.token || "")}"
               data-prod-id="${prod.id}" />
        <button type="button" 
                class="btn-connection-toggle ${isConnected ? "connected" : ""}"
                data-prod-id="${prod.id}">
          ${isConnected ? "Disconnect" : "Connect Mock"}
        </button>
      </div>
    `;

    // Handle token input change
    const tokenInput = card.querySelector(".connection-token-input");
    tokenInput.addEventListener("change", () => {
      const curConn = getStoredConnections();
      curConn[prod.id] = curConn[prod.id] || { connected: false, token: "" };
      curConn[prod.id].token = tokenInput.value.trim();
      saveStoredConnections(curConn);
    });

    // Handle connect / disconnect toggle
    const toggleBtn = card.querySelector(".btn-connection-toggle");
    toggleBtn.addEventListener("click", () => {
      const curConn = getStoredConnections();
      curConn[prod.id] = curConn[prod.id] || { connected: false, token: "" };
      const nextState = !curConn[prod.id].connected;
      curConn[prod.id].connected = nextState;
      if (nextState && !curConn[prod.id].token) {
        curConn[prod.id].token = `wfw_${prod.id}_live_${Math.random().toString(36).substring(2, 8)}`;
      }
      saveStoredConnections(curConn);
      renderWolfitwayConnections();
    });

    connectionsGrid.appendChild(card);
  });
}

function renderCouncilExperts() {
  if (!expertsGrid) return;
  expertsGrid.innerHTML = "";

  SOVEREIGN_EXPERTS.forEach((expert) => {
    const card = document.createElement("div");
    card.className = "expert-card";
    card.innerHTML = `
      <div class="expert-card-top">
        <div class="expert-role-group">
          <div class="expert-avatar-wrap">${expert.avatar}</div>
          <div class="expert-role-col">
            <span class="expert-name">${escapeHtml(expert.role)}</span>
            <span class="expert-handle">${escapeHtml(expert.handle)}</span>
          </div>
        </div>
        <span class="expert-status-pill">✅ ${escapeHtml(expert.status)}</span>
      </div>
      <p class="expert-mandate">${escapeHtml(expert.mandate)}</p>
      <div class="expert-tags-row">
        ${expert.tags.map((t) => `<span class="expert-tag">${escapeHtml(t)}</span>`).join("")}
      </div>
    `;
    expertsGrid.appendChild(card);
  });
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =========================================================================
// UTILITY HELPERS
// =========================================================================
function getStatusClass(status) {
  switch ((status || "").toLowerCase()) {
    case "ideation":
    case "new":
    case "exploring":
      return "status-ideation";
    case "research":
    case "in-progress":
    case "in_progress":
      return "status-research";
    case "design":
      return "status-design";
    case "live":
      return "status-live";
    case "up_next":
    case "up-next":
      return "status-up-next";
    case "not_started":
    case "not-started":
      return "status-not-started";
    default:
      return "status-backlog";
  }
}

function getStatusLabel(status) {
  switch ((status || "").toLowerCase()) {
    case "ideation":
    case "new":
      return "Ideation";
    case "research":
      return "Research";
    case "design":
      return "Design";
    case "in-progress":
    case "in_progress":
      return "In Progress";
    case "live":
      return "Live";
    case "up_next":
    case "up-next":
      return "Up Next";
    case "not_started":
    case "not-started":
      return "Not started";
    case "exploring":
      return "Exploring";
    default:
      return "Backlog";
  }
}

function extractSummary(body) {
  if (!body) return "No description provided.";
  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("Goal") && !trimmed.startsWith("#")) {
      return trimmed;
    }
  }
  return lines[0] || "No description provided.";
}

function formatTimeAgo(isoString) {
  if (!isoString) return "Just now";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// =========================================================================
// DISTRACTION-FREE FULLSCREEN FOCUS EDITOR
// =========================================================================
function setupFocusEditor() {
  if (!focusEditorModal) return;

  // Header close button
  if (closeFocusEditorCross) {
    closeFocusEditorCross.addEventListener("click", () => {
      commitFocusEditor(true);
    });
  }

  // Save & Return button
  if (saveFocusEditorBtn) {
    saveFocusEditorBtn.addEventListener("click", () => {
      commitFocusEditor(true);
    });
  }

  // Focus Editor Tabs (Markdown Editor vs Live Preview)
  if (focusTabEdit) {
    focusTabEdit.addEventListener("click", () => {
      switchFocusTab("edit");
    });
  }

  if (focusTabPreview) {
    focusTabPreview.addEventListener("click", () => {
      switchFocusTab("preview");
    });
  }

  // Live word and character counting
  if (focusTextarea) {
    focusTextarea.addEventListener("input", () => {
      updateFocusStats();
    });

    focusTextarea.addEventListener("keydown", (e) => {
      // Cmd/Ctrl + S = Quick Save without closing
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        commitFocusEditor(false);
        flashFocusSaveIndicator();
      }

      // Tab key indentation support
      if (e.key === "Tab") {
        e.preventDefault();
        const start = focusTextarea.selectionStart;
        const end = focusTextarea.selectionEnd;
        focusTextarea.value = focusTextarea.value.substring(0, start) + "  " + focusTextarea.value.substring(end);
        focusTextarea.selectionStart = focusTextarea.selectionEnd = start + 2;
        updateFocusStats();
      }
    });
  }

  // Dialog native Escape key saves cleanly
  focusEditorModal.addEventListener("cancel", (e) => {
    e.preventDefault();
    commitFocusEditor(true);
  });
}

function openFocusEditor() {
  const note = state.notes.find((n) => n.id === state.selectedNoteId) || state.notes[0];
  if (!note || !focusEditorModal) return;

  if (focusEditorTitle) {
    focusEditorTitle.textContent = note.title;
  }
  if (focusTextarea) {
    focusTextarea.value = note.body || "";
  }

  switchFocusTab("edit");
  updateFocusStats();

  focusEditorModal.showModal();

  setTimeout(() => {
    if (focusTextarea) {
      focusTextarea.focus();
    }
  }, 60);
}

function switchFocusTab(tab) {
  if (!focusTabEdit || !focusTabPreview || !focusTextarea || !focusPreviewContainer) return;

  if (tab === "edit") {
    focusTabEdit.classList.add("active");
    focusTabPreview.classList.remove("active");
    focusTextarea.classList.remove("hidden");
    focusPreviewContainer.classList.add("hidden");
    focusTextarea.focus();
  } else {
    focusTabPreview.classList.add("active");
    focusTabEdit.classList.remove("active");
    focusTextarea.classList.add("hidden");
    focusPreviewContainer.classList.remove("hidden");
    focusPreviewContainer.innerHTML = renderMarkdownToHtml(focusTextarea.value);
  }
}

function updateFocusStats() {
  if (!focusTextarea || !focusWordCount) return;
  const text = focusTextarea.value || "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  focusWordCount.textContent = `${words} words · ${chars} chars · ~${readTime}m read`;
}

function flashFocusSaveIndicator() {
  if (!saveFocusEditorBtn) return;
  const originalHtml = saveFocusEditorBtn.innerHTML;
  saveFocusEditorBtn.innerHTML = `<span>Saved ✓</span>`;
  saveFocusEditorBtn.style.background = "#059669";
  setTimeout(() => {
    saveFocusEditorBtn.innerHTML = originalHtml;
    saveFocusEditorBtn.style.background = "";
  }, 1200);
}

function commitFocusEditor(shouldClose = true) {
  const note = state.notes.find((n) => n.id === state.selectedNoteId);
  if (!note) return;

  const newBody = focusTextarea ? focusTextarea.value : "";
  note.body = newBody;
  note.created_at = new Date().toISOString();

  if (detailNotesText) {
    detailNotesText.textContent = newBody || "No notes recorded yet. Click to write notes.";
  }
  if (detailNotesEdit) {
    detailNotesEdit.value = newBody;
  }
  if (detailUpdatedTime) {
    detailUpdatedTime.textContent = "Updated Just now";
  }

  // Update Studio view if active
  if (studioNotesBody) {
    populateStudioNotes(newBody);
  }

  saveStoredNotes();
  renderCards();

  const invokeFn = getInvoke();
  if (invokeFn) {
    invokeFn("update_note", {
      update: { id: note.id, body: newBody }
    }).catch((e) => console.warn("Tauri update_note:", e));
  }

  if (shouldClose && focusEditorModal) {
    focusEditorModal.close();
  }
}

function renderMarkdownToHtml(md) {
  if (!md) return "<p style='color:var(--text-dim);'><em>No content written yet. Tap Markdown Editor to pour your thoughts.</em></p>";

  // Escape HTML to prevent XSS
  let escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Multi-line code blocks
  escaped = escaped.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headings
  escaped = escaped.replace(/^#### (.*$)/gim, "<h4>$1</h4>");
  escaped = escaped.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  escaped = escaped.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  escaped = escaped.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Blockquotes
  escaped = escaped.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

  // Bold & Italic
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  escaped = escaped.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  escaped = escaped.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Horizontal Rules
  escaped = escaped.replace(/^---$/gim, "<hr style='border:none; border-top:1px solid #1a3326; margin:20px 0;' />");

  // Lists and paragraphs
  const lines = escaped.split("\n");
  let inUl = false;
  let inOl = false;
  const result = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inUl) {
        result.push("<ul style='padding-left:24px; margin-bottom:12px;'>");
        inUl = true;
      }
      result.push(`<li style='margin-bottom:4px;'>${trimmed.substring(2)}</li>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inOl) {
        result.push("<ol style='padding-left:24px; margin-bottom:12px;'>");
        inOl = true;
      }
      result.push(`<li style='margin-bottom:4px;'>${trimmed.replace(/^\d+\.\s/, "")}</li>`);
    } else {
      if (inUl) {
        result.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        result.push("</ol>");
        inOl = false;
      }
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("</pre") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<blockquote")
      ) {
        result.push(line);
      } else if (trimmed) {
        result.push(`<p style='margin-bottom:12px; line-height:1.75;'>${line}</p>`);
      }
    }
  }
  if (inUl) result.push("</ul>");
  if (inOl) result.push("</ol>");

  return result.join("\n");
}

// =========================================================================
// HARDWARE-BOUND SOVEREIGN CRYPTOGRAPHIC LICENSING
// =========================================================================
const MASTER_SIGNING_SECRET = "WOLF_SOVEREIGN_ALPHA_SIGNING_SECRET_2026";
const MASTER_FOUNDER_KEY = "WOLF-FOUNDER-MASTER-ACCESS-2026";

async function sha256Hex(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

async function computeWebLicenseKey(deviceId) {
  const hex = await sha256Hex(deviceId + MASTER_SIGNING_SECRET);
  const clean = hex.replace(/[^0-9A-F]/g, "");
  return `WOLF-KEY-${clean.substring(0, 4)}-${clean.substring(4, 8)}-${clean.substring(8, 12)}`;
}

function getWebMachineId() {
  let id = localStorage.getItem("wolftimeline_device_id");
  if (!id) {
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    id = `WOLF-DEV-${hex.substring(0, 4)}-${hex.substring(4, 8)}-${hex.substring(8, 12)}`;
    localStorage.setItem("wolftimeline_device_id", id);
  }
  return id;
}

async function getDeviceId() {
  if (window.__TAURI__ && window.__TAURI__.invoke) {
    try {
      const hwid = await window.__TAURI__.invoke("get_machine_fingerprint");
      if (hwid) return hwid;
    } catch (e) {
      console.warn("Tauri hwid fallback:", e);
    }
  }
  return getWebMachineId();
}

async function checkLicenseStatus() {
  if (window.__TAURI__ && window.__TAURI__.invoke) {
    try {
      const status = await window.__TAURI__.invoke("check_license_status");
      if (status) return status;
    } catch (e) {
      console.warn("Tauri license check fallback:", e);
    }
  }

  // Web fallback check
  const deviceId = getWebMachineId();
  try {
    const saved = localStorage.getItem("wolftimeline_license_v1");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.machine_id === deviceId && parsed.key) {
        const expected = await computeWebLicenseKey(deviceId);
        if (parsed.key === MASTER_FOUNDER_KEY || parsed.key === expected) {
          return {
            activated: true,
            machine_id: deviceId,
            key: parsed.key,
            tier: parsed.tier || "Private Alpha Node Seat"
          };
        }
      }
    }
  } catch (e) {}

  return {
    activated: false,
    machine_id: deviceId,
    key: null,
    tier: "Unactivated Alpha Node"
  };
}

async function submitLicenseActivation(enteredKey) {
  const cleanKey = enteredKey.trim().toUpperCase();
  if (window.__TAURI__ && window.__TAURI__.invoke) {
    try {
      const result = await window.__TAURI__.invoke("activate_license", { key: cleanKey });
      return result;
    } catch (e) {
      throw new Error(typeof e === "string" ? e : (e.message || "Invalid license key"));
    }
  }

  // Web fallback verification
  const deviceId = getWebMachineId();
  const expected = await computeWebLicenseKey(deviceId);
  if (cleanKey !== MASTER_FOUNDER_KEY && cleanKey !== expected) {
    throw new Error("Invalid license key for this device. Please check key or reply on X.");
  }

  const isMaster = cleanKey === MASTER_FOUNDER_KEY;
  const result = {
    activated: true,
    machine_id: deviceId,
    key: cleanKey,
    tier: isMaster ? "Founder Sovereign Access" : "Private Alpha Node Seat",
    activated_at: new Date().toISOString()
  };

  localStorage.setItem("wolftimeline_license_v1", JSON.stringify(result));
  return result;
}

function updateLicenseUI(status) {
  state.isLicenseActive = !!status.activated;
  state.currentDeviceId = status.machine_id || "";
  state.currentLicenseKey = status.key || "";

  if (closeLicenseModalBtn) {
    if (state.isLicenseActive) {
      closeLicenseModalBtn.classList.remove("hidden");
    } else {
      closeLicenseModalBtn.classList.add("hidden");
    }
  }

  if (settingsLicenseBadge && settingsLicenseStatusText) {
    if (state.isLicenseActive) {
      settingsLicenseBadge.className = "license-status-badge active";
      settingsLicenseStatusText.textContent = `${status.tier || "Active Node Seat"} (Hardware Verified)`;
    } else {
      settingsLicenseBadge.className = "license-status-badge unactivated";
      settingsLicenseStatusText.textContent = "Unactivated Alpha Node (Lock Screen Active)";
    }
  }

  if (settingsLicenseDeviceText) {
    settingsLicenseDeviceText.textContent = `Device ID: ${state.currentDeviceId || "Unknown"}`;
  }

  if (licenseDeviceFingerprint) {
    licenseDeviceFingerprint.textContent = state.currentDeviceId || "WOLF-DEV-FETCHING...";
  }

  if (licenseActivationModal) {
    if (state.isLicenseActive) {
      if (licenseActivationModal.open) licenseActivationModal.close();
    } else {
      if (!licenseActivationModal.open) licenseActivationModal.showModal();
    }
  }
}

// =========================================================================
// 🔐 SOVEREIGN SECRET & PASSWORD VAULT (ZERO-KNOWLEDGE WEBCRYPTO SUBSYSTEM)
// Council of Experts: @systems-crypto, @product-strategist, @design-guardian
// =========================================================================

// --- WebCrypto Utilities (PBKDF2 100k rounds + AES-256-GCM) ---

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  if (!hex || typeof hex !== "string") return new Uint8Array();
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

async function deriveVaultKey(passphrase, saltBytes) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptVaultPayload(cryptoKey, dataObj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(dataObj));
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    cryptoKey,
    plaintext
  );
  return {
    ivHex: bytesToHex(iv),
    ciphertextHex: bytesToHex(new Uint8Array(ciphertextBuf))
  };
}

async function decryptVaultPayload(cryptoKey, ciphertextHex, ivHex) {
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);
  const decryptedBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    cryptoKey,
    ciphertext
  );
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decryptedBuf));
}

function generateStrongPassword(length = 22) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (x) => charset[x % charset.length]).join("");
}

// --- Storage & IPC Helpers ---

async function getStoredVaultMeta(key) {
  try {
    if (window.__TAURI__ && window.__TAURI__.invoke) {
      const res = await window.__TAURI__.invoke("get_vault_meta", { key });
      if (res !== null && res !== undefined) return res;
    }
  } catch (e) {
    console.warn("get_vault_meta IPC fallback:", e);
  }
  return localStorage.getItem("wolf_vault_meta_" + key);
}

async function setStoredVaultMeta(key, value) {
  try {
    if (window.__TAURI__ && window.__TAURI__.invoke) {
      await window.__TAURI__.invoke("set_vault_meta", { key, value });
    }
  } catch (e) {
    console.warn("set_vault_meta IPC fallback:", e);
  }
  try {
    localStorage.setItem("wolf_vault_meta_" + key, value);
  } catch (e) {}
}

async function fetchAllVaultItemsFromDb() {
  try {
    if (window.__TAURI__ && window.__TAURI__.invoke) {
      const items = await window.__TAURI__.invoke("get_vault_secrets");
      if (Array.isArray(items)) return items;
    }
  } catch (e) {
    console.warn("get_vault_secrets IPC fallback:", e);
  }
  try {
    const raw = localStorage.getItem("wolf_vault_secrets_v2");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

async function persistVaultItemToDb(item) {
  try {
    if (window.__TAURI__ && window.__TAURI__.invoke) {
      await window.__TAURI__.invoke("save_vault_secret", { item });
    }
  } catch (e) {
    console.warn("save_vault_secret IPC fallback:", e);
  }
  try {
    let list = [];
    const raw = localStorage.getItem("wolf_vault_secrets_v2");
    if (raw) list = JSON.parse(raw);
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem("wolf_vault_secrets_v2", JSON.stringify(list));
  } catch (e) {}
}

async function deleteVaultItemFromDb(id) {
  try {
    if (window.__TAURI__ && window.__TAURI__.invoke) {
      await window.__TAURI__.invoke("delete_vault_secret", { id });
    }
  } catch (e) {
    console.warn("delete_vault_secret IPC fallback:", e);
  }
  try {
    let list = [];
    const raw = localStorage.getItem("wolf_vault_secrets_v2");
    if (raw) list = JSON.parse(raw);
    list = list.filter((x) => x.id !== id);
    localStorage.setItem("wolf_vault_secrets_v2", JSON.stringify(list));
  } catch (e) {}
}

// --- Vault State Management & Lifecycle ---

async function checkVaultInitialization() {
  const canaryMeta = await getStoredVaultMeta("vault_canary");
  const isInit = Boolean(canaryMeta);

  if (!isInit) {
    if (vaultLockHeadline) vaultLockHeadline.textContent = "Initialize Sovereign Secret Vault";
    if (vaultLockSubtitle) {
      vaultLockSubtitle.textContent =
        "Create your Master Passphrase. Protected with PBKDF2 (100,000 iterations) & AES-256-GCM zero-knowledge encryption.";
    }
    if (unlockVaultBtn) unlockVaultBtn.textContent = "Create & Lock Vault";
  } else {
    if (vaultLockHeadline) vaultLockHeadline.textContent = "Unlock Sovereign Secret Vault";
    if (vaultLockSubtitle) {
      vaultLockSubtitle.textContent =
        "Enter your Master Passphrase to decrypt your sovereign keys in RAM. Decrypted secrets exist in memory only.";
    }
    if (unlockVaultBtn) unlockVaultBtn.textContent = "Decrypt & Unlock Vault";
  }
  return isInit;
}

async function unlockSecretsVault(passphrase) {
  if (!passphrase || passphrase.length < 6) {
    showVaultError("Master passphrase must be at least 6 characters long.");
    return false;
  }

  if (secretsVaultError) secretsVaultError.classList.add("hidden");
  if (unlockVaultBtn) {
    unlockVaultBtn.disabled = true;
    unlockVaultBtn.textContent = "⚡ Decrypting Vault...";
  }

  try {
    const canaryMetaStr = await getStoredVaultMeta("vault_canary");
    let saltHex = await getStoredVaultMeta("vault_salt");

    if (!canaryMetaStr || !saltHex) {
      // First-time setup: Generate new salt and initialize canary
      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      saltHex = bytesToHex(saltBytes);
      const cryptoKey = await deriveVaultKey(passphrase, saltBytes);

      const canaryObj = { marker: "WOLF_SOVEREIGN_VAULT", created_at: Date.now() };
      const encCanary = await encryptVaultPayload(cryptoKey, canaryObj);

      await setStoredVaultMeta("vault_salt", saltHex);
      await setStoredVaultMeta("vault_canary", JSON.stringify(encCanary));

      state.vaultCryptoKey = cryptoKey;
      state.isSecretsVaultUnlocked = true;
      state.vaultDecryptedSecrets = [];
    } else {
      // Existing vault: Derive key and verify canary
      const saltBytes = hexToBytes(saltHex);
      const cryptoKey = await deriveVaultKey(passphrase, saltBytes);

      let canaryPayload;
      try {
        const canaryEnc = JSON.parse(canaryMetaStr);
        canaryPayload = await decryptVaultPayload(cryptoKey, canaryEnc.ciphertextHex, canaryEnc.ivHex);
      } catch (err) {
        throw new Error("Incorrect master passphrase. Decryption failed.");
      }

      if (!canaryPayload || canaryPayload.marker !== "WOLF_SOVEREIGN_VAULT") {
        throw new Error("Passphrase verification failed. Vault integrity mismatch.");
      }

      state.vaultCryptoKey = cryptoKey;
      state.isSecretsVaultUnlocked = true;

      // Load and decrypt all items from SQLite
      const encryptedRows = await fetchAllVaultItemsFromDb();
      const decryptedList = [];

      for (const row of encryptedRows) {
        try {
          const payload = await decryptVaultPayload(cryptoKey, row.ciphertext, row.iv);
          decryptedList.push({
            id: row.id,
            service: row.service || payload.service || "Unnamed Secret",
            category: row.category || payload.category || "api",
            username: row.username || payload.username || "",
            password: payload.password || "",
            host: payload.host || "",
            notes: row.notes || payload.notes || "",
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || new Date().toISOString()
          });
        } catch (decErr) {
          console.warn(`Could not decrypt secret item ${row.id}:`, decErr);
        }
      }

      state.vaultDecryptedSecrets = decryptedList;
    }

    // Switch UI state
    if (secretsLockedState) secretsLockedState.style.display = "none";
    if (secretsUnlockedState) secretsUnlockedState.style.display = "block";
    if (masterPasswordInput) masterPasswordInput.value = "";

    renderSecretsList();
    startVaultInactivityTimer();
    return true;
  } catch (err) {
    showVaultError(err.message || "Decryption failed. Please verify your passphrase.");
    return false;
  } finally {
    if (unlockVaultBtn) {
      unlockVaultBtn.disabled = false;
      await checkVaultInitialization();
    }
  }
}

function lockSecretsVault() {
  state.isSecretsVaultUnlocked = false;
  state.vaultCryptoKey = null;
  state.vaultDecryptedSecrets = [];

  if (state.vaultAutoLockTimerId) {
    clearInterval(state.vaultAutoLockTimerId);
    state.vaultAutoLockTimerId = null;
  }

  if (secretsUnlockedState) secretsUnlockedState.style.display = "none";
  if (secretsLockedState) secretsLockedState.style.display = "flex";
  if (masterPasswordInput) masterPasswordInput.value = "";
  if (secretsVaultError) secretsVaultError.classList.add("hidden");

  checkVaultInitialization();
}

function showVaultError(msg) {
  if (secretsVaultError) {
    secretsVaultError.textContent = msg;
    secretsVaultError.classList.remove("hidden");
  }
}

function startVaultInactivityTimer() {
  if (state.vaultAutoLockTimerId) {
    clearInterval(state.vaultAutoLockTimerId);
  }
  state.vaultAutoLockCountdown = 300; // 5 minutes
  updateVaultCountdownDisplay();

  state.vaultAutoLockTimerId = setInterval(() => {
    if (!state.isSecretsVaultUnlocked) {
      clearInterval(state.vaultAutoLockTimerId);
      return;
    }
    state.vaultAutoLockCountdown--;
    if (state.vaultAutoLockCountdown <= 0) {
      clearInterval(state.vaultAutoLockTimerId);
      lockSecretsVault();
    } else {
      updateVaultCountdownDisplay();
    }
  }, 1000);
}

function resetVaultInactivityTimer() {
  if (state.isSecretsVaultUnlocked) {
    state.vaultAutoLockCountdown = 300;
    updateVaultCountdownDisplay();
  }
}

function updateVaultCountdownDisplay() {
  if (!vaultAutoLockCountdownEl) return;
  const mins = Math.floor(state.vaultAutoLockCountdown / 60);
  const secs = state.vaultAutoLockCountdown % 60;
  vaultAutoLockCountdownEl.textContent = `Auto-lock: ${mins}m ${secs < 10 ? "0" + secs : secs}s`;
}

// --- Smart Credential & Secret Scanner Heuristics ---

function scanTextForCredentials(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  const candidates = [];
  const seenMap = new Set();

  function addCandidate(service, category, username, password, host, notes) {
    if (!password || password.length < 3) return;
    const cleanPass = password.trim();
    const cleanUser = (username || "").trim();
    const cleanServ = (service || "Detected Credential").trim();
    const dedupeKey = `${cleanServ}::${cleanUser}::${cleanPass}`;
    if (seenMap.has(dedupeKey)) return;
    seenMap.add(dedupeKey);

    candidates.push({
      id: `scanned_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      service: cleanServ,
      category: category || "api",
      username: cleanUser,
      password: cleanPass,
      host: (host || "").trim(),
      notes: (notes || "").trim(),
      selected: true
    });
  }

  // 1. OpenAI API Keys (sk-..., sk-proj-...)
  const openAiMatches = rawText.matchAll(/\b(sk-(?:proj-)?[a-zA-Z0-9_\-]{20,})\b/g);
  for (const m of openAiMatches) {
    addCandidate("OpenAI API", "api", "api_key", m[1], "https://api.openai.com", "Auto-detected OpenAI API Key");
  }

  // 2. Anthropic Claude API Keys (sk-ant-...)
  const anthropicMatches = rawText.matchAll(/\b(sk-ant-[a-zA-Z0-9_\-]{20,})\b/g);
  for (const m of anthropicMatches) {
    addCandidate("Anthropic Claude", "api", "api_key", m[1], "https://api.anthropic.com", "Auto-detected Anthropic Key");
  }

  // 3. Google Gemini / Cloud Keys (AIza...)
  const googleMatches = rawText.matchAll(/\b(AIza[0-9A-Za-z\-_]{35})\b/g);
  for (const m of googleMatches) {
    addCandidate("Google Gemini AI", "api", "api_key", m[1], "https://generativelanguage.googleapis.com", "Auto-detected Google Cloud API Key");
  }

  // 4. GitHub Personal Access Tokens / OAuth (ghp_..., github_pat_...)
  const githubMatches = rawText.matchAll(/\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/g);
  for (const m of githubMatches) {
    addCandidate("GitHub Token", "api", "token", m[1], "https://github.com", "Auto-detected GitHub Access Token");
  }

  // 5. Stripe API Keys (sk_live_..., rk_live_..., pk_live_...)
  const stripeMatches = rawText.matchAll(/\b([rs]k_(?:test|live)_[0-9a-zA-Z]{24,}|pk_(?:test|live)_[0-9a-zA-Z]{24,})\b/g);
  for (const m of stripeMatches) {
    const isSecret = m[1].startsWith("sk_") || m[1].startsWith("rk_");
    addCandidate("Stripe API", "api", isSecret ? "secret_key" : "publishable_key", m[1], "https://api.stripe.com", "Auto-detected Stripe Key");
  }

  // 6. AWS Access Keys (AKIA...)
  const awsMatches = rawText.matchAll(/\b(AKIA[0-9A-Z]{16})\b/g);
  for (const m of awsMatches) {
    addCandidate("AWS Access Key", "token", m[1], m[1], "https://aws.amazon.com", "Auto-detected AWS IAM Access Key");
  }

  // 7. Database Connection URIs (postgres://, mysql://, mongodb://, redis://)
  const dbMatches = rawText.matchAll(/((?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|sqlite|mssql):\/\/[^\s"'`]+)/gi);
  for (const m of dbMatches) {
    const uri = m[1];
    let host = "";
    let user = "";
    let pass = uri;
    let serv = "Database URI";

    try {
      const parsed = new URL(uri);
      serv = `${parsed.protocol.replace(":", "").toUpperCase()} Database`;
      host = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      user = parsed.username || "";
      pass = parsed.password ? uri : uri;
    } catch (e) {
      if (uri.startsWith("postgres")) serv = "PostgreSQL DB";
      else if (uri.startsWith("mysql")) serv = "MySQL DB";
      else if (uri.startsWith("mongodb")) serv = "MongoDB";
      else if (uri.startsWith("redis")) serv = "Redis Instance";
    }

    addCandidate(serv, "db", user, pass, host, "Auto-detected connection string");
  }

  // 8. Line-by-Line Key-Value Parser (.env, ini, notes, exports)
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

    // Pattern: KEY = VALUE or export KEY=VALUE or KEY: VALUE
    const kvMatch = trimmed.match(/^(?:export\s+)?([A-Za-z0-9_.\-]+)\s*[:=]\s*["']?([^"'\r\n]+)["']?$/);
    if (kvMatch) {
      const keyName = kvMatch[1].trim();
      const val = kvMatch[2].trim();

      // Filter for sensitive names or high-entropy values
      const sensitivePattern = /(?:PASS|PASSWORD|SECRET|KEY|TOKEN|AUTH|CREDENTIAL|PRIVATE|DATABASE_URL|CLIENT_SECRET|JWT|HASH|SALT|ACCESS_KEY|API_KEY|BEARER|PIN)/i;
      if (sensitivePattern.test(keyName) && val.length >= 4) {
        let cat = "api";
        let servName = keyName.replace(/_/g, " ");

        if (/PASS|PASSWORD|PWD|PIN/i.test(keyName)) {
          cat = "login";
        } else if (/DB|DATABASE|POSTGRES|MYSQL|MONGO|REDIS/i.test(keyName)) {
          cat = "db";
        } else if (/TOKEN|SSH|PGP|KEY/i.test(keyName)) {
          cat = "token";
        }

        // Pretty-print common service env names
        if (/OPENAI/i.test(keyName)) servName = "OpenAI API";
        else if (/ANTHROPIC|CLAUDE/i.test(keyName)) servName = "Anthropic Claude";
        else if (/GEMINI|GOOGLE/i.test(keyName)) servName = "Google Gemini";
        else if (/GITHUB/i.test(keyName)) servName = "GitHub API";
        else if (/STRIPE/i.test(keyName)) servName = "Stripe";
        else if (/AWS/i.test(keyName)) servName = "AWS Credentials";
        else if (/SUPABASE/i.test(keyName)) servName = "Supabase";
        else if (/PINECONE/i.test(keyName)) servName = "Pinecone Vector DB";
        else if (/DATABASE_URL/i.test(keyName)) servName = "Primary Database URL";

        addCandidate(servName, cat, keyName, val, "", `Extracted from variable: ${keyName}`);
        continue;
      }
    }

    // Pattern: User:Pass or Username: ... Password: ...
    const userPassInline = trimmed.match(/(?:username|user|login|email)\s*[:=]\s*([^\s,;]+)[\s,;]+(?:password|pass|pwd)\s*[:=]\s*([^\s,;]+)/i);
    if (userPassInline) {
      addCandidate("Account Login", "login", userPassInline[1], userPassInline[2], "", "Extracted from inline credentials");
      continue;
    }

    // Pattern: simple user:pass combination (e.g. admin:SuperSecret123)
    const comboMatch = trimmed.match(/^([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+|[a-zA-Z0-9_\-\.]{3,30}):([^\s]{6,100})$/);
    if (comboMatch && !trimmed.startsWith("http:") && !trimmed.startsWith("https:")) {
      addCandidate("Account Login", "login", comboMatch[1], comboMatch[2], "", "Extracted from user:pass pair");
    }
  }

  return candidates;
}

// --- UI Rendering & Event Handling ---

let activeScannedCandidates = [];

function renderSecretsVaultView() {
  if (!state.isSecretsVaultUnlocked) {
    if (secretsUnlockedState) secretsUnlockedState.style.display = "none";
    if (secretsLockedState) secretsLockedState.style.display = "flex";
    checkVaultInitialization();
  } else {
    if (secretsLockedState) secretsLockedState.style.display = "none";
    if (secretsUnlockedState) secretsUnlockedState.style.display = "block";
    renderSecretsList();
  }
}

function renderSecretsList() {
  if (!secretsListContainer) return;
  secretsListContainer.innerHTML = "";

  const query = (state.vaultSearchQuery || "").trim().toLowerCase();
  const categoryFilter = state.vaultFilterCategory || "all";

  // Filter secrets
  const filtered = state.vaultDecryptedSecrets.filter((sec) => {
    if (categoryFilter !== "all" && sec.category !== categoryFilter) {
      return false;
    }
    if (!query) return true;
    const servMatch = (sec.service || "").toLowerCase().includes(query);
    const userMatch = (sec.username || "").toLowerCase().includes(query);
    const hostMatch = (sec.host || "").toLowerCase().includes(query);
    const notesMatch = (sec.notes || "").toLowerCase().includes(query);
    return servMatch || userMatch || hostMatch || notesMatch;
  });

  // Update stats counters
  if (statVaultTotalCount) statVaultTotalCount.textContent = state.vaultDecryptedSecrets.length;
  if (statVaultApiCount) {
    statVaultApiCount.textContent = state.vaultDecryptedSecrets.filter((s) => s.category === "api").length;
  }
  if (statVaultLoginCount) {
    statVaultLoginCount.textContent = state.vaultDecryptedSecrets.filter((s) => s.category === "login").length;
  }
  if (statVaultDbCount) {
    statVaultDbCount.textContent = state.vaultDecryptedSecrets.filter((s) => s.category === "db").length;
  }

  if (filtered.length === 0) {
    secretsListContainer.innerHTML = `
      <div class="secrets-empty-state">
        <div class="empty-icon">🔐</div>
        <div class="empty-title">${query || categoryFilter !== "all" ? "No matching secrets found" : "Your Secret Vault is Empty"}</div>
        <div class="empty-sub">
          ${query || categoryFilter !== "all"
            ? "Try changing your search query or switching category filter tab."
            : "Drop a .txt or .env file with our Smart Scanner, or click '+ Add Secret' to store credentials securely."}
        </div>
        ${!query && categoryFilter === "all" ? `
          <div class="empty-actions" style="margin-top: 16px; display: flex; gap: 10px; justify-content: center;">
            <button type="button" class="btn-secrets-action primary" onclick="document.getElementById('openSecretScannerModalBtn').click()">⚡ Scan .txt / .env</button>
            <button type="button" class="btn-secrets-action secondary" onclick="document.getElementById('openAddSecretModalBtn').click()">+ Add Secret Manually</button>
          </div>
        ` : ""}
      </div>
    `;
    return;
  }

  // Render cards
  filtered.forEach((sec) => {
    const card = document.createElement("div");
    card.className = "secret-item-card";
    card.dataset.id = sec.id;

    const categoryBadges = {
      api: { label: "⚡ API Key", class: "badge-api" },
      login: { label: "🔑 Login", class: "badge-login" },
      db: { label: "🗄️ Database", class: "badge-db" },
      token: { label: "🔐 Token", class: "badge-token" },
      other: { label: "📝 Note", class: "badge-other" }
    };
    const badgeInfo = categoryBadges[sec.category] || categoryBadges.api;

    card.innerHTML = `
      <div class="secret-card-header">
        <div class="secret-card-title-wrap">
          <div class="secret-service-icon">${sec.category === "api" ? "⚡" : sec.category === "db" ? "🗄️" : sec.category === "login" ? "🔑" : "🔐"}</div>
          <div>
            <h3 class="secret-service-name">${escapeHtml(sec.service)}</h3>
            <span class="secret-category-badge ${badgeInfo.class}">${badgeInfo.label}</span>
          </div>
        </div>
        <div class="secret-card-actions">
          <button type="button" class="btn-secret-card-action edit-btn" title="Edit Secret">✏️ Edit</button>
          <button type="button" class="btn-secret-card-action delete-btn" title="Delete Secret">🗑️ Delete</button>
        </div>
      </div>

      <div class="secret-card-fields">
        ${sec.username ? `
          <div class="secret-field-row">
            <span class="secret-field-label">Username / Key:</span>
            <div class="secret-field-val-wrap">
              <code class="secret-val-text">${escapeHtml(sec.username)}</code>
              <button type="button" class="btn-copy-field copy-user-btn" title="Copy Username">📋 Copy</button>
            </div>
          </div>
        ` : ""}

        <div class="secret-field-row">
          <span class="secret-field-label">Password / Secret:</span>
          <div class="secret-field-val-wrap">
            <span class="secret-masked-text font-mono" data-revealed="false">••••••••••••••••</span>
            <button type="button" class="btn-toggle-reveal reveal-pass-btn" title="Toggle Reveal">👁️</button>
            <button type="button" class="btn-copy-field copy-pass-btn" title="Copy Password">📋 Copy</button>
          </div>
        </div>

        ${sec.host ? `
          <div class="secret-field-row">
            <span class="secret-field-label">Host / Endpoint:</span>
            <div class="secret-field-val-wrap">
              <span class="secret-host-text font-mono">${escapeHtml(sec.host)}</span>
              <button type="button" class="btn-copy-field copy-host-btn" title="Copy Host">📋 Copy</button>
            </div>
          </div>
        ` : ""}

        ${sec.notes ? `
          <div class="secret-field-notes">
            <span class="secret-notes-text">${escapeHtml(sec.notes)}</span>
          </div>
        ` : ""}
      </div>
    `;

    // Copy Username
    const copyUserBtn = card.querySelector(".copy-user-btn");
    if (copyUserBtn && sec.username) {
      copyUserBtn.addEventListener("click", () => copyTextWithFeedback(sec.username, copyUserBtn));
    }

    // Toggle Mask/Reveal Password
    const revealPassBtn = card.querySelector(".reveal-pass-btn");
    const maskedEl = card.querySelector(".secret-masked-text");
    if (revealPassBtn && maskedEl) {
      revealPassBtn.addEventListener("click", () => {
        const isRevealed = maskedEl.dataset.revealed === "true";
        if (isRevealed) {
          maskedEl.textContent = "••••••••••••••••";
          maskedEl.dataset.revealed = "false";
          revealPassBtn.textContent = "👁️";
        } else {
          maskedEl.textContent = sec.password;
          maskedEl.dataset.revealed = "true";
          revealPassBtn.textContent = "🙈";
        }
      });
    }

    // Copy Password
    const copyPassBtn = card.querySelector(".copy-pass-btn");
    if (copyPassBtn) {
      copyPassBtn.addEventListener("click", () => copyTextWithFeedback(sec.password, copyPassBtn));
    }

    // Copy Host
    const copyHostBtn = card.querySelector(".copy-host-btn");
    if (copyHostBtn && sec.host) {
      copyHostBtn.addEventListener("click", () => copyTextWithFeedback(sec.host, copyHostBtn));
    }

    // Edit Button
    const editBtn = card.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => openSecretEditor(sec));
    }

    // Delete Button
    const deleteBtn = card.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (confirm(`Are you sure you want to permanently delete secret "${sec.service}" from your sovereign vault?`)) {
          await deleteVaultItemFromDb(sec.id);
          state.vaultDecryptedSecrets = state.vaultDecryptedSecrets.filter((x) => x.id !== sec.id);
          renderSecretsList();
        }
      });
    }

    secretsListContainer.appendChild(card);
  });
}

async function copyTextWithFeedback(text, btnElement) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    prompt("Copy secret value:", text);
    return;
  }
  const originalHtml = btnElement.innerHTML;
  btnElement.classList.add("copied-success");
  btnElement.textContent = "✓ Copied!";
  setTimeout(() => {
    btnElement.classList.remove("copied-success");
    btnElement.innerHTML = originalHtml;
  }, 1200);
}

function openSecretEditor(secretToEdit = null) {
  if (!secretEditorModal) return;

  if (secretToEdit) {
    if (secretEditorModalTitle) secretEditorModalTitle.textContent = "Edit Vault Secret";
    if (secretEditorIdInput) secretEditorIdInput.value = secretToEdit.id;
    if (secretServiceInput) secretServiceInput.value = secretToEdit.service || "";
    if (secretCategoryInput) secretCategoryInput.value = secretToEdit.category || "api";
    if (secretUsernameInput) secretUsernameInput.value = secretToEdit.username || "";
    if (secretPasswordInput) {
      secretPasswordInput.value = secretToEdit.password || "";
      secretPasswordInput.type = "password";
    }
    if (toggleSecretEditorPasswordEye) toggleSecretEditorPasswordEye.textContent = "👁️";
    if (secretHostInput) secretHostInput.value = secretToEdit.host || "";
    if (secretNotesInput) secretNotesInput.value = secretToEdit.notes || "";
  } else {
    if (secretEditorModalTitle) secretEditorModalTitle.textContent = "Add New Secret";
    if (secretEditorIdInput) secretEditorIdInput.value = "";
    if (secretServiceInput) secretServiceInput.value = "";
    if (secretCategoryInput) secretCategoryInput.value = "api";
    if (secretUsernameInput) secretUsernameInput.value = "";
    if (secretPasswordInput) {
      secretPasswordInput.value = "";
      secretPasswordInput.type = "password";
    }
    if (toggleSecretEditorPasswordEye) toggleSecretEditorPasswordEye.textContent = "👁️";
    if (secretHostInput) secretHostInput.value = "";
    if (secretNotesInput) secretNotesInput.value = "";
  }

  secretEditorModal.showModal();
  if (secretServiceInput) secretServiceInput.focus();
}

// --- Setup Master Event Listeners ---

function setupSecretsVault() {
  // Activity listeners to reset auto-lock
  window.addEventListener("mousemove", resetVaultInactivityTimer, { passive: true });
  window.addEventListener("keydown", resetVaultInactivityTimer, { passive: true });
  window.addEventListener("click", resetVaultInactivityTimer, { passive: true });

  // Unlock Vault Form
  if ((unlockVaultBtn || vaultUnlockForm) && masterPasswordInput) {
    const handleUnlock = async (e) => {
      if (e) e.preventDefault();
      const pass = masterPasswordInput.value;
      if (!pass) {
        showVaultError("Please enter your Master Passphrase.");
        return;
      }
      await unlockSecretsVault(pass);
    };

    if (unlockVaultBtn) unlockVaultBtn.addEventListener("click", handleUnlock);
    if (vaultUnlockForm) vaultUnlockForm.addEventListener("submit", handleUnlock);
    masterPasswordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleUnlock();
      }
    });
  }

  // Master Password Eye Toggle
  if (masterPassToggleEye && masterPasswordInput) {
    masterPassToggleEye.addEventListener("click", () => {
      if (masterPasswordInput.type === "password") {
        masterPasswordInput.type = "text";
        masterPassToggleEye.textContent = "🙈";
      } else {
        masterPasswordInput.type = "password";
        masterPassToggleEye.textContent = "👁️";
      }
    });
  }

  // Manual Lock Button
  if (lockSecretsVaultBtn) {
    lockSecretsVaultBtn.addEventListener("click", lockSecretsVault);
  }

  // Live Search Input
  if (secretsSearchInput) {
    secretsSearchInput.addEventListener("input", () => {
      state.vaultSearchQuery = secretsSearchInput.value.trim();
      renderSecretsList();
    });
  }

  // Category Filter Tabs
  if (secretsCategoryTabs) {
    secretsCategoryTabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".secrets-cat-tab");
      if (!tab) return;
      secretsCategoryTabs.querySelectorAll(".secrets-cat-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      state.vaultFilterCategory = tab.dataset.category || "all";
      renderSecretsList();
    });
  }

  // Open Add Secret Modal Button
  if (openAddSecretModalBtn) {
    openAddSecretModalBtn.addEventListener("click", () => openSecretEditor());
  }

  // Open Scanner Modal Button
  if (openSecretScannerModalBtn) {
    openSecretScannerModalBtn.addEventListener("click", () => {
      if (!secretScannerModal) return;
      activeScannedCandidates = [];
      if (secretScannerPasteArea) secretScannerPasteArea.value = "";
      if (secretScannerFileInput) secretScannerFileInput.value = "";
      if (secretScannerResultsWrap) secretScannerResultsWrap.classList.add("hidden");
      secretScannerModal.showModal();
    });
  }

  // Close Scanner Modal Button
  if (closeSecretScannerBtn && secretScannerModal) {
    closeSecretScannerBtn.addEventListener("click", () => secretScannerModal.close());
  }

  // Close Editor Modal Button & Cancel
  if (closeSecretEditorBtn && secretEditorModal) {
    closeSecretEditorBtn.addEventListener("click", () => secretEditorModal.close());
  }
  if (cancelSecretEditorBtn && secretEditorModal) {
    cancelSecretEditorBtn.addEventListener("click", () => secretEditorModal.close());
  }

  // Editor: Password Eye Toggle
  if (toggleSecretEditorPasswordEye && secretPasswordInput) {
    toggleSecretEditorPasswordEye.addEventListener("click", () => {
      if (secretPasswordInput.type === "password") {
        secretPasswordInput.type = "text";
        toggleSecretEditorPasswordEye.textContent = "🙈";
      } else {
        secretPasswordInput.type = "password";
        toggleSecretEditorPasswordEye.textContent = "👁️";
      }
    });
  }

  // Editor: Strong Password Generator
  if (generateSecretRandomBtn && secretPasswordInput) {
    generateSecretRandomBtn.addEventListener("click", () => {
      const generated = generateStrongPassword(24);
      secretPasswordInput.value = generated;
      secretPasswordInput.type = "text";
      if (toggleSecretEditorPasswordEye) toggleSecretEditorPasswordEye.textContent = "🙈";
    });
  }

  // Editor: Form Submit / Save
  if (secretEditorForm) {
    secretEditorForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!state.vaultCryptoKey) {
        alert("Vault is locked. Please unlock vault first.");
        return;
      }

      const service = (secretServiceInput.value || "").trim();
      const category = secretCategoryInput.value || "api";
      const username = (secretUsernameInput.value || "").trim();
      const password = (secretPasswordInput.value || "").trim();
      const host = (secretHostInput.value || "").trim();
      const notes = (secretNotesInput.value || "").trim();
      const existingId = (secretEditorIdInput.value || "").trim();

      if (!service || !password) {
        alert("Please provide both a Service Name and Secret/Password.");
        return;
      }

      const nowIso = new Date().toISOString();
      const id = existingId || `sec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const payloadObj = { service, category, username, password, host, notes };
      const { ivHex, ciphertextHex } = await encryptVaultPayload(state.vaultCryptoKey, payloadObj);

      const secretItem = {
        id,
        service,
        username: username || null,
        category,
        ciphertext: ciphertextHex,
        iv: ivHex,
        salt: "",
        notes: notes || null,
        created_at: nowIso,
        updated_at: nowIso
      };

      await persistVaultItemToDb(secretItem);

      // Update in-memory decrypted list
      const decryptedItem = { id, service, category, username, password, host, notes, created_at: nowIso, updated_at: nowIso };
      const existingIdx = state.vaultDecryptedSecrets.findIndex((x) => x.id === id);
      if (existingIdx >= 0) {
        state.vaultDecryptedSecrets[existingIdx] = decryptedItem;
      } else {
        state.vaultDecryptedSecrets.unshift(decryptedItem);
      }

      renderSecretsList();
      secretEditorModal.close();
    });
  }

  // --- Smart Scanner Dropzone & File Input Handlers ---
  if (secretScannerDropzone) {
    // Drag & Drop
    secretScannerDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      secretScannerDropzone.classList.add("drag-over");
    });
    secretScannerDropzone.addEventListener("dragleave", () => {
      secretScannerDropzone.classList.remove("drag-over");
    });
    secretScannerDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      secretScannerDropzone.classList.remove("drag-over");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleScannedFile(e.dataTransfer.files[0]);
      }
    });

    // Browse file trigger
    if (triggerBrowseFileLink && secretScannerFileInput) {
      triggerBrowseFileLink.addEventListener("click", () => secretScannerFileInput.click());
    }
    if (secretScannerFileInput) {
      secretScannerFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleScannedFile(e.target.files[0]);
        }
      });
    }
  }

  function handleScannedFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (secretScannerPasteArea) {
        secretScannerPasteArea.value = content;
      }
      runExtraction(content);
    };
    reader.readAsText(file);
  }

  // Detect button
  if (runSecretScannerBtn) {
    runSecretScannerBtn.addEventListener("click", () => {
      const text = secretScannerPasteArea ? secretScannerPasteArea.value : "";
      if (!text.trim()) {
        alert("Please drop a file or paste text content first.");
        return;
      }
      runExtraction(text);
    });
  }

  function runExtraction(rawText) {
    activeScannedCandidates = scanTextForCredentials(rawText);
    renderScannedCandidatesList();
  }

  function renderScannedCandidatesList() {
    if (!secretScannerResultsWrap || !secretScannerResultsList) return;

    if (activeScannedCandidates.length === 0) {
      secretScannerResultsWrap.classList.remove("hidden");
      secretScannerResultsList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
          No API keys, database strings, or credentials found in this content. Check formatting or add manually.
        </div>
      `;
      if (scannedCountBadge) scannedCountBadge.textContent = "0";
      if (saveScannedSecretsBtn) saveScannedSecretsBtn.disabled = true;
      return;
    }

    if (scannedCountBadge) scannedCountBadge.textContent = activeScannedCandidates.length;
    if (saveScannedSecretsBtn) saveScannedSecretsBtn.disabled = false;
    secretScannerResultsWrap.classList.remove("hidden");
    secretScannerResultsList.innerHTML = "";

    activeScannedCandidates.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "scanned-item-row";
      row.innerHTML = `
        <label class="scanned-checkbox-wrap">
          <input type="checkbox" class="scanned-check" data-idx="${index}" ${item.selected ? "checked" : ""} />
        </label>
        <div class="scanned-item-fields">
          <div class="scanned-field-line">
            <input type="text" class="scanned-service-input form-input-sm" value="${escapeHtml(item.service)}" placeholder="Service Name" data-idx="${index}" />
            <select class="scanned-category-select form-select-sm" data-idx="${index}">
              <option value="api" ${item.category === "api" ? "selected" : ""}>⚡ API Key</option>
              <option value="login" ${item.category === "login" ? "selected" : ""}>🔑 Login</option>
              <option value="db" ${item.category === "db" ? "selected" : ""}>🗄️ Database</option>
              <option value="token" ${item.category === "token" ? "selected" : ""}>🔐 Token</option>
              <option value="other" ${item.category === "other" ? "selected" : ""}>📝 Other</option>
            </select>
          </div>
          <div class="scanned-field-line">
            <input type="text" class="scanned-user-input form-input-sm" value="${escapeHtml(item.username)}" placeholder="Username / Key Name" data-idx="${index}" />
            <input type="text" class="scanned-pass-input form-input-sm font-mono" value="${escapeHtml(item.password)}" placeholder="Secret Value" data-idx="${index}" />
          </div>
        </div>
      `;

      // Event listeners for edits
      const chk = row.querySelector(".scanned-check");
      chk.addEventListener("change", () => {
        item.selected = chk.checked;
      });

      const sIn = row.querySelector(".scanned-service-input");
      sIn.addEventListener("input", () => {
        item.service = sIn.value;
      });

      const cSel = row.querySelector(".scanned-category-select");
      cSel.addEventListener("change", () => {
        item.category = cSel.value;
      });

      const uIn = row.querySelector(".scanned-user-input");
      uIn.addEventListener("input", () => {
        item.username = uIn.value;
      });

      const pIn = row.querySelector(".scanned-pass-input");
      pIn.addEventListener("input", () => {
        item.password = pIn.value;
      });

      secretScannerResultsList.appendChild(row);
    });
  }

  // Toggle Select All Scanned
  if (toggleSelectAllScannedBtn) {
    toggleSelectAllScannedBtn.addEventListener("click", () => {
      const allSelected = activeScannedCandidates.every((x) => x.selected);
      activeScannedCandidates.forEach((x) => (x.selected = !allSelected));
      toggleSelectAllScannedBtn.textContent = allSelected ? "Select All" : "Deselect All";
      renderScannedCandidatesList();
    });
  }

  // Save Scanned Secrets (Batch Encrypt)
  if (saveScannedSecretsBtn) {
    saveScannedSecretsBtn.addEventListener("click", async () => {
      if (!state.vaultCryptoKey) {
        alert("Vault is currently locked. Please unlock the secret vault first.");
        return;
      }

      const toSave = activeScannedCandidates.filter((x) => x.selected && x.password);
      if (toSave.length === 0) {
        alert("No secrets selected for saving.");
        return;
      }

      saveScannedSecretsBtn.disabled = true;
      saveScannedSecretsBtn.textContent = "🔒 Encrypting & Storing...";

      try {
        const nowIso = new Date().toISOString();
        for (const item of toSave) {
          const id = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          const payloadObj = {
            service: item.service || "Extracted Secret",
            category: item.category || "api",
            username: item.username || "",
            password: item.password,
            host: item.host || "",
            notes: item.notes || ""
          };

          const { ivHex, ciphertextHex } = await encryptVaultPayload(state.vaultCryptoKey, payloadObj);

          const dbItem = {
            id,
            service: payloadObj.service,
            username: payloadObj.username || null,
            category: payloadObj.category,
            ciphertext: ciphertextHex,
            iv: ivHex,
            salt: "",
            notes: payloadObj.notes || null,
            created_at: nowIso,
            updated_at: nowIso
          };

          await persistVaultItemToDb(dbItem);

          state.vaultDecryptedSecrets.unshift({
            id,
            ...payloadObj,
            created_at: nowIso,
            updated_at: nowIso
          });
        }

        renderSecretsList();
        secretScannerModal.close();
      } catch (err) {
        alert("Failed to encrypt and store secrets: " + err.message);
      } finally {
        saveScannedSecretsBtn.disabled = false;
        saveScannedSecretsBtn.textContent = "🔒 Encrypt Selected to Secret Vault";
      }
    });
  }

  // Initial Check
  checkVaultInitialization();
}

async function setupHardwareLicensing() {
  if (!licenseActivationModal) return;

  // Prevent escape dismissal if not activated
  licenseActivationModal.addEventListener("cancel", (e) => {
    if (!state.isLicenseActive) {
      e.preventDefault();
    }
  });

  // Close modal button (only works when license is active, e.g. opened from Settings)
  if (closeLicenseModalBtn) {
    closeLicenseModalBtn.addEventListener("click", () => {
      if (licenseActivationModal && state.isLicenseActive) {
        licenseActivationModal.close();
      }
    });
  }

  // Copy Device ID button
  if (copyDeviceFingerprintBtn) {
    copyDeviceFingerprintBtn.addEventListener("click", async () => {
      const idToCopy = state.currentDeviceId || (await getDeviceId());
      try {
        await navigator.clipboard.writeText(idToCopy);
        if (copyHwidBtnText) {
          copyHwidBtnText.textContent = "✓ Copied!";
          setTimeout(() => {
            copyHwidBtnText.textContent = "📋 Copy ID";
          }, 2000);
        }
      } catch (err) {
        prompt("Copy your Device ID:", idToCopy);
      }
    });
  }

  // 1-Click Auto-Generate & Activate Seat Button
  if (autoGenerateLicenseBtn) {
    autoGenerateLicenseBtn.addEventListener("click", async () => {
      if (licenseErrorMsg) licenseErrorMsg.classList.add("hidden");
      autoGenerateLicenseBtn.disabled = true;
      const originalText = autoGenerateLicenseBtn.innerHTML;
      autoGenerateLicenseBtn.textContent = "⚡ Computing Hardware Key...";

      try {
        let key = null;
        if (window.__TAURI__ && window.__TAURI__.invoke) {
          try {
            key = await window.__TAURI__.invoke("generate_self_license");
          } catch (e) {
            console.warn("Tauri generate_self_license fallback:", e);
          }
        }
        if (!key) {
          const deviceId = state.currentDeviceId || (await getDeviceId());
          key = await computeWebLicenseKey(deviceId);
        }

        if (licenseKeyInput) {
          licenseKeyInput.value = key;
        }

        autoGenerateLicenseBtn.textContent = "Verifying Signature...";
        await new Promise((r) => setTimeout(r, 280));

        const result = await submitLicenseActivation(key);
        updateLicenseUI(result);
        autoGenerateLicenseBtn.textContent = "✓ Seat Activated!";

        setTimeout(() => {
          autoGenerateLicenseBtn.disabled = false;
          autoGenerateLicenseBtn.innerHTML = originalText;
          if (licenseActivationModal && licenseActivationModal.open) {
            licenseActivationModal.close();
          }
        }, 750);
      } catch (err) {
        autoGenerateLicenseBtn.disabled = false;
        autoGenerateLicenseBtn.innerHTML = originalText;
        showLicenseError(err.message || "Failed to auto-activate seat.");
      }
    });
  }

  // Manual Activate Button
  if (activateLicenseBtn && licenseKeyInput) {
    const runActivation = async () => {
      const key = licenseKeyInput.value.trim();
      if (!key) {
        showLicenseError("Please enter your alpha license key.");
        return;
      }

      if (licenseErrorMsg) licenseErrorMsg.classList.add("hidden");
      activateLicenseBtn.disabled = true;
      activateLicenseBtn.textContent = "Verifying Signature...";

      try {
        const result = await submitLicenseActivation(key);
        updateLicenseUI(result);
        activateLicenseBtn.textContent = "✓ Activated!";
        setTimeout(() => {
          activateLicenseBtn.disabled = false;
          activateLicenseBtn.textContent = "Verify & Activate Key";
          if (licenseActivationModal.open) licenseActivationModal.close();
        }, 800);
      } catch (err) {
        activateLicenseBtn.disabled = false;
        activateLicenseBtn.textContent = "Verify & Activate Key";
        showLicenseError(err.message || "Invalid license key.");
      }
    };

    activateLicenseBtn.addEventListener("click", runActivation);
    licenseKeyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runActivation();
      }
    });
  }

  // Settings Reopen Details Button
  if (reopenActivationBtn) {
    reopenActivationBtn.addEventListener("click", () => {
      if (licenseActivationModal) {
        if (licenseKeyInput && state.currentLicenseKey) {
          licenseKeyInput.value = state.currentLicenseKey;
        }
        licenseActivationModal.showModal();
      }
    });
  }

  // Initial check
  const initialStatus = await checkLicenseStatus();
  updateLicenseUI(initialStatus);
}

function showLicenseError(msg) {
  if (licenseErrorMsg) {
    licenseErrorMsg.textContent = msg;
    licenseErrorMsg.classList.remove("hidden");
  }
}

// Boot application
initApp();
