import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { channels } from "@pop/contracts/ipc";
import { createAppRuntime, readGreeting } from "./database";
import {
  acquireDataLock,
  databaseName,
  dataDirectory,
  prepareDataDirectory,
} from "./local-data.mts";
import { createPreferences } from "./preferences";

let runtime: ReturnType<typeof createAppRuntime> | undefined;
let quitting = false;
let releaseDataLock: (() => void) | undefined;
let preferences: ReturnType<typeof createPreferences>;
const directory = dataDirectory();
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
    ...preferences.get("windowSize"),
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
  window.on("close", () => {
    const { width, height } = window.getNormalBounds();
    preferences.set("windowSize", { width, height });
  });
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
app.on("quit", () => releaseDataLock?.());

void Promise.resolve()
  .then(() => {
    prepareDataDirectory(directory);
    releaseDataLock = acquireDataLock(directory);
    app.setPath("userData", directory);
    app.setPath("sessionData", directory);
    return app.whenReady();
  })
  .then(async () => {
    preferences = createPreferences(directory);
    runtime = createAppRuntime(path.join(directory, databaseName));
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
  let message = String(error);
  if (error instanceof Error) message = error.message;
  dialog.showErrorBox("Pop could not start", message);
  app.quit();
}
