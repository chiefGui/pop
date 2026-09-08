import { expect, test } from "vite-plus/test";
import { Effect, Exit, ManagedRuntime, Scope } from "effect";
import { Session } from "#engine/sessions/session";
import { createRandom } from "#engine/random";

test("session resources release in reverse order without borrowing caller lifetimes", async () => {
  const released: string[] = [];
  const runtime = ManagedRuntime.make(Session.layer);
  const session = await runtime.runPromise(Session);
  for (const resource of ["world", "projects"]) {
    await runtime.runPromise(
      Effect.acquireRelease(Effect.succeed(resource), (value) =>
        Effect.sync(() => {
          released.push(value);
        }),
      ).pipe(Effect.provideService(Scope.Scope, session.scope)),
    );
  }
  const child = await runtime.runPromise(Scope.fork(session.scope));
  await runtime.runPromise(
    Effect.acquireRelease(Effect.void, () =>
      Effect.sync(() => {
        released.push("child");
      }),
    ).pipe(Effect.provideService(Scope.Scope, child)),
  );
  await runtime.runPromise(Scope.close(child, Exit.void));
  expect(released).toEqual(["child"]);
  expect(await runtime.runPromise(session.run(Effect.succeed(1)))).toBe(1);
  await runtime.dispose();
  expect(released).toEqual(["child", "projects", "world"]);
  expect(await Effect.runPromise(Effect.result(session.run(Effect.void)))).toMatchObject({
    _tag: "Failure",
    failure: { _tag: "SessionClosed" },
  });
});

test("nested operations reject without deadlocking or closing the session", async () => {
  const runtime = ManagedRuntime.make(Session.layer);
  try {
    const session = await runtime.runPromise(Session);
    expect(
      await runtime.runPromise(Effect.result(session.run(session.run(Effect.void)))),
    ).toMatchObject({ _tag: "Failure", failure: { _tag: "SessionReentry" } });
    expect(await runtime.runPromise(session.run(Effect.succeed(1)))).toBe(1);
  } finally {
    await runtime.dispose();
  }
});

test("failed preparation restores explicit memory and randomness without closing the session", async () => {
  const runtime = ManagedRuntime.make(Session.layer);
  const random = createRandom(42, "decisions");
  let memory = 1;
  let writes = 0;
  const checkpoint = {
    capture: () => ({ memory, random: random.getState() }),
    restore: (state: { memory: number; random: number }) => {
      memory = state.memory;
      random.restore(state.random);
    },
  };
  const before = checkpoint.capture();
  try {
    const session = runtime.runSync(Session);
    const result = runtime.runSync(
      Effect.result(
        session.step({
          checkpoint,
          prepare: Effect.gen(function* () {
            memory = 9;
            random();
            return yield* Effect.fail("rejected");
          }),
          commit: () => {
            writes += 1;
          },
        }),
      ),
    );
    expect(result).toMatchObject({ _tag: "Failure", failure: "rejected" });
    expect(checkpoint.capture()).toEqual(before);
    expect(writes).toBe(0);
    expect(runtime.runSync(session.run(Effect.succeed("usable")))).toBe("usable");
  } finally {
    await runtime.dispose();
  }
});

test("successful commits retain checkpoints; commit defects close the session", async () => {
  const runtime = ManagedRuntime.make(Session.layer);
  let memory = 0;
  const checkpoint = {
    capture: () => memory,
    restore: (value: number) => {
      memory = value;
    },
  };
  try {
    const session = runtime.runSync(Session);
    const result = runtime.runSync(
      session.step({
        checkpoint,
        prepare: Effect.sync(() => {
          memory = 1;
          return 7;
        }),
        commit: (value) => value * 2,
      }),
    );
    expect(result).toBe(14);
    expect(memory).toBe(1);
    const exit = runtime.runSyncExit(
      session.step({
        checkpoint,
        prepare: Effect.void,
        commit: () => {
          throw new Error("write failed");
        },
      }),
    );
    expect(exit._tag).toBe("Failure");
    expect(runtime.runSync(Effect.result(session.run(Effect.void)))).toMatchObject({
      _tag: "Failure",
      failure: { _tag: "SessionClosed" },
    });
  } finally {
    await runtime.dispose();
  }
});
