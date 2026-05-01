import { writable } from "svelte/store";

type ModelDownload = {
  progress: number;
  file: string;
  loaded: number;
  total: number;
} | null;
type ModelError = { message: string } | null;

export const modelDownload = writable<ModelDownload>(null);
export const modelError = writable<ModelError>(null);

chrome.runtime.sendMessage({ type: "GET_MODEL_STATE" }, (state) => {
  if (state?.status === "downloading") {
    modelDownload.set({
      progress: state.progress,
      file: state.file,
      loaded: state.loaded ?? 0,
      total: state.total ?? 0,
    });
  } else if (state?.status === "error") {
    modelError.set({ message: state.message });
  } else if (state?.status === "idle") {
    chrome.runtime.sendMessage({ type: "PRELOAD_MODEL" });
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "MODEL_PROGRESS" && msg.payload) {
    modelError.set(null);
    modelDownload.set({
      progress: msg.payload.progress,
      file: msg.payload.file,
      loaded: msg.payload.loaded ?? 0,
      total: msg.payload.total ?? 0,
    });
  } else if (msg.type === "MODEL_READY") {
    modelDownload.set(null);
    modelError.set(null);
  } else if (msg.type === "MODEL_ERROR" && msg.payload) {
    modelDownload.set(null);
    modelError.set({ message: msg.payload.message });
  }
});

export function retryModel() {
  modelError.set(null);
  modelDownload.set({ progress: 0, file: "connecting…", loaded: 0, total: 0 });
  chrome.runtime.sendMessage({ type: "RETRY_MODEL" });
}
