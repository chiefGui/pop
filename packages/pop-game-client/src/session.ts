import { Cause, Effect, Exit, ManagedRuntime, Result } from "effect";
import { Simulation, simulationLayer } from "@pop/simulation";
import type { ProjectAction, Command, GameContent, GameSetup, WorldView } from "@pop/simulation";

export interface GameSnapshot {
  readonly world: WorldView | null;
  readonly error: string | null;
  readonly message: string;
}

type SessionRuntime = ReturnType<typeof makeRuntime>;
function makeRuntime(content: GameContent, setup: GameSetup, playerName: string) {
  return ManagedRuntime.make(simulationLayer(content, { ...setup, playerName }));
}

// This is the imperative UI boundary. All game operations execute in the session's Effect runtime.
export function createSession(content: GameContent, setup: GameSetup) {
  let session: { runtime: SessionRuntime; simulation: Simulation["Service"] } | undefined;
  let snapshot: GameSnapshot = { world: null, error: null, message: "" };
  const listeners = new Set<() => void>();

  function publish(next: GameSnapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function execute(command: Command, feedback: string | ((world: WorldView) => string)) {
    if (!session) return;
    const result = session.runtime.runSync(Effect.result(session.simulation.dispatch(command)));
    if (Result.isFailure(result)) {
      publish({ ...snapshot, error: result.failure.message, message: "" });
      return;
    }
    const world = result.success.world;
    let message: string;
    if (typeof feedback === "function") message = feedback(world);
    else message = feedback;
    publish({ world, error: null, message });
    return result.success;
  }

  function checkAction(action: ProjectAction) {
    if (!session) return "Create your character first.";
    const result = session.runtime.runSync(Effect.result(session.simulation.checkAction(action)));
    if (Result.isFailure(result)) return result.failure.message;
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    checkAction,
    execute,
    start(name: string) {
      if (session) return;
      const runtime = makeRuntime(content, setup, name);
      const started = runtime.runSyncExit(
        Effect.gen(function* () {
          const simulation = yield* Simulation;
          const world = yield* simulation.getView;
          return { simulation, world };
        }),
      );
      if (Exit.isFailure(started)) {
        Effect.runSync(runtime.disposeEffect);
        const error = Cause.findError(started.cause);
        if (Result.isFailure(error)) throw Cause.squash(started.cause);
        publish({ world: null, error: error.success.message, message: "" });
        return;
      }
      session = { runtime, simulation: started.value.simulation };
      publish({ world: started.value.world, error: null, message: "" });
    },
    dispose() {
      if (session) Effect.runSync(session.runtime.disposeEffect);
      session = undefined;
      snapshot = { world: null, error: null, message: "" };
      listeners.clear();
    },
  };
}

export type Session = ReturnType<typeof createSession>;
