import { Schema } from "effect";
import { AdvanceDay } from "#game/turns";
import { ProjectAction } from "#game/projects";
import type { ProjectId } from "#game/projects";
import type { WorldView } from "#game/world";

export const Command = Schema.Union([ProjectAction, AdvanceDay]);
export type Command = typeof Command.Type;

export type CommandResult =
  | { readonly type: AdvanceDay["type"]; readonly world: WorldView }
  | {
      readonly type: ProjectAction["type"];
      readonly projectId: ProjectId;
      readonly world: WorldView;
    };

import type { ActionRejected } from "#game/projects";

export class InvalidCommand extends Schema.TaggedError<InvalidCommand>()("InvalidCommand", {
  message: Schema.String,
}) {}
import type { InvalidNpcDecision } from "#game/ai";

import type { SessionError } from "@pop/engine";

export type CommandError = InvalidCommand | ActionRejected | InvalidNpcDecision | SessionError;
