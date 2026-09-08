import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { colors, radii, controls } from "./tokens.stylex";

export function Input({
  xstyle,
  ...props
}: Omit<ComponentProps<"input">, "className" | "style"> & { xstyle?: stylex.StyleXStyles }) {
  return <input {...props} {...stylex.props(styles.field, xstyle)} />;
}

export function Select({
  xstyle,
  ...props
}: Omit<ComponentProps<"select">, "className" | "style"> & { xstyle?: stylex.StyleXStyles }) {
  return <select {...props} {...stylex.props(styles.field, styles.select, xstyle)} />;
}

const styles = stylex.create({
  field: {
    color: colors.text,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderControl,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingBlock: "11px",
    paddingInline: "13px",
    minHeight: controls.minHeight,
    outlineWidth: { default: 0, ":focus-visible": controls.focusWidth },
    outlineStyle: "solid",
    outlineColor: colors.borderFocus,
    outlineOffset: controls.focusOffset,
  },
  select: { width: "100%" },
});
