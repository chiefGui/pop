import { expect, test } from "vite-plus/test";
import { Result } from "effect";
import { createProjects } from "#game/projects/projects";
import { createWorldState } from "#game/world";
import { fixture } from "#test/fixture";

function start() {
  const content = fixture();
  const world = createWorldState(content.world.zone);
  world.characters.add({
    id: "character:0",
    name: "Ada",
    zoneId: world.zoneId,
    reputation: 20,
    popularity: 20,
    influence: 3,
  });
  const projects = createProjects(world, content.projects);
  return {
    world,
    projects,
    dispose() {
      projects.dispose();
      world.dispose();
    },
  };
}

test("project batches reject opposing sides and stale or already consumed plans", () => {
  const state = start();
  try {
    const create = {
      type: "create-project" as const,
      actorId: "character:0" as const,
      definitionId: "cleanup",
      influence: 1,
    };
    const first = state.projects.prepare([create], 0);
    const stale = state.projects.prepare([create], 0);
    if (Result.isFailure(first) || Result.isFailure(stale)) throw new Error("Expected valid plans");
    first.success();
    expect(() => first.success()).toThrow("only be committed once");
    expect(() => stale.success()).toThrow("world changed");
    const before = state.projects.getView();
    expect(
      state.projects.prepare(
        [
          {
            type: "commit",
            actorId: "character:0",
            projectId: "project:0",
            side: "oppose",
            influence: 1,
          },
        ],
        0,
      ),
    ).toMatchObject({ _tag: "Failure", failure: { reason: "SideLocked" } });
    expect(state.projects.getView()).toEqual(before);
  } finally {
    state.dispose();
  }
});
