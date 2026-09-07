import { fileURLToPath } from "node:url";
import stylex from "@stylexjs/unplugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  plugins: [
    tailwindcss(),
    stylex(),
    react(),
    {
      name: "pop:development-csp",
      transformIndexHtml(html, context) {
        // React Fast Refresh injects a module preamble during development.
        return context.server
          ? html.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
          : html;
      },
    },
  ],
  server: { host: "127.0.0.1", port: 5173 },
  build: { target: "es2023" },
});
