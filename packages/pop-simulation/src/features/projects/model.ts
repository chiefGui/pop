import { Schema } from "effect";
import { CharacterId, ZoneId, NonnegativeInteger, Name, DefinitionId, Rewards } from "../../model";

export const ProjectId = Schema.TemplateLiteral(["project:", NonnegativeInteger]).check(
  Schema.isPattern(/^project:(0|[1-9]\d*)$/),
);
export type ProjectId = typeof ProjectId.Type;

export const Side = Schema.Literals(["support", "oppose"]);
export type Side = typeof Side.Type;
export const Outcome = Schema.Literals(["succeeded", "failed"]);
export type Outcome = typeof Outcome.Type;

export const OutcomeRewards = Schema.Struct({
  support: Rewards,
  oppose: Rewards,
  creator: Rewards,
});
export type OutcomeRewards = typeof OutcomeRewards.Type;
export const ProjectDefinition = Schema.Struct({
  id: DefinitionId,
  name: Name,
  description: Schema.String,
  durationDays: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 3650 })),
  progressTarget: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 1_000_000 })),
  requirements: Rewards,
  rewards: Schema.Struct({ succeeded: OutcomeRewards, failed: OutcomeRewards }),
});
export type ProjectDefinition = typeof ProjectDefinition.Type;

export interface CommitmentView {
  readonly characterId: CharacterId;
  readonly side: Side;
  readonly influence: number;
  readonly influenceDays: number;
}

export interface Payout {
  readonly characterId: CharacterId;
  readonly participation: Rewards;
  readonly creator: Rewards;
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

const CommittedInfluence = NonnegativeInteger.check(Schema.isGreaterThan(0));
export const CommitAction = Schema.Struct({
  type: Schema.Literal("commit"),
  actorId: CharacterId,
  projectId: ProjectId,
  side: Side,
  influence: CommittedInfluence,
});
export type CommitAction = typeof CommitAction.Type;
export const CreateProjectAction = Schema.Struct({
  type: Schema.Literal("create-project"),
  actorId: CharacterId,
  definitionId: DefinitionId,
  influence: CommittedInfluence,
});

export type CreateProjectAction = typeof CreateProjectAction.Type;
export const ProjectAction = Schema.Union([CommitAction, CreateProjectAction]);
export type ProjectAction = typeof ProjectAction.Type;

export class ActionRejected extends Schema.TaggedError<ActionRejected>()("ActionRejected", {
  reason: Schema.Literals([
    "CharacterMissing",
    "InsufficientInfluence",
    "DefinitionMissing",
    "RequirementsUnmet",
    "ProjectAlreadyActive",
    "ProjectInactive",
    "WrongZone",
    "SideLocked",
  ]),
  message: Schema.String,
}) {}
