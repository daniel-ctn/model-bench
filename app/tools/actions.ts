"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { aiTools } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";
import { ok, fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { textOrNull } from "@/lib/normalize";
import { toolFormSchema, type ToolFormValues } from "@/lib/validations";

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "An unexpected error occurred.";
}

function toRow(v: ToolFormValues) {
  return {
    name: v.name.trim(),
    category: v.category,
    website: textOrNull(v.website),
    notes: textOrNull(v.notes),
  };
}

function revalidate() {
  for (const p of ["/tools", "/", "/reports", "/sessions"]) revalidatePath(p);
}

export async function createTool(
  values: ToolFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = toolFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  const userId = await requireUserId();
  try {
    const [row] = await db
      .insert(aiTools)
      .values({ ...toRow(parsed.data), ownerId: userId })
      .returning({ id: aiTools.id });
    revalidate();
    return ok({ id: row.id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function updateTool(
  id: string,
  values: ToolFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = toolFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  const userId = await requireUserId();
  try {
    await db
      .update(aiTools)
      .set(toRow(parsed.data))
      .where(and(eq(aiTools.id, id), eq(aiTools.ownerId, userId)));
    revalidate();
    revalidatePath(`/tools/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function deleteTool(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  try {
    await db
      .delete(aiTools)
      .where(and(eq(aiTools.id, id), eq(aiTools.ownerId, userId)));
    revalidate();
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}
