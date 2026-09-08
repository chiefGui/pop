import { createHash } from "node:crypto";
import { expect, test } from "vite-plus/test";
import { Effect, ManagedRuntime } from "effect";
import { Simulation, simulationLayer } from "#game/sessions/session";
import { fixture, setup } from "#test/fixture";

test("reproduces recorded character identities and random-policy outcomes", () => {
  const fingerprints: string[] = [];
  for (const seed of [0, 42, 4294967295]) {
    const runtime = ManagedRuntime.make(
      simulationLayer(fixture({ durationDays: 8, progressTarget: 20 }), {
        ...setup({
          seed,
          ai: { participationChance: 0.6, supportChance: 0.55 },
          initialProjects: ["cleanup", "market"],
        }),
        player: { givenName: "Player", familyName: "Vale", birthDate: "1990-01-02" },
      }),
    );
    try {
      const simulation = runtime.runSync(Simulation);
      const hash = createHash("sha256");
      hash.update(JSON.stringify(runtime.runSync(simulation.getView)));
      for (let day = 0; day < 10; day += 1) {
        hash.update(JSON.stringify(runtime.runSync(simulation.dispatch({ type: "advance-day" }))));
      }
      fingerprints.push(hash.digest("hex"));
    } finally {
      Effect.runSync(runtime.disposeEffect);
    }
  }
  expect(fingerprints).toMatchInlineSnapshot(`
    [
      "da6e827026d89731f5441c7eefa67cd65f41877f2fbce1c09a68cb9cc5fe368f",
      "f06e07fac3ca4cf0be077031b85245ac957a91f9507e84ca5a1e708ebe1c6843",
      "a55c048b20c28c64c0176e91c89f8ee2a14476da07d28091f178d4404114aab6",
    ]
  `);
});
