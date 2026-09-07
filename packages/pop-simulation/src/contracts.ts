import { Schema } from "effect";

const NonnegativeInteger = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
);
const AuthoredAmount = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1_000_000 }));
const Name = Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(100));
const DefinitionId = Schema.NonEmptyString.check(Schema.isTrimmed());
const GenerationAmount = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1000 }));
const GenerationRange = Schema.Tuple([GenerationAmount, GenerationAmount]).check(
  Schema.makeFilter((range) => {
    if (range[0] > range[1]) return "Generation ranges must have minimum <= maximum.";
  }),
);
const Probability = Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 }));

export const CharacterId = Schema.TemplateLiteral(["character:", NonnegativeInteger]).check(
  Schema.isPattern(/^character:(0|[1-9]\d*)$/),
);
export type CharacterId = typeof CharacterId.Type;
export const ProjectId = Schema.TemplateLiteral(["project:", NonnegativeInteger]).check(
  Schema.isPattern(/^project:(0|[1-9]\d*)$/),
);
export type ProjectId = typeof ProjectId.Type;
export const ZoneId = Schema.TemplateLiteral(["zone:", Schema.NonEmptyString]).check(
  Schema.isMinLength(6),
);
export type ZoneId = typeof ZoneId.Type;
export const Side = Schema.Literals(["support", "oppose"]);
export type Side = typeof Side.Type;
export const Outcome = Schema.Literals(["succeeded", "failed"]);
export type Outcome = typeof Outcome.Type;

export const Rewards = Schema.Struct({ reputation: AuthoredAmount, popularity: AuthoredAmount });
export type Rewards = typeof Rewards.Type;
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
export const WorldDefinition = Schema.Struct({
  zone: Schema.Struct({ id: ZoneId, name: Name, description: Schema.String }),
  npcCount: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10_000 })),
  firstNames: Schema.Array(Name).check(Schema.isMinLength(1)),
  lastNames: Schema.Array(Name).check(Schema.isMinLength(1)),
  npcReputation: GenerationRange,
  npcPopularity: GenerationRange,
  npcInfluence: GenerationRange,
  npcParticipationChance: Probability,
  npcSupportChance: Probability,
  initialProjects: Schema.Array(DefinitionId),
});
export type WorldDefinition = typeof WorldDefinition.Type;
export const GameContent = Schema.Struct({
  projects: Schema.Array(ProjectDefinition),
  world: WorldDefinition,
}).check(
  Schema.makeFilter((content) => {
    const ids = new Set(content.projects.map((project) => project.id));
    if (ids.size !== content.projects.length) return "Project definition IDs must be unique.";
    const initial = new Set<string>();
    for (const id of content.world.initialProjects) {
      if (!ids.has(id) || initial.has(id))
        return "Initial projects must refer to distinct authored project types.";
      initial.add(id);
    }
  }),
);
export type GameContent = typeof GameContent.Type;

export const SessionOptions = Schema.Struct({
  seed: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 0xffffffff })),
  playerName: Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(40)),
});
export type SessionOptions = typeof SessionOptions.Type;

export interface CharacterView {
  readonly id: CharacterId;
  readonly name: string;
  readonly zoneId: ZoneId;
  readonly reputation: number;
  readonly popularity: number;
  readonly influence: number;
  readonly availableInfluence: number;
  readonly isPlayer: boolean;
}

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

export interface WorldView {
  readonly day: number;
  readonly playerId: CharacterId;
  readonly zone: WorldDefinition["zone"];
  readonly characters: readonly CharacterView[];
  readonly projects: readonly ProjectView[];
}

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
export const CharacterAction = Schema.Union([CommitAction, CreateProjectAction]);
export type CharacterAction = typeof CharacterAction.Type;
export const Command = Schema.Union([
  CharacterAction,
  Schema.Struct({ type: Schema.Literal("advance-day") }),
]);
export type Command = typeof Command.Type;
