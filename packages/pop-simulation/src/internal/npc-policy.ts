import { Context, Effect, Layer } from "effect";
import type { CharacterId, CommitAction, ProjectId, Side, ZoneId } from "../contracts";
import { ContentCatalog } from "./config";
import { SimulationRandom, pick } from "./random";

export interface DecisionObservation {
  readonly characters: readonly {
    readonly id: CharacterId;
    readonly zoneId: ZoneId;
    readonly availableInfluence: number;
  }[];
  readonly projectsByZone: ReadonlyMap<
    ZoneId,
    readonly {
      readonly id: ProjectId;
      readonly sides: ReadonlyMap<CharacterId, Side>;
    }[]
  >;
}

export class NpcPolicy extends Context.Service<
  NpcPolicy,
  {
    readonly decide: (observation: DecisionObservation) => Effect.Effect<readonly CommitAction[]>;
  }
>()("@pop/simulation/NpcPolicy") {
  static readonly layer = Layer.effect(
    NpcPolicy,
    Effect.gen(function* () {
      const { world: config } = yield* ContentCatalog;
      const { decisions } = yield* SimulationRandom;
      const decide = Effect.fn("NpcPolicy.decide")((observation: DecisionObservation) =>
        Effect.sync(() => {
          const actions: CommitAction[] = [];
          for (const character of observation.characters) {
            if (character.availableInfluence < 1) continue;
            const projects = observation.projectsByZone.get(character.zoneId);
            if (!projects?.length || decisions() >= config.npcParticipationChance) continue;
            const project = pick(decisions, projects);
            let side: Side = "oppose";
            if (decisions() < config.npcSupportChance) side = "support";
            const existing = project.sides.get(character.id);
            if (existing !== undefined) side = existing;
            actions.push({
              type: "commit",
              actorId: character.id,
              projectId: project.id,
              side,
              influence: 1,
            });
          }
          return actions;
        }),
      );
      return NpcPolicy.of({ decide });
    }),
  );
}
