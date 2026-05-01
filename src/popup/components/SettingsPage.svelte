<script lang="ts">
  import { onMount } from "svelte";
  import { EXCLUDED_DOMAINS } from "@/constants";
  import { getUserExcludedDomains, setUserExcludedDomains, normalizeDomain } from "@/lib/excluded";

  const DEFAULT_DOMAINS: string[] = Array.from(EXCLUDED_DOMAINS).sort();

  let userDomains: string[] = [];
  let input = "";
  let error = "";
  let indexingEnabled = true;

  onMount(async () => {
    const [domains, storage] = await Promise.all([
      getUserExcludedDomains(),
      chrome.storage.local.get("indexingEnabled"),
    ]);
    userDomains = domains;
    indexingEnabled = storage.indexingEnabled !== false;
  });

  async function toggleIndexing() {
    indexingEnabled = !indexingEnabled;
    await chrome.storage.local.set({ indexingEnabled });
  }

  async function handleAdd() {
    const domain = normalizeDomain(input);
    if (!domain) return;
    if (DEFAULT_DOMAINS.includes(domain) || userDomains.includes(domain)) {
      error = "already excluded";
      return;
    }
    userDomains = [...userDomains, domain].sort();
    await setUserExcludedDomains(userDomains);
    input = "";
    error = "";
  }

  async function handleRemove(domain: string) {
    userDomains = userDomains.filter((d) => d !== domain);
    await setUserExcludedDomains(userDomains);
  }
</script>

<div class="flex flex-col flex-1 overflow-hidden">
  <div class="flex items-center justify-between px-4 py-3 border-b border-subtle">
    <div>
      <div class="text-[12px] font-mono-plex text-primary">Indexing</div>
      <div class="text-[10px] font-mono-plex text-dim mt-0.5">Index pages as you browse</div>
    </div>
    <button
      aria-label={indexingEnabled ? "disable indexing" : "enable indexing"}
      class="relative w-8 h-4 rounded-full transition-colors cursor-pointer border-none {indexingEnabled ? 'bg-brand' : 'bg-surface-2'}"
      on:click={toggleIndexing}
    >
      <span class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform {indexingEnabled ? 'translate-x-4' : 'translate-x-0'}"></span>
    </button>
  </div>

  <div class="px-4 py-2 text-[10px] font-mono-plex text-dim tracking-widest uppercase border-b border-subtle">
    excluded domains
  </div>

  <div class="overflow-y-auto flex-1">
    <div class="px-4 py-3 border-b border-subtle">
      <div class="flex gap-2">
        <input
          class="flex-1 bg-surface-1 border border-surface-2 rounded px-2.5 py-1.5 text-[12px] font-mono-plex text-primary placeholder-text-faint outline-none focus:border-brand transition-colors"
          placeholder="example.com"
          bind:value={input}
          on:input={() => (error = "")}
          on:keydown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          class="px-3 py-1.5 bg-surface-1 border border-surface-2 rounded text-[12px] font-mono-plex text-muted cursor-pointer hover:border-brand hover:text-brand transition-colors"
          on:click={handleAdd}
        >
          add
        </button>
      </div>
      {#if error}
        <p class="mt-1.5 text-[11px] font-mono-plex text-error">{error}</p>
      {/if}
    </div>

    {#if userDomains.length > 0}
      <div class="border-b border-subtle">
        <div class="px-4 py-1.5 text-[10px] font-mono-plex text-dim tracking-widest uppercase">custom</div>
        {#each userDomains as d (d)}
          <div class="flex items-center justify-between px-4 py-2 border-b border-subtle last:border-0 group">
            <span class="text-[12px] font-mono-plex text-primary">{d}</span>
            <button
              class="text-[11px] font-mono-plex text-dim bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 hover:text-error transition-colors"
              on:click={() => handleRemove(d)}
            >
              remove
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <div>
      <div class="px-4 py-1.5 text-[10px] font-mono-plex text-dim tracking-widest uppercase">built-in</div>
      {#each DEFAULT_DOMAINS as d (d)}
        <div class="flex items-center px-4 py-2 border-b border-subtle last:border-0">
          <span class="text-[12px] font-mono-plex text-dim">{d}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
