import * as stylex from "@stylexjs/stylex";
import { useSyncExternalStore } from "react";
import { gameContent } from "@pop/content";
import { StartScreen } from "../features/characters/start-screen";
import { Gameplay } from "../game/gameplay";
import { client } from "../game/session";

export function Home() {
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot);
  if (snapshot.world)
    return <Gameplay client={client} world={snapshot.world} error={snapshot.error} />;
  return (
    <div {...stylex.props(styles.start)}>
      <StartScreen client={client} error={snapshot.error} zone={gameContent.world.zone} />
    </div>
  );
}

const styles = stylex.create({
  start: {
    maxWidth: 1240,
    minHeight: "100dvh",
    marginInline: "auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
  },
});
