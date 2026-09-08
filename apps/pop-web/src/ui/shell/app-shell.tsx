import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, fontSizes } from "../tokens.stylex";

type Children = { children: ReactNode };

export function AppShell({ children }: Children) {
  return <div {...stylex.props(styles.shell)}>{children}</div>;
}

export function Header({ children }: Children) {
  return <header {...stylex.props(styles.header)}>{children}</header>;
}

export function SecondaryBar({ children, controls }: Children & { controls: ReactNode }) {
  return (
    <div {...stylex.props(styles.secondary)}>
      <div {...stylex.props(styles.features)}>{children}</div>
      <div {...stylex.props(styles.controls)}>{controls}</div>
    </div>
  );
}

export function Workspace({ children, portrait }: Children & { portrait: ReactNode }) {
  return (
    <div {...stylex.props(styles.workspace)}>
      <div {...stylex.props(styles.portrait)}>{portrait}</div>
      {children}
    </div>
  );
}

const styles = stylex.create({
  shell: {
    position: "fixed",
    inset: 0,
    height: "100dvh",
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    pointerEvents: "none",
    color: colors.text,
    fontSize: fontSizes.xl,
    fontVariantNumeric: "tabular-nums",
  },
  header: {
    pointerEvents: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingBlock: 8,
    paddingInline: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  secondary: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    display: "grid",
    gridTemplateRows: "minmax(0, 1fr) auto",
    minHeight: 0,
    minWidth: 0,
  },
  features: { display: "flex", justifyContent: "flex-end", minHeight: 0, minWidth: 0 },
  controls: {
    pointerEvents: "auto",
    justifySelf: "end",
    maxWidth: "100%",
    position: "relative",
    zIndex: 2,
  },
  workspace: { position: "relative", display: "flex", minHeight: 0, minWidth: 0 },
  portrait: { position: "absolute", bottom: 0, left: 0 },
});
