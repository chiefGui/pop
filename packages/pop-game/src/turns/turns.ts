import { Effect, Result } from "effect";
import type { Session, Checkpoint, Random } from "@pop/engine";
import { validateDecisions, InvalidNpcDecision } from "#game/ai";
import type { NpcPolicy, NpcDecision } from "#game/ai";
import type { DecisionObservation } from "#game/ai";
import type { Projects } from "#game/projects";
import type { WorldView } from "#game/world";

export function createTurns<State>(dependencies: {
  readonly session: Session["Service"];
  readonly checkpoint: Checkpoint<State>;
  readonly rewardRandom: Random;
  readonly policy: NpcPolicy["Service"];
  readonly projects: Pick<Projects, "prepare" | "advance">;
  readonly observeNpcs: () => DecisionObservation;
  readonly observe: (day: number) => WorldView;
}) {
  let day = 0;
  let lastDecisions: readonly NpcDecision[] = [];
  const advance = Effect.fn("Turns.advance")(function* () {
    return yield* dependencies.session.step({
      checkpoint: dependencies.checkpoint,
      prepare: Effect.gen(function* () {
        const observation = dependencies.observeNpcs();
        const proposed = yield* dependencies.policy.decide(observation);
        const decisions = yield* validateDecisions(observation, proposed);
        const plan = dependencies.projects.prepare(
          decisions.map((decision) => decision.action),
          day,
        );
        if (Result.isFailure(plan))
          return yield* new InvalidNpcDecision({ message: plan.failure.message });
        return { decisions, commit: plan.success };
      }),
      commit: ({ decisions, commit }) => {
        commit();
        day += 1;
        dependencies.projects.advance(day, dependencies.rewardRandom);
        lastDecisions = decisions;
        return dependencies.observe(day);
      },
    });
  });
  return {
    get day() {
      return day;
    },
    advance: advance(),
    getDecisions: () => structuredClone(lastDecisions),
  };
}
