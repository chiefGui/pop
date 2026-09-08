import { useId, useState } from "react";
import type { ReactNode } from "react";
import type { GameClient, ProjectDetails } from "@pop/game-client";
import type { CharacterView, ProjectDefinition, ProjectId } from "@pop/simulation";
import * as stylex from "@stylexjs/stylex";
import { calendarDate } from "../calendar/calendar";
import { ProjectProgress, progressRate } from "./progress";
import { RewardTable, rewardText } from "./rewards";
import { Button } from "../../ui/button";
import { Input, Select } from "../../ui/field";
import { Table, TableHeading, TableCell } from "../../ui/table";
import { typography } from "../../ui/typography";
import {
  colors,
  fontSizes,
  fontWeights,
  radii,
  controls,
  breakpoints,
} from "../../ui/tokens.stylex";

const styles = stylex.create({
  panel: { paddingTop: 20 },
  heading: { fontSize: { default: 28, [breakpoints.upToCompact]: 26 } },
  fieldLabel: {
    display: "block",
    marginTop: "26px",
    marginRight: "0",
    marginBottom: "8px",
    marginLeft: "0",
    fontSize: fontSizes.md,
  },
  description: {
    color: colors.textMuted,
    lineHeight: 1.75,
    maxWidth: 580,
    fontSize: fontSizes.lg,
    marginTop: "18px",
    marginRight: "0",
    marginBottom: "24px",
    marginLeft: "0",
  },
  requirements: { backgroundColor: colors.surfaceSubtle, borderRadius: radii.sm, padding: 15 },
  requirement: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 9,
    fontSize: fontSizes.md,
  },
  facts: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginTop: 10,
  },
  form: { marginTop: 24 },
  label: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    marginBottom: 9,
  },
  secondaryLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 10 },
  amount: { width: 76 },
  action: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  hint: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    minHeight: 36,
    marginTop: "10px",
    marginRight: "0",
    marginBottom: "0",
    marginLeft: "0",
  },
  commitment: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingBlock: "13px",
    paddingInline: "15px",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    marginBottom: 20,
    fontSize: fontSizes.md,
  },
  emphasis: { fontWeight: fontWeights.medium },
  kicker: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: 18,
  },
  status: {
    display: "inline-block",
    fontWeight: fontWeights.semibold,
    color: colors.textAccent,
    backgroundColor: colors.surfaceSubtle,
    paddingBlock: "4px",
    paddingInline: "8px",
    borderRadius: radii.xs,
  },
  succeeded: { backgroundColor: colors.surfacePositive, color: colors.textPositive },
  failed: { backgroundColor: colors.surfaceNegative, color: colors.textNegative },
  byline: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    marginTop: "0",
    marginRight: "0",
    marginBottom: "22px",
    marginLeft: "0",
  },
  creator: { fontWeight: fontWeights.medium, color: colors.text },
  progressHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "baseline",
    marginBottom: 10,
  },
  progressValue: { fontSize: 22, fontWeight: fontWeights.semibold },
  progressTarget: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    fontWeight: fontWeights.regular,
  },
  rate: { fontSize: fontSizes.md, color: colors.textAccent },
  resolution: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    padding: 16,
    marginTop: 20,
    fontSize: fontSizes.md,
  },
  payout: { marginTop: "6px", marginRight: "0", marginBottom: "0", marginLeft: "0" },
  participants: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.border,
    marginTop: 20,
    paddingTop: 16,
  },
  summary: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    paddingBlock: "4px",
    paddingInline: "0",
    outlineWidth: { default: 0, ":focus-visible": controls.focusWidth },
    outlineStyle: "solid",
    outlineColor: colors.borderFocus,
    outlineOffset: controls.focusOffset,
  },
  count: { float: "right" },
  participantsScroll: { overflow: "auto", maxHeight: 260, marginTop: 10 },
});

export function CreationPanel({
  client,
  projects,
  player,
  onCreated,
}: {
  client: GameClient;
  projects: readonly ProjectDefinition[];
  player: CharacterView;
  onCreated: (projectId: ProjectId) => void;
}) {
  const instanceId = useId();
  const [definitionId, setDefinitionId] = useState(
    () =>
      projects.find((entry) => !client.projects.checkCreation(entry.id, 1))?.id ??
      projects[0]?.id ??
      "",
  );
  const [amountInput, setAmountInput] = useState("1");
  const amount = Number(amountInput);
  const definition = projects.find((entry) => entry.id === definitionId);
  if (!definition) {
    return (
      <section {...stylex.props(styles.panel)} aria-labelledby={`creation-heading-${instanceId}`}>
        <h2
          {...stylex.props(typography.heading, styles.heading)}
          id={`creation-heading-${instanceId}`}
        >
          No project types available
        </h2>
      </section>
    );
  }
  const error = client.projects.checkCreation(definitionId, amount);
  return (
    <section {...stylex.props(styles.panel)} aria-labelledby={`creation-heading-${instanceId}`}>
      <h2
        {...stylex.props(typography.heading, styles.heading)}
        id={`creation-heading-${instanceId}`}
      >
        New project
      </h2>
      <label {...stylex.props(styles.fieldLabel)} htmlFor={`project-type-${instanceId}`}>
        Project
      </label>
      <Select
        id={`project-type-${instanceId}`}
        value={definitionId}
        onChange={(event) => setDefinitionId(event.target.value)}
      >
        {projects.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name}
          </option>
        ))}
      </Select>
      <p {...stylex.props(styles.description)}>{definition.description}</p>
      <div {...stylex.props(styles.requirements)}>
        <div {...stylex.props(styles.requirement)}>
          <span>Reputation required</span>
          <strong>
            {player.reputation} / {definition.requirements.reputation}
          </strong>
        </div>
        <div {...stylex.props(styles.requirement)}>
          <span>Popularity required</span>
          <strong>
            {player.popularity} / {definition.requirements.popularity}
          </strong>
        </div>
      </div>
      <div {...stylex.props(styles.facts)}>
        <span>{definition.progressTarget} progress to succeed</span>
        <span>{definition.durationDays} days to deliver</span>
      </div>
      <RewardTable definition={definition} />
      <form
        {...stylex.props(styles.form)}
        onSubmit={(event) => {
          event.preventDefault();
          const projectId = client.projects.create(definitionId, amount);
          if (projectId) onCreated(projectId);
        }}
      >
        <label {...stylex.props(styles.label)} htmlFor={`founding-influence-${instanceId}`}>
          Founding influence
        </label>
        <div {...stylex.props(styles.actions)}>
          <Input
            xstyle={styles.amount}
            id={`founding-influence-${instanceId}`}
            type="number"
            min={1}
            max={player.availableInfluence}
            step={1}
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            aria-describedby={`creation-hint-${instanceId}`}
          />
          <Button xstyle={styles.action} type="submit" disabled={Boolean(error)}>
            Start project
          </Button>
        </div>
        <p {...stylex.props(styles.hint)} id={`creation-hint-${instanceId}`}>
          {error || "Influence returns at resolution."}
        </p>
      </form>
    </section>
  );
}

export function ProjectDetail({
  client,
  details,
  player,
}: {
  client: GameClient;
  details: ProjectDetails;
  player: CharacterView;
}) {
  const instanceId = useId();
  const [amountInput, setAmountInput] = useState("1");
  const amount = Number(amountInput);
  const { project, definition, creator, ownCommitment: own } = details;
  const supportError = client.projects.checkCommitment(project.id, "support", amount);
  const opposeError = client.projects.checkCommitment(project.id, "oppose", amount);
  let actionHint = "Influence locked until resolution.";
  if (supportError && opposeError) actionHint = supportError;
  if (player.availableInfluence === 0) actionHint = "No influence available.";
  let ownShare: ReactNode;
  if (own) {
    let share = "Share starts accruing next day";
    if (details.ownShare !== undefined)
      share = `${Math.round(100 * details.ownShare)}% of your side’s weight`;
    let sideLabel = "Supporting";
    if (own.side === "oppose") sideLabel = "Opposing";
    ownShare = (
      <div {...stylex.props(styles.commitment)}>
        <strong {...stylex.props(styles.emphasis)}>
          {sideLabel} with {own.influence} influence
        </strong>
        <span {...stylex.props(styles.secondaryLabel)}>
          {own.influenceDays} influence-days · {share}
        </span>
      </div>
    );
  }
  let status = "In progress";
  if (project.status === "succeeded") status = "Succeeded";
  if (project.status === "failed") status = "Failed";
  return (
    <section {...stylex.props(styles.panel)} aria-labelledby={`project-heading-${instanceId}`}>
      <div {...stylex.props(styles.kicker)}>
        <span
          {...stylex.props(
            styles.status,
            project.status === "succeeded" && styles.succeeded,
            project.status === "failed" && styles.failed,
          )}
        >
          {status}
        </span>
        <span>Started {calendarDate(project.startedDay)}</span>
      </div>
      <h2
        {...stylex.props(typography.heading, styles.heading)}
        id={`project-heading-${instanceId}`}
      >
        {definition.name}
      </h2>
      <p {...stylex.props(styles.byline)}>
        Led by <strong {...stylex.props(styles.creator)}>{creator.name}</strong>
      </p>
      <p {...stylex.props(styles.description)}>{definition.description}</p>
      <div {...stylex.props(styles.progressHeading)}>
        <strong {...stylex.props(styles.progressValue)}>
          {project.progress}
          <span {...stylex.props(styles.progressTarget)}>
            {" "}
            / {definition.progressTarget} progress
          </span>
        </strong>
        {project.status === "active" && (
          <span {...stylex.props(styles.rate)}>
            {progressRate(project.support - project.opposition)}
          </span>
        )}
      </div>
      <ProjectProgress
        value={project.progress}
        target={definition.progressTarget}
        label="Project progress"
      />
      <div {...stylex.props(styles.facts)}>
        <span>
          {project.support} supporting · {project.opposition} opposing
        </span>
        <span>Deadline {calendarDate(project.deadlineDay)}</span>
      </div>
      <RewardTable definition={definition} />
      {ownShare}
      {project.status === "active" && (
        <div {...stylex.props(styles.form)}>
          <label {...stylex.props(styles.label)} htmlFor={`commit-influence-${instanceId}`}>
            Influence to commit{" "}
            <span {...stylex.props(styles.secondaryLabel)}>
              {player.availableInfluence} available
            </span>
          </label>
          <div {...stylex.props(styles.actions)}>
            <Input
              xstyle={styles.amount}
              id={`commit-influence-${instanceId}`}
              type="number"
              min={1}
              max={player.availableInfluence}
              step={1}
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              aria-describedby={`commitment-hint-${instanceId}`}
            />
            <Button
              xstyle={styles.action}
              disabled={Boolean(supportError)}
              onClick={() => client.projects.commit(project.id, "support", amount)}
            >
              Support
            </Button>
            <Button
              variant="secondary"
              xstyle={styles.action}
              disabled={Boolean(opposeError)}
              onClick={() => client.projects.commit(project.id, "oppose", amount)}
            >
              Oppose
            </Button>
          </div>
          <p {...stylex.props(styles.hint)} id={`commitment-hint-${instanceId}`}>
            {actionHint}
          </p>
        </div>
      )}
      {project.status !== "active" && (
        <div {...stylex.props(styles.resolution)}>
          <strong>Resolved {calendarDate(project.resolvedDay)}. All influence returned.</strong>
          {project.payouts
            .filter((entry) => entry.characterId === player.id)
            .map((entry) => (
              <p {...stylex.props(styles.payout)} key={entry.characterId}>
                Your reward:{" "}
                {rewardText({
                  reputation: entry.participation.reputation + entry.creator.reputation,
                  popularity: entry.participation.popularity + entry.creator.popularity,
                })}
                .
              </p>
            ))}
        </div>
      )}
      <details {...stylex.props(styles.participants)}>
        <summary {...stylex.props(styles.summary)}>
          Participants <span {...stylex.props(styles.count)}>{project.commitments.length}</span>
        </summary>
        <div {...stylex.props(styles.participantsScroll)}>
          <Table>
            <thead {...stylex.props(typography.muted)}>
              <tr>
                <TableHeading scope="col">Name</TableHeading>
                <TableHeading scope="col">Side</TableHeading>
                <TableHeading scope="col">Influence</TableHeading>
                <TableHeading scope="col">Days × influence</TableHeading>
              </tr>
            </thead>
            <tbody>
              {details.participants.map(({ commitment: entry, character }) => (
                <tr key={entry.characterId}>
                  <TableCell>{character.name}</TableCell>
                  <TableCell>{entry.side}</TableCell>
                  <TableCell>{entry.influence}</TableCell>
                  <TableCell>{entry.influenceDays}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </details>
    </section>
  );
}
