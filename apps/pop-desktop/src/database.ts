import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import { Greeting } from "@pop/contracts";
import { Context, Effect, Layer, ManagedRuntime, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";

const migrations = SqliteMigrator.layer({
  loader: SqliteMigrator.fromRecord({
    "0001_greeting": Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      yield* sql`CREATE TABLE greeting (id INTEGER PRIMARY KEY CHECK (id = 1), message TEXT NOT NULL, visits INTEGER NOT NULL DEFAULT 0)`;
      yield* sql`INSERT INTO greeting (id, message) VALUES (1, ${"Hello, world!"})`;
    }),
  }),
});

export class Greetings extends Context.Service<
  Greetings,
  {
    readonly get: Effect.Effect<Greeting>;
  }
>()("@pop/desktop/Greetings") {
  static readonly layer = Layer.effect(
    Greetings,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      yield* sql`UPDATE greeting SET visits = visits + 1 WHERE id = 1`;
      const get = Effect.gen(function* () {
        const rows =
          yield* sql`SELECT message, visits, sqlite_version() AS sqliteVersion FROM greeting WHERE id = 1`;
        return yield* Schema.decodeUnknownEffect(Greeting)(rows[0]);
      }).pipe(Effect.orDie, Effect.withSpan("Greetings.get"));
      return Greetings.of({ get });
    }),
  );
}

export function createAppRuntime(filename: string) {
  const database = migrations.pipe(Layer.provideMerge(SqliteClient.layer({ filename })));
  return ManagedRuntime.make(Greetings.layer.pipe(Layer.provide(database)));
}

export const readGreeting = Effect.gen(function* () {
  const greetings = yield* Greetings;
  return yield* greetings.get;
});
