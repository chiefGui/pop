import type { GameContent, ProjectDefinition } from "../src/contracts";

export function fixture(overrides: Partial<ProjectDefinition> = {}): GameContent {
  const project: ProjectDefinition = {
    id: "cleanup",
    name: "Cleanup",
    description: "A small project.",
    durationDays: 3,
    progressTarget: 6,
    requirements: { reputation: 0, popularity: 0 },
    rewards: {
      succeeded: {
        support: { reputation: 10, popularity: 6 },
        oppose: { reputation: 2, popularity: 8 },
        creator: { reputation: 3, popularity: 4 },
      },
      failed: {
        support: { reputation: 6, popularity: 10 },
        oppose: { reputation: 8, popularity: 2 },
        creator: { reputation: 1, popularity: 2 },
      },
    },
    ...overrides,
  };
  return {
    projects: [project, { ...project, id: "market" }],
    world: {
      zone: { id: "zone:test", name: "Test", description: "Test zone" },
      npcCount: 3,
      firstNames: ["Ada", "Leo"],
      lastNames: ["Vale", "Reed"],
      npcReputation: [20, 20],
      npcPopularity: [20, 20],
      npcInfluence: [3, 3],
      npcParticipationChance: 0,
      npcSupportChance: 0.5,
      initialProjects: [],
    },
  };
}
