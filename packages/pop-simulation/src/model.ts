import { Schema } from "effect";

export const NonnegativeInteger = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
);
export const AuthoredAmount = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: 1_000_000 }),
);
export const Name = Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(100));
export const DefinitionId = Schema.NonEmptyString.check(Schema.isTrimmed());

export const CharacterId = Schema.TemplateLiteral(["character:", NonnegativeInteger]).check(
  Schema.isPattern(/^character:(0|[1-9]\d*)$/),
);
export type CharacterId = typeof CharacterId.Type;

export const ZoneId = Schema.TemplateLiteral(["zone:", Schema.NonEmptyString]).check(
  Schema.isMinLength(6),
);
export type ZoneId = typeof ZoneId.Type;

export const Rewards = Schema.Struct({ reputation: AuthoredAmount, popularity: AuthoredAmount });
export type Rewards = typeof Rewards.Type;

export interface CharacterView extends Readonly<Character> {
  readonly availableInfluence: number;
  readonly isPlayer: boolean;
}

export interface Character {
  id: CharacterId;
  name: string;
  zoneId: ZoneId;
  reputation: number;
  popularity: number;
  influence: number;
}
export interface Zone {
  readonly id: ZoneId;
  readonly name: string;
  readonly description: string;
}
