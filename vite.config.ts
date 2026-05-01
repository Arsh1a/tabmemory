import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import manifest from "./manifest.json";
import path from "node:path";
import url from "node:url";

const _dirname = path.dirname(url.fileURLToPath(import.meta.url));

function copyIfMissing(src: string, dest: string) {
  if (existsSync(dest)) return;
  mkdirSync(resolve(dest, ".."), { recursive: true });
  try {
    copyFileSync(src, dest);
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "EPERM" && code !== "EEXIST") throw e;
  }
}

function copyAssetsPlugin() {
  const onnxDir = resolve(
    __dirname,
    "node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist",
  );
  return {
    name: "copy-assets",
    closeBundle() {
      // onnxruntime WASM files (stable names, no hash)
      for (const file of [
        "ort-wasm-simd-threaded.asyncify.mjs",
        "ort-wasm-simd-threaded.asyncify.wasm",
      ]) {
        copyIfMissing(resolve(onnxDir, file), resolve("dist/assets", file));
      }
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), svelte(), crx({ manifest }), copyAssetsPlugin()],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        offscreen: "src/offscreen/index.html",
      },
    },
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["@huggingface/transformers"],
  },
  resolve: {
    alias: {
      "@": resolve(_dirname, "./src"),
    },
  },
});
