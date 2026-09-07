import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { _electron as electron } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));
const platform = process.platform;
const development = process.argv.includes("--dev");
const require = createRequire(new URL("../apps/pop-desktop/package.json", import.meta.url));
const bundle = path.join(root, "apps/pop-desktop/out", `Pop-${platform}-${process.arch}`);
function getExecutablePath(): string {
  if (development) {
    const executable: unknown = require("electron");
    assert.ok(typeof executable === "string");
    return executable;
  }
  if (process.env.POP_EXECUTABLE) return process.env.POP_EXECUTABLE;
  if (platform === "darwin") return path.join(bundle, "Pop.app/Contents/MacOS/Pop");
  if (platform === "win32") return path.join(bundle, "Pop.exe");
  return path.join(bundle, "Pop");
}

const executablePath = getExecutablePath();
const args: string[] = [];
let mode = "Packaged";
if (development) {
  args.push(path.join(root, "apps/pop-desktop"));
  mode = "Development";
}
const userData = await mkdtemp(path.join(os.tmpdir(), "pop-smoke-"));
const env: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
  if (value !== undefined && key !== "ELECTRON_RUN_AS_NODE") env[key] = value;
}
env.POP_USER_DATA_DIR = userData;
const errors: string[] = [];

try {
  for (const visits of [1, 2]) {
    const app = await electron.launch({
      executablePath,
      args,
      env,
      timeout: 30_000,
    });
    try {
      const page = await app.firstWindow();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.getByText("Saved desktop launches", { exact: true }).waitFor();
      assert.equal(await page.getByRole("heading", { name: "Hello, world!" }).count(), 1);
      const greeting = await page.evaluate(() => {
        if (!window.pop) throw new Error("Desktop bridge is unavailable");
        return window.pop.getGreeting();
      });
      assert.equal(greeting.visits, visits);
      assert.ok(greeting.sqliteVersion !== null);
      assert.match(greeting.sqliteVersion, /^\d+\.\d+\.\d+$/);
      assert.equal(await page.evaluate(() => typeof Reflect.get(window, "require")), "undefined");
      assert.equal(
        await page.getByRole("heading").evaluate((el) => getComputedStyle(el).fontSize),
        "56px",
      );
      await page.getByRole("button", { name: "Refresh greeting" }).click();
      await page.getByRole("button", { name: "Refresh greeting" }).waitFor();
      if (visits === 1) {
        await mkdir(path.join(root, ".cache"), { recursive: true });
        await page.screenshot({ path: path.join(root, ".cache/desktop-smoke.png") });
      }
      console.log(
        `${mode} app: launch ${visits}, SQLite ${greeting.sqliteVersion}, IPC and styles passed.`,
      );
    } finally {
      await app.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await rm(userData, { recursive: true, force: true });
}
