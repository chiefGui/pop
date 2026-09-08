import { addComponent, addEntity, query } from "bitecs";
import type { World } from "bitecs";
import type { Character, CharacterId } from "#game/characters/character";

export function createCharacters(world: World) {
  const CharacterData: Character[] = [];
  const entities = new Map<CharacterId, number>();
  return {
    add(character: Character) {
      if (entities.has(character.id))
        throw new Error("Duplicate character identity: " + character.id);
      const entity = addEntity(world);
      addComponent(world, entity, CharacterData);
      CharacterData[entity] = Object.freeze({ ...character });
      entities.set(character.id, entity);
    },
    get(id: CharacterId) {
      const entity = entities.get(id);
      if (entity !== undefined) return CharacterData[entity]!;
    },
    grantStanding(
      id: CharacterId,
      reward: { readonly reputation: number; readonly popularity: number },
    ) {
      const entity = entities.get(id);
      if (entity === undefined) throw new Error("Character not found: " + id);
      const character = CharacterData[entity]!;
      const reputation = character.reputation + reward.reputation;
      const popularity = character.popularity + reward.popularity;
      if (!Number.isSafeInteger(reputation) || !Number.isSafeInteger(popularity))
        throw new Error("Character standing exceeded safe integer bounds.");
      CharacterData[entity] = Object.freeze({ ...character, reputation, popularity });
    },
    *all() {
      for (const entity of query(world, [CharacterData])) yield CharacterData[entity]!;
    },
    clear() {
      CharacterData.length = 0;
      entities.clear();
    },
  };
}

export type Characters = ReturnType<typeof createCharacters>;
