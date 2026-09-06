import type { DesktopApi } from "@pop/contracts";

declare global {
  interface Window {
    readonly pop?: DesktopApi;
  }
}
