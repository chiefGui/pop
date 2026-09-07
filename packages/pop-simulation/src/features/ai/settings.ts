import { Schema } from "effect";

const Probability = Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 }));

export const NpcSettings = Schema.Struct({
  participationChance: Probability,
  supportChance: Probability,
});
export type NpcSettings = typeof NpcSettings.Type;
