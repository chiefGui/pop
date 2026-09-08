import { Schema } from "effect";
import type { CharacterId } from "#game/characters";
import type { ZoneId } from "#game/zones";
import type { Payout } from "#game/projects/rewards";

const NonnegativeInteger = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
);

export const ProjectId = Schema.TemplateLiteral(["project:", NonnegativeInteger]).check(
  Schema.isPattern(/^project:(0|[1-9]\d*)$/),
);
export type ProjectId = typeof ProjectId.Type;

export const Side = Schema.Literals(["support", "oppose"]);
export type Side = typeof Side.Type;
export const Outcome = Schema.Literals(["succeeded", "failed"]);
export type Outcome = typeof Outcome.Type;

export interface CommitmentView {
  readonly characterId: CharacterId;
  readonly side: Side;
  readonly influence: number;
  readonly influenceDays: number;
}

interface ProjectBase {
  readonly id: ProjectId;
  readonly definitionId: string;
  readonly zoneId: ZoneId;
  readonly creatorId: CharacterId;
  readonly startedDay: number;
  readonly deadlineDay: number;
  readonly progress: number;
  readonly support: number;
  readonly opposition: number;
  readonly commitments: readonly CommitmentView[];
}

export interface ActiveProjectView extends ProjectBase {
  readonly status: "active";
}

export interface ResolvedProjectView extends ProjectBase {
  readonly status: Outcome;
  readonly resolvedDay: number;
  readonly payouts: readonly Payout[];
}

export type ProjectView = ActiveProjectView | ResolvedProjectView;
