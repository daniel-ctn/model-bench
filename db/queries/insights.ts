import "server-only";

import { and, eq, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { insights } from "@/db/schema";
import type { InsightStatus, InsightWithRelations } from "@/types";

const withRelations = { tool: true, model: true, project: true } as const;

export type InsightFilters = {
  status?: InsightStatus;
  relatedModelId?: string;
  relatedToolId?: string;
  relatedProjectId?: string;
};

export async function listInsights(
  filters: InsightFilters = {},
): Promise<InsightWithRelations[]> {
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(insights.status, filters.status));
  if (filters.relatedModelId)
    conditions.push(eq(insights.relatedModelId, filters.relatedModelId));
  if (filters.relatedToolId)
    conditions.push(eq(insights.relatedToolId, filters.relatedToolId));
  if (filters.relatedProjectId)
    conditions.push(eq(insights.relatedProjectId, filters.relatedProjectId));

  const rows = (await db.query.insights.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: withRelations,
    orderBy: (i, { desc }) => [desc(i.updatedAt)],
  })) as InsightWithRelations[];
  return rows;
}

export async function getInsightById(
  id: string,
): Promise<InsightWithRelations | null> {
  const row = await db.query.insights.findFirst({
    where: eq(insights.id, id),
    with: withRelations,
  });
  return (row as InsightWithRelations | undefined) ?? null;
}
