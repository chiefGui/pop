import { expect, test } from "vite-plus/test";
import { Cause, Deferred, Effect, Exit, Fiber, Layer, ManagedRuntime, Result } from "effect";
import { Simulation, simulationLayer } from "./simulation";
import { SimulationRandom } from "./internal/random";
import { NpcPolicy } from "./internal/npc-policy";
import { fixture } from "../test/fixture";

const options = { seed: 42, playerName: "Player" };

test("malformed inputs are typed failures and never change world state", async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const simulation = yield* Simulation;
      const before = yield* simulation.getView;
      for (const input of [
        null,
        {},
        { type: "other" },
        { type: "create-project", actorId: "character:0", definitionId: "cleanup", influence: 0.5 },
        {
          type: "commit",
          actorId: "character:-1",
          projectId: "project:0",
          side: "support",
          influence: 1,
        },
      ]) {
        const result = yield* Effect.result(simulation.dispatch(input));
        expect(result).toMatchObject({ _tag: "Failure", failure: { _tag: "InvalidCommand" } });
        expect(yield* simulation.getView).toEqual(before);
      }
      const invalid = yield* Effect.result(
        simulation.dispatch({
          type: "create-project",
          actorId: "character:0",
          definitionId: "cleanup",
          influence: 2,
        }),
      );
      expect(invalid).toMatchObject({
        _tag: "Failure",
        failure: { _tag: "ActionRejected", reason: "InsufficientInfluence" },
      });
    }).pipe(Effect.provide(simulationLayer(fixture(), options))),
  );
});

test("content and session validation failures stay in the typed channel", async () => {
  for (const content of [
    null,
    {},
    { ...fixture(), projects: [{ id: "broken" }] },
    fixture({ durationDays: 0 }),
  ]) {
    const exit = await Effect.runPromiseExit(
      Simulation.pipe(Effect.provide(simulationLayer(content, options))),
    );
    expect(Exit.findError(exit)).toMatchObject({
      _tag: "Success",
      success: { _tag: "InvalidContent" },
    });
  }
  const exit = await Effect.runPromiseExit(
    Simulation.pipe(Effect.provide(simulationLayer(fixture(), { ...options, seed: -1 }))),
  );
  expect(Exit.findError(exit)).toMatchObject({
    _tag: "Success",
    success: { _tag: "InvalidSessionOptions" },
  });
});

test("concurrent commitments cannot overspend and racing creators cannot duplicate a zone project", async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const simulation = yield* Simulation;
      const creations = yield* Effect.all(
        ["character:1", "character:2"].map((actorId) =>
          Effect.result(
            simulation.dispatch({
              type: "create-project",
              actorId,
              definitionId: "cleanup",
              influence: 1,
            }),
          ),
        ),
        { concurrency: "unbounded" },
      );
      expect(creations.filter(Result.isSuccess)).toHaveLength(1);
      const project = (yield* simulation.getView).projects[0]!;
      const commitments = yield* Effect.all(
        [1, 2].map(() =>
          Effect.result(
            simulation.dispatch({
              type: "commit",
              actorId: "character:3",
              projectId: project.id,
              side: "support",
              influence: 2,
            }),
          ),
        ),
        { concurrency: "unbounded" },
      );
      expect(commitments.filter(Result.isSuccess)).toHaveLength(1);
      const view = yield* simulation.getView;
      expect(view.projects).toHaveLength(1);
      expect(view.characters[3]!.availableInfluence).toBe(1);
    }).pipe(Effect.provide(simulationLayer(fixture(), options))),
  );
});

test("concurrent days serialize around an asynchronous NPC policy", async () => {
  const policy = Layer.succeed(NpcPolicy, { decide: () => Effect.yieldNow.pipe(Effect.as([])) });
  await Effect.runPromise(
    Effect.gen(function* () {
      const simulation = yield* Simulation;
      const results = yield* Effect.all(
        [1, 2, 3].map(() => simulation.dispatch({ type: "advance-day" })),
        { concurrency: "unbounded" },
      );
      expect(results.map((view) => view.day).sort()).toEqual([1, 2, 3]);
      expect((yield* simulation.getView).day).toBe(3);
    }).pipe(Effect.provide(simulationLayer(fixture(), options, policy))),
  );
});

test("an invalid NPC batch is rejected in full before any commitment is applied", async () => {
  const policy = Layer.succeed(NpcPolicy, {
    decide: () =>
      Effect.succeed([
        {
          type: "commit" as const,
          actorId: "character:2" as const,
          projectId: "project:0" as const,
          side: "support" as const,
          influence: 1,
        },
        {
          type: "commit" as const,
          actorId: "character:3" as const,
          projectId: "project:0" as const,
          side: "support" as const,
          influence: 100,
        },
      ]),
  });
  await Effect.runPromise(
    Effect.gen(function* () {
      const simulation = yield* Simulation;
      const before = yield* simulation.dispatch({
        type: "create-project",
        actorId: "character:1",
        definitionId: "cleanup",
        influence: 1,
      });
      const result = yield* Effect.result(simulation.dispatch({ type: "advance-day" }));
      expect(result).toMatchObject({ _tag: "Failure", failure: { _tag: "InvalidNpcDecision" } });
      expect(yield* simulation.getView).toEqual(before);
    }).pipe(Effect.provide(simulationLayer(fixture(), options, policy))),
  );
});

test("interrupting an uncommitted day restores randomness and releases the session gate", async () => {
  const entered = Deferred.makeUnsafe<void>();
  let random!: SimulationRandom["Service"];
  let wait = true;
  const policy = Layer.effect(
    NpcPolicy,
    Effect.gen(function* () {
      random = yield* SimulationRandom;
      return NpcPolicy.of({
        decide: Effect.fn("TestPolicy.decide")(function* () {
          random.decisions();
          yield* Deferred.succeed(entered, undefined);
          if (wait) yield* Effect.never;
          return [];
        }),
      });
    }),
  );
  const runtime = ManagedRuntime.make(simulationLayer(fixture(), options, policy));
  try {
    const simulation = await runtime.runPromise(Simulation);
    const checkpoint = random.capture();
    const pending = runtime.runFork(simulation.dispatch({ type: "advance-day" }));
    await Effect.runPromise(Deferred.await(entered));
    await Effect.runPromise(Fiber.interrupt(pending));
    expect(random.capture()).toEqual(checkpoint);
    expect((await runtime.runPromise(simulation.getView)).day).toBe(0);
    wait = false;
    expect((await runtime.runPromise(simulation.dispatch({ type: "advance-day" }))).day).toBe(1);
  } finally {
    await runtime.dispose();
  }
});

test("closing the scope makes captured services unusable; a new scope starts cleanly", async () => {
  const runtime = ManagedRuntime.make(simulationLayer(fixture(), options));
  const simulation = runtime.runSync(Simulation);
  const initial = runtime.runSync(simulation.getView);
  runtime.runSync(simulation.dispatch({ type: "advance-day" }));
  await runtime.dispose();
  expect(Effect.runSync(Effect.result(simulation.getView))).toMatchObject({
    _tag: "Failure",
    failure: { _tag: "SessionClosed" },
  });
  const fresh = await Effect.runPromise(
    Effect.gen(function* () {
      const simulation = yield* Simulation;
      return yield* simulation.getView;
    }).pipe(Effect.provide(simulationLayer(fixture(), options))),
  );
  expect(fresh).toEqual(initial);
});

test("unexpected defects are not reported as action rejections and close the session", async () => {
  const policy = Layer.succeed(NpcPolicy, { decide: () => Effect.die(new Error("Broken policy")) });
  const runtime = ManagedRuntime.make(simulationLayer(fixture(), options, policy));
  try {
    const simulation = runtime.runSync(Simulation);
    const exit = runtime.runSyncExit(simulation.dispatch({ type: "advance-day" }));
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) expect(Cause.hasDies(exit.cause)).toBe(true);
    expect(runtime.runSync(Effect.result(simulation.getView))).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "SessionClosed" },
    });
  } finally {
    await runtime.dispose();
  }
});
