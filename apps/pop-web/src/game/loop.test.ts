import { expect, test } from "vite-plus/test";
import { Effect } from "effect";
import { Simulation, simulationLayer } from "@pop/game";
import { gameContent } from "@pop/content";
import { gameSetup } from "./setup";

test("the configured opening takes a nobody from contribution to creating and resolving their first project", async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const simulation = yield* Simulation;
      const initial = yield* simulation.getView;
      const opening = initial.projects.find((project) => project.definitionId === "streetlights")!;
      yield* simulation.dispatch({
        type: "commit",
        actorId: "character:0",
        projectId: opening.id,
        side: "support",
        influence: 1,
      });
      for (let day = 0; day < 7; day += 1) yield* simulation.dispatch({ type: "advance-day" });
      const afterParticipation = yield* simulation.getView;
      const player = afterParticipation.characters[0]!;
      expect(player.reputation).toBeGreaterThanOrEqual(3);
      expect(player.popularity).toBeGreaterThanOrEqual(3);
      expect(player.availableInfluence).toBe(1);
      const { world: afterCreation } = yield* simulation.dispatch({
        type: "create-project",
        actorId: player.id,
        definitionId: "street-cleanup",
        influence: 1,
      });
      const own = afterCreation.projects.find((project) => project.creatorId === player.id)!;
      expect(own).toMatchObject({ status: "active", support: 1 });
      for (let day = 0; day < 8; day += 1) yield* simulation.dispatch({ type: "advance-day" });
      const final = yield* simulation.getView;
      expect(final.projects.find((project) => project.id === own.id)!.status).toBe("succeeded");
      expect(final.characters[0]!.availableInfluence).toBe(1);
    }).pipe(Effect.provide(simulationLayer(gameContent, { ...gameSetup, playerName: "Newcomer" }))),
  );
});
