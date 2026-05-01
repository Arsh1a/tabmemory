import { MAX_RECENT_SHOWN_PAGES_LIMIT } from "@/constants";
import { db } from "./db";
import type { SearchResult, StoredPage } from "@/types/messages";

function getQueryEmbedding(query: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reqId = crypto.randomUUID();
    const timer = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener);
      reject(new Error("Query embedding timed out"));
    }, 30_000);

    const listener = (msg: {
      type: string;
      payload?: { vector: number[]; reqId: string };
    }) => {
      if (msg.type === "QUERY_EMBEDDING" && msg.payload?.reqId === reqId) {
        clearTimeout(timer);
        chrome.runtime.onMessage.removeListener(listener);
        resolve(msg.payload.vector);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    chrome.runtime.sendMessage({
      type: "EMBED_QUERY",
      payload: { query, reqId },
    });
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "who",
  "whom",
  "what",
  "where",
  "when",
  "how",
  "that",
  "this",
  "was",
  "were",
  "is",
  "are",
  "be",
  "been",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "which",
  "their",
  "its",
  "about",
  "into",
]);

function keywordScore(text: string, query: string): number {
  const lower = text.toLowerCase();
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  if (words.length === 0) return 0;
  const matched = words.filter((w) => lower.includes(w)).length;
  return matched / words.length;
}

function extractSnippet(text: string, query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const lower = text.toLowerCase();

  let bestIdx = 0;
  for (const word of words) {
    const idx = lower.indexOf(word);
    if (idx !== -1) {
      bestIdx = idx;
      break;
    }
  }

  const start = Math.max(0, bestIdx - 80);
  const end = Math.min(text.length, bestIdx + 160);
  let snippet = text.slice(start, end).trim();

  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";

  return snippet;
}

export async function search(
  query: string,
  topK = 10,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const [queryVector, pages] = await Promise.all([
    getQueryEmbedding(query),
    db.getAllPages() as Promise<StoredPage[]>,
  ]);

  if (pages.length === 0) return [];

  const scored = pages
    .map((page) => ({
      ...page,
      score:
        Math.max(
          ...page.embeddings.map((e) => cosineSimilarity(queryVector, e)),
        ) *
          0.7 +
        keywordScore(page.text, query) * 0.3,
    }))
    .sort((a, b) => b.score - a.score);

  const filtered = scored.filter((p) => p.score > 0.45).slice(0, topK);

  return filtered.map(({ embeddings: _embeddings, text, ...rest }) => ({
    ...rest,
    text,
    snippet: extractSnippet(text, query),
  }));
}

export async function getRecentPages() {
  return db.getRecentPages(MAX_RECENT_SHOWN_PAGES_LIMIT);
}
