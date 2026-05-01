<script lang="ts">
  import { query, searching, handleSearch, recentSearches, removeRecentSearch } from "../stores/search";

  export let settingsOpen: boolean;
  export let onToggleSettings: () => void;

  let focused = false;

  $: showDropdown = focused && !$query.trim() && $recentSearches.length > 0;

  function pickRecent(s: string) {
    handleSearch(s);
    focused = false;
  }

  function onBlur() {
    // Delay so clicks on dropdown items register before hiding
    setTimeout(() => { focused = false; }, 150);
  }
</script>

<div class="px-4 pt-3.5 pb-2.5 border-b border-subtle shrink-0">
  <div class="flex items-center gap-2 mb-2.5">
    <div class="w-2 h-2 rounded-full bg-brand"></div>
    <div class="font-mono-plex text-[13px] font-medium text-muted tracking-wide flex-1">
      Tab<span class="text-primary">Memory</span>
    </div>
    <button
      class="text-dim bg-transparent border-none cursor-pointer text-base leading-none p-1 rounded hover:text-muted hover:bg-surface-1 transition-colors"
      title={settingsOpen ? "back" : "settings"}
      on:click={onToggleSettings}
    >
      {settingsOpen ? "✕" : "⚙"}
    </button>
  </div>

  {#if !settingsOpen}
    <div class="relative">
      <div class="flex items-center gap-2 bg-surface-1 border border-surface-2 rounded-lg px-3 focus-within:border-brand transition-colors">
        <span class="text-dim shrink-0 text-xl">⌕</span>
        <input
          class="flex-1 bg-transparent border-none outline-none py-2.5 text-sm text-primary placeholder-text-faint font-[inherit]"
          type="text"
          placeholder="Search your memory…"
          value={$query}
          on:input={(e) => handleSearch(e.currentTarget.value)}
          on:focus={() => (focused = true)}
          on:blur={onBlur}
        />
        {#if $searching}
          <span class="text-[11px] font-mono-plex text-brand animate-pulse">searching</span>
        {/if}
      </div>

      {#if showDropdown}
        <div class="absolute left-0 right-0 top-full mt-1 bg-surface-1 border border-surface-2 rounded-lg overflow-hidden z-20 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          {#each $recentSearches as s (s)}
            <div class="flex items-center justify-between px-3 py-2 hover:bg-surface-2 group transition-colors">
              <button
                class="flex-1 text-left text-[12px] font-mono-plex text-muted bg-transparent border-none cursor-pointer p-0 hover:text-primary transition-colors"
                on:mousedown|preventDefault={() => pickRecent(s)}
              >{s}</button>
              <button
                class="text-[10px] text-dim bg-transparent border-none cursor-pointer px-1 opacity-0 group-hover:opacity-100 hover:text-error transition-colors"
                on:mousedown|preventDefault={() => removeRecentSearch(s)}
              >✕</button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
