import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import lockfile from "proper-lockfile";
import metadata from "../package.json" with { type: "json" };

export const databaseName = "pop.sqlite";
export const preferencesName = "preferences";
const markerName = ".pop-data";
const markerContents = "Pop local data\n";

export function defaultDataDirectory(): string {
  if (process.platform === "win32") {
    if (!process.env.APPDATA) throw new Error("APPDATA is not set");
    return path.join(process.env.APPDATA, metadata.productName);
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", metadata.productName);
  }
  if (process.platform === "linux") {
    return path.join(
      process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"),
      metadata.productName,
    );
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

export function dataDirectory(): string {
  const directory = process.env.POP_USER_DATA_DIR ?? defaultDataDirectory();
  if (!path.isAbsolute(directory)) throw new Error("POP_USER_DATA_DIR must be an absolute path");
  return path.resolve(directory);
}

function assertSafeDirectory(directory: string) {
  const target = path.resolve(directory);
  const protectedPaths = [os.homedir(), process.cwd(), path.dirname(defaultDataDirectory())];
  for (const protectedPath of protectedPaths) {
    const relative = path.relative(target, path.resolve(protectedPath));
    if (
      relative === "" ||
      (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
    ) {
      throw new Error(`Refusing to use a shared directory for Pop data: ${target}`);
    }
  }
  if (existsSync(target)) {
    if (!lstatSync(target).isDirectory() || lstatSync(target).isSymbolicLink()) {
      throw new Error(`Pop data must be a real directory: ${target}`);
    }
    if (path.relative(realpathSync(target), target) !== "") {
      throw new Error(`Pop data must not be reached through a symbolic link: ${target}`);
    }
  }
}

function assertOwnedDirectory(directory: string) {
  assertSafeDirectory(directory);
  const marker = path.join(directory, markerName);
  if (existsSync(marker)) {
    if (readFileSync(marker, "utf8") !== markerContents)
      throw new Error(`Invalid Pop data marker: ${marker}`);
    return;
  }
  // The default profile belongs to Pop; custom locations need a marker or an empty directory.
  if (path.relative(defaultDataDirectory(), directory) === "") return;
  if (readdirSync(directory).length === 0) return;
  throw new Error(`This directory is not a Pop profile: ${directory}`);
}

export function prepareDataDirectory(directory: string) {
  assertSafeDirectory(directory);
  mkdirSync(directory, { recursive: true });
  assertOwnedDirectory(directory);
  writeFileSync(path.join(directory, markerName), markerContents);
}

export function acquireDataLock(directory: string): () => void {
  assertOwnedDirectory(directory);
  try {
    // A sibling lock survives full-profile deletion and serializes startup with resets.
    return lockfile.lockSync(directory, { realpath: true, retries: 0 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ELOCKED") {
      throw new Error("Pop data is in use. Close Pop and stop other reset commands first.", {
        cause: error,
      });
    }
    throw error;
  }
}

export type ResetScope = "all" | "db" | "store";

export function resetTargets(directory: string, scope: ResetScope): string[] {
  if (scope === "all") return [directory];
  if (scope === "store") return [path.join(directory, `${preferencesName}.json`)];
  return [
    databaseName,
    `${databaseName}-wal`,
    `${databaseName}-shm`,
    `${databaseName}-journal`,
  ].map((name) => path.join(directory, name));
}

export function resetLocalData(directory: string, scope: ResetScope, dryRun = false): string[] {
  assertSafeDirectory(directory);
  const targets = resetTargets(directory, scope);
  if (!existsSync(directory)) return targets;
  assertOwnedDirectory(directory);
  const release = acquireDataLock(directory);
  try {
    if (!dryRun) {
      for (const target of targets) {
        // Resolve and validate again immediately before any recursive removal.
        assertOwnedDirectory(directory);
        if (scope === "all") {
          rmSync(target, { recursive: true, force: true });
        } else {
          rmSync(target, { force: true });
        }
      }
    }
    return targets;
  } finally {
    release();
  }
}
