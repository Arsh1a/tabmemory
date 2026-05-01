/**
 * Offscreen Document - hidden page that hosts the ONNX model.
 *
 * Responsibilities:
 *  1. Load and cache the all-MiniLM-L6-v2 embedding model (with retry)
 *  2. Chunk and embed page text on EMBED_PAGE, send EMBED_DONE to background
 *  3. Embed search queries on EMBED_QUERY, send QUERY_EMBEDDING back to popup
 *
 */

import {
  pipeline,
  env,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import type { Msg, PageData, StoredPage } from "@/types/messages";

if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL("assets/");
  env.backends.onnx.wasm.numThreads = 1;
}
env.useBrowserCache = true;

let embedder: FeatureExtractionPipeline | null = null;
let modelLoadingPromise: Promise<FeatureExtractionPipeline> | null = null;

const MAX_RETRIES = 3;

async function loadWithRetry(attempt = 1): Promise<FeatureExtractionPipeline> {
  try {
    const pipe = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      {
        cache_dir: "tabmemory-models",
        dtype: "q8",
        progress_callback: (p: {
          status: string;
          name?: string;
          file?: string;
          progress?: number;
          loaded?: number;
          total?: number;
        }) => {
          if (p.status === "progress" && p.progress !== undefined) {
            chrome.runtime.sendMessage({
              type: "MODEL_PROGRESS",
              payload: {
                progress: Math.round(p.progress),
                file: p.file ?? p.name ?? "",
                loaded: p.loaded ?? 0,
                total: p.total ?? 0,
              },
            });
          }
        },
      },
    );
    embedder = pipe;
    chrome.runtime.sendMessage({ type: "MODEL_READY" });
    return pipe;
  } catch (err) {
    console.warn(`[TabMemory] Model load attempt ${attempt} failed:`, err);

    if (attempt < MAX_RETRIES) {
      const delay = attempt * 3000;
      chrome.runtime.sendMessage({
        type: "MODEL_PROGRESS",
        payload: {
          progress: 0,
          file: `retrying in ${delay / 1000}s… (attempt ${attempt + 1}/${MAX_RETRIES})`,
        },
      });
      await new Promise<void>((r) => setTimeout(r, delay));
      return loadWithRetry(attempt + 1);
    }

    console.error("[TabMemory] Model load failed after all retries:", err);
    modelLoadingPromise = null;
    chrome.runtime.sendMessage({
      type: "MODEL_ERROR",
      payload: {
        message:
          "Failed to download model. Check your connection and try again.",
      },
    });
    throw err;
  }
}

async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (embedder) return embedder;
  if (modelLoadingPromise) return modelLoadingPromise;
  modelLoadingPromise = loadWithRetry();
  return modelLoadingPromise;
}

const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 200;
const EMBEDDING_DIM = 384;
const BATCH_SIZE = 2;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + CHUNK_SIZE));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embedText(text: string): Promise<number[]> {
  const pipe = await getEmbedder();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function embedChunks(text: string): Promise<number[][]> {
  const pipe = await getEmbedder();
  const chunks = chunkText(text);
  const all: number[][] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const output = await pipe(batch, { pooling: "mean", normalize: true });
    const flat = Array.from(output.data);
    for (let j = 0; j < batch.length; j++) {
      all.push(flat.slice(j * EMBEDDING_DIM, (j + 1) * EMBEDDING_DIM));
    }
    await new Promise<void>((r) => setTimeout(r, 300));
  }

  return all;
}

chrome.runtime.sendMessage({ type: "OFFSCREEN_READY" });

chrome.runtime.onMessage.addListener((msg: Msg) => {
  if (msg.type === "PRELOAD_MODEL") {
    getEmbedder().catch(() => {});
    return;
  }

  if (msg.type === "RETRY_MODEL") {
    embedder = null;
    modelLoadingPromise = null;
    getEmbedder().catch(() => {});
    return;
  }

  if (msg.type === "EMBED_QUERY") {
    const { query, reqId } = msg.payload;
    (async () => {
      try {
        const vector = await embedText(query);
        await chrome.runtime
          .sendMessage({ type: "QUERY_EMBEDDING", payload: { vector, reqId } })
          .catch(() => {});
      } catch (err) {
        console.error("[TabMemory] Query embed failed:", err);
      }
    })();
    return;
  }

  if (msg.type !== "EMBED_PAGE") return;

  const pageData: PageData = msg.payload;

  embedChunks(pageData.text)
    .then((embeddings) => {
      const stored: StoredPage = {
        ...pageData,
        id: crypto.randomUUID(),
        embeddings,
      };
      chrome.runtime.sendMessage({ type: "EMBED_DONE", payload: stored });
    })
    .catch((err: unknown) => {
      chrome.runtime.sendMessage({
        type: "EMBED_ERROR",
        payload: { url: pageData.url, error: String(err) },
      });
    });
});
