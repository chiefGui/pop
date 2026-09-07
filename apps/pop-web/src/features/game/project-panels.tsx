import { useState } from "react";
import type { ReactNode } from "react";
import type { GameClient } from "@pop/game-client";
import type { CharacterView, ProjectDefinition, ProjectView, WorldView } from "@pop/simulation";
import { date, rateText, rewardText } from "./format";

function RewardTable({ definition }: { definition: ProjectDefinition }) {
  return (
    <div className="reward-table-wrap">
      <table className="reward-table">
        <caption>Reward pools</caption>
        <thead>
          <tr>
            <th scope="col">Your role</th>
            <th scope="col">If it succeeds</th>
            <th scope="col">If it fails</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Support</th>
            <td>{rewardText(definition.rewards.succeeded.support)}</td>
            <td>{rewardText(definition.rewards.failed.support)}</td>
          </tr>
          <tr>
            <th scope="row">Oppose</th>
            <td>{rewardText(definition.rewards.succeeded.oppose)}</td>
            <td>{rewardText(definition.rewards.failed.oppose)}</td>
          </tr>
          <tr>
            <th scope="row">Creator bonus</th>
            <td>{rewardText(definition.rewards.succeeded.creator)}</td>
            <td>{rewardText(definition.rewards.failed.creator)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function CreationPanel({
  client,
  projects,
  player,
  onCreated,
}: {
  client: GameClient;
  projects: readonly ProjectDefinition[];
  player: CharacterView;
  onCreated: () => void;
}) {
  const [definitionId, setDefinitionId] = useState(projects[0]!.id);
  const [amountInput, setAmountInput] = useState("1");
  const amount = Number(amountInput);
  const definition = projects.find((entry) => entry.id === definitionId)!;
  const error = client.creationError(definitionId, amount);
  return (
    <section className="project-detail" aria-labelledby="creation-heading">
      <div className="eyebrow">Your next step</div>
      <h2 id="creation-heading">Put your name on it.</h2>
      <p className="muted">Lead a project. Build the support to see it through.</p>
      <label className="field-label" htmlFor="project-type">
        Project
      </label>
      <select
        id="project-type"
        value={definitionId}
        onChange={(event) => setDefinitionId(event.target.value)}
      >
        {projects.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name}
          </option>
        ))}
      </select>
      <p className="description">{definition.description}</p>
      <div className="requirements">
        <div>
          <span>Reputation required</span>
          <strong>
            {player.reputation} / {definition.requirements.reputation}
          </strong>
        </div>
        <div>
          <span>Popularity required</span>
          <strong>
            {player.popularity} / {definition.requirements.popularity}
          </strong>
        </div>
        <p>Requirements unlock access. These resources are not spent.</p>
      </div>
      <div className="project-facts">
        <span>{definition.progressTarget} progress to succeed</span>
        <span>{definition.durationDays} days to deliver</span>
      </div>
      <RewardTable definition={definition} />
      <form
        className="commit-form"
        onSubmit={(event) => {
          event.preventDefault();
          client.createProject(definitionId, amount);
          if (!client.getSnapshot().error) onCreated();
        }}
      >
        <label htmlFor="founding-influence">Founding influence</label>
        <div className="commit-actions">
          <input
            id="founding-influence"
            type="number"
            min={1}
            max={player.availableInfluence}
            step={1}
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            aria-describedby="creation-hint"
          />
          <button className="button primary" type="submit" disabled={Boolean(error)}>
            Start project
          </button>
        </div>
        <p className="action-hint" id="creation-hint">
          {error || "Your influence supports the project and returns when it resolves."}
        </p>
      </form>
    </section>
  );
}

export function ProjectDetail({
  client,
  definition,
  project,
  world,
  player,
}: {
  client: GameClient;
  definition: ProjectDefinition;
  project: ProjectView;
  world: WorldView;
  player: CharacterView;
}) {
  const [amountInput, setAmountInput] = useState("1");
  const amount = Number(amountInput);
  const people = new Map(world.characters.map((character) => [character.id, character]));
  const creator = people.get(project.creatorId)!;
  const own = project.commitments.find((entry) => entry.characterId === player.id);
  const supportError = client.commitmentError(project.id, "support", amount);
  const opposeError = client.commitmentError(project.id, "oppose", amount);
  let actionHint = "Choose a side. You can add influence, but cannot withdraw or switch sides.";
  if (supportError && opposeError) actionHint = supportError;
  if (player.availableInfluence === 0)
    actionHint = "Your influence is committed. Advance days to resolve projects and recover it.";
  let ownShare: ReactNode;
  if (own) {
    const sideWeight = project.commitments
      .filter((entry) => entry.side === own.side)
      .reduce((total, entry) => total + entry.influenceDays, 0);
    let share = "Share starts accruing next day";
    if (sideWeight > 0)
      share = `${Math.round((100 * own.influenceDays) / sideWeight)}% of your side’s weight`;
    let sideLabel = "Supporting";
    if (own.side === "oppose") sideLabel = "Opposing";
    ownShare = (
      <div className="your-commitment">
        <strong>
          {sideLabel} with {own.influence} influence
        </strong>
        <span>
          {own.influenceDays} influence-days · {share}
        </span>
      </div>
    );
  }
  let status = "In progress";
  if (project.status === "succeeded") status = "Succeeded";
  if (project.status === "failed") status = "Failed";
  return (
    <section className="project-detail" aria-labelledby="project-heading">
      <div className="detail-kicker">
        <span className={`status ${project.status}`}>{status}</span>
        <span>Started {date(project.startedDay)}</span>
      </div>
      <h2 id="project-heading">{definition.name}</h2>
      <p className="byline">
        Led by <strong>{creator.name}</strong>
      </p>
      <p className="description">{definition.description}</p>
      <div className="progress-heading">
        <strong>
          {project.progress}
          <span> / {definition.progressTarget} progress</span>
        </strong>
        {project.status === "active" && (
          <span>{rateText(project.support - project.opposition)}</span>
        )}
      </div>
      <progress
        className="project-progress"
        value={project.progress}
        max={definition.progressTarget}
        aria-label="Project progress"
      />
      <div className="project-facts">
        <span>
          {project.support} supporting · {project.opposition} opposing
        </span>
        <span>Deadline {date(project.deadlineDay)}</span>
      </div>
      {project.status === "active" && (
        <p className="rule-note">
          Net support changes progress each day. Reach {definition.progressTarget} by the deadline
          to succeed.
        </p>
      )}
      <RewardTable definition={definition} />
      <p className="rule-note">
        Each side shares its pool by influence × days committed. The creator earns an additional
        bonus.
      </p>
      {ownShare}
      {project.status === "active" && (
        <div className="commit-form">
          <label htmlFor="commit-influence">
            Influence to commit <span>{player.availableInfluence} available</span>
          </label>
          <div className="commit-actions">
            <input
              id="commit-influence"
              type="number"
              min={1}
              max={player.availableInfluence}
              step={1}
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              aria-describedby="commitment-hint"
            />
            <button
              className="button primary"
              disabled={Boolean(supportError)}
              onClick={() => client.commit(project.id, "support", amount)}
            >
              Support
            </button>
            <button
              className="button secondary"
              disabled={Boolean(opposeError)}
              onClick={() => client.commit(project.id, "oppose", amount)}
            >
              Oppose
            </button>
          </div>
          <p className="action-hint" id="commitment-hint">
            {actionHint}
          </p>
        </div>
      )}
      {project.status !== "active" && (
        <div className="resolution">
          <strong>Resolved {date(project.resolvedDay)}. All influence returned.</strong>
          {project.payouts
            .filter((entry) => entry.characterId === player.id)
            .map((entry) => (
              <p key={entry.characterId}>
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
      <details className="participants">
        <summary>
          Participants <span>{project.commitments.length}</span>
        </summary>
        <div className="participants-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Side</th>
                <th>Influence</th>
                <th>Days × influence</th>
              </tr>
            </thead>
            <tbody>
              {project.commitments.map((entry) => (
                <tr key={entry.characterId}>
                  <td>{people.get(entry.characterId)!.name}</td>
                  <td>{entry.side}</td>
                  <td>{entry.influence}</td>
                  <td>{entry.influenceDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
