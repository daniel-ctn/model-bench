"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { models } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";
import { ok, fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { MODEL_CATALOG } from "@/lib/model-catalog";
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
  const userId = await requireUserId();
  try {
    const [row] = await db
      .insert(models)
      .values({ ...toRow(parsed.data), ownerId: userId })
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
  const userId = await requireUserId();
  try {
    await db
      .update(models)
      .set(toRow(parsed.data))
      .where(and(eq(models.id, id), eq(models.ownerId, userId)));
    revalidate();
    revalidatePath(`/models/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

/** Bulk-add current models from the built-in catalog, skipping ones you have. */
export async function importCatalogModels(): Promise<
  ActionResult<{ added: number }>
> {
  const userId = await requireUserId();
  try {
    const existing = await db
      .select({ name: models.name, shortName: models.shortName })
      .from(models)
      .where(eq(models.ownerId, userId));
    const have = new Set(
      existing.flatMap((m) =>
        [m.name, m.shortName].filter(Boolean).map((s) => s!.toLowerCase()),
      ),
    );
    const toAdd = MODEL_CATALOG.filter(
      (c) =>
        !have.has(c.name.toLowerCase()) && !have.has(c.shortName.toLowerCase()),
    );
    if (toAdd.length) {
      await db.insert(models).values(
        toAdd.map((c) => ({
          ownerId: userId,
          provider: c.provider,
          name: c.name,
          shortName: c.shortName,
          modelFamily: c.modelFamily,
          strengthLevel: c.strengthLevel,
          pricingInputPerMTok: c.pricingInputPerMTok,
          pricingOutputPerMTok: c.pricingOutputPerMTok,
          contextWindow: c.contextWindow,
          knowledgeCutoff: c.knowledgeCutoff,
          notes: "Added from catalog — verify pricing & context.",
        })),
      );
    }
    revalidate();
    return ok({ added: toAdd.length });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function deleteModel(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  try {
    await db
      .delete(models)
      .where(and(eq(models.id, id), eq(models.ownerId, userId)));
    revalidate();
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}
