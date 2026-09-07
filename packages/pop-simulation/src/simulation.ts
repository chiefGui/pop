import { Cause, Context, Effect, Exit, Layer, Schema, Semaphore } from "effect";
import { CharacterAction, Command, CommitAction } from "./contracts";
import type { WorldView } from "./contracts";
import { ContentCatalog, SessionConfig } from "./internal/config";
import { createEcsStore } from "./internal/ecs-store";
import { InvalidCommand, InvalidContent, InvalidNpcDecision, SessionClosed } from "./errors";
import type { ActionRejected, CommandError } from "./errors";
import { NpcPolicy } from "./internal/npc-policy";
import { SimulationRandom, pick } from "./internal/random";

const decodeCommand = Schema.decodeUnknownEffect(Command);
const decodeAction = Schema.decodeUnknownEffect(CharacterAction);
const decodeNpcActions = Schema.decodeUnknownEffect(Schema.Array(CommitAction));

export class Simulation extends Context.Service<
  Simulation,
  {
    readonly getView: Effect.Effect<WorldView, SessionClosed>;
    readonly checkAction: (
      input: unknown,
    ) => Effect.Effect<void, InvalidCommand | ActionRejected | SessionClosed>;
    readonly dispatch: (input: unknown) => Effect.Effect<WorldView, CommandError>;
  }
>()("@pop/simulation/Simulation") {
  static readonly layer = Layer.effect(
    Simulation,
    Effect.gen(function* () {
      const content = yield* ContentCatalog;
      const options = yield* SessionConfig;
      const random = yield* SimulationRandom;
      const policy = yield* NpcPolicy;
      const gate = yield* Semaphore.make(1);
      let closed = false;
      const store = yield* Effect.acquireRelease(
        Effect.sync(() => createEcsStore(content, options, random)),
        (store) =>
          gate.withPermit(
            Effect.sync(() => {
              closed = true;
              store.dispose();
            }),
          ),
      );

      // Initialization uses the same action rules; partial setup is scoped and discarded on failure.
      for (const definitionId of content.world.initialProjects) {
        const eligible = store.eligibleFounders(definitionId);
        if (eligible.length === 0)
          return yield* new InvalidContent({
            message: `No eligible founder for initial project: ${definitionId}.`,
          });
        const action: CharacterAction = {
          type: "create-project",
          actorId: pick(random.world, eligible),
          definitionId,
          influence: 1,
        };
        const rejection = store.checkAction(action);
        if (rejection) return yield* new InvalidContent({ message: rejection.message });
        store.applyAction(action);
      }

      const ensureOpen = Effect.suspend(() => {
        if (closed)
          return Effect.fail(new SessionClosed({ message: "This simulation session is closed." }));
        return Effect.void;
      });

      const getView = gate
        .withPermit(
          Effect.gen(function* () {
            yield* ensureOpen;
            return store.getView();
          }),
        )
        .pipe(Effect.withSpan("Simulation.getView"));

      const checkAction = Effect.fn("Simulation.checkAction")(function* (input: unknown) {
        yield* ensureOpen;
        const action = yield* decodeAction(input).pipe(
          Effect.mapError((error) => new InvalidCommand({ message: error.message })),
        );
        const rejection = store.checkAction(action);
        if (rejection) return yield* rejection;
      }, gate.withPermit);

      const advance = Effect.fn("Simulation.advanceDay")(function* () {
        const checkpoint = random.capture();
        let committed = false;
        yield* Effect.gen(function* () {
          const proposed = yield* policy.decide(store.observeDecisions());
          const actions = yield* decodeNpcActions(proposed).pipe(
            Effect.mapError((error) => new InvalidNpcDecision({ message: error.message })),
          );
          const actors = new Set<string>();
          // One action per NPC makes validation of the entire batch independent of application order.
          for (const action of actions) {
            if (action.actorId === store.playerId || actors.has(action.actorId)) {
              return yield* new InvalidNpcDecision({
                message:
                  "An NPC policy must return at most one commitment per NPC and cannot control the player.",
              });
            }
            actors.add(action.actorId);
            const rejection = store.checkAction(action);
            if (rejection) return yield* new InvalidNpcDecision({ message: rejection.message });
          }
          // No asynchronous work, effects per entity, or interruption inside the commit phase.
          yield* Effect.sync(() => {
            for (const action of actions) store.applyAction(action);
            store.advanceProjects(random.rewards);
            committed = true;
          }).pipe(Effect.uninterruptible);
        }).pipe(
          Effect.onExit((exit) =>
            Effect.sync(() => {
              if (Exit.isFailure(exit) && !committed) random.restore(checkpoint);
            }),
          ),
        );
      });

      const dispatch = Effect.fn("Simulation.dispatch")(
        function* (input: unknown) {
          yield* ensureOpen;
          const command = yield* decodeCommand(input).pipe(
            Effect.mapError((error) => new InvalidCommand({ message: error.message })),
          );
          if (command.type === "advance-day") {
            yield* advance();
          } else {
            const rejection = store.checkAction(command);
            if (rejection) return yield* rejection;
            yield* Effect.sync(() => store.applyAction(command)).pipe(Effect.uninterruptible);
          }
          return store.getView();
        },
        (effect) =>
          gate.withPermit(
            effect.pipe(
              Effect.onExit((exit) =>
                Effect.sync(() => {
                  // A defect may indicate a partially applied write. Never continue that session as if it succeeded.
                  if (Exit.isFailure(exit) && Cause.hasDies(exit.cause)) closed = true;
                }),
              ),
            ),
          ),
      );

      return Simulation.of({ getView, checkAction, dispatch });
    }),
  );
}

// Construct these layers once per session so policy and simulation share the same random streams.
export function simulationLayer(content: unknown, options: unknown, policy = NpcPolicy.layer) {
  const config = Layer.merge(ContentCatalog.layer(content), SessionConfig.layer(options));
  const random = SimulationRandom.layer.pipe(Layer.provide(config));
  const dependencies = Layer.merge(config, random);
  const decisions = policy.pipe(Layer.provide(dependencies));
  return Simulation.layer.pipe(Layer.provide(Layer.merge(dependencies, decisions)));
}
