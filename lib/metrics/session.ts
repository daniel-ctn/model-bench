import type { Session } from "@/db/schema";
import { SECONDARY_SCORE_FIELDS } from "@/lib/constants";
import type { InterventionLevel, ResultStatus, Tone } from "@/types";

/**
 * The subset of a session needed to compute derived metrics. Accepting a
 * structural type keeps these helpers usable with full rows or partial picks.
 */
export type MetricSession = Pick<
  Session,
  | "qualityScore"
  | "speedScore"
  | "intentUnderstandingScore"
  | "codeQualityScore"
  | "uiTasteScore"
  | "reliabilityScore"
  | "costValueScore"
  | "timeSpentMinutes"
  | "estimatedTimeSavedMinutes"
  | "estimatedCostUsd"
  | "resultStatus"
  | "humanInterventionLevel"
  | "quotaFeeling"
  | "testsRun"
  | "testsPassed"
  | "causedRegression"
  | "requiredFollowupModel"
>;

/** Net minutes saved = time the AI saved minus time you spent on it. */
export function netTimeSaved(s: MetricSession): number {
  return (s.estimatedTimeSavedMinutes ?? 0) - (s.timeSpentMinutes ?? 0);
}

/**
 * Cost-value index — quality earned per dollar spent.
 * Returns null when cost is unknown so it can be excluded from rankings.
 * Free usage (cost 0) yields a high but finite value.
 */
export function costValueIndex(s: MetricSession): number | null {
  const cost = s.estimatedCostUsd;
  if (cost == null) return null;
  if (cost <= 0) return s.qualityScore * 10;
  return s.qualityScore / cost;
}

const RESULT_BASE: Record<ResultStatus, number> = {
  excellent: 100,
  good: 82,
  "usable-with-edits": 62,
  poor: 35,
  failed: 10,
};

const INTERVENTION_PENALTY: Record<InterventionLevel, number> = {
  none: 0,
  "light-review": -3,
  "moderate-edits": -12,
  "heavy-rewrite": -25,
  abandoned: -45,
};

/**
 * Reliability index (0–100) blending result status, human intervention, test
 * outcomes, regressions and whether a follow-up model was needed.
 */
export function reliabilityIndex(s: MetricSession): number {
  let score = RESULT_BASE[s.resultStatus] + INTERVENTION_PENALTY[s.humanInterventionLevel];
  if (s.testsRun) {
    if (s.testsPassed === true) score += 8;
    else if (s.testsPassed === false) score -= 15;
  }
  if (s.causedRegression) score -= 20;
  if (s.requiredFollowupModel) score -= 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export type WorthItVerdict =
  | "worth-it"
  | "good-enough"
  | "too-expensive"
  | "avoid";

export const worthItLabels: Record<WorthItVerdict, string> = {
  "worth-it": "Definitely worth it",
  "good-enough": "Good enough",
  "too-expensive": "Too expensive",
  avoid: "Avoid for this task",
};

export const worthItTone: Record<WorthItVerdict, Tone> = {
  "worth-it": "success",
  "good-enough": "info",
  "too-expensive": "warning",
  avoid: "danger",
};

/** Heuristic "was it worth it?" verdict for a single session. */
export function worthItVerdict(s: MetricSession): WorthItVerdict {
  const rel = reliabilityIndex(s);
  const net = netTimeSaved(s);
  const cvi = costValueIndex(s);
  const expensive =
    s.quotaFeeling === "expensive" || s.quotaFeeling === "quota-heavy";
  const poorValue = cvi !== null && cvi < 3;

  if (s.resultStatus === "failed" || s.humanInterventionLevel === "abandoned" || rel < 35) {
    return "avoid";
  }
  if (
    rel >= 75 &&
    net >= 45 &&
    (s.resultStatus === "excellent" || s.resultStatus === "good") &&
    !(expensive && poorValue)
  ) {
    return "worth-it";
  }
  if (expensive && (net < 20 || poorValue)) {
    return "too-expensive";
  }
  return "good-enough";
}

/** Mean of every score that was actually recorded (quality + secondaries). */
export function overallScore(s: MetricSession): number | null {
  const values = [
    s.qualityScore,
    s.speedScore,
    s.intentUnderstandingScore,
    s.codeQualityScore,
    s.uiTasteScore,
    s.reliabilityScore,
    s.costValueScore,
  ].filter((v): v is number => typeof v === "number");
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Ordered score breakdown (quality first) for the detail view & radar. */
export function scoreBreakdown(
  s: MetricSession,
): { key: string; label: string; value: number | null }[] {
  return [
    { key: "qualityScore", label: "Quality", value: s.qualityScore },
    ...SECONDARY_SCORE_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      value: s[f.key],
    })),
  ];
}
