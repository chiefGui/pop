import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { channels } from "@pop/contracts/ipc";
import { createAppRuntime, readGreeting } from "./database";

let runtime: ReturnType<typeof createAppRuntime> | undefined;
let quitting = false;
if (process.env.POP_USER_DATA_DIR) app.setPath("userData", process.env.POP_USER_DATA_DIR);
const rendererFile = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
const rendererUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL ?? pathToFileURL(rendererFile).href;

function isAppUrl(url: string) {
  const candidate = new URL(url);
  const expected = new URL(rendererUrl);
  return (
    candidate.protocol === expected.protocol &&
    candidate.origin === expected.origin &&
    candidate.pathname === expected.pathname
  );
}

async function createWindow() {
  const window = new BrowserWindow({
    title: "Pop",
    width: 1000,
    height: 760,
    minWidth: 440,
    minHeight: 580,
    backgroundColor: "#f5f5f2",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!isAppUrl(url)) event.preventDefault();
  });
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false),
  );
  window.webContents.session.setPermissionCheckHandler(() => false);
  window.once("ready-to-show", () => window.show());
  await window.loadURL(rendererUrl);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", (event) => {
  if (!runtime || quitting) return;
  event.preventDefault();
  quitting = true;
  void runtime
    .dispose()
    .catch(console.error)
    .finally(() => app.quit());
});

void app
  .whenReady()
  .then(async () => {
    await mkdir(app.getPath("userData"), { recursive: true });
    runtime = createAppRuntime(path.join(app.getPath("userData"), "pop.sqlite"));
    await runtime.runPromise(readGreeting);
    ipcMain.handle(channels.greeting, (event) => {
      if (
        !event.senderFrame ||
        event.senderFrame !== event.sender.mainFrame ||
        !isAppUrl(event.senderFrame.url)
      ) {
        throw new Error("Untrusted IPC sender");
      }
      return runtime!.runPromise(readGreeting);
    });
    await createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow().catch(failStartup);
    });
  })
  .catch(failStartup);

function failStartup(error: unknown) {
  console.error(error);
  dialog.showErrorBox(
    "Pop could not start",
    error instanceof Error ? error.message : String(error),
  );
  app.quit();
}
