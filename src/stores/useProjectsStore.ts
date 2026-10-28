import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Project } from "@/types";
import { useNotesStore } from "@/stores/useNotesStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";

const STORAGE_KEY = "wolftimeline_projects_v1";

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-alpha",
    title: "Alpha Sovereign Node",
    emoji: "🐺",
    description: "Core air-gapped cryptographic workstation, offline local-first vault, and audit attestation.",
    created_at: "2026-10-27T08:00:00.000Z",
    targetQuarter: "Q4 2026",
    color: "#10b981",
  },
  {
    id: "proj-creator",
    title: "Creator Studio & Funnel",
    emoji: "✍️",
    description: "Markdown writing studio, client dossier generator, and social media viral funnel distribution.",
    created_at: "2026-10-27T10:00:00.000Z",
    targetQuarter: "Q1 2027",
    color: "#3b82f6",
  },
  {
    id: "proj-mobile",
    title: "Mobile Node & Sync",
    emoji: "📱",
    description: "Encrypted cross-device local WiFi replication and hands-free voice companion interface.",
    created_at: "2026-10-27T12:00:00.000Z",
    targetQuarter: "Q2 2027",
    color: "#f59e0b",
  },
];

export const useProjectsStore = defineStore("projects", () => {
  const projects = ref<Project[]>(loadInitialProjects());
  const activeProjectId = ref<string>("all");

  function loadInitialProjects(): Project[] {
    if (typeof localStorage === "undefined") return INITIAL_PROJECTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to read projects from storage, using seed:", e);
    }
    return INITIAL_PROJECTS;
  }

  function saveProjects() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.value));
    } catch (e) {
      console.error("Failed to save projects to storage:", e);
    }
  }

  const activeProject = computed<Project | null>(() => {
    if (activeProjectId.value === "all") return null;
    return projects.value.find((p) => p.id === activeProjectId.value) || null;
  });

  function setActiveProject(id: string) {
    activeProjectId.value = id;
  }

  function addProject(payload: {
    title: string;
    emoji?: string;
    description?: string;
    targetQuarter?: string;
    color?: string;
    seedKickoffNote?: boolean;
    seedMilestones?: boolean;
  }): Project {
    const newId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: newId,
      title: payload.title.trim() || "Untitled Project",
      emoji: payload.emoji || "🚀",
      description: payload.description || "",
      created_at: new Date().toISOString(),
      targetQuarter: payload.targetQuarter || "Q1 2027",
      color: payload.color || "#10b981",
    };

    projects.value.unshift(newProject);
    saveProjects();
    activeProjectId.value = newId;

    // Optional: Seed Kickoff Note in notesStore
    if (payload.seedKickoffNote !== false) {
      const notesStore = useNotesStore();
      notesStore.addNote({
        title: `${newProject.emoji} ${newProject.title} — Project Kickoff & Specs`,
        body: `### 🎯 Project Overview: ${newProject.title}\n${newProject.description || "Executive kickoff documentation and architecture roadmap."}\n\n### 📋 Horizon Deliverables\n- [ ] Define system requirements & interface specs\n- [ ] Assemble reference research bookmarks\n- [ ] Establish initial milestone timeline`,
        tags: ["project", "kickoff", newProject.title.toLowerCase().replace(/[^a-z0-9]/g, "")],
        kind: "milestone",
        status: "ideation",
        funnel_stage: "product",
        projectId: newId,
      }).then((note) => {
        if (note) notesStore.selectNote(note.id);
      });
    }

    // Optional: Seed Roadmap Phase in roadmapStore
    if (payload.seedMilestones !== false) {
      const roadmapStore = useRoadmapStore();
      const phaseNum = roadmapStore.phases.length + 1;
      const added = roadmapStore.addPhase(
        `${newProject.title} — Foundation`,
        `Initialize ${newProject.title} architecture and core deliverable pipeline.`
      );
      if (added) {
        added.projectId = newId;
        added.status = "Up Next";
        added.targetQuarter = newProject.targetQuarter;
        added.practices = [
          { id: `pr-${Date.now()}-1`, text: `Draft ${newProject.title} functional specifications`, completed: false },
          { id: `pr-${Date.now()}-2`, text: `Deploy initial prototype to private testbed`, completed: false },
        ];
      }
    }

    return newProject;
  }

  function updateProject(id: string, updates: Partial<Project>) {
    const idx = projects.value.findIndex((p) => p.id === id);
    if (idx !== -1) {
      projects.value[idx] = { ...projects.value[idx], ...updates };
      saveProjects();
    }
  }

  function deleteProject(id: string) {
    projects.value = projects.value.filter((p) => p.id !== id);
    saveProjects();
    if (activeProjectId.value === id) {
      activeProjectId.value = "all";
    }
  }

  return {
    projects,
    activeProjectId,
    activeProject,
    setActiveProject,
    addProject,
    updateProject,
    deleteProject,
  };
});
