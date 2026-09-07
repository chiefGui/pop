import * as stylex from "@stylexjs/stylex";
import type { CharacterView } from "@pop/simulation";
import { typography } from "../../ui/typography";
import { colors, fonts, fontSizes, fontWeights, radii, breakpoints } from "../../ui/tokens.stylex";

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
      [breakpoints.upToMedium]: "1.4fr 1fr 1fr 1.1fr",
      [breakpoints.upToCompact]: "repeat(3, 1fr)",
    },
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: {
      default: "22px 24px",
      [breakpoints.upToMedium]: 18,
      [breakpoints.upToCompact]: 16,
    },
    gap: { default: 20, [breakpoints.upToMedium]: 14, [breakpoints.upToCompact]: "18px 10px" },
  },
  identity: {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    gap: { default: 14, [breakpoints.upToMedium]: 9 },
    gridColumn: { default: "auto", [breakpoints.upToCompact]: "1 / -1" },
  },
  name: { minWidth: 0 },
  nameText: { display: "block", fontSize: fontSizes.xxl, overflowWrap: "anywhere", marginTop: 4 },
  avatar: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 42,
    height: 46,
    borderRadius: radii.sm,
    color: colors.textAccent,
    backgroundColor: colors.surfaceAccent,
    fontSize: 22,
    fontFamily: fonts.display,
  },
  resource: {
    borderLeftWidth: { default: 1, [breakpoints.upToCompact]: 0 },
    borderLeftStyle: "solid",
    borderLeftColor: colors.border,
    paddingLeft: { default: 24, [breakpoints.upToMedium]: 14, [breakpoints.upToCompact]: 0 },
  },
  label: {
    display: "block",
    fontSize: { default: fontSizes.sm, [breakpoints.upToCompact]: fontSizes.xs },
    color: colors.textMuted,
  },
  value: { fontSize: 27, fontWeight: fontWeights.medium },
  influence: { color: colors.textAccent },
  total: { fontSize: 17, color: colors.textMuted, fontWeight: fontWeights.regular },
});
