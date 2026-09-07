import type { GameContent } from "@pop/simulation";
import { createSession } from "./session";
import { createProjectsClient, resolutionFeedback } from "./features/projects/projects";

export function createGameClient(content: GameContent, seed: number) {
  const session = createSession(content, seed);
  const { clearView, ...projects } = createProjectsClient(session, content.projects);
  return {
    start: session.start,
    dispose() {
      session.dispose();
      clearView();
    },
    getSnapshot: session.getSnapshot,
    subscribe: session.subscribe,
    projects,
    advanceDay() {
      session.execute({ type: "advance-day" }, resolutionFeedback);
    },
  };
}

export type GameClient = ReturnType<typeof createGameClient>;
