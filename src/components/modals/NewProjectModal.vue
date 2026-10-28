<script setup lang="ts">
import { ref } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useProjectsStore } from "@/stores/useProjectsStore";
import { kokoroVoice } from "@/services/voiceGuide";

const uiStore = useUiStore();
const projectsStore = useProjectsStore();

const title = ref("");
const emoji = ref("🚀");
const description = ref("");
const targetQuarter = ref("Q1 2027");
const seedKickoffNote = ref(true);
const seedMilestones = ref(true);

const EMOJI_OPTIONS = ["🚀", "🐺", "📱", "⚡", "💎", "🎯", "🛠️", "💡", "🌐", "🔒", "✍️", "🔮", "📊", "🧠", "🔥"];

function handleSelectEmoji(e: string) {
  emoji.value = e;
}

function handleCreateProject() {
  if (!title.value.trim()) return;

  const created = projectsStore.addProject({
    title: title.value.trim(),
    emoji: emoji.value,
    description: description.value.trim(),
    targetQuarter: targetQuarter.value,
    seedKickoffNote: seedKickoffNote.value,
    seedMilestones: seedMilestones.value,
  });

  kokoroVoice.playHeartChime("affirm");
  kokoroVoice.speak(`Created workspace for ${created.title}.`);
  uiStore.showToast(`✨ Created Project "${created.emoji} ${created.title}" with dedicated notes & roadmap! ✓`);

  // Reset form & close
  title.value = "";
  description.value = "";
  emoji.value = "🚀";
  uiStore.closeNewProjectModal();
}

function closeModal() {
  uiStore.closeNewProjectModal();
}
</script>

<template>
  <div v-if="uiStore.showNewProjectModal" class="project-modal-backdrop" @click.self="closeModal">
    <div class="project-modal-card" role="dialog" aria-modal="true" aria-label="Create New Project Workspace">
      <!-- Header -->
      <div class="project-modal-header">
        <div class="header-title-col">
          <div class="header-row">
            <span class="header-icon">📁</span>
            <h2 class="header-title">Create New Project Workspace</h2>
          </div>
          <p class="header-sub">Each project includes its own isolated notes, roadmap horizons, tasks, and research bookmarks.</p>
        </div>
        <button type="button" class="btn-close" @click="closeModal" title="Close (Esc)">✕</button>
      </div>

      <!-- Form Body -->
      <form class="project-form" @submit.prevent="handleCreateProject">
        <!-- Title & Emoji -->
        <div class="form-row">
          <div class="emoji-picker-col">
            <label class="form-label">Icon</label>
            <div class="selected-emoji-display">{{ emoji }}</div>
          </div>
          <div class="title-input-col">
            <label class="form-label">Project Title <span class="required">*</span></label>
            <input
              type="text"
              v-model="title"
              class="form-input"
              placeholder="e.g. Next-Gen Mobile Companion"
              required
              autofocus
            />
          </div>
        </div>

        <!-- Emoji Quick Select Strip -->
        <div class="emoji-quick-strip">
          <button
            v-for="em in EMOJI_OPTIONS"
            :key="em"
            type="button"
            class="btn-emoji-quick"
            :class="{ active: emoji === em }"
            @click="handleSelectEmoji(em)"
          >
            {{ em }}
          </button>
        </div>

        <!-- Description / Mission -->
        <div class="form-group">
          <label class="form-label">Objective / Architecture Goal</label>
          <textarea
            v-model="description"
            class="form-textarea"
            rows="3"
            placeholder="Outline the core objective, deliverable scope, or architecture thesis..."
          ></textarea>
        </div>

        <!-- Target Quarter -->
        <div class="form-group">
          <label class="form-label">Target Milestone Horizon</label>
          <input
            type="text"
            v-model="targetQuarter"
            class="form-input"
            placeholder="e.g. Q1 2027 or Nov 2026"
          />
        </div>

        <!-- Automation Toggles -->
        <div class="form-toggles">
          <label class="checkbox-label">
            <input type="checkbox" v-model="seedKickoffNote" />
            <span>📝 Pre-seed dedicated Kickoff &amp; Specs Note</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="seedMilestones" />
            <span>🗺️ Pre-seed initial Horizon Milestones on Roadmap</span>
          </label>
        </div>

        <!-- Actions -->
        <div class="modal-actions-row">
          <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
          <button type="submit" class="btn-create" :disabled="!title.trim()">
            <span>✨ Create Project Workspace</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.project-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.project-modal-card {
  background: var(--bg-card, #0b1410);
  border: 1px solid var(--border-card, #162a21);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75), 0 0 32px var(--border-glow, rgba(16, 185, 129, 0.2));
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.project-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border-card, #162a21);
  background: var(--bg-surface, #0f1c16);
}

.header-title-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
}

.header-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-white, #ffffff);
  margin: 0;
}

.header-sub {
  font-size: 12px;
  color: var(--text-secondary, #9ca3af);
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted, #6ee7b7);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-white, #ffffff);
}

.project-form {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.emoji-picker-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.selected-emoji-display {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--bg-inner, #070e0b);
  border: 1px solid var(--border-card, #162a21);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.title-input-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #6ee7b7);
}

.form-label .required {
  color: var(--emerald-bright, #34d399);
}

.form-input, .form-textarea {
  background: var(--bg-inner, #070e0b);
  border: 1px solid var(--border-card, #162a21);
  border-radius: 8px;
  padding: 9px 12px;
  color: var(--text-white, #ffffff);
  font-size: 13.5px;
  outline: none;
  font-family: inherit;
}

.form-input:focus, .form-textarea:focus {
  border-color: var(--emerald-main, #10b981);
  box-shadow: 0 0 10px var(--border-glow, rgba(16, 185, 129, 0.25));
}

.emoji-quick-strip {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.btn-emoji-quick {
  background: var(--bg-inner, #070e0b);
  border: 1px solid var(--border-subtle, #14281f);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-emoji-quick:hover {
  border-color: var(--emerald-main, #10b981);
  transform: scale(1.1);
}

.btn-emoji-quick.active {
  background: var(--emerald-pill-bg, #063324);
  border-color: var(--emerald-bright, #34d399);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-inner, #070e0b);
  border: 1px solid var(--border-subtle, #14281f);
  border-radius: 8px;
  padding: 10px 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-secondary, #9ca3af);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  accent-color: var(--emerald-main, #10b981);
  width: 15px;
  height: 15px;
}

.modal-actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

.btn-cancel {
  background: var(--bg-surface, #0f1c16);
  border: 1px solid var(--border-subtle, #14281f);
  color: var(--text-secondary, #9ca3af);
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-create {
  background: var(--emerald-main, #10b981);
  border: 1px solid var(--emerald-bright, #34d399);
  color: var(--bg-canvas, #040c08);
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-create:hover:not(:disabled) {
  background: var(--emerald-bright, #34d399);
  box-shadow: 0 0 16px var(--border-glow, rgba(16, 185, 129, 0.4));
  transform: translateY(-1px);
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
