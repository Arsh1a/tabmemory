# TabMemory

Search your browsing history the way you actually think — _"that article about the Stripe outage"_, _"rust vs go benchmarks"_, _"recipe with tahini"_. No keywords required.

Most of what you read online is gone the moment you close the tab. Browser history gives you URLs, not meaning. TabMemory indexes the content of every page you visit and lets you search it semantically — describe what you remember, not what the page was called.

Everything runs locally. The model lives in your browser, your data stays on your device, nothing touches a server.

## Features

- **Semantic search** — finds pages based on meaning, not exact words
- **Fully private** — no accounts, no sync, no telemetry
- **Automatic** — runs quietly in the background as you browse
- **Configurable** — exclude domains you don't want indexed, or turn indexing off entirely
- **Fast** — search across thousands of pages in milliseconds

## Installation

Build from source:

```bash
npm install
npm run build
```

Then go to `chrome://extensions`, enable Developer Mode, click **Load unpacked**, and select the `dist/` folder.

The model (~23MB) downloads on first run and is cached after that. Browse normally — TabMemory handles the rest.

## Privacy

TabMemory is designed to never leave your device. There are no servers, no accounts, and no analytics. The ML model runs entirely in your browser via WebAssembly, and all indexed data is stored locally in IndexedDB. Uninstalling the extension removes everything.

## Contributing

Contributions are welcome. If you find a bug or have a feature in mind, open an issue first so we can discuss it before you spend time on a PR.

```bash
npm run build   # production build
npm run dev     # watch mode — rebuilds on save, reload extension manually
```

The codebase is split into four contexts that Chrome isolates from each other — content script, background service worker, offscreen document, and popup. If you're new to Chrome extensions, it's worth reading the [MV3 architecture overview](https://developer.chrome.com/docs/extensions/mv3/intro/) before diving in.

## License

MIT
