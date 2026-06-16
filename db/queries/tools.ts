import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { aiTools, type AiTool } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";

export async function listTools(): Promise<AiTool[]> {
  const userId = await requireUserId();
  return db.query.aiTools.findMany({
    where: eq(aiTools.ownerId, userId),
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export async function getToolById(id: string): Promise<AiTool | null> {
  const userId = await requireUserId();
  const row = await db.query.aiTools.findFirst({
    where: and(eq(aiTools.id, id), eq(aiTools.ownerId, userId)),
  });
  return row ?? null;
}
