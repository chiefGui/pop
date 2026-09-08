import { expect, test } from "vite-plus/test";
import { createWorld, deleteWorld } from "bitecs";
import { createCharacters } from "#game/characters/characters";

test("character storage preserves prior observations and rejects duplicate identities", () => {
  const world = createWorld();
  const characters = createCharacters(world);
  try {
    const character = {
      id: "character:0" as const,
      name: "Ada",
      zoneId: "zone:test" as const,
      reputation: 20,
      popularity: 20,
      influence: 3,
    };
    characters.add(character);
    character.name = "Changed outside storage";
    const before = characters.get("character:0")!;
    expect(before.name).toBe("Ada");
    expect(Object.isFrozen(before)).toBe(true);
    expect(() => characters.add({ ...before, name: "Replacement" })).toThrow("Duplicate character");
    characters.grantStanding(before.id, { reputation: 2, popularity: 3 });
    expect(before.reputation).toBe(20);
    expect(characters.get(before.id)).toMatchObject({ reputation: 22, popularity: 23 });
    expect([...characters.all()]).toHaveLength(1);
  } finally {
    deleteWorld(world);
  }
});
