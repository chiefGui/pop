import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vite-plus/test";
import { acquireDataLock, prepareDataDirectory, resetLocalData } from "./local-data.mts";

const fixtures: string[] = [];

function profile() {
  const root = mkdtempSync(path.join(os.tmpdir(), "pop-reset-test-"));
  fixtures.push(root);
  const directory = path.join(root, "profile");
  prepareDataDirectory(directory);
  for (const file of [
    "pop.sqlite",
    "pop.sqlite-wal",
    "pop.sqlite-shm",
    "pop.sqlite-journal",
    "preferences.json",
  ]) {
    writeFileSync(path.join(directory, file), file);
  }
  mkdirSync(path.join(directory, "Cache"));
  writeFileSync(path.join(directory, "Cache", "entry"), "cache");
  writeFileSync(path.join(root, "unrelated"), "keep");
  return { root, directory };
}

afterEach(() => {
  for (const root of fixtures.splice(0)) {
    if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith("pop-reset-test-")) {
      throw new Error("Unexpected fixture path");
    }
    rmSync(root, { recursive: true, force: true });
  }
});

test("database reset removes SQLite sidecars and preserves preferences and caches", () => {
  const { directory } = profile();
  const targets = resetLocalData(directory, "db");
  for (const target of targets) expect(existsSync(target)).toBe(false);
  expect(readFileSync(path.join(directory, "preferences.json"), "utf8")).toBe("preferences.json");
  expect(existsSync(path.join(directory, "Cache", "entry"))).toBe(true);
  resetLocalData(directory, "db");
});

test("store reset preserves SQLite and caches", () => {
  const { directory } = profile();
  resetLocalData(directory, "store");
  expect(existsSync(path.join(directory, "preferences.json"))).toBe(false);
  expect(readFileSync(path.join(directory, "pop.sqlite"), "utf8")).toBe("pop.sqlite");
  expect(existsSync(path.join(directory, "Cache", "entry"))).toBe(true);
});

test("full reset removes the profile without deleting neighboring data", () => {
  const { root, directory } = profile();
  resetLocalData(directory, "all");
  expect(existsSync(directory)).toBe(false);
  expect(readFileSync(path.join(root, "unrelated"), "utf8")).toBe("keep");
  expect(existsSync(`${directory}.lock`)).toBe(false);
  resetLocalData(directory, "all");
});

test("dry run leaves all data intact", () => {
  const { directory } = profile();
  expect(resetLocalData(directory, "all", true)).toEqual([directory]);
  expect(existsSync(path.join(directory, "pop.sqlite"))).toBe(true);
  expect(existsSync(path.join(directory, "preferences.json"))).toBe(true);
});

test("resets refuse a profile that Pop or another reset has locked", () => {
  const { directory } = profile();
  const release = acquireDataLock(directory);
  try {
    for (const scope of ["all", "db", "store"] as const) {
      expect(() => resetLocalData(directory, scope)).toThrow("Pop data is in use");
    }
    expect(existsSync(path.join(directory, "pop.sqlite"))).toBe(true);
  } finally {
    release();
  }
  resetLocalData(directory, "all");
});

test("resets refuse shared directories and unowned custom profiles", () => {
  const { root } = profile();
  expect(() => resetLocalData(os.homedir(), "all")).toThrow("shared directory");
  expect(() => resetLocalData(process.cwd(), "all")).toThrow("shared directory");
  expect(() => resetLocalData(path.parse(root).root, "all")).toThrow("shared directory");
  expect(() => resetLocalData(root, "all")).toThrow("not a Pop profile");
  expect(readFileSync(path.join(root, "unrelated"), "utf8")).toBe("keep");
});

test("resets refuse a profile reached through a junction or symlink", () => {
  const { root, directory } = profile();
  const link = path.join(root, "linked-profile");
  symlinkSync(directory, link, "junction");
  expect(() => resetLocalData(link, "all")).toThrow("real directory");
  expect(existsSync(path.join(directory, "pop.sqlite"))).toBe(true);
});
