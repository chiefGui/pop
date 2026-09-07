import type { WorldState } from "../../kernel/world";
import { integer } from "../../kernel/random";
import type { Random } from "../../kernel/random";
import type { CharacterId } from "../../model";
import type { SessionOptions } from "../../contracts";
import type { WorldDefinition } from "./model";

export function populateWorld(
  world: WorldState,
  definition: WorldDefinition,
  options: SessionOptions,
  generation: Random,
  names: Random,
) {
  const playerId: CharacterId = "character:0";
  world.addCharacter({
    id: playerId,
    name: options.playerName,
    zoneId: definition.zone.id,
    reputation: 0,
    popularity: 0,
    influence: 1,
  });
  for (let index = 1; index <= definition.npcCount; index += 1) {
    world.addCharacter({
      id: `character:${index}`,
      name: `${definition.firstNames[integer(names, 0, definition.firstNames.length - 1)]} ${definition.lastNames[integer(names, 0, definition.lastNames.length - 1)]}`,
      zoneId: definition.zone.id,
      reputation: integer(generation, ...definition.npcReputation),
      popularity: integer(generation, ...definition.npcPopularity),
      influence: integer(generation, ...definition.npcInfluence),
    });
  }

  return playerId;
}
