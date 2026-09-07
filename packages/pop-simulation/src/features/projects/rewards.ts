import type { CommitmentView, OutcomeRewards, Payout, Side } from "./model";
import type { CharacterId, Rewards } from "../../model";
import type { Random } from "../../kernel/random";

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
