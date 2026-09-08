import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["**/.vite/**", "**/out/**", "**/dist/**"],
    jsPlugins: ["@stylexjs/eslint-plugin"],
    overrides: [
      {
        files: ["packages/pop-game/src/**/*.ts"],
        excludeFiles: [
          "packages/pop-game/src/index.ts",
          "packages/pop-game/src/contracts.ts",
          "**/*.test.ts",
        ],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: ["#game/contracts", "#game/index", "@pop/game", "@pop/game/contracts"],
            },
          ],
        },
      },
      {
        files: ["packages/pop-engine/src/**/*.ts"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  group: ["@pop/*"],
                  message:
                    "The engine cannot depend on game, content, or client packages. Use #engine/* internally.",
                },
              ],
            },
          ],
        },
      },
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
