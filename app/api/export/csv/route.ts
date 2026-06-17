import { listSessions } from "@/db/queries";
import { netTimeSaved, reliabilityIndex, worthItVerdict } from "@/lib/metrics";
import { worthItLabels } from "@/lib/metrics";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  // Neutralize spreadsheet formula injection (CWE-1236): a text cell starting
  // with a formula trigger is prefixed with a quote so Excel/Sheets treat it as
  // literal text. Numbers (e.g. negative deltas) are left untouched.
  const guarded =
    typeof value !== "number" && /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(guarded)
    ? `"${guarded.replace(/"/g, '""')}"`
    : guarded;
}

const HEADERS = [
  "date",
  "title",
  "project",
  "tool",
  "model",
  "taskType",
  "workflowType",
  "resultStatus",
  "timeSpentMinutes",
  "estimatedTimeSavedMinutes",
  "netTimeSavedMinutes",
  "estimatedCostUsd",
  "quotaFeeling",
  "humanInterventionLevel",
  "qualityScore",
  "speedScore",
  "intentUnderstandingScore",
  "codeQualityScore",
  "uiTasteScore",
  "reliabilityScore",
  "costValueScore",
  "reliabilityIndex",
  "worthIt",
  "testsRun",
  "testsPassed",
  "causedRegression",
  "failureCount",
  "tags",
  "notes",
];

export async function GET() {
  const sessions = await listSessions();

  const lines = [HEADERS.join(",")];
  for (const s of sessions) {
    const row = [
      s.date.toISOString().slice(0, 10),
      s.title,
      s.project?.name ?? "",
      s.tool?.name ?? "",
      s.model?.shortName ?? s.model?.name ?? "",
      s.taskType,
      s.workflowType,
      s.resultStatus,
      s.timeSpentMinutes,
      s.estimatedTimeSavedMinutes,
      netTimeSaved(s),
      s.estimatedCostUsd ?? "",
      s.quotaFeeling,
      s.humanInterventionLevel,
      s.qualityScore,
      s.speedScore ?? "",
      s.intentUnderstandingScore ?? "",
      s.codeQualityScore ?? "",
      s.uiTasteScore ?? "",
      s.reliabilityScore ?? "",
      s.costValueScore ?? "",
      reliabilityIndex(s),
      worthItLabels[worthItVerdict(s)],
      s.testsRun,
      s.testsPassed ?? "",
      s.causedRegression,
      s.failurePatterns.length,
      s.tags.join("; "),
      s.notes ?? "",
    ];
    lines.push(row.map(csvCell).join(","));
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="modelbench-sessions-${date}.csv"`,
    },
  });
}
