/**
 * Sovereign Markdown Rendering Engine
 * Offline-first, XSS-safe parser supporting:
 * - Headings (H1 - H4)
 * - Code Blocks with language badge & 1-click copy
 * - Callout Alerts ([!NOTE], [!TIP], [!WARNING], [!IMPORTANT])
 * - Multi-Column Markdown Tables
 * - Interactive Task Checklists (- [ ] and - [x])
 * - Blockquotes, Lists, Text Formatting, Links & Images
 */

export function renderMarkdown(raw: string): string {
  if (!raw) return "";

  // 1. Sanitize raw HTML tags to prevent XSS while preserving Markdown
  let text = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Restore blockquote indicators for markdown processing
  text = text.replace(/^&gt; ?/gm, "> ");

  // 2. Code blocks (```lang ... ```)
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const cleanLang = lang || "plaintext";
    const encoded = encodeURIComponent(code.trim());
    return `<div class="md-codeblock-wrapper">
      <div class="codeblock-header">
        <span class="codeblock-lang">${cleanLang}</span>
        <button type="button" class="btn-code-copy" data-code="${encoded}">📋 Copy</button>
      </div>
      <pre class="md-pre"><code class="md-code-multiline">${code.trim()}</code></pre>
    </div>`;
  });

  // 3. Callout Alerts (> [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT])
  text = text.replace(
    /^> \[!(NOTE|TIP|WARNING|IMPORTANT)\]\n((?:> .*\n?)+)/gm,
    (_match, type, content) => {
      const cleanContent = content.replace(/^> /gm, "").trim();
      const iconMap: Record<string, string> = {
        NOTE: "ℹ️ NOTE",
        TIP: "💡 TIP",
        WARNING: "⚠️ WARNING",
        IMPORTANT: "🚨 IMPORTANT",
      };
      return `<div class="md-callout md-callout-${type.toLowerCase()}">
        <div class="callout-header">${iconMap[type] || type}</div>
        <div class="callout-body">${cleanContent}</div>
      </div>`;
    }
  );

  // 4. Blockquotes
  text = text.replace(/^> (.*$)/gim, '<blockquote class="md-blockquote">$1</blockquote>');

  // 5. Tables
  text = text.replace(/((?:\|[^\n]+\|\n?)+)/g, (match) => {
    const lines = match.trim().split("\n");
    if (lines.length < 2) return match;

    const parseRow = (line: string, isHeader: boolean) => {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      const tag = isHeader ? "th" : "td";
      return `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;
    };

    // Check if line 1 is separator | :--- | :--- |
    const hasSep = /^\|[\s\-:]+\|\s*$/.test(lines[1]);
    const headerRow = parseRow(lines[0], true);
    const bodyRows = lines
      .slice(hasSep ? 2 : 1)
      .map((l) => parseRow(l, false))
      .join("");

    return `<div class="table-responsive"><table class="md-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table></div>`;
  });

  // 6. Interactive Task Checklist (- [ ] and - [x])
  let taskCounter = 0;
  text = text.replace(/^(\s*)-\s*\[([ xX])\]\s*(.*$)/gm, (_match, _spaces, state, label) => {
    const checked = state.toLowerCase() === "x";
    const idx = taskCounter++;
    return `<div class="md-task-item ${checked ? 'checked' : ''}">
      <input type="checkbox" ${checked ? "checked" : ""} class="task-checkbox" data-task-index="${idx}" />
      <span class="task-label">${label}</span>
    </div>`;
  });

  // 7. Headings
  text = text
    .replace(/^#### (.*$)/gim, '<h4 class="md-h4">$1</h4>')
    .replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // 8. Text Formatting: Bold, Italic, Strikethrough, Inline Code
  text = text
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/~~(.*?)~~/gim, "<del>$1</del>")
    .replace(/`([^`]+)`/gim, '<code class="md-code-inline">$1</code>');

  // 9. Links & Images
  text = text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<figure class="md-figure"><img src="$2" alt="$1" class="md-img" /><figcaption>$1</figcaption></figure>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1 ↗</a>');

  // 10. Unordered & Ordered Lists
  text = text
    .replace(/^\- (.*$)/gim, '<li class="md-li">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="md-li-numbered">$1</li>');

  // 11. Horizontal Rule
  text = text.replace(/^---$/gm, '<hr class="md-divider" />');

  // 12. Paragraphs & Line Breaks
  text = text.replace(/\n\n+/gim, '<div class="md-spacer"></div>').replace(/\n/gim, "<br/>");

  return text;
}

/**
 * Toggle task checklist at given index
 */
export function toggleTaskInMarkdown(raw: string, taskIndex: number, newChecked: boolean): string {
  let counter = 0;
  return raw.replace(/^(\s*-\s*\[)([ xX])(\]\s*.*$)/gm, (match, prefix, _state, suffix) => {
    if (counter === taskIndex) {
      counter++;
      return `${prefix}${newChecked ? "x" : " "}${suffix}`;
    }
    counter++;
    return match;
  });
}

/**
 * Clean up raw markdown for card preview snippet (removes markdown syntax symbols)
 */
export function cleanMarkdownSnippet(raw: string, maxLen = 140): string {
  if (!raw) return "";
  const cleaned = raw
    .replace(/```[\s\S]*?```/g, " [Code Block] ")
    .replace(/^#+\s+/gm, "")
    .replace(/^> \[[!A-Z]+\]/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/-\s*\[[ xX]\]\s*/g, "☑ ")
    .replace(/-\s+/g, "• ")
    .replace(/\|/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.substring(0, maxLen).trim() + "...";
}
