import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { colors, fontWeights, radii, controls } from "./tokens.stylex";

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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: radii.md,
    paddingBlock: "11px",
    paddingInline: "18px",
    minHeight: controls.minHeight,
    fontWeight: fontWeights.semibold,
    whiteSpace: "nowrap",
    cursor: "default",
    opacity: { default: 1, ":disabled": controls.disabledOpacity },
    outlineWidth: { default: 0, ":focus-visible": controls.focusWidth },
    outlineStyle: "solid",
    outlineColor: colors.borderFocus,
    outlineOffset: controls.focusOffset,
  },
  primary: {
    color: colors.textOnAction,
    backgroundColor: { default: colors.action, ":hover:not(:disabled)": colors.actionHover },
  },
  secondary: {
    color: colors.action,
    borderColor: colors.borderControl,
    backgroundColor: { default: "transparent", ":hover:not(:disabled)": colors.surfaceHover },
  },
});
