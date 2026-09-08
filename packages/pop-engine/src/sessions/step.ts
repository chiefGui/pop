import { Effect, Exit } from "effect";
export interface Checkpoint<State> {
  readonly capture: () => State;
  readonly restore: (state: State) => void;
}
type Synchronous<Value> = Value extends PromiseLike<unknown> ? never : Value;
export interface Step<State, Prepared, Value, E, R> {
  readonly checkpoint: Checkpoint<State>;
  readonly prepare: Effect.Effect<Prepared, E, R>;
  readonly commit: (prepared: Prepared) => Synchronous<Value>;
}

// Preparation may change checkpointed decision state. World writes happen only in commit.
// A commit defect is fatal to the session; this is not rollback of partially written world state.
export const preparedStep = Effect.fn("Session.step")(function* <State, Prepared, Value, E, R>(
  options: Step<State, Prepared, Value, E, R>,
) {
  const checkpoint = options.checkpoint.capture();
  let committed = false;
  return yield* options.prepare.pipe(
    Effect.flatMap((prepared) =>
      Effect.sync(() => {
        const value = options.commit(prepared);
        committed = true;
        return value;
      }).pipe(Effect.uninterruptible),
    ),
    Effect.onExit((exit) =>
      Effect.sync(() => {
        if (Exit.isFailure(exit) && !committed) options.checkpoint.restore(checkpoint);
      }),
    ),
  );
});
