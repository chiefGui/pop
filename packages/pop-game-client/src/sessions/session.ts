import { Cause, Effect, Exit, ManagedRuntime, Result } from "effect";
import type { Layer } from "effect";
import { Simulation, simulationLayer } from "@pop/game";
import type {
  NpcPolicy,
  SimulationRandom,
  Command,
  GameContent,
  GameSetup,
  WorldView,
} from "@pop/game";

export interface GameSnapshot {
  readonly world: WorldView | null;
  readonly content: GameContent | null;
  readonly pending: boolean;
  readonly error: string | null;
  readonly message: string;
}

type Policy = Layer.Layer<NpcPolicy, never, SimulationRandom>;
function makeRuntime(content: GameContent, setup: GameSetup, playerName: string, policy?: Policy) {
  return ManagedRuntime.make(simulationLayer(content, { ...setup, playerName }, policy));
}
type RunningSession = {
  readonly runtime: ReturnType<typeof makeRuntime>;
  readonly controller: AbortController;
  simulation?: Simulation["Service"];
};
const empty: GameSnapshot = {
  world: null,
  content: null,
  pending: false,
  error: null,
  message: "",
};

export function createSession(content: GameContent, setup: GameSetup, policy?: Policy) {
  let generation = 0;
  let session: RunningSession | undefined;
  let closing: Promise<void> | undefined;
  let snapshot = empty;
  const listeners = new Set<() => void>();
  function publish(next: GameSnapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }
  async function execute(command: Command, feedback: string | ((world: WorldView) => string)) {
    const active = session;
    if (!active?.simulation || snapshot.pending) return;
    publish({ ...snapshot, pending: true, error: null, message: "" });
    const exit = await active.runtime.runPromiseExit(active.simulation.dispatch(command), {
      signal: active.controller.signal,
    });
    if (session !== active) return;
    if (Exit.isFailure(exit)) {
      const error = Cause.findError(exit.cause);
      if (Result.isSuccess(error)) {
        publish({ ...snapshot, pending: false, error: error.success.message });
      } else {
        const disposal = dispose();
        const disposedGeneration = generation;
        await disposal;
        if (generation !== disposedGeneration) return;
        publish({
          ...empty,
          error: "The game session stopped unexpectedly. Start a new character to continue.",
        });
      }
      return;
    }
    const world = exit.value.world;
    let message: string;
    if (typeof feedback === "function") message = feedback(world);
    else message = feedback;
    publish({ ...snapshot, world, pending: false, error: null, message });
    return exit.value;
  }
  async function start(name: string) {
    if (session || closing) return;
    generation += 1;
    const active: RunningSession = {
      runtime: makeRuntime(content, setup, name, policy),
      controller: new AbortController(),
    };
    session = active;
    publish({ ...empty, pending: true });
    const started = await active.runtime.runPromiseExit(
      Effect.gen(function* () {
        const simulation = yield* Simulation;
        const world = yield* simulation.getView;
        const content = yield* simulation.getContent;
        return { simulation, world, content };
      }),
      { signal: active.controller.signal },
    );
    if (session !== active) return;
    if (Exit.isFailure(started)) {
      const error = Cause.findError(started.cause);
      const disposal = dispose();
      const disposedGeneration = generation;
      await disposal;
      if (generation !== disposedGeneration) return;
      let message = "The game could not start. Try again.";
      if (Result.isSuccess(error)) message = error.success.message;
      publish({ ...empty, error: message });
      return;
    }
    active.simulation = started.value.simulation;
    publish({ ...empty, world: started.value.world, content: started.value.content });
  }
  function dispose(): Promise<void> {
    if (closing) return closing;
    const active = session;
    generation += 1;
    session = undefined;
    closing = Promise.resolve().then(async () => {
      try {
        await active?.runtime.dispose();
      } finally {
        closing = undefined;
        publish(empty);
      }
    });
    active?.controller.abort();
    publish({ ...empty, pending: true });
    return closing;
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    execute,
    start,
    dispose,
  };
}
export type Session = ReturnType<typeof createSession>;
