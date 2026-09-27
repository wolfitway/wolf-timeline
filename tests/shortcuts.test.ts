import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useShortcutsStore } from "../src/stores/useShortcutsStore";

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

describe("Shortcuts & Keybindings Engine", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("initializes with complete default shortcuts", () => {
    const store = useShortcutsStore();
    expect(store.shortcuts.length).toBeGreaterThanOrEqual(10);
    expect(store.shortcuts.find((s) => s.id === "command_palette")).toBeDefined();
    expect(store.shortcuts.find((s) => s.id === "quick_capture")).toBeDefined();
    expect(store.shortcuts.find((s) => s.id === "tab_studio")).toBeDefined();
  });

  it("correctly matches keyboard events for default shortcut", () => {
    const store = useShortcutsStore();

    // Command palette is mod+k
    const matchingEvent = {
      key: "k",
      metaKey: true,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
    } as KeyboardEvent;
    expect(store.matchesEvent("command_palette", matchingEvent)).toBe(true);

    const nonMatchingEvent = {
      key: "k",
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
    } as KeyboardEvent;
    expect(store.matchesEvent("command_palette", nonMatchingEvent)).toBe(false);
  });

  it("updates shortcut and persists custom keybind", () => {
    const store = useShortcutsStore();

    store.setShortcut("command_palette", { key: "p", mod: true, shift: true });

    const formatted = store.formatShortcut("command_palette");
    expect(formatted).toContain("P");

    const newEvent = {
      key: "p",
      metaKey: true,
      ctrlKey: false,
      altKey: false,
      shiftKey: true,
    } as KeyboardEvent;
    expect(store.matchesEvent("command_palette", newEvent)).toBe(true);
  });

  it("detects shortcut conflicts accurately", () => {
    const store = useShortcutsStore();

    // Default tab_timeline is mod+1
    const conflict = store.findConflict("tab_studio", { key: "1", mod: true });
    expect(conflict).toBeDefined();
    expect(conflict?.id).toBe("tab_timeline");

    // No conflict for unused combo
    const noConflict = store.findConflict("tab_studio", { key: "9", mod: true, alt: true });
    expect(noConflict).toBeNull();
  });

  it("resets shortcut to default properly", () => {
    const store = useShortcutsStore();
    store.setShortcut("command_palette", { key: "j", mod: true });
    expect(store.getKeyCombo("command_palette").key).toBe("j");

    store.resetShortcut("command_palette");
    expect(store.getKeyCombo("command_palette").key).toBe("k");
  });
});
