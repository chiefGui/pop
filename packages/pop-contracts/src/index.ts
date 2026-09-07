import { Schema } from "effect";

export const Greeting = Schema.Struct({
  message: Schema.String,
  visits: Schema.Int,
  sqliteVersion: Schema.NullOr(Schema.String),
});

export type Greeting = typeof Greeting.Type;

export interface DesktopApi {
  readonly getGreeting: () => Promise<Greeting>;
}
