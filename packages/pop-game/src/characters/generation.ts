import { Schema } from "effect";
import { integer } from "@pop/engine";
import type { Random } from "@pop/engine";
import type { CharacterId } from "#game/characters/character";
import type { Characters } from "#game/characters/characters";
import type { ZoneId } from "#game/zones";

const Name = Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(100));
export const CharacterNames = Schema.Struct({
  firstNames: Schema.Array(Name).check(Schema.isMinLength(1)),
  lastNames: Schema.Array(Name).check(Schema.isMinLength(1)),
});
export type CharacterNames = typeof CharacterNames.Type;

const GenerationAmount = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1000 }));
const GenerationRange = Schema.Tuple([GenerationAmount, GenerationAmount]).check(
  Schema.makeFilter((range) => {
    if (range[0] > range[1]) return "Generation ranges must have minimum <= maximum.";
  }),
);

export const GenerationSettings = Schema.Struct({
  npcCount: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10_000 })),
  npcReputation: GenerationRange,
  npcPopularity: GenerationRange,
  npcInfluence: GenerationRange,
});
export type GenerationSettings = typeof GenerationSettings.Type;

export function populateCharacters(
  characters: Characters,
  content: CharacterNames,
  zoneId: ZoneId,
  options: { readonly playerName: string; readonly generation: GenerationSettings },
  generation: Random,
  names: Random,
) {
  const settings = options.generation;
  const playerId: CharacterId = "character:0";
  characters.add({
    id: playerId,
    name: options.playerName,
    zoneId,
    reputation: 0,
    popularity: 0,
    influence: 1,
  });
  for (let index = 1; index <= settings.npcCount; index += 1) {
    characters.add({
      id: `character:${index}`,
      name: `${content.firstNames[integer(names, 0, content.firstNames.length - 1)]} ${content.lastNames[integer(names, 0, content.lastNames.length - 1)]}`,
      zoneId,
      reputation: integer(generation, ...settings.npcReputation),
      popularity: integer(generation, ...settings.npcPopularity),
      influence: integer(generation, ...settings.npcInfluence),
    });
  }

  return playerId;
}
