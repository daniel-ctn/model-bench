import { z } from "zod";

import {
  INTERVENTION_LEVELS,
  QUOTA_FEELINGS,
  RESULT_STATUSES,
  TASK_TYPES,
  WORKFLOW_TYPES,
} from "@/db/schema";
import { failurePatternInputSchema } from "./failure-pattern";
import {
  idSelect,
  optionalNonNegative,
  optionalNonNegativeInt,
  optionalScore,
  optionalText,
  requiredScore,
  requiredText,
} from "./shared";

export const sessionFormSchema = z.object({
  title: requiredText("Give the session a title", 200),
  date: z.string().min(1, "Pick a date"),
  projectId: idSelect,
  toolId: idSelect,
  modelId: idSelect,
  taskType: z.enum(TASK_TYPES),
  workflowType: z.enum(WORKFLOW_TYPES),
  promptSummary: optionalText(3000),
  taskDescription: optionalText(6000),
  outputSummary: optionalText(6000),
  resultStatus: z.enum(RESULT_STATUSES),
  timeSpentMinutes: z.number().int().min(0).max(100000),
  estimatedTimeSavedMinutes: z.number().int().min(0).max(100000),
  estimatedCostUsd: optionalNonNegative,
  inputTokens: optionalNonNegativeInt,
  outputTokens: optionalNonNegativeInt,
  quotaFeeling: z.enum(QUOTA_FEELINGS),
  humanInterventionLevel: z.enum(INTERVENTION_LEVELS),
  testsRun: z.boolean(),
  testsPassed: z.boolean().nullable(),
  causedRegression: z.boolean(),
  requiredFollowupModel: z.boolean(),
  followupModelId: idSelect,
  qualityScore: requiredScore,
  speedScore: optionalScore,
  intentUnderstandingScore: optionalScore,
  codeQualityScore: optionalScore,
  uiTasteScore: optionalScore,
  reliabilityScore: optionalScore,
  costValueScore: optionalScore,
  whatWorked: optionalText(3000),
  whatFailed: optionalText(3000),
  doDifferently: optionalText(3000),
  notes: optionalText(4000),
  tags: z.array(z.string().trim().min(1).max(40)).max(30),
  failurePatterns: z.array(failurePatternInputSchema).max(20),
});

export type SessionFormValues = z.infer<typeof sessionFormSchema>;

/** Today's date as yyyy-MM-dd for the date input default. */
function todayInput(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

export function makeSessionDefaults(): SessionFormValues {
  return {
    title: "",
    date: todayInput(),
    projectId: "none",
    toolId: "none",
    modelId: "none",
    taskType: "frontend-ui",
    workflowType: "iterative-chat",
    promptSummary: "",
    taskDescription: "",
    outputSummary: "",
    resultStatus: "good",
    timeSpentMinutes: 0,
    estimatedTimeSavedMinutes: 0,
    estimatedCostUsd: null,
    inputTokens: null,
    outputTokens: null,
    quotaFeeling: "unknown",
    humanInterventionLevel: "light-review",
    testsRun: false,
    testsPassed: null,
    causedRegression: false,
    requiredFollowupModel: false,
    followupModelId: "none",
    qualityScore: 7,
    speedScore: null,
    intentUnderstandingScore: null,
    codeQualityScore: null,
    uiTasteScore: null,
    reliabilityScore: null,
    costValueScore: null,
    whatWorked: "",
    whatFailed: "",
    doDifferently: "",
    notes: "",
    tags: [],
    failurePatterns: [],
  };
}
