import { expect, test } from "vite-plus/test";
import { gameContent } from "@pop/content";
import { createGameClient } from "../../client";

function start() {
  const content = {
    ...gameContent,
    projects: [
      {
        ...gameContent.projects[0]!,
        requirements: { reputation: 0, popularity: 0 },
        progressTarget: 2,
        durationDays: 2,
      },
    ],
  };
  const client = createGameClient(content, {
    seed: 42,
    generation: { npcCount: 0, npcReputation: [0, 0], npcPopularity: [0, 0], npcInfluence: [1, 1] },
    ai: { participationChance: 0, supportChance: 0.5 },
    initialProjects: [],
  });
  client.start("Ada");
  return client;
}

test("creation returns its identity and observations follow participation through resolution", () => {
  const client = start();
  try {
    const projectId = client.projects.create("street-cleanup", 1)!;
    const board = client.projects.getView()!;
    expect(projectId).toBe("project:0");
    expect(client.projects.getView()).toBe(board);
    expect(board.active).toHaveLength(1);
    expect(board.byId.get(projectId)).toMatchObject({
      definition: { id: "street-cleanup" },
      creator: { name: "Ada" },
      participants: [{ character: { name: "Ada" }, commitment: { influence: 1 } }],
      ownCommitment: { influenceDays: 0 },
      ownShare: undefined,
    });
    client.advanceDay();
    expect(client.projects.getView()!.byId.get(projectId)).toMatchObject({
      ownCommitment: { influenceDays: 1 },
      ownShare: 1,
    });
    expect(board.byId.get(projectId)!.project.progress).toBe(0);
    client.advanceDay();
    const resolved = client.projects.getView()!;
    expect(resolved.active).toHaveLength(0);
    expect(resolved.resolved[0]!.project).toMatchObject({ id: projectId, status: "succeeded" });
    expect(resolved.player.availableInfluence).toBe(1);
    expect(client.getSnapshot().message).toContain("One project resolved");
    const nextId = client.projects.create("street-cleanup", 1);
    expect(nextId).toBe("project:1");
    expect(client.projects.getView()!.byId.get(nextId!)!.project.status).toBe("active");
  } finally {
    client.dispose();
  }
});

test("rejections keep the same observation and disposal clears feature views before restart", () => {
  const client = start();
  try {
    const initial = client.projects.getView();
    expect(client.projects.create("missing-project", 1)).toBeUndefined();
    expect(client.getSnapshot().error).toBe(client.projects.checkCreation("missing-project", 1));
    expect(client.projects.getView()).toBe(initial);
    client.projects.create("street-cleanup", 1);
    client.dispose();
    expect(client.projects.getView()).toBeUndefined();
    expect(client.projects.checkCreation("street-cleanup", 1)).toContain("Create your character");
    client.start("Bea");
    expect(client.projects.getView()!.active).toHaveLength(0);
    expect(client.projects.getView()!.player.name).toBe("Bea");
  } finally {
    client.dispose();
  }
});
