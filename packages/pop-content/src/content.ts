import type { GameContent } from "@pop/game/contracts";
import { projects } from "#content/projects";
import { npcNames } from "#content/npc";
import { foundry } from "#content/zones";

export const gameContent: GameContent = { projects, world: { zone: foundry, ...npcNames } };
