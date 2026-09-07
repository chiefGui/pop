import { Cause, Effect, Exit, ManagedRuntime, Result } from "effect";
import { Simulation, simulationLayer } from "@pop/simulation";
import type {
  CharacterAction,
  Command,
  GameContent,
  ProjectId,
  Side,
  WorldView,
} from "@pop/simulation";

export interface GameSnapshot {
  readonly world: WorldView | null;
  readonly error: string | null;
  readonly message: string;
}

type SessionRuntime = ReturnType<typeof makeRuntime>;
function makeRuntime(content: GameContent, seed: number, playerName: string) {
  return ManagedRuntime.make(simulationLayer(content, { seed, playerName }));
}

// This is the imperative UI boundary. All game operations execute in the session's Effect runtime.
export function createGameClient(content: GameContent, seed: number) {
  let session: { runtime: SessionRuntime; simulation: Simulation["Service"] } | undefined;
  let snapshot: GameSnapshot = { world: null, error: null, message: "" };
  const listeners = new Set<() => void>();

  function publish(next: GameSnapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function send(command: Command, message: string) {
    if (!session) return;
    const result = session.runtime.runSync(Effect.result(session.simulation.dispatch(command)));
    if (Result.isFailure(result)) {
      publish({ ...snapshot, error: result.failure.message, message: "" });
      return;
    }
    const world = result.success;
    let feedback = message;
    if (command.type === "advance-day") {
      const resolved = world.projects.filter(
        (project) => project.status !== "active" && project.resolvedDay === world.day,
      );
      feedback = "";
      if (resolved.length === 1)
        feedback =
          "One project resolved. Its rewards have been distributed and influence returned.";
      if (resolved.length > 1)
        feedback = `${resolved.length} projects resolved. Their rewards have been distributed and influence returned.`;
    }
    publish({ world, error: null, message: feedback });
  }

  function actionError(action: CharacterAction) {
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
    commitmentError(projectId: ProjectId, side: Side, influence: number) {
      if (!snapshot.world) return "Create your character first.";
      return actionError({
        type: "commit",
        actorId: snapshot.world.playerId,
        projectId,
        side,
        influence,
      });
    },
    creationError(definitionId: string, influence: number) {
      if (!snapshot.world) return "Create your character first.";
      return actionError({
        type: "create-project",
        actorId: snapshot.world.playerId,
        definitionId,
        influence,
      });
    },
    start(name: string) {
      if (session) return;
      const runtime = makeRuntime(content, seed, name);
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
    commit(projectId: ProjectId, side: Side, influence: number) {
      if (!snapshot.world) return;
      send(
        { type: "commit", actorId: snapshot.world.playerId, projectId, side, influence },
        `${influence} influence committed. It returns when this project resolves.`,
      );
    },
    createProject(definitionId: string, influence: number) {
      if (!snapshot.world) return;
      send(
        { type: "create-project", actorId: snapshot.world.playerId, definitionId, influence },
        "Project started. Your founding influence is committed as support.",
      );
    },
    advanceDay() {
      if (!snapshot.world) return;
      send({ type: "advance-day" }, "");
    },
    dispose() {
      if (session) Effect.runSync(session.runtime.disposeEffect);
      session = undefined;
      snapshot = { world: null, error: null, message: "" };
      listeners.clear();
    },
  };
}

export type GameClient = ReturnType<typeof createGameClient>;
