<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";
import type { AiExploration, AiDebateTurn } from "@/types";

const uiStore = useUiStore();
const notesStore = useNotesStore();

// View Modes
type TabMode = "debate" | "transcript" | "decision" | "links";
const activeTab = ref<TabMode>("debate");
const isFullscreen = ref(false);

// Form Fields
const expTitle = ref("");
const expModel = ref("Multi-Model Debate Consensus");
const expUrl = ref("");
const expRationale = ref("");
const expTranscript = ref("");
const expTags = ref("");
const expStatus = ref<"debating" | "consensus_reached" | "superseded">("consensus_reached");
const expDecisionOutcome = ref("");
const keyTakeaways = ref<string[]>([]);
const newTakeawayInput = ref("");

// Debate turns
const debateTurns = ref<AiDebateTurn[]>([]);
const newSpeaker = ref("Gemini 2.5 Pro");
const newStance = ref<"pro" | "con" | "neutral" | "synthesis">("pro");
const newArgument = ref("");

// Tradeoffs
const tradeoffs = ref<Array<{ aspect: string; pro: string; con: string }>>([]);
const newAspect = ref("");
const newPro = ref("");
const newCon = ref("");

const availableModels = [
  { name: "Multi-Model Debate Consensus", avatar: "🐺", color: "#10b981" },
  { name: "Gemini 2.5 Pro", avatar: "✨", color: "#60a5fa" },
  { name: "Claude 3.7 Sonnet", avatar: "🧠", color: "#f97316" },
  { name: "DeepSeek R1 Reasoning", avatar: "🔮", color: "#a855f7" },
  { name: "GPT-4o Omnichannel", avatar: "⚡", color: "#10b981" },
  { name: "Sovereign Arbiter", avatar: "🛡️", color: "#34d399" },
];

watch(
  () => uiStore.showAiExplorationModal,
  (open) => {
    if (!open) return;
    const note = notesStore.selectedNote;
    if (!note) return;

    if (uiStore.activeAiExplorationId) {
      // Editing existing
      const existing = note.ai_explorations?.find((e) => e.id === uiStore.activeAiExplorationId);
      if (existing) {
        expTitle.value = existing.title;
        expModel.value = existing.model;
        expUrl.value = existing.url || "";
        expRationale.value = existing.rationale;
        expTranscript.value = existing.transcript;
        expTags.value = existing.tags ? existing.tags.join(", ") : "";
        expStatus.value = existing.status || "consensus_reached";
        expDecisionOutcome.value = existing.decision_outcome || existing.rationale;
        keyTakeaways.value = existing.key_takeaways ? [...existing.key_takeaways] : [];
        debateTurns.value = existing.debate_turns ? JSON.parse(JSON.stringify(existing.debate_turns)) : [];
        tradeoffs.value = existing.tradeoffs ? JSON.parse(JSON.stringify(existing.tradeoffs)) : [];
        activeTab.value = debateTurns.value.length ? "debate" : "transcript";
        return;
      }
    }

    // New AI Exploration Defaults
    expTitle.value = "";
    expModel.value = "Multi-Model Debate Consensus";
    expUrl.value = "";
    expRationale.value = "";
    expTranscript.value = "";
    expTags.value = "ai, architecture, decision";
    expStatus.value = "debating";
    expDecisionOutcome.value = "";
    keyTakeaways.value = [
      "Zero telemetry guarantee maintained across all network hops",
      "Sub-15ms local query latency verified via in-memory SQLite indexing",
    ];
    debateTurns.value = [
      {
        id: "turn_1",
        speaker: "Claude 3.7 Sonnet",
        avatar: "🧠",
        stance: "pro",
        argument: "Using local SQLite with WASM fallback ensures 100% offline-first capability without requiring external cloud accounts or vendor lock-in.",
        timestamp: "10m ago",
      },
      {
        id: "turn_2",
        speaker: "DeepSeek R1 Reasoning",
        avatar: "🔮",
        stance: "con",
        argument: "IndexedDB synchronization requires robust conflict resolution if users edit notes simultaneously across multiple browser tabs.",
        timestamp: "8m ago",
      },
      {
        id: "turn_3",
        speaker: "Gemini 2.5 Pro",
        avatar: "✨",
        stance: "synthesis",
        argument: "Consensus synthesis: Implement single-writer lease with IndexedDB blob storage for media, backed by zero-telemetry local PBKDF2 encryption keys.",
        timestamp: "5m ago",
      },
    ];
    tradeoffs.value = [
      {
        aspect: "Local-First Storage vs Cloud DB",
        pro: "100% privacy, zero latency, offline autonomy",
        con: "Multi-device sync requires encrypted peer-to-peer relay",
      },
    ];
    activeTab.value = "debate";
  },
  { immediate: true }
);

function addDebateTurn() {
  if (!newArgument.value.trim()) return;
  const modelMatch = availableModels.find((m) => m.name === newSpeaker.value);
  debateTurns.value.push({
    id: `turn_${Date.now()}`,
    speaker: newSpeaker.value,
    avatar: modelMatch?.avatar || "💬",
    stance: newStance.value,
    argument: newArgument.value.trim(),
    timestamp: "Just now",
  });
  newArgument.value = "";
  uiStore.showToast("Debate argument added ✓");
}

function removeDebateTurn(idx: number) {
  debateTurns.value.splice(idx, 1);
}

function addTradeoff() {
  if (!newAspect.value.trim()) return;
  tradeoffs.value.push({
    aspect: newAspect.value.trim(),
    pro: newPro.value.trim(),
    con: newCon.value.trim(),
  });
  newAspect.value = "";
  newPro.value = "";
  newCon.value = "";
  uiStore.showToast("Trade-off metric added ✓");
}

function removeTradeoff(idx: number) {
  tradeoffs.value.splice(idx, 1);
}

function addTakeaway() {
  if (!newTakeawayInput.value.trim()) return;
  keyTakeaways.value.push(newTakeawayInput.value.trim());
  newTakeawayInput.value = "";
}

function removeTakeaway(idx: number) {
  keyTakeaways.value.splice(idx, 1);
}

function handleSynthesizeConsensus() {
  if (!debateTurns.value.length) {
    uiStore.showToast("Add some debate turns before synthesizing!");
    return;
  }
  const summary = debateTurns.value.map((t) => `• [${t.speaker} - ${t.stance.toUpperCase()}]: ${t.argument}`).join("\n");
  expDecisionOutcome.value = `Consensus Reached:\nAfter evaluating arguments across ${debateTurns.value.length} model turns, the architectural consensus is to prioritize zero-telemetry local execution.\n\nKey Consensus Points:\n${summary}`;
  expStatus.value = "consensus_reached";
  activeTab.value = "decision";
  uiStore.showToast("Consensus synthesized from debate ✓");
}

function copyDecisionSummary() {
  let md = `# 🐺 Architectural Decision Record: ${expTitle.value || "AI Decision Exploration"}\n`;
  md += `**Model:** ${expModel.value} | **Status:** ${expStatus.value.toUpperCase()}\n\n`;
  if (expDecisionOutcome.value) {
    md += `## 🎯 Consensus Decision & Outcome\n${expDecisionOutcome.value}\n\n`;
  }
  if (keyTakeaways.value.length) {
    md += `## 🔑 Key Takeaways\n`;
    keyTakeaways.value.forEach((k) => (md += `- ${k}\n`));
    md += `\n`;
  }
  if (tradeoffs.value.length) {
    md += `## ⚖️ Trade-offs Evaluated\n`;
    tradeoffs.value.forEach((t) => {
      md += `### ${t.aspect}\n- **Pros:** ${t.pro}\n- **Cons:** ${t.con}\n`;
    });
    md += `\n`;
  }
  if (debateTurns.value.length) {
    md += `## ⚔️ AI Model Debate Turns\n`;
    debateTurns.value.forEach((turn) => {
      md += `### ${turn.avatar} ${turn.speaker} (${turn.stance.toUpperCase()})\n${turn.argument}\n\n`;
    });
  }
  navigator.clipboard.writeText(md);
  uiStore.showToast("Decision summary copied to clipboard ✓");
}

function handleSave() {
  const note = notesStore.selectedNote;
  if (!note) return;

  if (!expTitle.value.trim()) {
    expTitle.value = "Architectural Decision & Model Debate";
  }

  const tagList = expTags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  const explorationData: AiExploration = {
    id: uiStore.activeAiExplorationId || `ai_${Date.now()}`,
    title: expTitle.value.trim(),
    date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    model: expModel.value,
    url: expUrl.value.trim() || undefined,
    rationale: expDecisionOutcome.value.trim() || expRationale.value.trim() || "Decision motivated by model debate.",
    transcript: expTranscript.value.trim(),
    tags: tagList,
    debate_models: availableModels.map((m) => m.name),
    debate_turns: debateTurns.value,
    decision_outcome: expDecisionOutcome.value.trim(),
    tradeoffs: tradeoffs.value,
    key_takeaways: keyTakeaways.value,
    status: expStatus.value,
  };

  if (uiStore.activeAiExplorationId) {
    notesStore.updateAiExploration(note.id, uiStore.activeAiExplorationId, explorationData);
    uiStore.showToast("AI Exploration updated ✓");
  } else {
    notesStore.addAiExploration(note.id, explorationData);
    uiStore.showToast("AI Exploration & Decision saved to timeline ✓");
  }

  uiStore.closeAiExplorationModal();
}

function handleDeleteCurrent() {
  const note = notesStore.selectedNote;
  if (!note || !uiStore.activeAiExplorationId) return;
  if (confirm("Delete this AI exploration and decision debate record?")) {
    notesStore.deleteAiExploration(note.id, uiStore.activeAiExplorationId);
    uiStore.closeAiExplorationModal();
    uiStore.showToast("Exploration record removed ✓");
  }
}
</script>

<template>
  <div v-if="uiStore.showAiExplorationModal" class="ai-modal-overlay" @click.self="uiStore.closeAiExplorationModal">
    <div class="ai-modal-dialog" :class="{ fullscreen: isFullscreen }">
      <!-- Modal Header -->
      <header class="modal-topbar">
        <div class="modal-title-group">
          <div class="badge-row">
            <span class="ai-brain-badge">⚔️ DECISION &amp; DEBATE STUDIO</span>
            <span class="status-pill" :class="expStatus">● {{ expStatus.replace('_', ' ').toUpperCase() }}</span>
          </div>
          <input
            v-model="expTitle"
            type="text"
            class="modal-heading-input"
            placeholder="e.g. Zero-Downtime Rollback Strategies & Model Debates..."
          />
        </div>

        <div class="modal-controls">
          <button
            type="button"
            class="btn-icon-control"
            :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'"
            @click="isFullscreen = !isFullscreen"
          >
            {{ isFullscreen ? "⤦" : "⤢" }}
          </button>
          <button type="button" class="btn-icon-control close-btn" @click="uiStore.closeAiExplorationModal">✕</button>
        </div>
      </header>

      <!-- Primary Meta Toolbar -->
      <div class="meta-toolbar">
        <div class="meta-item">
          <span class="meta-label">Primary Reasoning Model:</span>
          <select v-model="expModel" class="meta-select">
            <option v-for="m in availableModels" :key="m.name" :value="m.name">
              {{ m.avatar }} {{ m.name }}
            </option>
          </select>
        </div>

        <div class="meta-item">
          <span class="meta-label">Consensus Status:</span>
          <select v-model="expStatus" class="meta-select">
            <option value="debating">🔄 Active Debate</option>
            <option value="consensus_reached">✅ Consensus Reached</option>
            <option value="superseded">⚠️ Superseded Record</option>
          </select>
        </div>

        <div class="meta-item flex-1">
          <span class="meta-label">Tags:</span>
          <input v-model="expTags" type="text" class="meta-input" placeholder="ai, consensus, cache, architecture..." />
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-strip">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'debate' }"
          @click="activeTab = 'debate'"
        >
          <span>⚔️ Multi-Model Debate ({{ debateTurns.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'decision' }"
          @click="activeTab = 'decision'"
        >
          <span>🎯 Decision Rationale &amp; ADR</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'transcript' }"
          @click="activeTab = 'transcript'"
        >
          <span>💬 Full Conversation Transcript</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'links' }"
          @click="activeTab = 'links'"
        >
          <span>🔗 Links &amp; Artifacts</span>
        </button>
      </div>

      <!-- Tab 1: Multi-Model Debate & Comparison -->
      <div v-if="activeTab === 'debate'" class="modal-body-scrollable">
        <div class="debate-header-action">
          <div>
            <h4 class="subpane-title">Multi-Model Architectural Debate Stream</h4>
            <p class="subpane-desc">Compare perspectives and motivate architectural decisions with multi-agent consensus.</p>
          </div>
          <button type="button" class="btn-synthesize" @click="handleSynthesizeConsensus">
            <span>✨</span> Synthesize Consensus Verdict
          </button>
        </div>

        <!-- Debate Turns Stream -->
        <div class="debate-stream-container">
          <div
            v-for="(turn, idx) in debateTurns"
            :key="turn.id || idx"
            class="debate-turn-card"
            :class="turn.stance"
          >
            <div class="turn-header">
              <div class="turn-author">
                <span class="turn-avatar">{{ turn.avatar }}</span>
                <span class="turn-speaker">{{ turn.speaker }}</span>
                <span class="stance-badge" :class="turn.stance">{{ turn.stance.toUpperCase() }}</span>
              </div>
              <div class="turn-right">
                <span class="turn-time">{{ turn.timestamp || 'Logged' }}</span>
                <button type="button" class="btn-remove-turn" @click="removeDebateTurn(idx)">✕</button>
              </div>
            </div>
            <p class="turn-body">{{ turn.argument }}</p>
          </div>
        </div>

        <!-- Add Debate Turn Box -->
        <div class="add-turn-box">
          <h5 class="box-title">+ Inject Model Debate Argument</h5>
          <div class="turn-inputs-row">
            <select v-model="newSpeaker" class="turn-select">
              <option v-for="m in availableModels" :key="m.name" :value="m.name">
                {{ m.avatar }} {{ m.name }}
              </option>
            </select>
            <div class="stance-picker">
              <button
                type="button"
                class="btn-stance"
                :class="{ active: newStance === 'pro' }"
                @click="newStance = 'pro'"
              >
                PRO
              </button>
              <button
                type="button"
                class="btn-stance"
                :class="{ active: newStance === 'con' }"
                @click="newStance = 'con'"
              >
                CON
              </button>
              <button
                type="button"
                class="btn-stance"
                :class="{ active: newStance === 'synthesis' }"
                @click="newStance = 'synthesis'"
              >
                SYNTHESIS
              </button>
            </div>
          </div>
          <textarea
            v-model="newArgument"
            class="turn-textarea"
            rows="3"
            placeholder="Enter model analysis, architectural counter-argument, or benchmark evidence..."
          ></textarea>
          <div class="turn-footer-action">
            <button type="button" class="btn-add-argument" @click="addDebateTurn">
              <span>+</span> Append Argument to Debate
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: Decision Rationale & ADR -->
      <div v-else-if="activeTab === 'decision'" class="modal-body-scrollable">
        <div class="decision-grid">
          <!-- Final Verdict & Decision Outcome -->
          <div class="decision-card">
            <h4 class="subpane-title">🎯 Consensus Decision &amp; Verdict</h4>
            <p class="subpane-desc">Definitive rationale motivating why this technical decision was chosen.</p>
            <textarea
              v-model="expDecisionOutcome"
              class="decision-textarea"
              rows="6"
              placeholder="Detail the final consensus: What solution was chosen, why alternative models were rejected, and what trade-offs were accepted..."
            ></textarea>
          </div>

          <!-- Key Takeaways Checklist -->
          <div class="decision-card">
            <h4 class="subpane-title">🔑 Architectural Constraints &amp; Key Takeaways</h4>
            <ul class="takeaways-list">
              <li v-for="(k, idx) in keyTakeaways" :key="idx" class="takeaway-item">
                <span class="check-icon">✓</span>
                <span class="takeaway-text">{{ k }}</span>
                <button type="button" class="btn-delete-sm" @click="removeTakeaway(idx)">✕</button>
              </li>
            </ul>
            <div class="add-takeaway-row">
              <input
                v-model="newTakeawayInput"
                type="text"
                class="takeaway-input"
                placeholder="Add constraint (e.g. Must run offline with 0 telemetry)..."
                @keydown.enter.prevent="addTakeaway"
              />
              <button type="button" class="btn-add-sm" @click="addTakeaway">Add</button>
            </div>
          </div>

          <!-- Trade-offs Evaluated -->
          <div class="decision-card full-width">
            <h4 class="subpane-title">⚖️ Evaluated Trade-offs Matrix</h4>
            <div class="tradeoffs-table">
              <div class="tradeoffs-header">
                <span>Aspect / Dimension</span>
                <span>Advantages (Pros)</span>
                <span>Disadvantages / Mitigations (Cons)</span>
                <span></span>
              </div>
              <div v-for="(t, idx) in tradeoffs" :key="idx" class="tradeoff-row">
                <span class="aspect-cell">{{ t.aspect }}</span>
                <span class="pro-cell">+ {{ t.pro }}</span>
                <span class="con-cell">- {{ t.con }}</span>
                <button type="button" class="btn-delete-sm" @click="removeTradeoff(idx)">✕</button>
              </div>
            </div>

            <!-- Add Tradeoff row -->
            <div class="add-tradeoff-form">
              <input v-model="newAspect" type="text" class="tradeoff-input" placeholder="Aspect (e.g. Memory Footprint)..." />
              <input v-model="newPro" type="text" class="tradeoff-input" placeholder="Pros (e.g. 5x less RAM)..." />
              <input v-model="newCon" type="text" class="tradeoff-input" placeholder="Cons (e.g. Slower cold start)..." />
              <button type="button" class="btn-add-tradeoff" @click="addTradeoff">+ Add Metric</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Full Transcript Editor -->
      <div v-else-if="activeTab === 'transcript'" class="modal-body-scrollable">
        <div class="transcript-editor-container">
          <div class="transcript-header">
            <div>
              <h4 class="subpane-title">Full Conversation &amp; Raw Transcript</h4>
              <p class="subpane-desc">Paste full multi-turn discussions, markdown code blocks, CLI debug traces, or model logs.</p>
            </div>
            <span class="char-count-badge">{{ expTranscript.length.toLocaleString() }} chars</span>
          </div>
          <textarea
            v-model="expTranscript"
            class="transcript-code-textarea"
            placeholder="Paste raw conversation logs or markdown transcript here..."
          ></textarea>
        </div>
      </div>

      <!-- Tab 4: Links & Artifacts -->
      <div v-else-if="activeTab === 'links'" class="modal-body-scrollable">
        <div class="links-pane-container">
          <div class="link-input-group">
            <label class="link-label">External Share URL / Thread Link:</label>
            <input
              v-model="expUrl"
              type="text"
              class="link-text-input"
              placeholder="https://chatgpt.com/share/... or https://github.com/.../pull/42"
            />
            <span class="link-hint">Clicking the link badge in the timeline will open this reference in a new tab.</span>
          </div>

          <div class="link-preview-box" v-if="expUrl">
            <span class="preview-title">🔗 Target Reference:</span>
            <a :href="expUrl" target="_blank" rel="noopener" class="preview-url-link">{{ expUrl }}</a>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <footer class="modal-footer">
        <div class="footer-left">
          <button
            v-if="uiStore.activeAiExplorationId"
            type="button"
            class="btn-footer-danger"
            @click="handleDeleteCurrent"
          >
            🗑 Delete Exploration
          </button>
          <button type="button" class="btn-footer-secondary" @click="copyDecisionSummary">
            📋 Copy ADR Summary
          </button>
        </div>

        <div class="footer-right">
          <button type="button" class="btn-footer-cancel" @click="uiStore.closeAiExplorationModal">
            Cancel
          </button>
          <button type="button" class="btn-footer-save" @click="handleSave">
            💾 Save Decision to Timeline
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.ai-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.ai-modal-dialog {
  width: 960px;
  max-width: 95vw;
  height: 85vh;
  background: var(--bg-card, #060e0a);
  border: 1px solid var(--border-card, #143324);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 32px rgba(16, 185, 129, 0.15), 0 20px 40px rgba(0, 0, 0, 0.9);
  overflow: hidden;
  transition: all 0.2s ease;
}

.ai-modal-dialog.fullscreen {
  width: 98vw;
  max-width: 98vw;
  height: 96vh;
  border-radius: 8px;
}

/* Topbar */
.modal-topbar {
  padding: 16px 22px;
  border-bottom: 1px solid var(--border-subtle, #11281d);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-surface, #040a07);
}

.modal-title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-brain-badge {
  font-size: 10.5px;
  font-weight: 800;
  color: var(--emerald-bright, #34d399);
  letter-spacing: 0.06em;
}

.status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--emerald-pill-bg, #081a12);
  border: 1px solid var(--emerald-pill-border, #123826);
  color: var(--emerald-bright, #10b981);
}

.status-pill.debating {
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.4);
}

.status-pill.superseded {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

.modal-heading-input {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary, #fff);
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  width: 90%;
}

.modal-heading-input::placeholder {
  color: var(--text-dim, #4b5563);
}

.modal-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon-control {
  background: var(--bg-inner, #081610);
  border: 1px solid var(--border-card, #143022);
  color: var(--text-secondary, #9ca3af);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
}

.btn-icon-control:hover {
  color: var(--text-primary, #fff);
  border-color: var(--emerald-main, #10b981);
}

.btn-icon-control.close-btn:hover {
  color: #ef4444;
  border-color: #ef4444;
}

/* Meta Toolbar */
.meta-toolbar {
  padding: 10px 22px;
  background: var(--bg-surface, #050d09);
  border-bottom: 1px solid var(--border-subtle, #0f241a);
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-item.flex-1 {
  flex: 1;
}

.meta-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #9ca3af);
  white-space: nowrap;
}

.meta-select, .meta-input {
  background: var(--bg-inner, #030805);
  border: 1px solid var(--border-card, #142e21);
  border-radius: 6px;
  padding: 5px 10px;
  color: var(--text-primary, #fff);
  font-size: 11.5px;
  outline: none;
}

.meta-select:focus, .meta-input:focus {
  border-color: var(--emerald-main, #10b981);
}

.meta-input {
  width: 100%;
}

/* Tab Strip */
.tab-strip {
  display: flex;
  background: var(--bg-inner, #040906);
  border-bottom: 1px solid var(--border-subtle, #102419);
  padding: 0 22px;
  gap: 4px;
}

.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 10px 16px;
  color: var(--text-secondary, #9ca3af);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary, #e5e7eb);
}

.tab-btn.active {
  color: var(--emerald-bright, #34d399);
  border-bottom-color: var(--emerald-main, #10b981);
  background: var(--emerald-pill-bg, #081a12);
}

/* Modal Body */
.modal-body-scrollable {
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: var(--bg-card, #060e0a);
}

.subpane-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0 0 2px;
}

.subpane-desc {
  font-size: 11px;
  color: var(--text-secondary, #9ca3af);
  margin: 0;
}

/* Debate Tab */
.debate-header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-synthesize {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card-hover, #0d281c);
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.4));
  color: var(--emerald-bright, #34d399);
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.btn-synthesize:hover {
  background: var(--emerald-pill-bg, #143d2b);
}

.debate-stream-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.debate-turn-card {
  background: var(--bg-inner, #08140f);
  border: 1px solid var(--border-card, #142e22);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.debate-turn-card.pro {
  border-left: 3px solid var(--emerald-main, #10b981);
}

.debate-turn-card.con {
  border-left: 3px solid #f59e0b;
}

.debate-turn-card.synthesis {
  border-left: 3px solid #a855f7;
}

.turn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.turn-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.turn-avatar {
  font-size: 16px;
}

.turn-speaker {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary, #fff);
}

.stance-badge {
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.stance-badge.pro {
  background: var(--emerald-pill-bg, #0a291b);
  color: var(--emerald-bright, #34d399);
}

.stance-badge.con {
  background: #33200a;
  color: #fbbf24;
}

.stance-badge.synthesis {
  background: #2b1138;
  color: #c084fc;
}

.turn-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.turn-time {
  font-size: 10.5px;
  color: var(--text-dim, #6b7280);
}

.btn-remove-turn {
  background: transparent;
  border: none;
  color: var(--text-dim, #6b7280);
  cursor: pointer;
}

.btn-remove-turn:hover {
  color: #ef4444;
}

.turn-body {
  font-size: 12.5px;
  color: var(--text-primary, #e2e8f0);
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}

/* Add Turn Box */
.add-turn-box {
  background: var(--bg-inner, #040a07);
  border: 1px solid var(--border-card, #142e21);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.box-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--emerald-bright, #34d399);
  margin: 0;
}

.turn-inputs-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.turn-select {
  background: var(--bg-card, #08140f);
  border: 1px solid var(--border-card, #143022);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary, #fff);
  font-size: 11.5px;
  outline: none;
}

.stance-picker {
  display: flex;
  gap: 4px;
}

.btn-stance {
  background: var(--bg-card, #08140f);
  border: 1px solid var(--border-card, #143022);
  color: var(--text-secondary, #9ca3af);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
}

.btn-stance.active {
  background: var(--emerald-main, #10b981);
  color: #040c08;
}

.turn-textarea {
  background: var(--bg-card, #08140f);
  border: 1px solid var(--border-card, #143022);
  border-radius: 6px;
  padding: 10px;
  color: var(--text-primary, #fff);
  font-size: 12px;
  outline: none;
  resize: vertical;
  font-family: inherit;
}

.turn-footer-action {
  display: flex;
  justify-content: flex-end;
}

.btn-add-argument {
  background: var(--bg-card-hover, #0d281c);
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.4));
  color: var(--emerald-bright, #34d399);
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

/* Decision Grid */
.decision-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.decision-card {
  background: var(--bg-inner, #08140f);
  border: 1px solid var(--border-card, #142e22);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.decision-card.full-width {
  grid-column: 1 / -1;
}

.decision-textarea {
  background: var(--bg-inner, #040a07);
  border: 1px solid var(--border-card, #142e21);
  border-radius: 6px;
  padding: 12px;
  color: var(--text-primary, #fff);
  font-size: 12.5px;
  outline: none;
  resize: vertical;
  line-height: 1.5;
  font-family: inherit;
}

.takeaways-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.takeaway-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-inner, #040a07);
  border: 1px solid var(--border-subtle, #10261b);
  border-radius: 6px;
  padding: 6px 10px;
}

.check-icon {
  color: var(--emerald-bright, #10b981);
  font-size: 12px;
}

.takeaway-text {
  font-size: 11.5px;
  color: var(--text-primary, #e2e8f0);
  flex: 1;
}

.btn-delete-sm {
  background: transparent;
  border: none;
  color: var(--text-dim, #6b7280);
  cursor: pointer;
}

.btn-delete-sm:hover {
  color: #ef4444;
}

.add-takeaway-row {
  display: flex;
  gap: 8px;
}

.takeaway-input {
  flex: 1;
  background: var(--bg-inner, #040a07);
  border: 1px solid var(--border-card, #142e21);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary, #fff);
  font-size: 11.5px;
  outline: none;
}

.btn-add-sm {
  background: var(--bg-card-hover, #0d281c);
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.4));
  color: var(--emerald-bright, #34d399);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

/* Tradeoffs Table */
.tradeoffs-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tradeoffs-header {
  display: grid;
  grid-template-columns: 180px 1fr 1fr 30px;
  gap: 10px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-secondary, #9ca3af);
  padding: 4px 8px;
}

.tradeoff-row {
  display: grid;
  grid-template-columns: 180px 1fr 1fr 30px;
  gap: 10px;
  align-items: center;
  background: var(--bg-inner, #040a07);
  border: 1px solid var(--border-subtle, #10261b);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 11.5px;
}

.aspect-cell {
  font-weight: 700;
  color: var(--text-primary, #fff);
}

.pro-cell {
  color: var(--emerald-bright, #34d399);
}

.con-cell {
  color: #f87171;
}

.add-tradeoff-form {
  display: grid;
  grid-template-columns: 180px 1fr 1fr auto;
  gap: 8px;
  margin-top: 6px;
}

.tradeoff-input {
  background: var(--bg-inner, #040a07);
  border: 1px solid var(--border-card, #142e21);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary, #fff);
  font-size: 11.5px;
  outline: none;
}

.btn-add-tradeoff {
  background: var(--bg-card-hover, #0d281c);
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.4));
  color: var(--emerald-bright, #34d399);
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

/* Transcript Tab */
.transcript-editor-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.transcript-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count-badge {
  font-size: 10.5px;
  font-family: var(--font-mono, monospace);
  color: var(--text-dim, #9ca3af);
  background: var(--bg-inner, #040a07);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle, #12281c);
}

.transcript-code-textarea {
  flex: 1;
  min-height: 380px;
  background: var(--bg-inner, #030805);
  border: 1px solid var(--border-card, #142e21);
  border-radius: 8px;
  padding: 14px;
  color: var(--text-primary, #e2e8f0);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  line-height: 1.6;
  outline: none;
  resize: vertical;
}

.transcript-code-textarea:focus {
  border-color: var(--emerald-main, #10b981);
}

/* Links Tab */
.links-pane-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.link-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.link-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary, #fff);
}

.link-text-input {
  background: var(--bg-inner, #030805);
  border: 1px solid var(--border-card, #142e21);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--text-primary, #fff);
  font-size: 12px;
  outline: none;
}

.link-hint {
  font-size: 11px;
  color: var(--text-dim, #9ca3af);
}

.link-preview-box {
  background: var(--bg-inner, #08140f);
  border: 1px solid var(--border-card, #142e22);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary, #9ca3af);
}

.preview-url-link {
  color: var(--emerald-bright, #34d399);
  font-size: 12px;
  text-decoration: underline;
  word-break: break-all;
}

/* Modal Footer */
.modal-footer {
  padding: 14px 22px;
  border-top: 1px solid var(--border-subtle, #11281d);
  background: var(--bg-surface, #040a07);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left, .footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-footer-secondary {
  background: var(--bg-inner, #08140f);
  border: 1px solid var(--border-card, #142e22);
  color: var(--text-primary, #d1d5db);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-footer-secondary:hover {
  background: var(--bg-card-hover, #0d2118);
  color: var(--text-primary, #fff);
}

.btn-footer-danger {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-footer-danger:hover {
  background: rgba(239, 68, 68, 0.15);
}

.btn-footer-cancel {
  background: transparent;
  border: none;
  color: var(--text-secondary, #9ca3af);
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-footer-cancel:hover {
  color: var(--text-primary, #fff);
}

.btn-footer-save {
  background: var(--emerald-main, #10b981);
  border: none;
  color: #03140b;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-footer-save:hover {
  background: var(--emerald-bright, #34d399);
  box-shadow: 0 0 16px rgba(52, 211, 153, 0.4);
}
</style>
