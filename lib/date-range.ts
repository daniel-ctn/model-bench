import { endOfMonth, startOfMonth, subDays, subMonths } from "date-fns";

import type { Option } from "@/lib/constants";

export type RangeKey = "7d" | "30d" | "90d" | "month" | "12m" | "all";

export const DEFAULT_RANGE: RangeKey = "month";

export const rangeLabels: Record<RangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  month: "This month",
  "12m": "Last 12 months",
  all: "All time",
};

/** Option list for the date-range <Select>. Default (`month`) sits first. */
export const rangeOptions: Option[] = (
  ["month", "7d", "30d", "90d", "12m", "all"] as RangeKey[]
).map((value) => ({ value, label: rangeLabels[value] }));

export function isRangeKey(v: string | undefined): v is RangeKey {
  return !!v && v in rangeLabels;
}

export type ResolvedRange = {
  key: RangeKey;
  label: string;
  from: Date;
  to: Date;
  /** Equal-length preceding window for deltas, or null when not applicable. */
  prevFrom: Date | null;
  prevTo: Date | null;
};

/** Turn a range key into concrete current/previous windows around `now`. */
export function resolveRange(
  key: string | undefined,
  now: Date = new Date(),
): ResolvedRange {
  const k: RangeKey = isRangeKey(key) ? key : DEFAULT_RANGE;
  const base = { key: k, label: rangeLabels[k] };

  if (k === "month") {
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    return {
      ...base,
      from,
      to,
      prevFrom: startOfMonth(subMonths(now, 1)),
      prevTo: endOfMonth(subMonths(now, 1)),
    };
  }
  if (k === "all") {
    return { ...base, from: new Date(0), to: now, prevFrom: null, prevTo: null };
  }

  const days = k === "7d" ? 7 : k === "30d" ? 30 : k === "90d" ? 90 : 365;
  const from = subDays(now, days);
  return {
    ...base,
    from,
    to: now,
    prevFrom: subDays(now, days * 2),
    prevTo: from,
  };
}

/** Filter sessions to a [from, to] window (inclusive). */
export function inWindow<T extends { date: Date }>(
  items: T[],
  from: Date,
  to: Date,
): T[] {
  return items.filter((s) => s.date >= from && s.date <= to);
}
