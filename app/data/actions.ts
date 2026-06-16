"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  aiTools,
  failurePatterns,
  insights,
  models,
  projects,
  sessions,
  CONFIDENCE_LEVELS,
  FAILURE_TYPES,
  INSIGHT_STATUSES,
  INTERVENTION_LEVELS,
  MODEL_PROVIDERS,
  MODEL_STRENGTHS,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  QUOTA_FEELINGS,
  RESULT_STATUSES,
  SEVERITIES,
  TASK_TYPES,
  TOOL_CATEGORIES,
  WORKFLOW_TYPES,
} from "@/db/schema";
import { ok, fail, type ActionResult } from "@/lib/action-result";

const date = z.coerce.date().optional();
const id = z.uuid().optional();
const nstr = z.string().nullable().optional();
const nid = z.uuid().nullable().optional();
const nint = z.number().int().nullable().optional();
const nnum = z.number().nullable().optional();

const projectImport = z.object({
  id,
  name: z.string(),
  slug: z.string(),
  description: nstr,
  type: z.enum(PROJECT_TYPES),
  status: z.enum(PROJECT_STATUSES),
  color: z.string(),
  createdAt: date,
  updatedAt: date,
});

const toolImport = z.object({
  id,
  name: z.string(),
  category: z.enum(TOOL_CATEGORIES),
  website: nstr,
  notes: nstr,
  createdAt: date,
  updatedAt: date,
});

const modelImport = z.object({
  id,
  provider: z.enum(MODEL_PROVIDERS),
  name: z.string(),
  shortName: nstr,
  modelFamily: nstr,
  strengthLevel: z.enum(MODEL_STRENGTHS),
  pricingInputPerMTok: nnum,
  pricingOutputPerMTok: nnum,
  contextWindow: nint,
  knowledgeCutoff: nstr,
  notes: nstr,
  active: z.boolean().optional(),
  createdAt: date,
  updatedAt: date,
});

const sessionImport = z.object({
  id,
  title: z.string(),
  date: z.coerce.date(),
  projectId: nid,
  toolId: nid,
  modelId: nid,
  taskType: z.enum(TASK_TYPES),
  workflowType: z.enum(WORKFLOW_TYPES),
  promptSummary: nstr,
  taskDescription: nstr,
  outputSummary: nstr,
  resultStatus: z.enum(RESULT_STATUSES),
  timeSpentMinutes: z.number().int(),
  estimatedTimeSavedMinutes: z.number().int(),
  estimatedCostUsd: nnum,
  quotaFeeling: z.enum(QUOTA_FEELINGS),
  humanInterventionLevel: z.enum(INTERVENTION_LEVELS),
  testsRun: z.boolean(),
  testsPassed: z.boolean().nullable().optional(),
  causedRegression: z.boolean(),
  requiredFollowupModel: z.boolean(),
  followupModelId: nid,
  qualityScore: z.number().int(),
  speedScore: nint,
  intentUnderstandingScore: nint,
  codeQualityScore: nint,
  uiTasteScore: nint,
  reliabilityScore: nint,
  costValueScore: nint,
  whatWorked: nstr,
  whatFailed: nstr,
  doDifferently: nstr,
  notes: nstr,
  tags: z.array(z.string()).optional(),
  createdAt: date,
  updatedAt: date,
});

const failureImport = z.object({
  id,
  sessionId: z.uuid(),
  type: z.enum(FAILURE_TYPES),
  severity: z.enum(SEVERITIES),
  description: nstr,
  possibleFix: nstr,
  createdAt: date,
});

const insightImport = z.object({
  id,
  title: z.string(),
  description: nstr,
  relatedToolId: nid,
  relatedModelId: nid,
  relatedProjectId: nid,
  confidence: z.enum(CONFIDENCE_LEVELS),
  status: z.enum(INSIGHT_STATUSES),
  createdAt: date,
  updatedAt: date,
});

const backupSchema = z.object({
  projects: z.array(projectImport).default([]),
  tools: z.array(toolImport).default([]),
  models: z.array(modelImport).default([]),
  sessions: z.array(sessionImport).default([]),
  failurePatterns: z.array(failureImport).default([]),
  insights: z.array(insightImport).default([]),
});

export type ImportCounts = {
  projects: number;
  tools: number;
  models: number;
  sessions: number;
  failurePatterns: number;
  insights: number;
};

/**
 * Import a JSON backup. Existing rows (matched by id) are skipped, so importing
 * is non-destructive and safe to repeat.
 */
export async function importBackup(
  jsonText: string,
): Promise<ActionResult<ImportCounts>> {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return fail("That file isn't valid JSON.");
  }

  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("This doesn't look like a ModelBench backup file.");
  }
  const data = parsed.data;

  try {
    await db.transaction(async (tx) => {
      if (data.projects.length)
        await tx.insert(projects).values(data.projects).onConflictDoNothing();
      if (data.tools.length)
        await tx.insert(aiTools).values(data.tools).onConflictDoNothing();
      if (data.models.length)
        await tx.insert(models).values(data.models).onConflictDoNothing();
      if (data.sessions.length)
        await tx.insert(sessions).values(data.sessions).onConflictDoNothing();
      if (data.failurePatterns.length)
        await tx
          .insert(failurePatterns)
          .values(data.failurePatterns)
          .onConflictDoNothing();
      if (data.insights.length)
        await tx.insert(insights).values(data.insights).onConflictDoNothing();
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Import failed.");
  }

  for (const p of ["/", "/sessions", "/models", "/tools", "/projects", "/insights", "/reports", "/data"])
    revalidatePath(p);

  return ok({
    projects: data.projects.length,
    tools: data.tools.length,
    models: data.models.length,
    sessions: data.sessions.length,
    failurePatterns: data.failurePatterns.length,
    insights: data.insights.length,
  });
}
