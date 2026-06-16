import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { aiTools, type AiTool } from "@/db/schema";

export async function listTools(): Promise<AiTool[]> {
  return db.query.aiTools.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export async function getToolById(id: string): Promise<AiTool | null> {
  const row = await db.query.aiTools.findFirst({ where: eq(aiTools.id, id) });
  return row ?? null;
}
