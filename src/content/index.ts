/**
 * Content Script - runs on every page at document_idle.
 *
 * Responsibilities:
 *  1. Wait for the page to settle (skip if too short or excluded)
 *  2. Extract clean article text via @mozilla/readability
 *  3. Send PageData to the background service worker
 *
 */

import { Readability } from "@mozilla/readability";
import { type PageData } from "@/types/messages";
import { isExcluded } from "@/lib/excluded";
import { prepareText } from "@/lib/textprep";

const MIN_TEXT_LENGTH = 200;
const DEBOUNCE_MS = 2000; // wait 2s after load before extracting

function extractPage(): PageData | null {
  const url = location.href;

  if (isExcluded(url)) return null;

  // Clone the document so Readability can mutate it freely
  const documentClone = document.implementation.createHTMLDocument();
  documentClone.replaceChild(
    documentClone.importNode(document.documentElement, true),
    documentClone.documentElement,
  );
  const reader = new Readability(documentClone);
  const article = reader.parse();

  if (!article || !article.textContent) return null;

  const raw = article.textContent.replace(/\s+/g, " ").trim();

  if (raw.length < MIN_TEXT_LENGTH) return null;

  const text = prepareText(raw);
  const excerpt = text.slice(0, 200).trim() + "…";

  return {
    url,
    title: article.title || document.title,
    text,
    excerpt,
    timestamp: Date.now(),
  };
}

// Debounce: single-page apps may still be loading
let timer: ReturnType<typeof setTimeout>;

function scheduleExtraction() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    // Skip if user is in private/incognito — chrome.extension is undefined there
    if (typeof chrome === "undefined" || !chrome.runtime?.id) return;

    const { indexingEnabled } = await chrome.storage.local.get("indexingEnabled");
    if (indexingEnabled === false) return;

    const pageData = extractPage();
    if (!pageData) return;

    chrome.runtime.sendMessage({ type: "PAGE_EXTRACTED", payload: pageData });
  }, DEBOUNCE_MS);
}

scheduleExtraction();

// Re-run on SPA navigations (pushState / replaceState / hashchange)
const originalPushState = history.pushState.bind(history);
history.pushState = (...args) => {
  originalPushState(...args);
  scheduleExtraction();
};

window.addEventListener("popstate", scheduleExtraction);
