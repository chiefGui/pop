import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vite-plus/test";
import { createAppRuntime, readGreeting } from "./database";

test("migrates once, persists launches, and does not count reads as launches", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pop-test-"));
  const filename = path.join(directory, "pop.sqlite");
  const first = createAppRuntime(filename);
  try {
    const greeting = await first.runPromise(readGreeting);
    expect(greeting).toMatchObject({ message: "Hello, world!", visits: 1 });
    expect(greeting.sqliteVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect((await first.runPromise(readGreeting)).visits).toBe(1);
  } finally {
    await first.dispose();
  }
  const second = createAppRuntime(filename);
  try {
    expect((await second.runPromise(readGreeting)).visits).toBe(2);
  } finally {
    await second.dispose();
    await rm(directory, { recursive: true, force: true });
  }
});
