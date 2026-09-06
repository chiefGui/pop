import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite-plus";
import webConfig from "../pop-web/vite.config";

export default mergeConfig(webConfig, {
  cacheDir: fileURLToPath(new URL("./node_modules/.vite/renderer", import.meta.url)),
  resolve: { preserveSymlinks: false },
  server: { port: 5174 },
  build: {
    outDir: fileURLToPath(new URL("./.vite/renderer/main_window", import.meta.url)),
    emptyOutDir: true,
  },
});
