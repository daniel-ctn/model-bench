import { z } from "zod";

import {
  FAILURE_TYPES,
  INTERVENTION_LEVELS,
  QUOTA_FEELINGS,
  RESULT_STATUSES,
  SEVERITIES,
  TASK_TYPES,
  WORKFLOW_TYPES,
} from "@/db/schema";

const score = z.coerce.number().int().min(1).max(10).nullish().catch(null);

/**
 * Forgiving payload an agent POSTs to /api/sessions/ingest. Relations are given
 * by name (resolved server-side). Unknown enum values fall back to a default
 * rather than rejecting the whole entry.
 */
export const ingestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  date: z.string().optional(),
  project: z.string().optional(),
  tool: z.string().optional(),
  model: z.string().optional(),
  followupModel: z.string().optional(),

  taskType: z.enum(TASK_TYPES).catch("other").default("other"),
  workflowType: z.enum(WORKFLOW_TYPES).catch("other").default("other"),
  resultStatus: z.enum(RESULT_STATUSES).catch("good").default("good"),
  quotaFeeling: z.enum(QUOTA_FEELINGS).catch("unknown").default("unknown"),
  humanInterventionLevel: z
    .enum(INTERVENTION_LEVELS)
    .catch("light-review")
    .default("light-review"),

  promptSummary: z.string().max(3000).nullish().catch(null),
  taskDescription: z.string().max(6000).nullish().catch(null),
  outputSummary: z.string().max(6000).nullish().catch(null),
  whatWorked: z.string().max(3000).nullish().catch(null),
  whatFailed: z.string().max(3000).nullish().catch(null),
  doDifferently: z.string().max(3000).nullish().catch(null),
  notes: z.string().max(4000).nullish().catch(null),

  timeSpentMinutes: z.coerce.number().int().min(0).max(100000).catch(0).default(0),
  estimatedTimeSavedMinutes: z.coerce
    .number()
    .int()
    .min(0)
    .max(100000)
    .catch(0)
    .default(0),
  estimatedCostUsd: z.coerce.number().min(0).nullish().catch(null),
  inputTokens: z.coerce.number().int().min(0).nullish().catch(null),
  outputTokens: z.coerce.number().int().min(0).nullish().catch(null),

  testsRun: z.coerce.boolean().catch(false).default(false),
  testsPassed: z.coerce.boolean().nullish().catch(null),
  causedRegression: z.coerce.boolean().catch(false).default(false),
  requiredFollowupModel: z.coerce.boolean().catch(false).default(false),

  qualityScore: z.coerce.number().int().min(1).max(10).catch(5).default(5),
  speedScore: score,
  intentUnderstandingScore: score,
  codeQualityScore: score,
  uiTasteScore: score,
  reliabilityScore: score,
  costValueScore: score,

  tags: z.array(z.string().trim().min(1).max(40)).max(30).catch([]).default([]),
  failurePatterns: z
    .array(
      z.object({
        type: z.enum(FAILURE_TYPES).catch("other").default("other"),
        severity: z.enum(SEVERITIES).catch("medium").default("medium"),
        description: z.string().max(1000).nullish().catch(null),
        possibleFix: z.string().max(1000).nullish().catch(null),
      }),
    )
    .max(20)
    .catch([])
    .default([]),
});

export type IngestPayload = z.infer<typeof ingestSchema>;
