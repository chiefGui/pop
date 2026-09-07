import * as stylex from "@stylexjs/stylex";
import type { WorldContent } from "@pop/simulation";
import { Button } from "../../ui/button";
import { Input } from "../../ui/field";
import { Feedback } from "../../ui/feedback";
import { typography } from "../../ui/typography";
import { colors } from "../../ui/theme.stylex";
import { calendarDate } from "../calendar/calendar";
import { useState } from "react";
import type { FormEvent } from "react";
import type { GameClient } from "@pop/game-client";

const styles = stylex.create({
  brand: { display: "flex", alignItems: "center", gap: 28, color: colors.muted, fontSize: 12 },
  main: {
    width: "100%",
    maxWidth: 820,
    marginTop: { default: 80, "@media (max-width: 680px)": 60 },
    marginInline: "auto",
    marginBottom: 40,
  },
  heading: {
    fontSize: "clamp(44px, 6vw, 76px)",
    fontWeight: 540,
    lineHeight: 1.05,
    letterSpacing: { default: "-3.5px", "@media (max-width: 680px)": "-2px" },
    margin: "24px 0",
  },
  copy: {
    fontSize: { default: 16, "@media (max-width: 680px)": 14 },
    lineHeight: 1.8,
    color: colors.muted,
    marginTop: 0,
  },
  copyBreak: { display: { default: "inline", "@media (max-width: 680px)": "none" } },
  form: { marginTop: 38, maxWidth: 630 },
  label: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 10 },
  inputRow: {
    display: "flex",
    gap: 10,
    flexDirection: { default: "row", "@media (max-width: 680px)": "column" },
  },
  input: { flex: 1, minWidth: 0 },
  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: { default: 32, "@media (max-width: 680px)": 15 },
    listStyle: "none",
    margin: "36px 0 0",
    padding: "28px 0 0",
    borderTop: `1px solid ${colors.line}`,
  },
  stepNumber: { display: "block", color: "#7b8b77", fontSize: 11, marginBottom: 10 },
  stepHeading: { fontWeight: 600, fontSize: { default: 14, "@media (max-width: 680px)": 12 } },
  stepCopy: {
    margin: "8px 0 0",
    color: colors.muted,
    fontSize: { default: 12, "@media (max-width: 680px)": 11 },
    maxWidth: 220,
  },
  footer: { marginTop: "auto", fontSize: 11, color: colors.muted },
});

export function StartScreen({
  client,
  error,
  zone,
}: {
  client: GameClient;
  error: string | null;
  zone: WorldContent["zone"];
}) {
  const [name, setName] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    client.start(name);
  }
  return (
    <>
      <header {...stylex.props(styles.brand)}>
        <span {...stylex.props(typography.wordmark)}>pop.</span>
        <span>A small beginning</span>
      </header>
      <main {...stylex.props(styles.main)}>
        <div {...stylex.props(typography.eyebrow)}>01 / {zone.name}</div>
        <h1 {...stylex.props(styles.heading)}>
          Every name
          <br />
          starts somewhere.
        </h1>
        <p {...stylex.props(styles.copy)}>
          A district full of plans. People making their moves.
          <br {...stylex.props(styles.copyBreak)} /> You have one influence, no reputation, and a
          place to begin.
        </p>
        <form {...stylex.props(styles.form)} onSubmit={submit}>
          <label {...stylex.props(styles.label)} htmlFor="character-name">
            What’s your name?
          </label>
          <div {...stylex.props(styles.inputRow)}>
            <Input
              xstyle={styles.input}
              id="character-name"
              name="name"
              autoComplete="off"
              placeholder="Your character’s name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              required
            />
            <Button type="submit" disabled={!name.trim()}>
              Enter the district <span aria-hidden="true">↗</span>
            </Button>
          </div>
          <Feedback error={error} />
        </form>
        <ol {...stylex.props(styles.steps)}>
          <li>
            <span {...stylex.props(styles.stepNumber)}>01</span>
            <strong {...stylex.props(styles.stepHeading)}>Take a side</strong>
            <p {...stylex.props(styles.stepCopy)}>
              Commit influence to support or oppose a project.
            </p>
          </li>
          <li>
            <span {...stylex.props(styles.stepNumber)}>02</span>
            <strong {...stylex.props(styles.stepHeading)}>Make your name</strong>
            <p {...stylex.props(styles.stepCopy)}>Earn a share of its rewards when it resolves.</p>
          </li>
          <li>
            <span {...stylex.props(styles.stepNumber)}>03</span>
            <strong {...stylex.props(styles.stepHeading)}>Lead something</strong>
            <p {...stylex.props(styles.stepCopy)}>
              Build enough standing to start a project of your own.
            </p>
          </li>
        </ol>
      </main>
      <footer {...stylex.props(styles.footer)}>
        {zone.name} · {calendarDate(0)}
      </footer>
    </>
  );
}
