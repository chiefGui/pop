import { Schema } from "effect";
import type { ZoneId } from "#game/zones";

const NonnegativeInteger = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
);

export const CharacterId = Schema.TemplateLiteral(["character:", NonnegativeInteger]).check(
  Schema.isPattern(/^character:(0|[1-9]\d*)$/),
);
export type CharacterId = typeof CharacterId.Type;

export interface CharacterView extends Readonly<Character> {
  readonly availableInfluence: number;
  readonly isPlayer: boolean;
}

export interface Character {
  readonly id: CharacterId;
  readonly name: string;
  readonly zoneId: ZoneId;
  readonly reputation: number;
  readonly popularity: number;
  readonly influence: number;
}
