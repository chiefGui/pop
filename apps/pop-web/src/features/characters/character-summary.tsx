import * as stylex from "@stylexjs/stylex";
import type { CharacterView } from "@pop/simulation";
import { typography } from "../../ui/typography";
import { colors } from "../../ui/theme.stylex";

export function CharacterSummary({ character }: { character: CharacterView }) {
  return (
    <section {...stylex.props(styles.strip)} aria-label="Your character">
      <div {...stylex.props(styles.identity)}>
        <div {...stylex.props(styles.avatar)} aria-hidden="true">
          {character.name.slice(0, 1).toUpperCase()}
        </div>
        <div {...stylex.props(styles.name)}>
          <span {...stylex.props(typography.eyebrow)}>Your character</span>
          <strong {...stylex.props(styles.nameText)}>{character.name}</strong>
        </div>
      </div>
      <div {...stylex.props(styles.resource)}>
        <span {...stylex.props(styles.label)}>Reputation</span>
        <strong {...stylex.props(styles.value)}>{character.reputation}</strong>
      </div>
      <div {...stylex.props(styles.resource)}>
        <span {...stylex.props(styles.label)}>Popularity</span>
        <strong {...stylex.props(styles.value)}>{character.popularity}</strong>
      </div>
      <div {...stylex.props(styles.resource)}>
        <span {...stylex.props(styles.label)}>Influence available</span>
        <strong {...stylex.props(styles.value, styles.influence)}>
          {character.availableInfluence}
          <small {...stylex.props(styles.total)}> / {character.influence}</small>
        </strong>
      </div>
    </section>
  );
}

const styles = stylex.create({
  strip: {
    display: "grid",
    gridTemplateColumns: {
      default: "1.6fr 1fr 1fr 1.1fr",
      "@media (max-width: 900px)": "1.4fr 1fr 1fr 1.1fr",
      "@media (max-width: 680px)": "repeat(3, 1fr)",
    },
    backgroundColor: colors.paper,
    border: `1px solid ${colors.line}`,
    borderRadius: 8,
    padding: {
      default: "22px 24px",
      "@media (max-width: 900px)": 18,
      "@media (max-width: 680px)": 16,
    },
    gap: { default: 20, "@media (max-width: 900px)": 14, "@media (max-width: 680px)": "18px 10px" },
  },
  identity: {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    gap: { default: 14, "@media (max-width: 900px)": 9 },
    gridColumn: { default: "auto", "@media (max-width: 680px)": "1 / -1" },
  },
  name: { minWidth: 0 },
  nameText: { display: "block", fontSize: 16, overflowWrap: "anywhere", marginTop: 4 },
  avatar: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 42,
    height: 46,
    borderRadius: 5,
    color: colors.green,
    backgroundColor: "#e8edde",
    fontSize: 22,
    fontFamily: "Georgia, serif",
  },
  resource: {
    borderLeft: { default: `1px solid ${colors.line}`, "@media (max-width: 680px)": "none" },
    paddingLeft: { default: 24, "@media (max-width: 900px)": 14, "@media (max-width: 680px)": 0 },
  },
  label: {
    display: "block",
    fontSize: { default: 11, "@media (max-width: 680px)": 10 },
    color: colors.muted,
  },
  value: { fontSize: 27, fontWeight: 550 },
  influence: { color: colors.green },
  total: { fontSize: 17, color: colors.muted, fontWeight: 400 },
});
