import { expect, test } from "vite-plus/test";
import { Effect, Layer } from "effect";
import { NpcPolicy } from "@pop/game";
import { gameContent } from "@pop/content";
import { createGameClient } from "#client/client";

const setup = {
  seed: 42,
  generation: {
    npcAge: [18, 80] as const,
    npcCount: 1,
    npcReputation: [0, 0] as const,
    npcPopularity: [0, 0] as const,
    npcInfluence: [1, 1] as const,
  },
  ai: { participationChance: 0, supportChance: 0.5 },
  initialProjects: [],
};

test("async decisions publish pending immediately, reject duplicate turns, and leave observations readable", async () => {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const client = createGameClient(
    gameContent,
    setup,
    Layer.succeed(NpcPolicy, { decide: () => Effect.promise(() => wait).pipe(Effect.as([])) }),
  );
  try {
    await client.start({ givenName: "Ada", familyName: "Vale", birthDate: "1990-01-02" });
    const before = client.getSnapshot().world;
    const turn = client.advanceDay();
    expect(client.getSnapshot().pending).toBe(true);
    expect(client.getSnapshot().world).toBe(before);
    expect(client.projects.getView()!.player.displayName).toBe("Ada Vale");
    expect(await client.advanceDay()).toBeUndefined();
    release();
    await turn;
    expect(client.getSnapshot()).toMatchObject({ pending: false, world: { day: 1 }, error: null });
  } finally {
    release();
    await client.dispose();
  }
});

test("disposal interrupts a waiting policy and stale results cannot overwrite a restarted session", async () => {
  const client = createGameClient(
    gameContent,
    setup,
    Layer.succeed(NpcPolicy, { decide: () => Effect.promise(() => new Promise<never>(() => {})) }),
  );
  try {
    await client.start({ givenName: "Ada", familyName: "Vale", birthDate: "1990-01-02" });
    const turn = client.advanceDay();
    await client.dispose();
    await client.start({ givenName: "Bea", familyName: "Vale", birthDate: "1990-01-02" });
    await turn;
    expect(client.getSnapshot()).toMatchObject({
      pending: false,
      world: { day: 0, characters: [{ displayName: "Bea Vale" }, {}] },
    });
  } finally {
    await client.dispose();
  }
});

test("client views use the session catalog even if the original authored object changes", async () => {
  const projects = gameContent.projects.map((project) => ({
    ...project,
    requirements: { reputation: 0, popularity: 0 },
  }));
  const content = { ...gameContent, projects };
  const client = createGameClient(content, setup);
  try {
    await client.start({ givenName: "Ada", familyName: "Vale", birthDate: "1990-01-02" });
    const originalName = projects[0]!.name;
    projects[0]!.name = "Changed outside the session";
    projects[0]!.requirements.reputation = 999;
    const id = await client.projects.create(projects[0]!.id, 1);
    expect(id).toBeDefined();
    expect(client.projects.getView()!.byId.get(id!)!.definition.name).toBe(originalName);
  } finally {
    await client.dispose();
  }
});

test("shutdown listeners cannot start a session or dispose it twice while cleanup is pending", async () => {
  const client = createGameClient(gameContent, setup);
  await client.start({ givenName: "Ada", familyName: "Vale", birthDate: "1990-01-02" });
  let nested: Promise<void> | undefined;
  let observed = false;
  const unsubscribe = client.subscribe(() => {
    if (observed || !client.getSnapshot().pending || client.getSnapshot().world) return;
    observed = true;
    nested = client.dispose();
    void client.start({
      givenName: "Interrupted cleanup",
      familyName: "Vale",
      birthDate: "1990-01-02",
    });
  });
  try {
    const closing = client.dispose();
    expect(nested).toBe(closing);
    await closing;
    expect(client.getSnapshot()).toMatchObject({ world: null, pending: false });
    await client.start({ givenName: "Bea", familyName: "Vale", birthDate: "1990-01-02" });
    expect(client.getSnapshot().world!.characters[0]!.displayName).toBe("Bea Vale");
  } finally {
    unsubscribe();
    await client.dispose();
  }
});
