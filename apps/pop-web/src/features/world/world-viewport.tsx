import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors } from "../../ui/tokens.stylex";

export function WorldViewport({ location, children }: { location: string; children: ReactNode }) {
  return (
    <main aria-label={location} {...stylex.props(styles.viewport)}>
      {children}
    </main>
  );
}

const styles = stylex.create({
  viewport: { position: "fixed", inset: 0, backgroundColor: colors.surfaceCanvas },
});
