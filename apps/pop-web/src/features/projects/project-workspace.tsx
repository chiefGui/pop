import { useEffect, useRef, useState } from "react";
import { Button } from "../../ui/button";
import * as stylex from "@stylexjs/stylex";
import type { GameClient, ProjectBoard } from "@pop/game-client";
import type { ProjectDefinition, ProjectId } from "@pop/game";
import { CreationPanel, ProjectDetail } from "./project-panels";
import { ProjectProgress, progressRate } from "./progress";
import { colors, fontSizes, fontWeights, controls } from "../../ui/tokens.stylex";

export function ProjectWorkspace({
  client,
  board,
  definitions,
  day,
  filter,
}: {
  client: GameClient;
  board: ProjectBoard;
  definitions: readonly ProjectDefinition[];
  day: number;
  filter: "active" | "resolved";
}) {
  const [selection, onSelect] = useState<ProjectId | "create" | null>(null);
  const navigation = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLElement>(null);
  const projectTrigger = useRef<HTMLButtonElement | null>(null);
  const listed = board[filter];
  let selected;
  if (selection && selection !== "create") selected = board.byId.get(selection);
  const showingDetail = selection === "create" || Boolean(selected);
  useEffect(() => {
    if (showingDetail) {
      navigation.current?.focus();
    } else if (projectTrigger.current) {
      if (projectTrigger.current.isConnected) projectTrigger.current.focus();
      else list.current?.focus();
    }
  }, [selection, showingDetail]);
  return (
    <>
      <div hidden={showingDetail}>
        {filter === "active" && (
          <Button
            variant="secondary"
            onClick={(event) => {
              projectTrigger.current = event.currentTarget;
              onSelect("create");
            }}
          >
            New project
          </Button>
        )}
        <aside ref={list} tabIndex={-1} {...stylex.props(styles.list)} aria-label="Projects">
          <div {...stylex.props(styles.listHeading)}>
            <span>{listed.length} projects</span>
          </div>
          {listed.length === 0 && (
            <div {...stylex.props(styles.empty)}>
              {filter === "active" && "No active projects"}
              {filter === "resolved" && "No resolved projects"}
            </div>
          )}
          {listed.map(({ project, definition, ownCommitment }) => {
            let timing = `${project.deadlineDay - day} days left`;
            if (project.status === "succeeded") timing = "Succeeded";
            if (project.status === "failed") timing = "Failed";
            return (
              <button
                key={project.id}
                {...stylex.props(styles.row)}
                onClick={(event) => {
                  projectTrigger.current = event.currentTarget;
                  onSelect(project.id);
                }}
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
      </div>
      {showingDetail && (
        <Button ref={navigation} variant="secondary" onClick={() => onSelect(null)}>
          Back
        </Button>
      )}
      {selection === "create" && (
        <CreationPanel
          client={client}
          projects={definitions}
          player={board.player}
          onCreated={onSelect}
        />
      )}
      {selected && (
        <ProjectDetail
          key={selected.project.id}
          client={client}
          details={selected}
          player={board.player}
        />
      )}
    </>
  );
}

const styles = stylex.create({
  list: { paddingTop: 16 },
  listHeading: {
    display: "flex",
    justifyContent: "space-between",
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginBottom: 12,
  },
  row: {
    display: "block",
    width: "100%",
    paddingBlock: "18px",
    paddingInline: "16px",
    textAlign: "left",
    backgroundColor: { default: "transparent", ":hover": colors.surfaceHover },
    borderWidth: 0,
    borderBottomWidth: { default: 1, ":last-child": 0 },
    borderStyle: "solid",
    borderColor: colors.border,
    color: colors.text,
    cursor: "default",

    outlineWidth: { default: 0, ":focus-visible": controls.focusWidth },
    outlineStyle: "solid",
    outlineColor: colors.borderFocus,
    outlineOffset: controls.focusOffset,
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
