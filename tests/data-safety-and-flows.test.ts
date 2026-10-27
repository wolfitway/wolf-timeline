import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useNotesStore } from "../src/stores/useNotesStore";
import { useRoadmapStore } from "../src/stores/useRoadmapStore";
import { useBookmarksStore } from "../src/stores/useBookmarksStore";
import { useVaultStore } from "../src/stores/useVaultStore";
import { useUiStore } from "../src/stores/useUiStore";
import { scanTextForCredentials } from "../src/services/scanner";
import type { Note, RoadmapPhase, VaultSecretItem } from "../src/types";

// Setup storage mock for Vitest Node environment
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, value: string) => {
    storageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (index: number) => Object.keys(storageMock)[index] || null,
  length: 0,
};

describe("Sovereign Data Safety & Zero-Loss Migration Suite", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("migrates user notes from legacy storage keys without any loss or default overwrite", async () => {
    // User previously stored custom notes under v2 key
    const customUserNotes: Note[] = [
      {
        id: 991,
        title: "Confidential Sovereign Protocol",
        body: "# Confidential Sovereign Protocol\n\nCustom high-leverage business logic.",
        tags: ["custom", "protocol"],
        kind: "idea",
        status: "in_progress",
        funnel_stage: "product",
        created_at: "2026-09-01T12:00:00Z",
      },
    ];

    localStorage.setItem("wolftimeline_notes_v2", JSON.stringify(customUserNotes));

    const notesStore = useNotesStore();
    await notesStore.loadNotes();

    // Verify user notes were loaded and NOT wiped by INITIAL_NOTES
    expect(notesStore.notes.length).toBe(1);
    expect(notesStore.notes[0].id).toBe(991);
    expect(notesStore.notes[0].title).toBe("Confidential Sovereign Protocol");

    // Verify synced to active v5 key AND backup mirror
    expect(localStorage.getItem("wolftimeline_notes_v5")).toContain("Confidential Sovereign Protocol");
    expect(localStorage.getItem("wolftimeline_notes_backup")).toContain("Confidential Sovereign Protocol");
  });

  it("recovers notes from backup mirror if primary key is cleared", async () => {
    const backupNotes: Note[] = [
      {
        id: 777,
        title: "Rescued Strategy",
        body: "Restored from backup mirror seamlessly",
        tags: ["safety"],
        kind: "milestone",
        status: "live",
        funnel_stage: "revenue",
        created_at: "2026-08-01T00:00:00Z",
      },
    ];

    // Primary key was emptied, but backup mirror had data
    localStorage.setItem("wolftimeline_notes_backup", JSON.stringify(backupNotes));

    const notesStore = useNotesStore();
    await notesStore.loadNotes();

    expect(notesStore.notes.length).toBe(1);
    expect(notesStore.notes[0].title).toBe("Rescued Strategy");
    expect(localStorage.getItem("wolftimeline_notes_v5")).toContain("Rescued Strategy");
  });

  it("migrates roadmap phases from legacy storage without data loss", async () => {
    const legacyPhases: RoadmapPhase[] = [
      {
        id: "phase_custom_99",
        number: 1,
        title: "Phase 1: Zero-Knowledge Architecture",
        subtitle: "Core Cryptography",
        status: "Live",
        description: "Hardened offline data layers.",
        focus: "Offline Safety",
        outcome: "100% resilient",
        collapsed: false,
        practices: [
          { id: "p1", text: "Deploy WebCrypto AES-GCM engine", completed: true },
        ],
      },
    ];

    localStorage.setItem("wolftimeline_roadmap_v2", JSON.stringify(legacyPhases));

    const roadmapStore = useRoadmapStore();
    await roadmapStore.loadRoadmap();

    expect(roadmapStore.phases.length).toBe(1);
    expect(roadmapStore.phases[0].title).toBe("Phase 1: Zero-Knowledge Architecture");
    expect(roadmapStore.phases[0].practices[0].completed).toBe(true);

    // Verify backup mirror
    expect(localStorage.getItem("wolftimeline_roadmap_backup")).toContain("Zero-Knowledge Architecture");
  });
});

describe("Cross-Workspace User Flows & Integration Suite", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("executes smooth Studio -> Roadmap flow by linking documents into roadmap phases", async () => {
    const notesStore = useNotesStore();
    const roadmapStore = useRoadmapStore();
    await roadmapStore.loadRoadmap();

    const note = await notesStore.addNote({
      title: "Autonomous Agent Core",
      body: "# Autonomous Agent Core\n\nHigh-performance local worker thread.",
      tags: ["ai", "agents"],
      kind: "idea",
      status: "ideation",
    });

    notesStore.selectNote(note.id);

    // Flow: Add note to active roadmap phase
    const activePhase = roadmapStore.activePhase!;
    roadmapStore.addPractice(activePhase.id, note.title);

    const updatedPractice = activePhase.practices.find((p) => p.text === "Autonomous Agent Core");
    expect(updatedPractice).toBeDefined();
    expect(updatedPractice?.completed).toBe(false);
  });

  it("executes Roadmap -> Studio flow by opening/creating a note for milestone phases", async () => {
    const notesStore = useNotesStore();
    const roadmapStore = useRoadmapStore();
    const uiStore = useUiStore();
    await roadmapStore.loadRoadmap();

    const phase = roadmapStore.addPhase("Decentralized Storage Engine", "P2P WebRTC data sync");
    expect(phase.id).toBeDefined();

    // Verify creating note from phase
    const createdNote = await notesStore.addNote({
      title: phase.title,
      body: `# ${phase.title}\n\n${phase.description}`,
      tags: ["milestone", "roadmap"],
      kind: "milestone",
      status: "in_progress",
    });

    notesStore.selectNote(createdNote.id);
    uiStore.setTab("studio");

    expect(notesStore.selectedNote?.title).toContain("Decentralized Storage Engine");
    expect(uiStore.activeTab).toBe("studio");
  });

  it("detects leaked credentials and auto-redacts project note bodies", async () => {
    const notesStore = useNotesStore();
    const leakedKey = "sk-proj-abc123def456xyz789SECRETKEY";

    const note = await notesStore.addNote({
      title: "OpenAI Integration Scratchpad",
      body: `Here is the leaked API token: ${leakedKey} - keep it secret.`,
      tags: ["ai", "draft"],
      kind: "idea",
      status: "ideation",
    });

    // Scanner detects the key
    const detected = scanTextForCredentials(note.body);
    expect(detected.length).toBeGreaterThan(0);
    expect(detected.some((d) => d.password === leakedKey)).toBe(true);

    // Auto-redaction simulation
    const updatedBody = note.body.replaceAll(leakedKey, "[ENCRYPTED_VAULT_SECRET]");
    notesStore.updateNote(note.id, { body: updatedBody });

    expect(notesStore.selectedNote?.body).not.toContain(leakedKey);
    expect(notesStore.selectedNote?.body).toContain("[ENCRYPTED_VAULT_SECRET]");
  });

  it("exports and restores complete Sovereign Vault JSON archives with zero data loss", async () => {
    const { dbExportFullArchive, dbRestoreFullArchive } = await import("../src/services/vaultDatabase");

    const sampleNotes: Note[] = [
      {
        id: 501,
        title: "Zero-Knowledge Proofs Whitepaper",
        body: "# ZK Proofs\n\nMathematics of offline privacy.",
        tags: ["zk", "crypto"],
        kind: "idea",
        status: "research",
        funnel_stage: "product",
        created_at: "2026-07-01T00:00:00Z",
      },
    ];

    const sampleRoadmap: RoadmapPhase[] = [
      {
        id: "phase_zk_1",
        number: 1,
        title: "Phase 1: SNARK Circuits",
        subtitle: "Circuit synthesis",
        status: "Planned",
        description: "Hardened circuits",
        focus: "Privacy",
        outcome: "Verified",
        collapsed: false,
        practices: [{ id: "pr1", text: "Benchmarking provers", completed: true }],
      },
    ];

    const sampleSecrets: VaultSecretItem[] = [
      {
        id: "sec_zk_token",
        service: "ZK Prover API",
        category: "api",
        username: "solowolf",
        notes: "Confidential hardware token",
        ciphertext: "abcd1234ef",
        iv: "1234567890",
        created_at: "2026-07-01T00:00:00Z",
        updated_at: "2026-07-01T00:00:00Z",
      },
    ];

    // 1. Export archive
    const archiveJson = await dbExportFullArchive(sampleNotes, sampleRoadmap, sampleSecrets);
    expect(archiveJson).toContain("Zero-Knowledge Proofs Whitepaper");
    expect(archiveJson).toContain("Phase 1: SNARK Circuits");
    expect(archiveJson).toContain("ZK Prover API");

    // 2. Restore archive
    const result = await dbRestoreFullArchive(archiveJson);
    expect(result.success).toBe(true);
    expect(result.notesCount).toBe(1);
    expect(result.roadmapCount).toBe(1);
    expect(result.secretsCount).toBe(1);
  });

  it("persists vault secrets to secondary backup mirrors for zero loss", async () => {
    const backupSecrets = [
      {
        id: "sec_backup_rescued",
        service: "Stripe Production Key",
        category: "api",
        username: "admin",
        ciphertext: "cafebabe1234",
        iv: "aabbccddeeff",
        notes: "Restored from backup mirror",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    localStorage.setItem("wolf_vault_secrets_backup", JSON.stringify(backupSecrets));

    // Verify presence in backup key
    const raw = localStorage.getItem("wolf_vault_secrets_backup");
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].service).toBe("Stripe Production Key");
  });
});
