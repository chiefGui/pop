import * as stylex from "@stylexjs/stylex";
import { colors } from "./theme.stylex";

export const typography = stylex.create({
  wordmark: {
    fontSize: 36,
    fontWeight: 850,
    letterSpacing: "-2px",
    lineHeight: 1,
    color: colors.ink,
  },
  eyebrow: {
    display: "block",
    fontSize: 10,
    fontWeight: 650,
    textTransform: "uppercase",
    letterSpacing: "1.7px",
    color: colors.muted,
  },
  heading: {
    fontSize: 28,
    fontWeight: 570,
    lineHeight: 1.2,
    letterSpacing: "-1px",
    margin: "0 0 10px",
  },
  muted: { color: colors.muted },
});
