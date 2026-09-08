import type { DecisionObservation } from "#game/ai/observation";
import type { ProjectOpportunity } from "#game/projects";
export interface NpcContext {
  readonly character: DecisionObservation["characters"][number];
  readonly projects: readonly ProjectOpportunity[];
}
