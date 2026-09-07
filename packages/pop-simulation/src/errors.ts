import { Schema } from "effect";

export class InvalidContent extends Schema.TaggedError<InvalidContent>()("InvalidContent", {
  message: Schema.String,
}) {}
export class InvalidSessionOptions extends Schema.TaggedError<InvalidSessionOptions>()(
  "InvalidSessionOptions",
  { message: Schema.String },
) {}
export class InvalidCommand extends Schema.TaggedError<InvalidCommand>()("InvalidCommand", {
  message: Schema.String,
}) {}
export class ActionRejected extends Schema.TaggedError<ActionRejected>()("ActionRejected", {
  reason: Schema.Literals([
    "CharacterMissing",
    "InsufficientInfluence",
    "DefinitionMissing",
    "RequirementsUnmet",
    "ProjectAlreadyActive",
    "ProjectInactive",
    "WrongZone",
    "SideLocked",
  ]),
  message: Schema.String,
}) {}
export class InvalidNpcDecision extends Schema.TaggedError<InvalidNpcDecision>()(
  "InvalidNpcDecision",
  { message: Schema.String },
) {}
export class SessionClosed extends Schema.TaggedError<SessionClosed>()("SessionClosed", {
  message: Schema.String,
}) {}

export type CommandError = InvalidCommand | ActionRejected | InvalidNpcDecision | SessionClosed;
