import * as stylex from "@stylexjs/stylex";
import { Table, TableHeading, TableCell } from "../../ui/table";
import { Button } from "../../ui/button";
import { colors, fontSizes, radii } from "../../ui/tokens.stylex";
import type { CharacterId, WorldView } from "@pop/game";

const styles = stylex.create({
  panel: { minWidth: 0 },

  scroll: { overflowX: "auto" },
  head: {
    position: "sticky",
    top: 0,
    backgroundColor: colors.surface,
    color: colors.textMuted,
  },
  cell: { padding: 14 },
  inspected: {
    color: { default: colors.text, ":hover:not(:disabled)": colors.text },
    backgroundColor: {
      default: colors.surfaceSelected,
      ":hover:not(:disabled)": colors.surfaceSelected,
    },
  },
  you: {
    fontSize: fontSizes.xs,
    color: colors.textAccent,
    backgroundColor: colors.surfaceAccent,
    paddingBlock: "2px",
    paddingInline: "7px",
    borderRadius: radii.xs,
    marginLeft: 10,
  },
});

export function People({
  world,
  inspectedId,
  onInspect,
}: {
  world: WorldView;
  inspectedId: CharacterId;
  onInspect: (id: CharacterId) => void;
}) {
  return (
    <section {...stylex.props(styles.panel)}>
      <div {...stylex.props(styles.scroll)}>
        <Table>
          <thead {...stylex.props(styles.head)}>
            <tr>
              <TableHeading xstyle={styles.cell} scope="col">
                Name
              </TableHeading>
              <TableHeading xstyle={styles.cell} scope="col">
                Reputation
              </TableHeading>
              <TableHeading xstyle={styles.cell} scope="col">
                Popularity
              </TableHeading>
              <TableHeading xstyle={styles.cell} scope="col">
                Influence available
              </TableHeading>
            </tr>
          </thead>
          <tbody>
            {world.characters.map((character) => (
              <tr key={character.id}>
                <TableHeading xstyle={styles.cell} scope="row">
                  <Button
                    variant="secondary"
                    aria-pressed={character.id === inspectedId}
                    xstyle={character.id === inspectedId && styles.inspected}
                    onClick={() => onInspect(character.id)}
                  >
                    {character.displayName}
                  </Button>
                  {character.isPlayer && <span {...stylex.props(styles.you)}>You</span>}
                </TableHeading>
                <TableCell xstyle={styles.cell}>{character.reputation}</TableCell>
                <TableCell xstyle={styles.cell}>{character.popularity}</TableCell>
                <TableCell xstyle={styles.cell}>
                  {character.availableInfluence} / {character.influence}
                </TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
