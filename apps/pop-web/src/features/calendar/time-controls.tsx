import * as stylex from "@stylexjs/stylex";
import { Button } from "../../ui/button";
import { colors, fontSizes, fontWeights, breakpoints } from "../../ui/tokens.stylex";
import { calendarDate } from "./calendar";

export function TimeControls({
  day,
  pending,
  onAdvance,
}: {
  day: number;
  pending: boolean;
  onAdvance: () => void;
}) {
  return (
    <div {...stylex.props(styles.control)}>
      <div {...stylex.props(styles.date)}>
        <strong {...stylex.props(styles.label)}>{calendarDate(day)}</strong>
        <span {...stylex.props(styles.day)}>Day {day + 1}</span>
      </div>
      <Button disabled={pending} aria-busy={pending} xstyle={styles.advance} onClick={onAdvance}>
        Next day <span aria-hidden="true">→</span>
      </Button>
    </div>
  );
}

const styles = stylex.create({
  control: {
    pointerEvents: "auto",
    backgroundColor: colors.surface,
    padding: 8,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: { default: 24, [breakpoints.upToMedium]: 12, [breakpoints.upToCompact]: 8 },
  },
  date: {
    textAlign: "right",
  },
  label: { display: "block", fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
  day: { display: "block", fontSize: fontSizes.sm, color: colors.textMuted },
  advance: {
    minWidth: { default: 136, [breakpoints.upToCompact]: 104 },
    paddingInline: 12,
    gap: 8,
  },
});
