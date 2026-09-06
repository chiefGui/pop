import { defineConfig } from "vite-plus";

export default defineConfig({
  build: { target: "node24", rollupOptions: { external: ["electron"] } },
});
