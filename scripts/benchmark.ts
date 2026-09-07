import { globSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const benchmarks = globSync(
  ["apps/*/benchmarks/**/*.bench.ts", "packages/*/benchmarks/**/*.bench.ts"],
  {
    cwd: root,
  },
).sort();

if (benchmarks.length === 0) throw new Error("No benchmarks found.");

for (const benchmark of benchmarks) {
  console.log(`\n${benchmark}`);
  const result = spawnSync(process.execPath, [benchmark], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
