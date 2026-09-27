import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { RoadmapPhase, KeyPractice } from "@/types";
import { INITIAL_ROADMAP } from "@/services/seedData";

const STORAGE_KEY = "wolftimeline_roadmap_v3";

export const useRoadmapStore = defineStore("roadmap", () => {
  const phases = ref<RoadmapPhase[]>([]);
  const activePhaseId = ref<string | null>(null);

  // Computed
  const activePhase = computed<RoadmapPhase | null>(() => {
    if (!activePhaseId.value) return phases.value[0] || null;
    return phases.value.find((p) => p.id === activePhaseId.value) || phases.value[0] || null;
  });

  const overallProgress = computed(() => {
    let total = 0;
    let completed = 0;
    phases.value.forEach((p) => {
      p.practices.forEach((pr) => {
        total++;
        if (pr.completed) completed++;
      });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  });

  // Actions
  function saveToLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(phases.value));
    } catch (e) {
      console.error("Failed to save roadmap to localStorage:", e);
    }
  }

  function loadRoadmap() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        phases.value = JSON.parse(raw);
      } catch {
        phases.value = [...INITIAL_ROADMAP];
      }
    } else {
      phases.value = [...INITIAL_ROADMAP];
      saveToLocal();
    }

    if (phases.value.length > 0 && !activePhaseId.value) {
      activePhaseId.value = phases.value[0].id;
    }
  }

  function togglePractice(phaseId: string, practiceId: string) {
    const phase = phases.value.find((p) => p.id === phaseId);
    if (!phase) return;
    const practice = phase.practices.find((pr) => pr.id === practiceId);
    if (practice) {
      practice.completed = !practice.completed;
      saveToLocal();
    }
  }

  function addPractice(phaseId: string, text: string) {
    const phase = phases.value.find((p) => p.id === phaseId);
    if (!phase || !text.trim()) return;
    const newPr: KeyPractice = {
      id: `pr_${Date.now()}`,
      text: text.trim(),
      completed: false,
    };
    phase.practices.push(newPr);
    saveToLocal();
  }

  function updatePracticeText(phaseId: string, practiceId: string, text: string) {
    const phase = phases.value.find((p) => p.id === phaseId);
    if (!phase) return;
    const pr = phase.practices.find((p) => p.id === practiceId);
    if (pr) {
      pr.text = text;
      saveToLocal();
    }
  }

  function deletePractice(phaseId: string, practiceId: string) {
    const phase = phases.value.find((p) => p.id === phaseId);
    if (!phase) return;
    phase.practices = phase.practices.filter((p) => p.id !== practiceId);
    saveToLocal();
  }

  function updatePhase(phaseId: string, updates: Partial<RoadmapPhase>) {
    const idx = phases.value.findIndex((p) => p.id === phaseId);
    if (idx !== -1) {
      phases.value[idx] = { ...phases.value[idx], ...updates };
      saveToLocal();
    }
  }

  function addPhase(title: string = "New Milestone Phase") {
    const num = phases.value.length + 1;
    const newPhase: RoadmapPhase = {
      id: `phase_${Date.now()}`,
      number: num,
      title: `Phase ${num}: ${title}`,
      subtitle: "Strategic Focus & Delivery",
      status: "Planned",
      description: "Define key deliverables and architectural goals for this milestone phase.",
      focus: "Milestone Execution",
      outcome: "Measurable high-leverage outcomes delivered.",
      collapsed: false,
      practices: [{ id: `pr_${Date.now()}_1`, text: "Define initial milestone RFC", completed: false }],
    };
    phases.value.push(newPhase);
    activePhaseId.value = newPhase.id;
    saveToLocal();
  }

  function deletePhase(phaseId: string) {
    phases.value = phases.value.filter((p) => p.id !== phaseId);
    if (activePhaseId.value === phaseId) {
      activePhaseId.value = phases.value[0]?.id || null;
    }
    saveToLocal();
  }

  function togglePhaseCollapsed(phaseId: string) {
    const phase = phases.value.find((p) => p.id === phaseId);
    if (phase) {
      phase.collapsed = !phase.collapsed;
      saveToLocal();
    }
  }

  function toggleAllCollapsed() {
    const hasExpanded = phases.value.some((p) => !p.collapsed);
    phases.value.forEach((p) => {
      p.collapsed = hasExpanded;
    });
    saveToLocal();
  }

  function reorderPractices(phaseId: string, newPractices: KeyPractice[]) {
    const phase = phases.value.find((p) => p.id === phaseId);
    if (!phase) return;
    phase.practices = newPractices;
    saveToLocal();
  }

  function reorderPhases(newPhases: RoadmapPhase[]) {
    phases.value = newPhases;
    saveToLocal();
  }

  function resetToDefaults() {
    phases.value = [...INITIAL_ROADMAP];
    activePhaseId.value = phases.value[0]?.id || null;
    saveToLocal();
  }

  return {
    phases,
    activePhaseId,
    activePhase,
    overallProgress,
    loadRoadmap,
    togglePractice,
    addPractice,
    updatePracticeText,
    deletePractice,
    reorderPractices,
    updatePhase,
    addPhase,
    deletePhase,
    togglePhaseCollapsed,
    toggleAllCollapsed,
    reorderPhases,
    resetToDefaults,
  };
});
