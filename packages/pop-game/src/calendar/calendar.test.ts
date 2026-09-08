import { expect, test } from "vite-plus/test";
import { Schema } from "effect";
import { ageOnDate, CalendarDate, dateAtDay } from "./calendar";

test("calendar dates reject impossible dates and time-bearing values", () => {
  const decode = Schema.decodeUnknownSync(CalendarDate);
  for (const value of ["2000-02-29", "2026-01-01", "0001-01-01"]) expect(decode(value)).toBe(value);
  for (const value of [
    "1900-02-29",
    "2025-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-1-1",
    "0000-01-01",
    "2026-01-01T00:00:00Z",
    "",
  ])
    expect(() => decode(value)).toThrow();
});

test("age changes on birthdays, including March 1 for leap-day births in ordinary years", () => {
  expect(ageOnDate("1990-01-02", "2026-01-01")).toBe(35);
  expect(ageOnDate("1990-01-02", "2026-01-02")).toBe(36);
  expect(ageOnDate("1990-01-02", "2026-01-03")).toBe(36);
  expect(ageOnDate("2000-02-29", "2024-02-28")).toBe(23);
  expect(ageOnDate("2000-02-29", "2024-02-29")).toBe(24);
  expect(ageOnDate("2000-02-29", "2025-02-28")).toBe(24);
  expect(ageOnDate("2000-02-29", "2025-03-01")).toBe(25);
});

test("simulation dates advance through year and leap-day boundaries", () => {
  expect(dateAtDay(0)).toBe("2026-01-01");
  expect(dateAtDay(365)).toBe("2027-01-01");
  expect(dateAtDay(789)).toBe("2028-02-29");
  expect(dateAtDay(790)).toBe("2028-03-01");
});
