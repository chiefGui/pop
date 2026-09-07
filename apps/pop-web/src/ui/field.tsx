import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { colors } from "./theme.stylex";

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
    font: "inherit",
    color: colors.ink,
    border: "1px solid #b9c2b7",
    borderRadius: 6,
    backgroundColor: colors.paper,
    padding: "11px 13px",
    minHeight: 44,
    outline: { default: null, ":focus-visible": "2px solid #60856d" },
    outlineOffset: 3,
  },
  select: { width: "100%" },
});
