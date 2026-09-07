import type { CharacterId, ZoneId } from "../../model";
import type { ProjectId, Side } from "./model";

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
