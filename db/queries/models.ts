import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { models, type Model } from "@/db/schema";

export async function listModels(): Promise<Model[]> {
  return db.query.models.findMany({
    orderBy: (m, { asc }) => [asc(m.provider), asc(m.name)],
  });
}

export async function listActiveModels(): Promise<Model[]> {
  return db.query.models.findMany({
    where: eq(models.active, true),
    orderBy: (m, { asc }) => [asc(m.provider), asc(m.name)],
  });
}

export async function getModelById(id: string): Promise<Model | null> {
  const row = await db.query.models.findFirst({ where: eq(models.id, id) });
  return row ?? null;
}
