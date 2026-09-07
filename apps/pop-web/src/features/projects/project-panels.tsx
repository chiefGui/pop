import { useState } from "react";
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
import { colors } from "../../ui/theme.stylex";

const styles = stylex.create({
  panel: {
    paddingTop: { default: 28, "@media (max-width: 680px)": 24 },
    paddingBottom: { default: 30, "@media (max-width: 680px)": 24 },
    paddingLeft: { default: 30, "@media (max-width: 900px)": 20, "@media (max-width: 680px)": 0 },
    borderLeft: { default: `1px solid ${colors.line}`, "@media (max-width: 680px)": "none" },
    borderTop: { default: "none", "@media (max-width: 680px)": `1px solid ${colors.line}` },
    minHeight: 620,
  },
  heading: { fontSize: { default: 28, "@media (max-width: 680px)": 26 } },
  intro: { marginTop: 0, color: colors.muted },
  fieldLabel: { display: "block", margin: "26px 0 8px", fontSize: 12 },
  description: {
    color: colors.muted,
    lineHeight: 1.75,
    maxWidth: 580,
    fontSize: 13,
    margin: "18px 0 24px",
  },
  requirements: { backgroundColor: "#edf0e7", borderRadius: 5, padding: 15 },
  requirement: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 9,
    fontSize: 12,
  },
  requirementNote: { color: colors.muted, fontSize: 10, margin: "14px 0 0" },
  facts: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: colors.muted,
    fontSize: 11,
    marginTop: 10,
  },
  form: { marginTop: 24 },
  label: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 12,
    fontWeight: 550,
    marginBottom: 9,
  },
  secondaryLabel: { color: colors.muted, fontSize: 11, fontWeight: 400 },
  actions: { display: "flex", gap: 10 },
  amount: { width: 76 },
  action: { flex: 1 },
  hint: { color: colors.muted, fontSize: 11, minHeight: 36, margin: "10px 0 0" },
  commitment: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "13px 15px",
    backgroundColor: "#eaf0e3",
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 12,
  },
  emphasis: { fontWeight: 550 },
  kicker: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 10,
    color: colors.muted,
    marginBottom: 18,
  },
  status: {
    display: "inline-block",
    fontWeight: 600,
    color: colors.green,
    backgroundColor: "#e8eddf",
    padding: "4px 8px",
    borderRadius: 3,
  },
  failed: { backgroundColor: "#efe7dd", color: "#79593d" },
  byline: { color: colors.muted, fontSize: 12, margin: "0 0 22px" },
  creator: { fontWeight: 550, color: colors.ink },
  progressHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "baseline",
    marginBottom: 10,
  },
  progressValue: { fontSize: 22, fontWeight: 600 },
  progressTarget: { fontSize: 12, color: colors.muted, fontWeight: 400 },
  rate: { fontSize: 12, color: colors.green },
  note: { color: colors.muted, fontSize: 11, lineHeight: 1.6, margin: "12px 0 20px" },
  resolution: {
    backgroundColor: "#eaf0e3",
    borderRadius: 5,
    padding: 16,
    marginTop: 20,
    fontSize: 12,
  },
  payout: { margin: "6px 0 0" },
  participants: { borderTop: `1px solid ${colors.line}`, marginTop: 20, paddingTop: 16 },
  summary: {
    fontSize: 12,
    color: colors.muted,
    padding: "4px 0",
    outline: { default: null, ":focus-visible": "2px solid #60856d" },
    outlineOffset: 3,
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
      <section {...stylex.props(styles.panel)} aria-labelledby="creation-heading">
        <h2 {...stylex.props(typography.heading, styles.heading)} id="creation-heading">
          No project types available
        </h2>
      </section>
    );
  }
  const error = client.projects.checkCreation(definitionId, amount);
  return (
    <section {...stylex.props(styles.panel)} aria-labelledby="creation-heading">
      <div {...stylex.props(typography.eyebrow)}>Your next step</div>
      <h2 {...stylex.props(typography.heading, styles.heading)} id="creation-heading">
        Put your name on it.
      </h2>
      <p {...stylex.props(styles.intro)}>Lead a project. Build the support to see it through.</p>
      <label {...stylex.props(styles.fieldLabel)} htmlFor="project-type">
        Project
      </label>
      <Select
        id="project-type"
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
        <p {...stylex.props(styles.requirementNote)}>
          Requirements unlock access. These resources are not spent.
        </p>
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
        <label {...stylex.props(styles.label)} htmlFor="founding-influence">
          Founding influence
        </label>
        <div {...stylex.props(styles.actions)}>
          <Input
            xstyle={styles.amount}
            id="founding-influence"
            type="number"
            min={1}
            max={player.availableInfluence}
            step={1}
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            aria-describedby="creation-hint"
          />
          <Button xstyle={styles.action} type="submit" disabled={Boolean(error)}>
            Start project
          </Button>
        </div>
        <p {...stylex.props(styles.hint)} id="creation-hint">
          {error || "Your influence supports the project and returns when it resolves."}
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
  const [amountInput, setAmountInput] = useState("1");
  const amount = Number(amountInput);
  const { project, definition, creator, ownCommitment: own } = details;
  const supportError = client.projects.checkCommitment(project.id, "support", amount);
  const opposeError = client.projects.checkCommitment(project.id, "oppose", amount);
  let actionHint = "Choose a side. You can add influence, but cannot withdraw or switch sides.";
  if (supportError && opposeError) actionHint = supportError;
  if (player.availableInfluence === 0)
    actionHint = "Your influence is committed. Advance days to resolve projects and recover it.";
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
    <section {...stylex.props(styles.panel)} aria-labelledby="project-heading">
      <div {...stylex.props(styles.kicker)}>
        <span {...stylex.props(styles.status, project.status === "failed" && styles.failed)}>
          {status}
        </span>
        <span>Started {calendarDate(project.startedDay)}</span>
      </div>
      <h2 {...stylex.props(typography.heading, styles.heading)} id="project-heading">
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
      {project.status === "active" && (
        <p {...stylex.props(styles.note)}>
          Net support changes progress each day. Reach {definition.progressTarget} by the deadline
          to succeed.
        </p>
      )}
      <RewardTable definition={definition} />
      <p {...stylex.props(styles.note)}>
        Each side shares its pool by influence × days committed. The creator earns an additional
        bonus.
      </p>
      {ownShare}
      {project.status === "active" && (
        <div {...stylex.props(styles.form)}>
          <label {...stylex.props(styles.label)} htmlFor="commit-influence">
            Influence to commit{" "}
            <span {...stylex.props(styles.secondaryLabel)}>
              {player.availableInfluence} available
            </span>
          </label>
          <div {...stylex.props(styles.actions)}>
            <Input
              xstyle={styles.amount}
              id="commit-influence"
              type="number"
              min={1}
              max={player.availableInfluence}
              step={1}
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              aria-describedby="commitment-hint"
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
          <p {...stylex.props(styles.hint)} id="commitment-hint">
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
