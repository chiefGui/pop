import { useState, useSyncExternalStore } from "react";
import { gameContent } from "@pop/content";
import { createGameClient } from "@pop/game-client";
import type { ProjectDetails } from "@pop/game-client";
import type { ProjectId, WorldView } from "@pop/simulation";
import { date, rateText } from "./format";
import { StartScreen } from "./start-screen";
import { CreationPanel, ProjectDetail } from "./project-panels";
import { People } from "./people";
import "./game.css";
import { gameSetup } from "../../game/setup";

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
  const player = board.player;
  const [selection, setSelection] = useState<ProjectId | "create">(
    () => world.projects[0]?.id ?? "create",
  );
  const [tab, setTab] = useState<"active" | "resolved" | "people">("active");
  const { active, resolved } = board;
  let listed: readonly ProjectDetails[] = active;
  if (tab === "resolved") listed = resolved;
  let selected: ProjectDetails | undefined;
  if (selection !== "create") selected = board.byId.get(selection);
  const firstProject = gameContent.projects[0]!;
  const eligible =
    player.reputation >= firstProject.requirements.reputation &&
    player.popularity >= firstProject.requirements.popularity;
  const led = world.projects.some((project) => project.creatorId === player.id);
  const delivered = world.projects.some(
    (project) => project.creatorId === player.id && project.status === "succeeded",
  );
  let milestone = "Make your first move";
  let milestoneCopy = `Earn ${firstProject.requirements.reputation} reputation and ${firstProject.requirements.popularity} popularity to lead a street cleanup.`;
  if (eligible) {
    milestone = "Ready to lead";
    milestoneCopy = "You have the standing to start your own street cleanup.";
  }
  if (led) {
    milestone = "A name in the district";
    milestoneCopy = "You’ve started your own project. Now build the support to deliver it.";
  }
  if (delivered) {
    milestone = "Your first project delivered";
    milestoneCopy =
      "From joining a project to leading one. Keep building your standing in the district.";
  }
  return (
    <div className="game district">
      <header className="district-header">
        <div className="district-identity">
          <span className="wordmark">pop.</span>
          <div>
            <span className="eyebrow">Your corner of the world</span>
            <h1>{world.zone.name}</h1>
          </div>
        </div>
        <div className="turn-control">
          <div>
            <strong>{date(world.day)}</strong>
            <span>Day {world.day + 1}</span>
          </div>
          <button className="button primary next-day" onClick={() => client.advanceDay()}>
            Next day <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>
      <section className="character-strip" aria-label="Your character">
        <div className="character-name">
          <div className="avatar" aria-hidden="true">
            {player.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <span className="eyebrow">Your character</span>
            <strong>{player.name}</strong>
          </div>
        </div>
        <div className="resource">
          <span>Reputation</span>
          <strong>{player.reputation}</strong>
        </div>
        <div className="resource">
          <span>Popularity</span>
          <strong>{player.popularity}</strong>
        </div>
        <div className="resource influence">
          <span>Influence available</span>
          <strong>
            {player.availableInfluence}
            <small> / {player.influence}</small>
          </strong>
        </div>
      </section>
      <div className="milestone">
        <div>
          <span className="milestone-mark" aria-hidden="true">
            ↗
          </span>
          <div>
            <strong>{milestone}</strong>
            <p>{milestoneCopy}</p>
          </div>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            setSelection("create");
            setTab("active");
          }}
        >
          Start a project
        </button>
      </div>
      <div className="feedback" aria-live="polite">
        <span className="error-message" role="alert">
          {error}
        </span>
        {!error && <span>{message}</span>}
      </div>
      <nav className="board-tabs" aria-label="District views">
        <button aria-pressed={tab === "active"} onClick={() => setTab("active")}>
          Active projects <span>{active.length}</span>
        </button>
        <button aria-pressed={tab === "resolved"} onClick={() => setTab("resolved")}>
          Resolved <span>{resolved.length}</span>
        </button>
        <button aria-pressed={tab === "people"} onClick={() => setTab("people")}>
          People <span>{world.characters.length}</span>
        </button>
      </nav>
      {tab === "people" && <People world={world} />}
      {tab !== "people" && (
        <main className="project-workspace">
          <aside className="project-list" aria-label="Projects">
            <div className="list-heading">
              <span>{listed.length} projects</span>
              {tab === "resolved" && <span>Most recent 40</span>}
            </div>
            {listed.length === 0 && (
              <div className="empty-list">
                {tab === "active" &&
                  "No active projects. Start one when you meet its requirements."}
                {tab === "resolved" && "Outcomes will appear here as projects resolve."}
              </div>
            )}
            {listed.map(({ project, definition, ownCommitment: mine }) => {
              let timing = `${project.deadlineDay - world.day} days left`;
              if (project.status === "succeeded") timing = "Succeeded";
              if (project.status === "failed") timing = "Failed";
              return (
                <button
                  key={project.id}
                  className="project-card"
                  aria-pressed={selection === project.id}
                  onClick={() => setSelection(project.id)}
                >
                  <span className="card-meta">
                    <span>{timing}</span>
                    {mine && (
                      <span className="commitment-label">Your {mine.influence} influence</span>
                    )}
                  </span>
                  <strong>{definition.name}</strong>
                  <progress
                    value={project.progress}
                    max={definition.progressTarget}
                    aria-label={`${definition.name} progress`}
                  />
                  <span className="card-meta">
                    <span>
                      {project.progress} / {definition.progressTarget}
                    </span>
                    {project.status === "active" && (
                      <span>{rateText(project.support - project.opposition)}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </aside>
          {selection === "create" && (
            <CreationPanel
              client={client}
              projects={gameContent.projects}
              player={player}
              onCreated={setSelection}
            />
          )}
          {selection !== "create" && selected && (
            <ProjectDetail
              key={selected.project.id}
              client={client}
              details={selected}
              player={player}
            />
          )}
          {selection !== "create" && !selected && (
            <div className="project-detail muted">Select a project to inspect it.</div>
          )}
        </main>
      )}
    </div>
  );
}

export function GameScreen() {
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot);
  if (!snapshot.world) return <StartScreen client={client} error={snapshot.error} />;
  return <District world={snapshot.world} error={snapshot.error} message={snapshot.message} />;
}
