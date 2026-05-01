<script lang="ts">
  import type { SearchResult, StoredPage } from "@/types/messages";
  import { db } from "@/lib/db";
  import { removeResult } from "../stores/search";
  import { removePage } from "../stores/memory";
  import { formatUrl, timeAgo } from "../utils";

  export let result: SearchResult | StoredPage;

  let menuOpen = false;
  let menuEl: HTMLDivElement;

  function handleOutsideClick(e: MouseEvent) {
    if (menuEl && !menuEl.contains(e.target as Node)) menuOpen = false;
  }

  $: if (menuOpen) {
    document.addEventListener("mousedown", handleOutsideClick);
  } else {
    document.removeEventListener("mousedown", handleOutsideClick);
  }

  async function handleDelete() {
    menuOpen = false;
    await db.deletePage(result.id);
    removeResult(result.id);
    removePage(result.id);
  }
</script>

<a
  class="group relative block px-4 py-2.5 border-b border-subtle cursor-pointer no-underline text-inherit hover:bg-surface-hover transition-colors"
  href={result.url}
  target="_blank"
  rel="noreferrer"
  on:click|preventDefault={() => chrome.tabs.create({ url: result.url })}
>
  <div class="flex items-baseline gap-2 mb-0.5 pr-6">
    <span class="text-[13px] font-medium text-primary truncate flex-1">
      {result.title || result.url}
    </span>
  </div>
  <div class="text-[11px] text-dim truncate mb-1">{formatUrl(result.url)}</div>
  <div class="text-[12px] text-muted leading-relaxed line-clamp-2">
    {"snippet" in result ? result.snippet : result.excerpt}
  </div>
  <div class="text-[10px] font-mono-plex text-dim mt-1">{timeAgo(result.timestamp)}</div>

  <div
    bind:this={menuEl}
    class="absolute top-0 right-2.5 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <button
      class="border border-subtle cursor-pointer text-dim text-xl leading-none px-1.5 py-1 rounded hover:text-muted bg-surface-1 transition-colors"
      title="Options"
      on:click|preventDefault|stopPropagation={() => (menuOpen = !menuOpen)}
    >
      ···
    </button>
    {#if menuOpen}
      <div class="absolute right-0 top-0 bg-surface-1 border border-surface-2 rounded-md overflow-hidden z-10 min-w-32 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <button
          class="block w-full px-3 py-2 bg-transparent border-none cursor-pointer text-[12px] font-mono-plex text-muted text-left whitespace-nowrap hover:bg-surface-2 hover:text-error transition-colors"
          on:click|preventDefault|stopPropagation={handleDelete}
        >
          delete
        </button>
      </div>
    {/if}
  </div>
</a>
