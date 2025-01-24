import path from "path";
import tailwind from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [solidPlugin(), wasm(), tailwind()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    port: 3000,
  },
  optimizeDeps: {
    exclude: ["@duskflower/signal-decrypt-backup-wasm", "@sqlite.org/sqlite-wasm"],
  },
  build: {
    target: "esnext",
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: "es",
  },
});
