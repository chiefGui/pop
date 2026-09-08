import { Schema } from "effect";
import type { ZoneId } from "#game/zones";
import { CalendarDate, gameStartDate } from "#game/calendar";

export const CharacterName = Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(100));
export const CharacterIdentity = Schema.Struct({
  givenName: CharacterName,
  familyName: CharacterName,
  birthDate: CalendarDate.check(
    Schema.makeFilter((date) => {
      if (date > gameStartDate) return "Birth date cannot be after the game starts.";
    }),
  ),
});
export type CharacterIdentity = typeof CharacterIdentity.Type;

const NonnegativeInteger = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
);

export const CharacterId = Schema.TemplateLiteral(["character:", NonnegativeInteger]).check(
  Schema.isPattern(/^character:(0|[1-9]\d*)$/),
);
export type CharacterId = typeof CharacterId.Type;

export interface CharacterView extends Readonly<Character> {
  readonly displayName: string;
  readonly age: number;
  readonly availableInfluence: number;
  readonly isPlayer: boolean;
}

export interface Character extends CharacterIdentity {
  readonly id: CharacterId;
  readonly zoneId: ZoneId;
  readonly reputation: number;
  readonly popularity: number;
  readonly influence: number;
}
