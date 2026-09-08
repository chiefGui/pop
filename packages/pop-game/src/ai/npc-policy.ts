import { Context, Effect, Layer, Schema } from "effect";
import { firstProposal, makeDecisionSystem } from "@pop/engine";
import type { Random } from "@pop/engine";
import { ProjectAction } from "#game/projects";
import { CharacterId } from "#game/characters";
import type { DecisionObservation } from "#game/ai/observation";
import type { NpcContext } from "#game/ai/context";
import type { NpcSettings } from "#game/ai/settings";
import { randomParticipation } from "#game/ai/behaviors/random-participation";

export class InvalidNpcDecision extends Schema.TaggedError<InvalidNpcDecision>()(
  "InvalidNpcDecision",
  { message: Schema.String },
) {}
export const NpcDecision = Schema.Struct({ actorId: CharacterId, action: ProjectAction });
export type NpcDecision = typeof NpcDecision.Type;
const decode = Schema.decodeUnknownEffect(Schema.Array(NpcDecision));
export const validateDecisions = Effect.fn("NpcPolicy.validate")(function* (
  observation: DecisionObservation,
  proposed: unknown,
) {
  const decisions = yield* decode(proposed).pipe(
    Effect.mapError((error) => new InvalidNpcDecision({ message: error.message })),
  );
  const allowed = new Set(observation.characters.map((character) => character.id));
  const selected = new Set<CharacterId>();
  for (const decision of decisions) {
    if (
      !allowed.has(decision.actorId) ||
      selected.has(decision.actorId) ||
      decision.actorId !== decision.action.actorId
    )
      return yield* new InvalidNpcDecision({
        message:
          "Each NPC may submit one action for itself, and cannot control the player or another character.",
      });
    selected.add(decision.actorId);
  }
  return decisions;
});
export class NpcPolicy extends Context.Service<
  NpcPolicy,
  {
    readonly decide: (observation: DecisionObservation) => Effect.Effect<readonly NpcDecision[]>;
  }
>()("@pop/game/NpcPolicy") {
  static layer(settings: NpcSettings, random: Random) {
    return Layer.effect(
      NpcPolicy,
      Effect.gen(function* () {
        const system = yield* makeDecisionSystem<NpcContext, ProjectAction>({
          behaviors: [randomParticipation(settings, random)],
          select: firstProposal,
        });
        const decide = Effect.fn("NpcPolicy.decide")(function* (observation: DecisionObservation) {
          const batch = yield* system.decide(
            observation.characters.map((character) => ({
              character,
              projects: observation.projectsByZone.get(character.zoneId) ?? [],
            })),
          );
          const decisions: NpcDecision[] = [];
          for (const decision of batch.decisions) {
            if (decision.selected)
              decisions.push({
                actorId: decision.context.character.id,
                action: decision.selected.action,
              });
          }
          return decisions;
        });
        return NpcPolicy.of({ decide });
      }),
    );
  }
}
