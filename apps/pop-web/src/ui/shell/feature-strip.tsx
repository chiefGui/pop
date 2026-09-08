import * as stylex from "@stylexjs/stylex";
import type { MouseEvent } from "react";
import { Button } from "../button";
import { colors, fontSizes, layout } from "../tokens.stylex";

export function FeatureStrip<T extends string>({
  items,
  selected,
  onSelect,
}: {
  items: readonly { id: T; label: string }[];
  selected: string | null;
  onSelect: (id: T, trigger: HTMLButtonElement) => void;
}) {
  return (
    <nav aria-label="Game features" {...stylex.props(styles.strip)}>
      {items.map(({ id, label }) => (
        <Button
          key={id}
          id={`${id}-trigger`}
          variant="secondary"
          aria-expanded={selected === id}
          aria-controls={`${id}-panel`}
          xstyle={[styles.item, selected === id && styles.selected]}
          onClick={(event: MouseEvent<HTMLButtonElement>) => onSelect(id, event.currentTarget)}
        >
          {label}
        </Button>
      ))}
    </nav>
  );
}

const styles = stylex.create({
  strip: {
    pointerEvents: "auto",
    width: layout.featureRailWidth,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 8,
    overflowY: "auto",
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderLeftStyle: "solid",
    borderLeftColor: colors.border,
  },
  item: { paddingInline: 4, fontSize: fontSizes.md, width: "100%", borderLeftWidth: 2 },
  selected: {
    color: { default: colors.text, ":hover:not(:disabled)": colors.text },
    backgroundColor: {
      default: colors.surfaceSelected,
      ":hover:not(:disabled)": colors.surfaceSelected,
    },
    borderLeftColor: colors.borderSelected,
  },
});
