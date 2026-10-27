<script setup lang="ts">
import { ref, computed } from "vue";
import WolfIcon from "@/components/common/WolfIcon.vue";
import { useUiStore } from "@/stores/useUiStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import type { CompetitorProfile } from "@/types";
import {
  COMPETITORS,
  calculateTcoSavings,
  generateExecutiveBriefMarkdown,
  generateMarkwhenExport,
} from "@/services/competitorData";

const uiStore = useUiStore();
const roadmapStore = useRoadmapStore();

const competitors = COMPETITORS;
const selectedCategory = ref<"all" | "roadmaps" | "pkm" | "timelines">("all");
const searchQuery = ref("");
const activeViewTab = ref<"battle" | "matrix" | "calculator">("battle");

const selectedCompetitorId = ref<string>("linear");
const auditCopied = ref(false);
const markwhenCopied = ref(false);

// ROI Calculator Parameters
const seatsCount = ref(5);
const yearsCount = ref(3);

const filteredCompetitors = computed(() => {
  return competitors.filter((c) => {
    const matchesCategory =
      selectedCategory.value === "all" || c.categoryGroup === selectedCategory.value;
    const q = searchQuery.value.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.pricing.toLowerCase().includes(q) ||
      (c.tagline && c.tagline.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });
});

const activeCompetitor = computed<CompetitorProfile>(() => {
  const found = competitors.find((c) => c.id === selectedCompetitorId.value);
  return found || filteredCompetitors.value[0] || competitors[0];
});

function selectCompetitor(comp: CompetitorProfile) {
  selectedCompetitorId.value = comp.id;
}

const activeSavings = computed(() => {
  return calculateTcoSavings(activeCompetitor.value, seatsCount.value, yearsCount.value);
});

function copyExecutiveBrief() {
  const brief = generateExecutiveBriefMarkdown(
    activeCompetitor.value,
    seatsCount.value,
    yearsCount.value
  );
  navigator.clipboard.writeText(brief).then(() => {
    auditCopied.value = true;
    uiStore.showToast("Copied Executive Brief to clipboard ✓");
    setTimeout(() => {
      auditCopied.value = false;
    }, 3000);
  });
}

function copyMarkwhenRoadmap() {
  const mw = generateMarkwhenExport(roadmapStore.phases);
  navigator.clipboard.writeText(mw).then(() => {
    markwhenCopied.value = true;
    uiStore.showToast("Copied Markwhen (.mw) timeline to clipboard ✓");
    setTimeout(() => {
      markwhenCopied.value = false;
    }, 3000);
  });
}

function downloadBattleCard() {
  const brief = generateExecutiveBriefMarkdown(
    activeCompetitor.value,
    seatsCount.value,
    yearsCount.value
  );
  const blob = new Blob([brief], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wolf-timeline-vs-${activeCompetitor.value.id}-brief.md`;
  a.click();
  URL.revokeObjectURL(url);
  uiStore.showToast("Battle card brief downloaded ✓");
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
          <span class="benchmark-pill">{{ competitors.length }} Direct Competitors Benchmarked</span>
          <span class="zero-exfil-pill">Zero Cloud Exfiltration Guarantee</span>
        </div>

        <div class="header-main-row">
          <div>
            <h2 id="modal-title" class="modal-title">Wolf Timeline vs. The Market</h2>
            <p class="modal-subtitle">
              Sovereign offline roadmapping, living markdown studio, and zero-knowledge encrypted vaults vs. expensive cloud subscriptions & fragmented desktop tools.
            </p>
          </div>

          <div class="header-right-actions">
            <!-- Mode Switcher Tabs -->
            <div class="view-mode-tabs" role="tablist">
              <button
                type="button"
                class="view-mode-btn"
                :class="{ active: activeViewTab === 'battle' }"
                @click="activeViewTab = 'battle'"
              >
                <span>1-on-1 Battle Card</span>
              </button>
              <button
                type="button"
                class="view-mode-btn"
                :class="{ active: activeViewTab === 'matrix' }"
                @click="activeViewTab = 'matrix'"
              >
                <span>Master Matrix</span>
              </button>
              <button
                type="button"
                class="view-mode-btn"
                :class="{ active: activeViewTab === 'calculator' }"
                @click="activeViewTab = 'calculator'"
              >
                <span>TCO ROI Calculator</span>
              </button>
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

        <!-- Category & Search Bar -->
        <div class="filter-and-search-strip">
          <div class="category-filters">
            <button
              type="button"
              class="cat-filter-btn"
              :class="{ active: selectedCategory === 'all' }"
              @click="selectedCategory = 'all'"
            >
              All ({{ competitors.length }})
            </button>
            <button
              type="button"
              class="cat-filter-btn"
              :class="{ active: selectedCategory === 'roadmaps' }"
              @click="selectedCategory = 'roadmaps'"
            >
              Roadmaps & Strategy
            </button>
            <button
              type="button"
              class="cat-filter-btn"
              :class="{ active: selectedCategory === 'pkm' }"
              @click="selectedCategory = 'pkm'"
            >
              Markdown & PKM
            </button>
            <button
              type="button"
              class="cat-filter-btn"
              :class="{ active: selectedCategory === 'timelines' }"
              @click="selectedCategory = 'timelines'"
            >
              Timelines & Presentation
            </button>
          </div>

          <div class="search-box-wrap">
            <WolfIcon name="search" :size="12" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search competitor, pricing, or feature..."
            />
            <button
              v-if="searchQuery"
              type="button"
              class="clear-search-btn"
              @click="searchQuery = ''"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Competitor Selection Tabs (Visible in Battle Card Mode) -->
      <div v-if="activeViewTab === 'battle'" class="competitor-tabs-strip">
        <button
          v-for="comp in filteredCompetitors"
          :key="comp.id"
          type="button"
          class="comp-tab-btn"
          :class="{ active: activeCompetitor.id === comp.id }"
          @click="selectCompetitor(comp)"
        >
          <span class="tab-name">{{ comp.name }}</span>
          <span v-if="comp.airGapped" class="tab-airgap-badge" title="Local/Air-Gapped">Offline</span>
          <span v-else class="tab-cloud-badge" title="Cloud Lock-in">Cloud</span>
        </button>
      </div>

      <!-- VIEW 1: Head to Head Battle Card -->
      <div v-if="activeViewTab === 'battle'" class="modal-body-grid">
        <!-- Left: Battle Card Details -->
        <div class="battle-card">
          <div class="battle-header">
            <div class="comp-title-wrap">
              <span class="versus-label">1-ON-1 SOVEREIGN BENCHMARK</span>
              <h3 class="comp-heading">Wolf Timeline vs {{ activeCompetitor.name }}</h3>
              <span class="comp-category-tag">{{ activeCompetitor.category }}</span>
              <p v-if="activeCompetitor.tagline" class="comp-tagline-text">
                {{ activeCompetitor.tagline }}
              </p>
            </div>
            <div class="comp-price-badge">
              <span class="price-label">Their Recurring Cost</span>
              <span class="price-val">{{ activeCompetitor.pricing }}</span>
            </div>
          </div>

          <!-- TCO Quick Savings Strip -->
          <div class="tco-highlight-bar">
            <div class="tco-col">
              <span class="tco-label">3-Yr Cost ({{ seatsCount }} Seats):</span>
              <span class="tco-comp-val">${{ activeSavings.competitorTotalUsd.toLocaleString() }}</span>
            </div>
            <div class="tco-vs">vs</div>
            <div class="tco-col">
              <span class="tco-label">Wolf Lifetime:</span>
              <span class="tco-wolf-val">$190 flat</span>
            </div>
            <div class="tco-badge-save">
              <span>Save ${{ activeSavings.savingsUsd.toLocaleString() }}</span>
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

          <!-- Quick Text-to-Timeline Markwhen Bridge -->
          <div class="markwhen-bridge-box">
            <div class="bridge-info">
              <span class="bridge-title">Prefer text-to-timeline like Markwhen?</span>
              <span class="bridge-desc">Wolf Timeline exports cleanly to `.mw` and standard markdown formats.</span>
            </div>
            <button type="button" class="btn-copy-mw" @click="copyMarkwhenRoadmap">
              <WolfIcon name="copy" :size="12" />
              <span>{{ markwhenCopied ? "Copied .mw Syntax!" : "Copy Markwhen Timeline (.mw)" }}</span>
            </button>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="matrix-actions">
            <button type="button" class="btn-copy-brief" @click="copyExecutiveBrief">
              <WolfIcon name="copy" :size="13" />
              <span>{{ auditCopied ? 'Copied Brief to Clipboard!' : 'Copy CISO Justification Brief' }}</span>
            </button>
            <button type="button" class="btn-download-md" @click="downloadBattleCard" title="Download Markdown report">
              <WolfIcon name="download" :size="13" />
              <span>Download .md</span>
            </button>
            <button
              type="button"
              class="btn-activate-pass"
              @click="uiStore.showLicenseModal = true; uiStore.closeCompetitorAuditModal()"
            >
              <span>Unlock Commercial Pass</span>
            </button>
          </div>
        </div>
      </div>

      <!-- VIEW 2: Master Comparison Matrix (All 11 Competitors) -->
      <div v-else-if="activeViewTab === 'matrix'" class="master-matrix-container">
        <div class="master-matrix-table-wrap">
          <table class="master-matrix-table">
            <thead>
              <tr>
                <th class="sticky-col">Competitor</th>
                <th>Category</th>
                <th>Pricing Model</th>
                <th>100% Offline Air-Gapped</th>
                <th>AES-256 Vault</th>
                <th>Sealed Dossier</th>
                <th>Horizons + Gantt</th>
                <th>Snapshots</th>
                <th>Wolf Advantage</th>
              </tr>
            </thead>
            <tbody>
              <!-- Wolf Timeline Row (Pinned Top) -->
              <tr class="wolf-highlight-row">
                <td class="sticky-col">
                  <div class="brand-cell">
                    <span class="wolf-icon-spark">⚡</span>
                    <strong>Wolf Timeline</strong>
                    <span class="champ-pill">BENCHMARK</span>
                  </div>
                </td>
                <td>Sovereign Executive Timeline & Studio</td>
                <td><span class="badge-price-wolf">$0 Free / $190 Lifetime</span></td>
                <td><span class="badge-yes">✓ YES (Zero Exfil)</span></td>
                <td><span class="badge-yes">✓ YES (Zero-Knowledge)</span></td>
                <td><span class="badge-yes">✓ YES (SHA-256)</span></td>
                <td><span class="badge-yes">✓ YES (Multi-View)</span></td>
                <td><span class="badge-yes">✓ YES</span></td>
                <td class="col-summary">100% Offline sovereign execution with zero subscription drag.</td>
              </tr>

              <!-- Competitor Rows -->
              <tr
                v-for="comp in filteredCompetitors"
                :key="comp.id"
                class="comp-row"
                :class="{ selected: activeCompetitor.id === comp.id }"
                @click="selectCompetitor(comp)"
              >
                <td class="sticky-col">
                  <div class="comp-name-cell">
                    <strong>{{ comp.name }}</strong>
                    <span class="view-link">inspect →</span>
                  </div>
                </td>
                <td class="muted-cell">{{ comp.category }}</td>
                <td class="price-cell">{{ comp.pricing }}</td>
                <td>
                  <span :class="comp.airGapped ? 'badge-yes' : 'badge-no'">
                    {{ comp.airGapped ? "✓ YES" : "✕ Cloud" }}
                  </span>
                </td>
                <td>
                  <span :class="comp.zeroKnowledgeVault ? 'badge-yes' : 'badge-no'">
                    {{ comp.zeroKnowledgeVault ? "✓ YES" : "✕ NO" }}
                  </span>
                </td>
                <td>
                  <span :class="comp.clientDossierSealed ? 'badge-yes' : 'badge-no'">
                    {{ comp.clientDossierSealed ? "✓ YES" : "✕ NO" }}
                  </span>
                </td>
                <td>
                  <span :class="comp.horizonsAndGantt ? 'badge-yes' : 'badge-no'">
                    {{ comp.horizonsAndGantt ? "✓ YES" : "✕ NO" }}
                  </span>
                </td>
                <td>
                  <span :class="comp.timeMachineSnapshots ? 'badge-yes' : 'badge-no'">
                    {{ comp.timeMachineSnapshots ? "✓ YES" : "✕ NO" }}
                  </span>
                </td>
                <td class="col-summary">{{ comp.wolfAdvantage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- VIEW 3: Interactive TCO / ROI Calculator -->
      <div v-else-if="activeViewTab === 'calculator'" class="calculator-container">
        <!-- Controls Header -->
        <div class="calc-controls-card">
          <div class="calc-slider-group">
            <div class="slider-header">
              <label for="seats-slider" class="calc-label">Team / Consulting Seats:</label>
              <span class="slider-display-val">{{ seatsCount }} Seats</span>
            </div>
            <input
              id="seats-slider"
              v-model.number="seatsCount"
              type="range"
              min="1"
              max="50"
              step="1"
              class="range-slider"
            />
          </div>

          <div class="calc-slider-group">
            <div class="slider-header">
              <label class="calc-label">Horizon Duration:</label>
              <div class="duration-pills">
                <button
                  type="button"
                  class="dur-pill"
                  :class="{ active: yearsCount === 1 }"
                  @click="yearsCount = 1"
                >
                  1 Year
                </button>
                <button
                  type="button"
                  class="dur-pill"
                  :class="{ active: yearsCount === 3 }"
                  @click="yearsCount = 3"
                >
                  3 Years
                </button>
                <button
                  type="button"
                  class="dur-pill"
                  :class="{ active: yearsCount === 5 }"
                  @click="yearsCount = 5"
                >
                  5 Years
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Savings Breakdown Table -->
        <div class="calc-results-wrap">
          <table class="calc-table">
            <thead>
              <tr>
                <th>Competitor</th>
                <th>Annual Cost / Seat</th>
                <th>Total {{ yearsCount }}-Yr Recurring Spend</th>
                <th>Wolf Timeline Lifetime</th>
                <th>Direct Capital Saved</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="comp in competitors" :key="comp.id" class="calc-row">
                <td class="comp-col">
                  <strong>{{ comp.name }}</strong>
                  <span class="cat-badge">{{ comp.categoryGroup?.toUpperCase() || 'SAAS' }}</span>
                </td>
                <td>${{ (comp.annualPerSeatUsd || 192).toLocaleString() }}/yr</td>
                <td class="danger-spend">
                  ${{ calculateTcoSavings(comp, seatsCount, yearsCount).competitorTotalUsd.toLocaleString() }}
                </td>
                <td class="wolf-lifetime">$190 flat</td>
                <td class="save-col">
                  <span class="savings-tag">
                    Save ${{ calculateTcoSavings(comp, seatsCount, yearsCount).savingsUsd.toLocaleString() }}
                    ({{ calculateTcoSavings(comp, seatsCount, yearsCount).savingsPercentage }}%)
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    class="btn-quick-brief"
                    @click="selectCompetitor(comp); activeViewTab = 'battle'"
                  >
                    Battle Card →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
  background: rgba(4, 6, 8, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.competitor-modal-card {
  width: 100%;
  max-width: 1180px;
  max-height: 94vh;
  display: flex;
  flex-direction: column;
  background: #090805;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 18px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.85), 0 0 70px rgba(245, 158, 11, 0.15);
  overflow: hidden;
  color: #f3f4f6;
  font-family: inherit;
}

.modal-header {
  padding: 22px 28px 16px 28px;
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.09) 0%, rgba(9, 8, 5, 0) 100%);
  border-bottom: 1px solid rgba(245, 158, 11, 0.16);
}

.header-badge-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
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
  color: #d1d5db;
  background: rgba(255, 255, 255, 0.06);
  padding: 3px 8px;
  border-radius: 6px;
}

.zero-exfil-pill {
  font-size: 11px;
  color: #34d399;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
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
  font-size: 12.5px;
  color: #9ca3af;
  line-height: 1.4;
  max-width: 650px;
}

.header-right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-mode-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 3px;
  gap: 4px;
}

.view-mode-btn {
  padding: 6px 12px;
  border-radius: 6px;
  background: transparent;
  border: none;
  font-size: 11.5px;
  font-weight: 600;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.18s ease;
}

.view-mode-btn.active {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
  font-weight: 700;
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

.filter-and-search-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.category-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cat-filter-btn {
  padding: 5px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #9ca3af;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.cat-filter-btn:hover {
  color: #f3f4f6;
  border-color: rgba(255, 255, 255, 0.2);
}

.cat-filter-btn.active {
  background: rgba(245, 158, 11, 0.14);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.35);
  font-weight: 700;
}

.search-box-wrap {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #6b7280;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 6px 28px 6px 30px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 7px;
  color: #f3f4f6;
  font-size: 11.5px;
  outline: none;
  transition: border-color 0.18s ease;
}

.search-input:focus {
  border-color: #fbbf24;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 11px;
  cursor: pointer;
}

.competitor-tabs-strip {
  display: flex;
  gap: 6px;
  padding: 10px 28px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;
  scrollbar-width: thin;
}

.comp-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 11.5px;
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
}

.comp-tab-btn.active {
  color: #000;
  background: #fbbf24;
  border-color: #fbbf24;
  font-weight: 700;
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);
}

.tab-airgap-badge {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.2);
  color: #059669;
  font-weight: 700;
}

.comp-tab-btn.active .tab-airgap-badge {
  background: rgba(0, 0, 0, 0.2);
  color: #064e3b;
}

.tab-cloud-badge {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  font-weight: 700;
}

.comp-tab-btn.active .tab-cloud-badge {
  background: rgba(0, 0, 0, 0.2);
  color: #7f1d1d;
}

.modal-body-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 20px;
  padding: 22px 28px;
  overflow-y: auto;
  max-height: calc(94vh - 190px);
}

/* Left Card: Battle Card */
.battle-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: rgba(18, 15, 10, 0.65);
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: 14px;
  padding: 18px;
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
  margin: 3px 0 2px 0;
  font-size: 18px;
  font-weight: 800;
  color: #f9fafb;
}

.comp-category-tag {
  font-size: 11px;
  color: #9ca3af;
}

.comp-tagline-text {
  margin: 6px 0 0 0;
  font-size: 11.5px;
  color: #d1d5db;
  font-style: italic;
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

/* TCO Highlight Bar */
.tco-highlight-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 11.5px;
}

.tco-col {
  display: flex;
  flex-direction: column;
}

.tco-label {
  font-size: 9px;
  color: #9ca3af;
  text-transform: uppercase;
}

.tco-comp-val {
  font-weight: 700;
  color: #fca5a5;
}

.tco-wolf-val {
  font-weight: 700;
  color: #34d399;
}

.tco-vs {
  font-size: 10px;
  color: #6b7280;
  font-weight: 700;
}

.tco-badge-save {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #34d399;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
}

.wolf-advantage-box {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(16, 185, 129, 0.08) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  padding: 13px;
}

.box-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #fbbf24;
  margin-bottom: 5px;
}

.advantage-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: #fef3c7;
}

.flaws-section,
.strengths-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 11.5px;
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
  gap: 5px;
}

.flaw-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11.5px;
  color: #fca5a5;
  line-height: 1.35;
  background: rgba(239, 68, 68, 0.06);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.flaw-bullet {
  color: #ef4444;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
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
  gap: 14px;
  background: rgba(14, 12, 8, 0.85);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 14px;
  padding: 18px;
}

.matrix-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: #fbbf24;
}

.matrix-table-wrap {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}

.matrix-table th {
  text-align: left;
  padding: 8px 10px;
  color: #9ca3af;
  font-weight: 600;
  font-size: 10.5px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.matrix-table td {
  padding: 8px 10px;
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
  margin-top: 1px;
}

.col-wolf {
  color: #34d399;
  font-weight: 700;
}

.badge-yes {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 4px;
  color: #34d399;
  font-size: 10.5px;
}

.badge-no {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 4px;
  color: #f87171;
  font-size: 10.5px;
}

.badge-price-wolf {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 4px;
  color: #fbbf24;
  font-weight: 700;
  font-size: 10.5px;
}

.badge-price-comp {
  font-size: 11px;
  color: #e5e7eb;
}

/* Markwhen Bridge Box */
.markwhen-bridge-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed rgba(245, 158, 11, 0.25);
  border-radius: 8px;
  padding: 8px 12px;
}

.bridge-info {
  display: flex;
  flex-direction: column;
}

.bridge-title {
  font-size: 11px;
  font-weight: 700;
  color: #fef3c7;
}

.bridge-desc {
  font-size: 10px;
  color: #9ca3af;
}

.btn-copy-mw {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 6px;
  color: #fbbf24;
  font-size: 10.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
}

.btn-copy-mw:hover {
  background: rgba(245, 158, 11, 0.2);
}

.matrix-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 10px;
}

.btn-copy-brief {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #fbbf24;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-copy-brief:hover {
  background: rgba(245, 158, 11, 0.22);
  border-color: #fbbf24;
}

.btn-download-md {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #d1d5db;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-download-md:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-activate-pass {
  flex: 1;
  padding: 9px 12px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-activate-pass:hover {
  filter: brightness(1.1);
}

/* Master Matrix View Styles */
.master-matrix-container {
  padding: 20px 28px;
  overflow-y: auto;
  max-height: calc(94vh - 190px);
}

.master-matrix-table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  background: rgba(14, 12, 8, 0.7);
}

.master-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}

.master-matrix-table th {
  background: rgba(0, 0, 0, 0.6);
  padding: 10px 12px;
  color: #9ca3af;
  font-size: 10.5px;
  text-transform: uppercase;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.master-matrix-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.wolf-highlight-row {
  background: rgba(245, 158, 11, 0.08);
  border-bottom: 2px solid rgba(245, 158, 11, 0.3) !important;
}

.brand-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fbbf24;
}

.champ-pill {
  font-size: 9px;
  padding: 1px 4px;
  background: #fbbf24;
  color: #000;
  font-weight: 800;
  border-radius: 4px;
}

.comp-row {
  cursor: pointer;
  transition: background 0.18s ease;
}

.comp-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.comp-row.selected {
  background: rgba(245, 158, 11, 0.05);
}

.comp-name-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 140px;
}

.view-link {
  font-size: 10px;
  color: #fbbf24;
  opacity: 0.7;
}

.muted-cell {
  color: #9ca3af;
}

.price-cell {
  color: #fca5a5;
  font-weight: 600;
  white-space: nowrap;
}

.col-summary {
  font-size: 11px;
  color: #d1d5db;
  max-width: 260px;
  line-height: 1.35;
}

/* Calculator View Styles */
.calculator-container {
  padding: 22px 28px;
  overflow-y: auto;
  max-height: calc(94vh - 190px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calc-controls-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  background: rgba(18, 15, 10, 0.65);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 12px;
  padding: 16px 20px;
}

.calc-slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.calc-label {
  font-size: 12px;
  font-weight: 700;
  color: #fef3c7;
}

.slider-display-val {
  font-size: 13px;
  font-weight: 800;
  color: #fbbf24;
}

.range-slider {
  width: 100%;
  accent-color: #fbbf24;
  cursor: pointer;
}

.duration-pills {
  display: flex;
  gap: 6px;
}

.dur-pill {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.dur-pill.active {
  background: #fbbf24;
  color: #000;
  border-color: #fbbf24;
  font-weight: 700;
}

.calc-results-wrap {
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  background: rgba(14, 12, 8, 0.7);
  overflow-x: auto;
}

.calc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}

.calc-table th {
  padding: 10px 12px;
  color: #9ca3af;
  font-size: 10.5px;
  text-transform: uppercase;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.calc-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.comp-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-badge {
  font-size: 9px;
  padding: 1px 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  color: #9ca3af;
}

.danger-spend {
  color: #fca5a5;
  font-weight: 700;
}

.wolf-lifetime {
  color: #34d399;
  font-weight: 700;
}

.savings-tag {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 6px;
  color: #34d399;
  font-weight: 700;
}

.btn-quick-brief {
  padding: 4px 8px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 5px;
  color: #fbbf24;
  font-size: 10.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-quick-brief:hover {
  background: rgba(245, 158, 11, 0.2);
}

@media (max-width: 860px) {
  .modal-body-grid {
    grid-template-columns: 1fr;
  }
  .calc-controls-card {
    grid-template-columns: 1fr;
  }
  .header-main-row {
    flex-direction: column;
  }
}
</style>
