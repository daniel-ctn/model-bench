import type {
  ConfidenceLevel,
  FailureType,
  SessionWithRelations,
  TaskType,
} from "@/types";
import {
  costValueIndex,
  netTimeSaved,
  reliabilityIndex,
  worthItVerdict,
  type WorthItVerdict,
} from "./session";

/* ------------------------------- primitives ------------------------------- */

export function mean(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function sum(values: (number | null | undefined)[]): number {
  return values.reduce<number>((a, v) => a + (typeof v === "number" ? v : 0), 0);
}

export function round(n: number | null, digits = 1): number | null {
  if (n == null) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Sample standard deviation. Null below two samples (spread undefined). */
export function stdev(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length < 2) return null;
  const m = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance =
    nums.reduce((a, v) => a + (v - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

/**
 * Wilson score lower bound for a proportion — a sample-size-aware floor on a
 * success rate. Small samples are pulled toward 0, so a 1/1 model can't
 * outrank a 18/20 one. z = 1.96 (~95% one-sided ≈ 97.5%).
 */
export function wilsonLowerBound(successes: number, n: number, z = 1.96): number {
  if (n <= 0) return 0;
  const phat = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = phat + z2 / (2 * n);
  const margin = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * n)) / n);
  return Math.max(0, (center - margin) / denom);
}

/** How much to trust a per-group average, purely from its sample size. */
export function confidenceFromCount(n: number): ConfidenceLevel {
  if (n >= 8) return "high";
  if (n >= 4) return "medium";
  return "low";
}

function emptyWorthItCounts(): Record<WorthItVerdict, number> {
  return { "worth-it": 0, "good-enough": 0, "too-expensive": 0, avoid: 0 };
}

/* --------------------------------- stats ---------------------------------- */

export type GroupStats = {
  count: number;
  avgQuality: number | null;
  avgReliability: number | null;
  avgCostValue: number | null;
  netTimeSavedMinutes: number;
  totalTimeSavedMinutes: number;
  totalTimeSpentMinutes: number;
  totalCost: number;
  failureCount: number;
  /** Share of sessions rated excellent or good (0–1). */
  successRate: number;
  /** Sample-size-aware floor on the success rate (Wilson lower bound). */
  successRateLower: number;
  /** Spread of quality scores — null below two sessions. */
  qualityStdev: number | null;
  /** How much to trust these averages, from the sample size alone. */
  confidence: ConfidenceLevel;
  worthItCounts: Record<WorthItVerdict, number>;
};

export function computeStats(sessions: SessionWithRelations[]): GroupStats {
  const worthItCounts = emptyWorthItCounts();
  let failureCount = 0;
  let successes = 0;

  for (const s of sessions) {
    worthItCounts[worthItVerdict(s)] += 1;
    failureCount += s.failurePatterns?.length ?? 0;
    if (s.resultStatus === "excellent" || s.resultStatus === "good") successes += 1;
  }

  const count = sessions.length;
  return {
    count,
    avgQuality: mean(sessions.map((s) => s.qualityScore)),
    avgReliability: mean(sessions.map((s) => reliabilityIndex(s))),
    avgCostValue: mean(sessions.map((s) => costValueIndex(s))),
    netTimeSavedMinutes: sum(sessions.map((s) => netTimeSaved(s))),
    totalTimeSavedMinutes: sum(sessions.map((s) => s.estimatedTimeSavedMinutes)),
    totalTimeSpentMinutes: sum(sessions.map((s) => s.timeSpentMinutes)),
    totalCost: sum(sessions.map((s) => s.estimatedCostUsd)),
    failureCount,
    successRate: count ? successes / count : 0,
    successRateLower: wilsonLowerBound(successes, count),
    qualityStdev: stdev(sessions.map((s) => s.qualityScore)),
    confidence: confidenceFromCount(count),
    worthItCounts,
  };
}

/* ------------------------------ KPI summary ------------------------------- */

export type SessionKpis = GroupStats & {
  sessionsWithFailures: number;
};

export function summarize(sessions: SessionWithRelations[]): SessionKpis {
  const base = computeStats(sessions);
  const sessionsWithFailures = sessions.filter(
    (s) => (s.failurePatterns?.length ?? 0) > 0,
  ).length;
  return { ...base, sessionsWithFailures };
}

/* ------------------------------ leaderboards ------------------------------ */

export type LeaderboardRow = {
  id: string;
  label: string;
  stats: GroupStats;
};

/**
 * Group sessions by an arbitrary key and compute stats per group. Rows with no
 * key (e.g. sessions without a model) are skipped. Returned sorted by count.
 */
export function leaderboard(
  sessions: SessionWithRelations[],
  keyFn: (s: SessionWithRelations) => { id: string; label: string } | null,
): LeaderboardRow[] {
  const groups = new Map<
    string,
    { label: string; items: SessionWithRelations[] }
  >();
  for (const s of sessions) {
    const key = keyFn(s);
    if (!key) continue;
    const existing = groups.get(key.id);
    if (existing) existing.items.push(s);
    else groups.set(key.id, { label: key.label, items: [s] });
  }
  return [...groups.entries()]
    .map(([id, { label, items }]) => ({ id, label, stats: computeStats(items) }))
    .sort((a, b) => b.stats.count - a.stats.count);
}

/** Common key extractors for leaderboards. */
export const byModel = (s: SessionWithRelations) =>
  s.model ? { id: s.model.id, label: s.model.shortName ?? s.model.name } : null;
export const byTool = (s: SessionWithRelations) =>
  s.tool ? { id: s.tool.id, label: s.tool.name } : null;
export const byProject = (s: SessionWithRelations) =>
  s.project ? { id: s.project.id, label: s.project.name } : null;
export const byTaskType = (s: SessionWithRelations) => ({
  id: s.taskType,
  label: s.taskType,
});

/** Pick the best leaderboard row by a metric, ignoring tiny samples. */
export function bestBy(
  rows: LeaderboardRow[],
  metric: (stats: GroupStats) => number | null,
  minCount = 1,
): LeaderboardRow | null {
  const eligible = rows.filter(
    (r) => r.stats.count >= minCount && metric(r.stats) != null,
  );
  if (!eligible.length) return null;
  return eligible.reduce((best, r) =>
    (metric(r.stats) ?? -Infinity) > (metric(best.stats) ?? -Infinity) ? r : best,
  );
}

export function worstBy(
  rows: LeaderboardRow[],
  metric: (stats: GroupStats) => number | null,
  minCount = 1,
): LeaderboardRow | null {
  const eligible = rows.filter(
    (r) => r.stats.count >= minCount && metric(r.stats) != null,
  );
  if (!eligible.length) return null;
  return eligible.reduce((worst, r) =>
    (metric(r.stats) ?? Infinity) < (metric(worst.stats) ?? Infinity) ? r : worst,
  );
}

export type LeaderboardSortKey =
  | "quality"
  | "costValue"
  | "reliability"
  | "net"
  | "count"
  | "success";

export function sortLeaderboard(
  rows: LeaderboardRow[],
  key: LeaderboardSortKey,
): LeaderboardRow[] {
  const metric = (s: GroupStats): number => {
    switch (key) {
      case "quality":
        return s.avgQuality ?? -1;
      case "costValue":
        return s.avgCostValue ?? -1;
      case "reliability":
        return s.avgReliability ?? -1;
      case "net":
        return s.netTimeSavedMinutes;
      case "count":
        return s.count;
      case "success":
        return s.successRate;
    }
  };
  return [...rows].sort((a, b) => metric(b.stats) - metric(a.stats));
}

/* ----------------------------- distributions ------------------------------ */

export type DistItem = { id: string; label: string; value: number };

export function distribution(
  sessions: SessionWithRelations[],
  keyFn: (s: SessionWithRelations) => { id: string; label: string } | null,
): DistItem[] {
  const counts = new Map<string, { label: string; value: number }>();
  for (const s of sessions) {
    const key = keyFn(s);
    if (!key) continue;
    const existing = counts.get(key.id);
    if (existing) existing.value += 1;
    else counts.set(key.id, { label: key.label, value: 1 });
  }
  return [...counts.entries()]
    .map(([id, { label, value }]) => ({ id, label, value }))
    .sort((a, b) => b.value - a.value);
}

/* -------------------------------- trends ---------------------------------- */

export type TrendPoint = {
  date: string; // yyyy-MM-dd
  count: number;
  avgQuality: number | null;
  avgReliability: number | null;
  netTimeSavedMinutes: number;
  totalTimeSavedMinutes: number;
  totalTimeSpentMinutes: number;
};

function dayKey(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** Daily trend points, sorted ascending by date. */
export function trendByDay(sessions: SessionWithRelations[]): TrendPoint[] {
  const buckets = new Map<string, SessionWithRelations[]>();
  for (const s of sessions) {
    const key = dayKey(s.date);
    const arr = buckets.get(key);
    if (arr) arr.push(s);
    else buckets.set(key, [s]);
  }
  return [...buckets.entries()]
    .map(([date, items]) => {
      const stats = computeStats(items);
      return {
        date,
        count: items.length,
        avgQuality: stats.avgQuality,
        avgReliability: stats.avgReliability,
        netTimeSavedMinutes: stats.netTimeSavedMinutes,
        totalTimeSavedMinutes: stats.totalTimeSavedMinutes,
        totalTimeSpentMinutes: stats.totalTimeSpentMinutes,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* --------------------------- failure analytics ---------------------------- */

export type FailureCount = { type: FailureType; label: string; value: number };

export function failureTypeCounts(
  sessions: SessionWithRelations[],
  labelFor: (t: FailureType) => string,
): FailureCount[] {
  const counts = new Map<FailureType, number>();
  for (const s of sessions) {
    for (const fp of s.failurePatterns ?? []) {
      counts.set(fp.type, (counts.get(fp.type) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([type, value]) => ({ type, label: labelFor(type), value }))
    .sort((a, b) => b.value - a.value);
}

/** The single most common failure pattern across the given sessions. */
export function topFailurePattern(
  sessions: SessionWithRelations[],
  labelFor: (t: FailureType) => string,
): FailureCount | null {
  return failureTypeCounts(sessions, labelFor)[0] ?? null;
}

/** Matrix of failure type × task type counts for the reports heatmap. */
export function failureHeatmap(sessions: SessionWithRelations[]): {
  rows: FailureType[];
  cols: TaskType[];
  matrix: Map<string, number>;
} {
  const matrix = new Map<string, number>();
  const rows = new Set<FailureType>();
  const cols = new Set<TaskType>();
  for (const s of sessions) {
    for (const fp of s.failurePatterns ?? []) {
      rows.add(fp.type);
      cols.add(s.taskType);
      const key = `${fp.type}::${s.taskType}`;
      matrix.set(key, (matrix.get(key) ?? 0) + 1);
    }
  }
  return { rows: [...rows], cols: [...cols], matrix };
}
