import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: { ignorePatterns: ["**/.vite/**", "**/out/**", "**/dist/**"] },
  fmt: { ignorePatterns: ["**/.vite/**", "**/out/**", "**/dist/**", "bun.lock"] },
  test: { include: ["apps/**/*.test.ts", "packages/**/*.test.ts"], environment: "node" },
});
