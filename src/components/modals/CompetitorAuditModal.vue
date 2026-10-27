<script setup lang="ts">
import { ref } from "vue";
import WolfIcon from "@/components/common/WolfIcon.vue";
import { useUiStore } from "@/stores/useUiStore";
import type { CompetitorProfile } from "@/types";

const uiStore = useUiStore();

const competitors: CompetitorProfile[] = [
  {
    id: "linear",
    name: "Linear Roadmaps",
    category: "Cloud Issue Tracker & Roadmaps",
    pricing: "$12 - $16 / seat / mo ($192/yr)",
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
      "No encrypted credentials/secrets vault (tokens leak)",
      "Expensive per-seat billing model",
    ],
    wolfAdvantage:
      "Wolf Timeline runs 100% offline with zero cloud exfiltration. It exports cryptographic SHA-256 client dossiers and includes a built-in AES-256-GCM zero-knowledge Secret Vault.",
  },
  {
    id: "productplan",
    name: "ProductPlan / Roadmunk",
    category: "Enterprise Strategic Roadmaps",
    pricing: "$49 - $99 / seat / mo ($1,188/yr)",
    airGapped: false,
    zeroKnowledgeVault: false,
    clientDossierSealed: false,
    horizonsAndGantt: true,
    multiModelAi: false,
    timeMachineSnapshots: false,
    primaryPros: ["High-level stakeholder views", "Quarterly swimlanes", "Flexible roadmap legends"],
    fatalFlaws: [
      "Extortionate enterprise pricing ($1k+/user/year)",
      "Zero offline functionality — fails during travel or secure facilities",
      "No note-taking or deep document studio integration",
      "Sluggish web interface with cloud vendor lock-in",
    ],
    wolfAdvantage:
      "Wolf Timeline provides the same executive Now/Next/Later horizons and Gantt swimlanes with zero subscription fees, instant local speed, and native Markdown Studio integration.",
  },
  {
    id: "obsidian",
    name: "Obsidian (Canvas & Plugins)",
    category: "Local Markdown PKM",
    pricing: "Free / $4-8/mo sync ($96/yr)",
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
    pricing: "$65 one-time desktop purchase",
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
    id: "heptabase",
    name: "Heptabase",
    category: "Visual Spatial Whiteboard PKM",
    pricing: "$10 - $12 / mo ($144/yr)",
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
    pricing: "Free / $99/yr memberships",
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
    pricing: "$59 - $149 / year",
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

const selectedCompetitorId = ref<string>("linear");
const activeCompetitor = ref<CompetitorProfile>(competitors[0]);
const auditCopied = ref(false);

function selectCompetitor(comp: CompetitorProfile) {
  selectedCompetitorId.value = comp.id;
  activeCompetitor.value = comp;
}

function copyExecutiveBrief() {
  const comp = activeCompetitor.value;
  const brief = `# Executive Intelligence Brief: Wolf Timeline vs ${comp.name}
**Category:** ${comp.category}
**Competitor Pricing:** ${comp.pricing}
**Wolf Timeline Model:** 100% Offline Sovereign Trojan Horse ($0 Free / $190 Lifetime)

## Why Wolf Timeline Wins
${comp.wolfAdvantage}

## Key Flaws in ${comp.name}
${comp.fatalFlaws.map((f) => `- ${f}`).join("\n")}

## Sovereign Capability Comparison
- **100% Air-Gapped (Zero Cloud Exfiltration):** Wolf Timeline [YES] | ${comp.name} [${comp.airGapped ? "YES" : "NO"}]
- **Zero-Knowledge AES-256 Vault:** Wolf Timeline [YES] | ${comp.name} [${comp.zeroKnowledgeVault ? "YES" : "NO"}]
- **Client Dossier with SHA-256 Seal:** Wolf Timeline [YES] | ${comp.name} [${comp.clientDossierSealed ? "YES" : "NO"}]
- **Horizon (Now/Next/Later) + Gantt:** Wolf Timeline [YES] | ${comp.name} [${comp.horizonsAndGantt ? "YES" : "NO"}]
- **Time Machine Snapshots:** Wolf Timeline [YES] | ${comp.name} [${comp.timeMachineSnapshots ? "YES" : "NO"}]

*Generated by Wolf Timeline Sovereign Intelligence Engine*
`;
  navigator.clipboard.writeText(brief).then(() => {
    auditCopied.value = true;
    uiStore.showToast("Copied Executive Brief to clipboard ✓");
    setTimeout(() => {
      auditCopied.value = false;
    }, 3000);
  });
}
</script>

<template>
  <div class="competitor-modal-backdrop" @click.self="uiStore.closeCompetitorAuditModal">
    <div class="competitor-modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-badge-row">
          <span class="sovereign-tag">
            <WolfIcon name="shield-check" :size="12" />
            <span>SOVEREIGN ADVANTAGE AUDIT</span>
          </span>
          <span class="benchmark-pill">7 Direct Competitors Analyzed</span>
        </div>
        <div class="header-main-row">
          <div>
            <h2 id="modal-title" class="modal-title">Wolf Timeline vs. The Market</h2>
            <p class="modal-subtitle">
              Why enterprise consultants and technical leaders choose Wolf Timeline over cloud SaaS and fragmented desktop tools.
            </p>
          </div>
          <button
            type="button"
            class="btn-close-modal"
            @click="uiStore.closeCompetitorAuditModal"
            title="Close modal (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Competitor Selection Tabs -->
      <div class="competitor-tabs-strip">
        <button
          v-for="comp in competitors"
          :key="comp.id"
          type="button"
          class="comp-tab-btn"
          :class="{ active: selectedCompetitorId === comp.id }"
          @click="selectCompetitor(comp)"
        >
          <span class="tab-name">{{ comp.name }}</span>
        </button>
      </div>

      <!-- Main Audit Body (Split Grid) -->
      <div class="modal-body-grid">
        <!-- Left: Head to Head Battle Card -->
        <div class="battle-card">
          <div class="battle-header">
            <div class="comp-title-wrap">
              <span class="versus-label">1-ON-1 BENCHMARK</span>
              <h3 class="comp-heading">Wolf Timeline vs {{ activeCompetitor.name }}</h3>
              <span class="comp-category-tag">{{ activeCompetitor.category }}</span>
            </div>
            <div class="comp-price-badge">
              <span class="price-label">Their Cost</span>
              <span class="price-val">{{ activeCompetitor.pricing }}</span>
            </div>
          </div>

          <!-- The Wolf Advantage -->
          <div class="wolf-advantage-box">
            <div class="box-tag">
              <WolfIcon name="sparkles" :size="14" />
              <span>THE WOLF ADVANTAGE</span>
            </div>
            <p class="advantage-text">{{ activeCompetitor.wolfAdvantage }}</p>
          </div>

          <!-- Fatal Flaws in Competitor -->
          <div class="flaws-section">
            <h4 class="section-title">
              <span class="cross-icon">✕</span>
              <span>Fatal Vulnerabilities in {{ activeCompetitor.name }}</span>
            </h4>
            <ul class="flaws-list">
              <li v-for="(flaw, idx) in activeCompetitor.fatalFlaws" :key="idx" class="flaw-item">
                <span class="flaw-bullet">•</span>
                <span>{{ flaw }}</span>
              </li>
            </ul>
          </div>

          <!-- Strengths they possess that Wolf now equals or beats -->
          <div class="strengths-section">
            <h4 class="section-title">
              <span class="check-icon">✓</span>
              <span>Strengths Wolf Timeline Matched & Elevated</span>
            </h4>
            <div class="tags-row">
              <span v-for="(pro, idx) in activeCompetitor.primaryPros" :key="idx" class="pro-pill">
                {{ pro }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Sovereign Feature Matrix -->
        <div class="matrix-card">
          <div class="matrix-header">
            <WolfIcon name="lock" :size="14" />
            <span>Sovereign Security & Architecture Matrix</span>
          </div>

          <div class="matrix-table-wrap">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th class="col-wolf">Wolf Timeline</th>
                  <th class="col-comp">{{ activeCompetitor.name }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="feat-name">100% Air-Gapped Offline</div>
                    <div class="feat-desc">Zero cloud exfiltration, runs in SCIF</div>
                  </td>
                  <td class="col-wolf"><span class="badge-yes">✓ YES (Zero Net)</span></td>
                  <td class="col-comp">
                    <span :class="activeCompetitor.airGapped ? 'badge-yes' : 'badge-no'">
                      {{ activeCompetitor.airGapped ? "✓ YES" : "✕ NO (Cloud)" }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="feat-name">AES-256-GCM Secret Vault</div>
                    <div class="feat-desc">Zero-knowledge client encrypted vault</div>
                  </td>
                  <td class="col-wolf"><span class="badge-yes">✓ YES (Zero-Knowledge)</span></td>
                  <td class="col-comp">
                    <span :class="activeCompetitor.zeroKnowledgeVault ? 'badge-yes' : 'badge-no'">
                      {{ activeCompetitor.zeroKnowledgeVault ? "✓ YES" : "✕ NO (Plaintext)" }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="feat-name">Client Dossier Compiler</div>
                    <div class="feat-desc">Standalone HTML + SHA-256 seal</div>
                  </td>
                  <td class="col-wolf"><span class="badge-yes">✓ YES (SHA-256 Seal)</span></td>
                  <td class="col-comp">
                    <span :class="activeCompetitor.clientDossierSealed ? 'badge-yes' : 'badge-no'">
                      {{ activeCompetitor.clientDossierSealed ? "✓ YES" : "✕ NO" }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="feat-name">Now/Next/Later + Gantt</div>
                    <div class="feat-desc">Unified multi-view roadmapping</div>
                  </td>
                  <td class="col-wolf"><span class="badge-yes">✓ YES (Multi-View)</span></td>
                  <td class="col-comp">
                    <span :class="activeCompetitor.horizonsAndGantt ? 'badge-yes' : 'badge-no'">
                      {{ activeCompetitor.horizonsAndGantt ? "✓ Partial" : "✕ Missing" }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="feat-name">Time Machine Snapshots</div>
                    <div class="feat-desc">Point-in-time rollback checkpoints</div>
                  </td>
                  <td class="col-wolf"><span class="badge-yes">✓ YES (Local Snapshots)</span></td>
                  <td class="col-comp">
                    <span :class="activeCompetitor.timeMachineSnapshots ? 'badge-yes' : 'badge-no'">
                      {{ activeCompetitor.timeMachineSnapshots ? "✓ YES" : "✕ NO" }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="feat-name">Annual Cost (Single Seat)</div>
                    <div class="feat-desc">Total cost of ownership</div>
                  </td>
                  <td class="col-wolf"><span class="badge-price-wolf">$0 - $190 Lifetime</span></td>
                  <td class="col-comp"><span class="badge-price-comp">{{ activeCompetitor.pricing }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="matrix-actions">
            <button type="button" class="btn-copy-brief" @click="copyExecutiveBrief">
              <WolfIcon name="copy" :size="13" />
              <span>{{ auditCopied ? 'Copied Brief to Clipboard!' : 'Copy CISO Justification Brief' }}</span>
            </button>
            <button
              type="button"
              class="btn-activate-pass"
              @click="uiStore.showLicenseModal = true; uiStore.closeCompetitorAuditModal()"
            >
              <span>Unlock Sovereign Commercial Pass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.competitor-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(4, 6, 8, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.competitor-modal-card {
  width: 100%;
  max-width: 1100px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #090805;
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-radius: 18px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(245, 158, 11, 0.12);
  overflow: hidden;
  color: #f3f4f6;
  font-family: inherit;
}

.modal-header {
  padding: 24px 28px 18px 28px;
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(9, 8, 5, 0) 100%);
  border-bottom: 1px solid rgba(245, 158, 11, 0.15);
}

.header-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.sovereign-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.14);
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.benchmark-pill {
  font-size: 11px;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: 6px;
}

.header-main-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.modal-title {
  margin: 0 0 4px 0;
  font-size: 22px;
  font-weight: 800;
  color: #fef3c7;
  letter-spacing: -0.02em;
}

.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.4;
}

.btn-close-modal {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #9ca3af;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-close-modal:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.competitor-tabs-strip {
  display: flex;
  gap: 6px;
  padding: 12px 28px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;
  scrollbar-width: none;
}

.competitor-tabs-strip::-webkit-scrollbar {
  display: none;
}

.comp-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
}

.comp-tab-btn:hover {
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.06);
}

.comp-tab-btn.active {
  color: #000;
  background: #fbbf24;
  border-color: #fbbf24;
  font-weight: 700;
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);
}

.modal-body-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 20px;
  padding: 24px 28px;
  overflow-y: auto;
  max-height: calc(92vh - 170px);
}

/* Left Card: Battle Card */
.battle-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(18, 15, 10, 0.65);
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: 14px;
  padding: 20px;
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.versus-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #f59e0b;
}

.comp-heading {
  margin: 3px 0 4px 0;
  font-size: 18px;
  font-weight: 800;
  color: #f9fafb;
}

.comp-category-tag {
  font-size: 11px;
  color: #9ca3af;
}

.comp-price-badge {
  text-align: right;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 6px 10px;
  border-radius: 8px;
}

.price-label {
  display: block;
  font-size: 9px;
  text-transform: uppercase;
  color: #fca5a5;
  font-weight: 700;
}

.price-val {
  font-size: 12px;
  font-weight: 700;
  color: #fee2e2;
}

.wolf-advantage-box {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(16, 185, 129, 0.08) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  padding: 14px;
}

.box-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #fbbf24;
  margin-bottom: 6px;
}

.advantage-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #fef3c7;
}

.flaws-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #d1d5db;
}

.cross-icon {
  color: #ef4444;
  font-weight: 900;
}

.check-icon {
  color: #10b981;
  font-weight: 900;
}

.flaws-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flaw-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #fca5a5;
  line-height: 1.4;
  background: rgba(239, 68, 68, 0.06);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.flaw-bullet {
  color: #ef4444;
}

.strengths-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pro-pill {
  font-size: 11px;
  padding: 4px 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
  border-radius: 6px;
}

/* Right Card: Matrix Table */
.matrix-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(14, 12, 8, 0.85);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 14px;
  padding: 20px;
}

.matrix-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
}

.matrix-table-wrap {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.matrix-table th {
  text-align: left;
  padding: 8px 10px;
  color: #9ca3af;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.matrix-table td {
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.feat-name {
  font-weight: 600;
  color: #f3f4f6;
}

.feat-desc {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 2px;
}

.col-wolf {
  color: #34d399;
  font-weight: 700;
}

.badge-yes {
  display: inline-block;
  padding: 3px 7px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 5px;
  color: #34d399;
  font-size: 11px;
}

.badge-no {
  display: inline-block;
  padding: 3px 7px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 5px;
  color: #f87171;
  font-size: 11px;
}

.badge-price-wolf {
  display: inline-block;
  padding: 3px 7px;
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 5px;
  color: #fbbf24;
  font-weight: 700;
  font-size: 11px;
}

.badge-price-comp {
  font-size: 11px;
  color: #e5e7eb;
}

.matrix-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 12px;
}

.btn-copy-brief {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #fbbf24;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-copy-brief:hover {
  background: rgba(245, 158, 11, 0.22);
  border-color: #fbbf24;
  transform: translateY(-1px);
}

.btn-activate-pass {
  flex: 1;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-activate-pass:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

@media (max-width: 860px) {
  .modal-body-grid {
    grid-template-columns: 1fr;
  }
}
</style>
