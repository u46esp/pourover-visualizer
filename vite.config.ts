import { defineConfig } from "vite"

export default defineConfig({
  base: "/pourover-sim/", // 👈 IMPORTANT: must match your repo name

  build: {
    outDir: "dist",
    sourcemap: true,
  },

  server: {
    open: true,
  },
})