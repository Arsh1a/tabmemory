import { writable } from "svelte/store";
import { db } from "@/lib/db";
import { getRecentPages } from "@/lib/search";
import type { StoredPage } from "@/types/messages";

export const recent = writable<StoredPage[]>([]);
export const totalPages = writable(0);

export async function refreshMemory() {
  const [pages, stats] = await Promise.all([getRecentPages(), db.getStats()]);
  recent.set(pages);
  totalPages.set(stats.totalPages);
}

refreshMemory();

export function removePage(id: string) {
  recent.update((prev) => prev.filter((p) => p.id !== id));
  totalPages.update((n) => Math.max(0, n - 1));
}

export function clearMemory() {
  recent.set([]);
  totalPages.set(0);
}
