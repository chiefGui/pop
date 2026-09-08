import type { GameSetup } from "@pop/game";

export const gameSetup: GameSetup = {
  seed: 20260906,
  generation: {
    npcAge: [18, 80],
    npcCount: 99,
    npcReputation: [30, 90],
    npcPopularity: [30, 90],
    npcInfluence: [1, 3],
  },
  ai: { participationChance: 0.12, supportChance: 0.68 },
  initialProjects: [
    "streetlights",
    "night-market",
    "park-renovation",
    "public-assembly",
    "community-kitchen",
  ],
};
