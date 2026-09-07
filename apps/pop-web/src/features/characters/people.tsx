import * as stylex from "@stylexjs/stylex";
import { Table, TableHeading, TableCell } from "../../ui/table";
import { typography } from "../../ui/typography";
import { colors, fontSizes, radii } from "../../ui/tokens.stylex";
import type { WorldView } from "@pop/simulation";

const styles = stylex.create({
  panel: { paddingBlock: "30px", paddingInline: "0" },
  heading: { marginTop: 10 },
  description: { color: colors.textMuted, fontSize: fontSizes.md, marginTop: 0 },
  scroll: { maxHeight: 650, overflow: "auto", scrollbarGutter: "stable" },
  head: {
    position: "sticky",
    top: 0,
    backgroundColor: colors.surfaceCanvas,
    color: colors.textMuted,
  },
  cell: { padding: 14 },
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

export function People({ world }: { world: WorldView }) {
  return (
    <section {...stylex.props(styles.panel)}>
      <div {...stylex.props(typography.eyebrow)}>The neighborhood</div>
      <h2 {...stylex.props(typography.heading, styles.heading)}>People of {world.zone.name}</h2>
      <p {...stylex.props(styles.description)}>
        Everyone has their own resources. Everyone plays by the same rules.
      </p>
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
                  {character.name}
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
