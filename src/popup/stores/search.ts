import { writable } from "svelte/store";
import { search } from "@/lib/search";
import type { SearchResult } from "@/types/messages";

export const query = writable("");
export const results = writable<SearchResult[]>([]);
export const searching = writable(false);

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
      results.set(await search(q, 10));
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
