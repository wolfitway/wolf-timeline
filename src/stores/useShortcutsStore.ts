import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface KeyCombo {
  key: string; // e.g. "k", "enter", "1", "b", "f"
  mod: boolean; // Ctrl or Cmd
  alt?: boolean;
  shift?: boolean;
}

export interface ShortcutDefinition {
  id: string;
  label: string;
  desc: string;
  category: "navigation" | "creation" | "studio" | "vault";
  defaultKey: KeyCombo;
  customKey?: KeyCombo;
}

const STORAGE_KEY = "wolf_app_shortcuts_v1";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);

export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: "command_palette",
    label: "Command Palette",
    desc: "Open instant search, quick navigation & actions",
    category: "navigation",
    defaultKey: { key: "k", mod: true },
  },
  {
    id: "quick_capture",
    label: "Quick Capture Note",
    desc: "Rapidly capture a thought, idea, or milestone",
    category: "creation",
    defaultKey: { key: "Enter", mod: true },
  },
  {
    id: "new_note",
    label: "New Project / Note",
    desc: "Create a new document directly in vault",
    category: "creation",
    defaultKey: { key: "n", mod: true, alt: true },
  },
  {
    id: "tab_timeline",
    label: "Switch to Timeline",
    desc: "Jump to main project timeline feed",
    category: "navigation",
    defaultKey: { key: "1", mod: true },
  },
  {
    id: "tab_studio",
    label: "Switch to Markdown Studio",
    desc: "Jump to deep-work document studio",
    category: "navigation",
    defaultKey: { key: "2", mod: true },
  },
  {
    id: "tab_roadmap",
    label: "Switch to Roadmap",
    desc: "Jump to execution phases & milestones",
    category: "navigation",
    defaultKey: { key: "3", mod: true },
  },
  {
    id: "tab_secrets",
    label: "Switch to Secret Vault",
    desc: "Jump to encrypted credentials & env store",
    category: "navigation",
    defaultKey: { key: "4", mod: true },
  },
  {
    id: "tab_settings",
    label: "Open Settings",
    desc: "Open workspace configuration & preferences",
    category: "navigation",
    defaultKey: { key: ",", mod: true },
  },
  {
    id: "focus_mode",
    label: "Zen Focus Editor",
    desc: "Toggle fullscreen distraction-free writer",
    category: "studio",
    defaultKey: { key: "f", mod: true, shift: true },
  },
  {
    id: "toggle_studio_sidebar",
    label: "Toggle Studio Navigator",
    desc: "Show or hide the document list in Studio",
    category: "studio",
    defaultKey: { key: "b", mod: true },
  },
  {
    id: "export_data",
    label: "Export Workspace Backup",
    desc: "Generate sovereign JSON/Markdown vault archive",
    category: "creation",
    defaultKey: { key: "e", mod: true, shift: true },
  },
  {
    id: "lock_vault",
    label: "Emergency Vault Lock",
    desc: "Instantly lock zero-knowledge secret vault",
    category: "vault",
    defaultKey: { key: "l", mod: true, alt: true },
  },
];

export const useShortcutsStore = defineStore("shortcuts", () => {
  const customBindings = ref<Record<string, KeyCombo>>({});

  // Initialize from localStorage
  function loadBindings() {
    try {
      if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          customBindings.value = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn("Failed to load shortcuts from localStorage:", e);
    }
  }
  loadBindings();

  function saveBindings() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customBindings.value));
      }
    } catch (e) {
      console.warn("Failed to save shortcuts to localStorage:", e);
    }
  }

  // All shortcuts with active key combo
  const shortcuts = computed(() => {
    return DEFAULT_SHORTCUTS.map((item) => {
      const active = customBindings.value[item.id] || item.defaultKey;
      return {
        ...item,
        currentKey: active,
        isCustom: !!customBindings.value[item.id],
      };
    });
  });

  // Get active key combo for an ID
  function getKeyCombo(id: string): KeyCombo {
    return customBindings.value[id] || DEFAULT_SHORTCUTS.find((s) => s.id === id)?.defaultKey || { key: "", mod: false };
  }

  // Format combo into human-friendly tokens, e.g. ["⌘", "K"] or ["Ctrl", "Alt", "S"]
  function formatComboTokens(combo: KeyCombo): string[] {
    const tokens: string[] = [];
    if (combo.mod) tokens.push(isMac ? "⌘" : "Ctrl");
    if (combo.alt) tokens.push(isMac ? "⌥" : "Alt");
    if (combo.shift) tokens.push(isMac ? "⇧" : "Shift");

    let k = combo.key.toUpperCase();
    if (combo.key.toLowerCase() === "enter") k = "↵ Enter";
    else if (combo.key === ",") k = ",";
    else if (combo.key.length === 1) k = combo.key.toUpperCase();

    tokens.push(k);
    return tokens;
  }

  function formatShortcut(id: string): string {
    const combo = getKeyCombo(id);
    return formatComboTokens(combo).join(" + ");
  }

  // Check if an incoming keyboard event matches a shortcut ID
  function matchesEvent(id: string, e: KeyboardEvent): boolean {
    const combo = getKeyCombo(id);
    if (!combo.key) return false;

    const hasMod = e.metaKey || e.ctrlKey;
    if (Boolean(combo.mod) !== hasMod) return false;
    if (Boolean(combo.alt) !== e.altKey) return false;
    if (Boolean(combo.shift) !== e.shiftKey) return false;

    // Match key regardless of case
    const eventKey = e.key.toLowerCase();
    const targetKey = combo.key.toLowerCase();

    return eventKey === targetKey;
  }

  // Find if combo is already assigned to a different shortcut
  function findConflict(targetId: string, combo: KeyCombo): ShortcutDefinition | null {
    for (const item of DEFAULT_SHORTCUTS) {
      if (item.id === targetId) continue;
      const otherCombo = getKeyCombo(item.id);
      if (
        otherCombo.key.toLowerCase() === combo.key.toLowerCase() &&
        Boolean(otherCombo.mod) === Boolean(combo.mod) &&
        Boolean(otherCombo.alt) === Boolean(combo.alt) &&
        Boolean(otherCombo.shift) === Boolean(combo.shift)
      ) {
        return item;
      }
    }
    return null;
  }

  function setShortcut(id: string, combo: KeyCombo) {
    customBindings.value[id] = combo;
    saveBindings();
  }

  function resetShortcut(id: string) {
    delete customBindings.value[id];
    saveBindings();
  }

  function resetAllShortcuts() {
    customBindings.value = {};
    saveBindings();
  }

  return {
    shortcuts,
    customBindings,
    getKeyCombo,
    formatComboTokens,
    formatShortcut,
    matchesEvent,
    findConflict,
    setShortcut,
    resetShortcut,
    resetAllShortcuts,
    isMac,
  };
});
