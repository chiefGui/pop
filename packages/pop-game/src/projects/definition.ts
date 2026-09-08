import { Schema } from "effect";
import { Rewards, OutcomeRewards } from "#game/projects/rewards";

const Name = Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(100));
export const ProjectDefinitionId = Schema.NonEmptyString.check(Schema.isTrimmed());

export const ProjectDefinition = Schema.Struct({
  id: ProjectDefinitionId,
  name: Name,
  description: Schema.String,
  durationDays: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 3650 })),
  progressTarget: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 1_000_000 })),
  requirements: Rewards,
  rewards: Schema.Struct({ succeeded: OutcomeRewards, failed: OutcomeRewards }),
});
export type ProjectDefinition = typeof ProjectDefinition.Type;
