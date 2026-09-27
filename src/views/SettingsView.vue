<script setup lang="ts">
import { ref, onMounted } from "vue";
import { WOLFITWAY_PRODUCTS, SOVEREIGN_EXPERTS } from "@/services/seedData";
import { useNotesStore } from "@/stores/useNotesStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { useUiStore } from "@/stores/useUiStore";

const notesStore = useNotesStore();
const roadmapStore = useRoadmapStore();
const uiStore = useUiStore();

const connections = ref<Record<string, { connected: boolean; token: string }>>({});

onMounted(() => {
  const local = localStorage.getItem("wolfitway_connections_state");
  if (local) {
    try {
      connections.value = JSON.parse(local);
    } catch {}
  }
});

function toggleConnection(prodId: string) {
  if (!connections.value[prodId]) {
    connections.value[prodId] = { connected: false, token: "" };
  }
  const next = !connections.value[prodId].connected;
  connections.value[prodId].connected = next;
  if (next && !connections.value[prodId].token) {
    connections.value[prodId].token = `wfw_${prodId}_live_${Math.random().toString(36).substring(2, 8)}`;
  }
  localStorage.setItem("wolfitway_connections_state", JSON.stringify(connections.value));
  uiStore.showToast(next ? "Connected (Simulated)" : "Disconnected");
}

function updateToken(prodId: string, val: string) {
  if (!connections.value[prodId]) {
    connections.value[prodId] = { connected: false, token: "" };
  }
  connections.value[prodId].token = val;
  localStorage.setItem("wolfitway_connections_state", JSON.stringify(connections.value));
}

function exportJson() {
  const payload = {
    notes: notesStore.notes,
    roadmap: roadmapStore.phases,
    exported_at: new Date().toISOString(),
    schema: "wolfitway_sovereign_v2",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wolf_timeline_vault_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  uiStore.showToast("Vault JSON exported successfully ✓");
}

function exportMarkdown() {
  let md = `# 🐺 Wolf Timeline Vault Export\nGenerated: ${new Date().toISOString()}\nSovereign Guarantee: 100% Offline-First Zero-Telemetry\n\n---\n\n`;
  notesStore.notes.forEach((n) => {
    md += `## [${n.status.toUpperCase()}] ${n.title}\n`;
    md += `**Date:** ${n.created_at} | **Tags:** ${n.tags.map((t) => "#" + t).join(" ")}\n\n`;
    md += `${n.body}\n\n`;
    if (n.events && n.events.length) {
      md += `### Chronological Timeline\n`;
      n.events.forEach((e) => {
        md += `- **${e.title}** (${e.time}): ${e.desc} [${e.author}]\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  });
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wolf_timeline_${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  uiStore.showToast("Timeline Markdown exported ✓");
}

function handleResetWorkspace() {
  if (confirm("Reset workspace with all sovereign sample projects, roadmap, and sample data?")) {
    notesStore.resetToDefaults();
    roadmapStore.resetToDefaults();
    uiStore.showToast("Sample data reloaded ✓");
  }
}
</script>

<template>
  <div class="settings-view">
    <div class="settings-content-wrap">
      <!-- Section 1: Wolfitway Ecosystem Connections -->
      <section class="settings-section">
        <div class="section-header">
          <h3 class="section-title">⚡ Wolfitway Ecosystem Connections</h3>
          <p class="section-desc">Connect your sovereign node to the decentralized creator network.</p>
        </div>

        <div class="connections-grid">
          <div
            v-for="prod in WOLFITWAY_PRODUCTS"
            :key="prod.id"
            class="connection-card"
            :class="{ active: connections[prod.id]?.connected }"
          >
            <div class="conn-card-top">
              <div class="conn-brand">
                <span class="conn-icon">{{ prod.icon }}</span>
                <div class="conn-names">
                  <span class="conn-title">{{ prod.name }}</span>
                  <span class="conn-domain">{{ prod.domain }}</span>
                </div>
              </div>
              <span class="conn-status-badge" :class="{ on: connections[prod.id]?.connected }">
                <span class="dot" :class="connections[prod.id]?.connected ? 'dot-green' : 'dot-gray'"></span>
                {{ connections[prod.id]?.connected ? "Connected" : "Disconnected" }}
              </span>
            </div>

            <p class="conn-desc">{{ prod.desc }}</p>

            <div class="conn-action-row">
              <input
                :value="connections[prod.id]?.token || ''"
                type="password"
                class="conn-token-input"
                :placeholder="prod.placeholder"
                @input="(e) => updateToken(prod.id, (e.target as HTMLInputElement).value)"
              />
              <button
                type="button"
                class="btn-conn-toggle"
                :class="{ connected: connections[prod.id]?.connected }"
                @click="toggleConnection(prod.id)"
              >
                {{ connections[prod.id]?.connected ? "Disconnect" : "Connect Mock" }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Sovereign Data Export & Backup -->
      <section class="settings-section">
        <div class="section-header">
          <h3 class="section-title">📦 Sovereign Data Backup &amp; Portability</h3>
          <p class="section-desc">Download your encrypted local database or clean markdown logs with zero telemetry.</p>
        </div>

        <div class="export-actions-grid">
          <div class="export-card">
            <div class="export-info">
              <span class="export-title">Wolfitway JSON Vault</span>
              <span class="export-sub">Full ecosystem export including notes, roadmap, and timeline logs.</span>
            </div>
            <button type="button" class="btn-export" @click="exportJson">
              Download JSON
            </button>
          </div>

          <div class="export-card">
            <div class="export-info">
              <span class="export-title">Markdown Timeline Document</span>
              <span class="export-sub">GitHub-flavored markdown for Git commits and static site publishing.</span>
            </div>
            <button type="button" class="btn-export" @click="exportMarkdown">
              Download .md
            </button>
          </div>

          <div class="export-card danger-card">
            <div class="export-info">
              <span class="export-title">Reload Sovereign Sample Projects</span>
              <span class="export-sub">Reset workspace templates to default multi-stage funnel projects.</span>
            </div>
            <button type="button" class="btn-reset" @click="handleResetWorkspace">
              Reload Defaults
            </button>
          </div>
        </div>
      </section>

      <!-- Section 3: Council of Sovereign Experts Registry -->
      <section class="settings-section">
        <div class="section-header">
          <h3 class="section-title">🐺 The Council of Sovereign Experts</h3>
          <p class="section-desc">Specialized engineering and product council governing Wolf Timeline architecture.</p>
        </div>

        <div class="experts-grid">
          <div
            v-for="expert in SOVEREIGN_EXPERTS"
            :key="expert.handle"
            class="expert-card"
          >
            <div class="expert-top">
              <span class="expert-avatar">{{ expert.avatar }}</span>
              <div class="expert-info">
                <span class="expert-role">{{ expert.role }}</span>
                <span class="expert-handle">{{ expert.handle }}</span>
              </div>
              <span class="expert-status">✅ {{ expert.status }}</span>
            </div>
            <p class="expert-mandate">{{ expert.mandate }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  flex: 1;
  height: calc(100vh - 60px);
  background: #040c08;
  overflow-y: auto;
  padding: 30px 40px;
}

.settings-content-wrap {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.section-desc {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

/* Connections Grid */
.connections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.connection-card {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.connection-card.active {
  border-color: rgba(16, 185, 129, 0.4);
}

.conn-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conn-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.conn-icon {
  font-size: 20px;
}

.conn-names {
  display: flex;
  flex-direction: column;
}

.conn-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
}

.conn-domain {
  font-size: 10.5px;
  color: var(--emerald-bright, #34d399);
}

.conn-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: #9ca3af;
}

.conn-status-badge.on {
  color: var(--emerald-bright, #34d399);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-green {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.dot-gray {
  background: #6b7280;
}

.conn-desc {
  font-size: 11.5px;
  color: #9ca3af;
  line-height: 1.4;
  margin: 0;
}

.conn-action-row {
  display: flex;
  gap: 8px;
}

.conn-token-input {
  flex: 1;
  background: #050b08;
  border: 1px solid #142820;
  border-radius: 6px;
  padding: 6px 10px;
  color: #fff;
  font-size: 11px;
  outline: none;
}

.btn-conn-toggle {
  background: #10241b;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.btn-conn-toggle.connected {
  background: transparent;
  border-color: #ef4444;
  color: #ef4444;
}

/* Export Cards */
.export-actions-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 10px;
  padding: 14px 18px;
}

.export-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.export-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.export-sub {
  font-size: 11.5px;
  color: #9ca3af;
}

.btn-export {
  background: #10241b;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
  padding: 6px 14px;
  color: var(--emerald-bright, #34d399);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-export:hover {
  background: #163327;
}

.btn-reset {
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 6px;
  padding: 6px 14px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-reset:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Experts Grid */
.experts-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expert-card {
  background: #08120e;
  border: 1px solid #14281f;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expert-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expert-avatar {
  font-size: 18px;
}

.expert-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.expert-role {
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
}

.expert-handle {
  font-size: 11px;
  color: var(--emerald-bright, #34d399);
}

.expert-status {
  font-size: 10.5px;
  color: #10b981;
  font-weight: 600;
}

.expert-mandate {
  font-size: 11.5px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.4;
}
</style>
