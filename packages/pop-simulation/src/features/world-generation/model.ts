import { Schema } from "effect";
import { ZoneId, Name } from "../../model";

const GenerationAmount = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1000 }));
const GenerationRange = Schema.Tuple([GenerationAmount, GenerationAmount]).check(
  Schema.makeFilter((range) => {
    if (range[0] > range[1]) return "Generation ranges must have minimum <= maximum.";
  }),
);
export const WorldContent = Schema.Struct({
  zone: Schema.Struct({ id: ZoneId, name: Name, description: Schema.String }),
  firstNames: Schema.Array(Name).check(Schema.isMinLength(1)),
  lastNames: Schema.Array(Name).check(Schema.isMinLength(1)),
});
export type WorldContent = typeof WorldContent.Type;

export const GenerationSettings = Schema.Struct({
  npcCount: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10_000 })),
  npcReputation: GenerationRange,
  npcPopularity: GenerationRange,
  npcInfluence: GenerationRange,
});
export type GenerationSettings = typeof GenerationSettings.Type;
