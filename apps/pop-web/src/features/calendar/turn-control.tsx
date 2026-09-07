import * as stylex from "@stylexjs/stylex";
import { Button } from "../../ui/button";
import { colors, fontSizes, fontWeights, breakpoints } from "../../ui/tokens.stylex";
import { calendarDate } from "./calendar";

export function TurnControl({ day, onAdvance }: { day: number; onAdvance: () => void }) {
  return (
    <div {...stylex.props(styles.control)}>
      <div {...stylex.props(styles.date)}>
        <strong {...stylex.props(styles.label)}>{calendarDate(day)}</strong>
        <span {...stylex.props(styles.day)}>Day {day + 1}</span>
      </div>
      <Button xstyle={styles.advance} onClick={onAdvance}>
        Next day <span aria-hidden="true">→</span>
      </Button>
    </div>
  );
}

const styles = stylex.create({
  control: {
    display: "flex",
    flexDirection: { default: "row", [breakpoints.upToCompact]: "column" },
    alignItems: { default: "center", [breakpoints.upToCompact]: "flex-end" },
    gap: { default: 24, [breakpoints.upToMedium]: 12, [breakpoints.upToCompact]: 8 },
  },
  date: {
    textAlign: "right",
    display: { default: "block", [breakpoints.upToCompact]: "flex" },
    gap: 8,
    alignItems: "baseline",
  },
  label: { display: "block", fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
  day: { display: "block", fontSize: fontSizes.sm, color: colors.textMuted },
  advance: { minWidth: { default: 136, [breakpoints.upToCompact]: 126 } },
});
