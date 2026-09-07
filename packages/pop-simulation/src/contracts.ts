import { Schema } from "effect";
import type { CharacterId, CharacterView } from "./model";
import { ProjectAction, ProjectDefinition } from "./features/projects/model";
import type { ProjectId, ProjectView } from "./features/projects/model";
import { WorldDefinition } from "./features/world-generation/model";

export { CharacterId, ZoneId, Rewards } from "./model";
export type { CharacterView } from "./model";
export * from "./features/projects/model";
export { WorldDefinition } from "./features/world-generation/model";

export const GameContent = Schema.Struct({
  projects: Schema.Array(ProjectDefinition),
  world: WorldDefinition,
}).check(
  Schema.makeFilter((content) => {
    const ids = new Set(content.projects.map((project) => project.id));
    if (ids.size !== content.projects.length) return "Project definition IDs must be unique.";
    const initial = new Set<string>();
    for (const id of content.world.initialProjects) {
      if (!ids.has(id) || initial.has(id))
        return "Initial projects must refer to distinct authored project types.";
      initial.add(id);
    }
  }),
);
export type GameContent = typeof GameContent.Type;

export const SessionOptions = Schema.Struct({
  seed: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 0xffffffff })),
  playerName: Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(40)),
});
export type SessionOptions = typeof SessionOptions.Type;

export interface WorldView {
  readonly day: number;
  readonly playerId: CharacterId;
  readonly zone: WorldDefinition["zone"];
  readonly characters: readonly CharacterView[];
  readonly projects: readonly ProjectView[];
}

export const Command = Schema.Union([
  ProjectAction,
  Schema.Struct({ type: Schema.Literal("advance-day") }),
]);
export type Command = typeof Command.Type;

export type CommandResult =
  | { readonly type: "advance-day"; readonly world: WorldView }
  | {
      readonly type: "commit" | "create-project";
      readonly projectId: ProjectId;
      readonly world: WorldView;
    };
