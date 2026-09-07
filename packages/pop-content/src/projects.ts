import type { ProjectDefinition } from "@pop/simulation/contracts";

export const projects: readonly ProjectDefinition[] = [
  {
    id: "street-cleanup",
    name: "Clean up the streets",
    description:
      "Bring a few neighbors together. Clear the litter, reclaim the sidewalks, and put your name to something useful.",
    durationDays: 8,
    progressTarget: 22,
    requirements: { reputation: 3, popularity: 3 },
    rewards: {
      succeeded: {
        support: { reputation: 48, popularity: 24 },
        oppose: { reputation: 0, popularity: 4 },
        creator: { reputation: 12, popularity: 12 },
      },
      failed: {
        support: { reputation: 8, popularity: 8 },
        oppose: { reputation: 12, popularity: 40 },
        creator: { reputation: 0, popularity: 0 },
      },
    },
  },
  {
    id: "park-renovation",
    name: "Restore Foundry Park",
    description:
      "Turn a neglected corner of the district into a place to gather. A bigger promise needs a bigger coalition.",
    durationDays: 12,
    progressTarget: 90,
    requirements: { reputation: 18, popularity: 12 },
    rewards: {
      succeeded: {
        support: { reputation: 180, popularity: 90 },
        oppose: { reputation: 0, popularity: 12 },
        creator: { reputation: 30, popularity: 20 },
      },
      failed: {
        support: { reputation: 40, popularity: 24 },
        oppose: { reputation: 35, popularity: 150 },
        creator: { reputation: 0, popularity: 0 },
      },
    },
  },
  {
    id: "night-market",
    name: "Open a night market",
    description:
      "Give local traders an evening on the square. Some see a livelihood; others see noise outside their windows.",
    durationDays: 10,
    progressTarget: 60,
    requirements: { reputation: 12, popularity: 18 },
    rewards: {
      succeeded: {
        support: { reputation: 80, popularity: 160 },
        oppose: { reputation: 12, popularity: 0 },
        creator: { reputation: 20, popularity: 30 },
      },
      failed: {
        support: { reputation: 24, popularity: 32 },
        oppose: { reputation: 100, popularity: 60 },
        creator: { reputation: 0, popularity: 0 },
      },
    },
  },
  {
    id: "streetlights",
    name: "Light the walk home",
    description:
      "Organize repairs along the station road. A practical improvement with a short window to get it done.",
    durationDays: 7,
    progressTarget: 32,
    requirements: { reputation: 10, popularity: 6 },
    rewards: {
      succeeded: {
        support: { reputation: 120, popularity: 90 },
        oppose: { reputation: 0, popularity: 8 },
        creator: { reputation: 20, popularity: 12 },
      },
      failed: {
        support: { reputation: 60, popularity: 60 },
        oppose: { reputation: 40, popularity: 90 },
        creator: { reputation: 0, popularity: 0 },
      },
    },
  },
  {
    id: "community-kitchen",
    name: "Keep the kitchen open",
    description:
      "Build a volunteer rota for the community kitchen. Quiet, sustained work that people remember.",
    durationDays: 16,
    progressTarget: 110,
    requirements: { reputation: 15, popularity: 15 },
    rewards: {
      succeeded: {
        support: { reputation: 120, popularity: 220 },
        oppose: { reputation: 8, popularity: 0 },
        creator: { reputation: 24, popularity: 40 },
      },
      failed: {
        support: { reputation: 40, popularity: 50 },
        oppose: { reputation: 120, popularity: 60 },
        creator: { reputation: 0, popularity: 0 },
      },
    },
  },
  {
    id: "public-assembly",
    name: "Call a public assembly",
    description:
      "Get the district in one room to discuss its future. Getting people to agree to meet is a project of its own.",
    durationDays: 14,
    progressTarget: 85,
    requirements: { reputation: 22, popularity: 25 },
    rewards: {
      succeeded: {
        support: { reputation: 160, popularity: 120 },
        oppose: { reputation: 12, popularity: 12 },
        creator: { reputation: 35, popularity: 35 },
      },
      failed: {
        support: { reputation: 36, popularity: 30 },
        oppose: { reputation: 80, popularity: 160 },
        creator: { reputation: 0, popularity: 0 },
      },
    },
  },
];
