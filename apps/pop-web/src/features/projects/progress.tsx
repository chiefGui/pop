import { colors, radii } from "../../ui/tokens.stylex";
import * as stylex from "@stylexjs/stylex";

export function progressRate(value: number) {
  if (value > 0) return `+${value} / day`;
  if (value < 0) return `${value} / day`;
  return "Stalled";
}

export function ProjectProgress({
  value,
  target,
  label,
}: {
  value: number;
  target: number;
  label: string;
}) {
  return (
    <div
      {...stylex.props(styles.progress)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-label={label}
    >
      <div {...stylex.props(styles.fill(Math.max(0, Math.min(1, value / target))))} />
    </div>
  );
}

const styles = stylex.create({
  progress: {
    display: "block",
    borderWidth: 0,
    height: 5,
    width: "100%",
    borderRadius: radii.xs,
    overflow: "hidden",
    backgroundColor: colors.progressTrack,
  },
  fill: (fraction: number) => ({
    height: "100%",
    width: "100%",
    backgroundColor: colors.progressFill,
    transformOrigin: "left",
    transform: `scaleX(${fraction})`,
  }),
});
