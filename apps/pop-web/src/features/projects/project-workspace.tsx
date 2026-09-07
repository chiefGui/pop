import * as stylex from "@stylexjs/stylex";
import type { GameClient, ProjectBoard } from "@pop/game-client";
import type { ProjectDefinition, ProjectId } from "@pop/simulation";
import { CreationPanel, ProjectDetail } from "./project-panels";
import { ProjectProgress, progressRate } from "./progress";
import { colors } from "../../ui/theme.stylex";

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
    display: { default: "grid", "@media (max-width: 680px)": "block" },
    gridTemplateColumns: {
      default: "minmax(230px, 0.85fr) minmax(0, 1.8fr)",
      "@media (max-width: 900px)": "minmax(210px, 0.8fr) minmax(0, 1.5fr)",
    },
    alignItems: "start",
  },
  list: {
    paddingBlock: { default: 20, "@media (max-width: 680px)": 18 },
    paddingRight: { default: 22, "@media (max-width: 900px)": 16, "@media (max-width: 680px)": 0 },
    maxHeight: { default: 780, "@media (max-width: 680px)": "none" },
    overflowY: "auto",
    overflowX: "auto",
    scrollbarGutter: "stable",
    display: { default: "block", "@media (max-width: 680px)": "flex" },
    gap: 10,
  },
  listHeading: {
    display: { default: "flex", "@media (max-width: 680px)": "none" },
    justifyContent: "space-between",
    color: colors.muted,
    fontSize: 10,
    marginBottom: 12,
  },
  card: {
    display: "block",
    width: "100%",
    padding: "18px 16px",
    textAlign: "left",
    marginBottom: { default: 10, "@media (max-width: 680px)": 0 },
    backgroundColor: { default: "transparent", ":hover": "#edf0e7" },
    border: `1px solid ${colors.line}`,
    borderRadius: 6,
    color: colors.ink,
    font: "inherit",
    cursor: "default",
    flex: { default: "0 1 auto", "@media (max-width: 680px)": "0 0 225px" },
    outline: { default: null, ":focus-visible": "2px solid #60856d" },
    outlineOffset: 3,
  },
  selected: {
    backgroundColor: { default: "#edf1e6", ":hover": "#edf1e6" },
    borderColor: "#81977c",
  },
  name: { display: "block", fontWeight: 600, fontSize: 15, margin: "10px 0 14px" },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    color: colors.muted,
    fontSize: 10,
  },
  progressMeta: { marginTop: 9 },
  mine: { color: colors.green },
  empty: { padding: "30px 10px", fontSize: 12, color: colors.muted, margin: 0 },
});
