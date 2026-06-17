import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  aiTools,
  failurePatterns,
  models,
  projects,
  sessions,
  user,
} from "@/db/schema";
import { dateFromInput, textOrNull } from "@/lib/normalize";
import { computeTokenCost } from "@/lib/pricing";
import { ingestSchema } from "@/lib/validations/ingest";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function bearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function parseDate(value: string | undefined): Date {
  if (!value) return new Date();
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? dateFromInput(value)
    : new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export async function POST(request: Request) {
  const token = bearer(request);
  if (!token) {
    return json({ ok: false, error: "Missing bearer token." }, 401);
  }

  const owner = await db.query.user.findFirst({
    where: eq(user.ingestToken, token),
    columns: { id: true },
  });
  if (!owner) {
    return json({ ok: false, error: "Invalid ingest token." }, 401);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: "Body must be valid JSON." }, 400);
  }

  const parsed = ingestSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { ok: false, error: "Invalid payload.", issues: parsed.error.issues },
      400,
    );
  }
  const v = parsed.data;

  // Resolve relations by (case-insensitive) name, scoped to this user.
  const [tools, mdls, projs] = await Promise.all([
    db
      .select({ id: aiTools.id, name: aiTools.name })
      .from(aiTools)
      .where(eq(aiTools.ownerId, owner.id)),
    db
      .select({
        id: models.id,
        name: models.name,
        shortName: models.shortName,
        pricingInputPerMTok: models.pricingInputPerMTok,
        pricingOutputPerMTok: models.pricingOutputPerMTok,
      })
      .from(models)
      .where(eq(models.ownerId, owner.id)),
    db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.ownerId, owner.id)),
  ]);
  const norm = (s: string) => s.trim().toLowerCase();
  const toolId = v.tool
    ? (tools.find((t) => norm(t.name) === norm(v.tool!))?.id ?? null)
    : null;
  const findModel = (name?: string) =>
    name
      ? (mdls.find(
          (m) =>
            norm(m.name) === norm(name) ||
            (m.shortName && norm(m.shortName) === norm(name)),
        )?.id ?? null)
      : null;
  const projectId = v.project
    ? (projs.find((p) => norm(p.name) === norm(v.project!))?.id ?? null)
    : null;

  // Cost: prefer the supplied estimate, else derive it from tokens × pricing.
  const modelId = findModel(v.model);
  const resolvedModel = mdls.find((m) => m.id === modelId) ?? null;
  const estimatedCostUsd =
    v.estimatedCostUsd ??
    computeTokenCost(v.inputTokens, v.outputTokens, resolvedModel);

  try {
    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(sessions)
        .values({
          ownerId: owner.id,
          draft: true,
          title: v.title.trim(),
          date: parseDate(v.date),
          projectId,
          toolId,
          modelId,
          taskType: v.taskType,
          workflowType: v.workflowType,
          resultStatus: v.resultStatus,
          quotaFeeling: v.quotaFeeling,
          humanInterventionLevel: v.humanInterventionLevel,
          promptSummary: textOrNull(v.promptSummary),
          taskDescription: textOrNull(v.taskDescription),
          outputSummary: textOrNull(v.outputSummary),
          whatWorked: textOrNull(v.whatWorked),
          whatFailed: textOrNull(v.whatFailed),
          doDifferently: textOrNull(v.doDifferently),
          notes: textOrNull(v.notes),
          timeSpentMinutes: v.timeSpentMinutes,
          estimatedTimeSavedMinutes: v.estimatedTimeSavedMinutes,
          estimatedCostUsd,
          inputTokens: v.inputTokens ?? null,
          outputTokens: v.outputTokens ?? null,
          testsRun: v.testsRun,
          testsPassed: v.testsRun ? (v.testsPassed ?? null) : null,
          causedRegression: v.causedRegression,
          requiredFollowupModel: v.requiredFollowupModel,
          followupModelId: v.requiredFollowupModel
            ? findModel(v.followupModel)
            : null,
          qualityScore: v.qualityScore,
          speedScore: v.speedScore ?? null,
          intentUnderstandingScore: v.intentUnderstandingScore ?? null,
          codeQualityScore: v.codeQualityScore ?? null,
          uiTasteScore: v.uiTasteScore ?? null,
          reliabilityScore: v.reliabilityScore ?? null,
          costValueScore: v.costValueScore ?? null,
          tags: v.tags,
        })
        .returning({ id: sessions.id });

      if (v.failurePatterns.length) {
        await tx.insert(failurePatterns).values(
          v.failurePatterns.map((fp) => ({
            sessionId: row.id,
            type: fp.type,
            severity: fp.severity,
            description: textOrNull(fp.description),
            possibleFix: textOrNull(fp.possibleFix),
          })),
        );
      }
      return row.id;
    });

    const base = process.env.BETTER_AUTH_URL ?? "";
    return json({
      ok: true,
      id,
      draft: true,
      reviewUrl: `${base}/sessions/${id}`,
    });
  } catch (e) {
    return json(
      { ok: false, error: e instanceof Error ? e.message : "Ingest failed." },
      500,
    );
  }
}
