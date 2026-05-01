<script lang="ts">
  import { query, searching, handleSearch } from "../stores/search";

  export let settingsOpen: boolean;
  export let onToggleSettings: () => void;

  function focus(el: HTMLElement) { el.focus(); }
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
    <div class="flex items-center gap-2 bg-surface-1 border border-surface-2 rounded-lg px-3 focus-within:border-brand transition-colors">
      <span class="text-dim shrink-0 text-xl">⌕</span>
      <input
        class="flex-1 bg-transparent border-none outline-none py-2.5 text-sm text-primary placeholder-text-faint font-[inherit]"
        type="text"
        placeholder="Search your memory…"
        value={$query}
        on:input={(e) => handleSearch(e.currentTarget.value)}
        use:focus
      />
      {#if $searching}
        <span class="text-[11px] font-mono-plex text-brand animate-pulse">searching</span>
      {/if}
    </div>
  {/if}
</div>
