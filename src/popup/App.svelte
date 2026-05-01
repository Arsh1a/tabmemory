<script lang="ts">
  import Header from "./components/Header.svelte";
  import SettingsPage from "./components/SettingsPage.svelte";
  import IndexingBar from "./components/IndexingBar.svelte";
  import ModelBanner from "./components/ModelBanner.svelte";
  import ResultsList from "./components/ResultsList.svelte";
  import Footer from "./components/Footer.svelte";

  let view: "main" | "settings" = "main";
</script>

<div class="flex flex-col h-full max-h-150">
  <Header settingsOpen={view === "settings"} onToggleSettings={() => (view = view === "settings" ? "main" : "settings")} />

  {#if view === "main"}
    <IndexingBar />
    <ModelBanner />
    <ResultsList />
    <Footer />
  {:else}
    <SettingsPage />
  {/if}
</div>
