import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vite-plus/test";
import { prepareDataDirectory, resetLocalData } from "./local-data.mts";
import { createPreferences } from "./preferences";

test("preferences persist, validate window size, and restore defaults after a store reset", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "pop-preferences-test-"));
  if (
    path.dirname(directory) !== os.tmpdir() ||
    !path.basename(directory).startsWith("pop-preferences-test-")
  ) {
    throw new Error("Unexpected fixture path");
  }
  try {
    prepareDataDirectory(directory);
    const store = createPreferences(directory);
    expect(store.get("windowSize")).toEqual({ width: 1000, height: 760 });
    store.set("windowSize", { width: 1200, height: 900 });
    expect(createPreferences(directory).get("windowSize")).toEqual({ width: 1200, height: 900 });
    expect(() => store.set("windowSize", { width: -1, height: 900 })).toThrow();
    resetLocalData(directory, "store");
    expect(createPreferences(directory).get("windowSize")).toEqual({ width: 1000, height: 760 });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
