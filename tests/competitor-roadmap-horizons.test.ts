import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useRoadmapStore, getPhaseHorizon } from "@/stores/useRoadmapStore";
import type { RoadmapPhase } from "@/types";

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

describe("Competitor Benchmark & Multi-View Horizon Engine Suite", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    (globalThis as any).localStorage.clear();
  });

  it("classifies default phases into horizons correctly", async () => {
    const store = useRoadmapStore();
    await store.loadRoadmap();

    expect(store.phases.length).toBeGreaterThan(0);
    const horizons = store.phasesByHorizon;

    // Must group into now, next, later, shipped
    expect(horizons).toHaveProperty("now");
    expect(horizons).toHaveProperty("next");
    expect(horizons).toHaveProperty("later");
    expect(horizons).toHaveProperty("shipped");

    // All phases must be accounted for across horizons
    const totalGrouped =
      horizons.now.length +
      horizons.next.length +
      horizons.later.length +
      horizons.shipped.length;
    expect(totalGrouped).toBe(store.phases.length);
  });

  it("updates horizon and synchronizes status seamlessly", async () => {
    const store = useRoadmapStore();
    await store.loadRoadmap();

    const targetPhase = store.phases[0];
    expect(targetPhase).toBeDefined();

    // Move to shipped
    store.setPhaseHorizon(targetPhase.id, "shipped");
    expect(targetPhase.horizon).toBe("shipped");
    expect(targetPhase.status).toBe("Live");
    expect(getPhaseHorizon(targetPhase)).toBe("shipped");

    // Move to next
    store.setPhaseHorizon(targetPhase.id, "next");
    expect(targetPhase.horizon).toBe("next");
    expect(targetPhase.status).toBe("Up Next");
    expect(getPhaseHorizon(targetPhase)).toBe("next");

    // Move to now
    store.setPhaseHorizon(targetPhase.id, "now");
    expect(targetPhase.horizon).toBe("now");
    expect(targetPhase.status).toBe("In Progress");
    expect(getPhaseHorizon(targetPhase)).toBe("now");
  });

  it("calculates practices velocity and percentage accurately", async () => {
    const store = useRoadmapStore();
    await store.loadRoadmap();

    const initialTotal = store.totalPracticesCount;
    expect(initialTotal).toBeGreaterThan(0);

    const firstPhase = store.phases[0];
    const initialCompleted = store.completedPracticesCount;

    // Toggle a practice
    const practice = firstPhase.practices[0];
    const prevStatus = practice.completed;
    store.togglePractice(firstPhase.id, practice.id);

    if (prevStatus) {
      expect(store.completedPracticesCount).toBe(initialCompleted - 1);
    } else {
      expect(store.completedPracticesCount).toBe(initialCompleted + 1);
    }

    expect(store.overallProgress).toBeGreaterThanOrEqual(0);
    expect(store.overallProgress).toBeLessThanOrEqual(100);
  });

  it("supports switching between track, horizons, and gantt view modes", () => {
    const store = useRoadmapStore();
    expect(store.viewMode).toBe("track");

    store.viewMode = "horizons";
    expect(store.viewMode).toBe("horizons");

    store.viewMode = "gantt";
    expect(store.viewMode).toBe("gantt");

    store.viewMode = "track";
    expect(store.viewMode).toBe("track");
  });

  describe("Competitor Intelligence & TCO Engine", () => {
    it("provides complete benchmarks for all 11 market competitors", async () => {
      const { COMPETITORS } = await import("@/services/competitorData");
      expect(COMPETITORS.length).toBe(11);

      const expectedIds = [
        "linear",
        "productplan",
        "aha",
        "notion",
        "markwhen",
        "obsidian",
        "aeon",
        "clickup",
        "heptabase",
        "anytype",
        "officetimeline",
      ];

      expectedIds.forEach((id) => {
        const comp = COMPETITORS.find((c) => c.id === id);
        expect(comp).toBeDefined();
        expect(comp?.name).toBeTruthy();
        expect(comp?.category).toBeTruthy();
        expect(comp?.pricing).toBeTruthy();
        expect(comp?.fatalFlaws.length).toBeGreaterThan(0);
        expect(comp?.wolfAdvantage).toBeTruthy();
        expect(comp?.primaryPros.length).toBeGreaterThan(0);
      });
    });

    it("calculates TCO savings accurately for high-ticket cloud roadmaps", async () => {
      const { COMPETITORS, calculateTcoSavings } = await import("@/services/competitorData");
      const productPlan = COMPETITORS.find((c) => c.id === "productplan")!;
      expect(productPlan).toBeDefined();

      const savings = calculateTcoSavings(productPlan, 5, 3);
      // 5 seats * 1188/yr * 3 yrs = 17,820 USD
      expect(savings.competitorTotalUsd).toBe(17820);
      expect(savings.wolfTimelineUsd).toBe(190);
      expect(savings.savingsUsd).toBe(17630);
      expect(savings.savingsPercentage).toBe(99);
    });

    it("generates structured executive intelligence briefs", async () => {
      const { COMPETITORS, generateExecutiveBriefMarkdown } = await import(
        "@/services/competitorData"
      );
      const linear = COMPETITORS.find((c) => c.id === "linear")!;
      const brief = generateExecutiveBriefMarkdown(linear, 10, 3);

      expect(brief).toContain("# Executive Intelligence Brief: Wolf Timeline vs Linear Roadmaps");
      expect(brief).toContain("100% Air-Gapped (Zero Cloud Exfiltration):");
      expect(brief).toContain("Wolf Timeline [YES]");
      expect(brief).toContain("Linear Roadmaps [NO]");
      expect(brief).toContain("Capital Saved");
    });

    it("generates valid Markwhen (.mw) export from roadmap phases", async () => {
      const { generateMarkwhenExport } = await import("@/services/competitorData");
      const store = useRoadmapStore();
      await store.loadRoadmap();

      const mwExport = generateMarkwhenExport(store.phases);
      expect(mwExport).toContain("title: Strategic Roadmap (Wolf Timeline)");
      expect(mwExport).toContain("section");
      expect(mwExport).toContain("practices:");
      expect(mwExport).toContain("- [");
    });
  });
});

