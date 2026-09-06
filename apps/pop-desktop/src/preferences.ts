import Store from "electron-store";
import { preferencesName } from "./local-data.mts";

interface Preferences {
  windowSize: { width: number; height: number };
}

export function createPreferences(directory: string) {
  return new Store<Preferences>({
    name: preferencesName,
    cwd: directory,
    defaults: { windowSize: { width: 1000, height: 760 } },
    schema: {
      windowSize: {
        type: "object",
        properties: {
          width: { type: "integer", minimum: 440 },
          height: { type: "integer", minimum: 580 },
        },
        required: ["width", "height"],
        additionalProperties: false,
      },
    },
  });
}
