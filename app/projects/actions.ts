"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { slugExists } from "@/db/queries";
import { requireUserId } from "@/lib/auth-helpers";
import { ok, fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/format";
import { textOrNull } from "@/lib/normalize";
import { projectFormSchema, type ProjectFormValues } from "@/lib/validations";

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "An unexpected error occurred.";
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "project";
  let slug = root;
  let n = 1;
  while (await slugExists(slug, excludeId)) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

function revalidate() {
  for (const p of ["/projects", "/", "/reports", "/sessions"]) revalidatePath(p);
}

export async function createProject(
  values: ProjectFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = projectFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;
  const userId = await requireUserId();
  try {
    const slug = await uniqueSlug(v.slug ? slugify(v.slug) : slugify(v.name));
    const [row] = await db
      .insert(projects)
      .values({
        ownerId: userId,
        name: v.name.trim(),
        slug,
        description: textOrNull(v.description),
        type: v.type,
        status: v.status,
        color: v.color,
      })
      .returning({ id: projects.id });
    revalidate();
    return ok({ id: row.id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function updateProject(
  id: string,
  values: ProjectFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = projectFormSchema.safeParse(values);
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;
  const userId = await requireUserId();
  try {
    const slug = await uniqueSlug(
      v.slug ? slugify(v.slug) : slugify(v.name),
      id,
    );
    await db
      .update(projects)
      .set({
        name: v.name.trim(),
        slug,
        description: textOrNull(v.description),
        type: v.type,
        status: v.status,
        color: v.color,
      })
      .where(and(eq(projects.id, id), eq(projects.ownerId, userId)));
    revalidate();
    revalidatePath(`/projects/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function deleteProject(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  try {
    await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.ownerId, userId)));
    revalidate();
    return ok({ id });
  } catch (e) {
    return fail(errMessage(e));
  }
}
