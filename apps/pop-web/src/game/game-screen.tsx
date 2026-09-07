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
import { colors } from "../ui/theme.stylex";
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
    color: colors.ink,
    maxWidth: 1240,
    minHeight: "100dvh",
    margin: "0 auto",
    paddingTop: {
      default: 32,
      "@media (min-width: 1600px)": 48,
      "@media (max-width: 900px)": 24,
      "@media (max-width: 680px)": 20,
    },
    paddingInline: {
      default: 40,
      "@media (max-width: 900px)": 24,
      "@media (max-width: 680px)": 16,
    },
    paddingBottom: {
      default: 56,
      "@media (max-width: 900px)": 24,
      "@media (max-width: 680px)": 36,
    },
    fontSize: 14,
    lineHeight: 1.5,
    fontVariantNumeric: "tabular-nums",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: { default: "center", "@media (max-width: 680px)": "flex-start" },
    justifyContent: "space-between",
    gap: { default: 24, "@media (max-width: 680px)": 15 },
    paddingBottom: 28,
  },
  identity: {
    display: "flex",
    alignItems: "center",
    gap: { default: 24, "@media (max-width: 900px)": 16, "@media (max-width: 680px)": 10 },
  },
  wordmark: { fontSize: { default: 36, "@media (max-width: 680px)": 29 } },
  eyebrow: {
    fontSize: { default: 10, "@media (max-width: 900px)": 8 },
    display: { default: "block", "@media (max-width: 680px)": "none" },
  },
  districtName: {
    fontSize: { default: 21, "@media (max-width: 900px)": 18, "@media (max-width: 680px)": 17 },
    fontWeight: 600,
    letterSpacing: "-0.6px",
    margin: "4px 0 0",
    maxWidth: { default: "none", "@media (max-width: 680px)": 140 },
  },
  tabs: {
    display: "flex",
    gap: { default: 30, "@media (max-width: 680px)": 22 },
    borderBottom: `1px solid ${colors.line}`,
  },
  tab: {
    padding: "13px 0",
    border: 0,
    borderBottom: "2px solid transparent",
    backgroundColor: "transparent",
    color: colors.muted,
    font: "inherit",
    fontSize: { default: 13, "@media (max-width: 680px)": 12 },
    cursor: "default",
    outline: { default: null, ":focus-visible": "2px solid #60856d" },
    outlineOffset: 3,
  },
  selectedTab: { borderBottomColor: colors.green, color: colors.ink },
  count: { fontSize: 10, paddingLeft: 7 },
});
