/**
 * Sovereign Bookmark Auto-Classifier
 * Classifies bookmark URLs and titles into smart tags, domains, and categories
 * with zero-cloud offline heuristics.
 */

export interface ClassificationRule {
  tag: string;
  category: "dev" | "ai" | "docs" | "tools" | "design" | "research" | "finance" | "media";
  patterns: RegExp[];
}

export const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    tag: "ai-llm",
    category: "ai",
    patterns: [
      /openai\.com/i,
      /anthropic\.com/i,
      /claude\.ai/i,
      /huggingface\.co/i,
      /ollama/i,
      /deepseek/i,
      /gemini/i,
      /groq/i,
      /kokoro/i,
      /tts/i,
      /asr/i,
      /whisper/i,
      /agent/i,
      /prompt/i,
    ],
  },
  {
    tag: "developer-tools",
    category: "tools",
    patterns: [
      /github\.com/i,
      /gitlab\.com/i,
      /bitbucket/i,
      /docker/i,
      /tauri\.app/i,
      /electron/i,
      /vscode/i,
      /cursor\.sh/i,
      /postman/i,
      /insomnia/i,
      /terminal/i,
      /git/i,
    ],
  },
  {
    tag: "frontend-web",
    category: "dev",
    patterns: [
      /vue/i,
      /react/i,
      /svelte/i,
      /angular/i,
      /vite/i,
      /typescript/i,
      /javascript/i,
      /css/i,
      /tailwind/i,
      /html/i,
      /nextjs/i,
      /nuxt/i,
    ],
  },
  {
    tag: "backend-systems",
    category: "dev",
    patterns: [
      /rust-lang/i,
      /crates\.io/i,
      /golang/i,
      /python/i,
      /postgres/i,
      /sqlite/i,
      /redis/i,
      /database/i,
      /sql/i,
      /api/i,
      /graphql/i,
      /grpc/i,
      /actix/i,
      /axum/i,
    ],
  },
  {
    tag: "documentation",
    category: "docs",
    patterns: [
      /docs\./i,
      /\/docs/i,
      /documentation/i,
      /manual/i,
      /reference/i,
      /cheatsheet/i,
      /developer\.mozilla\.org/i,
      /mdn/i,
      /rfc/i,
      /specification/i,
    ],
  },
  {
    tag: "design-ui",
    category: "design",
    patterns: [
      /figma\.com/i,
      /dribbble/i,
      /behance/i,
      /font/i,
      /icon/i,
      /svg/i,
      /color/i,
      /palette/i,
      /glassmorphism/i,
      /design-system/i,
      /unsplash/i,
    ],
  },
  {
    tag: "research-papers",
    category: "research",
    patterns: [
      /arxiv\.org/i,
      /paperswithcode/i,
      /biorxiv/i,
      /researchgate/i,
      /wikipedia\.org/i,
      /scholar/i,
      /whitepaper/i,
    ],
  },
  {
    tag: "finance-business",
    category: "finance",
    patterns: [
      /stripe\.com/i,
      /paddle/i,
      /lemon\s*squeezy/i,
      /pricing/i,
      /saas/i,
      /invest/i,
      /crypto/i,
      /bitcoin/i,
      /revenue/i,
      /invoice/i,
    ],
  },
  {
    tag: "media-video",
    category: "media",
    patterns: [
      /youtube\.com/i,
      /youtu\.be/i,
      /vimeo/i,
      /spotify/i,
      /podcast/i,
      /soundcloud/i,
      /twitch/i,
      /bilibili/i,
    ],
  },
];

/**
 * Automatically classifies a bookmark title and URL into suggested tags and category.
 */
export function autoClassifyBookmark(
  url: string,
  title: string,
  existingTags: string[] = []
): { suggestedTags: string[]; category: string } {
  const text = `${url} ${title}`.toLowerCase();
  const assignedTags = new Set<string>(existingTags);
  let primaryCategory = "general";

  for (const rule of CLASSIFICATION_RULES) {
    for (const pat of rule.patterns) {
      if (pat.test(text)) {
        assignedTags.add(rule.tag);
        if (primaryCategory === "general") {
          primaryCategory = rule.category;
        }
        break;
      }
    }
  }

  // Extract clean domain as tag
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");
    const baseName = domain.split(".")[0];
    if (baseName && baseName.length > 2 && !assignedTags.has(baseName)) {
      assignedTags.add(baseName);
    }
  } catch {}

  return {
    suggestedTags: Array.from(assignedTags),
    category: primaryCategory,
  };
}
