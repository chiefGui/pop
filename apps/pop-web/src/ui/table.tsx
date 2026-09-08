import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { colors, fontSizes, fontWeights } from "./tokens.stylex";

export function Table(props: Omit<ComponentProps<"table">, "className" | "style">) {
  return <table {...props} {...stylex.props(styles.table)} />;
}

export function TableHeading({
  xstyle,
  ...props
}: Omit<ComponentProps<"th">, "className" | "style"> & { xstyle?: stylex.StyleXStyles }) {
  return <th {...props} {...stylex.props(styles.cell, styles.heading, xstyle)} />;
}

export function TableCell({
  xstyle,
  ...props
}: Omit<ComponentProps<"td">, "className" | "style"> & { xstyle?: stylex.StyleXStyles }) {
  return <td {...props} {...stylex.props(styles.cell, xstyle)} />;
}

const styles = stylex.create({
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: fontSizes.sm,
    textAlign: "left",
  },
  cell: {
    paddingBlock: 11,
    paddingRight: 9,
    paddingLeft: { default: 9, ":first-child": 0 },
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  heading: { fontWeight: fontWeights.medium },
});
