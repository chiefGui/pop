import type { ProjectId, ProjectDefinition, Side, WorldView } from "@pop/simulation";
import type { Session } from "../../session";
import { projectBoard } from "./view";
import type { ProjectBoard } from "./view";

type ProjectSession = Pick<Session, "getSnapshot" | "checkAction" | "execute">;

export function createProjectsClient(
  session: ProjectSession,
  definitions: readonly ProjectDefinition[],
) {
  const views = new WeakMap<WorldView, ProjectBoard>();
  return {
    getView() {
      const world = session.getSnapshot().world;
      if (!world) return;
      let board = views.get(world);
      if (!board) {
        board = projectBoard(world, definitions);
        views.set(world, board);
      }
      return board;
    },
    checkCommitment(projectId: ProjectId, side: Side, influence: number) {
      const world = session.getSnapshot().world;
      if (!world) return "Create your character first.";
      return session.checkAction({
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
      return session.checkAction({
        type: "create-project",
        actorId: world.playerId,
        definitionId,
        influence,
      });
    },
    commit(projectId: ProjectId, side: Side, influence: number) {
      const world = session.getSnapshot().world;
      if (!world) return;
      session.execute(
        { type: "commit", actorId: world.playerId, projectId, side, influence },
        `${influence} influence committed. It returns when this project resolves.`,
      );
    },
    create(definitionId: string, influence: number) {
      const world = session.getSnapshot().world;
      if (!world) return;
      const result = session.execute(
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
