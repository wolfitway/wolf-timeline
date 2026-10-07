/**
 * Sovereign Markdown Rendering & Text Presentation Engine
 * Local-first, offline, XSS-safe parser and high-fidelity layout enhancer.
 *
 * Advanced Presentation Features:
 * - Real fenced code blocks with language indicators, window controls & copy button
 * - Preserved whitespace & indentation in pre/code (zero rogue <br> tags in code)
 * - Interactive task checklists (- [ ] / - [x]) matching document index order
 * - Semantic lists (ul / ol) with nested item indentation and value preservation
 * - Numbered Step Headers (1. Step, 2. Step, 3. Step) that never reset to 1
 * - Automatic Resource Pill Bars for pipe-separated items ("Inspiration | Tutorial | ...")
 * - Smart Section Headers & Lead Badges ("Format ideas:", "What your video must show")
 * - Instruction Cards for step-by-step workflow requirements
 * - Rich callout alerts (> [!NOTE], [!TIP], [!WARNING], [!IMPORTANT], [!CAUTION])
 * - Multi-column responsive markdown tables with column alignment (:---, :---:, ---:)
 * - Inline formatting: bold, italic, strikethrough, highlight (==text==), kbd, inline code
 * - Wikilinks ([[Note Title]]), hashtags (#tag), and external links with secure target
 * - Smart typography tidying: arrows (->, =>), symbols (!=, >=, <=), dashes (--), clean paragraph flow
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // Protect against javascript: and data: text/html injection
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
    return "#";
  }
  return trimmed;
}

export function renderMarkdown(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  // 1. Normalize line endings & collapse excessive blank lines (more than 2 consecutive newlines)
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  if (!text) return "";

  // 2. Extract & protect fenced code blocks before any other parsing
  const codeBlocks: string[] = [];
  text = text.replace(/(?:^|\n)```([a-zA-Z0-9_\-+#.]*)[ \t]*\n([\s\S]*?)(?:```[ \t]*(?:\n|$)|$)/g, (_match, lang, code) => {
    const cleanLang = (lang || "plaintext").trim().toLowerCase();
    const cleanCode = code.replace(/\n$/, ""); // strip single trailing newline
    const escapedCode = escapeHtml(cleanCode);
    const encodedForCopy = encodeURIComponent(cleanCode);

    const blockHtml = `<div class="md-codeblock-wrapper">
      <div class="codeblock-header">
        <div class="codeblock-header-left">
          <span class="codeblock-dot dot-red"></span>
          <span class="codeblock-dot dot-yellow"></span>
          <span class="codeblock-dot dot-green"></span>
          <span class="codeblock-lang">${escapeHtml(cleanLang)}</span>
        </div>
        <button type="button" class="btn-code-copy" data-code="${encodedForCopy}">
          <span class="btn-copy-icon">📋</span> <span class="btn-copy-label">Copy</span>
        </button>
      </div>
      <pre class="md-pre"><code class="md-code-multiline language-${escapeHtml(cleanLang)}">${escapedCode}</code></pre>
    </div>`;

    const token = `\n\n%%WOLF_CODEBLOCK_${codeBlocks.length}%%\n\n`;
    codeBlocks.push(blockHtml);
    return token;
  });

  // 3. Extract & protect Callout Alerts (> [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT], > [!CAUTION])
  const callouts: string[] = [];
  const calloutRegex = /(?:^|\n)>[ \t]*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\][ \t]*\n((?:>[ \t]*.*(?:\n|$))+)/gi;
  text = text.replace(calloutRegex, (_match, typeRaw, bodyRaw) => {
    const type = typeRaw.toUpperCase();
    const typeClass = type.toLowerCase();
    const iconMap: Record<string, { icon: string; title: string }> = {
      NOTE: { icon: "ℹ️", title: "Note" },
      TIP: { icon: "💡", title: "Tip" },
      WARNING: { icon: "⚠️", title: "Warning" },
      IMPORTANT: { icon: "🚨", title: "Important" },
      CAUTION: { icon: "🛑", title: "Caution" },
    };
    const info = iconMap[type] || { icon: "📌", title: type };

    const cleanedBodyLines = bodyRaw
      .split("\n")
      .map((l: string) => l.replace(/^>[ \t]?/, ""))
      .join("\n")
      .trim();

    const renderedBody = renderInlineText(cleanedBodyLines).replace(/\n/g, "<br/>");

    const calloutHtml = `<div class="md-callout md-callout-${typeClass}">
      <div class="callout-header">
        <span class="callout-icon">${info.icon}</span>
        <span class="callout-title">${info.title}</span>
      </div>
      <div class="callout-body">${renderedBody}</div>
    </div>`;

    const token = `\n\n%%WOLF_CALLOUT_${callouts.length}%%\n\n`;
    callouts.push(calloutHtml);
    return token;
  });

  // 4. Extract & protect Tables
  const tables: string[] = [];
  const tableRegex = /(?:^|\n)((?:[ \t]*\|[^\n]+\|[ \t]*(?:\n|$)){2,})/g;
  text = text.replace(tableRegex, (_match, tableBlock) => {
    const rawLines = tableBlock.trim().split("\n").map((l: string) => l.trim()).filter(Boolean);
    if (rawLines.length < 2) return tableBlock;

    const headerLine = rawLines[0];
    const sepLine = rawLines[1];

    if (!/^\|(?:[ \t]*:?-+:?[ \t]*\|)+$/.test(sepLine)) {
      return tableBlock;
    }

    const alignments = sepLine
      .split("|")
      .slice(1, -1)
      .map((col: string) => {
        const c = col.trim();
        if (c.startsWith(":") && c.endsWith(":")) return "center";
        if (c.endsWith(":")) return "right";
        return "left";
      });

    const parseCells = (line: string) => line.split("|").slice(1, -1).map((c: string) => c.trim());

    const headerCells = parseCells(headerLine);
    const thead = `<tr>${headerCells
      .map((cell: string, i: number) => {
        const align = alignments[i] ? ` style="text-align: ${alignments[i]}"` : "";
        return `<th${align}>${renderInlineText(cell)}</th>`;
      })
      .join("")}</tr>`;

    const bodyRows = rawLines.slice(2).map((rowLine: string) => {
      const cells = parseCells(rowLine);
      return `<tr>${cells
        .map((cell: string, i: number) => {
          const align = alignments[i] ? ` style="text-align: ${alignments[i]}"` : "";
          return `<td${align}>${renderInlineText(cell)}</td>`;
        })
        .join("")}</tr>`;
    }).join("");

    const tableHtml = `<div class="table-responsive">
      <table class="md-table">
        <thead>${thead}</thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;

    const token = `\n\n%%WOLF_TABLE_${tables.length}%%\n\n`;
    tables.push(tableHtml);
    return token;
  });

  // 5. Extract & protect Standard Blockquotes (consecutive lines starting with ">")
  const blockquotes: string[] = [];
  const bqRegex = /(?:^|\n)((?:>[ \t]*.*(?:\n|$))+)/g;
  text = text.replace(bqRegex, (_match, bqBlock) => {
    const lines = bqBlock
      .trim()
      .split("\n")
      .map((l: string) => l.replace(/^>[ \t]?/, "").trim())
      .filter((l: string) => l.length > 0);

    if (lines.length === 0) return "";

    const renderedInner = lines.map((l: string) => renderInlineText(l)).join("<br/>");
    const bqHtml = `<blockquote class="md-blockquote">${renderedInner}</blockquote>`;

    const token = `\n\n%%WOLF_BQ_${blockquotes.length}%%\n\n`;
    blockquotes.push(bqHtml);
    return token;
  });

  // 6. Interactive Task Checklist global counter (must match toggleTaskInMarkdown)
  let taskIndex = 0;

  // 7. Process document block-by-block
  const lines = text.split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // Placeholder tokens (%%WOLF_CODEBLOCK_...%%, %%WOLF_CALLOUT_...%%, etc.)
    const tokenMatch = trimmed.match(/^%%WOLF_(?:CODEBLOCK|CALLOUT|TABLE|BQ)_\d+%%$/);
    if (tokenMatch) {
      blocks.push(trimmed);
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(?:---|___|\*\*\*)$/.test(trimmed)) {
      blocks.push('<hr class="md-divider" />');
      i++;
      continue;
    }

    // Explicit Headings (# through ######)
    const headingMatch = trimmed.match(/^(#{1,6})[ \t]+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const titleText = renderInlineText(headingMatch[2]);
      blocks.push(`<h${level} class="md-h${level}">${titleText}</h${level}>`);
      i++;
      continue;
    }

    // Interactive Task Checklist items (- [ ] / - [x])
    if (/^[ \t]*-[ \t]*\[[ xX]\][ \t]+/.test(line)) {
      const taskLines: string[] = [];
      while (i < lines.length && /^[ \t]*-[ \t]*\[[ xX]\][ \t]+/.test(lines[i])) {
        taskLines.push(lines[i]);
        i++;
      }
      const taskItems = taskLines.map((tl) => {
        const m = tl.trim().match(/^[ \t]*-[ \t]*\[([ xX])\][ \t]+(.*)$/);
        if (!m) return "";
        const checked = m[1].toLowerCase() === "x";
        const label = renderInlineText(m[2]);
        const currentIdx = taskIndex++;
        return `<div class="md-task-item ${checked ? "checked" : ""}">
          <label class="md-task-label">
            <input type="checkbox" ${checked ? "checked" : ""} class="task-checkbox" data-task-index="${currentIdx}" />
            <span class="task-text">${label}</span>
          </label>
        </div>`;
      });
      blocks.push(`<div class="md-task-list">${taskItems.join("")}</div>`);
      continue;
    }

    // Numbered Item: check if it is an outline/step header or tight ordered list
    const numMatch = line.match(/^[ \t]*(\d+)\.[ \t]+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      const title = numMatch[2];

      // Check if followed immediately by another numbered item (tight ordered list)
      const isNextLineNumbered = i + 1 < lines.length && /^[ \t]*\d+\.[ \t]+/.test(lines[i + 1]);

      if (isNextLineNumbered) {
        // Collect consecutive numbered list items
        const olLines: { num: string; text: string; indent: number }[] = [];
        while (i < lines.length && /^[ \t]*\d+\.[ \t]+/.test(lines[i])) {
          const m = lines[i].match(/^([ \t]*)(\d+)\.[ \t]+(.*)$/);
          if (m) {
            const indentLevel = Math.floor(m[1].replace(/\t/g, "  ").length / 2);
            olLines.push({ num: m[2], text: m[3], indent: indentLevel });
          }
          i++;
        }
        const lis = olLines.map((item) => {
          const style = item.indent > 0 ? ` style="margin-left: ${item.indent * 18}px;"` : "";
          return `<li class="md-li-numbered" value="${item.num}"${style}>${renderInlineText(item.text)}</li>`;
        });
        const firstNum = olLines[0]?.num || "1";
        blocks.push(`<ol class="md-ol" start="${firstNum}">${lis.join("")}</ol>`);
        continue;
      } else {
        // Standalone step / outline item followed by text or pills
        blocks.push(`<div class="md-step-item">
          <span class="md-step-badge">${escapeHtml(num)}</span>
          <span class="md-step-title">${renderInlineText(title)}</span>
        </div>`);
        i++;
        continue;
      }
    }

    // Resource Pill Bar: line containing items separated by "|" (e.g. Inspiration | Tutorial | Sample outputs)
    if (line.includes("|") && isResourcePillLine(line)) {
      const parts = line
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);
      const pills = parts
        .map((p) => `<span class="md-resource-pill">${renderInlineText(p)}</span>`)
        .join("");
      blocks.push(`<div class="md-resource-bar">${pills}</div>`);
      i++;
      continue;
    }

    // Unordered List items (- item, * item, + item)
    if (/^[ \t]*[-*+][ \t]+/.test(line)) {
      const ulLines: string[] = [];
      while (
        i < lines.length &&
        /^[ \t]*[-*+][ \t]+/.test(lines[i]) &&
        !/^[ \t]*-[ \t]*\[[ xX]\][ \t]+/.test(lines[i])
      ) {
        ulLines.push(lines[i]);
        i++;
      }
      const lis = ulLines.map((l) => {
        const indentMatch = l.match(/^([ \t]*)/);
        const indentLevel = indentMatch ? Math.floor(indentMatch[1].replace(/\t/g, "  ").length / 2) : 0;
        const content = l.replace(/^[ \t]*[-*+][ \t]+/, "");
        const style = indentLevel > 0 ? ` style="margin-left: ${indentLevel * 18}px;"` : "";
        return `<li class="md-li"${style}>${renderInlineText(content)}</li>`;
      });
      blocks.push(`<ul class="md-ul">${lis.join("")}</ul>`);
      continue;
    }

    // Implicit Section Header (e.g. "Build-your-own instructions", "What your video must show", "Submission requirements")
    if (isImplicitSectionHeader(trimmed, lines[i + 1])) {
      blocks.push(`<h3 class="md-section-header">
        <span class="md-header-accent"></span>
        <span>${renderInlineText(trimmed)}</span>
      </h3>`);
      i++;
      continue;
    }

    // Collect paragraph or instruction block
    const rawParagraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^%%WOLF_/.test(lines[i].trim()) &&
      !/^(?:---|___|\*\*\*)$/.test(lines[i].trim()) &&
      !/^#{1,6}[ \t]+/.test(lines[i].trim()) &&
      !/^[ \t]*[-*+][ \t]+/.test(lines[i]) &&
      !/^[ \t]*\d+\.[ \t]+/.test(lines[i]) &&
      !(lines[i].includes("|") && isResourcePillLine(lines[i])) &&
      !isImplicitSectionHeader(lines[i].trim(), lines[i + 1])
    ) {
      rawParagraphLines.push(lines[i].trim());
      i++;
    }

    if (rawParagraphLines.length > 0) {
      // Check if this block is a multi-line instruction or requirement list (e.g. lines starting with action verbs or full sentence rules)
      if (rawParagraphLines.length >= 2 && isInstructionBlock(rawParagraphLines)) {
        const rows = rawParagraphLines.map((pl) => {
          return `<div class="md-instruction-row">
            <span class="md-instruction-bullet">▸</span>
            <span class="md-instruction-text">${renderInlineText(pl)}</span>
          </div>`;
        });
        blocks.push(`<div class="md-instruction-card">${rows.join("")}</div>`);
      } else {
        // Auto-space paragraphs: split distinct standalone sentences into separate paragraphs
        const paragraphGroups: string[][] = [];
        let currentGroup: string[] = [];

        for (let idx = 0; idx < rawParagraphLines.length; idx++) {
          const curLine = rawParagraphLines[idx];
          currentGroup.push(curLine);

          const isSentenceEnd = /[.?!:]$/.test(curLine);
          const nextLine = rawParagraphLines[idx + 1];
          const isNextSentenceStart = nextLine && /^[A-Z0-9"“'‘]/.test(nextLine);

          // If current line ends with terminal punctuation and next line begins a new sentence on a fresh line,
          // automatically format as a distinct paragraph for neat, beautiful spacing!
          if (isSentenceEnd && isNextSentenceStart) {
            paragraphGroups.push(currentGroup);
            currentGroup = [];
          }
        }
        if (currentGroup.length > 0) {
          paragraphGroups.push(currentGroup);
        }

        for (const grp of paragraphGroups) {
          const renderedLines = grp.map((l) => renderInlineText(l));
          blocks.push(`<p class="md-p">${renderedLines.join(" ")}</p>`);
        }
      }
    }
  }

  let finalHtml = blocks.join("\n");

  // 8. Restore protected placeholders
  finalHtml = finalHtml.replace(/%%WOLF_CODEBLOCK_(\d+)%%/g, (_m, idx) => codeBlocks[parseInt(idx, 10)] || "");
  finalHtml = finalHtml.replace(/%%WOLF_CALLOUT_(\d+)%%/g, (_m, idx) => callouts[parseInt(idx, 10)] || "");
  finalHtml = finalHtml.replace(/%%WOLF_TABLE_(\d+)%%/g, (_m, idx) => tables[parseInt(idx, 10)] || "");
  finalHtml = finalHtml.replace(/%%WOLF_BQ_(\d+)%%/g, (_m, idx) => blockquotes[parseInt(idx, 10)] || "");

  return finalHtml;
}

/**
 * Checks if a line is a pipe-delimited resource/navigation bar (e.g. "Inspiration | Tutorial | Sample outputs")
 */
function isResourcePillLine(line: string): boolean {
  const parts = line.split("|").map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2 && parts.every((p) => p.length < 50);
}

/**
 * Checks if a standalone short line is an implicit section header (like "Build-your-own instructions", "What your video must show")
 */
function isImplicitSectionHeader(line: string, nextLine?: string): boolean {
  if (line.length < 3 || line.length > 65) return false;
  // Must start with capital letter or digit
  if (!/^[A-Z0-9]/.test(line)) return false;
  // Must not end with typical sentence punctuation
  if (/[.,;!?]$/.test(line)) return false;
  // Must not have markdown syntax
  if (line.includes("|") || line.includes("`") || line.includes("#")) return false;
  // Must look like a title or section prompt
  const isTitlePattern = /^(?:[A-Z][a-zA-Z0-9_\-\/&'’]+\s*){1,8}$/.test(line);
  const isSpecialKeyword = /^(?:Build|What|How|Format|Submission|Workflow|Instructions|Requirements|Guidelines|Overview|Reference|Notes|Tasks|Deliverables|Key Takeaways)\b/i.test(line);

  return isTitlePattern || isSpecialKeyword;
}

/**
 * Checks if a multi-line paragraph block is actually a list of instructions, requirements, or steps
 */
function isInstructionBlock(lines: string[]): boolean {
  const actionWordCount = lines.filter((l) =>
    /^(?:Start|Show|Open|Include|Adjust|Play|Make|Add|Create|Ensure|Check|Verify|Submit|Use|Avoid|Focus|Borrow|Do|Don't|A final|All|Each|Note)\b/i.test(l)
  ).length;
  // If at least half of the lines start with action verbs or full rule statements
  return actionWordCount >= Math.ceil(lines.length * 0.45);
}

/**
 * Tidy and format inline markdown spans (Bold, Italic, Inline Code, Links, Images, Badges, Typography)
 */
function renderInlineText(raw: string): string {
  if (!raw) return "";

  // 1. Extract & protect inline code spans
  const inlineCodes: string[] = [];
  let text = raw.replace(/`([^`\n]+)`/g, (_m, code) => {
    const token = `%%WOLF_INLINE_${inlineCodes.length}%%`;
    inlineCodes.push(`<code class="md-code-inline">${escapeHtml(code)}</code>`);
    return token;
  });

  // 2. Escape raw HTML tags in plain text
  text = escapeHtml(text);

  // 3. Lead Badges: "Format ideas: rest of text" or "Note: rest of text"
  text = text.replace(/^([A-Z][a-zA-Z0-9 _\-]+:)\s+(.*)$/, (_m, lead, rest) => {
    return `<span class="md-lead-badge">${lead}</span> <span class="md-lead-content">${rest}</span>`;
  });

  // 4. Images: ![alt](url "title")
  text = text.replace(/!\[([^\]]*)\]\(([^\)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_m, alt, url, _title) => {
    const safeUrl = sanitizeUrl(url);
    const caption = alt ? `<figcaption class="md-figcaption">${alt}</figcaption>` : "";
    return `<figure class="md-figure"><img src="${safeUrl}" alt="${alt}" class="md-img" loading="lazy" />${caption}</figure>`;
  });

  // 5. Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^\)\s]+)\)/g, (_m, label, url) => {
    const safeUrl = sanitizeUrl(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="md-link">${label} <span class="md-link-icon">↗</span></a>`;
  });

  // 6. Internal Wikilinks: [[Note Title]] or [[id|title]]
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, target, alias) => {
    const display = alias || target;
    return `<span class="md-wikilink" title="Internal Note: ${target}">📄 ${display}</span>`;
  });

  // 7. Bold & Italic
  text = text
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/___([^_]+)___/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Match single underscores only around word boundaries (to avoid breaking snake_case variables)
    .replace(/(?:^|\s)_([^_]+)_(?=\s|$|[.,;:!?])/g, " <em>$1</em>");

  // 8. Strikethrough: ~~text~~
  text = text.replace(/~~([^~]+)~~/g, "<del class=\"md-del\">$1</del>");

  // 9. Highlight / Mark: ==text==
  text = text.replace(/==([^=]+)==/g, "<mark class=\"md-mark\">$1</mark>");

  // 10. Keyboard Keys: <kbd>key</kbd> (encoded as &lt;kbd&gt;key&lt;/kbd&gt;)
  text = text.replace(/&lt;kbd&gt;(.*?)&lt;\/kbd&gt;/gi, "<kbd class=\"md-kbd\">$1</kbd>");

  // 11. Tags: #tag (word boundaries, alphanumeric + hyphens)
  text = text.replace(/(?:^|\s)#([a-zA-Z0-9_\-\/]+)(?=\s|$|[.,;:!?])/g, (match, tag) => {
    const prefix = match.startsWith(" ") ? " " : "";
    return `${prefix}<span class="md-tag">#${tag}</span>`;
  });

  // 12. Smart Typography Tidying (arrows, symbols, em-dashes)
  text = text
    .replace(/--&gt;/g, "→")
    .replace(/-&gt;/g, "→")
    .replace(/&lt;--/g, "←")
    .replace(/&lt;-/g, "←")
    .replace(/==&gt;/g, "⇒")
    .replace(/!=/g, "≠")
    .replace(/&gt;=/g, "≥")
    .replace(/&lt;=/g, "≤")
    .replace(/\.\.\./g, "…")
    .replace(/(?<=\s)--(?:-)?(?=\s)/g, "—");

  // 13. Restore protected inline code
  text = text.replace(/%%WOLF_INLINE_(\d+)%%/g, (_m, idx) => inlineCodes[parseInt(idx, 10)] || "");

  return text;
}

/**
 * Toggle task checklist at given index
 */
export function toggleTaskInMarkdown(raw: string, taskIndex: number, newChecked: boolean): string {
  let counter = 0;
  return raw.replace(/^([ \t]*-[ \t]*\[)([ xX])(\][ \t]+.*$)/gm, (match, prefix, _state, suffix) => {
    if (counter === taskIndex) {
      counter++;
      return `${prefix}${newChecked ? "x" : " "}${suffix}`;
    }
    counter++;
    return match;
  });
}

/**
 * Clean up raw markdown for card preview snippet (removes markdown syntax symbols, trims tidily)
 */
export function cleanMarkdownSnippet(raw: string, maxLen = 140): string {
  if (!raw) return "";
  const cleaned = raw
    .replace(/```[\s\S]*?```/g, " [Code Block] ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>[ \t]*\[![A-Z]+\][ \t]*/gm, "")
    .replace(/^>[ \t]*/gm, "")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/==([^=]+)==/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/-\s*\[[ xX]\]\s*/g, "☑ ")
    .replace(/[-*+]\s+/g, "• ")
    .replace(/\|/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, "$2 || $1")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.substring(0, maxLen).trim() + "…";
}
