import { gameContent } from "@pop/content";
import { createGameClient } from "@pop/game-client";
import { gameSetup } from "./setup";

export const client = createGameClient(gameContent, gameSetup);
if (import.meta.hot) import.meta.hot.dispose(() => client.dispose());
