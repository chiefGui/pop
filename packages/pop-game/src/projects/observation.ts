import type { CharacterId } from "#game/characters";
import type { ProjectId, Side } from "#game/projects/project";

export interface ProjectOpportunity {
  readonly id: ProjectId;
  readonly sides: ReadonlyMap<CharacterId, Side>;
}
