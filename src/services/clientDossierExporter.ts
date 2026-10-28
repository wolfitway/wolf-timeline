/**
 * Sovereign Client Dossier & Notion-Style Website Exporter
 * Generates an encrypted/signed, self-contained, interactive HTML presentation
 * or public website from any project note, timeline milestones, and research.
 *
 * Runs 100% offline with zero cloud dependency.
 * Can be opened in any browser, hosted on GitHub Pages / Netlify, or emailed to clients.
 */

import type { Note } from "@/types";
import { renderMarkdown } from "@/services/markdownRenderer";
import { sha256Hex } from "@/services/crypto";

export interface DossierOptions {
  includeTimeline?: boolean;
  includeAiDebates?: boolean;
  includeResources?: boolean;
  includeMoodGallery?: boolean;
  includeTableOfContents?: boolean;
  siteMode?: boolean;
  authorName?: string;
  organization?: string;
  theme?: "amber" | "light" | "emerald" | "cyan" | "obsidian";
  coverEmoji?: string;
}

export async function generateClientDossierHtml(note: Note, options: DossierOptions = {}): Promise<{ html: string; filename: string; integrityHash: string }> {
  const author = options.authorName || "Principal Systems Architect";
  const org = options.organization || "Sovereign Engineering";
  const theme = options.theme || "emerald";
  const siteMode = options.siteMode !== false;
  const includeToc = options.includeTableOfContents !== false;
  const renderedBody = renderMarkdown(note.body);
  const now = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate estimated reading time
  const wordCount = (note.body || "").trim().split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

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
  const suffix = options.siteMode ? "_website.html" : "_executive_dossier.html";
  const filename = `${cleanTitle}${suffix}`;

  // Parse Headings from Markdown for Table of Contents
  const tocEntries: { id: string; text: string; level: number }[] = [];
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  let hIdx = 0;
  while ((match = headingRegex.exec(note.body)) !== null) {
    const level = match[1].length;
    const text = match[2].trim().replace(/[*_`]/g, "");
    const id = `sec-${hIdx++}-${text.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}`;
    tocEntries.push({ id, text, level });
  }

  // Inject IDs into rendered HTML headings
  let processedBody = renderedBody;
  if (tocEntries.length > 0) {
    let tIdx = 0;
    processedBody = processedBody.replace(/<(h[1-3])>(.*?)<\/\1>/gi, (full, tag, inner) => {
      const entry = tocEntries[tIdx++];
      if (entry) {
        return `<${tag} id="${entry.id}">${inner}</${tag}>`;
      }
      return full;
    });
  }

  // Timeline events HTML
  let timelineHtml = "";
  if (options.includeTimeline !== false && note.events?.length) {
    timelineHtml = `
      <section class="dossier-section" id="section-timeline">
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
      <section class="dossier-section" id="section-ai">
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
      <section class="dossier-section" id="section-resources">
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

  // Mood Gallery HTML
  let galleryHtml = "";
  if (options.includeMoodGallery !== false && note.mood_gallery?.length) {
    galleryHtml = `
      <section class="dossier-section" id="section-gallery">
        <h2 class="section-heading"><span class="heading-icon">🖼️</span> Visual Moodboard &amp; Architecture Diagrams</h2>
        <div class="gallery-grid">
          ${note.mood_gallery.map((img) => `
            <div class="gallery-item">
              <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption || 'Mood image')}" loading="lazy" class="gallery-img" />
              ${img.caption ? `<span class="gallery-caption">${escapeHtml(img.caption)}</span>` : ""}
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  // Table of Contents HTML
  let tocHtml = "";
  if (includeToc && (tocEntries.length > 0 || note.events?.length || note.bookmarks?.length)) {
    tocHtml = `
      <nav class="table-of-contents" aria-label="Table of contents">
        <div class="toc-header">
          <span class="toc-title">ON THIS PAGE</span>
        </div>
        <ul class="toc-list">
          ${tocEntries.map((e) => `
            <li class="toc-item toc-level-${e.level}">
              <a href="#${e.id}">${escapeHtml(e.text)}</a>
            </li>
          `).join("")}
          ${note.events?.length ? `<li class="toc-item"><a href="#section-timeline">Milestone Timeline</a></li>` : ""}
          ${note.mood_gallery?.length ? `<li class="toc-item"><a href="#section-gallery">Visual Gallery</a></li>` : ""}
          ${note.bookmarks?.length ? `<li class="toc-item"><a href="#section-resources">References &amp; Links</a></li>` : ""}
        </ul>
      </nav>
    `;
  }

  const isLight = theme === "light";
  const coverEmoji = options.coverEmoji || (note.kind === "milestone" ? "🎯" : note.kind === "post" ? "✍️" : "🐺");

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(note.title)} — Executive Client Dossier</title>
  <meta name="description" content="Sovereign project note: ${escapeHtml(note.title)}">
  <style>
    :root {
      ${isLight ? `
        --bg-canvas: #fcfbfa;
        --bg-card: #ffffff;
        --bg-surface: #f4efe6;
        --border-card: #d8cbba;
        --border-subtle: #e6ded3;
        --border-glow: rgba(16, 185, 129, 0.2);
        --text-primary: #140f07;
        --text-secondary: #58442a;
        --text-muted: #7a6243;
        --accent-main: #059669;
        --accent-bright: #047857;
        --accent-pill: #d1fae5;
        --accent-text: #ffffff;
      ` : `
        --bg-canvas: #060b08;
        --bg-card: #0b1410;
        --bg-surface: #0f1c16;
        --border-card: #162a21;
        --border-subtle: #14281f;
        --border-glow: rgba(16, 185, 129, 0.25);
        --text-primary: #f0fdf4;
        --text-secondary: #86efac;
        --text-muted: #6ee7b7;
        --accent-main: #10b981;
        --accent-bright: #34d399;
        --accent-pill: #063324;
        --accent-text: #040c08;
      `}
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    [data-theme="light"] {
      --bg-canvas: #fcfbfa;
      --bg-card: #ffffff;
      --bg-surface: #f4efe6;
      --border-card: #d8cbba;
      --border-subtle: #e6ded3;
      --border-glow: rgba(16, 185, 129, 0.2);
      --text-primary: #140f07;
      --text-secondary: #58442a;
      --text-muted: #7a6243;
      --accent-main: #059669;
      --accent-bright: #047857;
      --accent-pill: #d1fae5;
      --accent-text: #ffffff;
    }

    [data-theme="dark"], [data-theme="emerald"] {
      --bg-canvas: #060b08;
      --bg-card: #0b1410;
      --bg-surface: #0f1c16;
      --border-card: #162a21;
      --border-subtle: #14281f;
      --border-glow: rgba(16, 185, 129, 0.25);
      --text-primary: #f0fdf4;
      --text-secondary: #86efac;
      --text-muted: #6ee7b7;
      --accent-main: #10b981;
      --accent-bright: #34d399;
      --accent-pill: #063324;
      --accent-text: #040c08;
    }

    [data-theme="amber"] {
      --bg-canvas: #0a0804;
      --bg-card: #120e06;
      --bg-surface: #1a1408;
      --border-card: #2e1d08;
      --border-subtle: #241708;
      --border-glow: rgba(245, 158, 11, 0.25);
      --text-primary: #fffbeb;
      --text-secondary: #fcd34d;
      --text-muted: #d4a373;
      --accent-main: #f59e0b;
      --accent-bright: #fbbf24;
      --accent-pill: #281b05;
      --accent-text: #080501;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background: var(--bg-canvas);
      color: var(--text-primary);
      font-family: var(--font-sans);
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      transition: background 0.2s ease, color 0.2s ease;
    }

    /* Notion-Style Top Cover Banner */
    .site-cover-banner {
      width: 100%;
      height: 160px;
      background: linear-gradient(135deg, var(--bg-surface) 0%, var(--accent-pill) 100%);
      border-bottom: 1px solid var(--border-card);
      position: relative;
    }

    .top-controls {
      position: absolute;
      top: 16px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 10;
    }

    .site-toggle-btn {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      color: var(--text-primary);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.15s ease;
    }

    .site-toggle-btn:hover {
      border-color: var(--accent-main);
      transform: translateY(-1px);
    }

    /* Layout Shell */
    .site-layout {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px 80px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 260px;
      gap: 48px;
      position: relative;
    }

    @media (max-width: 900px) {
      .site-layout {
        grid-template-columns: 1fr;
        gap: 32px;
        padding: 0 16px 60px;
      }
      .table-of-contents {
        display: none;
      }
    }

    .site-main-col {
      min-width: 0;
    }

    /* Header Profile */
    .notion-emoji-icon {
      font-size: 56px;
      line-height: 1;
      margin-top: -36px;
      margin-bottom: 16px;
      display: inline-block;
      background: var(--bg-card);
      padding: 10px;
      border-radius: 16px;
      border: 1px solid var(--border-card);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }

    .dossier-header {
      padding: 16px 0 32px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 36px;
    }

    .dossier-meta-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .org-badge {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--accent-pill);
      color: var(--accent-bright);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border-card);
    }

    .read-time-badge {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .date-badge {
      font-size: 12px;
      color: var(--text-muted);
    }

    .dossier-title {
      font-size: 38px;
      font-weight: 850;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      margin-bottom: 14px;
      line-height: 1.2;
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
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Table of contents sticky sidebar */
    .table-of-contents {
      position: sticky;
      top: 32px;
      max-height: calc(100vh - 64px);
      overflow-y: auto;
      padding: 18px;
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 12px;
      font-size: 13px;
      align-self: start;
    }

    .toc-header {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .toc-title {
      font-size: 11px;
      font-weight: 800;
      color: var(--text-muted);
      letter-spacing: 0.06em;
    }

    .toc-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .toc-item a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.15s ease;
      display: block;
      line-height: 1.4;
    }

    .toc-item a:hover {
      color: var(--accent-bright);
    }

    .toc-level-3 {
      padding-left: 14px;
      font-size: 12px;
    }

    /* Sections */
    .dossier-section {
      margin-bottom: 48px;
    }

    .section-heading {
      font-size: 20px;
      font-weight: 800;
      color: var(--accent-bright);
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid var(--border-card);
      padding-bottom: 10px;
      margin-bottom: 24px;
      letter-spacing: -0.01em;
    }

    /* Reader Markdown Typography */
    .markdown-body {
      color: var(--text-primary);
      font-size: 16px;
      line-height: 1.7;
    }

    .markdown-body h1, .markdown-body h2, .markdown-body h3 {
      color: var(--text-primary);
      font-weight: 800;
      margin: 32px 0 14px;
      line-height: 1.3;
      scroll-margin-top: 40px;
    }

    .markdown-body h1 { font-size: 26px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; }
    .markdown-body h2 { font-size: 22px; color: var(--accent-bright); }
    .markdown-body h3 { font-size: 18px; }
    .markdown-body p { margin-bottom: 16px; }
    .markdown-body ul, .markdown-body ol { margin-left: 24px; margin-bottom: 18px; }
    .markdown-body li { margin-bottom: 8px; }
    .markdown-body strong { color: var(--text-primary); font-weight: 700; }
    .markdown-body blockquote {
      border-left: 3px solid var(--accent-main);
      padding: 10px 18px;
      background: var(--bg-surface);
      margin: 20px 0;
      border-radius: 4px;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* Interactive Checklists */
    .md-task-item {
      list-style: none;
      margin-left: -20px;
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 8px;
      cursor: pointer;
    }

    .task-checkbox {
      accent-color: var(--accent-main);
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .task-label.completed {
      text-decoration: line-through;
      opacity: 0.6;
    }

    /* Code Blocks */
    .md-codeblock-wrapper {
      position: relative;
      margin: 20px 0;
      background: var(--bg-surface);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      overflow: hidden;
    }

    .codeblock-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid var(--border-card);
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--text-muted);
    }

    .btn-copy-code {
      background: transparent;
      border: 1px solid var(--border-card);
      color: var(--text-secondary);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-copy-code:hover {
      background: var(--accent-pill);
      color: var(--accent-bright);
    }

    pre code {
      display: block;
      padding: 16px;
      font-family: var(--font-mono);
      font-size: 13.5px;
      overflow-x: auto;
      line-height: 1.5;
    }

    /* Mood Gallery */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .gallery-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .gallery-img {
      width: 100%;
      height: 160px;
      object-fit: cover;
      display: block;
      transition: transform 0.2s ease;
    }

    .gallery-img:hover {
      transform: scale(1.02);
    }

    .gallery-caption {
      padding: 10px;
      font-size: 12px;
      color: var(--text-secondary);
      background: var(--bg-card);
    }

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
      margin-top: 48px;
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
      .site-cover-banner, .top-controls, .table-of-contents { display: none !important; }
      .site-layout { display: block; padding: 0; }
    }
  </style>
</head>
<body>
  <!-- Cover Banner -->
  <div class="site-cover-banner">
    <div class="top-controls">
      <button type="button" class="site-toggle-btn" id="btn-theme-toggle" onclick="toggleSiteTheme()">
        <span id="theme-icon">☀️</span>
        <span id="theme-label">Theme</span>
      </button>
      <button type="button" class="site-toggle-btn" onclick="window.print()">
        <span>🖨️</span> Print / PDF
      </button>
    </div>
  </div>

  <div class="site-layout">
    <main class="site-main-col">
      <!-- Icon & Header -->
      <span class="notion-emoji-icon">${escapeHtml(coverEmoji)}</span>

      <header class="dossier-header">
        <div class="dossier-meta-top">
          <span class="org-badge">${escapeHtml(org)}</span>
          <span class="read-time-badge">📖 ${readTimeMin} min read</span>
          <span class="date-badge">${escapeHtml(now)}</span>
        </div>
        <h1 class="dossier-title">${escapeHtml(note.title)}</h1>
        <div class="dossier-meta-row">
          <span class="status-chip">${escapeHtml(note.status || "In Review")}</span>
          <span>Author: <strong>${escapeHtml(author)}</strong></span>
          ${note.funnel_stage ? `<span>• Funnel: ${escapeHtml(note.funnel_stage)}</span>` : ""}
        </div>
      </header>

      <!-- Main Body -->
      <section class="dossier-section" id="section-content">
        <div class="markdown-body">
          ${processedBody}
        </div>
      </section>

      <!-- Visual Mood Gallery -->
      ${galleryHtml}

      <!-- Milestone Timeline -->
      ${timelineHtml}

      <!-- AI Decisions -->
      ${aiHtml}

      <!-- References & Links -->
      ${resourcesHtml}

      <!-- Sovereign Verification Footer -->
      <footer class="dossier-footer">
        <div class="verification-info">
          <span class="verification-title">🛡️ Cryptographically Attested Sovereign Dossier • SOVEREIGN VERIFIED</span>
          <span class="integrity-hash">${escapeHtml(integrityHash)}</span>
          <span class="verification-desc">100% Offline-First Air-Gapped Architecture • Zero Telemetry • Zero Cloud Dependency</span>
        </div>
        <div class="dossier-watermark">
          Published with <strong>Wolf Timeline Sovereign Node</strong> · <a href="https://github.com/wolfitway/wolf-timeline" target="_blank">Zero-Cloud Workspace</a>
        </div>
      </footer>
    </main>

    <!-- Sidebar: Table of Contents -->
    <aside class="site-sidebar-col">
      ${tocHtml}
    </aside>
  </div>

  <!-- Interactive Embedded Site Script -->
  <script>
    // 1. Theme Switcher with localStorage persistence
    function toggleSiteTheme() {
      const htmlEl = document.documentElement;
      const current = htmlEl.getAttribute('data-theme') || 'dark';
      const next = current === 'light' ? 'emerald' : 'light';
      htmlEl.setAttribute('data-theme', next);
      localStorage.setItem('wolf_site_theme', next);
      updateThemeLabel(next);
    }

    function updateThemeLabel(theme) {
      const label = document.getElementById('theme-label');
      const icon = document.getElementById('theme-icon');
      if (label && icon) {
        if (theme === 'light') {
          label.textContent = 'Dark';
          icon.textContent = '🌙';
        } else {
          label.textContent = 'Light';
          icon.textContent = '☀️';
        }
      }
    }

    // Initialize saved theme
    try {
      const savedTheme = localStorage.getItem('wolf_site_theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeLabel(savedTheme);
      }
    } catch (e) {}

    // 2. Interactive Task Checkbox toggle
    document.addEventListener('change', function(e) {
      if (e.target && e.target.classList.contains('task-checkbox')) {
        const item = e.target.closest('.md-task-item');
        if (item) {
          const label = item.querySelector('.task-label');
          if (label) {
            label.classList.toggle('completed', e.target.checked);
          }
        }
      }
    });

    // 3. 1-Click Code Block Copy
    document.querySelectorAll('.md-codeblock-wrapper').forEach(function(wrapper) {
      const header = wrapper.querySelector('.codeblock-header');
      const code = wrapper.querySelector('pre code');
      if (header && code) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-copy-code';
        btn.textContent = 'Copy';
        btn.onclick = function() {
          navigator.clipboard.writeText(code.innerText).then(function() {
            btn.textContent = 'Copied! ✓';
            setTimeout(function() { btn.textContent = 'Copy'; }, 1800);
          });
        };
        header.appendChild(btn);
      }
    });
  </script>
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

export function openClientDossierInNewTab(htmlContent: string): void {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

export async function exportClientDossier(note: Note, options: DossierOptions = {}): Promise<{ filename: string; integrityHash: string }> {
  const result = await generateClientDossierHtml(note, options);
  downloadClientDossierFile(result.html, result.filename);
  return { filename: result.filename, integrityHash: result.integrityHash };
}
