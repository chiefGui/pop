import { expect, test } from "vite-plus/test";
import { distributeRewards } from "./rewards";
import { createRandom } from "./random";
import type { CommitmentView, OutcomeRewards } from "../contracts";

test("largest remainders conserve whole pools, seed ties, and keep the creator bonus separate", () => {
  const commitments: CommitmentView[] = [0, 1, 2].map((index) => ({
    characterId: `character:${index}`,
    side: "support",
    influence: 1,
    influenceDays: 1,
  }));
  const rewards: OutcomeRewards = {
    support: { reputation: 10, popularity: 2 },
    oppose: { reputation: 100, popularity: 100 },
    creator: { reputation: 5, popularity: 7 },
  };
  const result = distributeRewards(commitments, "character:0", rewards, createRandom(2, "rewards"));
  expect(result.reduce((total, payout) => total + payout.participation.reputation, 0)).toBe(10);
  expect(result.map((payout) => payout.participation.reputation).sort()).toEqual([3, 3, 4]);
  expect(result.reduce((total, payout) => total + payout.participation.popularity, 0)).toBe(2);
  expect(result[0]!.creator).toEqual({ reputation: 5, popularity: 7 });
  expect(result).toEqual(
    distributeRewards(commitments, "character:0", rewards, createRandom(2, "rewards")),
  );
});

test("reward weights reflect elapsed participation rather than the final deposit", () => {
  const commitments: CommitmentView[] = [
    { characterId: "character:0", side: "support", influence: 3, influenceDays: 5 },
    { characterId: "character:1", side: "support", influence: 2, influenceDays: 10 },
    { characterId: "character:2", side: "oppose", influence: 1, influenceDays: 1 },
  ];
  const rewards: OutcomeRewards = {
    support: { reputation: 15, popularity: 0 },
    oppose: { reputation: 0, popularity: 9 },
    creator: { reputation: 0, popularity: 0 },
  };
  const result = distributeRewards(commitments, "character:0", rewards, createRandom(2, "rewards"));
  expect(result.map((entry) => entry.participation)).toEqual([
    { reputation: 5, popularity: 0 },
    { reputation: 10, popularity: 0 },
    { reputation: 0, popularity: 9 },
  ]);
});
