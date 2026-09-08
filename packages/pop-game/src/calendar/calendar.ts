import { DateTime, Option, Schema } from "effect";

export const CalendarDate = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/),
  Schema.makeFilter((value) => {
    const parsed = DateTime.make(value + "T00:00:00Z");
    if (Option.isNone(parsed) || DateTime.formatIsoDateUtc(parsed.value) !== value)
      return "Expected a valid calendar date (YYYY-MM-DD).";
    if (value < "0001-01-01") return "Calendar dates must be in year 1 or later.";
  }),
);

export const gameStartDate = "2026-01-01";
const firstDay = DateTime.makeUnsafe(gameStartDate + "T00:00:00Z");

export function dateAtDay(day: number) {
  return DateTime.formatIsoDateUtc(DateTime.add(firstDay, { days: day }));
}

export function ageOnDate(birthDate: string, date: string) {
  let age = Number(date.slice(0, 4)) - Number(birthDate.slice(0, 4));
  if (date.slice(5) < birthDate.slice(5)) age -= 1;
  return age;
}
