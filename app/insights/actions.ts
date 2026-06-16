"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { insights } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";
import { ok, fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { idOrNull, textOrNull } from "@/lib/normalize";
import { insightFormSchema, type InsightFormValues } from "@/lib/validations";

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "An unexpected error occurred.";
}

function toRow(v: InsightFormValues) {
  return {
    title: v.title.trim(),
    description: textOrNull(v.description),
    relatedToolId: idOrNull(v.relatedToolId),
    relatedModelId: idOrNull(v.relatedModelId),
    relatedProjectId: idOrNull(v.relatedProjectId),
    confidence: v.confidence,
    status: v.status,
  };
}

function revalidate() {
  revalidatePath("/insights");
  revalidatePath("/");
}

export async function createInsight(
  values: InsightFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = insightFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  const userId = await requireUserId();
  try {
    const [row] = await db
      .insert(insights)
      .values({ ...toRow(parsed.data), ownerId: userId })
      .returning({ id: insights.id });
    revalidate();
    return ok({ id: row.id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function updateInsight(
  id: string,
  values: InsightFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = insightFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  const userId = await requireUserId();
  try {
    await db
      .update(insights)
      .set(toRow(parsed.data))
      .where(and(eq(insights.id, id), eq(insights.ownerId, userId)));
    revalidate();
    revalidatePath(`/insights/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function deleteInsight(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  try {
    await db
      .delete(insights)
      .where(and(eq(insights.id, id), eq(insights.ownerId, userId)));
    revalidate();
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}
