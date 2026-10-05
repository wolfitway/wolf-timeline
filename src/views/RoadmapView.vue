<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { useUiStore } from "@/stores/useUiStore";
import type { RoadmapPhase, KeyPractice } from "@/types";

const roadmapStore = useRoadmapStore();
const uiStore = useUiStore();

const newPracticeText = ref("");

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

function handleAddPhasePrompt() {
  const title = prompt("Enter new milestone phase title:", "Architecture Refactor");
  if (title) {
    roadmapStore.addPhase(title);
    uiStore.showToast("New milestone phase created on canvas ✓");
  }
}

function handleDeleteActivePhase() {
  if (!roadmapStore.activePhase) return;
  if (confirm(`Delete milestone "${roadmapStore.activePhase.title}"?`)) {
    roadmapStore.deletePhase(roadmapStore.activePhase.id);
    uiStore.showToast("Phase removed from roadmap ✓");
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
        <span class="roadmap-main-heading">Human-Mode Roadmap</span>
      </div>

      <div class="header-right">
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

    <!-- Main 2-Column Body -->
    <div class="roadmap-body">
      <!-- Left Column: ROADMAP Phases Track -->
      <div class="roadmap-column-left">
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
              @click="handleAddPhasePrompt"
              title="Add New Milestone Phase"
            >
              + Add Phase
            </button>
          </div>

          <div class="phases-connected-list">
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
              @click="roadmapStore.activePhaseId = phase.id"
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
      <div v-if="roadmapStore.activePhase" class="roadmap-column-right">
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
                <button type="button" class="btn-edit-inline" @click="startEditingPhaseTitle" title="Edit phase title">✏️</button>
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
                  class="btn-delete-phase"
                  @click="handleDeleteActivePhase"
                  title="Delete Milestone Phase"
                >
                  🗑️ Delete Phase
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
  gap: 24px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Left Column: Phases Track Card */
.roadmap-column-left {
  height: 100%;
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

.phases-connected-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-right: 4px;
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
  overflow-y: auto;
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

.btn-delete-phase {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.btn-delete-phase:hover {
  background: rgba(239, 68, 68, 0.1);
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
</style>
