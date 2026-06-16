import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects, type Project } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";

export async function listProjects(): Promise<Project[]> {
  const userId = await requireUserId();
  return db.query.projects.findMany({
    where: eq(projects.ownerId, userId),
    orderBy: (p, { asc }) => [asc(p.name)],
  });
}

export async function getProjectById(id: string): Promise<Project | null> {
  const userId = await requireUserId();
  const row = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.ownerId, userId)),
  });
  return row ?? null;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const userId = await requireUserId();
  const row = await db.query.projects.findFirst({
    where: and(eq(projects.slug, slug), eq(projects.ownerId, userId)),
  });
  return row ?? null;
}

export async function slugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const userId = await requireUserId();
  const row = await db.query.projects.findFirst({
    where: and(eq(projects.slug, slug), eq(projects.ownerId, userId)),
    columns: { id: true },
  });
  if (!row) return false;
  return excludeId ? row.id !== excludeId : true;
}
