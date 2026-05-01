import { EXCLUDED_DOMAINS } from "@/constants";

const STORAGE_KEY = "excludedDomains";

export async function getUserExcludedDomains(): Promise<string[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const value: unknown = result[STORAGE_KEY];
  return Array.isArray(value) ? value : [];
}

export async function setUserExcludedDomains(domains: string[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: domains });
}

export function normalizeDomain(input: string): string {
  const trimmed = input.trim().toLowerCase();
  try {
    // Accept full URLs — extract just the hostname
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
      .hostname;
  } catch {
    return trimmed;
  }
}

export function isExcluded(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return true;
    return EXCLUDED_DOMAINS.has(hostname) || hostname.endsWith(".local");
  } catch {
    return true;
  }
}
