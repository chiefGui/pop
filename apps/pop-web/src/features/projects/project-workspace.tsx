import * as stylex from "@stylexjs/stylex";
import type { GameClient, ProjectBoard } from "@pop/game-client";
import type { ProjectDefinition, ProjectId } from "@pop/simulation";
import { CreationPanel, ProjectDetail } from "./project-panels";
import { ProjectProgress, progressRate } from "./progress";
import {
  colors,
  fontSizes,
  fontWeights,
  radii,
  controls,
  breakpoints,
} from "../../ui/tokens.stylex";

export function ProjectWorkspace({
  client,
  board,
  definitions,
  day,
  filter,
  selection,
  onSelect,
}: {
  client: GameClient;
  board: ProjectBoard;
  definitions: readonly ProjectDefinition[];
  day: number;
  filter: "active" | "resolved";
  selection: ProjectId | "create";
  onSelect: (id: ProjectId) => void;
}) {
  const listed = board[filter];
  let selected;
  if (selection !== "create") selected = board.byId.get(selection);
  return (
    <main {...stylex.props(styles.workspace)}>
      <aside {...stylex.props(styles.list)} aria-label="Projects">
        <div {...stylex.props(styles.listHeading)}>
          <span>{listed.length} projects</span>
          {filter === "resolved" && <span>Recent outcomes</span>}
        </div>
        {listed.length === 0 && (
          <div {...stylex.props(styles.empty)}>
            {filter === "active" && "No active projects. Start one when you meet its requirements."}
            {filter === "resolved" && "Outcomes will appear here as projects resolve."}
          </div>
        )}
        {listed.map(({ project, definition, ownCommitment }) => {
          let timing = `${project.deadlineDay - day} days left`;
          if (project.status === "succeeded") timing = "Succeeded";
          if (project.status === "failed") timing = "Failed";
          return (
            <button
              key={project.id}
              {...stylex.props(styles.card, selection === project.id && styles.selected)}
              aria-pressed={selection === project.id}
              onClick={() => onSelect(project.id)}
            >
              <span {...stylex.props(styles.meta)}>
                <span>{timing}</span>
                {ownCommitment && (
                  <span {...stylex.props(styles.mine)}>
                    Your {ownCommitment.influence} influence
                  </span>
                )}
              </span>
              <strong {...stylex.props(styles.name)}>{definition.name}</strong>
              <ProjectProgress
                value={project.progress}
                target={definition.progressTarget}
                label={`${definition.name} progress`}
              />
              <span {...stylex.props(styles.meta, styles.progressMeta)}>
                <span>
                  {project.progress} / {definition.progressTarget}
                </span>
                {project.status === "active" && (
                  <span>{progressRate(project.support - project.opposition)}</span>
                )}
              </span>
            </button>
          );
        })}
      </aside>
      {selection === "create" && (
        <CreationPanel
          client={client}
          projects={definitions}
          player={board.player}
          onCreated={onSelect}
        />
      )}
      {selection !== "create" && selected && (
        <ProjectDetail
          key={selected.project.id}
          client={client}
          details={selected}
          player={board.player}
        />
      )}
      {selection !== "create" && !selected && (
        <p {...stylex.props(styles.empty)}>Select a project to inspect it.</p>
      )}
    </main>
  );
}

const styles = stylex.create({
  workspace: {
    display: { default: "grid", [breakpoints.upToCompact]: "block" },
    gridTemplateColumns: {
      default: "minmax(230px, 0.85fr) minmax(0, 1.8fr)",
      [breakpoints.upToMedium]: "minmax(210px, 0.8fr) minmax(0, 1.5fr)",
    },
    alignItems: "start",
  },
  list: {
    paddingBlock: { default: 20, [breakpoints.upToCompact]: 18 },
    paddingRight: { default: 22, [breakpoints.upToMedium]: 16, [breakpoints.upToCompact]: 0 },
    maxHeight: { default: 780, [breakpoints.upToCompact]: "none" },
    overflowY: "auto",
    overflowX: "auto",
    scrollbarGutter: "stable",
    display: { default: "block", [breakpoints.upToCompact]: "flex" },
    gap: 10,
  },
  listHeading: {
    display: { default: "flex", [breakpoints.upToCompact]: "none" },
    justifyContent: "space-between",
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginBottom: 12,
  },
  card: {
    display: "block",
    width: "100%",
    paddingBlock: "18px",
    paddingInline: "16px",
    textAlign: "left",
    marginBottom: { default: 10, [breakpoints.upToCompact]: 0 },
    backgroundColor: { default: "transparent", ":hover": colors.surfaceHover },
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radii.md,
    color: colors.text,
    cursor: "default",
    flex: { default: "0 1 auto", [breakpoints.upToCompact]: "0 0 225px" },
    outlineWidth: { default: 0, ":focus-visible": controls.focusWidth },
    outlineStyle: "solid",
    outlineColor: colors.borderFocus,
    outlineOffset: controls.focusOffset,
  },
  selected: {
    backgroundColor: { default: colors.surfaceSelected, ":hover": colors.surfaceSelected },
    borderColor: colors.borderSelected,
  },
  name: {
    display: "block",
    fontWeight: fontWeights.semibold,
    fontSize: 15,
    marginTop: "10px",
    marginRight: "0",
    marginBottom: "14px",
    marginLeft: "0",
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  progressMeta: { marginTop: 9 },
  mine: { color: colors.textAccent },
  empty: {
    paddingBlock: "30px",
    paddingInline: "10px",
    fontSize: fontSizes.md,
    color: colors.textMuted,
    margin: 0,
  },
});
