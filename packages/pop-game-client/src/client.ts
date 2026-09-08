import type { Layer } from "effect";
import type { NpcPolicy, SimulationRandom, GameContent, GameSetup } from "@pop/game";
import { createSession } from "#client/sessions";
import { createProjectsClient, resolutionFeedback } from "#client/projects";

export function createGameClient(
  content: GameContent,
  setup: GameSetup,
  policy?: Layer.Layer<NpcPolicy, never, SimulationRandom>,
) {
  const session = createSession(content, setup, policy);
  return {
    start: session.start,
    dispose: session.dispose,
    getSnapshot: session.getSnapshot,
    subscribe: session.subscribe,
    projects: createProjectsClient(session),
    advanceDay() {
      return session.execute({ type: "advance-day" }, resolutionFeedback);
    },
  };
}

export type GameClient = ReturnType<typeof createGameClient>;
