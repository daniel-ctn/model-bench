import "server-only";

import { and, eq, gte, lte, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { sessions } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";
import type { ResultStatus, SessionWithRelations, TaskType } from "@/types";

const withRelations = {
  project: true,
  tool: true,
  model: true,
  followupModel: true,
  failurePatterns: true,
} as const;

export type SessionFilters = {
  projectId?: string;
  toolId?: string;
  modelId?: string;
  taskType?: TaskType;
  resultStatus?: ResultStatus;
  from?: Date;
  to?: Date;
  minQuality?: number;
  hasFailure?: boolean;
  search?: string;
};

function matchesSearch(s: SessionWithRelations, query: string): boolean {
  const haystack = [
    s.title,
    s.promptSummary,
    s.outputSummary,
    s.taskDescription,
    s.notes,
    s.whatWorked,
    s.whatFailed,
    ...(s.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

/**
 * Fetch the current user's sessions with all relations. Equality + date +
 * quality filters run in SQL; free-text search, tag matching and "has failure"
 * run in memory.
 */
export async function listSessions(
  filters: SessionFilters = {},
): Promise<SessionWithRelations[]> {
  const userId = await requireUserId();
  const conditions: SQL[] = [eq(sessions.ownerId, userId)];
  if (filters.projectId) conditions.push(eq(sessions.projectId, filters.projectId));
  if (filters.toolId) conditions.push(eq(sessions.toolId, filters.toolId));
  if (filters.modelId) conditions.push(eq(sessions.modelId, filters.modelId));
  if (filters.taskType) conditions.push(eq(sessions.taskType, filters.taskType));
  if (filters.resultStatus)
    conditions.push(eq(sessions.resultStatus, filters.resultStatus));
  if (filters.from) conditions.push(gte(sessions.date, filters.from));
  if (filters.to) conditions.push(lte(sessions.date, filters.to));
  if (typeof filters.minQuality === "number")
    conditions.push(gte(sessions.qualityScore, filters.minQuality));

  const rows = (await db.query.sessions.findMany({
    where: and(...conditions),
    with: withRelations,
    orderBy: (s, { desc }) => [desc(s.date), desc(s.createdAt)],
  })) as SessionWithRelations[];

  let result = rows;
  if (typeof filters.hasFailure === "boolean") {
    result = result.filter(
      (s) => s.failurePatterns.length > 0 === filters.hasFailure,
    );
  }
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    result = result.filter((s) => matchesSearch(s, search));
  }
  return result;
}

export async function getSessionById(
  id: string,
): Promise<SessionWithRelations | null> {
  const userId = await requireUserId();
  const row = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, id), eq(sessions.ownerId, userId)),
    with: withRelations,
  });
  return (row as SessionWithRelations | undefined) ?? null;
}

export async function getRecentSessions(
  limit = 8,
): Promise<SessionWithRelations[]> {
  const userId = await requireUserId();
  const rows = (await db.query.sessions.findMany({
    where: eq(sessions.ownerId, userId),
    with: withRelations,
    orderBy: (s, { desc }) => [desc(s.date), desc(s.createdAt)],
    limit,
  })) as SessionWithRelations[];
  return rows;
}
