import { Schema } from "effect";
import type { CharacterId, CharacterView } from "./model";
import { DefinitionId } from "./model";
import { ProjectAction, ProjectDefinition } from "./features/projects/model";
import type { ProjectId, ProjectView } from "./features/projects/model";
import { WorldContent, GenerationSettings } from "./features/world-generation/model";
import { NpcSettings } from "./features/ai/settings";

export { CharacterId, ZoneId, Rewards } from "./model";
export type { CharacterView } from "./model";
export * from "./features/projects/model";
export { WorldContent, GenerationSettings } from "./features/world-generation/model";
export { NpcSettings } from "./features/ai/settings";

export const GameContent = Schema.Struct({
  projects: Schema.Array(ProjectDefinition),
  world: WorldContent,
}).check(
  Schema.makeFilter((content) => {
    const ids = new Set(content.projects.map((project) => project.id));
    if (ids.size !== content.projects.length) return "Project definition IDs must be unique.";
  }),
);
export type GameContent = typeof GameContent.Type;

export const SessionOptions = Schema.Struct({
  seed: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 0xffffffff })),
  playerName: Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(40)),
  generation: GenerationSettings,
  ai: NpcSettings,
  initialProjects: Schema.Array(DefinitionId).check(
    Schema.makeFilter((ids) => {
      if (new Set(ids).size !== ids.length) return "Initial project types must be unique.";
    }),
  ),
});
export type SessionOptions = typeof SessionOptions.Type;
export type GameSetup = Omit<SessionOptions, "playerName">;

export interface WorldView {
  readonly day: number;
  readonly playerId: CharacterId;
  readonly zone: WorldContent["zone"];
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
