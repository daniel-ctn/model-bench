import { db } from "@/db";
import {
  aiTools,
  failurePatterns,
  insights,
  models,
  projects,
  sessions,
} from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const [p, t, m, s, fp, ins] = await Promise.all([
    db.select().from(projects),
    db.select().from(aiTools),
    db.select().from(models),
    db.select().from(sessions),
    db.select().from(failurePatterns),
    db.select().from(insights),
  ]);

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
