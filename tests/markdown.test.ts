import { describe, it, expect } from "vitest";
import {
  renderMarkdown,
  toggleTaskInMarkdown,
  cleanMarkdownSnippet,
} from "../src/services/markdownRenderer";

describe("Sovereign Markdown Engine & Typography Tidying", () => {
  it("renders headings H1 through H6 with correct classes", () => {
    const md = "# Title 1\n## Title 2\n### Title 3\n#### Title 4\n##### Title 5\n###### Title 6";
    const html = renderMarkdown(md);
    expect(html).toContain('<h1 class="md-h1">Title 1</h1>');
    expect(html).toContain('<h2 class="md-h2">Title 2</h2>');
    expect(html).toContain('<h3 class="md-h3">Title 3</h3>');
    expect(html).toContain('<h4 class="md-h4">Title 4</h4>');
    expect(html).toContain('<h5 class="md-h5">Title 5</h5>');
    expect(html).toContain('<h6 class="md-h6">Title 6</h6>');
  });

  it("renders fenced code blocks cleanly without rogue <br> tags in code", () => {
    const raw = "```typescript\nconst a = 1;\n\nconst b = 2;\n```";
    const html = renderMarkdown(raw);
    expect(html).toContain('class="md-codeblock-wrapper"');
    expect(html).toContain('<span class="codeblock-lang">typescript</span>');
    expect(html).toContain('class="btn-code-copy"');
    expect(html).toContain('<pre class="md-pre"><code class="md-code-multiline language-typescript">const a = 1;\n\nconst b = 2;</code></pre>');
    // Ensure no <br> tags leaked into the code block
    expect(html).not.toContain('<br/>');
  });

  it("renders interactive task checklists and correlates with toggleTaskInMarkdown", () => {
    const raw = "- [ ] First item\n- [x] Second item\n- [ ] Third item";
    const html = renderMarkdown(raw);

    expect(html).toContain('class="md-task-list"');
    expect(html).toContain('data-task-index="0"');
    expect(html).toContain('data-task-index="1"');
    expect(html).toContain('data-task-index="2"');
    expect(html).toContain('class="md-task-item checked"');

    // Toggle item 0 from unchecked to checked
    const updated1 = toggleTaskInMarkdown(raw, 0, true);
    expect(updated1).toContain("- [x] First item");

    // Toggle item 1 from checked to unchecked
    const updated2 = toggleTaskInMarkdown(raw, 1, false);
    expect(updated2).toContain("- [ ] Second item");
  });

  it("groups lists into semantic <ul> and <ol> with indentation support", () => {
    const ulMd = "- Alpha\n  - Beta\n- Gamma";
    const ulHtml = renderMarkdown(ulMd);
    expect(ulHtml).toContain('<ul class="md-ul">');
    expect(ulHtml).toContain('<li class="md-li">Alpha</li>');
    expect(ulHtml).toContain('style="margin-left: 18px;"');

    const olMd = "1. First\n2. Second";
    const olHtml = renderMarkdown(olMd);
    expect(olHtml).toContain('class="md-ol"');
    expect(olHtml).toContain('class="md-li-numbered"');
    expect(olHtml).toContain('First');
  });

  it("renders rich callout alerts with icons and custom styling", () => {
    const md = "> [!NOTE]\n> Remember to verify cryptographic hashes.\n> Offline proof only.";
    const html = renderMarkdown(md);
    expect(html).toContain('class="md-callout md-callout-note"');
    expect(html).toContain('class="callout-title">Note</span>');
    expect(html).toContain("Remember to verify cryptographic hashes.");
  });

  it("renders multi-column markdown tables with alignment", () => {
    const tableMd = "| Command | Shortcut | Mode |\n| :--- | :---: | ---: |\n| Save | Ctrl+S | Global |\n| Search | Ctrl+K | Quick |";
    const html = renderMarkdown(tableMd);
    expect(html).toContain('class="table-responsive"');
    expect(html).toContain('<table class="md-table">');
    expect(html).toContain('style="text-align: center"');
    expect(html).toContain('style="text-align: right"');
    expect(html).toContain('<td style="text-align: left">Save</td>');
  });

  it("supports inline formatting: bold, italic, highlights, tags, and inline code", () => {
    const md = "This is **bold** and *italic* and ==highlighted== with `inline_code()` and #sovereign tag.";
    const html = renderMarkdown(md);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain('<mark class="md-mark">highlighted</mark>');
    expect(html).toContain('<code class="md-code-inline">inline_code()</code>');
    expect(html).toContain('<span class="md-tag">#sovereign</span>');
  });

  it("tidies up text typography: arrows, symbols, and em-dashes", () => {
    const md = "Convert a -> b and x != y and p >= 10 and note -- explanation...";
    const html = renderMarkdown(md);
    expect(html).toContain("a → b");
    expect(html).toContain("x ≠ y");
    expect(html).toContain("p ≥ 10");
    expect(html).toContain("note — explanation…");
  });

  it("neutralizes malicious scripts and unsafe javascript: urls", () => {
    const dangerous = '<script>alert("xss")</script>\n[Click](javascript:stealData())';
    const html = renderMarkdown(dangerous);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('href="javascript:stealData()"');
    expect(html).toContain('href="#"');
  });

  it("cleans markdown snippets accurately for note card previews", () => {
    const md = "# Sovereign Header\n\n```ts\nconst x = 1;\n```\n\nCheck out **this** ==important== - [ ] task item.";
    const snippet = cleanMarkdownSnippet(md, 80);
    expect(snippet).not.toContain("#");
    expect(snippet).not.toContain("```");
    expect(snippet).not.toContain("**");
    expect(snippet).not.toContain("==");
    expect(snippet).toContain("Sovereign Header");
    expect(snippet).toContain("☑ task item.");
  });

  it("renders complex technical outline with step badges, resource pills, and instruction cards", () => {
    const rawNote = `1. Hail Mary highlight trails
Bright highlights stretch into directional trails.
Inspiration | Tutorial | Sample outputs | Workflow

2. Shape flicker
Flickering squares and rectangles add movement.
Inspiration | Sample output

Build-your-own instructions
What your video must show
Start with the finished effect.
Show your starting footage being added.
Show your direction.
Play the final result with sound on.

Format ideas: a split-screen of the finished effect beside the timeline.`;

    const html = renderMarkdown(rawNote);

    // Numbered step badges that preserve 1 and 2
    expect(html).toContain('<span class="md-step-badge">1</span>');
    expect(html).toContain('Hail Mary highlight trails');
    expect(html).toContain('<span class="md-step-badge">2</span>');
    expect(html).toContain('Shape flicker');

    // Resource pills
    expect(html).toContain('class="md-resource-bar"');
    expect(html).toContain('<span class="md-resource-pill">Inspiration</span>');
    expect(html).toContain('<span class="md-resource-pill">Tutorial</span>');

    // Section headers
    expect(html).toContain('class="md-section-header"');
    expect(html).toContain('Build-your-own instructions');

    // Instruction cards
    expect(html).toContain('class="md-instruction-card"');
    expect(html).toContain('class="md-instruction-bullet">▸</span>');
    expect(html).toContain('Start with the finished effect.');

    // Lead badge
    expect(html).toContain('class="md-lead-badge">Format ideas:</span>');
  });
});
