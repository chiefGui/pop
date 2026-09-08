import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";
import type { CharacterView } from "@pop/simulation";
import { Button } from "../../ui/button";
import { breakpoints, colors, controls, fontSizes } from "../../ui/tokens.stylex";
import { CharacterPortrait } from "./character-portrait";

export function CharacterTrigger({
  character,
  open,
  onOpen,
}: {
  character: CharacterView;
  open: boolean;
  onOpen: () => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) trigger.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);
  return (
    <Button
      ref={trigger}
      hidden={open}
      variant="secondary"
      aria-label={`View ${character.name}`}
      aria-expanded={open}
      aria-controls="character-panel"
      onClick={onOpen}
      xstyle={styles.trigger}
    >
      <span {...stylex.props(styles.portrait)}>
        <CharacterPortrait />
      </span>
      <span {...stylex.props(styles.name)}>{character.name}</span>
    </Button>
  );
}

const styles = stylex.create({
  portrait: { display: "block", width: "100%", aspectRatio: "5 / 6", flexShrink: 0 },
  trigger: {
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    padding: 0,
    flexShrink: 0,
    width: { default: 96, [breakpoints.upToCompact]: 64 },
    overflow: "hidden",
    outlineOffset: `calc(-1 * ${controls.focusWidth})`,
    backgroundColor: { default: colors.surface, ":hover:not(:disabled)": colors.surfaceHover },
  },
  name: {
    display: "block",
    width: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: fontSizes.md,
    paddingBlock: 8,
    paddingInline: 4,
  },
});
