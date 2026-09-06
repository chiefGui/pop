import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(new URL("../apps/pop-desktop/package.json", import.meta.url));
const env: NodeJS.ProcessEnv = { ...process.env };
// Editors built on Electron can export this; the child must run as a desktop app.
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(
  process.execPath,
  [require.resolve("@electron-forge/cli/dist/electron-forge.js"), ...process.argv.slice(2)],
  { stdio: "inherit", env, windowsHide: true },
);
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
