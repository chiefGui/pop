import { expect, test } from "vite-plus/test";
import { createWorld, deleteWorld } from "bitecs";
import { createCharacters } from "#game/characters/characters";

test("character storage preserves prior observations and rejects duplicate identities", () => {
  const world = createWorld();
  const characters = createCharacters(world);
  try {
    const character = {
      id: "character:0" as const,
      givenName: "Ada",
      familyName: "Vale",
      birthDate: "1990-01-02",
      zoneId: "zone:test" as const,
      reputation: 20,
      popularity: 20,
      influence: 3,
    };
    characters.add(character);
    character.givenName = "Changed outside storage";
    const before = characters.get("character:0")!;
    expect(before.givenName).toBe("Ada");
    expect(Object.isFrozen(before)).toBe(true);
    expect(() => characters.add({ ...before, givenName: "Replacement" })).toThrow(
      "Duplicate character",
    );
    characters.grantStanding(before.id, { reputation: 2, popularity: 3 });
    expect(before.reputation).toBe(20);
    expect(characters.get(before.id)).toMatchObject({ reputation: 22, popularity: 23 });
    expect([...characters.all()]).toHaveLength(1);
  } finally {
    deleteWorld(world);
  }
});
