import { Schema } from "effect";
import type { CommitmentView, Side } from "#game/projects/project";
import type { CharacterId } from "#game/characters";
import type { Random } from "@pop/engine";

const AuthoredAmount = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1_000_000 }));

export const Rewards = Schema.Struct({ reputation: AuthoredAmount, popularity: AuthoredAmount });
export type Rewards = typeof Rewards.Type;

export const OutcomeRewards = Schema.Struct({
  support: Rewards,
  oppose: Rewards,
  creator: Rewards,
});
export type OutcomeRewards = typeof OutcomeRewards.Type;

export interface Payout {
  readonly characterId: CharacterId;
  readonly participation: Rewards;
  readonly creator: Rewards;
}

interface WeightedShare {
  readonly characterId: CharacterId;
  readonly weight: number;
}

function allocate(
  pool: number,
  shares: readonly WeightedShare[],
  random: Random,
): Map<CharacterId, number> {
  const totalWeight = shares.reduce((total, share) => total + share.weight, 0);
  const result = new Map<CharacterId, number>();
  if (totalWeight === 0) return result;
  const ranked = shares.map((share) => {
    const numerator = BigInt(pool) * BigInt(share.weight);
    const denominator = BigInt(totalWeight);
    const whole = Number(numerator / denominator);
    result.set(share.characterId, whole);
    return { characterId: share.characterId, remainder: numerator % denominator, tie: random() };
  });
  ranked.sort((left, right) => {
    if (left.remainder > right.remainder) return -1;
    if (left.remainder < right.remainder) return 1;
    return left.tie - right.tie;
  });
  const allocated = [...result.values()].reduce((total, value) => total + value, 0);
  for (let index = 0; index < pool - allocated; index += 1) {
    const recipient = ranked[index]!;
    result.set(recipient.characterId, result.get(recipient.characterId)! + 1);
  }
  return result;
}

export function distributeRewards(
  commitments: readonly CommitmentView[],
  creatorId: CharacterId,
  rewards: OutcomeRewards,
  random: Random,
): Payout[] {
  const participants = new Map<CharacterId, Rewards>();
  for (const side of ["support", "oppose"] satisfies Side[]) {
    const shares = commitments
      .filter((entry) => entry.side === side && entry.influenceDays > 0)
      .map((entry) => ({ characterId: entry.characterId, weight: entry.influenceDays }));
    const reputation = allocate(rewards[side].reputation, shares, random);
    const popularity = allocate(rewards[side].popularity, shares, random);
    for (const share of shares) {
      participants.set(share.characterId, {
        reputation: reputation.get(share.characterId)!,
        popularity: popularity.get(share.characterId)!,
      });
    }
  }
  const payouts: Payout[] = [];
  for (const commitment of commitments) {
    let creator: Rewards = { reputation: 0, popularity: 0 };
    if (commitment.characterId === creatorId) creator = { ...rewards.creator };
    payouts.push({
      characterId: commitment.characterId,
      participation: participants.get(commitment.characterId) ?? { reputation: 0, popularity: 0 },
      creator,
    });
  }
  return payouts;
}
