export {
  ActionRejected,
  ProjectAction,
  CommitAction,
  CreateProjectAction,
} from "#game/projects/actions";
export { ProjectDefinition, ProjectDefinitionId } from "#game/projects/definition";
export { ProjectId, Side, Outcome } from "#game/projects/project";
export type {
  ActiveProjectView,
  ResolvedProjectView,
  ProjectView,
  CommitmentView,
} from "#game/projects/project";
export { Rewards } from "#game/projects/rewards";
export type { OutcomeRewards, Payout } from "#game/projects/rewards";
export type { ProjectOpportunity } from "#game/projects/observation";
export { createProjects } from "#game/projects/projects";
export type { Projects } from "#game/projects/projects";
export { checkProjectAction } from "#game/projects/rules";
