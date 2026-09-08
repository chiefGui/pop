import { checkProjectAction, meetsRequirements } from "#game/projects/rules";
import { Result } from "effect";
import { pick } from "@pop/engine";
import type { World } from "bitecs";
import type { Characters } from "#game/characters";
import { addComponent, addEntity, query, removeEntity } from "bitecs";
import type {
  ActiveProjectView,
  CommitmentView,
  Outcome,
  ProjectId,
  ResolvedProjectView,
  Side,
} from "#game/projects/project";
import type { ProjectAction } from "#game/projects/actions";
import type { ProjectDefinition } from "#game/projects/definition";
import type { Character, CharacterId } from "#game/characters";
import type { ZoneId } from "#game/zones";
import type { Random } from "@pop/engine";
import { ActionRejected } from "#game/projects/actions";
import { distributeRewards } from "#game/projects/rewards";

interface Project {
  id: ProjectId;
  definitionId: string;
  zoneId: ZoneId;
  creatorId: CharacterId;
  startedDay: number;
  deadlineDay: number;
  progress: number;
}

interface Commitment {
  characterId: CharacterId;
  projectId: ProjectId;
  side: Side;
  influence: number;
  influenceDays: number;
}

const HISTORY_LIMIT = 40;

export function createProjects(
  state: {
    readonly ecs: World;
    readonly characters: Pick<Characters, "get" | "all" | "grantStanding">;
  },
  authored: readonly ProjectDefinition[],
) {
  const world = state.ecs;
  const definitions = new Map(authored.map((definition) => [definition.id, definition]));
  const ProjectData: Project[] = [];
  const CommitmentData: Commitment[] = [];
  const projectEntities = new Map<ProjectId, number>();
  const commitmentsByCharacter = new Map<CharacterId, Set<number>>();
  const commitmentsByProject = new Map<ProjectId, Map<CharacterId, number>>();
  const activeTypes = new Map<ZoneId, Map<string, ProjectId>>();
  const history: ResolvedProjectView[] = [];
  let nextProject = 0;
  let revision = 0;

  function available(character: Character) {
    const commitments = commitmentsByCharacter.get(character.id);
    if (!commitments) return character.influence;
    let committed = 0;
    for (const entity of commitments) committed += CommitmentData[entity]!.influence;
    return character.influence - committed;
  }

  function addCommitment(
    characterId: CharacterId,
    projectId: ProjectId,
    side: Side,
    influence: number,
  ) {
    const index = commitmentsByProject.get(projectId)!;
    const existing = index.get(characterId);
    if (existing !== undefined) {
      CommitmentData[existing]!.influence += influence;
      return;
    }
    const entity = addEntity(world);
    addComponent(world, entity, CommitmentData);
    CommitmentData[entity] = { characterId, projectId, side, influence, influenceDays: 0 };
    index.set(characterId, entity);
    let characterCommitments = commitmentsByCharacter.get(characterId);
    if (!characterCommitments) {
      characterCommitments = new Set();
      commitmentsByCharacter.set(characterId, characterCommitments);
    }
    characterCommitments.add(entity);
  }

  function createProject(
    character: Character,
    definition: ProjectDefinition,
    influence: number,
    day: number,
  ) {
    const id: ProjectId = `project:${nextProject++}`;
    const entity = addEntity(world);
    addComponent(world, entity, ProjectData);
    ProjectData[entity] = {
      id,
      definitionId: definition.id,
      zoneId: character.zoneId,
      creatorId: character.id,
      startedDay: day,
      deadlineDay: day + definition.durationDays,
      progress: 0,
    };
    projectEntities.set(id, entity);
    commitmentsByProject.set(id, new Map());
    let zoneTypes = activeTypes.get(character.zoneId);
    if (!zoneTypes) {
      zoneTypes = new Map();
      activeTypes.set(character.zoneId, zoneTypes);
    }
    zoneTypes.set(definition.id, id);
    addCommitment(character.id, id, "support", influence);
    return id;
  }

  function actionError(action: ProjectAction): ActionRejected | undefined {
    const character = state.characters.get(action.actorId);
    if (!character) return checkProjectAction(action, { character: undefined });
    const actor = { ...character, availableInfluence: available(character) };
    if (action.type === "create-project")
      return checkProjectAction(action, {
        character: actor,
        definition: definitions.get(action.definitionId),
        activeType: activeTypes.get(character.zoneId)?.has(action.definitionId),
      });
    const entity = projectEntities.get(action.projectId);
    if (entity === undefined) return checkProjectAction(action, { character: actor });
    const commitment = commitmentsByProject.get(action.projectId)!.get(character.id);
    let committedSide: Side | undefined;
    if (commitment !== undefined) committedSide = CommitmentData[commitment]!.side;
    return checkProjectAction(action, {
      character: actor,
      project: ProjectData[entity],
      committedSide,
    });
  }

  function applyAction(action: ProjectAction, day: number): ProjectId {
    if (action.type === "create-project") {
      return createProject(
        state.characters.get(action.actorId)!,
        definitions.get(action.definitionId)!,
        action.influence,
        day,
      );
    } else {
      addCommitment(action.actorId, action.projectId, action.side, action.influence);
      return action.projectId;
    }
  }

  function eligibleFounders(definitionId: string, playerId: CharacterId) {
    const definition = definitions.get(definitionId)!;
    const eligible = [...state.characters.all()].filter(
      (character) =>
        character.id !== playerId &&
        available(character) > 0 &&
        meetsRequirements(character, definition),
    );
    return eligible.map((character) => character.id);
  }

  function observeProject(project: Project): ActiveProjectView {
    let support = 0;
    let opposition = 0;
    const commitments: CommitmentView[] = [];
    for (const entity of commitmentsByProject.get(project.id)!.values()) {
      const entry = CommitmentData[entity]!;
      if (entry.side === "support") support += entry.influence;
      else opposition += entry.influence;
      commitments.push({
        characterId: entry.characterId,
        side: entry.side,
        influence: entry.influence,
        influenceDays: entry.influenceDays,
      });
    }
    return { ...project, status: "active", support, opposition, commitments };
  }

  function opportunities() {
    const projectsByZone = new Map<ZoneId, { id: ProjectId; sides: Map<CharacterId, Side> }[]>();
    for (const entity of query(world, [ProjectData])) {
      const project = ProjectData[entity]!;
      let projects = projectsByZone.get(project.zoneId);
      if (!projects) {
        projects = [];
        projectsByZone.set(project.zoneId, projects);
      }
      const sides = new Map<CharacterId, Side>();
      for (const [characterId, commitmentEntity] of commitmentsByProject.get(project.id)!) {
        sides.set(characterId, CommitmentData[commitmentEntity]!.side);
      }
      projects.push({ id: project.id, sides });
    }
    return projectsByZone;
  }

  function advanceProjects(day: number, rewardTies: Random) {
    revision += 1;
    for (const entity of query(world, [CommitmentData])) {
      const commitment = CommitmentData[entity]!;
      commitment.influenceDays += commitment.influence;
    }
    // Copy handles because resolution removes entities from the queried set.
    const advancingProjects = [...query(world, [ProjectData])];
    for (const entity of advancingProjects) {
      const project = ProjectData[entity]!;
      const definition = definitions.get(project.definitionId)!;
      const view = observeProject(project);
      project.progress = Math.min(
        definition.progressTarget,
        Math.max(0, project.progress + view.support - view.opposition),
      );
      let outcome: Outcome | undefined;
      if (project.progress >= definition.progressTarget) outcome = "succeeded";
      else if (day >= project.deadlineDay) outcome = "failed";
      if (!outcome) continue;
      const payouts = distributeRewards(
        view.commitments,
        project.creatorId,
        definition.rewards[outcome],
        rewardTies,
      );
      for (const payout of payouts) {
        state.characters.grantStanding(payout.characterId, {
          reputation: payout.participation.reputation + payout.creator.reputation,
          popularity: payout.participation.popularity + payout.creator.popularity,
        });
      }
      history.push({
        ...view,
        progress: project.progress,
        status: outcome,
        resolvedDay: day,
        payouts,
      });
      if (history.length > HISTORY_LIMIT) history.shift();
      for (const commitmentEntity of commitmentsByProject.get(project.id)!.values()) {
        const entry = CommitmentData[commitmentEntity]!;
        commitmentsByCharacter.get(entry.characterId)!.delete(commitmentEntity);
        removeEntity(world, commitmentEntity);
        delete CommitmentData[commitmentEntity];
      }
      commitmentsByProject.delete(project.id);
      activeTypes.get(project.zoneId)!.delete(project.definitionId);
      projectEntities.delete(project.id);
      removeEntity(world, entity);
      delete ProjectData[entity];
    }
  }

  function prepare(actions: readonly ProjectAction[], day: number) {
    const reserved = new Map<CharacterId, number>();
    const creations = new Set<string>();
    const sides = new Map<string, Side>();
    const preparedRevision = revision;
    const captured = actions.map((action) => ({ ...action }));
    for (const action of captured) {
      const error = actionError(action);
      if (error) return Result.fail(error);
      const used = (reserved.get(action.actorId) ?? 0) + action.influence;
      if (used > available(state.characters.get(action.actorId)!))
        return Result.fail(
          new ActionRejected({
            reason: "InsufficientInfluence",
            message: "The action batch exceeds available influence.",
          }),
        );
      reserved.set(action.actorId, used);
      if (action.type === "commit") {
        const key = JSON.stringify([action.actorId, action.projectId]);
        const side = sides.get(key);
        if (side !== undefined && side !== action.side)
          return Result.fail(
            new ActionRejected({
              reason: "SideLocked",
              message: "A character cannot take both sides of one project.",
            }),
          );
        sides.set(key, action.side);
      }
      if (action.type === "create-project") {
        const key = JSON.stringify([
          state.characters.get(action.actorId)!.zoneId,
          action.definitionId,
        ]);
        if (creations.has(key))
          return Result.fail(
            new ActionRejected({
              reason: "ProjectAlreadyActive",
              message: "The batch contains duplicate projects in one zone.",
            }),
          );
        creations.add(key);
      }
    }
    let consumed = false;
    return Result.succeed(() => {
      if (consumed) throw new Error("A project plan can only be committed once.");
      if (revision !== preparedRevision)
        throw new Error("The world changed after this project plan was prepared.");
      consumed = true;
      revision += 1;
      return captured.map((action) => applyAction(action, day));
    });
  }

  function initialize(ids: readonly string[], playerId: CharacterId, random: Random) {
    for (const id of ids) {
      if (!definitions.has(id))
        return Result.fail(
          new ActionRejected({
            reason: "DefinitionMissing",
            message: "Unknown initial project type: " + id + ".",
          }),
        );
      const eligible = eligibleFounders(id, playerId);
      if (eligible.length === 0)
        return Result.fail(
          new ActionRejected({
            reason: "RequirementsUnmet",
            message: "No eligible founder for initial project: " + id + ".",
          }),
        );
      const plan = prepare(
        [
          {
            type: "create-project",
            actorId: pick(random, eligible),
            definitionId: id,
            influence: 1,
          },
        ],
        0,
      );
      if (Result.isFailure(plan)) return plan;
      plan.success();
    }
    return Result.succeed(undefined);
  }

  function getView() {
    const active = [...query(world, [ProjectData])].map((entity) =>
      observeProject(ProjectData[entity]!),
    );
    return [...active, ...structuredClone(history)];
  }

  function dispose() {
    revision += 1;
    for (const commitments of commitmentsByProject.values()) {
      for (const entity of commitments.values()) removeEntity(world, entity);
    }
    for (const entity of projectEntities.values()) removeEntity(world, entity);
    ProjectData.length = 0;
    CommitmentData.length = 0;
    history.length = 0;
    projectEntities.clear();
    commitmentsByCharacter.clear();
    commitmentsByProject.clear();
    activeTypes.clear();
  }

  return {
    availableInfluence: available,
    getView,
    checkAction: actionError,
    prepare,
    initialize,
    opportunities,
    advance: advanceProjects,
    dispose,
  };
}

export type Projects = ReturnType<typeof createProjects>;
