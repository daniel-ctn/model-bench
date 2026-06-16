"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { models } from "@/db/schema";
import { ok, fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { textOrNull } from "@/lib/normalize";
import { modelFormSchema, type ModelFormValues } from "@/lib/validations";

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "An unexpected error occurred.";
}

function toRow(v: ModelFormValues) {
  return {
    provider: v.provider,
    name: v.name.trim(),
    shortName: textOrNull(v.shortName),
    modelFamily: textOrNull(v.modelFamily),
    strengthLevel: v.strengthLevel,
    pricingInputPerMTok: v.pricingInputPerMTok,
    pricingOutputPerMTok: v.pricingOutputPerMTok,
    contextWindow: v.contextWindow,
    knowledgeCutoff: textOrNull(v.knowledgeCutoff),
    notes: textOrNull(v.notes),
    active: v.active,
  };
}

function revalidate() {
  for (const p of ["/models", "/", "/reports", "/sessions"]) revalidatePath(p);
}

export async function createModel(
  values: ModelFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = modelFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    const [row] = await db
      .insert(models)
      .values(toRow(parsed.data))
      .returning({ id: models.id });
    revalidate();
    return ok({ id: row.id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function updateModel(
  id: string,
  values: ModelFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = modelFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await db.update(models).set(toRow(parsed.data)).where(eq(models.id, id));
    revalidate();
    revalidatePath(`/models/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function deleteModel(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await db.delete(models).where(eq(models.id, id));
    revalidate();
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}
