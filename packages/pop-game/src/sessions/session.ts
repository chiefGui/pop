import { Context, Effect, Layer, Result, Schema, Scope } from "effect";
import { Session } from "@pop/engine";
import type { InvalidBehaviors, SessionError } from "@pop/engine";
import { ProjectAction, createProjects } from "#game/projects";
import { populateCharacters } from "#game/characters";
import { NpcPolicy, observeDecisions } from "#game/ai";
import type { NpcDecision } from "#game/ai";
import { createTurns } from "#game/turns";
import { Command } from "#game/sessions/dispatch";
import type { CommandResult } from "#game/sessions/dispatch";
import { ContentCatalog } from "#game/catalog";
import { SessionConfig } from "#game/sessions/settings";
import type { GameContent } from "#game/catalog";
import { createWorldState } from "#game/world";
import type { WorldView } from "#game/world";
import { InvalidCommand } from "#game/sessions/dispatch";
import { InvalidSessionOptions } from "#game/sessions/settings";
import type { CommandError } from "#game/sessions/dispatch";
import type { ActionRejected } from "#game/projects";
import { SimulationRandom } from "#game/random";

const decodeCommand = Schema.decodeUnknownEffect(Command);
const decodeAction = Schema.decodeUnknownEffect(ProjectAction);
export class Simulation extends Context.Service<
  Simulation,
  {
    readonly getView: Effect.Effect<WorldView, SessionError>;
    readonly getContent: Effect.Effect<GameContent, SessionError>;
    readonly getDecisions: Effect.Effect<readonly NpcDecision[], SessionError>;
    readonly checkAction: (
      input: unknown,
    ) => Effect.Effect<void, InvalidCommand | ActionRejected | SessionError>;
    readonly dispatch: (input: unknown) => Effect.Effect<CommandResult, CommandError>;
  }
>()("@pop/game/Simulation") {
  static readonly layer = Layer.effect(
    Simulation,
    Effect.gen(function* () {
      const content = yield* ContentCatalog;
      const options = yield* SessionConfig;
      const random = yield* SimulationRandom;
      const policy = yield* NpcPolicy;
      const session = yield* Session;
      const world = yield* Effect.acquireRelease(
        Effect.sync(() => createWorldState(content.world.zone)),
        (world) => Effect.sync(() => world.dispose()),
      ).pipe(Effect.provideService(Scope.Scope, session.scope));
      const playerId = populateCharacters(
        world.characters,
        content.world,
        world.zoneId,
        options,
        random.world,
        random.names,
      );
      const projects = yield* Effect.acquireRelease(
        Effect.sync(() => createProjects(world, content.projects)),
        (projects) => Effect.sync(() => projects.dispose()),
      ).pipe(Effect.provideService(Scope.Scope, session.scope));
      const initial = projects.initialize(options.initialProjects, playerId, random.world);
      if (Result.isFailure(initial))
        return yield* new InvalidSessionOptions({ message: initial.failure.message });
      const observe = (day: number) => world.observe(day, playerId, projects);
      const turns = createTurns({
        session,
        checkpoint: random,
        rewardRandom: random.rewards,
        policy,
        projects,
        observeNpcs: () => observeDecisions(world.characters, projects, playerId),
        observe,
      });
      const getView = session.run(Effect.sync(() => observe(turns.day)));
      const getContent = session.run(Effect.sync(() => structuredClone(content)));
      const getDecisions = session.run(Effect.sync(turns.getDecisions));
      const checkAction = Effect.fn("Simulation.checkAction")(function* (input: unknown) {
        const action = yield* decodeAction(input).pipe(
          Effect.mapError((error) => new InvalidCommand({ message: error.message })),
        );
        const rejection = projects.checkAction(action);
        if (rejection) return yield* rejection;
      }, session.run);
      const dispatch = Effect.fn("Simulation.dispatch")(function* (
        input: unknown,
      ): Effect.fn.Return<CommandResult, CommandError> {
        const command = yield* decodeCommand(input).pipe(
          Effect.mapError((error) => new InvalidCommand({ message: error.message })),
        );
        if (command.type === "advance-day") {
          const world = yield* turns.advance;
          return { type: command.type, world };
        }
        return yield* session.run(
          Effect.gen(function* () {
            const plan = projects.prepare([command], turns.day);
            if (Result.isFailure(plan)) return yield* plan.failure;
            const projectId = yield* Effect.sync(() => plan.success()[0]!).pipe(
              Effect.uninterruptible,
            );
            return { type: command.type, projectId, world: observe(turns.day) };
          }),
        );
      });
      return Simulation.of({ getView, getContent, getDecisions, checkAction, dispatch });
    }),
  );
}

export function simulationLayer<E = never>(
  content: unknown,
  options: unknown,
  policy?: Layer.Layer<NpcPolicy, E, SimulationRandom>,
) {
  const config = Layer.merge(ContentCatalog.layer(content), SessionConfig.layer(options));
  const random = Layer.unwrap(
    Effect.map(SessionConfig, (options) => SimulationRandom.layer(options.seed)),
  ).pipe(Layer.provide(config));
  const dependencies = Layer.merge(config, random);
  const selectedPolicy = Layer.unwrap(
    Effect.gen(function* (): Effect.fn.Return<
      Layer.Layer<NpcPolicy, E | InvalidBehaviors, SimulationRandom>,
      never,
      SessionConfig | SimulationRandom
    > {
      if (policy) return policy;
      const settings = yield* SessionConfig;
      const random = yield* SimulationRandom;
      return NpcPolicy.layer(settings.ai, random.decisions);
    }),
  );
  const decisions = selectedPolicy.pipe(Layer.provide(dependencies));
  return Simulation.layer.pipe(
    Layer.provide(Layer.mergeAll(dependencies, decisions, Session.layer)),
  );
}
