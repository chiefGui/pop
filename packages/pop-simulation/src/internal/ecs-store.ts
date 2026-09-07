import { addComponent, addEntity, createWorld, deleteWorld, query, removeEntity } from "bitecs";
import type {
  ActiveProjectView,
  CharacterAction,
  CharacterId,
  CharacterView,
  CommitmentView,
  GameContent,
  Outcome,
  ProjectDefinition,
  ProjectId,
  ResolvedProjectView,
  Side,
  SessionOptions,
  WorldView,
  ZoneId,
} from "../contracts";
import { integer } from "./random";
import type { SimulationRandom, Random } from "./random";
import type { DecisionObservation } from "./npc-policy";
import { ActionRejected } from "../errors";
import { distributeRewards } from "./rewards";

interface Character {
  id: CharacterId;
  name: string;
  zoneId: ZoneId;
  reputation: number;
  popularity: number;
  influence: number;
}

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

export function createEcsStore(
  source: GameContent,
  options: SessionOptions,
  random: SimulationRandom["Service"],
) {
  const content = source;
  const definitions = new Map(content.projects.map((definition) => [definition.id, definition]));
  const CharacterData: Character[] = [];
  const ProjectData: Project[] = [];
  const CommitmentData: Commitment[] = [];
  const ZoneData: GameContent["world"]["zone"][] = [];
  const world = createWorld({
    components: { CharacterData, ProjectData, CommitmentData, ZoneData },
  });
  const characterEntities = new Map<CharacterId, number>();
  const projectEntities = new Map<ProjectId, number>();
  // These indexes contain handles only; entity components remain the source of truth.
  const commitmentsByCharacter = new Map<CharacterId, Set<number>>();
  const commitmentsByProject = new Map<ProjectId, Map<CharacterId, number>>();
  const activeTypes = new Map<ZoneId, Map<string, ProjectId>>();
  const history: ResolvedProjectView[] = [];
  const generation = random.world;
  const names = random.names;
  let day = 0;
  let nextProject = 0;
  const playerId: CharacterId = "character:0";
  const zoneEntity = addEntity(world);
  addComponent(world, zoneEntity, ZoneData);
  ZoneData[zoneEntity] = content.world.zone;

  function addCharacter(character: Character) {
    const entity = addEntity(world);
    addComponent(world, entity, CharacterData);
    CharacterData[entity] = character;
    characterEntities.set(character.id, entity);
    commitmentsByCharacter.set(character.id, new Set());
  }

  addCharacter({
    id: playerId,
    name: options.playerName,
    zoneId: content.world.zone.id,
    reputation: 0,
    popularity: 0,
    influence: 1,
  });
  for (let index = 1; index <= content.world.npcCount; index += 1) {
    addCharacter({
      id: `character:${index}`,
      name: `${content.world.firstNames[integer(names, 0, content.world.firstNames.length - 1)]} ${content.world.lastNames[integer(names, 0, content.world.lastNames.length - 1)]}`,
      zoneId: content.world.zone.id,
      reputation: integer(generation, ...content.world.npcReputation),
      popularity: integer(generation, ...content.world.npcPopularity),
      influence: integer(generation, ...content.world.npcInfluence),
    });
  }

  function available(character: Character) {
    let committed = 0;
    for (const entity of commitmentsByCharacter.get(character.id)!)
      committed += CommitmentData[entity]!.influence;
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
    commitmentsByCharacter.get(characterId)!.add(entity);
  }

  function createProject(character: Character, definition: ProjectDefinition, influence: number) {
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
  }

  function actionError(action: CharacterAction): ActionRejected | undefined {
    const entity = characterEntities.get(action.actorId);
    if (entity === undefined)
      return new ActionRejected({ reason: "CharacterMissing", message: "Character not found." });
    const character = CharacterData[entity]!;
    if (available(character) < action.influence)
      return new ActionRejected({
        reason: "InsufficientInfluence",
        message:
          "Not enough available influence. Existing commitments return when their projects resolve.",
      });
    if (action.type === "create-project") {
      const definition = definitions.get(action.definitionId);
      if (!definition)
        return new ActionRejected({
          reason: "DefinitionMissing",
          message: "Project type not found.",
        });
      if (
        character.reputation < definition.requirements.reputation ||
        character.popularity < definition.requirements.popularity
      ) {
        return new ActionRejected({
          reason: "RequirementsUnmet",
          message: "You do not yet meet this project's reputation and popularity requirements.",
        });
      }
      if (activeTypes.get(character.zoneId)?.has(definition.id))
        return new ActionRejected({
          reason: "ProjectAlreadyActive",
          message: "This project is already active in your zone.",
        });
      return;
    }
    const projectEntity = projectEntities.get(action.projectId);
    if (projectEntity === undefined)
      return new ActionRejected({
        reason: "ProjectInactive",
        message: "This project is no longer active.",
      });
    const project = ProjectData[projectEntity]!;
    if (project.zoneId !== character.zoneId)
      return new ActionRejected({
        reason: "WrongZone",
        message: "You can only join projects in your zone.",
      });
    const existing = commitmentsByProject.get(project.id)!.get(character.id);
    if (existing !== undefined && CommitmentData[existing]!.side !== action.side)
      return new ActionRejected({
        reason: "SideLocked",
        message: "Your side is fixed until this project resolves.",
      });
  }

  // Only the session service calls mutations, after schema and world-rule validation.
  function applyAction(action: CharacterAction): void {
    if (action.type === "create-project") {
      createProject(
        CharacterData[characterEntities.get(action.actorId)!]!,
        definitions.get(action.definitionId)!,
        action.influence,
      );
    } else {
      addCommitment(action.actorId, action.projectId, action.side, action.influence);
    }
  }

  function eligibleFounders(definitionId: string) {
    const definition = definitions.get(definitionId)!;
    const eligible = [...characterEntities.values()]
      .map((entity) => CharacterData[entity]!)
      .filter(
        (character) =>
          character.id !== playerId &&
          available(character) > 0 &&
          character.reputation >= definition.requirements.reputation &&
          character.popularity >= definition.requirements.popularity,
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

  function observeDecisions(): DecisionObservation {
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
    const characters: { id: CharacterId; zoneId: ZoneId; availableInfluence: number }[] = [];
    for (const entity of query(world, [CharacterData])) {
      const character = CharacterData[entity]!;
      if (character.id === playerId) continue;
      characters.push({
        id: character.id,
        zoneId: character.zoneId,
        availableInfluence: available(character),
      });
    }
    return { characters, projectsByZone };
  }

  function advanceProjects(rewardTies: Random) {
    day += 1;
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
        const character = CharacterData[characterEntities.get(payout.characterId)!]!;
        character.reputation += payout.participation.reputation + payout.creator.reputation;
        character.popularity += payout.participation.popularity + payout.creator.popularity;
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

  function getView(): WorldView {
    const characters: CharacterView[] = [];
    for (const entity of query(world, [CharacterData])) {
      const character = CharacterData[entity]!;
      characters.push({
        ...character,
        availableInfluence: available(character),
        isPlayer: character.id === playerId,
      });
    }
    const projects = [...query(world, [ProjectData])].map((entity) =>
      observeProject(ProjectData[entity]!),
    );
    // All returned state is detached. UI code can never mutate the ECS or its history.
    return {
      day,
      playerId,
      zone: { ...ZoneData[zoneEntity]! },
      characters,
      projects: [...projects, ...structuredClone(history)],
    };
  }

  function dispose() {
    deleteWorld(world);
    CharacterData.length = 0;
    ProjectData.length = 0;
    CommitmentData.length = 0;
    ZoneData.length = 0;
    history.length = 0;
    characterEntities.clear();
    projectEntities.clear();
    commitmentsByCharacter.clear();
    commitmentsByProject.clear();
    activeTypes.clear();
  }

  return {
    playerId,
    getView,
    checkAction: actionError,
    applyAction,
    eligibleFounders,
    observeDecisions,
    advanceProjects,
    dispose,
  };
}
