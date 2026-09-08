import { DateTime } from "effect";
import { dateAtDay } from "@pop/game";

const formatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function calendarDate(day: number) {
  return formatCalendarDate(dateAtDay(day));
}

export function formatCalendarDate(date: string) {
  return DateTime.formatIntl(DateTime.makeUnsafe(date + "T00:00:00Z"), formatter);
}
