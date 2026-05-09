import { defineConfig } from "vite";

// GitHub Pages project site: https://u46esp.github.io/pourover-visualizer/
export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/pourover-visualizer/",
}));
