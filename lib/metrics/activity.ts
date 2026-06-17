import { addDays, startOfWeek, subWeeks } from "date-fns";

import type { SessionWithRelations } from "@/types";

export type DayCell = {
  /** yyyy-MM-dd (local). */
  date: string;
  count: number;
  /** True for cells after today (padding the final week). */
  future: boolean;
};

export type ActivityData = {
  /** Columns of 7 days (Monday-first), oldest column first. */
  weeks: DayCell[][];
  maxCount: number;
  totalInRange: number;
  daysActive: number;
  currentStreak: number;
  longestStreak: number;
};

function dayKey(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function daysBetween(aKey: string, bKey: string): number {
  const a = new Date(`${aKey}T00:00:00Z`).getTime();
  const b = new Date(`${bKey}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Build a GitHub-style activity calendar plus all-time streaks from a user's
 * sessions. The calendar spans the last `weeks` weeks; streaks use every day
 * with activity.
 */
export function activityData(
  sessions: SessionWithRelations[],
  weeks = 26,
  now: Date = new Date(),
): ActivityData {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const k = dayKey(s.date);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  // Grid: from the Monday `weeks-1` weeks ago to the end of the current week.
  const start = startOfWeek(subWeeks(now, weeks - 1), { weekStartsOn: 1 });
  const end = addDays(startOfWeek(now, { weekStartsOn: 1 }), 6);

  const gridWeeks: DayCell[][] = [];
  let cursor = start;
  let maxCount = 0;
  let totalInRange = 0;
  let daysActive = 0;

  while (cursor <= end) {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const k = dayKey(cursor);
      const count = counts.get(k) ?? 0;
      const future = cursor > now;
      week.push({ date: k, count, future });
      if (!future) {
        maxCount = Math.max(maxCount, count);
        totalInRange += count;
        if (count > 0) daysActive += 1;
      }
      cursor = addDays(cursor, 1);
    }
    gridWeeks.push(week);
  }

  // Streaks across all active days.
  const sorted = [...counts.keys()].sort();
  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = d;
  }

  const active = new Set(counts.keys());
  let probe = new Date(now);
  if (!active.has(dayKey(probe))) probe = addDays(probe, -1);
  let currentStreak = 0;
  while (active.has(dayKey(probe))) {
    currentStreak += 1;
    probe = addDays(probe, -1);
  }

  return {
    weeks: gridWeeks,
    maxCount,
    totalInRange,
    daysActive,
    currentStreak,
    longestStreak,
  };
}
