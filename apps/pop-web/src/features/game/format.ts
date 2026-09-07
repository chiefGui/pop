import type { Rewards } from "@pop/simulation";

const calendar = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function date(day: number) {
  return calendar.format(new Date(Date.UTC(2026, 0, 1 + day)));
}

export function rewardText(reward: Rewards) {
  const parts: string[] = [];
  if (reward.reputation > 0) parts.push(`${reward.reputation} reputation`);
  if (reward.popularity > 0) parts.push(`${reward.popularity} popularity`);
  if (parts.length === 0) return "No reward";
  return parts.join(" · ");
}

export function rateText(value: number) {
  if (value > 0) return `+${value} / day`;
  if (value < 0) return `${value} / day`;
  return "Stalled";
}
