import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { colors } from "./theme.stylex";

export function Button({
  variant = "primary",
  xstyle,
  ...props
}: Omit<ComponentProps<"button">, "className" | "style"> & {
  variant?: "primary" | "secondary";
  xstyle?: stylex.StyleXStyles;
}) {
  return <button {...props} {...stylex.props(styles.button, styles[variant], xstyle)} />;
}

const styles = stylex.create({
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    border: "1px solid transparent",
    borderRadius: 6,
    padding: "11px 18px",
    minHeight: 44,
    font: "inherit",
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: "default",
    opacity: { default: 1, ":disabled": 0.43 },
    outline: { default: null, ":focus-visible": "2px solid #60856d" },
    outlineOffset: 3,
  },
  primary: {
    color: "#fff",
    backgroundColor: { default: colors.green, ":hover:not(:disabled)": "#244333" },
  },
  secondary: {
    color: colors.green,
    borderColor: "#bbc7bb",
    backgroundColor: { default: "transparent", ":hover:not(:disabled)": "#e9eee4" },
  },
});
