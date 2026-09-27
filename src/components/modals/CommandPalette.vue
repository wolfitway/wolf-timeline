<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { useVaultStore } from "@/stores/useVaultStore";

const uiStore = useUiStore();
const notesStore = useNotesStore();
const roadmapStore = useRoadmapStore();
const vaultStore = useVaultStore();

const query = ref("");
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => uiStore.showCommandPalette,
  (open) => {
    if (open) {
      query.value = "";
      selectedIndex.value = 0;
      nextTick(() => inputRef.value?.focus());
    }
  }
);

interface PaletteItem {
  id: string;
  type: "note" | "roadmap" | "secret" | "action";
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  action: () => void;
}

const results = computed<PaletteItem[]>(() => {
  const q = query.value.toLowerCase().trim();
  const list: PaletteItem[] = [];

  // Actions
  list.push({
    id: "act-capture",
    type: "action",
    title: "Quick Capture New Idea / Note",
    subtitle: "Trigger instant ⌘+Enter capture modal",
    icon: "⚡",
    badge: "Action",
    action: () => {
      uiStore.showCommandPalette = false;
      uiStore.showQuickCapture = true;
    },
  });

  list.push({
    id: "act-scan-secrets",
    type: "action",
    title: "Scan .txt / .env for Credentials",
    subtitle: "Extract API keys and passwords non-destructively",
    icon: "📂",
    badge: "Scanner",
    action: () => {
      uiStore.showCommandPalette = false;
      uiStore.setTab("secrets");
      uiStore.showSecretScanner = true;
    },
  });

  list.push({
    id: "act-studio",
    type: "action",
    title: "Switch to Markdown Studio",
    subtitle: "Distraction-free focus writing view",
    icon: "📝",
    badge: "View",
    action: () => {
      uiStore.showCommandPalette = false;
      uiStore.setTab("studio");
    },
  });

  list.push({
    id: "act-roadmap",
    type: "action",
    title: "Switch to Roadmap Canvas",
    subtitle: "Milestones, phases and key practices",
    icon: "🗺️",
    badge: "View",
    action: () => {
      uiStore.showCommandPalette = false;
      uiStore.setTab("roadmap");
    },
  });

  // Notes
  notesStore.notes.forEach((n) => {
    list.push({
      id: `note-${n.id}`,
      type: "note",
      title: n.title,
      subtitle: n.body.replace(/\n/g, " ").substring(0, 70) + "...",
      icon: n.kind === "milestone" ? "🗺️" : n.kind === "post" ? "📝" : "💡",
      badge: n.status.toUpperCase(),
      action: () => {
        uiStore.showCommandPalette = false;
        notesStore.selectedNoteId = n.id;
        uiStore.setTab("timeline");
      },
    });
  });

  // Roadmap Phases
  roadmapStore.phases.forEach((p) => {
    list.push({
      id: `rm-${p.id}`,
      type: "roadmap",
      title: p.title,
      subtitle: p.description,
      icon: "🎯",
      badge: p.status,
      action: () => {
        uiStore.showCommandPalette = false;
        roadmapStore.activePhaseId = p.id;
        uiStore.setTab("roadmap");
      },
    });
  });

  // Secrets (if unlocked)
  if (vaultStore.isUnlocked) {
    vaultStore.decryptedSecrets.forEach((s) => {
      list.push({
        id: `sec-${s.id}`,
        type: "secret",
        title: s.service,
        subtitle: `${s.category.toUpperCase()} • ${s.username || "Stored credential"}`,
        icon: "🔐",
        badge: "Secret",
        action: () => {
          uiStore.showCommandPalette = false;
          uiStore.setTab("secrets");
        },
      });
    });
  }

  if (!q) return list.slice(0, 10);

  return list
    .filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q)
    )
    .slice(0, 12);
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length;
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (results.value[selectedIndex.value]) {
      results.value[selectedIndex.value].action();
    }
  } else if (e.key === "Escape") {
    uiStore.showCommandPalette = false;
  }
}
</script>

<template>
  <div v-if="uiStore.showCommandPalette" class="modal-overlay" @click.self="uiStore.showCommandPalette = false">
    <div class="palette-container" @keydown="handleKeyDown">
      <!-- Search Input -->
      <div class="palette-input-row">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="palette-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="palette-input"
          placeholder="Type to search notes, roadmaps, secrets or execute action..."
          spellcheck="false"
        />
        <kbd class="palette-esc-badge" @click="uiStore.showCommandPalette = false">Esc</kbd>
      </div>

      <!-- Results List -->
      <div class="palette-results-list">
        <div
          v-for="(item, idx) in results"
          :key="item.id"
          class="palette-item"
          :class="{ active: idx === selectedIndex }"
          @click="item.action()"
          @mouseenter="selectedIndex = idx"
        >
          <span class="item-icon">{{ item.icon }}</span>
          <div class="item-text-col">
            <span class="item-title">{{ item.title }}</span>
            <span class="item-subtitle">{{ item.subtitle }}</span>
          </div>
          <span v-if="item.badge" class="item-badge">{{ item.badge }}</span>
        </div>

        <div v-if="results.length === 0" class="palette-empty">
          <span>No matching notes, roadmaps or actions found.</span>
        </div>
      </div>

      <!-- Footer Hints -->
      <div class="palette-footer">
        <div class="shortcut-hints">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Select</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
        <span class="palette-branding">⚡ Sovereign Omni-Search</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 6, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  z-index: 10000;
}

.palette-container {
  width: 620px;
  max-width: 92vw;
  background: #08110d;
  border: 1px solid #162c21;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.palette-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #14281f;
}

.palette-icon {
  color: var(--emerald-bright, #34d399);
}

.palette-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 14.5px;
  color: #fff;
  outline: none;
}

.palette-input::placeholder {
  color: #6b7280;
}

.palette-esc-badge {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  background: #11221a;
  color: #9ca3af;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
}

.palette-results-list {
  max-height: 380px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.palette-item.active {
  background: rgba(16, 185, 129, 0.14);
}

.item-icon {
  font-size: 16px;
}

.item-text-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.item-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-subtitle {
  font-size: 11.5px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-badge {
  font-size: 10px;
  font-weight: 700;
  background: #10241b;
  color: var(--emerald-bright, #34d399);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.palette-empty {
  padding: 30px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

.palette-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: #050b08;
  border-top: 1px solid #14281f;
  font-size: 11px;
  color: #6b7280;
}

.shortcut-hints {
  display: flex;
  gap: 12px;
}

.shortcut-hints kbd {
  background: #11221a;
  color: var(--emerald-bright, #34d399);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9.5px;
}

.palette-branding {
  font-weight: 700;
  color: #4b6357;
}
</style>
