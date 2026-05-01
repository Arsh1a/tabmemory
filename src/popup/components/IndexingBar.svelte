<script lang="ts">
  import { indexing } from "../stores/indexing";
</script>

{#if $indexing.current}
  <div class="bg-indexing-bg border-b border-subtle">
    <div class="flex items-center gap-2 px-4 py-1.5">
      <div class="w-1.5 h-1.5 rounded-full bg-brand shrink-0 animate-pulse"></div>
      <span class="text-[11px] font-mono-plex text-dim truncate flex-1">
        indexing <span class="text-muted">{$indexing.current.title || $indexing.current.url}</span>
      </span>
    </div>
    {#if $indexing.queue.length > 0}
      <div class="border-t border-subtle">
        {#each $indexing.queue as page (page.url)}
          <div class="px-4 pl-7 py-1 text-[11px] font-mono-plex text-dim truncate">
            {page.title || page.url}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
