import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  base: "./",
  publicDir: "../public",
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
