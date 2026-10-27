import { describe, it, expect } from "vitest";
import { generateClientDossierHtml } from "@/services/clientDossierExporter";
import type { Note } from "@/types";

describe("Executive Client Dossier Exporter Suite (PLG Viral Vector)", () => {
  const sampleProjectNote: Note = {
    id: 101,
    title: "Global Distributed Vault Infrastructure",
    body: "### Executive Overview\nAir-gapped enterprise deployment protocol with 5-layer redundancy.\n\n- [x] Security audit verified\n- [ ] Multi-region mirror sync",
    created_at: "2026-10-27T10:00:00.000Z",
    tags: ["sovereignty", "enterprise", "infosec"],
    kind: "milestone",
    status: "in_progress",
    funnel_stage: "revenue",
    events: [
      {
        id: "ev-1",
        title: "Cryptographic Attestation Completed",
        time: "10:30 AM",
        author: "Chief Security Architect",
        desc: "Zero telemetry verification passed infosec sandbox.",
        tags: ["audit", "crypto"],
        type: "release",
      },
      {
        id: "ev-2",
        title: "PLG Pipeline Activation",
        time: "02:00 PM",
        author: "Growth Lead",
        desc: "Self-contained dossier shared with Enterprise Stakeholder.",
        tags: ["growth"],
        type: "manual",
      },
    ],
    ai_explorations: [
      {
        id: "ai-1",
        title: "IndexedDB vs SQLite WASM Tradeoff Analysis",
        date: "2026-10-27",
        model: "Gemini 2.5 Pro",
        rationale: "IndexedDB provides native quota-free browser persistence without WASM cold-start latency.",
        transcript: "Full transcript evaluated by consensus.",
        decision_outcome: "Adopt dual-layer IndexedDB with localStorage fallback mirror.",
        status: "consensus_reached",
        key_takeaways: ["Zero WASM overhead", "Instant synchronous boot", "Cross-tab safe"],
      },
    ],
    bookmarks: [
      {
        id: "bm-1",
        title: "NIST SP 800-38D Recommendation for GCM Mode",
        url: "https://csrc.nist.gov/publications/detail/sp/800-38d/final",
        domain: "nist.gov",
        date: "2026-10-27",
        tags: ["standards", "crypto"],
        description: "Official specification for Galois/Counter Mode authentication.",
      },
    ],
  };

  it("generates standalone interactive HTML dossier with embedded styles and no external scripts", async () => {
    const { html, filename, integrityHash } = await generateClientDossierHtml(sampleProjectNote);

    expect(filename).toBe("global_distributed_vault_infrastructure_executive_dossier.html");
    expect(integrityHash).toMatch(/^SHA256-[0-9A-F]{16}-[0-9A-F]{16}$/);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Global Distributed Vault Infrastructure — Executive Client Dossier</title>");
    expect(html).toContain("Global Distributed Vault Infrastructure");
    expect(html).toContain("Air-gapped enterprise deployment protocol");
    expect(html).toContain("Cryptographic Attestation Completed");
    expect(html).toContain("Chief Security Architect");
    expect(html).toContain("IndexedDB vs SQLite WASM Tradeoff Analysis");
    expect(html).toContain("NIST SP 800-38D Recommendation for GCM Mode");

    // Must be completely standalone
    expect(html).not.toContain("<script src=\"http");
    expect(html).not.toContain("<link rel=\"stylesheet\" href=\"http");
  });

  it("includes sovereign enterprise verification badge and cryptographic integrity seal", async () => {
    const { html, integrityHash } = await generateClientDossierHtml(sampleProjectNote);

    expect(html).toContain("SOVEREIGN VERIFIED");
    expect(html).toContain(integrityHash);
    expect(html).toContain("100% Offline-First Air-Gapped Architecture");
    expect(html).toContain("Zero Telemetry • Zero Cloud Dependency");
  });

  it("sanitizes potentially malicious HTML tags in user-generated strings", async () => {
    const maliciousNote: Note = {
      ...sampleProjectNote,
      title: "Malicious <script>alert('xss')</script> Project",
      events: [
        {
          id: "xss-ev",
          title: "Injected <img src=x onerror=alert(1)> Title",
          time: "12:00",
          author: "<script>evil()</script>",
          desc: "Description with <iframe src='evil.com'></iframe>",
        },
      ],
    };

    const { html } = await generateClientDossierHtml(maliciousNote);

    expect(html).not.toContain("<script>alert('xss')</script>");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).not.toContain("<iframe src='evil.com'>");
    expect(html).toContain("&lt;script&gt;evil()&lt;/script&gt;");
  });
});
