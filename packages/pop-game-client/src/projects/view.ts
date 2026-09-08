import type {
  CharacterView,
  CommitmentView,
  ProjectDefinition,
  ProjectId,
  ProjectView,
  WorldView,
} from "@pop/game";

export interface ProjectDetails {
  readonly project: ProjectView;
  readonly definition: ProjectDefinition;
  readonly creator: CharacterView;
  readonly participants: readonly {
    readonly character: CharacterView;
    readonly commitment: CommitmentView;
  }[];
  readonly ownCommitment: CommitmentView | undefined;
  readonly ownShare: number | undefined;
}

export interface ProjectBoard {
  readonly player: CharacterView;
  readonly active: readonly ProjectDetails[];
  readonly resolved: readonly ProjectDetails[];
  readonly byId: ReadonlyMap<ProjectId, ProjectDetails>;
}

export function projectBoard(
  world: WorldView,
  authored: readonly ProjectDefinition[],
): ProjectBoard {
  const definitions = new Map(authored.map((definition) => [definition.id, definition]));
  const people = new Map(world.characters.map((character) => [character.id, character]));
  const active: ProjectDetails[] = [];
  const resolved: ProjectDetails[] = [];
  const byId = new Map<ProjectId, ProjectDetails>();
  for (const project of world.projects) {
    const ownCommitment = project.commitments.find((entry) => entry.characterId === world.playerId);
    let ownShare: number | undefined;
    if (ownCommitment) {
      let sideWeight = 0;
      for (const entry of project.commitments) {
        if (entry.side === ownCommitment.side) sideWeight += entry.influenceDays;
      }
      if (sideWeight > 0) ownShare = ownCommitment.influenceDays / sideWeight;
    }
    const details: ProjectDetails = {
      project,
      definition: definitions.get(project.definitionId)!,
      creator: people.get(project.creatorId)!,
      participants: project.commitments.map((commitment) => ({
        character: people.get(commitment.characterId)!,
        commitment,
      })),
      ownCommitment,
      ownShare,
    };
    byId.set(project.id, details);
    if (project.status === "active") active.push(details);
    else resolved.push(details);
  }
  resolved.reverse();
  return { player: people.get(world.playerId)!, active, resolved, byId };
}
