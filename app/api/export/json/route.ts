import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  aiTools,
  failurePatterns,
  insights,
  models,
  projects,
  sessions,
} from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUserId();

  const [p, t, m, s, ins] = await Promise.all([
    db.select().from(projects).where(eq(projects.ownerId, userId)),
    db.select().from(aiTools).where(eq(aiTools.ownerId, userId)),
    db.select().from(models).where(eq(models.ownerId, userId)),
    db.select().from(sessions).where(eq(sessions.ownerId, userId)),
    db.select().from(insights).where(eq(insights.ownerId, userId)),
  ]);

  const sessionIds = s.map((row) => row.id);
  const fp = sessionIds.length
    ? await db
        .select()
        .from(failurePatterns)
        .where(inArray(failurePatterns.sessionId, sessionIds))
    : [];

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: p,
    tools: t,
    models: m,
    sessions: s,
    failurePatterns: fp,
    insights: ins,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="modelbench-backup-${date}.json"`,
    },
  });
}
