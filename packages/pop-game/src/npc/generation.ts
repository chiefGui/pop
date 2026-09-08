import { DateTime, Schema } from "effect";
import { integer, pick } from "@pop/engine";
import type { Random } from "@pop/engine";
import { CharacterName } from "#game/characters";
import type { Character, CharacterId } from "#game/characters";
import { gameStartDate } from "#game/calendar";
import type { ZoneId } from "#game/zones";

export const NpcNames = Schema.Struct({
  givenNames: Schema.Array(CharacterName).check(Schema.isMinLength(1)),
  familyNames: Schema.Array(CharacterName).check(Schema.isMinLength(1)),
});
export type NpcNames = typeof NpcNames.Type;

const GenerationAmount = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1000 }));
const GenerationAge = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 120 }));
const generationDate = DateTime.makeUnsafe(gameStartDate + "T00:00:00Z");
const GenerationRange = Schema.Tuple([GenerationAmount, GenerationAmount]).check(
  Schema.makeFilter((range) => {
    if (range[0] > range[1]) return "Generation ranges must have minimum <= maximum.";
  }),
);

export const NpcGenerationSettings = Schema.Struct({
  npcAge: Schema.Tuple([GenerationAge, GenerationAge]).check(
    Schema.makeFilter((range) => {
      if (range[0] > range[1]) return "Age ranges must have minimum <= maximum.";
    }),
  ),
  npcCount: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10_000 })),
  npcReputation: GenerationRange,
  npcPopularity: GenerationRange,
  npcInfluence: GenerationRange,
});
export type NpcGenerationSettings = typeof NpcGenerationSettings.Type;

interface NpcGeneration {
  readonly names: NpcNames;
  readonly zoneId: ZoneId;
  readonly settings: NpcGenerationSettings;
  readonly random: {
    readonly standing: Random;
    readonly names: Random;
    readonly birthdays: Random;
  };
}

export function generateNpc(
  id: CharacterId,
  { names, zoneId, settings, random }: NpcGeneration,
): Character {
  return {
    id,
    givenName: pick(random.names, names.givenNames),
    familyName: pick(random.names, names.familyNames),
    birthDate: generateBirthDate(random.birthdays, settings.npcAge),
    zoneId,
    reputation: integer(random.standing, ...settings.npcReputation),
    popularity: integer(random.standing, ...settings.npcPopularity),
    influence: integer(random.standing, ...settings.npcInfluence),
  };
}

function generateBirthDate(random: Random, range: readonly [number, number]) {
  const age = integer(random, ...range);
  const oldest = DateTime.add(DateTime.subtract(generationDate, { years: age + 1 }), { days: 1 });
  const youngest = DateTime.subtract(generationDate, { years: age });
  const days = (DateTime.toEpochMillis(youngest) - DateTime.toEpochMillis(oldest)) / 86_400_000;
  return DateTime.formatIsoDateUtc(DateTime.add(oldest, { days: integer(random, 0, days) }));
}
