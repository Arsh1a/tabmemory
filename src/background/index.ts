/**
 * Background Service Worker - the central coordinator.
 *
 * Responsibilities:
 *  1. Receive extracted pages from content scripts and decide whether to index them
 *  2. Manage the embed queue and forward pages to the offscreen document one at a time
 *  3. Persist indexed pages to IndexedDB and evict oldest when over the page limit
 *  4. Track model state and relay it to the popup
 *  5. Relay QUERY_EMBEDDING responses from offscreen back to the popup
 *  6. Persist the embed queue to session storage so it survives service worker restarts
 *
 */

import { MAX_PAGES } from "@/constants";
import { db } from "@/lib/db";
import { getUserExcludedDomains, isExcluded } from "@/lib/excluded";
import { normalizeUrl } from "@/lib/url";
import { type Msg, type PageData } from "@/types/messages";

const OFFSCREEN_URL = chrome.runtime.getURL("src/offscreen/index.html");

const pending = new Set<string>();

type ModelState =
  | { status: "idle" }
  | {
      status: "downloading";
      progress: number;
      file: string;
      loaded: number;
      total: number;
    }
  | { status: "ready" }
  | { status: "error"; message: string };

let modelState: ModelState = { status: "idle" };

const embedQueue: PageData[] = [];
let isEmbedding = false;
let currentPage: { title: string; url: string } | null = null;
let currentPageData: PageData | null = null;

// Session storage keys
const SESSION_QUEUE_KEY = "embedQueue";
const SESSION_CURRENT_KEY = "currentPageData";

async function persistQueue() {
  await chrome.storage.session.set({
    [SESSION_QUEUE_KEY]: embedQueue,
    [SESSION_CURRENT_KEY]: currentPageData,
  });
}

async function restoreQueue() {
  const data = await chrome.storage.session.get([
    SESSION_QUEUE_KEY,
    SESSION_CURRENT_KEY,
  ]);
  const savedQueue = (data[SESSION_QUEUE_KEY] ?? []) as PageData[];
  const savedCurrent = (data[SESSION_CURRENT_KEY] ?? null) as PageData | null;

  // Re-prepend the interrupted page so it gets retried
  const toRestore = savedCurrent ? [savedCurrent, ...savedQueue] : savedQueue;

  if (toRestore.length > 0) {
    embedQueue.push(...toRestore);
    toRestore.forEach((p) => pending.add(p.url));
    processQueue();
  }
}

function broadcastIndexingState() {
  chrome.runtime
    .sendMessage({
      type: "INDEXING_UPDATE",
      payload: {
        current: currentPage,
        queue: embedQueue.map((p) => ({ title: p.title || p.url, url: p.url })),
      },
    })
    .catch(() => {});
}

async function processQueue() {
  if (isEmbedding || embedQueue.length === 0) return;
  isEmbedding = true;

  const page = embedQueue.shift()!;
  currentPageData = page;
  currentPage = { title: page.title || page.url, url: page.url };
  await persistQueue();
  broadcastIndexingState();

  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: "EMBED_PAGE", payload: page });
}

// Offscreen document management

let offscreenReadyResolve: (() => void) | null = null;
const offscreenReadyPromise = new Promise<void>((resolve) => {
  offscreenReadyResolve = resolve;
});

async function ensureOffscreenDocument() {
  const existing = await chrome.offscreen.hasDocument();
  if (!existing) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
      justification: "Run Transformers.js ONNX model for local embeddings",
    });
    await offscreenReadyPromise;
  }
}

// Message handler

const NEEDS_RESPONSE = new Set<Msg["type"]>([
  "GET_MODEL_STATE",
  "GET_INDEXING_STATE",
  "GET_STATS",
]);

chrome.runtime.onMessage.addListener((msg: Msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "OFFSCREEN_READY": {
        offscreenReadyResolve?.();
        break;
      }

      case "PAGE_EXTRACTED": {
        const { indexingEnabled } = await chrome.storage.local.get("indexingEnabled");
        if (indexingEnabled === false) break;
        const url = normalizeUrl(msg.payload.url);
        const payload = { ...msg.payload, url };
        if (isExcluded(url) || pending.has(url)) break;
        const userExcluded = await getUserExcludedDomains();
        try {
          const hostname = new URL(url).hostname;
          if (
            userExcluded.some(
              (d) => hostname === d || hostname.endsWith(`.${d}`),
            )
          )
            break;
        } catch {
          break;
        }
        const existing = await db.getByUrl(url);
        if (existing) break;
        pending.add(url);
        embedQueue.push(payload);
        await persistQueue();
        processQueue();
        break;
      }

      case "EMBED_DONE": {
        const storedPage = msg.payload;
        await db.savePage(storedPage);
        await db.evictOldest(MAX_PAGES);
        pending.delete(storedPage.url);
        updateBadge();
        isEmbedding = false;
        currentPage = null;
        currentPageData = null;
        await persistQueue();
        broadcastIndexingState();
        processQueue();
        break;
      }

      case "EMBED_ERROR": {
        pending.delete(msg.payload.url);
        console.warn(
          `[TabMemory] Embedding failed for ${msg.payload.url}:`,
          msg.payload.error,
        );
        isEmbedding = false;
        currentPage = null;
        currentPageData = null;
        await persistQueue();
        broadcastIndexingState();
        processQueue();
        break;
      }

      case "GET_INDEXING_STATE": {
        sendResponse({
          current: currentPage,
          queue: embedQueue.map((p) => ({
            title: p.title || p.url,
            url: p.url,
          })),
        });
        break;
      }

      case "GET_MODEL_STATE": {
        sendResponse(modelState);
        break;
      }

      case "GET_STATS": {
        const stats = await db.getStats();
        sendResponse({ type: "STATS", payload: stats });
        break;
      }

      case "MODEL_PROGRESS": {
        modelState = { status: "downloading", ...msg.payload };
        chrome.runtime
          .sendMessage({ type: "MODEL_PROGRESS", payload: msg.payload })
          .catch(() => {});
        break;
      }

      case "MODEL_READY": {
        modelState = { status: "ready" };
        chrome.runtime.sendMessage({ type: "MODEL_READY" }).catch(() => {});
        break;
      }

      case "MODEL_ERROR": {
        modelState = { status: "error", message: msg.payload.message };
        chrome.runtime
          .sendMessage({ type: "MODEL_ERROR", payload: msg.payload })
          .catch(() => {});
        break;
      }

      case "RETRY_MODEL": {
        modelState = { status: "idle" };
        await ensureOffscreenDocument();
        chrome.runtime.sendMessage({ type: "RETRY_MODEL" }).catch(() => {});
        break;
      }

      case "EMBED_QUERY": {
        await ensureOffscreenDocument();
        chrome.runtime
          .sendMessage({ type: "EMBED_QUERY", payload: msg.payload })
          .catch(() => {});
        break;
      }

      case "QUERY_EMBEDDING": {
        chrome.runtime
          .sendMessage({ type: "QUERY_EMBEDDING", payload: msg.payload })
          .catch(() => {});
        break;
      }

      case "PRELOAD_MODEL": {
        if (modelState.status === "idle") {
          await ensureOffscreenDocument();
          chrome.runtime.sendMessage({ type: "PRELOAD_MODEL" }).catch(() => {});
        }
        break;
      }
    }
  })();

  // Only keep the message channel open for messages that send a response
  return NEEDS_RESPONSE.has(msg.type);
});

async function updateBadge() {
  const { totalPages } = await db.getStats();
  const text = totalPages >= 1000 ? `${Math.floor(totalPages / 1000)}k` : String(totalPages);
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: "#7c6aff" });
}

// Restore queue from previous session on startup
restoreQueue();
updateBadge();
