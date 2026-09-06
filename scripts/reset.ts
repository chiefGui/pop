import {
  dataDirectory,
  resetLocalData,
  resetTargets,
  type ResetScope,
} from "../apps/pop-desktop/src/local-data.mts";

try {
  const [scope, ...options] = process.argv.slice(2);
  if (scope !== "all" && scope !== "db" && scope !== "store") {
    throw new Error("Usage: bun reset | bun db:reset | bun store:reset [--dry-run]");
  }
  if (options.some((option) => option !== "--dry-run"))
    throw new Error("Only --dry-run is supported");
  const dryRun = options.includes("--dry-run");
  const directory = dataDirectory();
  printTargets(scope, directory);
  resetLocalData(directory, scope, dryRun);
  if (dryRun) console.log("Dry run. No data removed.");
  else console.log("Reset complete. Pop recreates defaults on its next launch.");
} catch (error) {
  if (error instanceof Error) console.error(error.message);
  else console.error(String(error));
  process.exitCode = 1;
}

function printTargets(scope: ResetScope, directory: string) {
  for (const target of resetTargets(directory, scope)) console.log(target);
}
