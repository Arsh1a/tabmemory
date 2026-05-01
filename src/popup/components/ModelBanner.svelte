<script lang="ts">
  import { modelError, modelDownload, retryModel } from "../stores/model";

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

{#if $modelError}
  <div class="flex items-center justify-between gap-2.5 px-4 py-2 bg-error-bg border-b border-error-border">
    <span class="text-[11px] font-mono-plex text-error flex-1">{$modelError.message}</span>
    <button
      class="text-[11px] font-mono-plex text-error bg-transparent border border-error-border rounded px-2 py-0.5 cursor-pointer whitespace-nowrap hover:text-error-bright hover:border-error transition-colors"
      on:click={retryModel}
    >
      retry
    </button>
  </div>
{:else if $modelDownload}
  <div class="flex items-center gap-2.5 px-4 py-2 bg-download-bg border-b border-download-border">
    <div class="flex-1 min-w-0">
      <div class="flex items-baseline justify-between gap-2">
        <div class="text-[11px] font-mono-plex text-brand truncate">
          {$modelDownload.file || "downloading model…"}
        </div>
        <div class="text-[10px] font-mono-plex text-dim shrink-0">
          {#if $modelDownload.total > 0}
            {formatBytes($modelDownload.loaded)} / {formatBytes($modelDownload.total)}
          {:else}
            {$modelDownload.progress}%
          {/if}
        </div>
      </div>
      <div class="w-full h-0.5 bg-download-track rounded-full overflow-hidden mt-1">
        <div
          class="h-full bg-brand rounded-full transition-[width] duration-300"
          style="width: {$modelDownload.progress}%"
        ></div>
      </div>
    </div>
  </div>
{/if}
