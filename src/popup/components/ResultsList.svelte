<script lang="ts">
  import { MAX_RECENT_SHOWN_PAGES_LIMIT } from "@/constants";
  import { query, results, searching } from "../stores/search";
  import { recent, totalPages } from "../stores/memory";
  import { groupByBucket } from "../utils";
  import ResultCard from "./ResultCard.svelte";

  $: showResults = $query.trim().length > 0;
  $: hasMore = $totalPages > $recent.length;
  $: recentBuckets = groupByBucket($recent);
  $: resultBuckets = groupByBucket($results);
</script>

<div class="overflow-y-auto flex-1">
  {#if !showResults}
    {#if $recent.length === 0}
      <div class="px-4 py-10 text-center text-dim text-[13px] leading-relaxed">
        <strong class="block text-[14px] mb-1.5 text-white">No pages indexed yet</strong>
        Browse the web — TabMemory will quietly build your memory.
      </div>
    {:else}
      {#each recentBuckets as bucket}
        <div class="px-4 py-2.5 pt-2 text-[10px] font-mono-plex text-dim tracking-widest uppercase border-b border-subtle">
          {bucket.bucket}
        </div>
        {#each bucket.items as page (page.id)}
          <ResultCard result={page} />
        {/each}
      {/each}
      {#if hasMore}
        <div class="px-4 py-2.5 text-[10px] font-mono-plex text-dim text-center">
          showing last {MAX_RECENT_SHOWN_PAGES_LIMIT} &middot; {$totalPages.toLocaleString()} total &mdash; use search to find older pages
        </div>
      {/if}
    {/if}
  {/if}

  {#if showResults && !$searching}
    {#if $results.length === 0}
      <div class="px-4 py-2.5 pt-2 text-[10px] font-mono-plex text-dim tracking-widest uppercase border-b border-subtle">
        no results
      </div>
      <div class="px-4 py-10 text-center text-dim text-[13px] leading-relaxed">
        <strong class="block text-[14px] mb-1.5">Nothing found</strong>
        Try different words, or browse more pages to build your index.
      </div>
    {:else}
      <div class="px-4 py-2.5 pt-2 text-[10px] font-mono-plex text-dim tracking-widest uppercase border-b border-subtle">
        {$results.length} result{$results.length !== 1 ? "s" : ""}
      </div>
      {#each resultBuckets as bucket}
        <div class="px-4 py-2 text-[10px] font-mono-plex text-dim tracking-widest uppercase border-b border-subtle bg-surface-2/30">
          {bucket.bucket}
        </div>
        {#each bucket.items as r (r.id)}
          <ResultCard result={r} />
        {/each}
      {/each}
    {/if}
  {/if}
</div>
