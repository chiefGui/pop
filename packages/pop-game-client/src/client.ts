import type { GameContent, GameSetup } from "@pop/simulation";
import { createSession } from "./session";
import { createProjectsClient, resolutionFeedback } from "./features/projects/projects";

export function createGameClient(content: GameContent, setup: GameSetup) {
  const session = createSession(content, setup);
  return {
    start: session.start,
    dispose: session.dispose,
    getSnapshot: session.getSnapshot,
    subscribe: session.subscribe,
    projects: createProjectsClient(session, content.projects),
    advanceDay() {
      session.execute({ type: "advance-day" }, resolutionFeedback);
    },
  };
}

export type GameClient = ReturnType<typeof createGameClient>;
