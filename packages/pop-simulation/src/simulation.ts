import { Cause, Context, Effect, Exit, Layer, Schema, Semaphore } from "effect";
import { ProjectAction, Command, CommitAction } from "./contracts";
import type { WorldView, CommandResult, CharacterView } from "./contracts";
import { ContentCatalog, SessionConfig } from "./config";
import { createWorldState } from "./kernel/world";
import { populateWorld } from "./features/world-generation/generate";
import { createProjects } from "./features/projects/projects";
import { InvalidCommand, InvalidSessionOptions, InvalidNpcDecision, SessionClosed } from "./errors";
import type { ActionRejected, CommandError } from "./errors";
import { NpcPolicy } from "./features/ai/npc-policy";
import { SimulationRandom } from "./random";
import { pick } from "./kernel/random";

const decodeCommand = Schema.decodeUnknownEffect(Command);
const decodeAction = Schema.decodeUnknownEffect(ProjectAction);
const decodeNpcActions = Schema.decodeUnknownEffect(Schema.Array(CommitAction));

export class Simulation extends Context.Service<
  Simulation,
  {
    readonly getView: Effect.Effect<WorldView, SessionClosed>;
    readonly checkAction: (
      input: unknown,
    ) => Effect.Effect<void, InvalidCommand | ActionRejected | SessionClosed>;
    readonly dispatch: (input: unknown) => Effect.Effect<CommandResult, CommandError>;
  }
>()("@pop/simulation/Simulation") {
  static readonly layer = Layer.effect(
    Simulation,
    Effect.gen(function* () {
      const content = yield* ContentCatalog;
      const options = yield* SessionConfig;
      const definitionIds = new Set(content.projects.map((project) => project.id));
      for (const id of options.initialProjects) {
        if (!definitionIds.has(id))
          return yield* new InvalidSessionOptions({
            message: `Unknown initial project type: ${id}.`,
          });
      }
      const random = yield* SimulationRandom;
      const policy = yield* NpcPolicy;
      const gate = yield* Semaphore.make(1);
      let closed = false;
      const world = yield* Effect.acquireRelease(
        Effect.sync(() => createWorldState(content.world.zone)),
        (world) =>
          gate.withPermit(
            Effect.sync(() => {
              closed = true;
              world.dispose();
            }),
          ),
      );

      const playerId = populateWorld(world, content.world, options, random.world, random.names);
      const projects = yield* Effect.acquireRelease(
        Effect.sync(() => createProjects(world, content.projects)),
        (projects) =>
          gate.withPermit(
            Effect.sync(() => {
              closed = true;
              projects.dispose();
            }),
          ),
      );
      function observe(): WorldView {
        const characters: CharacterView[] = [];
        for (const character of world.characters()) {
          characters.push({
            ...character,
            availableInfluence: projects.availableInfluence(character),
            isPlayer: character.id === playerId,
          });
        }
        return {
          day: world.day,
          playerId,
          zone: { ...world.getZone() },
          characters,
          projects: projects.getView(),
        };
      }

      // Initialization uses the same action rules; partial setup is scoped and discarded on failure.
      for (const definitionId of options.initialProjects) {
        const eligible = projects.eligibleFounders(definitionId, playerId);
        if (eligible.length === 0)
          return yield* new InvalidSessionOptions({
            message: `No eligible founder for initial project: ${definitionId}.`,
          });
        const action: ProjectAction = {
          type: "create-project",
          actorId: pick(random.world, eligible),
          definitionId,
          influence: 1,
        };
        const rejection = projects.checkAction(action);
        if (rejection) return yield* new InvalidSessionOptions({ message: rejection.message });
        projects.applyAction(action);
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
            return observe();
          }),
        )
        .pipe(Effect.withSpan("Simulation.getView"));

      const checkAction = Effect.fn("Simulation.checkAction")(function* (input: unknown) {
        yield* ensureOpen;
        const action = yield* decodeAction(input).pipe(
          Effect.mapError((error) => new InvalidCommand({ message: error.message })),
        );
        const rejection = projects.checkAction(action);
        if (rejection) return yield* rejection;
      }, gate.withPermit);

      const advance = Effect.fn("Simulation.advanceDay")(function* () {
        const checkpoint = random.capture();
        let committed = false;
        yield* Effect.gen(function* () {
          const proposed = yield* policy.decide(projects.observeDecisions(playerId));
          const actions = yield* decodeNpcActions(proposed).pipe(
            Effect.mapError((error) => new InvalidNpcDecision({ message: error.message })),
          );
          const actors = new Set<string>();
          // One action per NPC makes validation of the entire batch independent of application order.
          for (const action of actions) {
            if (action.actorId === playerId || actors.has(action.actorId)) {
              return yield* new InvalidNpcDecision({
                message:
                  "An NPC policy must return at most one commitment per NPC and cannot control the player.",
              });
            }
            actors.add(action.actorId);
            const rejection = projects.checkAction(action);
            if (rejection) return yield* new InvalidNpcDecision({ message: rejection.message });
          }
          // No asynchronous work, effects per entity, or interruption inside the commit phase.
          yield* Effect.sync(() => {
            for (const action of actions) projects.applyAction(action);
            world.advanceDay();
            projects.advance(random.rewards);
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
            return { type: command.type, world: observe() };
          } else {
            const rejection = projects.checkAction(command);
            if (rejection) return yield* rejection;
            const projectId = yield* Effect.sync(() => projects.applyAction(command)).pipe(
              Effect.uninterruptible,
            );
            return { type: command.type, projectId, world: observe() };
          }
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
