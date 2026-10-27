<script setup lang="ts">
import WolfIcon from "@/components/common/WolfIcon.vue";
import { ref, computed, onMounted } from "vue";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { useUiStore } from "@/stores/useUiStore";
import type { RoadmapPhase, KeyPractice } from "@/types";

const roadmapStore = useRoadmapStore();
const notesStore = useNotesStore();
const uiStore = useUiStore();

onMounted(async () => {
  if (!roadmapStore.phases.length) {
    await roadmapStore.loadRoadmap();
  }
});

const alternativeVersions = computed(() => {
  return roadmapStore.detectedVersions.filter((v) => {
    if (v.phaseCount !== roadmapStore.phases.length) return true;
    return v.isCustom;
  });
});

function restoreVersion(sourceKey: string) {
  const success = roadmapStore.restoreRoadmapFromVersion(sourceKey);
  if (success) {
    uiStore.showToast("Roadmap version restored ✓");
  }
}

const newPracticeText = ref("");
const isAddingPhase = ref(false);
const newPhaseTitle = ref("");
const newPhaseDescription = ref("");
const isConfirmingDeletePhase = ref(false);

// Drag & Drop tracking
const draggedPhaseId = ref<string | null>(null);
const dragOverPhaseId = ref<string | null>(null);

const draggedPracticeId = ref<string | null>(null);
const dragOverPracticeId = ref<string | null>(null);

const isEditingPhaseTitle = ref(false);
const editPhaseTitle = ref("");

function startEditingPhaseTitle() {
  if (!roadmapStore.activePhase) return;
  editPhaseTitle.value = roadmapStore.activePhase.title;
  isEditingPhaseTitle.value = true;
}

function savePhaseTitle() {
  if (!roadmapStore.activePhase || !editPhaseTitle.value.trim()) return;
  roadmapStore.updatePhase(roadmapStore.activePhase.id, { title: editPhaseTitle.value.trim() });
  isEditingPhaseTitle.value = false;
  uiStore.showToast("Phase title updated ✓");
}

function cyclePhaseStatus() {
  if (!roadmapStore.activePhase) return;
  const statuses: Array<RoadmapPhase["status"]> = ["In Progress", "Up Next", "Live", "Planned", "Backlog"];
  const curIdx = statuses.indexOf(roadmapStore.activePhase.status);
  const nextStatus = statuses[(curIdx + 1) % statuses.length];
  roadmapStore.updatePhase(roadmapStore.activePhase.id, { status: nextStatus });
  uiStore.showToast(`Phase status changed to ${nextStatus} ✓`);
}

function handleAddPractice(phaseId: string) {
  if (!newPracticeText.value.trim()) return;
  roadmapStore.addPractice(phaseId, newPracticeText.value.trim());
  newPracticeText.value = "";
  uiStore.showToast("Key practice added to roadmap ✓");
}

function handleDeletePractice(phaseId: string, practiceId: string) {
  roadmapStore.deletePractice(phaseId, practiceId);
  uiStore.showToast("Key practice removed ✓");
}

function toggleAddPhase() {
  isAddingPhase.value = !isAddingPhase.value;
  if (!isAddingPhase.value) {
    newPhaseTitle.value = "";
    newPhaseDescription.value = "";
  }
}

function submitNewPhase() {
  if (!newPhaseTitle.value.trim()) return;
  const created = roadmapStore.addPhase(newPhaseTitle.value.trim(), newPhaseDescription.value.trim());
  newPhaseTitle.value = "";
  newPhaseDescription.value = "";
  isAddingPhase.value = false;
  uiStore.showToast(`Milestone created: "${created.title}" ✓`);
}

function cancelNewPhase() {
  isAddingPhase.value = false;
  newPhaseTitle.value = "";
  newPhaseDescription.value = "";
}

function handleDeleteActivePhase() {
  if (!roadmapStore.activePhase) return;
  if (!isConfirmingDeletePhase.value) {
    isConfirmingDeletePhase.value = true;
    uiStore.showToast("Click Delete again to confirm removal");
    setTimeout(() => {
      isConfirmingDeletePhase.value = false;
    }, 4000);
    return;
  }
  const deletedTitle = roadmapStore.activePhase.title;
  roadmapStore.deletePhase(roadmapStore.activePhase.id);
  isConfirmingDeletePhase.value = false;
  uiStore.showToast(`Removed "${deletedTitle}" from roadmap ✓`);
}

function handleOpenPhaseInStudio() {
  if (!roadmapStore.activePhase) return;
  const phase = roadmapStore.activePhase;
  const existingNote = notesStore.notes.find(
    (n) => n.title.toLowerCase().trim() === phase.title.toLowerCase().trim()
  );

  if (existingNote) {
    notesStore.selectNote(existingNote.id);
    uiStore.setTab("studio");
    uiStore.showToast(`Opened "${existingNote.title}" in Studio ✓`);
  } else {
    const practicesList = phase.practices
      .map((p) => `- [${p.completed ? "x" : " "}] ${p.text}`)
      .join("\n");
    const bodyContent = `# ${phase.title}\n\n**Focus:** ${phase.focus || "Strategic Delivery"}\n**Outcome:** ${phase.outcome || "Measurable Value"}\n\n## Description\n${phase.description}\n\n## Key Practices & Deliverables\n${practicesList}\n`;

    notesStore
      .addNote({
        title: phase.title,
        body: bodyContent,
        tags: ["milestone", "roadmap"],
        kind: "milestone",
        status: phase.status === "In Progress" ? "in_progress" : phase.status === "Live" ? "live" : "ideation",
      })
      .then((created: any) => {
        if (created?.id) notesStore.selectNote(created.id);
        uiStore.setTab("studio");
        uiStore.showToast(`Created document & opened "${phase.title}" in Studio ✓`);
      });
  }
}

/* --- Drag & Drop: Roadmap Phases --- */
function onPhaseDragStart(e: DragEvent, id: string) {
  draggedPhaseId.value = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
}

function onPhaseDragOver(e: DragEvent, id: string) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  dragOverPhaseId.value = id;
}

function onPhaseDragLeave(id: string) {
  if (dragOverPhaseId.value === id) dragOverPhaseId.value = null;
}

function onPhaseDrop(e: DragEvent, targetId: string) {
  e.preventDefault();
  dragOverPhaseId.value = null;
  if (!draggedPhaseId.value || draggedPhaseId.value === targetId) return;

  const list = [...roadmapStore.phases];
  const fromIdx = list.findIndex((p) => p.id === draggedPhaseId.value);
  const toIdx = list.findIndex((p) => p.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [removed] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, removed);
  roadmapStore.reorderPhases(list);
  draggedPhaseId.value = null;
  uiStore.showToast("Roadmap phases reordered ✓");
}

function onPhaseDragEnd() {
  draggedPhaseId.value = null;
  dragOverPhaseId.value = null;
}

/* --- Drag & Drop: Key Practices --- */
function onPracticeDragStart(e: DragEvent, id: string) {
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.closest(".practice-text-input") || target.closest(".practice-check-btn"))) {
    e.preventDefault();
    return;
  }
  draggedPracticeId.value = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
}

function onPracticeDragOver(e: DragEvent, id: string) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  dragOverPracticeId.value = id;
}

function onPracticeDragLeave(id: string) {
  if (dragOverPracticeId.value === id) dragOverPracticeId.value = null;
}

function onPracticeDrop(e: DragEvent, targetId: string) {
  e.preventDefault();
  dragOverPracticeId.value = null;
  if (!draggedPracticeId.value || draggedPracticeId.value === targetId || !roadmapStore.activePhase) return;

  const list = [...roadmapStore.activePhase.practices];
  const fromIdx = list.findIndex((p) => p.id === draggedPracticeId.value);
  const toIdx = list.findIndex((p) => p.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [removed] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, removed);
  roadmapStore.reorderPractices(roadmapStore.activePhase.id, list);
  draggedPracticeId.value = null;
  uiStore.showToast("Key practices checklist reordered ✓");
}

function onPracticeDragEnd() {
  draggedPracticeId.value = null;
  dragOverPracticeId.value = null;
}

function getPhaseDotClass(phase: RoadmapPhase, index: number) {
  if (phase.status === "In Progress") return "dot-green-filled";
  if (phase.status === "Up Next") return "dot-amber-hollow";
  if (phase.status === "Live") return "dot-blue-filled";
  return "dot-gray-hollow";
}

function getPhaseStatusPillClass(status: string) {
  if (status === "In Progress") return "status-pill-green";
  if (status === "Up Next") return "status-pill-amber";
  if (status === "Live") return "status-pill-blue";
  return "status-pill-gray";
}

const activePhaseProgress = computed(() => {
  if (!roadmapStore.activePhase || roadmapStore.activePhase.practices.length === 0) return 60;
  const completed = roadmapStore.activePhase.practices.filter((p) => p.completed).length;
  return Math.round((completed / roadmapStore.activePhase.practices.length) * 100);
});

// Mobile Segment Switcher (<860px)
const mobileRoadmapTab = ref<"phases" | "details">("phases");

function selectPhaseMobile(phaseId: string) {
  roadmapStore.activePhaseId = phaseId;
  mobileRoadmapTab.value = "details";
}

function switchViewMode(mode: "track" | "horizons" | "gantt") {
  roadmapStore.viewMode = mode;
}

const horizonOrder: Array<"now" | "next" | "later" | "shipped"> = ["now", "next", "later", "shipped"];

function movePhaseHorizonStep(phaseId: string, currentHorizon: "now" | "next" | "later" | "shipped", step: 1 | -1) {
  const curIdx = horizonOrder.indexOf(currentHorizon);
  const nextIdx = Math.max(0, Math.min(horizonOrder.length - 1, curIdx + step));
  if (nextIdx !== curIdx) {
    const nextHorizon = horizonOrder[nextIdx];
    roadmapStore.setPhaseHorizon(phaseId, nextHorizon);
    uiStore.showToast(`Phase moved to ${nextHorizon.toUpperCase()} horizon ✓`);
  }
}

function inspectPhaseFromCard(phaseId: string) {
  roadmapStore.activePhaseId = phaseId;
  roadmapStore.viewMode = "track";
  mobileRoadmapTab.value = "details";
}

function getPhaseProgress(phase: RoadmapPhase): number {
  if (!phase.practices || phase.practices.length === 0) return 0;
  const completed = phase.practices.filter((p) => p.completed).length;
  return Math.round((completed / phase.practices.length) * 100);
}
</script>

<template>
  <div class="roadmap-view">
    <!-- Top Header -->
    <div class="roadmap-top-header">
      <div class="header-left">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" class="user-icon">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span class="roadmap-main-heading">Strategic Roadmap Canvas</span>

        <!-- View Mode Switcher: Track vs Horizons vs Gantt -->
        <div class="view-mode-pill-group" role="tablist" aria-label="Roadmap View Options">
          <button
            type="button"
            class="mode-pill-btn"
            :class="{ active: roadmapStore.viewMode === 'track' }"
            @click="switchViewMode('track')"
            title="Track View (Deep-Dive Milestone Deliverables)"
          >
            <WolfIcon name="roadmap" :size="12" />
            <span>Track</span>
          </button>
          <button
            type="button"
            class="mode-pill-btn"
            :class="{ active: roadmapStore.viewMode === 'horizons' }"
            @click="switchViewMode('horizons')"
            title="Horizon Matrix (Now / Next / Later / Shipped)"
          >
            <WolfIcon name="sparkles" :size="12" />
            <span>Horizons</span>
          </button>
          <button
            type="button"
            class="mode-pill-btn"
            :class="{ active: roadmapStore.viewMode === 'gantt' }"
            @click="switchViewMode('gantt')"
            title="Gantt Timeline (Visual Delivery Schedule)"
          >
            <WolfIcon name="timeline" :size="12" />
            <span>Gantt</span>
          </button>
        </div>
      </div>

      <div class="header-right">
        <!-- 7-Competitor Intelligence Trigger Button -->
        <button
          type="button"
          class="btn-competitor-benchmark"
          @click="uiStore.openCompetitorAuditModal"
          title="Compare Wolf Timeline against Linear, ProductPlan, Obsidian, Aeon..."
        >
          <span class="benchmark-spark">⚡</span>
          <span>vs 7 Competitors</span>
        </button>

        <div class="wolf-brand-wrap">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="var(--emerald-bright, #34d399)"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="4,4 7,11 4,15 9,16 12,20 15,16 20,15 17,11 20,4 14,7 12,5 10,7" />
            <polyline points="8.5,11.5 10,13 12,11.5 14,13 15.5,11.5" />
          </svg>
          <div class="brand-text-col">
            <span class="brand-title-small">Wolf Timeline</span>
            <span class="brand-sub-track">TRACK. ADAPT. EVOLVE.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Executive Velocity & Health HUD -->
    <div class="roadmap-hud-strip">
      <div class="hud-item">
        <span class="hud-label">PHASES</span>
        <span class="hud-val">{{ roadmapStore.phases.length }}</span>
      </div>
      <div class="hud-divider"></div>
      <div class="hud-item">
        <span class="hud-label">ACTIVE (NOW)</span>
        <span class="hud-val green">{{ roadmapStore.phasesByHorizon.now.length }}</span>
      </div>
      <div class="hud-divider"></div>
      <div class="hud-item">
        <span class="hud-label">NEXT / UPCOMING</span>
        <span class="hud-val amber">{{ roadmapStore.phasesByHorizon.next.length }}</span>
      </div>
      <div class="hud-divider"></div>
      <div class="hud-item">
        <span class="hud-label">SHIPPED</span>
        <span class="hud-val blue">{{ roadmapStore.phasesByHorizon.shipped.length }}</span>
      </div>
      <div class="hud-divider"></div>
      <div class="hud-item velocity-item">
        <div class="velocity-header">
          <span class="hud-label">VELOCITY</span>
          <span class="hud-val-bold">{{ roadmapStore.overallProgress }}%</span>
        </div>
        <div class="hud-progress-track">
          <div class="hud-progress-bar" :style="{ width: `${roadmapStore.overallProgress}%` }"></div>
        </div>
      </div>
      <div class="hud-spacer"></div>
      <div class="hud-security-tag">
        <WolfIcon name="shield-check" :size="12" />
        <span>100% AIR-GAPPED</span>
      </div>
    </div>

    <!-- Mobile Segment Switcher (<860px) - Only in Track View -->
    <div v-if="roadmapStore.viewMode === 'track'" class="roadmap-mobile-tabs" role="tablist" aria-label="Roadmap View Switcher">
      <button
        type="button"
        role="tab"
        class="roadmap-tab-btn"
        :class="{ active: mobileRoadmapTab === 'phases' }"
        :aria-selected="mobileRoadmapTab === 'phases'"
        @click="mobileRoadmapTab = 'phases'"
      >
        <span class="tab-flex"><WolfIcon name="roadmap" :size="13" /> <span>Phases ({{ roadmapStore.phases.length }})</span></span>
      </button>
      <button
        type="button"
        role="tab"
        class="roadmap-tab-btn"
        :class="{ active: mobileRoadmapTab === 'details' }"
        :aria-selected="mobileRoadmapTab === 'details'"
        @click="mobileRoadmapTab = 'details'"
      >
        <span class="tab-flex"><WolfIcon name="check-square" :size="13" /> <span>{{ roadmapStore.activePhase ? roadmapStore.activePhase.title : 'Milestone Details' }}</span></span>
      </button>
    </div>

    <!-- Main 2-Column Track Body -->
    <div v-if="roadmapStore.viewMode === 'track'" class="roadmap-body">
      <!-- Left Column: ROADMAP Phases Track -->
      <div class="roadmap-column-left" :class="{ 'mobile-hidden': mobileRoadmapTab !== 'phases' }">
        <div class="roadmap-track-card">
          <div class="track-header">
            <div class="track-header-left">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="chart-icon">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span class="track-title">ROADMAP ({{ roadmapStore.phases.length }})</span>
            </div>
            <button
              type="button"
              class="btn-add-phase-quick"
              @click="toggleAddPhase"
              title="Add New Milestone Phase"
            >
              {{ isAddingPhase ? '✕ Close' : '+ Add Phase' }}
            </button>
          </div>

          <!-- Stored Versions Recovery Strip -->
          <div v-if="alternativeVersions.length > 0" class="roadmap-versions-strip">
            <div class="strip-label">
              <WolfIcon name="shield-check" :size="12" />
              <span>Alternative stored roadmap version:</span>
            </div>
            <div class="strip-buttons">
              <button
                v-for="ver in alternativeVersions"
                :key="ver.sourceKey"
                type="button"
                class="btn-version-pill"
                @click="restoreVersion(ver.sourceKey)"
              >
                <span>Switch to {{ ver.source }} ({{ ver.phaseCount }} phases)</span>
              </button>
            </div>
          </div>

          <div class="phases-connected-list">
            <!-- Inline New Phase Form -->
            <div v-if="isAddingPhase" class="new-phase-inline-card">
              <div class="new-phase-header">
                <WolfIcon name="plus" :size="13" />
                <span>Create Milestone Phase</span>
              </div>
              <input
                v-model="newPhaseTitle"
                type="text"
                class="new-phase-input"
                placeholder="Phase Title (e.g. Sovereign Crypto Engine)..."
                @keydown.enter="submitNewPhase"
                @keydown.esc="cancelNewPhase"
                autofocus
              />
              <input
                v-model="newPhaseDescription"
                type="text"
                class="new-phase-input sub"
                placeholder="Strategic Deliverables & Focus..."
                @keydown.enter="submitNewPhase"
                @keydown.esc="cancelNewPhase"
              />
              <div class="new-phase-actions">
                <button type="button" class="btn-create-phase" @click="submitNewPhase">Create Phase</button>
                <button type="button" class="btn-cancel-phase" @click="cancelNewPhase">Cancel</button>
              </div>
            </div>

            <div
              v-for="(phase, index) in roadmapStore.phases"
              :key="phase.id"
              class="phase-node-item"
              :class="{
                active: roadmapStore.activePhaseId === phase.id,
                'is-dragging': draggedPhaseId === phase.id,
                'drag-over-item': dragOverPhaseId === phase.id && draggedPhaseId !== phase.id
              }"
              draggable="true"
              @dragstart="onPhaseDragStart($event, phase.id)"
              @dragover="onPhaseDragOver($event, phase.id)"
              @dragleave="onPhaseDragLeave(phase.id)"
              @drop="onPhaseDrop($event, phase.id)"
              @dragend="onPhaseDragEnd"
              @click="selectPhaseMobile(phase.id)"
            >
              <!-- Timeline Axis -->
              <div class="node-axis">
                <div class="node-dot" :class="getPhaseDotClass(phase, index)" title="Drag to reorder phase"></div>
                <div v-if="index < roadmapStore.phases.length - 1" class="node-line"></div>
              </div>

              <!-- Node Card Content -->
              <div class="node-card">
                <div class="node-top-row">
                  <span class="node-title">{{ phase.title }}</span>
                  <span
                    v-if="phase.status"
                    class="node-status-pill"
                    :class="getPhaseStatusPillClass(phase.status)"
                  >
                    <span v-if="phase.status === 'In Progress'" class="pill-dot">●</span>
                    {{ phase.status }}
                  </span>
                </div>
                <p class="node-subtitle">{{ phase.description }}</p>
              </div>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div class="track-footer">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="var(--emerald-main, #10b981)"
              stroke-width="1.8"
            >
              <polygon points="4,4 7,11 4,15 9,16 12,20 15,16 20,15 17,11 20,4 14,7 12,5 10,7" />
            </svg>
            <span class="footer-tag">EVOLVE WITH INTENTION</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Phase Detail Inspector -->
      <div v-if="roadmapStore.activePhase" class="roadmap-column-right" :class="{ 'mobile-hidden': mobileRoadmapTab !== 'details' }">
        <button
          type="button"
          class="roadmap-mobile-back-btn"
          @click="mobileRoadmapTab = 'phases'"
          title="Back to Roadmap Phases"
        >
          ← Back to Roadmap Phases
        </button>

        <div class="phase-detail-card">
          <!-- Detail Card Header -->
          <div class="detail-top-row">
            <div class="phase-avatar-circle">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="var(--emerald-bright, #34d399)"
                stroke-width="1.8"
              >
                <polygon points="4,4 7,11 4,15 9,16 12,20 15,16 20,15 17,11 20,4 14,7 12,5 10,7" />
              </svg>
            </div>
            <div class="phase-header-info">
              <div v-if="!isEditingPhaseTitle" class="phase-heading-row" @dblclick="startEditingPhaseTitle">
                <h2 class="phase-heading">{{ roadmapStore.activePhase.title }}</h2>
                <button type="button" class="btn-edit-inline" @click="startEditingPhaseTitle" title="Edit phase title"><WolfIcon name="write" :size="12" /></button>
              </div>
              <div v-else class="phase-heading-edit-row">
                <input
                  v-model="editPhaseTitle"
                  type="text"
                  class="phase-inline-input"
                  @keydown.enter="savePhaseTitle"
                  @keydown.esc="isEditingPhaseTitle = false"
                  autofocus
                />
                <button type="button" class="btn-save-sm" @click="savePhaseTitle">Save</button>
                <button type="button" class="btn-cancel-sm" @click="isEditingPhaseTitle = false">✕</button>
              </div>

              <div class="phase-meta-controls">
                <div class="phase-badge-inline clickable" @click="cyclePhaseStatus" title="Click to cycle status">
                  <span class="dot-green">●</span>
                  <span>{{ roadmapStore.activePhase.status }} ▾</span>
                </div>
                <button
                  type="button"
                  class="btn-open-in-studio"
                  @click="handleOpenPhaseInStudio"
                  title="Open or draft strategy document in Studio"
                >
                  <WolfIcon name="studio" :size="12" /> <span>Open in Studio</span>
                </button>
                <button
                  type="button"
                  class="btn-delete-phase"
                  :class="{ 'confirming-delete': isConfirmingDeletePhase }"
                  @click="handleDeleteActivePhase"
                  title="Delete Milestone Phase"
                >
                  <WolfIcon name="trash" :size="12" /> <span>{{ isConfirmingDeletePhase ? 'Click to Confirm Delete' : 'Delete Phase' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Description -->
          <p class="phase-full-description">{{ roadmapStore.activePhase.description }}</p>

          <!-- Focus & Outcome Grid -->
          <div class="focus-outcome-grid">
            <div class="grid-col">
              <span class="grid-label">FOCUS</span>
              <span class="grid-value">{{ roadmapStore.activePhase.focus || "Daily calm systems" }}</span>
            </div>
            <div class="grid-col">
              <span class="grid-label">OUTCOME</span>
              <span class="grid-value">{{ roadmapStore.activePhase.outcome || "More space, less noise" }}</span>
            </div>
          </div>

          <!-- Key Practices Section with Drag & Drop Reorder -->
          <div class="practices-section">
            <div class="practices-header">
              <span class="practices-label">KEY PRACTICES ({{ roadmapStore.activePhase.practices.length }})</span>
              <span class="practices-reorder-hint">Drag items to reorder</span>
            </div>

            <div class="practices-checklist">
              <div
                v-for="practice in roadmapStore.activePhase.practices"
                :key="practice.id"
                class="practice-item"
                :class="{
                  'is-dragging': draggedPracticeId === practice.id,
                  'drag-over-item': dragOverPracticeId === practice.id && draggedPracticeId !== practice.id,
                  completed: practice.completed
                }"
                draggable="true"
                @dragstart="onPracticeDragStart($event, practice.id)"
                @dragover="onPracticeDragOver($event, practice.id)"
                @dragleave="onPracticeDragLeave(practice.id)"
                @drop="onPracticeDrop($event, practice.id)"
                @dragend="onPracticeDragEnd"
              >
                <span class="practice-drag-handle" title="Drag to reorder">⋮</span>

                <!-- 1. Dedicated Separated Checkmark Button -->
                <div class="practice-check-zone">
                  <button
                    type="button"
                    class="practice-check-btn"
                    :class="{ checked: practice.completed }"
                    :title="practice.completed ? 'Mark as incomplete' : 'Mark as completed'"
                    aria-label="Toggle practice completed status"
                    @click.stop="roadmapStore.togglePractice(roadmapStore.activePhase!.id, practice.id)"
                  >
                    <svg v-if="practice.completed" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                </div>

                <!-- 2. Dedicated Text Input Field (Edits text without triggering checkmark) -->
                <div class="practice-input-wrap">
                  <input
                    type="text"
                    class="practice-text-input"
                    :class="{ 'is-completed': practice.completed }"
                    :value="practice.text"
                    placeholder="Key practice title..."
                    spellcheck="false"
                    @click.stop
                    @input="roadmapStore.updatePracticeText(roadmapStore.activePhase!.id, practice.id, ($event.target as HTMLInputElement).value)"
                    @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                  />
                </div>

                <button
                  type="button"
                  class="btn-delete-practice"
                  @click.stop="handleDeletePractice(roadmapStore.activePhase!.id, practice.id)"
                  title="Remove practice"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Add practice input -->
            <div class="add-practice-row">
              <input
                v-model="newPracticeText"
                type="text"
                class="practice-input"
                placeholder="+ Add key practice (press Enter)..."
                @keydown.enter="handleAddPractice(roadmapStore.activePhase!.id)"
              />
            </div>
          </div>

          <!-- Bottom Progress Slider -->
          <div class="progress-bar-wrap">
            <div class="progress-info-row">
              <span class="progress-label">Milestone Progress</span>
              <span class="progress-pct">{{ activePhaseProgress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${activePhaseProgress}%` }"></div>
              <div class="progress-handle" :style="{ left: `${activePhaseProgress}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Horizon Matrix View (Now / Next / Later / Shipped) -->
    <div v-else-if="roadmapStore.viewMode === 'horizons'" class="roadmap-horizons-container">
      <div class="horizons-board-grid">
        <!-- 1. NOW Column -->
        <div class="horizon-column col-now">
          <div class="horizon-col-header">
            <div class="header-status-dot dot-now"></div>
            <div class="col-title-group">
              <span class="col-title">NOW</span>
              <span class="col-subtitle">Active Sprints</span>
            </div>
            <span class="col-count-badge badge-now">{{ roadmapStore.phasesByHorizon.now.length }}</span>
          </div>

          <div class="horizon-cards-list">
            <div
              v-if="roadmapStore.phasesByHorizon.now.length === 0"
              class="horizon-empty-state"
            >
              <span>No active milestones in NOW. Move from Next or create one.</span>
            </div>
            <div
              v-for="phase in roadmapStore.phasesByHorizon.now"
              :key="phase.id"
              class="horizon-phase-card"
              @click="inspectPhaseFromCard(phase.id)"
            >
              <div class="card-top-row">
                <span class="card-phase-num">Phase {{ phase.number }}</span>
                <span class="card-status-pill pill-now">{{ phase.status }}</span>
              </div>
              <h4 class="card-phase-title">{{ phase.title }}</h4>
              <p class="card-phase-desc">{{ phase.description }}</p>

              <!-- Progress bar -->
              <div class="card-progress-wrap">
                <div class="card-progress-bar">
                  <div class="card-progress-fill fill-now" :style="{ width: `${getPhaseProgress(phase)}%` }"></div>
                </div>
                <div class="card-progress-meta">
                  <span>{{ phase.practices.filter(p => p.completed).length }}/{{ phase.practices.length }} deliverables</span>
                  <span>{{ getPhaseProgress(phase) }}%</span>
                </div>
              </div>

              <!-- Action Bar -->
              <div class="card-actions-row" @click.stop>
                <button
                  type="button"
                  class="btn-horizon-shift"
                  @click="movePhaseHorizonStep(phase.id, 'now', 1)"
                  title="Shift to NEXT"
                >
                  <span>Shift to NEXT ▶</span>
                </button>
                <button
                  type="button"
                  class="btn-horizon-open"
                  @click="inspectPhaseFromCard(phase.id)"
                  title="Open Deep Track Details"
                >
                  <span>Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. NEXT Column -->
        <div class="horizon-column col-next">
          <div class="horizon-col-header">
            <div class="header-status-dot dot-next"></div>
            <div class="col-title-group">
              <span class="col-title">NEXT</span>
              <span class="col-subtitle">Queued Milestones</span>
            </div>
            <span class="col-count-badge badge-next">{{ roadmapStore.phasesByHorizon.next.length }}</span>
          </div>

          <div class="horizon-cards-list">
            <div
              v-if="roadmapStore.phasesByHorizon.next.length === 0"
              class="horizon-empty-state"
            >
              <span>No milestones queued in NEXT.</span>
            </div>
            <div
              v-for="phase in roadmapStore.phasesByHorizon.next"
              :key="phase.id"
              class="horizon-phase-card"
              @click="inspectPhaseFromCard(phase.id)"
            >
              <div class="card-top-row">
                <span class="card-phase-num">Phase {{ phase.number }}</span>
                <span class="card-status-pill pill-next">{{ phase.status }}</span>
              </div>
              <h4 class="card-phase-title">{{ phase.title }}</h4>
              <p class="card-phase-desc">{{ phase.description }}</p>

              <div class="card-progress-wrap">
                <div class="card-progress-bar">
                  <div class="card-progress-fill fill-next" :style="{ width: `${getPhaseProgress(phase)}%` }"></div>
                </div>
                <div class="card-progress-meta">
                  <span>{{ phase.practices.filter(p => p.completed).length }}/{{ phase.practices.length }} deliverables</span>
                  <span>{{ getPhaseProgress(phase) }}%</span>
                </div>
              </div>

              <div class="card-actions-row" @click.stop>
                <button
                  type="button"
                  class="btn-horizon-shift"
                  @click="movePhaseHorizonStep(phase.id, 'next', -1)"
                  title="Promote to NOW"
                >
                  <span>◀ NOW</span>
                </button>
                <button
                  type="button"
                  class="btn-horizon-shift"
                  @click="movePhaseHorizonStep(phase.id, 'next', 1)"
                  title="Move to LATER"
                >
                  <span>LATER ▶</span>
                </button>
                <button
                  type="button"
                  class="btn-horizon-open"
                  @click="inspectPhaseFromCard(phase.id)"
                >
                  <span>Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. LATER Column -->
        <div class="horizon-column col-later">
          <div class="horizon-col-header">
            <div class="header-status-dot dot-later"></div>
            <div class="col-title-group">
              <span class="col-title">LATER</span>
              <span class="col-subtitle">Planned Architecture</span>
            </div>
            <span class="col-count-badge badge-later">{{ roadmapStore.phasesByHorizon.later.length }}</span>
          </div>

          <div class="horizon-cards-list">
            <div
              v-if="roadmapStore.phasesByHorizon.later.length === 0"
              class="horizon-empty-state"
            >
              <span>No milestones in LATER horizon.</span>
            </div>
            <div
              v-for="phase in roadmapStore.phasesByHorizon.later"
              :key="phase.id"
              class="horizon-phase-card"
              @click="inspectPhaseFromCard(phase.id)"
            >
              <div class="card-top-row">
                <span class="card-phase-num">Phase {{ phase.number }}</span>
                <span class="card-status-pill pill-later">{{ phase.status }}</span>
              </div>
              <h4 class="card-phase-title">{{ phase.title }}</h4>
              <p class="card-phase-desc">{{ phase.description }}</p>

              <div class="card-progress-wrap">
                <div class="card-progress-bar">
                  <div class="card-progress-fill fill-later" :style="{ width: `${getPhaseProgress(phase)}%` }"></div>
                </div>
                <div class="card-progress-meta">
                  <span>{{ phase.practices.filter(p => p.completed).length }}/{{ phase.practices.length }} deliverables</span>
                  <span>{{ getPhaseProgress(phase) }}%</span>
                </div>
              </div>

              <div class="card-actions-row" @click.stop>
                <button
                  type="button"
                  class="btn-horizon-shift"
                  @click="movePhaseHorizonStep(phase.id, 'later', -1)"
                  title="Promote to NEXT"
                >
                  <span>◀ NEXT</span>
                </button>
                <button
                  type="button"
                  class="btn-horizon-open"
                  @click="inspectPhaseFromCard(phase.id)"
                >
                  <span>Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. SHIPPED Column -->
        <div class="horizon-column col-shipped">
          <div class="horizon-col-header">
            <div class="header-status-dot dot-shipped"></div>
            <div class="col-title-group">
              <span class="col-title">SHIPPED</span>
              <span class="col-subtitle">Live Deliverables</span>
            </div>
            <span class="col-count-badge badge-shipped">{{ roadmapStore.phasesByHorizon.shipped.length }}</span>
          </div>

          <div class="horizon-cards-list">
            <div
              v-if="roadmapStore.phasesByHorizon.shipped.length === 0"
              class="horizon-empty-state"
            >
              <span>No shipped milestones yet. Complete practices in NOW to ship!</span>
            </div>
            <div
              v-for="phase in roadmapStore.phasesByHorizon.shipped"
              :key="phase.id"
              class="horizon-phase-card"
              @click="inspectPhaseFromCard(phase.id)"
            >
              <div class="card-top-row">
                <span class="card-phase-num">Phase {{ phase.number }}</span>
                <span class="card-status-pill pill-shipped">{{ phase.status }}</span>
              </div>
              <h4 class="card-phase-title">{{ phase.title }}</h4>
              <p class="card-phase-desc">{{ phase.description }}</p>

              <div class="card-progress-wrap">
                <div class="card-progress-bar">
                  <div class="card-progress-fill fill-shipped" :style="{ width: `${getPhaseProgress(phase)}%` }"></div>
                </div>
                <div class="card-progress-meta">
                  <span>{{ phase.practices.filter(p => p.completed).length }}/{{ phase.practices.length }} deliverables</span>
                  <span>{{ getPhaseProgress(phase) }}%</span>
                </div>
              </div>

              <div class="card-actions-row" @click.stop>
                <button
                  type="button"
                  class="btn-horizon-shift"
                  @click="roadmapStore.setPhaseHorizon(phase.id, 'now')"
                  title="Re-open in NOW"
                >
                  <span>↺ Re-open</span>
                </button>
                <button
                  type="button"
                  class="btn-horizon-open"
                  @click="inspectPhaseFromCard(phase.id)"
                >
                  <span>Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chronology Gantt Timeline View -->
    <div v-else-if="roadmapStore.viewMode === 'gantt'" class="roadmap-gantt-container">
      <div class="gantt-header-row">
        <div class="gantt-phase-col-header">MILESTONE PHASES</div>
        <div class="gantt-timeline-quarters">
          <div class="quarter-col"><span>Q1 • FOUNDATION</span></div>
          <div class="quarter-col"><span>Q2 • SCALING</span></div>
          <div class="quarter-col"><span>Q3 • ECOSYSTEM</span></div>
          <div class="quarter-col"><span>Q4 • ENTERPRISE MESH</span></div>
        </div>
      </div>

      <div class="gantt-swimlanes-list">
        <div
          v-for="(phase, idx) in roadmapStore.phases"
          :key="phase.id"
          class="gantt-swimlane-row"
          :class="{ active: roadmapStore.activePhaseId === phase.id }"
          @click="inspectPhaseFromCard(phase.id)"
        >
          <div class="swimlane-label-col">
            <div class="swimlane-phase-badge">Phase {{ phase.number }}</div>
            <div class="swimlane-title">{{ phase.title }}</div>
            <span class="swimlane-status-pill" :class="getPhaseStatusPillClass(phase.status)">
              {{ phase.status }}
            </span>
          </div>

          <div class="swimlane-track-col">
            <!-- Timeline Grid lines -->
            <div class="grid-line line-1"></div>
            <div class="grid-line line-2"></div>
            <div class="grid-line line-3"></div>

            <!-- Gantt Deliverable Bar -->
            <div
              class="gantt-bar"
              :style="{
                left: `${Math.min(idx * 16, 56)}%`,
                width: `${Math.max(28, 44 - idx * 2)}%`
              }"
            >
              <div class="bar-progress-fill" :style="{ width: `${getPhaseProgress(phase)}%` }"></div>
              <div class="bar-content">
                <span class="bar-name">{{ phase.title }}</span>
                <span class="bar-pct">{{ getPhaseProgress(phase) }}%</span>
              </div>
              <div class="milestone-diamond" title="Target Milestone Checkpoint">◆</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roadmap-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  max-height: 100%;
  background: var(--bg-body, #040c08);
  overflow: hidden;
  padding: 16px 24px 20px 24px;
}

/* Header */
.roadmap-top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(16, 185, 129, 0.08));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-icon {
  color: var(--text-muted, #94a3b8);
}

.roadmap-main-heading {
  font-family: var(--font-display, "Outfit", sans-serif);
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary, #ffffff);
  letter-spacing: -0.02em;
}

.wolf-brand-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-text-col {
  display: flex;
  flex-direction: column;
}

.brand-title-small {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-primary, #ffffff);
  line-height: 1.2;
}

.brand-sub-track {
  font-size: 9px;
  font-weight: 700;
  color: var(--emerald-main, #10b981);
  letter-spacing: 0.1em;
}

/* 2-Column Body */
.roadmap-body {
  display: grid;
  grid-template-columns: 440px 1fr;
  grid-template-rows: minmax(0, 1fr);
  gap: 24px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Left Column: Phases Track Card */
.roadmap-column-left {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.roadmap-track-card {
  background: var(--bg-card, #06140f);
  border: 1px solid var(--border-card, #0f271d);
  border-radius: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.track-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.track-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-icon {
  color: var(--emerald-main, #10b981);
}

.track-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-primary, #ffffff);
}

.btn-add-phase-quick {
  background: var(--emerald-pill-bg, #092017);
  border: 1px solid var(--emerald-pill-border, #143d2a);
  color: var(--emerald-bright, #34d399);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-add-phase-quick:hover {
  background: var(--emerald-main, #10b981);
  color: var(--bg-body, #03140b);
}

.roadmap-versions-strip {
  margin: 0 16px 12px 16px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.strip-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--amber-warm, #fbbf24);
}

.strip-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.btn-version-pill {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fef3c7;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-version-pill:hover {
  background: rgba(245, 158, 11, 0.3);
  border-color: #fbbf24;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.25);
}

.phases-connected-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  padding-right: 4px;
  padding-bottom: 20px;
}

.phase-node-item {
  display: flex;
  min-height: 76px;
  cursor: grab;
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease;
}

.phase-node-item:active {
  cursor: grabbing;
}

.phase-node-item.is-dragging {
  opacity: 0.35;
  transform: scale(0.98);
}

.phase-node-item.drag-over-item .node-card {
  border-color: var(--border-selected, #10b981);
  background: var(--bg-card-selected, #0b2e20);
  box-shadow: 0 0 16px var(--border-glow, rgba(16, 185, 129, 0.35));
  transform: translateX(6px) scale(1.01);
}

.node-axis {
  width: 28px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 6px;
  z-index: 2;
  box-sizing: border-box;
}

.dot-green-filled {
  background: var(--emerald-main, #10b981);
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.8));
}

.dot-amber-hollow {
  background: var(--bg-card, #06140f);
  border: 2px solid #f59e0b;
}

.dot-blue-filled {
  background: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
}

.dot-gray-hollow {
  background: var(--bg-card, #06140f);
  border: 2px solid #6b7280;
}

.node-line {
  width: 2px;
  background: var(--border-card, #143828);
  position: absolute;
  top: 18px;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.node-card {
  flex: 1;
  background: var(--bg-surface, #081a13);
  border: 1px solid var(--border-card, #112e21);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  margin-left: 8px;
  transition: all 0.15s ease;
}

.phase-node-item:hover .node-card {
  border-color: var(--border-selected, #1b4934);
  background: var(--bg-card-hover, #0b2219);
}

.phase-node-item.active .node-card {
  border: 1.5px solid var(--border-selected, #10b981);
  background: var(--bg-card-selected, #0c261c);
  box-shadow: 0 0 18px var(--border-glow, rgba(16, 185, 129, 0.12));
}

.node-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.node-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
}

.node-status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-pill-green {
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.15));
  color: var(--emerald-bright, #34d399);
  border: 1px solid var(--emerald-pill-border, rgba(16, 185, 129, 0.3));
}

.status-pill-amber {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-pill-blue {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-pill-gray {
  background: rgba(107, 114, 128, 0.15);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.pill-dot {
  font-size: 8px;
}

.node-subtitle {
  font-size: 11.5px;
  color: var(--text-gray, #94a3b8);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.track-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border-card, #0f271d);
}

.footer-tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--emerald-main, #10b981);
}

/* Right Column: Phase Detail Card */
.roadmap-column-right {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-bottom: 60px;
}

.phase-detail-card {
  background: var(--bg-card, #06140f);
  border: 1px solid var(--border-card, #0f271d);
  border-radius: 16px;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-top-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.phase-avatar-circle {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--emerald-pill-bg, #081f16);
  border: 1px solid var(--emerald-pill-border, #143d2a);
  color: var(--emerald-bright, #34d399);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.phase-header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.phase-heading-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.phase-heading {
  font-family: var(--font-display, "Outfit", sans-serif);
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary, #ffffff);
  letter-spacing: -0.01em;
  margin: 0;
}

.btn-edit-inline {
  background: transparent;
  border: none;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.6;
}

.btn-edit-inline:hover {
  opacity: 1;
}

.phase-heading-edit-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.phase-inline-input {
  flex: 1;
  background: var(--bg-surface, #040e0a);
  border: 1.5px solid var(--border-selected, #10b981);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary, #ffffff);
  font-size: 16px;
  font-weight: 700;
  outline: none;
}

.btn-save-sm {
  background: var(--emerald-main, #10b981);
  color: var(--bg-body, #040c08);
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel-sm {
  background: transparent;
  border: 1px solid var(--border-card, #112d20);
  color: var(--text-muted, #94a3b8);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.phase-meta-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.phase-badge-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--emerald-bright, #34d399);
}

.phase-badge-inline.clickable {
  cursor: pointer;
  background: var(--emerald-pill-bg, #092017);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--emerald-pill-border, #143d2a);
  transition: all 0.15s ease;
}

.phase-badge-inline.clickable:hover {
  background: var(--bg-card-hover, #0f3323);
  border-color: var(--border-selected, #10b981);
}

.new-phase-inline-card {
  background: var(--bg-surface, #181208);
  border: 1px solid var(--emerald-deep, #d97706);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  animation: slideDown 0.15s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.new-phase-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--emerald-bright, #fbbf24);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.new-phase-input {
  width: 100%;
  background: var(--bg-card, #120e06);
  border: 1px solid var(--border-card, #33220a);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--text-primary, #fffbeb);
  outline: none;
  transition: border-color 0.15s ease;
}

.new-phase-input:focus {
  border-color: var(--border-focus, #fbbf24);
}

.new-phase-input.sub {
  font-size: 12px;
  color: var(--text-secondary, #fcd34d);
}

.new-phase-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.btn-create-phase {
  background: var(--emerald-main, #f59e0b);
  color: var(--btn-primary-text, #080501);
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-create-phase:hover {
  background: var(--emerald-bright, #fbbf24);
  transform: translateY(-1px);
}

.btn-cancel-phase {
  background: transparent;
  color: var(--text-muted, #d4a373);
  border: 1px solid var(--border-card, #33220a);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.btn-cancel-phase:hover {
  color: var(--text-primary, #fffbeb);
  border-color: var(--border-subtle);
}

.btn-open-in-studio {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-card, #120e06);
  border: 1px solid var(--border-card, #33220a);
  border-radius: 6px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 600;
  color: var(--emerald-bright, #fbbf24);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-open-in-studio:hover {
  background: var(--bg-surface, #181208);
  border-color: var(--border-focus, #fbbf24);
  transform: translateY(-1px);
}

.btn-delete-phase {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid transparent;
  color: #ef4444;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.btn-delete-phase:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-delete-phase.confirming-delete {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #fca5a5;
  font-weight: 700;
  animation: pulseDelete 1s infinite alternate;
}

@keyframes pulseDelete {
  from { opacity: 0.8; }
  to { opacity: 1; }
}

.dot-green {
  color: var(--emerald-main, #10b981);
  font-size: 10px;
}

.phase-full-description {
  font-size: 13.5px;
  color: var(--text-gray, #cbd5e1);
  line-height: 1.6;
  margin: 0;
}

.focus-outcome-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  background: var(--bg-surface, #081a13);
  border: 1px solid var(--border-card, #112e21);
  border-radius: 12px;
  padding: 16px;
}

.grid-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grid-label {
  font-size: 10.5px;
  font-weight: 800;
  color: var(--emerald-main, #10b981);
  letter-spacing: 0.08em;
}

.grid-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
}

/* Key Practices */
.practices-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.practices-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.practices-label {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--emerald-main, #10b981);
  letter-spacing: 0.06em;
}

.practices-reorder-hint {
  font-size: 10px;
  color: var(--text-muted, #64748b);
}

.practices-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.practice-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface, #081a13);
  border: 1px solid var(--border-card, #112e21);
  border-radius: 10px;
  padding: 8px 12px;
  cursor: grab;
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.practice-item:active {
  cursor: grabbing;
}

.practice-item.is-dragging {
  opacity: 0.35;
  transform: scale(0.98);
}

.practice-item.drag-over-item {
  border-color: var(--border-selected, #10b981);
  background: var(--bg-card-selected, #0b2e20);
  box-shadow: 0 0 16px var(--border-glow, rgba(16, 185, 129, 0.35));
  transform: translateY(-2px) scale(1.01);
}

.practice-drag-handle {
  color: var(--text-muted, #4b5563);
  font-size: 13px;
  cursor: grab;
  user-select: none;
  padding: 0 2px;
}

/* Distinct, separated checkmark button zone with clear visual boundary */
.practice-check-zone {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-right: 8px;
  border-right: 1px solid var(--border-card, rgba(16, 185, 129, 0.18));
}

.practice-check-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid var(--border-card, #234736);
  background: var(--bg-card, #081711);
  color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.practice-check-btn:hover {
  border-color: var(--emerald-bright, #34d399);
  background: var(--emerald-pill-bg, #0d281c);
  color: var(--emerald-bright, rgba(52, 211, 153, 0.6));
  transform: scale(1.08);
}

.practice-check-btn.checked {
  background: var(--emerald-main, #10b981);
  border-color: var(--emerald-main, #10b981);
  color: var(--bg-body, #040c08);
  box-shadow: 0 0 8px var(--border-glow, rgba(16, 185, 129, 0.35));
}

/* Dedicated Input Field Container & Input */
.practice-input-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  padding-left: 4px;
}

.practice-text-input {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-primary, #e2e8f0);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 10px;
  outline: none;
  line-height: 1.4;
  cursor: text;
  transition: all 0.15s ease;
}

.practice-text-input:hover {
  border-color: var(--emerald-pill-border, rgba(16, 185, 129, 0.25));
  background: var(--emerald-pill-bg, rgba(16, 185, 129, 0.04));
  color: var(--text-primary, #ffffff);
}

.practice-text-input:focus {
  border-color: var(--border-selected, #10b981);
  background: var(--bg-surface, #07150e);
  color: var(--text-primary, #ffffff);
  box-shadow: 0 0 0 1px var(--border-selected, #10b981), 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.2));
}

.practice-text-input.is-completed {
  color: var(--text-muted, #64748b);
  text-decoration: line-through;
}

.practice-text-input.is-completed:focus {
  color: var(--text-primary, #ffffff);
  text-decoration: none;
}

.btn-delete-practice {
  background: transparent;
  border: none;
  color: var(--text-muted, #64748b);
  font-size: 11px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  opacity: 0.6;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.btn-delete-practice:hover {
  opacity: 1;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.add-practice-row {
  margin-top: 4px;
}

.practice-input {
  width: 100%;
  background: var(--bg-surface, #081a13);
  border: 1px dashed var(--border-card, #143d2a);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12.5px;
  color: var(--text-primary, #ffffff);
  outline: none;
  box-sizing: border-box;
}

.practice-input:focus {
  border-color: var(--border-selected, #10b981);
  border-style: solid;
}

.practice-input::placeholder {
  color: var(--text-muted, #64748b);
}

/* Progress Track */
.progress-bar-wrap {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-gray, #94a3b8);
}

.progress-pct {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--emerald-bright, #10b981);
}

.progress-track {
  position: relative;
  width: 100%;
  height: 6px;
  background: var(--bg-surface, #0f2d20);
  border-radius: 3px;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  background: var(--emerald-main, #10b981);
  border-radius: 3px;
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.6));
  transition: width 0.3s ease;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--emerald-bright, #34d399);
  border: 2px solid var(--bg-card, #06140f);
  box-shadow: 0 0 8px var(--border-glow, rgba(52, 211, 153, 0.8));
  transition: left 0.3s ease;
}

/* High-Contrast Roadmap Cyber Scrollbars */
.phases-connected-list::-webkit-scrollbar,
.roadmap-column-right::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.phases-connected-list::-webkit-scrollbar-track,
.roadmap-column-right::-webkit-scrollbar-track {
  background: var(--scrollbar-track, rgba(4, 12, 8, 0.8));
  border-radius: 6px;
}

.phases-connected-list::-webkit-scrollbar-thumb,
.roadmap-column-right::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, rgba(16, 185, 129, 0.45));
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.phases-connected-list::-webkit-scrollbar-thumb:hover,
.roadmap-column-right::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #34d399);
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.4));
}

.phases-connected-list,
.roadmap-column-right {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb, rgba(16, 185, 129, 0.5)) var(--scrollbar-track, rgba(4, 12, 8, 0.8));
}

/* Default desktop styles for mobile helpers */
.roadmap-mobile-tabs {
  display: none;
}

.roadmap-mobile-back-btn {
  display: none;
}

/* =========================================================================
   SOVEREIGN MOBILE-FIRST RESPONSIVE MEDIA QUERIES (RoadmapView)
   ========================================================================= */
@media (max-width: 860px) {
  .roadmap-view {
    padding: 10px 12px calc(80px + env(safe-area-inset-bottom, 0px)) 12px;
    gap: 12px;
    overflow-y: auto;
  }

  .roadmap-top-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 8px 10px;
  }

  .roadmap-mobile-tabs {
    display: flex;
    gap: 8px;
    background: var(--bg-card, #120e06);
    border: 1px solid var(--border-card, #33220a);
    border-radius: 10px;
    padding: 4px;
    width: 100%;
  }

  .roadmap-tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 44px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--text-muted, #d4a373);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .roadmap-tab-btn.active {
    background: var(--emerald-glow, rgba(245, 158, 11, 0.15));
    color: var(--emerald-bright, #fbbf24);
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.15);
  }

  .roadmap-mobile-back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 44px;
    padding: 10px 14px;
    background: var(--bg-surface, #181208);
    border: 1px solid var(--border-card, #33220a);
    border-radius: 8px;
    color: var(--emerald-bright, #fbbf24);
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 12px;
    transition: all 0.15s ease;
  }

  .roadmap-mobile-back-btn:active {
    transform: scale(0.98);
  }

  .roadmap-body {
    display: flex;
    flex-direction: column;
    overflow: visible;
    gap: 14px;
    height: auto;
  }

  .roadmap-column-left,
  .roadmap-column-right {
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .mobile-hidden {
    display: none !important;
  }

  .btn-add-phase-quick {
    min-height: 44px;
    padding: 8px 14px;
  }

  .btn-edit-inline,
  .btn-delete-phase,
  .phase-badge-inline {
    min-height: 44px;
  }

  .practice-check-btn {
    min-width: 32px;
    min-height: 32px;
  }

  .btn-mode-pill {
    min-height: 44px;
    padding: 8px 14px;
    font-size: 13px;
  }
}

/* --- View Mode Switcher Pill Group --- */
.view-mode-pill-group {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  padding: 2px;
  margin-left: 14px;
}

.mode-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-pill-btn:hover {
  color: #f59e0b;
}

.mode-pill-btn.active {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  font-weight: 700;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.15);
}

/* Competitor Benchmark Button */
.btn-competitor-benchmark {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.08) 100%);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fbbf24;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-competitor-benchmark:hover {
  background: rgba(245, 158, 11, 0.28);
  border-color: #fbbf24;
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
}

.benchmark-spark {
  color: #f59e0b;
  font-size: 13px;
}

/* Executive HUD Strip */
.roadmap-hud-strip {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  background: rgba(18, 14, 9, 0.85);
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: 10px;
  margin-bottom: 14px;
  font-size: 12px;
  flex-wrap: wrap;
}

.hud-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.hud-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #9ca3af;
}

.hud-val {
  font-size: 13px;
  font-weight: 700;
  color: #f3f4f6;
}

.hud-val.green { color: #34d399; }
.hud-val.amber { color: #fbbf24; }
.hud-val.blue { color: #60a5fa; }

.hud-divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.08);
}

.velocity-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.velocity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hud-val-bold {
  font-size: 11px;
  font-weight: 800;
  color: #34d399;
}

.hud-progress-track {
  width: 100%;
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.hud-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #10b981);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.hud-spacer {
  flex: 1;
}

.hud-security-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* --- Horizon Matrix (Now / Next / Later / Shipped) --- */
.roadmap-horizons-container {
  flex: 1;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 6px;
}

.horizons-board-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
  min-height: 100%;
}

.horizon-column {
  background: rgba(14, 11, 7, 0.7);
  border: 1px solid rgba(245, 158, 11, 0.16);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.horizon-col-header {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-now { background: #34d399; box-shadow: 0 0 8px #34d399; }
.dot-next { background: #fbbf24; box-shadow: 0 0 8px #fbbf24; }
.dot-later { background: #9ca3af; }
.dot-shipped { background: #60a5fa; box-shadow: 0 0 8px #60a5fa; }

.col-title-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.col-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #f3f4f6;
}

.col-subtitle {
  font-size: 10px;
  color: #9ca3af;
}

.col-count-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
}

.badge-now { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
.badge-next { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
.badge-later { background: rgba(156, 163, 175, 0.15); color: #d1d5db; border: 1px solid rgba(156, 163, 175, 0.3); }
.badge-shipped { background: rgba(96, 165, 250, 0.15); color: #93c5fd; border: 1px solid rgba(96, 165, 250, 0.3); }

.horizon-cards-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
}

.horizon-empty-state {
  padding: 30px 14px;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.horizon-phase-card {
  background: rgba(20, 16, 10, 0.85);
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.horizon-phase-card:hover {
  border-color: rgba(245, 158, 11, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-phase-num {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  color: #fbbf24;
}

.card-status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.pill-now { background: rgba(52, 211, 153, 0.15); color: #34d399; }
.pill-next { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.pill-later { background: rgba(156, 163, 175, 0.15); color: #d1d5db; }
.pill-shipped { background: rgba(96, 165, 250, 0.15); color: #93c5fd; }

.card-phase-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #f9fafb;
}

.card-phase-desc {
  margin: 0;
  font-size: 11.5px;
  color: #9ca3af;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.card-progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.card-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}

.fill-now { background: #34d399; }
.fill-next { background: #fbbf24; }
.fill-later { background: #9ca3af; }
.fill-shipped { background: #60a5fa; }

.card-progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: #9ca3af;
}

.card-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-horizon-shift {
  padding: 4px 8px;
  font-size: 10.5px;
  font-weight: 600;
  color: #d1d5db;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-horizon-shift:hover {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.4);
}

.btn-horizon-open {
  padding: 4px 8px;
  font-size: 10.5px;
  font-weight: 600;
  color: #9ca3af;
  background: transparent;
  border: none;
  cursor: pointer;
}

.btn-horizon-open:hover {
  color: #fbbf24;
}

/* --- Chronology Gantt Timeline --- */
.roadmap-gantt-container {
  flex: 1;
  background: rgba(12, 10, 6, 0.8);
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gantt-header-row {
  display: grid;
  grid-template-columns: 260px 1fr;
  background: rgba(0, 0, 0, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.gantt-phase-col-header {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #9ca3af;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.gantt-timeline-quarters {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.quarter-col {
  padding: 12px 14px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fbbf24;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.gantt-swimlanes-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.gantt-swimlane-row {
  display: grid;
  grid-template-columns: 260px 1fr;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  min-height: 52px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.gantt-swimlane-row:hover {
  background: rgba(245, 158, 11, 0.04);
}

.gantt-swimlane-row.active {
  background: rgba(245, 158, 11, 0.08);
}

.swimlane-label-col {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.swimlane-phase-badge {
  font-size: 10px;
  font-weight: 700;
  color: #fbbf24;
  white-space: nowrap;
}

.swimlane-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #f3f4f6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.swimlane-status-pill {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  white-space: nowrap;
}

.swimlane-track-col {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.04);
  pointer-events: none;
}

.line-1 { left: 25%; }
.line-2 { left: 50%; }
.line-3 { left: 75%; }

.gantt-bar {
  position: absolute;
  height: 28px;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 6px;
  display: flex;
  align-items: center;
  overflow: hidden;
  transition: all 0.2s ease;
}

.gantt-bar:hover {
  border-color: #fbbf24;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
}

.bar-progress-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.45), rgba(16, 185, 129, 0.45));
  transition: width 0.3s ease;
}

.bar-content {
  position: relative;
  z-index: 2;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 11px;
  font-weight: 600;
  color: #fef3c7;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.milestone-diamond {
  position: absolute;
  right: -5px;
  color: #fbbf24;
  font-size: 12px;
  text-shadow: 0 0 6px rgba(245, 158, 11, 0.8);
}
</style>
