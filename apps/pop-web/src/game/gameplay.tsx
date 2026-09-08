import { useRef, useState } from "react";
import { gameContent } from "@pop/content";
import type { GameClient } from "@pop/game-client";
import type { CharacterId, WorldView } from "@pop/simulation";
import { AppShell, Header, SecondaryBar, Workspace } from "../ui/shell/app-shell";
import { FeaturePanel } from "../ui/shell/feature-panel";
import { FeatureStrip } from "../ui/shell/feature-strip";
import { Button } from "../ui/button";
import { Feedback } from "../ui/feedback";
import { WorldViewport } from "../features/world/world-viewport";
import { CharacterTrigger } from "../features/characters/character-trigger";
import { CharacterProfile } from "../features/characters/character-profile";
import { People } from "../features/characters/people";
import { TimeControls } from "../features/calendar/time-controls";
import { ProjectWorkspace } from "../features/projects/project-workspace";

type Section = "projects" | "people" | "history" | "menu";

export function Gameplay({
  client,
  world,
  error,
}: {
  client: GameClient;
  world: WorldView;
  error: string | null;
}) {
  const [section, setSection] = useState<Section | null>("projects");
  const [inspectedId, setInspectedId] = useState<CharacterId | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const board = client.projects.getView()!;
  const inspected =
    world.characters.find((character) => character.id === inspectedId) ?? board.player;
  function toggle(next: Section, button: HTMLButtonElement) {
    trigger.current = button;
    setSection((current) => {
      if (current === next) return null;
      return next;
    });
  }
  function close() {
    setSection(null);
    const returnTarget = trigger.current ?? document.getElementById(`${section}-trigger`);
    returnTarget?.focus();
  }
  function closeProfile() {
    setProfileOpen(false);
  }
  function inspect(id: CharacterId) {
    setInspectedId(id);
    setProfileOpen(true);
  }
  const panels = [
    {
      id: "projects",
      label: "Projects",
      content: (
        <ProjectWorkspace
          client={client}
          board={board}
          definitions={gameContent.projects}
          day={world.day}
          filter="active"
        />
      ),
    },
    {
      id: "people",
      label: "People",
      content: <People world={world} inspectedId={inspected.id} onInspect={inspect} />,
    },
    {
      id: "history",
      label: "History",
      content: (
        <ProjectWorkspace
          client={client}
          board={board}
          definitions={gameContent.projects}
          day={world.day}
          filter="resolved"
        />
      ),
    },
  ] as const;
  return (
    <>
      <WorldViewport location={world.zone.name} />
      <AppShell>
        <Header>
          <h1>{world.zone.name}</h1>
          <Button
            variant="secondary"
            aria-expanded={section === "menu"}
            aria-controls="menu-panel"
            onClick={(event) => toggle("menu", event.currentTarget)}
          >
            Menu
          </Button>
        </Header>
        <Workspace
          portrait={
            <CharacterTrigger
              character={inspected}
              open={profileOpen}
              onOpen={() => setProfileOpen(true)}
            />
          }
        >
          <CharacterProfile
            character={inspected}
            open={profileOpen}
            onClose={closeProfile}
            onReturn={() => setInspectedId(null)}
          />
          <SecondaryBar
            controls={
              <>
                {error && <Feedback error={error} />}
                <TimeControls day={world.day} onAdvance={client.advanceDay} />
              </>
            }
          >
            {panels.map(({ id, label, content }) => (
              <FeaturePanel key={id} id={id} label={label} open={section === id} onClose={close}>
                {content}
              </FeaturePanel>
            ))}
            <FeaturePanel id="menu" label="Menu" open={section === "menu"} onClose={close}>
              <Button variant="secondary" onClick={close}>
                Resume
              </Button>
            </FeaturePanel>
            <FeatureStrip items={panels} selected={section} onSelect={toggle} />
          </SecondaryBar>
        </Workspace>
      </AppShell>
    </>
  );
}
