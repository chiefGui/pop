import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["**/.vite/**", "**/out/**", "**/dist/**"],
    jsPlugins: ["@stylexjs/eslint-plugin"],
    overrides: [
      {
        files: ["apps/pop-web/src/**/*.ts", "apps/pop-web/src/**/*.tsx"],
        rules: {
          "@stylexjs/valid-styles": "error",
          "@stylexjs/valid-shorthands": "error",
          "@stylexjs/enforce-extension": "error",
          "@stylexjs/no-unused": "error",
        },
      },
    ],
  },
  fmt: { ignorePatterns: ["**/.vite/**", "**/out/**", "**/dist/**", "bun.lock"] },
  test: { include: ["apps/**/*.test.ts", "packages/**/*.test.ts"], environment: "node" },
});
