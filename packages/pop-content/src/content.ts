import type { GameContent } from "@pop/game/contracts";
import { projects } from "#content/projects";
import { characterNames } from "#content/characters";
import { foundry } from "#content/zones";

export const gameContent: GameContent = { projects, world: { zone: foundry, ...characterNames } };
