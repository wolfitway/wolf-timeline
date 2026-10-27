import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { RoadmapPhase, KeyPractice, RoadmapHorizon } from "@/types";
import { INITIAL_ROADMAP } from "@/services/seedData";
import { dbGetRoadmap, dbSaveRoadmap } from "@/services/vaultDatabase";

const STORAGE_KEY = "wolftimeline_roadmap_v3";
const BACKUP_STORAGE_KEY = "wolftimeline_roadmap_backup";
const LEGACY_STORAGE_KEYS = [
  "wolftimeline_roadmap_v2",
  "wolftimeline_roadmap_v1",
  "wolftimeline_roadmap",
  "wolf_roadmap",
];

export interface RoadmapVersionSummary {
  source: string;
  sourceKey: string;
  phaseCount: number;
  previewTitles: string[];
  isCustom: boolean;
  phases: RoadmapPhase[];
}

export function getPhaseHorizon(phase: RoadmapPhase): RoadmapHorizon {
  if (phase.horizon) return phase.horizon;
  if (phase.status === "In Progress") return "now";
  if (phase.status === "Up Next") return "next";
  if (phase.status === "Live") return "shipped";
  return "later";
}

function isDefaultRoadmap(phaseList: RoadmapPhase[]): boolean {
  if (!phaseList || phaseList.length !== INITIAL_ROADMAP.length) return false;
  return phaseList.every((p, i) => {
    const init = INITIAL_ROADMAP[i];
    if (!init) return false;
    return p.title === init.title && p.subtitle === init.subtitle && p.practices.length === init.practices.length;
  });
}

export const useRoadmapStore = defineStore("roadmap", () => {
  const phases = ref<RoadmapPhase[]>([]);
  const activePhaseId = ref<string | null>(null);
  const detectedVersions = ref<RoadmapVersionSummary[]>([]);
  const viewMode = ref<"track" | "horizons" | "gantt">("track");

  // Computed
  const activePhase = computed<RoadmapPhase | null>(() => {
    if (!activePhaseId.value) return phases.value[0] || null;
    return phases.value.find((p) => p.id === activePhaseId.value) || phases.value[0] || null;
  });

  const totalPracticesCount = computed(() => {
    return phases.value.reduce((acc, p) => acc + (p.practices?.length || 0), 0);
  });

  const completedPracticesCount = computed(() => {
    return phases.value.reduce(
      (acc, p) => acc + (p.practices?.filter((pr) => pr.completed).length || 0),
      0
    );
  });

  const overallProgress = computed(() => {
    const total = totalPracticesCount.value;
    const completed = completedPracticesCount.value;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  });

  const phasesByHorizon = computed<Record<RoadmapHorizon, RoadmapPhase[]>>(() => {
    const map: Record<RoadmapHorizon, RoadmapPhase[]> = {
      now: [],
      next: [],
      later: [],
      shipped: [],
    };
    phases.value.forEach((p) => {
      const h = getPhaseHorizon(p);
      map[h].push(p);
    });
    return map;
  });

  function setPhaseHorizon(phaseId: string, horizon: RoadmapHorizon) {
    const target = phases.value.find((p) => p.id === phaseId);
    if (!target) return;
    target.horizon = horizon;
    if (horizon === "now") target.status = "In Progress";
    else if (horizon === "next") target.status = "Up Next";
    else if (horizon === "shipped") target.status = "Live";
    else if (horizon === "later") target.status = "Planned";
    saveToLocal();
  }

  // Actions
  function saveToLocal() {
    // 1. Persist directly to Sovereign IndexedDB Vault DB
    dbSaveRoadmap(phases.value).catch((e) => console.warn("Vault DB save roadmap error:", e));

    // 2. Persist to LocalStorage primary and backup mirror
    try {
      const serialized = JSON.stringify(phases.value);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(BACKUP_STORAGE_KEY, serialized);
    } catch (e) {
      console.error("Failed to save roadmap to localStorage:", e);
    }
  }

  async function loadRoadmap() {
    let loaded: RoadmapPhase[] | null = null;
    const candidates: RoadmapVersionSummary[] = [];

    // 1. Check Sovereign IndexedDB Vault DB
    try {
      const idbPhases = await dbGetRoadmap();
      if (Array.isArray(idbPhases) && idbPhases.length > 0) {
        candidates.push({
          source: "Sovereign Vault IndexedDB",
          sourceKey: "idb",
          phaseCount: idbPhases.length,
          previewTitles: idbPhases.map((p) => p.title),
          isCustom: !isDefaultRoadmap(idbPhases),
          phases: idbPhases,
        });
      }
    } catch (e) {
      console.warn("Could not read roadmap from Sovereign Vault DB:", e);
    }

    // 2. Check all primary, backup, and legacy LocalStorage keys
    const keysToCheck = [
      { key: STORAGE_KEY, label: "Primary Storage (v3)" },
      { key: BACKUP_STORAGE_KEY, label: "Backup Storage Mirror" },
      { key: "wolftimeline_roadmap_v2", label: "Legacy Storage (v2)" },
      { key: "wolftimeline_roadmap_v1", label: "Legacy Storage (v1)" },
      { key: "wolftimeline_roadmap", label: "Legacy Root Storage" },
      { key: "wolf_roadmap", label: "Legacy Wolf Storage" },
      { key: "wolf_roadmap_data", label: "Legacy Data Storage" },
      { key: "wolf_roadmap_phases", label: "Legacy Phases Storage" },
    ];

    for (const item of keysToCheck) {
      try {
        const raw = localStorage.getItem(item.key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            candidates.push({
              source: item.label,
              sourceKey: item.key,
              phaseCount: parsed.length,
              previewTitles: parsed.map((p: any) => p.title || "Untitled Phase"),
              isCustom: !isDefaultRoadmap(parsed),
              phases: parsed,
            });
          }
        }
      } catch {}
    }

    detectedVersions.value = candidates;

    // Smart prioritization:
    // If any candidate contains user-customized roadmap phases, adopt it!
    const customCandidate = candidates.find((c) => c.isCustom);
    if (customCandidate) {
      loaded = customCandidate.phases;
      console.info(`Loaded custom roadmap from ${customCandidate.source} (${loaded.length} phases) ✓`);
    } else if (candidates.length > 0) {
      loaded = candidates[0].phases;
    }

    if (loaded && loaded.length > 0) {
      phases.value = loaded;
      saveToLocal();
    } else {
      phases.value = [...INITIAL_ROADMAP];
      saveToLocal();
    }

    if (phases.value.length > 0 && !activePhaseId.value) {
      activePhaseId.value = phases.value[0].id;
    }
  }

  function restoreRoadmapFromVersion(sourceKey: string): boolean {
    const target = detectedVersions.value.find((v) => v.sourceKey === sourceKey);
    if (target) {
      phases.value = target.phases;
      saveToLocal();
      if (phases.value.length > 0) {
        activePhaseId.value = phases.value[0].id;
      }
      return true;
    }
    return false;
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

  function addPhase(title: string = "New Milestone Phase", description?: string) {
    const num = phases.value.length + 1;
    const cleanTitle = title.startsWith("Phase") ? title : `Phase ${num}: ${title}`;
    const newPhase: RoadmapPhase = {
      id: `phase_${Date.now()}`,
      number: num,
      title: cleanTitle,
      subtitle: "Strategic Focus & Delivery",
      status: "Planned",
      description: description || "Define key deliverables and architectural goals for this milestone phase.",
      focus: "Milestone Execution",
      outcome: "Measurable high-leverage outcomes delivered.",
      collapsed: false,
      practices: [{ id: `pr_${Date.now()}_1`, text: "Define initial milestone RFC", completed: false }],
    };
    phases.value.push(newPhase);
    activePhaseId.value = newPhase.id;
    saveToLocal();
    return newPhase;
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
    viewMode,
    phasesByHorizon,
    totalPracticesCount,
    completedPracticesCount,
    getPhaseHorizon,
    setPhaseHorizon,
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
    detectedVersions,
    restoreRoadmapFromVersion,
  };
});
