import { failureTypeLabels, taskTypeLabels } from "@/lib/constants";
import { formatCurrency, formatScore } from "@/lib/format";
import type {
  ConfidenceLevel,
  FailureType,
  SessionWithRelations,
  TaskType,
  Tone,
} from "@/types";
import { byModel, computeStats, confidenceFromCount, leaderboard, mean } from "./aggregate";

export type SignalKind =
  | "regression"
  | "improvement"
  | "reliable-pick"
  | "low-value-spend"
  | "recurring-failure"
  | "weak-task";

export type Signal = {
  id: string;
  kind: SignalKind;
  tone: Tone;
  title: string;
  detail: string;
  /** Related entity, for deep-linking and prefilling a promoted insight. */
  entity?: { kind: "model" | "tool"; id: string };
  /** Suggested confidence when promoting this to a saved insight. */
  confidence: ConfidenceLevel;
};

/** Importance order for ranking — earlier kinds surface first. */
const KIND_RANK: Record<SignalKind, number> = {
  regression: 0,
  "recurring-failure": 1,
  "low-value-spend": 2,
  "weak-task": 3,
  "reliable-pick": 4,
  improvement: 5,
};

function modelLabel(s: SessionWithRelations): string {
  return s.model?.shortName ?? s.model?.name ?? "Unknown model";
}

/** Quality regressions / improvements: recent half vs older half, per model. */
function trendSignals(sessions: SessionWithRelations[]): Signal[] {
  const byModelId = new Map<string, SessionWithRelations[]>();
  for (const s of sessions) {
    if (!s.model) continue;
    const arr = byModelId.get(s.model.id);
    if (arr) arr.push(s);
    else byModelId.set(s.model.id, [s]);
  }

  const out: Signal[] = [];
  for (const [id, items] of byModelId) {
    if (items.length < 6) continue;
    const ordered = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
    const mid = Math.floor(ordered.length / 2);
    const older = mean(ordered.slice(0, mid).map((s) => s.qualityScore));
    const recent = mean(ordered.slice(mid).map((s) => s.qualityScore));
    if (older == null || recent == null) continue;
    const delta = recent - older;
    const label = modelLabel(ordered[0]);
    if (delta <= -1) {
      out.push({
        id: `regression:${id}`,
        kind: "regression",
        tone: "danger",
        title: `${label} quality is trending down`,
        detail: `Avg quality fell ${formatScore(older)} → ${formatScore(recent)} across your recent ${label} sessions. Worth re-checking before relying on it.`,
        entity: { kind: "model", id },
        confidence: confidenceFromCount(items.length),
      });
    } else if (delta >= 1) {
      out.push({
        id: `improvement:${id}`,
        kind: "improvement",
        tone: "success",
        title: `${label} is getting better for you`,
        detail: `Avg quality rose ${formatScore(older)} → ${formatScore(recent)} across your recent ${label} sessions.`,
        entity: { kind: "model", id },
        confidence: confidenceFromCount(items.length),
      });
    }
  }
  return out;
}

/** The most reliable well-evidenced model — a positive signal. */
function reliablePick(sessions: SessionWithRelations[]): Signal[] {
  const rows = leaderboard(sessions, byModel).filter(
    (r) => r.stats.count >= 4 && (r.stats.avgReliability ?? 0) >= 80,
  );
  if (!rows.length) return [];
  const top = rows.reduce((best, r) =>
    (r.stats.avgReliability ?? 0) > (best.stats.avgReliability ?? 0) ? r : best,
  );
  return [
    {
      id: `reliable-pick:${top.id}`,
      kind: "reliable-pick",
      tone: "success",
      title: `${top.label} is your most reliable model`,
      detail: `Reliability index ${formatScore(top.stats.avgReliability)} over ${top.stats.count} sessions — a safe default when stakes are high.`,
      entity: { kind: "model", id: top.id },
      confidence: confidenceFromCount(top.stats.count),
    },
  ];
}

/** A model you spend the most on while getting comparatively poor value. */
function lowValueSpend(sessions: SessionWithRelations[]): Signal[] {
  const rows = leaderboard(sessions, byModel).filter(
    (r) => r.stats.totalCost >= 1 && r.stats.avgCostValue != null,
  );
  if (rows.length < 2) return [];
  const costValues = rows
    .map((r) => r.stats.avgCostValue!)
    .sort((a, b) => a - b);
  const median = costValues[Math.floor(costValues.length / 2)];
  const candidates = rows.filter((r) => r.stats.avgCostValue! <= median);
  if (!candidates.length) return [];
  const worst = candidates.reduce((max, r) =>
    r.stats.totalCost > max.stats.totalCost ? r : max,
  );
  return [
    {
      id: `low-value-spend:${worst.id}`,
      kind: "low-value-spend",
      tone: "warning",
      title: `${worst.label} is costing more than it returns`,
      detail: `${formatCurrency(worst.stats.totalCost)} spent at ${formatScore(worst.stats.avgCostValue)} quality/$ — below your median. A cheaper model may do as well here.`,
      entity: { kind: "model", id: worst.id },
      confidence: confidenceFromCount(worst.stats.count),
    },
  ];
}

/** Recurring failure modes tied to a specific model. */
function recurringFailures(sessions: SessionWithRelations[]): Signal[] {
  const counts = new Map<
    string,
    { modelId: string; label: string; type: FailureType; n: number }
  >();
  for (const s of sessions) {
    if (!s.model) continue;
    for (const fp of s.failurePatterns ?? []) {
      const key = `${s.model.id}::${fp.type}`;
      const existing = counts.get(key);
      if (existing) existing.n += 1;
      else
        counts.set(key, {
          modelId: s.model.id,
          label: modelLabel(s),
          type: fp.type,
          n: 1,
        });
    }
  }
  return [...counts.values()]
    .filter((c) => c.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 2)
    .map((c) => ({
      id: `recurring-failure:${c.modelId}:${c.type}`,
      kind: "recurring-failure" as const,
      tone: "danger" as const,
      title: `${c.label}: recurring "${failureTypeLabels[c.type]}"`,
      detail: `"${failureTypeLabels[c.type]}" has happened ${c.n} times with ${c.label}. A guardrail or prompt tweak could pay off.`,
      entity: { kind: "model" as const, id: c.modelId },
      confidence: c.n >= 4 ? "high" : "medium",
    }));
}

/** Task types that underperform across all models. */
function weakTasks(sessions: SessionWithRelations[]): Signal[] {
  const byTask = new Map<TaskType, SessionWithRelations[]>();
  for (const s of sessions) {
    const arr = byTask.get(s.taskType);
    if (arr) arr.push(s);
    else byTask.set(s.taskType, [s]);
  }
  const out: Signal[] = [];
  for (const [task, items] of byTask) {
    if (items.length < 3) continue;
    const stats = computeStats(items);
    if (stats.avgQuality != null && stats.avgQuality < 5.5) {
      out.push({
        id: `weak-task:${task}`,
        kind: "weak-task",
        tone: "warning",
        title: `${taskTypeLabels[task]} consistently underperforms`,
        detail: `Avg quality ${formatScore(stats.avgQuality)} over ${stats.count} sessions. Check the Recommend page for a better-fit model.`,
        confidence: confidenceFromCount(items.length),
      });
    }
  }
  return out.sort((a, b) => a.detail.localeCompare(b.detail)).slice(0, 2);
}

/**
 * Derive ranked, plain-English signals from the user's confirmed sessions.
 * These are computed observations the user can review or promote to a saved
 * insight.
 */
export function computeSignals(sessions: SessionWithRelations[]): Signal[] {
  const all = [
    ...trendSignals(sessions),
    ...reliablePick(sessions),
    ...lowValueSpend(sessions),
    ...recurringFailures(sessions),
    ...weakTasks(sessions),
  ];
  return all.sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind]);
}
