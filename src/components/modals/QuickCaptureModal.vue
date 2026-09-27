<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { useUiStore } from "@/stores/useUiStore";
import { useNotesStore } from "@/stores/useNotesStore";

const uiStore = useUiStore();
const notesStore = useNotesStore();

const title = ref("");
const url = ref("");
const selectedCategory = ref<string>("Idea");
const tags = ref("");
const body = ref("");
const showDetails = ref(false);

const categories = ["Idea", "Task", "Insight", "Note", "Project"];
const titleInputRef = ref<HTMLInputElement | null>(null);

watch(
  () => uiStore.showQuickCapture,
  (open) => {
    if (open) {
      title.value = "";
      url.value = "";
      selectedCategory.value = "Idea";
      tags.value = "";
      body.value = "";
      showDetails.value = false;
      nextTick(() => titleInputRef.value?.focus());
    }
  }
);

async function handleSave() {
  if (!title.value.trim()) return;

  const tagList = tags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter((t) => t.length > 0);

  const kindMap: Record<string, "idea" | "milestone" | "post" | "link"> = {
    Idea: "idea",
    Task: "milestone",
    Insight: "idea",
    Note: "post",
    Project: "milestone",
  };

  const finalBody = body.value.trim() || title.value.trim();

  await notesStore.addNote({
    title: title.value.trim(),
    body: finalBody,
    tags: tagList.length ? tagList : [selectedCategory.value.toLowerCase()],
    kind: kindMap[selectedCategory.value] || "idea",
    status: "ideation",
    funnel_stage: "lead_magnet",
  });

  uiStore.showQuickCapture = false;
  uiStore.showToast("Saved to Encrypted Vault ✓");
}

function handleKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    handleSave();
  } else if (e.key === "Escape") {
    uiStore.showQuickCapture = false;
  }
}
</script>

<template>
  <div v-if="uiStore.showQuickCapture" class="modal-overlay" @click.self="uiStore.showQuickCapture = false">
    <div class="modal-card" @keydown="handleKeyDown">
      <!-- Modal Brand & Title -->
      <div class="modal-header">
        <div class="brand-row">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="wolf-icon"
          >
            <polygon points="4,4 7,11 4,15 9,16 12,20 15,16 20,15 17,11 20,4 14,7 12,5 10,7" />
            <polyline points="8.5,11.5 10,13 12,11.5 14,13 15.5,11.5" />
          </svg>
          <span class="brand-text">WOLF TIMELINE</span>
        </div>
        <h2 class="modal-title">New Idea</h2>
      </div>

      <!-- Form Inputs -->
      <form class="modal-form" @submit.prevent="handleSave">
        <!-- Title / Hook -->
        <div class="form-group">
          <label for="captureTitle" class="form-label">Title / Hook</label>
          <input
            id="captureTitle"
            ref="titleInputRef"
            v-model="title"
            type="text"
            class="form-input"
            placeholder="A new angle on focus and creative flow"
            required
          />
        </div>

        <!-- URL (optional) -->
        <div class="form-group">
          <label for="captureUrl" class="form-label">URL (optional)</label>
          <div class="input-with-icon">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" class="input-icon">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <input
              id="captureUrl"
              v-model="url"
              type="text"
              class="form-input icon-input"
              placeholder="Paste URL here"
            />
          </div>
        </div>

        <!-- Category Pills -->
        <div class="form-group">
          <label class="form-label">Category</label>
          <div class="category-pill-group">
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="category-pill"
              :class="{ active: selectedCategory === cat }"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Tags (optional) -->
        <div class="form-group">
          <label for="captureTags" class="form-label">Tags (optional)</label>
          <div class="input-with-icon">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" class="input-icon">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            <input
              id="captureTags"
              v-model="tags"
              type="text"
              class="form-input icon-input"
              placeholder="Add tags..."
            />
          </div>
        </div>

        <!-- Expandable Details Textarea -->
        <div v-if="showDetails" class="form-group">
          <label for="captureBody" class="form-label">Extended Notes / Context</label>
          <textarea
            id="captureBody"
            v-model="body"
            class="form-textarea"
            rows="3"
            placeholder="Add context, strategy, or execution details..."
          ></textarea>
        </div>

        <!-- Action Button -->
        <button type="submit" class="btn-save-vault">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Save to Encrypted Vault</span>
        </button>

        <!-- Sub Links -->
        <div class="modal-footer-links">
          <button
            type="button"
            class="btn-link-details"
            @click="showDetails = !showDetails"
          >
            {{ showDetails ? "– Hide details" : "+ Add more details" }}
          </button>
          <span class="save-shortcut-hint">⌘ + Enter to save</span>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  animation: fadeIn 0.15s ease-out;
}

.modal-card {
  width: 100%;
  max-width: 460px;
  background: #06140f;
  border: 1px solid #0f2b1d;
  border-radius: 18px;
  padding: 32px 36px 28px 36px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(16, 185, 129, 0.08);
  animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--emerald-bright, #34d399);
}

.wolf-icon {
  filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.5));
}

.brand-text {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #34d399;
}

.modal-title {
  font-family: var(--font-display, "Outfit", sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
}

.form-input {
  background: #040e0a;
  border: 1px solid #0e271c;
  border-radius: 10px;
  padding: 11px 14px;
  color: #ffffff;
  font-size: 13px;
  outline: none;
  transition: all 0.15s ease;
}

.form-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.15);
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #64748b;
  pointer-events: none;
}

.icon-input {
  width: 100%;
  padding-left: 36px;
}

.category-pill-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.category-pill {
  background: #05120c;
  border: 1px solid #0e271c;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.category-pill:hover {
  background: #092017;
  color: #ffffff;
  border-color: #143d2a;
}

.category-pill.active {
  background: #082117;
  border-color: #10b981;
  color: #34d399;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.15);
}

.form-textarea {
  background: #040e0a;
  border: 1px solid #0e271c;
  border-radius: 10px;
  padding: 10px 14px;
  color: #ffffff;
  font-size: 12.5px;
  outline: none;
  resize: vertical;
}

.form-textarea:focus {
  border-color: #10b981;
}

.btn-save-vault {
  width: 100%;
  height: 46px;
  margin-top: 6px;
  background: #10b981;
  border: none;
  border-radius: 10px;
  color: #03120a;
  font-size: 13.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
}

.btn-save-vault:hover {
  background: #34d399;
  transform: translateY(-1px);
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.55);
}

.modal-footer-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.btn-link-details {
  background: transparent;
  border: none;
  color: #34d399;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-link-details:hover {
  text-decoration: underline;
}

.save-shortcut-hint {
  font-size: 11px;
  color: #64748b;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
