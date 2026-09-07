import { DateTime } from "effect";

const firstDay = DateTime.makeUnsafe("2026-01-01T00:00:00Z");
const formatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function calendarDate(day: number) {
  return DateTime.formatIntl(DateTime.add(firstDay, { days: day }), formatter);
}
