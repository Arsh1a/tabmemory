import { writable } from "svelte/store";
import { refreshMemory } from "./memory";

type IndexingState = {
  current: { title: string; url: string } | null;
  queue: { title: string; url: string }[];
};

export const indexing = writable<IndexingState>({ current: null, queue: [] });

let prevCurrent: { title: string; url: string } | null = null;

chrome.runtime.sendMessage({ type: "GET_INDEXING_STATE" }, (state) => {
  if (state) {
    prevCurrent = state.current;
    indexing.set(state);
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "INDEXING_UPDATE" && msg.payload) {
    const next = {
      current: msg.payload.current,
      queue: msg.payload.queue ?? [],
    };
    if (prevCurrent !== null && next.current === null) refreshMemory();
    prevCurrent = next.current;
    indexing.set(next);
  }
});
