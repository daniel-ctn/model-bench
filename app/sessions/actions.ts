"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { failurePatterns, sessions } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";
import { ok, fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { dateFromInput, idOrNull, textOrNull } from "@/lib/normalize";
import { sessionFormSchema, type SessionFormValues } from "@/lib/validations";

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "An unexpected error occurred.";
}

function toRow(v: SessionFormValues) {
  return {
    title: v.title.trim(),
    date: dateFromInput(v.date),
    projectId: idOrNull(v.projectId),
    toolId: idOrNull(v.toolId),
    modelId: idOrNull(v.modelId),
    taskType: v.taskType,
    workflowType: v.workflowType,
    promptSummary: textOrNull(v.promptSummary),
    taskDescription: textOrNull(v.taskDescription),
    outputSummary: textOrNull(v.outputSummary),
    resultStatus: v.resultStatus,
    timeSpentMinutes: v.timeSpentMinutes,
    estimatedTimeSavedMinutes: v.estimatedTimeSavedMinutes,
    estimatedCostUsd: v.estimatedCostUsd,
    quotaFeeling: v.quotaFeeling,
    humanInterventionLevel: v.humanInterventionLevel,
    testsRun: v.testsRun,
    testsPassed: v.testsRun ? v.testsPassed : null,
    causedRegression: v.causedRegression,
    requiredFollowupModel: v.requiredFollowupModel,
    followupModelId: v.requiredFollowupModel ? idOrNull(v.followupModelId) : null,
    qualityScore: v.qualityScore,
    speedScore: v.speedScore,
    intentUnderstandingScore: v.intentUnderstandingScore,
    codeQualityScore: v.codeQualityScore,
    uiTasteScore: v.uiTasteScore,
    reliabilityScore: v.reliabilityScore,
    costValueScore: v.costValueScore,
    whatWorked: textOrNull(v.whatWorked),
    whatFailed: textOrNull(v.whatFailed),
    doDifferently: textOrNull(v.doDifferently),
    notes: textOrNull(v.notes),
    tags: v.tags.map((t) => t.trim()).filter(Boolean),
  };
}

function failureRows(sessionId: string, v: SessionFormValues) {
  return v.failurePatterns.map((fp) => ({
    sessionId,
    type: fp.type,
    severity: fp.severity,
    description: textOrNull(fp.description),
    possibleFix: textOrNull(fp.possibleFix),
  }));
}

/** Revalidate every surface that aggregates session data. */
function revalidateAll() {
  for (const path of [
    "/",
    "/sessions",
    "/reports",
    "/models",
    "/tools",
    "/projects",
  ]) {
    revalidatePath(path);
  }
}

export async function createSession(
  values: SessionFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = sessionFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;
  const userId = await requireUserId();

  try {
    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(sessions)
        .values({ ...toRow(v), ownerId: userId })
        .returning({ id: sessions.id });
      const rows = failureRows(row.id, v);
      if (rows.length) await tx.insert(failurePatterns).values(rows);
      return row.id;
    });
    revalidateAll();
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function updateSession(
  id: string,
  values: SessionFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = sessionFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;
  const userId = await requireUserId();

  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(sessions)
        // Saving an edited session also confirms an AI-ingested draft.
        .set({ ...toRow(v), draft: false })
        .where(and(eq(sessions.id, id), eq(sessions.ownerId, userId)))
        .returning({ id: sessions.id });
      if (!updated.length) throw new Error("Session not found.");
      await tx
        .delete(failurePatterns)
        .where(eq(failurePatterns.sessionId, id));
      const rows = failureRows(id, v);
      if (rows.length) await tx.insert(failurePatterns).values(rows);
    });
    revalidateAll();
    revalidatePath(`/sessions/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function confirmSession(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  try {
    await db
      .update(sessions)
      .set({ draft: false })
      .where(and(eq(sessions.id, id), eq(sessions.ownerId, userId)));
    revalidateAll();
    revalidatePath(`/sessions/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function deleteSession(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  try {
    await db
      .delete(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.ownerId, userId)));
    revalidateAll();
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}
