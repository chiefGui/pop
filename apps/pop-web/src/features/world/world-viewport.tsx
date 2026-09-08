import * as stylex from "@stylexjs/stylex";
import { colors } from "../../ui/tokens.stylex";

export function WorldViewport({ location }: { location: string }) {
  return <main aria-label={location} {...stylex.props(styles.viewport)} />;
}

const styles = stylex.create({
  viewport: { position: "fixed", inset: 0, backgroundColor: colors.surfaceCanvas },
});
