import { Context, Effect, Layer, Schema } from "effect";
import { GameContent, SessionOptions } from "./contracts";
import { InvalidContent, InvalidSessionOptions } from "./errors";

const decodeContent = Schema.decodeUnknownEffect(GameContent);
const decodeOptions = Schema.decodeUnknownEffect(SessionOptions);

export class ContentCatalog extends Context.Service<ContentCatalog, GameContent>()(
  "@pop/simulation/ContentCatalog",
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

export class SessionConfig extends Context.Service<SessionConfig, SessionOptions>()(
  "@pop/simulation/SessionConfig",
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
