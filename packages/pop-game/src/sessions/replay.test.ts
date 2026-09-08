import { createHash } from "node:crypto";
import { expect, test } from "vite-plus/test";
import { Effect, ManagedRuntime } from "effect";
import { Simulation, simulationLayer } from "#game/sessions/session";
import { fixture, setup } from "#test/fixture";

test("retains the recorded random-policy outcomes across engine extraction", () => {
  const fingerprints: string[] = [];
  for (const seed of [0, 42, 4294967295]) {
    const runtime = ManagedRuntime.make(
      simulationLayer(fixture({ durationDays: 8, progressTarget: 20 }), {
        ...setup({
          seed,
          ai: { participationChance: 0.6, supportChance: 0.55 },
          initialProjects: ["cleanup", "market"],
        }),
        playerName: "Player",
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
      "d44b29e5cc554e3988910d15b95c47d34bd33c6009ea339bfefc7b7f59ef9dbb",
      "56c7e166635e20fb860e8140b671e34b5114b9c857772715eaba905901aafead",
      "e69e65f8b2f13bb4509424f650ffc03340161e18905c0c55110b285184b2455d",
    ]
  `);
});
