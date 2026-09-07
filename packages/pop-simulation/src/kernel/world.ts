import { addComponent, addEntity, createWorld, deleteWorld, query } from "bitecs";
import type { Character, CharacterId, Zone } from "../model";

// Package-private storage. Features share one ECS; the kernel never imports gameplay modules.
export function createWorldState(zone: Zone) {
  const CharacterData: Character[] = [];
  const ZoneData: Zone[] = [];
  const ecs = createWorld({ components: { CharacterData, ZoneData } });
  const characters = new Map<CharacterId, number>();
  const zoneEntity = addEntity(ecs);
  addComponent(ecs, zoneEntity, ZoneData);
  ZoneData[zoneEntity] = zone;
  let day = 0;

  return {
    ecs,
    get day() {
      return day;
    },
    advanceDay() {
      day += 1;
    },
    getZone: () => ZoneData[zoneEntity]!,
    addCharacter(character: Character) {
      const entity = addEntity(ecs);
      addComponent(ecs, entity, CharacterData);
      CharacterData[entity] = character;
      characters.set(character.id, entity);
    },
    getCharacter(id: CharacterId) {
      const entity = characters.get(id);
      if (entity !== undefined) return CharacterData[entity]!;
    },
    *characters() {
      for (const entity of query(ecs, [CharacterData])) yield CharacterData[entity]!;
    },
    dispose() {
      deleteWorld(ecs);
      CharacterData.length = 0;
      ZoneData.length = 0;
      characters.clear();
    },
  };
}

export type WorldState = ReturnType<typeof createWorldState>;
