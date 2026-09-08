import { ProjectAction, checkProjectAction } from "@pop/game";
import { Result, Schema } from "effect";
import type { ProjectId, Side, WorldView } from "@pop/game";
import type { Session } from "#client/sessions";
import { projectBoard } from "./view";
import type { ProjectBoard } from "./view";

const decodeAction = Schema.decodeUnknownResult(ProjectAction);

type ProjectSession = Pick<Session, "getSnapshot" | "execute">;

export function createProjectsClient(session: ProjectSession) {
  function checkAction(input: ProjectAction) {
    const snapshot = session.getSnapshot();
    if (!snapshot.world || !snapshot.content) return "Create your character first.";
    const decoded = decodeAction(input);
    if (Result.isFailure(decoded)) return decoded.failure.message;
    const action = decoded.success;
    const character = snapshot.world.characters.find(
      (character) => character.id === action.actorId,
    );
    if (action.type === "create-project")
      return checkProjectAction(action, {
        character,
        definition: snapshot.content.projects.find(
          (definition) => definition.id === action.definitionId,
        ),
        activeType: snapshot.world.projects.some(
          (project) =>
            project.status === "active" &&
            project.zoneId === character?.zoneId &&
            project.definitionId === action.definitionId,
        ),
      })?.message;
    const project = snapshot.world.projects.find(
      (project) => project.id === action.projectId && project.status === "active",
    );
    return checkProjectAction(action, {
      character,
      project,
      committedSide: project?.commitments.find(
        (commitment) => commitment.characterId === action.actorId,
      )?.side,
    })?.message;
  }
  const views = new WeakMap<WorldView, ProjectBoard>();
  return {
    getView() {
      const world = session.getSnapshot().world;
      if (!world) return;
      let board = views.get(world);
      if (!board) {
        board = projectBoard(world, session.getSnapshot().content!.projects);
        views.set(world, board);
      }
      return board;
    },
    checkCommitment(projectId: ProjectId, side: Side, influence: number) {
      const world = session.getSnapshot().world;
      if (!world) return "Create your character first.";
      return checkAction({
        type: "commit",
        actorId: world.playerId,
        projectId,
        side,
        influence,
      });
    },
    checkCreation(definitionId: string, influence: number) {
      const world = session.getSnapshot().world;
      if (!world) return "Create your character first.";
      return checkAction({
        type: "create-project",
        actorId: world.playerId,
        definitionId,
        influence,
      });
    },
    async commit(projectId: ProjectId, side: Side, influence: number) {
      const world = session.getSnapshot().world;
      if (!world) return;
      return session.execute(
        { type: "commit", actorId: world.playerId, projectId, side, influence },
        `${influence} influence committed. It returns when this project resolves.`,
      );
    },
    async create(definitionId: string, influence: number) {
      const world = session.getSnapshot().world;
      if (!world) return;
      const result = await session.execute(
        { type: "create-project", actorId: world.playerId, definitionId, influence },
        "Project started. Your founding influence is committed as support.",
      );
      if (result?.type === "create-project") return result.projectId;
    },
  };
}

export function resolutionFeedback(world: WorldView) {
  const resolved = world.projects.filter(
    (project) => project.status !== "active" && project.resolvedDay === world.day,
  );
  if (resolved.length === 1)
    return "One project resolved. Its rewards have been distributed and influence returned.";
  if (resolved.length > 1)
    return (
      resolved.length +
      " projects resolved. Their rewards have been distributed and influence returned."
    );
  return "";
}
