import { afterEach, expect, test } from "vite-plus/test";
import { gameContent } from "@pop/content";
import { createGameClient } from "@pop/game-client";

import { gameSetup } from "./setup";

const clients: ReturnType<typeof createGameClient>[] = [];
function makeClient(seed: number) {
  const client = createGameClient(gameContent, { ...gameSetup, seed });
  clients.push(client);
  return client;
}
afterEach(async () => {
  for (const client of clients.splice(0)) await client.dispose();
});

test("the client publishes complete turns and exposes the same validation used by commands", async () => {
  const client = makeClient(20260906);
  let changes = 0;
  const unsubscribe = client.subscribe(() => {
    changes += 1;
  });
  await client.start({ givenName: "Ada", familyName: "Vale", birthDate: "1990-01-02" });
  const initial = client.getSnapshot();
  expect(initial.world!.characters[0]!.displayName).toBe("Ada Vale");
  expect(client.getSnapshot()).toBe(initial);
  const project = initial.world!.projects[0]!;
  expect(client.projects.checkCommitment(project.id, "support", 2)).toContain("influence");
  await client.projects.commit(project.id, "support", 2);
  expect(client.getSnapshot().error).toBe(
    client.projects.checkCommitment(project.id, "support", 2),
  );
  expect(client.getSnapshot().world).toBe(initial.world);
  await client.projects.commit(project.id, "support", 1);
  expect(client.getSnapshot().error).toBeNull();
  expect(client.getSnapshot().world!.characters[0]!.availableInfluence).toBe(0);
  for (let day = 0; day < 7; day += 1) await client.advanceDay();
  const resolved = client.getSnapshot().world!;
  expect(resolved.day).toBe(7);
  expect(resolved.characters[0]!.availableInfluence).toBe(1);
  expect(client.projects.checkCreation("street-cleanup", 1)).toBeUndefined();
  await client.projects.create("street-cleanup", 1);
  expect(
    client.getSnapshot().world!.projects.some((entry) => entry.creatorId === resolved.playerId),
  ).toBe(true);
  expect(changes).toBe(22);
  unsubscribe();
  await client.advanceDay();
  expect(changes).toBe(22);
});

test("an invalid character name can be corrected without leaving a partial session", async () => {
  const client = makeClient(1);
  await client.start({ givenName: "  ", familyName: "Vale", birthDate: "1990-01-02" });
  expect(client.getSnapshot().world).toBeNull();
  expect(client.getSnapshot().error).toContain("givenName");
  await client.start({ givenName: "  Ada  ", familyName: "Vale", birthDate: "1990-01-02" });
  expect(client.getSnapshot().world!.characters[0]!.displayName).toBe("Ada Vale");
  expect(client.getSnapshot().error).toBeNull();
});

test("invalid birth dates can be corrected and compound names survive creation", async () => {
  const client = makeClient(1);
  const identity = {
    givenName: "  Ana Maria  ",
    familyName: "  de Souza  ",
    birthDate: "2000-02-29",
  };
  for (const birthDate of ["2001-02-29", "2026-01-02", ""]) {
    await client.start({ ...identity, birthDate });
    expect(client.getSnapshot().world).toBeNull();
    expect(client.getSnapshot().error).toContain("birthDate");
    expect(client.getSnapshot().pending).toBe(false);
  }
  await client.start(identity);
  expect(client.getSnapshot().error).toBeNull();
  expect(client.getSnapshot().world!.characters[0]).toMatchObject({
    givenName: "Ana Maria",
    familyName: "de Souza",
    displayName: "Ana Maria de Souza",
    birthDate: "2000-02-29",
    age: 25,
  });
});

test("separate clients with the fixed seed reproduce the same session", async () => {
  const first = makeClient(20260906);
  const second = makeClient(20260906);
  await first.start({ givenName: "Ada", familyName: "Vale", birthDate: "1990-01-02" });
  await second.start({ givenName: "Ada", familyName: "Vale", birthDate: "1990-01-02" });
  for (let day = 0; day < 20; day += 1) {
    await first.advanceDay();
    await second.advanceDay();
  }
  expect(first.getSnapshot()).toEqual(second.getSnapshot());
});

test("disposing releases the session and a new session can be started", async () => {
  const client = makeClient(20260906);
  await client.start({ givenName: "Ada", familyName: "Vale", birthDate: "1990-01-02" });
  const initial = client.getSnapshot();
  await client.advanceDay();
  await client.dispose();
  expect(client.getSnapshot().world).toBeNull();
  await client.start({ givenName: "Ada", familyName: "Vale", birthDate: "1990-01-02" });
  expect(client.getSnapshot()).toEqual(initial);
});
