import type { Character } from "#game/characters";
import type { ZoneId } from "#game/zones";
import type { ProjectDefinition } from "#game/projects/definition";
import type { Side } from "#game/projects/project";
import { ActionRejected } from "#game/projects/actions";
import type { ProjectAction } from "#game/projects/actions";

export interface ProjectActionFacts {
  readonly character: (Character & { readonly availableInfluence: number }) | undefined;
  readonly definition?: ProjectDefinition;
  readonly activeType?: boolean;
  readonly project?: { readonly zoneId: ZoneId };
  readonly committedSide?: Side;
}

export function meetsRequirements(character: Character, definition: ProjectDefinition) {
  return (
    character.reputation >= definition.requirements.reputation &&
    character.popularity >= definition.requirements.popularity
  );
}

export function checkProjectAction(
  action: ProjectAction,
  facts: ProjectActionFacts,
): ActionRejected | undefined {
  const character = facts.character;
  if (!character)
    return new ActionRejected({ reason: "CharacterMissing", message: "Character not found." });
  if (character.availableInfluence < action.influence)
    return new ActionRejected({
      reason: "InsufficientInfluence",
      message:
        "Not enough available influence. Existing commitments return when their projects resolve.",
    });
  if (action.type === "create-project") {
    const definition = facts.definition;
    if (!definition)
      return new ActionRejected({
        reason: "DefinitionMissing",
        message: "Project type not found.",
      });
    if (!meetsRequirements(character, definition)) {
      return new ActionRejected({
        reason: "RequirementsUnmet",
        message: "You do not yet meet this project's reputation and popularity requirements.",
      });
    }
    if (facts.activeType)
      return new ActionRejected({
        reason: "ProjectAlreadyActive",
        message: "This project is already active in your zone.",
      });
    return;
  }
  const project = facts.project;
  if (!project)
    return new ActionRejected({
      reason: "ProjectInactive",
      message: "This project is no longer active.",
    });
  if (project.zoneId !== character.zoneId)
    return new ActionRejected({
      reason: "WrongZone",
      message: "You can only join projects in your zone.",
    });
  const existing = facts.committedSide;
  if (existing !== undefined && existing !== action.side)
    return new ActionRejected({
      reason: "SideLocked",
      message: "Your side is fixed until this project resolves.",
    });
}
