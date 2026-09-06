import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "@pop/contracts";
import { channels } from "@pop/contracts/ipc";

contextBridge.exposeInMainWorld("pop", {
  getGreeting: () => ipcRenderer.invoke(channels.greeting),
} satisfies DesktopApi);
