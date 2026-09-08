import * as stylex from "@stylexjs/stylex";
import { colors, fontSizes } from "./tokens.stylex";

export function Feedback({ error, message = "" }: { error: string | null; message?: string }) {
  return (
    <div {...stylex.props(styles.feedback)} aria-live="polite">
      <span {...stylex.props(styles.error)} role="alert">
        {error}
      </span>
      {!error && <span>{message}</span>}
    </div>
  );
}

const styles = stylex.create({
  feedback: {
    minHeight: 44,
    paddingBlock: "12px",
    paddingInline: "0",
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  error: { color: colors.textError },
});
