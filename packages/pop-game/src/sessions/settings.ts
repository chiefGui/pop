import { Context, Effect, Layer, Schema } from "effect";
import { ProjectDefinitionId } from "#game/projects";
import { CharacterIdentity } from "#game/characters";
import { NpcGenerationSettings } from "#game/npc";
import { NpcSettings } from "#game/ai";

export const SessionOptions = Schema.Struct({
  seed: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 0xffffffff })),
  player: CharacterIdentity,
  generation: NpcGenerationSettings,
  ai: NpcSettings,
  initialProjects: Schema.Array(ProjectDefinitionId).check(
    Schema.makeFilter((ids) => {
      if (new Set(ids).size !== ids.length) return "Initial project types must be unique.";
    }),
  ),
});
export type SessionOptions = typeof SessionOptions.Type;
export type GameSetup = Omit<SessionOptions, "player">;

export class InvalidSessionOptions extends Schema.TaggedError<InvalidSessionOptions>()(
  "InvalidSessionOptions",
  { message: Schema.String },
) {}
const decodeOptions = Schema.decodeUnknownEffect(SessionOptions);
export class SessionConfig extends Context.Service<SessionConfig, SessionOptions>()(
  "@pop/game/SessionConfig",
) {
  static layer(input: unknown) {
    return Layer.effect(
      SessionConfig,
      decodeOptions(input).pipe(
        Effect.mapError((error) => new InvalidSessionOptions({ message: error.message })),
        Effect.map((options) => structuredClone(options)),
      ),
    );
  }
}
