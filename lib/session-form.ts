import { dateToInput } from "@/lib/normalize";
import type { SessionFormValues } from "@/lib/validations";
import type { SessionWithRelations } from "@/types";

/** Map a stored session into the form's value shape for editing. */
export function sessionToFormValues(s: SessionWithRelations): SessionFormValues {
  return {
    title: s.title,
    date: dateToInput(s.date),
    projectId: s.projectId ?? "none",
    toolId: s.toolId ?? "none",
    modelId: s.modelId ?? "none",
    taskType: s.taskType,
    workflowType: s.workflowType,
    promptSummary: s.promptSummary ?? "",
    taskDescription: s.taskDescription ?? "",
    outputSummary: s.outputSummary ?? "",
    resultStatus: s.resultStatus,
    timeSpentMinutes: s.timeSpentMinutes,
    estimatedTimeSavedMinutes: s.estimatedTimeSavedMinutes,
    estimatedCostUsd: s.estimatedCostUsd,
    quotaFeeling: s.quotaFeeling,
    humanInterventionLevel: s.humanInterventionLevel,
    testsRun: s.testsRun,
    testsPassed: s.testsPassed,
    causedRegression: s.causedRegression,
    requiredFollowupModel: s.requiredFollowupModel,
    followupModelId: s.followupModelId ?? "none",
    qualityScore: s.qualityScore,
    speedScore: s.speedScore,
    intentUnderstandingScore: s.intentUnderstandingScore,
    codeQualityScore: s.codeQualityScore,
    uiTasteScore: s.uiTasteScore,
    reliabilityScore: s.reliabilityScore,
    costValueScore: s.costValueScore,
    whatWorked: s.whatWorked ?? "",
    whatFailed: s.whatFailed ?? "",
    doDifferently: s.doDifferently ?? "",
    notes: s.notes ?? "",
    tags: s.tags ?? [],
    failurePatterns: s.failurePatterns.map((fp) => ({
      type: fp.type,
      severity: fp.severity,
      description: fp.description ?? "",
      possibleFix: fp.possibleFix ?? "",
    })),
  };
}
