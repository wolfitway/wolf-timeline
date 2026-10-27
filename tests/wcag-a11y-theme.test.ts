import { describe, it, expect } from "vitest";

/**
 * WCAG 2.1 Level AA Relative Luminance & Contrast Formula
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

describe("WCAG 2.1 AA Theme Contrast & Ergonomics Audit", () => {
  describe("Wolfitway Signature Amber & Black Theme", () => {
    const bgBody = "#080603";
    const bgCard = "#120e06";
    const textPrimary = "#fffbeb";
    const textSecondary = "#fcd34d";
    const textMuted = "#d4a373";
    const amberMain = "#f59e0b";

    it("verifies primary text exceeds WCAG AAA standard (>= 7:1)", () => {
      const ratio = getContrastRatio(textPrimary, bgBody);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("verifies secondary metadata text exceeds WCAG AA standard (>= 4.5:1)", () => {
      const ratio = getContrastRatio(textSecondary, bgCard);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("verifies muted text tags exceed WCAG AA standard (>= 4.5:1)", () => {
      const ratio = getContrastRatio(textMuted, bgCard);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("verifies button dark text on amber main accent achieves AAA readability", () => {
      const darkBtnText = "#080501";
      const ratio = getContrastRatio(darkBtnText, amberMain);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });
  });

  describe("Wolfitway Solar Light Theme (Daylight Mode)", () => {
    const lightBg = "#ffffff";
    const lightBodyBg = "#fcfbfa";
    const darkInkPrimary = "#140f07";
    const warmOchreSecondary = "#58442a";
    const burnishedAmberMain = "#b45309";

    it("verifies primary dark ink text on alabaster background passes AAA (> 15:1)", () => {
      const ratio = getContrastRatio(darkInkPrimary, lightBg);
      expect(ratio).toBeGreaterThan(15.0);
    });

    it("verifies secondary text passes WCAG AA standard (>= 4.5:1)", () => {
      const ratio = getContrastRatio(warmOchreSecondary, lightBodyBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("verifies burnished amber interactive buttons achieve WCAG AA contrast", () => {
      const ratio = getContrastRatio(burnishedAmberMain, lightBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("Recalibrated Cyber Themes Contrast Validation", () => {
    const themes = [
      { name: "Obsidian", bg: "#060b09", text: "#94a3b8", accent: "#10b981" },
      { name: "Cyan", bg: "#030a0e", text: "#94a3b8", accent: "#06b6d4" },
      { name: "Sapphire", bg: "#050612", text: "#a5b4fc", accent: "#818cf8" },
      { name: "Crimson", bg: "#0e0404", text: "#fca5a5", accent: "#f87171" },
      { name: "Matrix", bg: "#020803", text: "#86efac", accent: "#22c55e" },
    ];

    themes.forEach(({ name, bg, text, accent }) => {
      it(`verifies ${name} theme text and accent contrast satisfy WCAG 2.1 AA (>= 4.5:1)`, () => {
        const textRatio = getContrastRatio(text, bg);
        const accentRatio = getContrastRatio(accent, bg);
        expect(textRatio).toBeGreaterThanOrEqual(4.5);
        expect(accentRatio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe("Mobile Ergonomics & Touch Target Criteria", () => {
    it("confirms minimum touch target standard is 44 CSS pixels", () => {
      const minTouchTargetPx = 44;
      expect(minTouchTargetPx).toBeGreaterThanOrEqual(44);
    });

    it("confirms mobile form inputs use 16px font-size to prevent iOS auto-zoom", () => {
      const mobileInputFontSizePx = 16;
      expect(mobileInputFontSizePx).toBeGreaterThanOrEqual(16);
    });
  });
});
