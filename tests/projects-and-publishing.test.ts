import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useProjectsStore, INITIAL_PROJECTS } from "@/stores/useProjectsStore";
import { useNotesStore } from "@/stores/useNotesStore";
import { useRoadmapStore } from "@/stores/useRoadmapStore";
import { generateClientDossierHtml } from "@/services/clientDossierExporter";
import type { Note } from "@/types";

describe("Multi-Project Workspaces & Notion-Style Web Publisher Suite", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    (globalThis as any).localStorage?.clear?.();
  });

  it("initializes projects store with default projects", () => {
    const projectsStore = useProjectsStore();
    expect(projectsStore.projects.length).toBeGreaterThanOrEqual(3);
    expect(projectsStore.activeProjectId).toBe("all");
    expect(projectsStore.activeProject).toBeNull();
  });

  it("creates a new isolated project with dedicated kickoff note and roadmap milestone", async () => {
    const projectsStore = useProjectsStore();
    const notesStore = useNotesStore();
    const roadmapStore = useRoadmapStore();

    const initialNotesCount = notesStore.notes.length;
    const initialPhasesCount = roadmapStore.phases.length;

    const newProject = projectsStore.addProject({
      title: "Decentralized AI Agents Hub",
      emoji: "🤖",
      description: "Autonomous multi-agent swarms operating in air-gapped sovereign environments.",
      targetQuarter: "Q3 2027",
      seedKickoffNote: true,
      seedMilestones: true,
    });

    expect(newProject.title).toBe("Decentralized AI Agents Hub");
    expect(newProject.emoji).toBe("🤖");
    expect(projectsStore.activeProjectId).toBe(newProject.id);
    expect(projectsStore.activeProject?.title).toBe("Decentralized AI Agents Hub");

    // Allow async addNote to resolve
    await new Promise((r) => setTimeout(r, 25));

    // Verified seeded kickoff note exists
    const kickoffNote = notesStore.notes.find((n) => n.projectId === newProject.id);
    expect(kickoffNote).toBeDefined();
    expect(kickoffNote?.title).toContain("Decentralized AI Agents Hub");
    expect(notesStore.notes.length).toBe(initialNotesCount + 1);

    // Verified seeded roadmap phase exists
    const phase = roadmapStore.phases.find((p) => p.projectId === newProject.id);
    expect(phase).toBeDefined();
    expect(phase?.title).toContain("Decentralized AI Agents Hub");
    expect(roadmapStore.phases.length).toBe(initialPhasesCount + 1);
  });

  it("filters notes by active project", async () => {
    const projectsStore = useProjectsStore();
    const notesStore = useNotesStore();

    // Create Project A and Project B
    const projA = projectsStore.addProject({ title: "Project Alpha", emoji: "🐺" });
    const projB = projectsStore.addProject({ title: "Project Beta", emoji: "⚡" });
    await new Promise((r) => setTimeout(r, 25));

    // Filter to Project A
    notesStore.selectedProjectId = projA.id;
    const filteredForA = notesStore.filteredNotes;
    expect(filteredForA.every((n) => !n.projectId || n.projectId === projA.id)).toBe(true);

    // Filter to Project B
    notesStore.selectedProjectId = projB.id;
    const filteredForB = notesStore.filteredNotes;
    expect(filteredForB.every((n) => !n.projectId || n.projectId === projB.id)).toBe(true);
  });

  it("generates interactive Notion-style website with table of contents and theme toggle", async () => {
    const sampleNote: Note = {
      id: 999,
      title: "Self-Sovereign Architecture Manifesto",
      body: `### Core Principles\nZero-telemetry cryptographic operations.\n\n### Deliverables\n- [ ] Multi-region mirror\n- [x] Air-gapped vault verification\n\n\`\`\`typescript\nconst offline = true;\n\`\`\``,
      created_at: "2026-10-28T00:00:00.000Z",
      tags: ["manifesto", "sovereign"],
      kind: "milestone",
      status: "live",
      funnel_stage: "revenue",
    };

    const res = await generateClientDossierHtml(sampleNote, {
      siteMode: true,
      includeTableOfContents: true,
      theme: "emerald",
    });

    expect(res.html).toContain("<!DOCTYPE html>");
    expect(res.html).toContain("Self-Sovereign Architecture Manifesto");
    expect(res.html).toContain("Zero-telemetry cryptographic operations");
    // Table of contents verification
    expect(res.html).toContain("table-of-contents");
    expect(res.html).toContain("Core Principles");
    expect(res.html).toContain("Deliverables");
    // Interactive script embedded
    expect(res.html).toContain("toggleSiteTheme");
    expect(res.html).toContain("btn-copy-code");
  });
});
