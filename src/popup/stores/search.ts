import { writable } from "svelte/store";
import { search } from "@/lib/search";
import type { SearchResult } from "@/types/messages";

export const query = writable("");
export const results = writable<SearchResult[]>([]);
export const searching = writable(false);
export const recentSearches = writable<string[]>([]);

const RECENT_KEY = "recentSearches";
const MAX_RECENT = 8;

chrome.storage.local.get(RECENT_KEY).then((s) => {
  recentSearches.set((s[RECENT_KEY] as string[]) ?? []);
});

async function saveRecentSearch(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  recentSearches.update((prev) => {
    const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
    chrome.storage.local.set({ [RECENT_KEY]: next });
    return next;
  });
}

export async function removeRecentSearch(q: string) {
  recentSearches.update((prev) => {
    const next = prev.filter((s) => s !== q);
    chrome.storage.local.set({ [RECENT_KEY]: next });
    return next;
  });
}

let debounce: ReturnType<typeof setTimeout> | undefined;

export function handleSearch(q: string) {
  query.set(q);
  clearTimeout(debounce);
  if (!q.trim()) {
    results.set([]);
    searching.set(false);
    return;
  }
  searching.set(true);
  debounce = setTimeout(async () => {
    try {
      const found = await search(q, 10);
      results.set(found);
      if (found.length > 0) saveRecentSearch(q);
    } catch {
      results.set([]);
    } finally {
      searching.set(false);
    }
  }, 400);
}

export function removeResult(id: string) {
  results.update((prev) => prev.filter((r) => r.id !== id));
}

export function clearResults() {
  results.set([]);
}
