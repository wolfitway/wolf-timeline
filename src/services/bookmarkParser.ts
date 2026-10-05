import type { WebBookmark } from "@/types";

export interface ParsedBookmark {
  url: string;
  title: string;
  folder?: string;
  addDate?: string;
}

/**
 * Standard Netscape Bookmark Format Parser
 * Compatible with Chrome, Firefox, Safari, Brave, Edge, and Arc exported bookmark HTML.
 */
export function parseNetscapeBookmarkHtml(htmlContent: string): ParsedBookmark[] {
  const bookmarks: ParsedBookmark[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  // Traverse links
  const links = doc.querySelectorAll("a");
  links.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("place:") || href.startsWith("javascript:")) {
      return;
    }

    const title = a.textContent?.trim() || href;
    const addDateAttr = a.getAttribute("add_date");
    let addDate: string | undefined;
    if (addDateAttr) {
      try {
        const timestamp = parseInt(addDateAttr, 10);
        if (!isNaN(timestamp)) {
          // If in seconds vs milliseconds
          const d = timestamp > 1e11 ? new Date(timestamp) : new Date(timestamp * 1000);
          addDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      } catch {}
    }

    // Attempt to discover parent folder name
    let folder: string | undefined;
    const parentDl = a.closest("dl");
    if (parentDl) {
      const prevHeader = parentDl.previousElementSibling;
      if (prevHeader && (prevHeader.tagName === "H3" || prevHeader.tagName === "H2" || prevHeader.tagName === "H1")) {
        folder = prevHeader.textContent?.trim();
      }
    }

    bookmarks.push({
      url: href,
      title,
      folder,
      addDate: addDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  });

  return bookmarks;
}

import { autoClassifyBookmark } from "@/services/bookmarkClassifier";

/**
 * Converts a parsed bookmark into a full sovereign WebBookmark item with tags and domain
 */
export function convertToWebBookmark(parsed: ParsedBookmark): WebBookmark {
  let domain = "";
  try {
    const parsedUrl = new URL(parsed.url);
    domain = parsedUrl.hostname.replace(/^www\./, "");
  } catch {
    domain = "web";
  }

  const baseTags: string[] = ["imported", "bookmark"];
  if (parsed.folder) {
    const cleanFolder = parsed.folder.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (cleanFolder) baseTags.push(cleanFolder);
  }

  const { suggestedTags } = autoClassifyBookmark(parsed.url, parsed.title, baseTags);

  return {
    id: `bm_imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: parsed.title,
    url: parsed.url,
    domain: domain || "link",
    date: parsed.addDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    note: parsed.folder ? `Imported from bookmark folder: ${parsed.folder}` : "Imported sovereign bookmark",
    tags: suggestedTags,
    fetch_status: "idle",
  };
}
