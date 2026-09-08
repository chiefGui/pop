import * as stylex from "@stylexjs/stylex";
import { colors, fontSizes, fontWeights } from "./tokens.stylex";

export const typography = stylex.create({
  wordmark: {
    fontSize: 36,
    fontWeight: fontWeights.black,
    letterSpacing: "-2px",
    lineHeight: 1,
    color: colors.text,
  },
  eyebrow: {
    display: "block",
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    textTransform: "uppercase",
    letterSpacing: "1.7px",
    color: colors.textMuted,
  },
  heading: {
    fontSize: 28,
    fontWeight: fontWeights.medium,
    lineHeight: 1.2,
    letterSpacing: "-1px",
    marginTop: "0",
    marginRight: "0",
    marginBottom: "10px",
    marginLeft: "0",
  },
  muted: { color: colors.textMuted },
});
