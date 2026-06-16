import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { models, type Model } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";

export async function listModels(): Promise<Model[]> {
  const userId = await requireUserId();
  return db.query.models.findMany({
    where: eq(models.ownerId, userId),
    orderBy: (m, { asc }) => [asc(m.provider), asc(m.name)],
  });
}

export async function listActiveModels(): Promise<Model[]> {
  const userId = await requireUserId();
  return db.query.models.findMany({
    where: and(eq(models.ownerId, userId), eq(models.active, true)),
    orderBy: (m, { asc }) => [asc(m.provider), asc(m.name)],
  });
}

export async function getModelById(id: string): Promise<Model | null> {
  const userId = await requireUserId();
  const row = await db.query.models.findFirst({
    where: and(eq(models.id, id), eq(models.ownerId, userId)),
  });
  return row ?? null;
}
