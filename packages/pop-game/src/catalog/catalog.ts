import { Context, Effect, Layer, Schema } from "effect";
import { ProjectDefinition } from "#game/projects";
import { CharacterNames } from "#game/characters";
import { Zone } from "#game/zones";

export const WorldContent = Schema.Struct({
  zone: Zone,
  ...CharacterNames.fields,
});
export type WorldContent = typeof WorldContent.Type;

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

export class InvalidContent extends Schema.TaggedError<InvalidContent>()("InvalidContent", {
  message: Schema.String,
}) {}
const decodeContent = Schema.decodeUnknownEffect(GameContent);
export class ContentCatalog extends Context.Service<ContentCatalog, GameContent>()(
  "@pop/game/ContentCatalog",
) {
  static layer(input: unknown) {
    return Layer.effect(
      ContentCatalog,
      decodeContent(input).pipe(
        Effect.mapError((error) => new InvalidContent({ message: error.message })),
        Effect.map((content) => structuredClone(content)),
      ),
    );
  }
}
