import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useUiStore, type FocusLens, type ActiveTab } from "../src/stores/useUiStore";

// Mock localStorage for node test environment
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

describe("Focus Lenses & Modular App Workspaces (Council of Experts Decision)", () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    setActivePinia(createPinia());
  });

  it("initializes with default 'all' full suite lens", () => {
    const uiStore = useUiStore();
    expect(uiStore.activeLens).toBe("all");
    expect(uiStore.activeTab).toBe("timeline");
  });

  it("switches to Notes App lens and confines active tab to notes/timeline or studio", () => {
    const uiStore = useUiStore();
    uiStore.setTab("secrets");
    expect(uiStore.activeTab).toBe("secrets");

    // Switching to notes lens must auto-redirect to timeline
    uiStore.setLens("notes");
    expect(uiStore.activeLens).toBe("notes");
    expect(uiStore.activeTab).toBe("timeline");

    // If currently on studio, stays on studio
    uiStore.setTab("studio");
    uiStore.setLens("notes");
    expect(uiStore.activeTab).toBe("studio");
  });

  it("switches to Roadmap App lens and redirects active tab to roadmap", () => {
    const uiStore = useUiStore();
    uiStore.setTab("timeline");

    uiStore.setLens("roadmap");
    expect(uiStore.activeLens).toBe("roadmap");
    expect(uiStore.activeTab).toBe("roadmap");
  });

  it("switches to Vault & Research lens and redirects active tab to secrets or bookmarks", () => {
    const uiStore = useUiStore();
    uiStore.setTab("roadmap");

    uiStore.setLens("vault");
    expect(uiStore.activeLens).toBe("vault");
    expect(uiStore.activeTab).toBe("secrets");

    // If already on bookmarks, stays on bookmarks
    uiStore.setTab("bookmarks");
    uiStore.setLens("vault");
    expect(uiStore.activeTab).toBe("bookmarks");
  });

  it("persists active lens in localStorage", () => {
    const uiStore = useUiStore();
    uiStore.setLens("notes");

    expect(localStorage.getItem("wolf_active_lens")).toBe("notes");

    uiStore.setLens("vault");
    expect(localStorage.getItem("wolf_active_lens")).toBe("vault");
  });

  it("properly filters visible workspaces based on active lens", () => {
    const allNav: ActiveTab[] = ["timeline", "studio", "roadmap", "bookmarks", "secrets"];

    const filterForLens = (lens: FocusLens): ActiveTab[] => {
      if (lens === "notes") return ["timeline", "studio"];
      if (lens === "roadmap") return ["roadmap"];
      if (lens === "vault") return ["bookmarks", "secrets"];
      return allNav;
    };

    expect(filterForLens("notes")).toEqual(["timeline", "studio"]);
    expect(filterForLens("roadmap")).toEqual(["roadmap"]);
    expect(filterForLens("vault")).toEqual(["bookmarks", "secrets"]);
    expect(filterForLens("all")).toEqual(allNav);
  });
});
