import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "src",
  base: "./",
  publicDir: "../public",
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "src")
    }
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsInlineLimit: 0
  },
  assetsInclude: ["**/*.svg"],
  server: {
    port: 5173,
    open: true
  }
});
