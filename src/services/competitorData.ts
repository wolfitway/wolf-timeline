import type { CompetitorProfile, RoadmapPhase } from "@/types";

export const COMPETITORS: CompetitorProfile[] = [
  {
    id: "linear",
    name: "Linear Roadmaps",
    category: "Cloud Issue Tracker & Roadmaps",
    categoryGroup: "roadmaps",
    pricing: "$12 - $16 / seat / mo ($192/yr)",
    annualPerSeatUsd: 192,
    tagline: "Sleek cloud issue tracker with Now/Next/Later horizons",
    airGapped: false,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: true,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["Fast keyboard navigation", "Opinionated dark UI", "Now/Next/Later horizons"],
    fatalFlaws: [
      "100% cloud lock-in (violates defense, banking, SCIF security rules)",
      "Cannot generate self-contained client deliverables",
      "No encrypted credentials/secrets vault (tokens leak in tickets)",
      "Expensive per-seat recurring billing model",
    ],
    wolfAdvantage:
      "Wolf Timeline runs 100% offline with zero cloud exfiltration. It exports cryptographic SHA-256 client dossiers and includes a built-in AES-256-GCM zero-knowledge Secret Vault.",
  },
  {
    id: "productplan",
    name: "ProductPlan / Roadmunk",
    category: "Enterprise Strategic Roadmaps",
    categoryGroup: "roadmaps",
    pricing: "$49 - $99 / seat / mo ($1,188/yr)",
    annualPerSeatUsd: 1188,
    tagline: "High-ticket enterprise roadmap presentation software",
    airGapped: false,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: true,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["High-level stakeholder views", "Quarterly swimlanes", "Flexible roadmap legends"],
    fatalFlaws: [
      "Extortionate enterprise pricing ($1,188+/user/year)",
      "Zero offline functionality — fails during air travel or secure air-gapped zones",
      "No note-taking or deep document studio integration",
      "Sluggish web interface with cloud vendor lock-in",
    ],
    wolfAdvantage:
      "Wolf Timeline provides the same executive Now/Next/Later horizons and Gantt swimlanes with zero subscription fees, instant local speed, and native Markdown Studio integration.",
  },
  {
    id: "aha",
    name: "Aha! Roadmaps",
    category: "Enterprise Product Strategy & Portfolio",
    categoryGroup: "roadmaps",
    pricing: "$59 - $149 / seat / mo ($1,788/yr)",
    annualPerSeatUsd: 1788,
    tagline: "Heavy enterprise roadmap suite with complex feature scoring",
    airGapped: false,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: true,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["Deep corporate strategy mapping", "Product scoring frameworks", "Release schedules"],
    fatalFlaws: [
      "Massive enterprise price point ($1,788/seat/year minimum on pro tiers)",
      "Complex bloated UI requiring weeks of staff onboarding",
      "Strict SaaS cloud dependence with no local-first air-gap capability",
      "No client-sealed cryptographic dossiers or secrets isolation",
    ],
    wolfAdvantage:
      "Wolf Timeline delivers executive-level clarity in seconds without training, runs air-gapped with zero subscriptions, and secures credentials locally in an encrypted vault.",
  },
  {
    id: "notion",
    name: "Notion (Projects & Timelines)",
    category: "Collaborative Cloud Workspace",
    categoryGroup: "roadmaps",
    pricing: "$10 - $20 / seat / mo + $10 AI ($360/yr)",
    annualPerSeatUsd: 360,
    tagline: "General-purpose block workspace with database timelines",
    airGapped: false,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: true,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["Flexible relational databases", "Ubiquitous team familiarity", "Versatile block editing"],
    fatalFlaws: [
      "Slow, laggy document loading with large databases",
      "Unreliable offline caching — blocks editing when disconnected",
      "Zero-knowledge encryption is nonexistent; team tokens leak in shared pages",
      "Cannot export standalone single-file verifiable HTML client dossiers",
    ],
    wolfAdvantage:
      "Wolf Timeline is built local-first for sub-millisecond responsiveness, never stalls offline, isolates API keys in a client-encrypted vault, and signs exports with SHA-256.",
  },
  {
    id: "markwhen",
    name: "Markwhen",
    category: "Text-to-Timeline & Markdown Gantt",
    categoryGroup: "pkm",
    pricing: "Free / $60/yr commercial license",
    annualPerSeatUsd: 60,
    tagline: "Plaintext text-to-timeline converter with custom .mw syntax",
    airGapped: true,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: true,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["Text-based timeline authoring", "Clean SVG timeline visualization", "VS Code & Obsidian integration"],
    fatalFlaws: [
      "Proprietary non-standard `.mw` syntax incompatible with standard markdown",
      "No interactive deliverables checklists or calculated phase velocity",
      "No zero-knowledge encrypted vault for sensitive project secrets",
      "Lacks executive Now/Next/Later horizon matrix swimlanes",
    ],
    wolfAdvantage:
      "Wolf Timeline pairs standard GitHub-flavored Markdown notes with interactive checklists, automatic milestone completion velocity, and cryptographic SHA-256 client dossiers.",
  },
  {
    id: "obsidian",
    name: "Obsidian (Canvas & Plugins)",
    category: "Local Markdown PKM",
    categoryGroup: "pkm",
    pricing: "Free / $4-8/mo sync ($96/yr)",
    annualPerSeatUsd: 96,
    tagline: "Extensible offline markdown vault powered by community plugins",
    airGapped: true,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: false,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["Local Markdown files", "Vast community ecosystem", "Graph connection view"],
    fatalFlaws: [
      "Fragmented community plugin maintenance (breaks on core updates)",
      "Canvas lacks native milestone progress & horizon swimlanes without hacky scripts",
      "No encrypted credentials vault (API keys leak in plaintext markdown)",
      "No one-click client-ready dossier compiler with SHA-256 seals",
    ],
    wolfAdvantage:
      "Wolf Timeline includes native, unified milestone roadmapping, client dossier export, and zero-knowledge secret encryption without needing 10 fragile third-party plugins.",
  },
  {
    id: "aeon",
    name: "Aeon Timeline",
    category: "Chronological Fiction & Project Timelines",
    categoryGroup: "timelines",
    pricing: "$65 one-time desktop purchase",
    annualPerSeatUsd: 65,
    tagline: "Desktop narrative and complex event chronology tool",
    airGapped: true,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: true,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["Deep chronological dependencies", "Custom calendar eras", "Local desktop file"],
    fatalFlaws: [
      "Dated 2010s desktop UI with high cognitive load",
      "Proprietary file format not friendly to git or markdown",
      "Zero knowledge notes studio or AI consensus engine",
      "No modern web/mobile responsive interface",
    ],
    wolfAdvantage:
      "Wolf Timeline delivers modern Obsidian Amber glassmorphism, responsive mobile/web layout, AI consensus dialectics, and instant Markdown note synchronization.",
  },
  {
    id: "clickup",
    name: "ClickUp / monday.com",
    category: "All-in-One Project Management & Gantt",
    categoryGroup: "timelines",
    pricing: "$10 - $28 / seat / mo ($240/yr)",
    annualPerSeatUsd: 240,
    tagline: "Feature-heavy cloud project suites with visual timelines",
    airGapped: false,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: true,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["Extensive automation rules", "Multiple view types (Gantt, Board, List)", "Task hierarchy"],
    fatalFlaws: [
      "Notorious UI lag, visual bloat, and notification spam",
      "High ongoing recurring cost that scales aggressively with team growth",
      "Zero air-gapped capability; strict dependency on internet connectivity",
      "No cryptographic dossier verification or zero-knowledge vault",
    ],
    wolfAdvantage:
      "Wolf Timeline stays hyper-focused and bloat-free with zero telemetry, sub-millisecond local-first execution, and sovereign one-time or open access.",
  },
  {
    id: "heptabase",
    name: "Heptabase",
    category: "Visual Spatial Whiteboard PKM",
    categoryGroup: "pkm",
    pricing: "$10 - $12 / mo ($144/yr)",
    annualPerSeatUsd: 144,
    tagline: "Visual infinite canvas for learning and research notes",
    airGapped: false,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: false,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["Fluid infinite whiteboards", "Visual card thinking", "Journal date integration"],
    fatalFlaws: [
      "Cloud proprietary sync database",
      "No auto-calculating milestone velocity or Gantt tracking",
      "No client dossier export engine",
      "No zero-knowledge encrypted vault",
    ],
    wolfAdvantage:
      "Wolf Timeline combines visual card horizons with structured milestone velocity calculations, air-gapped sovereign privacy, and zero recurring cloud fees.",
  },
  {
    id: "anytype",
    name: "Anytype",
    category: "P2P Local-First Workspace",
    categoryGroup: "pkm",
    pricing: "Free / $99/yr memberships",
    annualPerSeatUsd: 99,
    tagline: "Decentralized P2P object workspace with local-first privacy",
    airGapped: true,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: false,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["Local-first P2P encryption", "Modern aesthetic", "Block object database"],
    fatalFlaws: [
      "Complex relational database mental model with steep learning curve",
      "Timeline is just a basic tabular date sort without executive visual swimlanes",
      "No specialized executive presentation/dossier compiler",
      "No dedicated credentials/secret vault with auto-redaction",
    ],
    wolfAdvantage:
      "Wolf Timeline provides purpose-built executive timeline views, one-click standalone client dossiers, and automated credential leakage scanning that Anytype lacks.",
  },
  {
    id: "officetimeline",
    name: "Office Timeline / Preceden",
    category: "Slide Presentation Timeline Tools",
    categoryGroup: "timelines",
    pricing: "$59 - $149 / year",
    annualPerSeatUsd: 99,
    tagline: "PowerPoint add-in for executive milestone slide graphics",
    airGapped: true,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: true,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["PowerPoint slide integration", "Visual milestone diamonds", "Executive swimlanes"],
    fatalFlaws: [
      "Legacy Windows add-in model or basic web app",
      "Zero note-taking, markdown, or PKM capability",
      "Static charts disconnected from day-to-day execution",
      "No AI deliberation or cryptographic verification",
    ],
    wolfAdvantage:
      "Wolf Timeline bridges high-stakes executive presentation with active daily execution, living markdown documentation, and verifiable cryptographic seals.",
  },
];

export interface TcoSavingsResult {
  competitorId: string;
  competitorName: string;
  seats: number;
  years: number;
  competitorTotalUsd: number;
  wolfTimelineUsd: number;
  savingsUsd: number;
  savingsPercentage: number;
}

export function calculateTcoSavings(
  comp: CompetitorProfile,
  seats: number = 5,
  years: number = 3
): TcoSavingsResult {
  const annualCost = comp.annualPerSeatUsd ?? 192;
  const competitorTotalUsd = annualCost * seats * years;
  const wolfTimelineUsd = 190; // Sovereign Commercial Pass flat lifetime
  const savingsUsd = Math.max(0, competitorTotalUsd - wolfTimelineUsd);
  const savingsPercentage =
    competitorTotalUsd > 0 ? Math.round((savingsUsd / competitorTotalUsd) * 100) : 0;

  return {
    competitorId: comp.id,
    competitorName: comp.name,
    seats,
    years,
    competitorTotalUsd,
    wolfTimelineUsd,
    savingsUsd,
    savingsPercentage,
  };
}

export function generateExecutiveBriefMarkdown(
  comp: CompetitorProfile,
  seats: number = 5,
  years: number = 3
): string {
  const savings = calculateTcoSavings(comp, seats, years);

  return `# Executive Intelligence Brief: Wolf Timeline vs ${comp.name}
**Category:** ${comp.category}
**Competitor Pricing:** ${comp.pricing}
**Wolf Timeline Model:** 100% Offline Sovereign Trojan Horse ($0 Free / $190 Lifetime)

## Financial Impact (${seats} Seats over ${years} Years)
- **${comp.name} Total Cost:** $${savings.competitorTotalUsd.toLocaleString()}
- **Wolf Timeline Lifetime:** $${savings.wolfTimelineUsd.toLocaleString()} flat
- **Capital Saved:** $${savings.savingsUsd.toLocaleString()} (${savings.savingsPercentage}% savings)

## Why Wolf Timeline Wins
${comp.wolfAdvantage}

## Key Vulnerabilities in ${comp.name}
${comp.fatalFlaws.map((f) => `- ${f}`).join("\n")}

## Sovereign Capability Comparison
- **100% Air-Gapped (Zero Cloud Exfiltration):** Wolf Timeline [YES] | ${comp.name} [${comp.airGapped ? "YES" : "NO"}]
- **Zero-Knowledge AES-256 Vault:** Wolf Timeline [YES] | ${comp.name} [${comp.zeroKnowledgeVault ? "YES" : "NO"}]
- **Client Dossier with SHA-256 Seal:** Wolf Timeline [YES] | ${comp.name} [${comp.clientDossierSealed ? "YES" : "NO"}]
- **Horizon (Now/Next/Later) + Gantt:** Wolf Timeline [YES] | ${comp.name} [${comp.horizonsAndGantt ? "YES" : "NO"}]
- **Time Machine Snapshots:** Wolf Timeline [YES] | ${comp.name} [${comp.timeMachineSnapshots ? "YES" : "NO"}]

*Generated by Wolf Timeline Sovereign Intelligence Engine*
`;
}

export function generateMarkwhenExport(phases: RoadmapPhase[]): string {
  const lines: string[] = [
    "title: Strategic Roadmap (Wolf Timeline)",
    "// Renderable in Markwhen (.mw) or standard Markdown editors",
    "",
  ];

  phases.forEach((phase, idx) => {
    const horizon = phase.horizon || "now";
    const statusTag = `#${phase.status.toLowerCase().replace(/\s+/g, "_")}`;
    const horizonTag = `#${horizon}`;
    const quarter = phase.targetQuarter || `Q${((idx % 4) + 1)} 2026`;

    lines.push(`section ${phase.title}`);
    lines.push(`${quarter}: ${phase.subtitle || phase.title} ${statusTag} ${horizonTag}`);

    if (phase.description) {
      lines.push(`  ${phase.description.replace(/\n/g, " ")}`);
    }

    if (phase.practices && phase.practices.length > 0) {
      lines.push("  practices:");
      phase.practices.forEach((p) => {
        lines.push(`    - [${p.completed ? "x" : " "}] ${p.text}`);
      });
    }

    lines.push("");
  });

  return lines.join("\n");
}
