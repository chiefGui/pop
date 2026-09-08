import * as stylex from "@stylexjs/stylex";
import type { WorldContent } from "@pop/game";
import { gameStartDate } from "@pop/game";
import { Button } from "../../ui/button";
import { Input } from "../../ui/field";
import { Feedback } from "../../ui/feedback";
import { typography } from "../../ui/typography";
import { colors, fontSizes, fontWeights, breakpoints } from "../../ui/tokens.stylex";
import { calendarDate } from "../calendar/calendar";
import { useState } from "react";
import type { FormEvent } from "react";
import type { GameClient } from "@pop/game-client";

const styles = stylex.create({
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 28,
    color: colors.textMuted,
    fontSize: fontSizes.md,
  },
  main: {
    width: "100%",
    maxWidth: 820,
    marginTop: { default: 80, [breakpoints.upToCompact]: 60 },
    marginInline: "auto",
    marginBottom: 40,
  },
  heading: {
    fontSize: "clamp(44px, 6vw, 76px)",
    fontWeight: fontWeights.medium,
    lineHeight: 1.05,
    letterSpacing: { default: "-3.5px", [breakpoints.upToCompact]: "-2px" },
    marginBlock: "24px",
    marginInline: "0",
  },
  copy: {
    fontSize: { default: fontSizes.xxl, [breakpoints.upToCompact]: fontSizes.xl },
    lineHeight: 1.8,
    color: colors.textMuted,
    marginTop: 0,
  },
  copyBreak: { display: { default: "inline", [breakpoints.upToCompact]: "none" } },
  form: { display: "grid", gap: 16, marginTop: 38, maxWidth: 630 },
  label: {
    display: "block",
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    marginBottom: 10,
  },
  inputRow: {
    display: "flex",
    gap: 10,
    flexDirection: { default: "row", [breakpoints.upToCompact]: "column" },
  },
  field: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  input: { width: "100%" },
  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: { default: 32, [breakpoints.upToCompact]: 15 },
    listStyle: "none",
    marginTop: "36px",
    marginRight: "0",
    marginBottom: "0",
    marginLeft: "0",
    paddingTop: "28px",
    paddingRight: "0",
    paddingBottom: "0",
    paddingLeft: "0",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.border,
  },
  stepNumber: {
    display: "block",
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
    marginBottom: 10,
  },
  stepHeading: {
    fontWeight: fontWeights.semibold,
    fontSize: { default: fontSizes.xl, [breakpoints.upToCompact]: fontSizes.md },
  },
  stepCopy: {
    marginTop: "8px",
    marginRight: "0",
    marginBottom: "0",
    marginLeft: "0",
    color: colors.textMuted,
    fontSize: { default: fontSizes.md, [breakpoints.upToCompact]: fontSizes.sm },
    maxWidth: 220,
  },
  footer: { marginTop: "auto", fontSize: fontSizes.sm, color: colors.textMuted },
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
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void client.start({ givenName, familyName, birthDate });
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
          <div {...stylex.props(styles.inputRow)}>
            <div {...stylex.props(styles.field)}>
              <label {...stylex.props(styles.label)} htmlFor="given-name">
                Given name
              </label>
              <Input
                xstyle={styles.input}
                id="given-name"
                name="givenName"
                autoComplete="off"
                value={givenName}
                onChange={(event) => setGivenName(event.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div {...stylex.props(styles.field)}>
              <label {...stylex.props(styles.label)} htmlFor="family-name">
                Family name
              </label>
              <Input
                xstyle={styles.input}
                id="family-name"
                name="familyName"
                autoComplete="off"
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
                maxLength={100}
                required
              />
            </div>
          </div>
          <div>
            <label {...stylex.props(styles.label)} htmlFor="birth-date">
              Birth date
            </label>
            <Input
              id="birth-date"
              name="birthDate"
              type="date"
              min="0001-01-01"
              max={gameStartDate}
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              required
            />
          </div>
          <div>
            <Button
              type="submit"
              disabled={
                client.getSnapshot().pending ||
                !givenName.trim() ||
                !familyName.trim() ||
                !birthDate
              }
            >
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
