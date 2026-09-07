import * as stylex from "@stylexjs/stylex";
import { colors } from "./theme.stylex";

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
  feedback: { minHeight: 44, padding: "12px 0", fontSize: 12, color: colors.muted },
  error: { color: colors.error },
});
