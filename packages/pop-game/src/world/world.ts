import type { CharacterId, CharacterView } from "#game/characters";
import type { Projects, ProjectView } from "#game/projects";
import { createWorld, deleteWorld } from "bitecs";
import { createCharacters } from "#game/characters";
import { createZones } from "#game/zones";
import type { Zone } from "#game/zones";

export function createWorldState(zone: Zone) {
  const ecs = createWorld();
  const characters = createCharacters(ecs);
  const zones = createZones(ecs);
  zones.add(zone);
  return {
    ecs,
    characters,
    zones,
    zoneId: zone.id,
    observe(
      day: number,
      playerId: CharacterId,
      projects: Pick<Projects, "getView" | "availableInfluence">,
    ): WorldView {
      const observed: CharacterView[] = [];
      for (const character of characters.all())
        observed.push({
          ...character,
          availableInfluence: projects.availableInfluence(character),
          isPlayer: character.id === playerId,
        });
      return {
        day,
        playerId,
        zone: { ...zones.get(zone.id)! },
        characters: observed,
        projects: projects.getView(),
      };
    },
    dispose() {
      deleteWorld(ecs);
      characters.clear();
      zones.clear();
    },
  };
}

export interface WorldView {
  readonly day: number;
  readonly playerId: CharacterId;
  readonly zone: Zone;
  readonly characters: readonly CharacterView[];
  readonly projects: readonly ProjectView[];
}
