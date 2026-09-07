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
    <progress {...stylex.props(styles.progress)} value={value} max={target} aria-label={label} />
  );
}

const styles = stylex.create({
  progress: {
    display: "block",
    appearance: "none",
    border: 0,
    height: 5,
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#e0e5da",
    accentColor: "#6c8663",
    "::-webkit-progress-bar": { backgroundColor: "#e0e5da" },
    "::-webkit-progress-value": { backgroundColor: "#6c8663" },
    "::-moz-progress-bar": { backgroundColor: "#6c8663" },
  },
});
