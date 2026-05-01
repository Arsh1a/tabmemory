<script lang="ts">
  import { db } from "@/lib/db";
  import { totalPages, clearMemory } from "../stores/memory";
  import { clearResults } from "../stores/search";

  async function handleClear() {
    if (!confirm("Delete all indexed pages? This cannot be undone.")) return;
    await db.clearAll();
    clearResults();
    clearMemory();
  }
</script>

<div class="flex items-center justify-between px-4 py-2 border-t border-subtle shrink-0">
  <div class="text-[11px] font-mono-plex text-dim">
    <span class="text-dim">{$totalPages.toLocaleString()}</span> pages in memory
  </div>
  <button
    class="text-[11px] font-mono-plex text-dim bg-transparent border-none cursor-pointer py-0.5 hover:text-error transition-colors"
    on:click={handleClear}
  >
    clear all
  </button>
</div>
