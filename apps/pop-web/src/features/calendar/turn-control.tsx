import * as stylex from "@stylexjs/stylex";
import { Button } from "../../ui/button";
import { colors } from "../../ui/theme.stylex";
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
    flexDirection: { default: "row", "@media (max-width: 680px)": "column" },
    alignItems: { default: "center", "@media (max-width: 680px)": "flex-end" },
    gap: { default: 24, "@media (max-width: 900px)": 12, "@media (max-width: 680px)": 8 },
  },
  date: {
    textAlign: "right",
    display: { default: "block", "@media (max-width: 680px)": "flex" },
    gap: 8,
    alignItems: "baseline",
  },
  label: { display: "block", fontSize: 13, fontWeight: 600 },
  day: { display: "block", fontSize: 11, color: colors.muted },
  advance: { minWidth: { default: 136, "@media (max-width: 680px)": 126 } },
});
