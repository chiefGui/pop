import { fixture } from "../test/fixture";
import { afterEach, expect, test } from "vite-plus/test";
import { Effect, ManagedRuntime, Result } from "effect";
import { Simulation, simulationLayer } from "./simulation";
import type { CharacterId, GameContent } from "./contracts";

const runtimes: ReturnType<typeof makeRuntime>[] = [];
function makeRuntime(content: GameContent, seed: number) {
  return ManagedRuntime.make(simulationLayer(content, { seed, playerName: "Player" }));
}
afterEach(() => {
  for (const runtime of runtimes.splice(0)) Effect.runSync(runtime.disposeEffect);
});

function start(content = fixture(), seed = 42) {
  const runtime = makeRuntime(content, seed);
  runtimes.push(runtime);
  const simulation = runtime.runSync(Simulation);
  return {
    getView: () => runtime.runSync(simulation.getView),
    dispatch: (input: unknown) =>
      runtime.runSync(
        Effect.result(simulation.dispatch(input).pipe(Effect.map((result) => result.world))),
      ),
  };
}

function create(
  simulation: ReturnType<typeof start>,
  actorId: CharacterId = "character:1",
  definitionId = "cleanup",
) {
  expect(
    simulation.dispatch({ type: "create-project", actorId, definitionId, influence: 1 }),
  ).toMatchObject({ _tag: "Success" });
  return simulation
    .getView()
    .projects.findLast(
      (project) => project.status === "active" && project.definitionId === definitionId,
    )!;
}

function advance(simulation: ReturnType<typeof start>, days: number) {
  for (let index = 0; index < days; index += 1)
    expect(simulation.dispatch({ type: "advance-day" })).toMatchObject({ _tag: "Success" });
}

test("starts a nobody with one influence and locks each founder's influence", () => {
  const content = fixture();
  const simulation = start({
    ...content,
    world: { ...content.world, initialProjects: ["cleanup", "market"] },
  });
  const view = simulation.getView();
  expect(view.characters[0]).toMatchObject({
    reputation: 0,
    popularity: 0,
    influence: 1,
    availableInfluence: 1,
  });
  expect(view.projects).toHaveLength(2);
  for (const project of view.projects) {
    expect(project).toMatchObject({ progress: 0, support: 1, opposition: 0, status: "active" });
    expect(project.commitments).toEqual([
      { characterId: project.creatorId, side: "support", influence: 1, influenceDays: 0 },
    ]);
  }
  expect(
    view.characters.reduce(
      (sum, character) => sum + character.influence - character.availableInfluence,
      0,
    ),
  ).toBe(2);
});

test("rejects invalid commitments without changing state", () => {
  const simulation = start();
  const project = create(simulation);
  for (const influence of [0, -1, 0.5, 2, NaN, Infinity]) {
    const before = simulation.getView();
    expect(
      Result.isSuccess(
        simulation.dispatch({
          type: "commit",
          actorId: "character:0",
          projectId: project.id,
          side: "support",
          influence,
        }),
      ),
    ).toBe(false);
    expect(simulation.getView()).toEqual(before);
  }
});

test("splits influence between projects and prevents changing an existing side", () => {
  const simulation = start();
  const first = create(simulation);
  const second = create(simulation, "character:1", "market");
  expect(
    Result.isSuccess(
      simulation.dispatch({
        type: "commit",
        actorId: "character:2",
        projectId: first.id,
        side: "oppose",
        influence: 1,
      }),
    ),
  ).toBe(true);
  expect(
    Result.isSuccess(
      simulation.dispatch({
        type: "commit",
        actorId: "character:2",
        projectId: second.id,
        side: "support",
        influence: 1,
      }),
    ),
  ).toBe(true);
  expect(simulation.getView().characters[2]!.availableInfluence).toBe(1);
  expect(
    simulation.dispatch({
      type: "commit",
      actorId: "character:2",
      projectId: first.id,
      side: "support",
      influence: 1,
    }),
  ).toMatchObject({ _tag: "Failure" });
  expect(
    simulation.dispatch({
      type: "commit",
      actorId: "character:1",
      projectId: first.id,
      side: "oppose",
      influence: 1,
    }),
  ).toMatchObject({ _tag: "Failure" });
});

test("counts additional deposits only for days they actually contribute", () => {
  const simulation = start(fixture({ durationDays: 10, progressTarget: 100 }));
  const project = create(simulation);
  advance(simulation, 2);
  expect(
    Result.isSuccess(
      simulation.dispatch({
        type: "commit",
        actorId: project.creatorId,
        projectId: project.id,
        side: "support",
        influence: 2,
      }),
    ),
  ).toBe(true);
  advance(simulation, 1);
  expect(simulation.getView().projects[0]).toMatchObject({
    progress: 5,
    commitments: [{ influence: 3, influenceDays: 5 }],
  });
});

test("opposition reverses progress, floors it at zero, and returns influence on failure", () => {
  const simulation = start(fixture({ durationDays: 4, progressTarget: 20 }));
  const project = create(simulation);
  advance(simulation, 1);
  expect(
    Result.isSuccess(
      simulation.dispatch({
        type: "commit",
        actorId: "character:2",
        projectId: project.id,
        side: "oppose",
        influence: 3,
      }),
    ),
  ).toBe(true);
  advance(simulation, 1);
  expect(simulation.getView().projects[0]!.progress).toBe(0);
  advance(simulation, 2);
  const view = simulation.getView();
  expect(view.projects[0]).toMatchObject({ status: "failed", progress: 0, resolvedDay: 4 });
  expect(
    view.characters.every((character) => character.availableInfluence === character.influence),
  ).toBe(true);
  expect(view.characters[1]).toMatchObject({ reputation: 27, popularity: 32 });
  expect(view.characters[2]).toMatchObject({ reputation: 28, popularity: 22 });
});

test("reaching the target on the deadline succeeds and distributes authored pools exactly", () => {
  const simulation = start();
  const project = create(simulation);
  expect(
    Result.isSuccess(
      simulation.dispatch({
        type: "commit",
        actorId: "character:0",
        projectId: project.id,
        side: "support",
        influence: 1,
      }),
    ),
  ).toBe(true);
  advance(simulation, 3);
  const view = simulation.getView();
  expect(view.projects[0]).toMatchObject({ status: "succeeded", resolvedDay: 3, progress: 6 });
  expect(view.characters[0]).toMatchObject({ reputation: 5, popularity: 3, availableInfluence: 1 });
  expect(view.characters[1]).toMatchObject({
    reputation: 28,
    popularity: 27,
    availableInfluence: 3,
  });
  const balances = view.characters;
  advance(simulation, 4);
  expect(simulation.getView().characters).toEqual(balances);
});

test("extra support completes early, releases its type, and allows another project immediately", () => {
  const simulation = start();
  const project = create(simulation);
  expect(
    Result.isSuccess(
      simulation.dispatch({
        type: "commit",
        actorId: "character:1",
        projectId: project.id,
        side: "support",
        influence: 2,
      }),
    ),
  ).toBe(true);
  advance(simulation, 2);
  expect(simulation.getView().projects[0]).toMatchObject({ status: "succeeded", resolvedDay: 2 });
  const next = create(simulation);
  expect(next.id).not.toBe(project.id);
  expect(next).toMatchObject({ progress: 0, startedDay: 2, deadlineDay: 5 });
});

test("creation checks thresholds and zone uniqueness without spending standing", () => {
  const simulation = start(fixture({ requirements: { reputation: 10, popularity: 10 } }));
  expect(
    Result.isSuccess(
      simulation.dispatch({
        type: "create-project",
        actorId: "character:0",
        definitionId: "cleanup",
        influence: 1,
      }),
    ),
  ).toBe(false);
  create(simulation);
  expect(
    Result.isSuccess(
      simulation.dispatch({
        type: "create-project",
        actorId: "character:2",
        definitionId: "cleanup",
        influence: 1,
      }),
    ),
  ).toBe(false);
  create(simulation, "character:1", "market");
  expect(simulation.getView().characters[1]).toMatchObject({
    reputation: 20,
    popularity: 20,
    availableInfluence: 1,
  });
});

test("different project deadlines remain independent", () => {
  const content = fixture({ progressTarget: 100 });
  const simulation = start({
    ...content,
    projects: [content.projects[0]!, { ...content.projects[1]!, durationDays: 5 }],
  });
  create(simulation);
  create(simulation, "character:2", "market");
  advance(simulation, 3);
  const projects = simulation.getView().projects;
  expect(projects.find((project) => project.definitionId === "cleanup")!.status).toBe("failed");
  expect(projects.find((project) => project.definitionId === "market")!.status).toBe("active");
});

test("NPCs commit before progress and cannot reuse newly released influence in the same day", () => {
  const content = fixture({ durationDays: 1, progressTarget: 1 });
  const simulation = start({
    ...content,
    world: {
      ...content.world,
      npcCount: 1,
      npcInfluence: [1, 1],
      npcParticipationChance: 1,
      npcSupportChance: 1,
    },
  });
  create(simulation);
  create(simulation, "character:0", "market");
  advance(simulation, 1);
  expect(simulation.getView().projects.every((project) => project.commitments.length === 1)).toBe(
    true,
  );
  const second = start({
    ...content,
    world: {
      ...content.world,
      npcCount: 1,
      npcInfluence: [1, 1],
      npcParticipationChance: 1,
      npcSupportChance: 1,
    },
  });
  create(second, "character:0");
  advance(second, 1);
  expect(second.getView().projects[0]!.commitments).toHaveLength(2);
  expect(
    second.getView().projects[0]!.commitments.every((entry) => entry.influenceDays === 1),
  ).toBe(true);
});

test("same seed and actions reproduce the world, including after entity recycling", () => {
  const content = fixture();
  const populated = {
    ...content,
    world: { ...content.world, npcCount: 99, npcParticipationChance: 0.4 },
  };
  const first = start(populated);
  const second = start(populated);
  for (let iteration = 0; iteration < 12; iteration += 1) {
    create(first);
    create(second);
    advance(first, 3);
    advance(second, 3);
    expect(first.getView()).toEqual(second.getView());
  }
  const different = start(populated, 43);
  expect(different.getView().characters).not.toEqual(start(populated).getView().characters);
});

test("cosmetic names do not change decisions or rewards", () => {
  const content = fixture();
  const world = { ...content.world, npcCount: 10, npcParticipationChance: 0.5 };
  const first = start({ ...content, world });
  const second = start({ ...content, world: { ...world, firstNames: ["A", "B", "C"] } });
  create(first);
  create(second);
  advance(first, 3);
  advance(second, 3);
  expect(first.getView().projects).toEqual(second.getView().projects);
});

test("exposed observations and supplied content cannot mutate the live world", () => {
  const content = fixture();
  const simulation = start(content);
  const before = simulation.getView();
  const detached = simulation.getView();
  Object.assign(detached.characters[0]!, { reputation: 999 });
  Object.assign(content.projects[0]!, { progressTarget: 999 });
  expect(simulation.getView()).toEqual(before);
  create(simulation);
  advance(simulation, 3);
  const project = simulation.getView().projects[0]!;
  Object.assign(project, { progress: 999 });
  expect(simulation.getView().projects[0]!.progress).toBe(3);
});

test("invalid authored content or an impossible initial supply fails explicitly", () => {
  expect(() => start(fixture({ durationDays: 0 }))).toThrow("duration");
  const content = fixture();
  expect(() =>
    start({ ...content, projects: [content.projects[0]!, content.projects[0]!] }),
  ).toThrow("unique");
  expect(() =>
    start({ ...content, world: { ...content.world, npcCount: 0, initialProjects: ["cleanup"] } }),
  ).toThrow("founder");
});
