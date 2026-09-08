import * as stylex from "@stylexjs/stylex";
import { colors } from "../../ui/tokens.stylex";

export function CharacterPortrait() {
  return (
    <svg
      viewBox="0 0 120 144"
      aria-hidden="true"
      focusable="false"
      {...stylex.props(styles.portrait)}
    >
      <circle cx="60" cy="47" r="24" fill="currentColor" />
      <path d="M12 144v-22c0-27 21-43 48-43s48 16 48 43v22Z" fill="currentColor" />
    </svg>
  );
}

const styles = stylex.create({
  portrait: {
    display: "block",
    width: "100%",
    height: "100%",
    color: colors.textSubtle,
    backgroundColor: colors.surfaceSubtle,
  },
});
