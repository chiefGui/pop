import * as stylex from "@stylexjs/stylex";
import { useState, useSyncExternalStore } from "react";
import { gameContent } from "@pop/content";
import { createGameClient } from "@pop/game-client";
import type { ProjectId, WorldView } from "@pop/simulation";
import { StartScreen } from "../features/characters/start-screen";
import { CharacterSummary } from "../features/characters/character-summary";
import { People } from "../features/characters/people";
import { TurnControl } from "../features/calendar/turn-control";
import { ProjectWorkspace } from "../features/projects/project-workspace";
import { ProjectOpportunity } from "../features/projects/project-opportunity";
import { Feedback } from "../ui/feedback";
import { typography } from "../ui/typography";
import { colors, fontSizes, fontWeights, controls, breakpoints } from "../ui/tokens.stylex";
import { gameSetup } from "./setup";

const client = createGameClient(gameContent, gameSetup);
if (import.meta.hot) import.meta.hot.dispose(() => client.dispose());

function District({
  world,
  error,
  message,
}: {
  world: WorldView;
  error: string | null;
  message: string;
}) {
  const board = client.projects.getView()!;
  const [selection, setSelection] = useState<ProjectId | "create">(
    () => world.projects[0]?.id ?? "create",
  );
  const [tab, setTab] = useState<"active" | "resolved" | "people">("active");
  const tabs = [
    { key: "active", label: "Active projects", count: board.active.length },
    { key: "resolved", label: "Resolved", count: board.resolved.length },
    { key: "people", label: "People", count: world.characters.length },
  ] as const;
  return (
    <>
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.identity)}>
          <span {...stylex.props(typography.wordmark, styles.wordmark)}>pop.</span>
          <div>
            <span {...stylex.props(typography.eyebrow, styles.eyebrow)}>
              Your corner of the world
            </span>
            <h1 {...stylex.props(styles.districtName)}>{world.zone.name}</h1>
          </div>
        </div>
        <TurnControl day={world.day} onAdvance={client.advanceDay} />
      </header>
      <CharacterSummary character={board.player} />
      <ProjectOpportunity
        client={client}
        definitions={gameContent.projects}
        onCreate={() => {
          setSelection("create");
          setTab("active");
        }}
      />
      <Feedback error={error} message={message} />
      <nav {...stylex.props(styles.tabs)} aria-label="District views">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            {...stylex.props(styles.tab, tab === key && styles.selectedTab)}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label} <span {...stylex.props(styles.count)}>{count}</span>
          </button>
        ))}
      </nav>
      {tab === "people" && <People world={world} />}
      {tab !== "people" && (
        <ProjectWorkspace
          client={client}
          board={board}
          definitions={gameContent.projects}
          day={world.day}
          filter={tab}
          selection={selection}
          onSelect={setSelection}
        />
      )}
    </>
  );
}

export function GameScreen() {
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot);
  let screen = <StartScreen client={client} error={snapshot.error} zone={gameContent.world.zone} />;
  if (snapshot.world)
    screen = <District world={snapshot.world} error={snapshot.error} message={snapshot.message} />;
  return <div {...stylex.props(styles.screen)}>{screen}</div>;
}

const styles = stylex.create({
  screen: {
    color: colors.text,
    maxWidth: 1240,
    minHeight: "100dvh",
    marginBlock: "0",
    marginInline: "auto",
    paddingTop: {
      default: 32,
      [breakpoints.fromWide]: 48,
      [breakpoints.upToMedium]: 24,
      [breakpoints.upToCompact]: 20,
    },
    paddingInline: {
      default: 40,
      [breakpoints.upToMedium]: 24,
      [breakpoints.upToCompact]: 16,
    },
    paddingBottom: {
      default: 56,
      [breakpoints.upToMedium]: 24,
      [breakpoints.upToCompact]: 36,
    },
    fontSize: fontSizes.xl,
    lineHeight: 1.5,
    fontVariantNumeric: "tabular-nums",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: { default: "center", [breakpoints.upToCompact]: "flex-start" },
    justifyContent: "space-between",
    gap: { default: 24, [breakpoints.upToCompact]: 15 },
    paddingBottom: 28,
  },
  identity: {
    display: "flex",
    alignItems: "center",
    gap: { default: 24, [breakpoints.upToMedium]: 16, [breakpoints.upToCompact]: 10 },
  },
  wordmark: { fontSize: { default: 36, [breakpoints.upToCompact]: 29 } },
  eyebrow: {
    fontSize: { default: fontSizes.xs, [breakpoints.upToMedium]: 8 },
    display: { default: "block", [breakpoints.upToCompact]: "none" },
  },
  districtName: {
    fontSize: { default: 21, [breakpoints.upToMedium]: 18, [breakpoints.upToCompact]: 17 },
    fontWeight: fontWeights.semibold,
    letterSpacing: "-0.6px",
    marginTop: "4px",
    marginRight: "0",
    marginBottom: "0",
    marginLeft: "0",
    maxWidth: { default: "none", [breakpoints.upToCompact]: 140 },
  },
  tabs: {
    display: "flex",
    gap: { default: 30, [breakpoints.upToCompact]: 22 },
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  tab: {
    paddingBlock: "13px",
    paddingInline: "0",
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
    color: colors.textMuted,
    fontSize: { default: fontSizes.lg, [breakpoints.upToCompact]: fontSizes.md },
    cursor: "default",
    outlineWidth: { default: 0, ":focus-visible": controls.focusWidth },
    outlineStyle: "solid",
    outlineColor: colors.borderFocus,
    outlineOffset: controls.focusOffset,
  },
  selectedTab: { borderBottomColor: colors.action, color: colors.text },
  count: { fontSize: fontSizes.xs, paddingLeft: 7 },
});
