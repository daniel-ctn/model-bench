import { formatPercent, formatScore } from "@/lib/format";
import type { ConfidenceLevel, SessionWithRelations, TaskType } from "@/types";
import {
  byModel,
  byTool,
  type GroupStats,
  type LeaderboardRow,
  leaderboard,
} from "./aggregate";

/** What the user is optimising for when asking "what should I use?". */
export type RecommendGoal = "balanced" | "quality" | "budget";

export type Recommendation = {
  id: string;
  label: string;
  stats: GroupStats;
  /** Blended, confidence-shrunk fit score, 0–100. */
  score: number;
  reasons: string[];
  confidence: ConfidenceLevel;
};

type Weights = {
  quality: number;
  reliability: number;
  costValue: number;
  net: number;
};

const GOAL_WEIGHTS: Record<RecommendGoal, Weights> = {
  balanced: { quality: 0.35, reliability: 0.25, costValue: 0.2, net: 0.2 },
  quality: { quality: 0.45, reliability: 0.35, costValue: 0.05, net: 0.15 },
  budget: { quality: 0.2, reliability: 0.15, costValue: 0.45, net: 0.2 },
};

export const recommendGoalLabels: Record<RecommendGoal, string> = {
  balanced: "Balanced",
  quality: "Maximise quality",
  budget: "Stretch the budget",
};

/**
 * Min-max normaliser over a set of metric values. Missing values map to the
 * neutral midpoint so they neither help nor hurt; when every value is equal the
 * metric stops differentiating (all 0.5).
 */
function normaliser(values: (number | null)[]): (v: number | null) => number {
  const nums = values.filter((v): v is number => v != null);
  if (!nums.length) return () => 0.5;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (max === min) return () => 0.5;
  return (v) => (v == null ? 0.5 : (v - min) / (max - min));
}

function leaderId(
  rows: LeaderboardRow[],
  metric: (s: GroupStats) => number | null,
): string | null {
  let best: { id: string; v: number } | null = null;
  for (const r of rows) {
    const v = metric(r.stats);
    if (v == null) continue;
    if (!best || v > best.v) best = { id: r.id, v };
  }
  return best?.id ?? null;
}

/**
 * Rank candidate leaderboard rows for a goal. Each row's blended fit is shrunk
 * toward the neutral midpoint by its sample size (empirical-Bayes style), so a
 * single lucky session can't outrank a well-evidenced model.
 */
export function recommend(
  rows: LeaderboardRow[],
  goal: RecommendGoal = "balanced",
): Recommendation[] {
  if (!rows.length) return [];
  const w = GOAL_WEIGHTS[goal];
  const qN = normaliser(rows.map((r) => r.stats.avgQuality));
  const relN = normaliser(rows.map((r) => r.stats.avgReliability));
  const cvN = normaliser(rows.map((r) => r.stats.avgCostValue));
  const netN = normaliser(rows.map((r) => r.stats.netTimeSavedMinutes));

  const bestQuality = leaderId(rows, (s) => s.avgQuality);
  const bestRel = leaderId(rows, (s) => s.avgReliability);
  const bestCv = leaderId(rows, (s) => s.avgCostValue);
  const bestNet = leaderId(rows, (s) => s.netTimeSavedMinutes);

  const K = 3; // shrinkage strength — sample size at which trust is ~50%.

  return rows
    .map((r) => {
      const s = r.stats;
      const blended =
        w.quality * qN(s.avgQuality) +
        w.reliability * relN(s.avgReliability) +
        w.costValue * cvN(s.avgCostValue) +
        w.net * netN(s.netTimeSavedMinutes);
      const n = s.count;
      const adjusted = blended * (n / (n + K)) + 0.5 * (K / (n + K));

      const reasons: string[] = [];
      if (r.id === bestQuality && s.avgQuality != null)
        reasons.push(`Best quality (${formatScore(s.avgQuality)}/10)`);
      if (r.id === bestRel && s.avgReliability != null)
        reasons.push(`Most reliable (${formatScore(s.avgReliability)})`);
      if (r.id === bestCv && s.avgCostValue != null)
        reasons.push(`Best value (${formatScore(s.avgCostValue)} quality/$)`);
      if (r.id === bestNet && s.netTimeSavedMinutes > 0)
        reasons.push("Saves the most net time");
      if (s.successRate >= 0.8)
        reasons.push(`${formatPercent(s.successRate)} success rate`);
      if (s.confidence === "low")
        reasons.push(
          `limited data — only ${n} session${n === 1 ? "" : "s"}`,
        );
      if (!reasons.length)
        reasons.push(`${n} session${n === 1 ? "" : "s"} logged`);

      return {
        id: r.id,
        label: r.label,
        stats: s,
        score: Math.round(adjusted * 100),
        reasons,
        confidence: s.confidence,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Convenience: recommend models / tools for a subset of sessions. */
export function recommendModels(
  sessions: SessionWithRelations[],
  goal: RecommendGoal = "balanced",
): Recommendation[] {
  return recommend(leaderboard(sessions, byModel), goal);
}

export function recommendTools(
  sessions: SessionWithRelations[],
  goal: RecommendGoal = "balanced",
): Recommendation[] {
  return recommend(leaderboard(sessions, byTool), goal);
}

/**
 * The single best model per task type (balanced goal). Only includes task types
 * that have any model-tagged session.
 */
export function bestModelByTask(
  sessions: SessionWithRelations[],
): Partial<Record<TaskType, Recommendation>> {
  const byTask = new Map<TaskType, SessionWithRelations[]>();
  for (const s of sessions) {
    if (!s.model) continue;
    const arr = byTask.get(s.taskType);
    if (arr) arr.push(s);
    else byTask.set(s.taskType, [s]);
  }
  const out: Partial<Record<TaskType, Recommendation>> = {};
  for (const [task, subset] of byTask) {
    const top = recommendModels(subset, "balanced")[0];
    if (top) out[task] = top;
  }
  return out;
}

/** Lean, serialisable best-model-per-task map for the session form hint. */
export type TaskHint = {
  modelId: string;
  label: string;
  quality: number | null;
  count: number;
  confidence: ConfidenceLevel;
};

export function taskHints(
  sessions: SessionWithRelations[],
): Partial<Record<TaskType, TaskHint>> {
  const best = bestModelByTask(sessions);
  const out: Partial<Record<TaskType, TaskHint>> = {};
  for (const task of Object.keys(best) as TaskType[]) {
    const r = best[task]!;
    out[task] = {
      modelId: r.id,
      label: r.label,
      quality: r.stats.avgQuality,
      count: r.stats.count,
      confidence: r.confidence,
    };
  }
  return out;
}
