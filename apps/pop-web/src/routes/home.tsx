import * as stylex from "@stylexjs/stylex";
import { Greeting } from "@pop/contracts";
import { useQuery } from "@tanstack/react-query";
import { Effect, Schema } from "effect";

const getGreeting = Effect.fn("web.getGreeting")(function* () {
  const data = window.pop
    ? yield* Effect.tryPromise(() => window.pop!.getGreeting())
    : { message: "Hello, world!", visits: 0, sqliteVersion: null };
  return yield* Schema.decodeUnknownEffect(Greeting)(data);
});

const styles = stylex.create({
  eyebrow: { color: "#66706c", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" },
  title: { fontSize: 56, lineHeight: 1.05, letterSpacing: "-3px", marginBlock: "20px 16px" },
  description: { color: "#66706c", lineHeight: 1.7 },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBlock: 32,
    border: "1px solid #e4e7e2",
  },
  label: { color: "#66706c", fontSize: 13, margin: 0 },
  value: { fontSize: 28, fontWeight: 600, marginBlock: "8px 0" },
  button: {
    backgroundColor: { default: "#263e33", ":hover": "#345441" },
    color: "white",
    borderWidth: 0,
    borderRadius: 8,
    padding: "12px 18px",
    cursor: "pointer",
    opacity: { default: 1, ":disabled": 0.6 },
  },
  error: { color: "#a32929" },
});

export function Home() {
  const greeting = useQuery({
    queryKey: ["greeting"],
    queryFn: ({ signal }) => Effect.runPromise(getGreeting(), { signal }),
  });

  return (
    <section>
      <p {...stylex.props(styles.eyebrow)}>
        {window.pop ? "Desktop" : "Browser preview"} / Hello, Pop
      </p>
      <h1 {...stylex.props(styles.title)}>{greeting.data?.message ?? "Hello, world!"}</h1>
      <p {...stylex.props(styles.description)}>A small beginning. Make something great.</p>
      <div {...stylex.props(styles.panel)} aria-live="polite">
        {greeting.isPending ? (
          <p>Loading greeting…</p>
        ) : greeting.isError ? (
          <p role="alert" {...stylex.props(styles.error)}>
            Could not load the greeting. {greeting.error.message}
          </p>
        ) : greeting.data.sqliteVersion ? (
          <>
            <p {...stylex.props(styles.label)}>Saved desktop launches</p>
            <p {...stylex.props(styles.value)}>{greeting.data.visits}</p>
            <p {...stylex.props(styles.description)}>
              Stored locally with SQLite {greeting.data.sqliteVersion}.
            </p>
          </>
        ) : (
          <p {...stylex.props(styles.description)}>
            The web preview is ready. Open the desktop app to try local persistence.
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={greeting.isFetching}
        onClick={() => void greeting.refetch()}
        {...stylex.props(styles.button)}
      >
        {greeting.isFetching ? "Loading…" : "Refresh greeting"}
      </button>
    </section>
  );
}
