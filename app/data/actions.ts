"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
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
import { requireUserId } from "@/lib/auth-helpers";
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
  inputTokens: nint,
  outputTokens: nint,
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
  const userId = await requireUserId();
  const owned = <T extends object>(rows: T[]) =>
    rows.map((r) => ({ ...r, ownerId: userId }));

  try {
    await db.transaction(async (tx) => {
      // Insert the entities first, then resolve relation references only
      // against rows this user actually owns — so a crafted backup can't point
      // sessions/insights/failures at another user's records.
      if (data.projects.length)
        await tx
          .insert(projects)
          .values(owned(data.projects))
          .onConflictDoNothing();
      if (data.tools.length)
        await tx.insert(aiTools).values(owned(data.tools)).onConflictDoNothing();
      if (data.models.length)
        await tx.insert(models).values(owned(data.models)).onConflictDoNothing();

      const [ownProjects, ownTools, ownModels] = await Promise.all([
        tx.select({ id: projects.id }).from(projects).where(eq(projects.ownerId, userId)),
        tx.select({ id: aiTools.id }).from(aiTools).where(eq(aiTools.ownerId, userId)),
        tx.select({ id: models.id }).from(models).where(eq(models.ownerId, userId)),
      ]);
      const projectIds = new Set(ownProjects.map((r) => r.id));
      const toolIds = new Set(ownTools.map((r) => r.id));
      const modelIds = new Set(ownModels.map((r) => r.id));
      const keep = (id: string | null | undefined, set: Set<string>) =>
        id && set.has(id) ? id : null;

      if (data.sessions.length)
        await tx
          .insert(sessions)
          .values(
            owned(data.sessions).map((s) => ({
              ...s,
              projectId: keep(s.projectId, projectIds),
              toolId: keep(s.toolId, toolIds),
              modelId: keep(s.modelId, modelIds),
              followupModelId: keep(s.followupModelId, modelIds),
            })),
          )
          .onConflictDoNothing();
      if (data.insights.length)
        await tx
          .insert(insights)
          .values(
            owned(data.insights).map((i) => ({
              ...i,
              relatedProjectId: keep(i.relatedProjectId, projectIds),
              relatedToolId: keep(i.relatedToolId, toolIds),
              relatedModelId: keep(i.relatedModelId, modelIds),
            })),
          )
          .onConflictDoNothing();
      if (data.failurePatterns.length) {
        const ownSessions = await tx
          .select({ id: sessions.id })
          .from(sessions)
          .where(eq(sessions.ownerId, userId));
        const sessionIds = new Set(ownSessions.map((r) => r.id));
        const rows = data.failurePatterns.filter((fp) =>
          sessionIds.has(fp.sessionId),
        );
        if (rows.length)
          await tx.insert(failurePatterns).values(rows).onConflictDoNothing();
      }
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
