import { Schema } from "effect";

export const AdvanceDay = Schema.Struct({ type: Schema.Literal("advance-day") });
export type AdvanceDay = typeof AdvanceDay.Type;
