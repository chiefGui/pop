import * as stylex from "@stylexjs/stylex";
import type { GameClient } from "@pop/game-client";
import type { ProjectDefinition } from "@pop/simulation";
import { Button } from "../../ui/button";
import { colors } from "../../ui/theme.stylex";

export function ProjectOpportunity({
  client,
  definitions,
  onCreate,
}: {
  client: GameClient;
  definitions: readonly ProjectDefinition[];
  onCreate: () => void;
}) {
  const available = definitions.find(
    (definition) => !client.projects.checkCreation(definition.id, 1),
  );
  const next = definitions[0];
  if (!next) return null;
  let heading = `Next project: ${next.name}`;
  let description = client.projects.checkCreation(next.id, 1);
  if (available) {
    heading = "Ready to lead";
    description = `You can start ${available.name} with 1 influence.`;
  }
  return (
    <div {...stylex.props(styles.opportunity)}>
      <div {...stylex.props(styles.copy)}>
        <span {...stylex.props(styles.mark)} aria-hidden="true">
          ↗
        </span>
        <div>
          <strong {...stylex.props(styles.heading)}>{heading}</strong>
          <p {...stylex.props(styles.description)}>{description}</p>
        </div>
      </div>
      <Button variant="secondary" xstyle={styles.action} onClick={onCreate}>
        Start a project
      </Button>
    </div>
  );
}

const styles = stylex.create({
  opportunity: {
    display: "flex",
    alignItems: { default: "center", "@media (max-width: 680px)": "flex-start" },
    justifyContent: "space-between",
    gap: 20,
    paddingTop: 22,
  },
  copy: {
    display: "flex",
    alignItems: "center",
    gap: { default: 14, "@media (max-width: 680px)": 8 },
  },
  mark: { fontSize: 24, color: colors.green },
  heading: { fontSize: 13, fontWeight: 600 },
  description: {
    margin: "2px 0 0",
    color: colors.muted,
    fontSize: { default: 12, "@media (max-width: 680px)": 11 },
  },
  action: {
    fontSize: 12,
    padding: { default: "11px 18px", "@media (max-width: 680px)": "9px 11px" },
  },
});
