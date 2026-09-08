import type { Characters } from "#game/characters";
import type { CharacterId } from "#game/characters";
import type { ZoneId } from "#game/zones";
import type { Projects } from "#game/projects";
import type { ProjectOpportunity } from "#game/projects";

export interface DecisionObservation {
  readonly characters: readonly {
    readonly id: CharacterId;
    readonly zoneId: ZoneId;
    readonly availableInfluence: number;
  }[];
  readonly projectsByZone: ReadonlyMap<ZoneId, readonly ProjectOpportunity[]>;
}

export function observeDecisions(
  characters: Pick<Characters, "all">,
  projects: Pick<Projects, "availableInfluence" | "opportunities">,
  playerId: CharacterId,
): DecisionObservation {
  return {
    characters: [...characters.all()]
      .filter((character) => character.id !== playerId)
      .map((character) => ({
        id: character.id,
        zoneId: character.zoneId,
        availableInfluence: projects.availableInfluence(character),
      })),
    projectsByZone: projects.opportunities(),
  };
}
