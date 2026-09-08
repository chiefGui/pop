import { Schema } from "effect";
import { CharacterId } from "#game/characters";
import { ProjectId, Side } from "#game/projects/project";
import { ProjectDefinitionId } from "#game/projects/definition";

const NonnegativeInteger = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
);

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
  definitionId: ProjectDefinitionId,
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
