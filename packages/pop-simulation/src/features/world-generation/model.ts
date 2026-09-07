import { Schema } from "effect";
import { ZoneId, Name, DefinitionId } from "../../model";

const GenerationAmount = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1000 }));
const GenerationRange = Schema.Tuple([GenerationAmount, GenerationAmount]).check(
  Schema.makeFilter((range) => {
    if (range[0] > range[1]) return "Generation ranges must have minimum <= maximum.";
  }),
);
const Probability = Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 }));

export const WorldDefinition = Schema.Struct({
  zone: Schema.Struct({ id: ZoneId, name: Name, description: Schema.String }),
  npcCount: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10_000 })),
  firstNames: Schema.Array(Name).check(Schema.isMinLength(1)),
  lastNames: Schema.Array(Name).check(Schema.isMinLength(1)),
  npcReputation: GenerationRange,
  npcPopularity: GenerationRange,
  npcInfluence: GenerationRange,
  npcParticipationChance: Probability,
  npcSupportChance: Probability,
  initialProjects: Schema.Array(DefinitionId),
});
export type WorldDefinition = typeof WorldDefinition.Type;
