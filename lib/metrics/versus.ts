import { SECONDARY_SCORE_FIELDS } from "@/lib/constants";
import type { SessionWithRelations, TaskType, Tone } from "@/types";
import { computeStats, mean, round, type GroupStats } from "./aggregate";

const DIMS: { key: keyof SessionWithRelations; label: string }[] = [
  { key: "qualityScore", label: "Quality" },
  ...SECONDARY_SCORE_FIELDS.map((f) => ({
    key: f.key as keyof SessionWithRelations,
    label: f.label,
  })),
];

function dimMean(
  sessions: SessionWithRelations[],
  key: keyof SessionWithRelations,
): number | null {
  return mean(sessions.map((s) => s[key] as number | null));
}

export type RadarPoint = { label: string; a: number; b: number };

export type StatDelta = {
  key: string;
  label: string;
  a: number | null;
  b: number | null;
  winner: "a" | "b" | "tie" | null;
  format: "score" | "currency" | "minutes" | "percent" | "int";
};

export type TaskDelta = {
  taskType: TaskType;
  a: number | null;
  b: number | null;
  delta: number | null;
  winner: "a" | "b" | "tie";
};

export type Versus = {
  statsA: GroupStats;
  statsB: GroupStats;
  radar: RadarPoint[];
  stats: StatDelta[];
  byTask: TaskDelta[];
  verdict: { text: string; tone: Tone };
};

function winnerOf(a: number | null, b: number | null): StatDelta["winner"] {
  if (a == null || b == null) return null;
  if (Math.abs(a - b) < 1e-9) return "tie";
  return a > b ? "a" : "b";
}

export function headToHead(
  aLabel: string,
  bLabel: string,
  aSessions: SessionWithRelations[],
  bSessions: SessionWithRelations[],
): Versus {
  const statsA = computeStats(aSessions);
  const statsB = computeStats(bSessions);

  // Radar over score dimensions both models have data for.
  const radar: RadarPoint[] = [];
  for (const dim of DIMS) {
    const a = dimMean(aSessions, dim.key);
    const b = dimMean(bSessions, dim.key);
    if (a == null || b == null) continue;
    radar.push({ label: dim.label, a: round(a, 1) ?? 0, b: round(b, 1) ?? 0 });
  }

  const stats: StatDelta[] = [
    {
      key: "count",
      label: "Sessions",
      a: statsA.count,
      b: statsB.count,
      winner: winnerOf(statsA.count, statsB.count),
      format: "int",
    },
    {
      key: "quality",
      label: "Avg quality",
      a: statsA.avgQuality,
      b: statsB.avgQuality,
      winner: winnerOf(statsA.avgQuality, statsB.avgQuality),
      format: "score",
    },
    {
      key: "reliability",
      label: "Reliability index",
      a: statsA.avgReliability,
      b: statsB.avgReliability,
      winner: winnerOf(statsA.avgReliability, statsB.avgReliability),
      format: "score",
    },
    {
      key: "costValue",
      label: "Cost-value",
      a: statsA.avgCostValue,
      b: statsB.avgCostValue,
      winner: winnerOf(statsA.avgCostValue, statsB.avgCostValue),
      format: "score",
    },
    {
      key: "net",
      label: "Net time saved",
      a: statsA.netTimeSavedMinutes,
      b: statsB.netTimeSavedMinutes,
      winner: winnerOf(statsA.netTimeSavedMinutes, statsB.netTimeSavedMinutes),
      format: "minutes",
    },
    {
      key: "success",
      label: "Success rate",
      a: statsA.successRate,
      b: statsB.successRate,
      winner: winnerOf(statsA.successRate, statsB.successRate),
      format: "percent",
    },
    {
      key: "cost",
      label: "Total spend",
      a: statsA.totalCost,
      b: statsB.totalCost,
      // Lower spend "wins" — invert.
      winner: winnerOf(statsB.totalCost, statsA.totalCost),
      format: "currency",
    },
  ];

  // Per-task quality, only where both models have sessions.
  const groupByTask = (items: SessionWithRelations[]) => {
    const m = new Map<TaskType, SessionWithRelations[]>();
    for (const s of items) {
      const arr = m.get(s.taskType);
      if (arr) arr.push(s);
      else m.set(s.taskType, [s]);
    }
    return m;
  };
  const aByTask = groupByTask(aSessions);
  const bByTask = groupByTask(bSessions);

  const byTask: TaskDelta[] = [];
  for (const [task, aItems] of aByTask) {
    const bItems = bByTask.get(task);
    if (!bItems) continue;
    const a = mean(aItems.map((s) => s.qualityScore));
    const b = mean(bItems.map((s) => s.qualityScore));
    const delta = a != null && b != null ? a - b : null;
    byTask.push({
      taskType: task,
      a,
      b,
      delta,
      winner:
        delta == null || Math.abs(delta) < 1e-9 ? "tie" : delta > 0 ? "a" : "b",
    });
  }
  byTask.sort((x, y) => Math.abs(y.delta ?? 0) - Math.abs(x.delta ?? 0));

  return {
    statsA,
    statsB,
    radar,
    stats,
    byTask,
    verdict: qualityVerdict(aLabel, bLabel, statsA, statsB),
  };
}

function qualityVerdict(
  aLabel: string,
  bLabel: string,
  statsA: GroupStats,
  statsB: GroupStats,
): { text: string; tone: Tone } {
  const qA = statsA.avgQuality;
  const qB = statsB.avgQuality;
  if (qA == null || qB == null) {
    return { text: "Not enough scored sessions to compare.", tone: "neutral" };
  }
  const delta = qA - qB;
  const abs = Math.abs(delta);
  const leader = delta >= 0 ? aLabel : bLabel;
  const minCount = Math.min(statsA.count, statsB.count);

  if (abs < 0.4) {
    return {
      text: "Too close to call on quality — decide on cost, speed or reliability.",
      tone: "neutral",
    };
  }
  if (minCount < 4) {
    return {
      text: `${leader} leads on quality, but the sample is small — log a few more to be sure.`,
      tone: "info",
    };
  }
  if (abs >= 1) {
    return {
      text: `${leader} is clearly ahead on quality (by ${abs.toFixed(1)} points).`,
      tone: "success",
    };
  }
  return { text: `${leader} leans ahead on quality.`, tone: "info" };
}
