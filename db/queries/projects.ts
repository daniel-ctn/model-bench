import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { projects, type Project } from "@/db/schema";

export async function listProjects(): Promise<Project[]> {
  return db.query.projects.findMany({
    orderBy: (p, { asc }) => [asc(p.name)],
  });
}

export async function getProjectById(id: string): Promise<Project | null> {
  const row = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  return row ?? null;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const row = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });
  return row ?? null;
}

export async function slugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const row = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    columns: { id: true },
  });
  if (!row) return false;
  return excludeId ? row.id !== excludeId : true;
}
