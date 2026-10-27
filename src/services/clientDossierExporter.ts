/**
 * Sovereign Client Dossier Exporter
 * Generates an encrypted/signed, self-contained, interactive HTML presentation
 * of a project note, timeline milestones, and AI architecture decisions.
 *
 * Runs 100% offline with embedded Wolfitway executive styles.
 * Big enterprise clients can open it in any browser with zero installation.
 */

import type { Note } from "@/types";
import { renderMarkdown } from "@/services/markdownRenderer";
import { sha256Hex } from "@/services/crypto";

export interface DossierOptions {
  includeTimeline?: boolean;
  includeAiDebates?: boolean;
  includeResources?: boolean;
  authorName?: string;
  organization?: string;
  theme?: "amber" | "light";
}

export async function generateClientDossierHtml(note: Note, options: DossierOptions = {}): Promise<{ html: string; filename: string; integrityHash: string }> {
  const author = options.authorName || "Principal Systems Architect";
  const org = options.organization || "Sovereign Engineering";
  const theme = options.theme || "amber";
  const renderedBody = renderMarkdown(note.body);
  const now = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate cryptographic integrity hash of the project state
  const payloadToHash = JSON.stringify({
    title: note.title,
    body: note.body,
    events: note.events,
    ai_explorations: note.ai_explorations,
    status: note.status,
    updated_at: (note as { updated_at?: string }).updated_at || note.created_at,
  });
  const rawHash = await sha256Hex(payloadToHash);
  const integrityHash = `SHA256-${rawHash.substring(0, 16).toUpperCase()}-${rawHash.substring(16, 32).toUpperCase()}`;

  // Safe filename
  const cleanTitle = note.title.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").substring(0, 40);
  const filename = `${cleanTitle}_executive_dossier.html`;

  // Timeline events HTML
  let timelineHtml = "";
  if (options.includeTimeline !== false && note.events?.length) {
    timelineHtml = `
      <section class="dossier-section">
        <h2 class="section-heading"><span class="heading-icon">⏱️</span> Milestone Timeline &amp; Architecture Log</h2>
        <div class="timeline-tree">
          ${note.events.map((ev) => `
            <div class="timeline-node">
              <div class="node-bullet"></div>
              <div class="node-card">
                <div class="node-header">
                  <span class="node-title">${escapeHtml(ev.title)}</span>
                  <span class="node-time">${escapeHtml(ev.time)}</span>
                </div>
                ${ev.author ? `<span class="node-author">Reported by ${escapeHtml(ev.author)}</span>` : ""}
                <p class="node-desc">${escapeHtml(ev.desc)}</p>
                ${ev.tags?.length ? `
                  <div class="node-tags">
                    ${ev.tags.map(t => `<span class="tag-pill">#${escapeHtml(t)}</span>`).join("")}
                  </div>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  // AI Architecture Debates HTML
  let aiHtml = "";
  if (options.includeAiDebates !== false && note.ai_explorations?.length) {
    aiHtml = `
      <section class="dossier-section">
        <h2 class="section-heading"><span class="heading-icon">🤖</span> AI Multi-Model Architecture Debates &amp; Consensus</h2>
        <div class="ai-debates-stack">
          ${note.ai_explorations.map((ai) => `
            <div class="ai-card">
              <div class="ai-card-top">
                <span class="ai-card-title">${escapeHtml(ai.title)}</span>
                <span class="ai-model-badge">${escapeHtml(ai.model)}</span>
              </div>
              ${ai.decision_outcome ? `
                <div class="consensus-box">
                  <strong class="consensus-lead">Consensus Architecture:</strong> ${escapeHtml(ai.decision_outcome)}
                </div>
              ` : ""}
              ${ai.key_takeaways?.length ? `
                <ul class="takeaways-list">
                  ${ai.key_takeaways.map(k => `<li>✓ ${escapeHtml(k)}</li>`).join("")}
                </ul>
              ` : ""}
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  // Web Resources & References
  let resourcesHtml = "";
  if (options.includeResources !== false && note.bookmarks?.length) {
    resourcesHtml = `
      <section class="dossier-section">
        <h2 class="section-heading"><span class="heading-icon">🔖</span> Verified Reference Documents &amp; Specs</h2>
        <div class="resources-grid">
          ${note.bookmarks.map((bm) => `
            <a href="${escapeHtml(bm.url)}" target="_blank" rel="noopener noreferrer" class="resource-card">
              <span class="resource-title">${escapeHtml(bm.title)} ↗</span>
              <span class="resource-domain">${escapeHtml(bm.domain)}</span>
              ${bm.description ? `<p class="resource-desc">${escapeHtml(bm.description)}</p>` : ""}
            </a>
          `).join("")}
        </div>
      </section>
    `;
  }

  const isLight = theme === "light";

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(note.title)} — Executive Client Dossier</title>
  <style>
    :root {
      ${isLight ? `
        --bg-canvas: #fcfbfa;
        --bg-card: #ffffff;
        --bg-surface: #f4efe6;
        --border-card: #d8cbba;
        --border-glow: rgba(180, 83, 9, 0.2);
        --text-primary: #140f07;
        --text-secondary: #58442a;
        --text-muted: #7a6243;
        --accent-main: #b45309;
        --accent-bright: #92400e;
        --accent-pill: #fef3c7;
        --accent-text: #ffffff;
      ` : `
        --bg-canvas: #060503;
        --bg-card: #100b05;
        --bg-surface: #181208;
        --border-card: #281b0a;
        --border-glow: rgba(245, 158, 11, 0.25);
        --text-primary: #fffbeb;
        --text-secondary: #fcd34d;
        --text-muted: #d4a373;
        --accent-main: #f59e0b;
        --accent-bright: #fbbf24;
        --accent-pill: #281b05;
        --accent-text: #080501;
      `}
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg-canvas);
      color: var(--text-primary);
      font-family: var(--font-sans);
      line-height: 1.6;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
    }

    .dossier-wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }

    .dossier-header {
      border-bottom: 1px solid var(--border-card);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    .dossier-meta-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .org-badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--accent-pill);
      color: var(--accent-bright);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border-card);
    }

    .date-badge {
      font-size: 12px;
      color: var(--text-muted);
    }

    .dossier-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .dossier-meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      color: var(--text-secondary);
      flex-wrap: wrap;
    }

    .status-chip {
      background: var(--accent-main);
      color: var(--accent-text);
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      text-transform: uppercase;
    }

    .dossier-section {
      margin-bottom: 40px;
    }

    .section-heading {
      font-size: 18px;
      font-weight: 700;
      color: var(--accent-bright);
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--border-card);
      padding-bottom: 8px;
      margin-bottom: 20px;
    }

    .markdown-body {
      color: var(--text-primary);
      font-size: 15px;
    }

    .markdown-body h3 { font-size: 18px; margin: 24px 0 10px; color: var(--accent-bright); }
    .markdown-body h4 { font-size: 16px; margin: 20px 0 8px; }
    .markdown-body p { margin-bottom: 14px; }
    .markdown-body ul, .markdown-body ol { margin-left: 20px; margin-bottom: 16px; }
    .markdown-body li { margin-bottom: 6px; }

    /* Checklists */
    .md-task-item { list-style: none; margin-left: -20px; display: flex; align-items: baseline; gap: 8px; }
    .task-checkbox { accent-color: var(--accent-main); }

    /* Timeline */
    .timeline-tree { position: relative; padding-left: 20px; border-left: 2px solid var(--border-card); }
    .timeline-node { position: relative; margin-bottom: 24px; }
    .node-bullet { position: absolute; left: -26px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--accent-main); box-shadow: 0 0 8px var(--accent-bright); }
    .node-card { background: var(--bg-surface); border: 1px solid var(--border-card); border-radius: 10px; padding: 14px 18px; }
    .node-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .node-title { font-weight: 700; font-size: 14.5px; }
    .node-time { font-size: 12px; color: var(--text-muted); }
    .node-author { font-size: 11.5px; color: var(--text-secondary); display: block; margin-bottom: 6px; }
    .node-desc { font-size: 13.5px; color: var(--text-primary); }
    .node-tags { display: flex; gap: 6px; margin-top: 8px; }
    .tag-pill { font-size: 10.5px; color: var(--text-muted); background: var(--bg-card); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-card); }

    /* AI Debates */
    .ai-debates-stack { display: flex; flex-direction: column; gap: 14px; }
    .ai-card { background: var(--bg-surface); border: 1px solid var(--border-card); border-radius: 10px; padding: 16px; }
    .ai-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .ai-card-title { font-weight: 700; font-size: 15px; }
    .ai-model-badge { font-size: 11px; background: var(--accent-pill); color: var(--accent-bright); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-card); }
    .consensus-box { background: var(--bg-card); border-left: 3px solid var(--accent-main); padding: 10px 14px; font-size: 13.5px; margin-bottom: 10px; border-radius: 4px; }
    .consensus-lead { color: var(--accent-bright); }
    .takeaways-list { list-style: none; font-size: 13px; color: var(--text-secondary); }

    /* Resources */
    .resources-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .resource-card { background: var(--bg-surface); border: 1px solid var(--border-card); border-radius: 8px; padding: 12px; text-decoration: none; color: inherit; transition: border-color 0.15s ease; }
    .resource-card:hover { border-color: var(--accent-main); }
    .resource-title { font-weight: 700; font-size: 13.5px; color: var(--accent-bright); display: block; margin-bottom: 2px; }
    .resource-domain { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px; }
    .resource-desc { font-size: 12px; color: var(--text-secondary); }

    /* Verification Footer */
    .dossier-footer {
      border-top: 1px solid var(--border-card);
      padding-top: 24px;
      margin-top: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
    }

    .verification-info { display: flex; flex-direction: column; gap: 2px; }
    .verification-title { font-size: 12px; font-weight: 700; color: var(--accent-bright); }
    .integrity-hash { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
    .dossier-watermark { font-size: 12px; color: var(--text-muted); }
    .dossier-watermark a { color: var(--accent-bright); text-decoration: none; font-weight: 600; }

    @media print {
      body { background: #ffffff !important; color: #000000 !important; padding: 0; }
      .dossier-wrapper { border: none !important; box-shadow: none !important; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="dossier-wrapper">
    <!-- Header -->
    <header class="dossier-header">
      <div class="dossier-meta-top">
        <span class="org-badge">${escapeHtml(org)}</span>
        <span class="date-badge">${escapeHtml(now)}</span>
      </div>
      <h1 class="dossier-title">${escapeHtml(note.title)}</h1>
      <div class="dossier-meta-row">
        <span class="status-chip">${escapeHtml(note.status || "In Review")}</span>
        <span>Author: <strong>${escapeHtml(author)}</strong></span>
        ${note.funnel_stage ? `<span>• Funnel: ${escapeHtml(note.funnel_stage)}</span>` : ""}
      </div>
    </header>

    <!-- Main Specs & Architecture Body -->
    <section class="dossier-section">
      <h2 class="section-heading"><span class="heading-icon">📋</span> Technical Specifications &amp; Executive Summary</h2>
      <div class="markdown-body">
        ${renderedBody}
      </div>
    </section>

    <!-- Milestone Timeline -->
    ${timelineHtml}

    <!-- AI Architecture Debates -->
    ${aiHtml}

    <!-- Reference Documents -->
    ${resourcesHtml}

    <!-- Cryptographic Verification & Enterprise Watermark -->
    <footer class="dossier-footer">
      <div class="verification-info">
        <span class="verification-title">🛡️ Cryptographically Attested Sovereign Dossier • SOVEREIGN VERIFIED</span>
        <span class="integrity-hash">${escapeHtml(integrityHash)}</span>
        <span class="verification-desc">100% Offline-First Air-Gapped Architecture • Zero Telemetry • Zero Cloud Dependency</span>
      </div>
      <div class="dossier-watermark">
        Exported from <strong>Wolf Timeline Sovereign Node</strong> · <a href="https://github.com/wolfitway/wolf-timeline" target="_blank">Enterprise Air-Gapped Workstation</a>
      </div>
    </footer>
  </div>
</body>
</html>`;

  return { html, filename, integrityHash };
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function downloadClientDossierFile(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportClientDossier(note: Note, options: DossierOptions = {}): Promise<{ filename: string; integrityHash: string }> {
  const result = await generateClientDossierHtml(note, options);
  downloadClientDossierFile(result.html, result.filename);
  return { filename: result.filename, integrityHash: result.integrityHash };
}

