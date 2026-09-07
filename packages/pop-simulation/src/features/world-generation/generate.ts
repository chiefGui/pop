import type { WorldState } from "../../kernel/world";
import { integer } from "../../kernel/random";
import type { Random } from "../../kernel/random";
import type { CharacterId } from "../../model";
import type { SessionOptions } from "../../contracts";
import type { WorldContent } from "./model";

export function populateWorld(
  world: WorldState,
  content: WorldContent,
  options: SessionOptions,
  generation: Random,
  names: Random,
) {
  const settings = options.generation;
  const playerId: CharacterId = "character:0";
  world.addCharacter({
    id: playerId,
    name: options.playerName,
    zoneId: content.zone.id,
    reputation: 0,
    popularity: 0,
    influence: 1,
  });
  for (let index = 1; index <= settings.npcCount; index += 1) {
    world.addCharacter({
      id: `character:${index}`,
      name: `${content.firstNames[integer(names, 0, content.firstNames.length - 1)]} ${content.lastNames[integer(names, 0, content.lastNames.length - 1)]}`,
      zoneId: content.zone.id,
      reputation: integer(generation, ...settings.npcReputation),
      popularity: integer(generation, ...settings.npcPopularity),
      influence: integer(generation, ...settings.npcInfluence),
    });
  }

  return playerId;
}
