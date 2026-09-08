import { Schema } from "effect";

export const ZoneId = Schema.TemplateLiteral(["zone:", Schema.NonEmptyString]).check(
  Schema.isMinLength(6),
);
export type ZoneId = typeof ZoneId.Type;

export const Zone = Schema.Struct({
  id: ZoneId,
  name: Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(100)),
  description: Schema.String,
});
export type Zone = typeof Zone.Type;
