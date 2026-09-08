import { Cause, Context, Effect, Exit, Layer, Schema, Scope, Semaphore } from "effect";
import { preparedStep } from "#engine/sessions/step";
import type { Step } from "#engine/sessions/step";

export class SessionClosed extends Schema.TaggedError<SessionClosed>()("SessionClosed", {
  message: Schema.String,
}) {}
export class SessionReentry extends Schema.TaggedError<SessionReentry>()("SessionReentry", {
  message: Schema.String,
}) {}
export type SessionError = SessionClosed | SessionReentry;
const ActiveSessions = Context.Reference<ReadonlySet<symbol>>("@pop/engine/ActiveSessions", {
  defaultValue: () => new Set(),
});

export class Session extends Context.Service<
  Session,
  {
    readonly scope: Scope.Scope;
    readonly run: <A, E, R>(
      effect: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | SessionError, R>;
    readonly step: <State, Prepared, Value, E, R>(
      step: Step<State, Prepared, Value, E, R>,
    ) => Effect.Effect<Value, E | SessionError, R>;
  }
>()("@pop/engine/Session") {
  static readonly layer = Layer.effect(
    Session,
    Effect.gen(function* () {
      const gate = yield* Semaphore.make(1);
      const scope = yield* Scope.make();
      const identity = Symbol();
      let closed = false;
      yield* Effect.addFinalizer((exit) =>
        gate
          .withPermit(
            Effect.sync(() => {
              closed = true;
            }),
          )
          .pipe(Effect.andThen(Scope.close(scope, exit))),
      );
      const run = Effect.fn("Session.run")(function* <A, E, R>(effect: Effect.Effect<A, E, R>) {
        const active = yield* ActiveSessions;
        if (active.has(identity))
          return yield* new SessionReentry({
            message: "A session operation cannot start another operation on the same session.",
          });
        return yield* gate.withPermit(
          Effect.suspend((): Effect.Effect<A, E | SessionClosed, R> => {
            if (closed)
              return Effect.fail(
                new SessionClosed({ message: "This simulation session is closed." }),
              );
            return effect;
          }).pipe(
            Effect.provideService(ActiveSessions, new Set([...active, identity])),
            Effect.onExit((exit) =>
              Effect.sync(() => {
                if (Exit.isFailure(exit) && Cause.hasDies(exit.cause)) closed = true;
              }),
            ),
          ),
        );
      });
      const step = <State, Prepared, Value, E, R>(options: Step<State, Prepared, Value, E, R>) =>
        run(preparedStep(options));
      return Session.of({ scope, run, step });
    }),
  );
}
