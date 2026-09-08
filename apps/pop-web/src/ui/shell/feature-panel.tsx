import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Button } from "../button";
import { colors, fontSizes, fontWeights, layout } from "../tokens.stylex";

export function FeaturePanel({
  id,
  label,
  open,
  onClose,
  children,
  placement = "right",
}: {
  id: string;
  label: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  placement?: "left" | "right";
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (open) heading.current?.focus({ preventScroll: true });
  }, [open, label]);
  return (
    <section
      id={`${id}-panel`}
      hidden={!open}
      aria-labelledby={`${id}-heading`}
      {...stylex.props(styles.panel, placement === "left" && styles.left)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div {...stylex.props(styles.header)}>
        <h2 ref={heading} tabIndex={-1} id={`${id}-heading`} {...stylex.props(styles.heading)}>
          {label}
        </h2>
        <Button
          variant="secondary"
          aria-label={`Close ${label}`}
          onClick={onClose}
          xstyle={styles.close}
        >
          ×
        </Button>
      </div>
      <div {...stylex.props(styles.content)}>{children}</div>
    </section>
  );
}

const styles = stylex.create({
  panel: {
    pointerEvents: "auto",
    width: layout.featurePanelWidth,
    maxWidth: `calc(100% - ${layout.featureRailWidth})`,
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderLeftStyle: "solid",
    borderLeftColor: colors.border,
  },
  header: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
  },
  left: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
    borderLeftWidth: 0,
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderRightColor: colors.border,
  },
  heading: {
    minWidth: 0,
    overflowWrap: "anywhere",
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.semibold,
  },
  close: { flexShrink: 0 },
  content: {
    minHeight: 0,
    overflow: "auto",
    overscrollBehavior: "contain",
    scrollbarGutter: "stable",
    padding: 16,
  },
});
