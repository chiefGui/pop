import * as stylex from "@stylexjs/stylex";
import type { CharacterView } from "@pop/game";
import { Button } from "../../ui/button";
import { FeaturePanel } from "../../ui/shell/feature-panel";
import { colors, fontSizes, fontWeights } from "../../ui/tokens.stylex";
import { CharacterPortrait } from "./character-portrait";

export function CharacterProfile({
  character,
  open,
  onClose,
  onReturn,
}: {
  character: CharacterView;
  open: boolean;
  onClose: () => void;
  onReturn: () => void;
}) {
  return (
    <FeaturePanel
      id="character"
      label={character.name}
      open={open}
      onClose={onClose}
      placement="left"
    >
      <div {...stylex.props(styles.portrait)}>
        <CharacterPortrait />
      </div>
      {!character.isPlayer && (
        <Button variant="secondary" onClick={onReturn}>
          Your character
        </Button>
      )}
      <dl {...stylex.props(styles.resources)}>
        <div {...stylex.props(styles.resource)}>
          <dt {...stylex.props(styles.label)}>Reputation</dt>
          <dd>{character.reputation}</dd>
        </div>
        <div {...stylex.props(styles.resource)}>
          <dt {...stylex.props(styles.label)}>Popularity</dt>
          <dd>{character.popularity}</dd>
        </div>
        <div {...stylex.props(styles.resource)}>
          <dt {...stylex.props(styles.label)}>Influence available</dt>
          <dd>
            {character.availableInfluence} / {character.influence}
          </dd>
        </div>
      </dl>
    </FeaturePanel>
  );
}

const styles = stylex.create({
  portrait: { height: 200, marginBottom: 16 },
  resources: { display: "grid", gap: 20, paddingBlock: 20 },
  resource: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    fontWeight: fontWeights.semibold,
  },
  label: { color: colors.textMuted, fontSize: fontSizes.xl, fontWeight: fontWeights.regular },
});
