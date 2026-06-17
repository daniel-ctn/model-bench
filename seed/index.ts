import "dotenv/config";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import {
  account,
  aiTools,
  failurePatterns,
  insights,
  models,
  projects,
  session,
  sessions,
  user,
  verification,
  type NewSession,
} from "@/db/schema";
import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD } from "@/lib/demo";

const now = new Date();
function daysAgo(n: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

/** Create the demo account (idempotent) and return its id. */
async function ensureDemoUser(): Promise<string> {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, DEMO_EMAIL),
  });
  if (existing) return existing.id;

  // Minimal auth instance (no nextCookies) so it runs outside a request.
  const seedAuth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET ?? "dev-insecure-secret-change-me",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: { enabled: true, autoSignIn: false },
  });
  await seedAuth.api.signUpEmail({
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: DEMO_NAME },
  });
  const created = await db.query.user.findFirst({
    where: eq(user.email, DEMO_EMAIL),
  });
  if (!created) throw new Error("Could not create the demo user.");
  return created.id;
}

/** Wipe the demo account's data (and any pre-auth orphan rows). */
async function resetFor(ownerId: string) {
  // Deleting sessions cascades to failure patterns.
  await db
    .delete(sessions)
    .where(or(eq(sessions.ownerId, ownerId), isNull(sessions.ownerId)));
  await db
    .delete(insights)
    .where(or(eq(insights.ownerId, ownerId), isNull(insights.ownerId)));
  await db
    .delete(models)
    .where(or(eq(models.ownerId, ownerId), isNull(models.ownerId)));
  await db
    .delete(aiTools)
    .where(or(eq(aiTools.ownerId, ownerId), isNull(aiTools.ownerId)));
  await db
    .delete(projects)
    .where(or(eq(projects.ownerId, ownerId), isNull(projects.ownerId)));
}

async function main() {
  console.log("Ensuring demo account…");
  const ownerId = await ensureDemoUser();

  console.log("Resetting demo data…");
  await resetFor(ownerId);

  console.log("Seeding projects, tools, models…");
  const projectRows = await db
    .insert(projects)
    .values([
      {
        name: "SmartTrips",
        slug: "smarttrips",
        description: "AI trip planner with itinerary generation and maps.",
        type: "commercial",
        status: "active",
        color: "#7c5cff",
      },
      {
        name: "DueKind",
        slug: "duekind",
        description: "Invoicing and dunning automation for freelancers.",
        type: "commercial",
        status: "active",
        color: "#22d3ee",
      },
      {
        name: "BurnCap",
        slug: "burncap",
        description: "Personal AI spend & quota tracker.",
        type: "personal",
        status: "active",
        color: "#34d399",
      },
      {
        name: "MergeAttest",
        slug: "mergeattest",
        description: "PR attestation & change-risk reports for teams.",
        type: "client",
        status: "active",
        color: "#f59e0b",
      },
      {
        name: "Eastbase Studio",
        slug: "eastbase-studio",
        description: "Creative studio site with generated imagery.",
        type: "experiment",
        status: "paused",
        color: "#f472b6",
      },
    ])
    .returning();
  const P = Object.fromEntries(projectRows.map((p) => [p.name, p.id]));

  const toolRows = await db
    .insert(aiTools)
    .values([
      {
        name: "Claude Code",
        category: "coding-agent",
        website: "https://claude.com/claude-code",
        notes: "Primary agent for multi-file work and refactors.",
      },
      {
        name: "Codex",
        category: "coding-agent",
        website: "https://openai.com",
        notes: "Strong autonomous coding; good with image context.",
      },
      {
        name: "Cursor",
        category: "IDE",
        website: "https://cursor.com",
        notes: "In-editor pair programming and quick edits.",
      },
      {
        name: "ChatGPT",
        category: "chat-assistant",
        website: "https://chatgpt.com",
        notes: "Research, writing and product thinking.",
      },
    ])
    .returning();
  const T = Object.fromEntries(toolRows.map((t) => [t.name, t.id]));

  const modelRows = await db
    .insert(models)
    .values([
      {
        provider: "OpenAI",
        name: "GPT-5.5",
        shortName: "GPT-5.5",
        modelFamily: "GPT-5",
        strengthLevel: "flagship",
        pricingInputPerMTok: 1.25,
        pricingOutputPerMTok: 10,
        contextWindow: 400000,
        knowledgeCutoff: "Mar 2026",
        notes: "Excellent backend & agentic coding.",
      },
      {
        provider: "OpenAI",
        name: "GPT-5.4 mini",
        shortName: "5.4 mini",
        modelFamily: "GPT-5",
        strengthLevel: "small",
        pricingInputPerMTok: 0.15,
        pricingOutputPerMTok: 0.6,
        contextWindow: 256000,
        knowledgeCutoff: "Dec 2025",
        notes: "Cheap workhorse for simple tasks.",
      },
      {
        provider: "Anthropic",
        name: "Claude Opus 4.8",
        shortName: "Opus 4.8",
        modelFamily: "Claude 4",
        strengthLevel: "flagship",
        pricingInputPerMTok: 5,
        pricingOutputPerMTok: 25,
        contextWindow: 1000000,
        knowledgeCutoff: "Jan 2026",
        notes: "Best UI taste & large refactors.",
      },
      {
        provider: "Anthropic",
        name: "Claude Sonnet 4.6",
        shortName: "Sonnet 4.6",
        modelFamily: "Claude 4",
        strengthLevel: "medium",
        pricingInputPerMTok: 3,
        pricingOutputPerMTok: 15,
        contextWindow: 1000000,
        knowledgeCutoff: "Jan 2026",
        notes: "Great all-rounder, cheaper than Opus.",
      },
      {
        provider: "Google",
        name: "Gemini 3 Pro",
        shortName: "Gemini 3",
        modelFamily: "Gemini",
        strengthLevel: "flagship",
        pricingInputPerMTok: 2,
        pricingOutputPerMTok: 12,
        contextWindow: 2000000,
        knowledgeCutoff: "Feb 2026",
        notes: "Research and huge-context tasks.",
      },
      {
        provider: "Alibaba",
        name: "Qwen3 Coder",
        shortName: "Qwen3 Coder",
        modelFamily: "Qwen",
        strengthLevel: "coding-specialized",
        pricingInputPerMTok: 0.3,
        pricingOutputPerMTok: 1.2,
        contextWindow: 256000,
        knowledgeCutoff: "Nov 2025",
        notes: "Strong value for routine coding.",
      },
      {
        provider: "DeepSeek",
        name: "DeepSeek V3.2",
        shortName: "DeepSeek V3.2",
        modelFamily: "DeepSeek",
        strengthLevel: "reasoning",
        pricingInputPerMTok: 0.28,
        pricingOutputPerMTok: 1.1,
        contextWindow: 128000,
        knowledgeCutoff: "Oct 2025",
        notes: "Cheap reasoning for debugging.",
      },
      {
        provider: "MiniMax",
        name: "MiniMax M2",
        shortName: "MiniMax M2",
        modelFamily: "MiniMax",
        strengthLevel: "medium",
        pricingInputPerMTok: 0.3,
        pricingOutputPerMTok: 1.2,
        contextWindow: 200000,
        knowledgeCutoff: "Nov 2025",
        notes: "Used for media generation experiments.",
      },
    ])
    .returning();
  const M = Object.fromEntries(
    modelRows.map((m) => [m.shortName ?? m.name, m.id]),
  );

  type Scenario = Partial<NewSession> & {
    title: string;
    project: string;
    tool: string;
    model: string;
    taskType: NewSession["taskType"];
    workflowType: NewSession["workflowType"];
    resultStatus: NewSession["resultStatus"];
    dayOffset: number;
    failures?: {
      type: (typeof failurePatterns.$inferInsert)["type"];
      severity: (typeof failurePatterns.$inferInsert)["severity"];
      description?: string;
      possibleFix?: string;
    }[];
  };

  const scenarios: Scenario[] = [
    {
      title: "Rebuild SmartTrips itinerary view as server components",
      project: "SmartTrips",
      tool: "Claude Code",
      model: "Opus 4.8",
      taskType: "frontend-ui",
      workflowType: "agent-autonomous",
      resultStatus: "excellent",
      dayOffset: 2,
      promptSummary: "Convert itinerary page to RSC with streaming.",
      outputSummary: "Clean RSC split, great empty states.",
      whatWorked: "Nailed the layout and loading states first try.",
      timeSpentMinutes: 35,
      estimatedTimeSavedMinutes: 180,
      estimatedCostUsd: 0.9,
      quotaFeeling: "fair",
      humanInterventionLevel: "light-review",
      testsRun: true,
      testsPassed: true,
      qualityScore: 9,
      speedScore: 8,
      codeQualityScore: 9,
      uiTasteScore: 9,
      reliabilityScore: 9,
      costValueScore: 8,
      tags: ["rsc", "ui", "refactor"],
    },
    {
      title: "DueKind dunning email sequence backend",
      project: "DueKind",
      tool: "Codex",
      model: "GPT-5.5",
      taskType: "backend-api",
      workflowType: "agent-autonomous",
      resultStatus: "good",
      dayOffset: 3,
      promptSummary: "Build scheduled dunning with retries.",
      outputSummary: "Solid queue + retry, missed idempotency at first.",
      whatWorked: "Good architecture and cron wiring.",
      whatFailed: "Initial version double-sent on retry.",
      timeSpentMinutes: 50,
      estimatedTimeSavedMinutes: 150,
      estimatedCostUsd: 1.6,
      quotaFeeling: "fair",
      humanInterventionLevel: "moderate-edits",
      testsRun: true,
      testsPassed: true,
      qualityScore: 8,
      speedScore: 7,
      codeQualityScore: 8,
      reliabilityScore: 7,
      costValueScore: 7,
      tags: ["queue", "email"],
      failures: [
        {
          type: "under-engineered",
          severity: "medium",
          description: "No idempotency key on retry path.",
          possibleFix: "Add dedupe key per invoice+stage.",
        },
      ],
    },
    {
      title: "Fix flaky auth redirect loop",
      project: "DueKind",
      tool: "Cursor",
      model: "DeepSeek V3.2",
      taskType: "debugging",
      workflowType: "pair-programming",
      resultStatus: "good",
      dayOffset: 5,
      promptSummary: "Track down redirect loop after login.",
      outputSummary: "Found stale cookie check; cheap and fast.",
      timeSpentMinutes: 25,
      estimatedTimeSavedMinutes: 60,
      estimatedCostUsd: 0.05,
      quotaFeeling: "cheap",
      humanInterventionLevel: "light-review",
      testsRun: true,
      testsPassed: true,
      qualityScore: 8,
      speedScore: 8,
      reliabilityScore: 8,
      costValueScore: 10,
      tags: ["auth", "bug"],
    },
    {
      title: "BurnCap spend dashboard charts",
      project: "BurnCap",
      tool: "Claude Code",
      model: "Sonnet 4.6",
      taskType: "frontend-ui",
      workflowType: "iterative-chat",
      resultStatus: "good",
      dayOffset: 6,
      outputSummary: "Decent charts, needed taste pass on spacing.",
      whatFailed: "Spacing and legend felt generic.",
      timeSpentMinutes: 40,
      estimatedTimeSavedMinutes: 90,
      estimatedCostUsd: 0.4,
      quotaFeeling: "fair",
      humanInterventionLevel: "moderate-edits",
      testsRun: false,
      qualityScore: 7,
      uiTasteScore: 6,
      speedScore: 7,
      costValueScore: 7,
      tags: ["charts", "ui"],
      failures: [
        {
          type: "bad-ui-taste",
          severity: "low",
          description: "Default-looking spacing & legend.",
          possibleFix: "Give explicit spacing + color tokens.",
        },
      ],
    },
    {
      title: "Large refactor: extract MergeAttest report engine",
      project: "MergeAttest",
      tool: "Claude Code",
      model: "Opus 4.8",
      taskType: "refactor",
      workflowType: "agent-autonomous",
      resultStatus: "excellent",
      dayOffset: 8,
      outputSummary: "Cleanly split the engine, kept tests green.",
      whatWorked: "Handled 20+ files without breaking anything.",
      timeSpentMinutes: 55,
      estimatedTimeSavedMinutes: 300,
      estimatedCostUsd: 2.2,
      quotaFeeling: "expensive",
      humanInterventionLevel: "light-review",
      testsRun: true,
      testsPassed: true,
      qualityScore: 9,
      codeQualityScore: 9,
      reliabilityScore: 9,
      speedScore: 8,
      costValueScore: 7,
      tags: ["refactor", "architecture"],
    },
    {
      title: "Same refactor attempted with cheaper model",
      project: "MergeAttest",
      tool: "Cursor",
      model: "Qwen3 Coder",
      taskType: "refactor",
      workflowType: "pair-programming",
      resultStatus: "usable-with-edits",
      dayOffset: 8,
      outputSummary: "Got 70% there but tangled a couple modules.",
      whatFailed: "Lost track of cross-module imports.",
      timeSpentMinutes: 70,
      estimatedTimeSavedMinutes: 80,
      estimatedCostUsd: 0.2,
      quotaFeeling: "cheap",
      humanInterventionLevel: "heavy-rewrite",
      testsRun: true,
      testsPassed: false,
      causedRegression: true,
      qualityScore: 5,
      codeQualityScore: 5,
      reliabilityScore: 4,
      costValueScore: 6,
      tags: ["refactor"],
      failures: [
        {
          type: "broke-existing-code",
          severity: "high",
          description: "Broke import graph in two modules.",
          possibleFix: "Use a stronger model for cross-module refactors.",
        },
      ],
    },
    {
      title: "Research: best vector DB for SmartTrips",
      project: "SmartTrips",
      tool: "ChatGPT",
      model: "Gemini 3",
      taskType: "research",
      workflowType: "research-assistant",
      resultStatus: "good",
      dayOffset: 9,
      outputSummary: "Solid comparison; a couple stale price claims.",
      timeSpentMinutes: 30,
      estimatedTimeSavedMinutes: 120,
      estimatedCostUsd: 0.3,
      quotaFeeling: "cheap",
      humanInterventionLevel: "light-review",
      qualityScore: 8,
      intentUnderstandingScore: 8,
      speedScore: 9,
      costValueScore: 8,
      tags: ["research", "infra"],
      failures: [
        {
          type: "hallucinated-api",
          severity: "low",
          description: "Quoted an outdated pricing tier.",
          possibleFix: "Ask for citations / verify pricing.",
        },
      ],
    },
    {
      title: "Write SmartTrips launch blog post",
      project: "SmartTrips",
      tool: "ChatGPT",
      model: "GPT-5.5",
      taskType: "writing",
      workflowType: "writing-assistant",
      resultStatus: "good",
      dayOffset: 10,
      outputSummary: "Good structure; tone needed warming up.",
      timeSpentMinutes: 35,
      estimatedTimeSavedMinutes: 80,
      estimatedCostUsd: 0.25,
      quotaFeeling: "cheap",
      humanInterventionLevel: "moderate-edits",
      qualityScore: 7,
      intentUnderstandingScore: 7,
      speedScore: 8,
      costValueScore: 8,
      tags: ["writing", "marketing"],
    },
    {
      title: "Product thinking: BurnCap pricing tiers",
      project: "BurnCap",
      tool: "ChatGPT",
      model: "Opus 4.8",
      taskType: "product-thinking",
      workflowType: "iterative-chat",
      resultStatus: "excellent",
      dayOffset: 11,
      outputSummary: "Sharp tradeoff analysis and tier names.",
      timeSpentMinutes: 40,
      estimatedTimeSavedMinutes: 120,
      estimatedCostUsd: 0.7,
      quotaFeeling: "fair",
      humanInterventionLevel: "light-review",
      qualityScore: 9,
      intentUnderstandingScore: 9,
      costValueScore: 8,
      tags: ["product", "pricing"],
    },
    {
      title: "Add Drizzle schema for DueKind invoices",
      project: "DueKind",
      tool: "Codex",
      model: "GPT-5.5",
      taskType: "database",
      workflowType: "agent-autonomous",
      resultStatus: "excellent",
      dayOffset: 12,
      timeSpentMinutes: 30,
      estimatedTimeSavedMinutes: 100,
      estimatedCostUsd: 0.8,
      quotaFeeling: "fair",
      humanInterventionLevel: "light-review",
      testsRun: true,
      testsPassed: true,
      qualityScore: 9,
      codeQualityScore: 9,
      reliabilityScore: 9,
      costValueScore: 8,
      tags: ["drizzle", "schema"],
    },
    {
      title: "Write unit tests for report engine",
      project: "MergeAttest",
      tool: "Claude Code",
      model: "Sonnet 4.6",
      taskType: "testing",
      workflowType: "agent-autonomous",
      resultStatus: "good",
      dayOffset: 13,
      outputSummary: "Good coverage; a few weak assertions.",
      timeSpentMinutes: 30,
      estimatedTimeSavedMinutes: 110,
      estimatedCostUsd: 0.5,
      quotaFeeling: "fair",
      humanInterventionLevel: "moderate-edits",
      testsRun: true,
      testsPassed: true,
      qualityScore: 7,
      codeQualityScore: 7,
      reliabilityScore: 7,
      costValueScore: 8,
      tags: ["tests"],
      failures: [
        {
          type: "weak-tests",
          severity: "low",
          description: "Some tests asserted truthiness only.",
          possibleFix: "Ask for explicit expected values.",
        },
      ],
    },
    {
      title: "Cursor: quick state refactor to Zustand",
      project: "SmartTrips",
      tool: "Cursor",
      model: "Sonnet 4.6",
      taskType: "frontend-state",
      workflowType: "pair-programming",
      resultStatus: "good",
      dayOffset: 14,
      timeSpentMinutes: 25,
      estimatedTimeSavedMinutes: 60,
      estimatedCostUsd: 0.3,
      quotaFeeling: "cheap",
      humanInterventionLevel: "light-review",
      qualityScore: 8,
      codeQualityScore: 8,
      speedScore: 8,
      costValueScore: 8,
      tags: ["state"],
    },
    {
      title: "Architecture review of MergeAttest queue",
      project: "MergeAttest",
      tool: "ChatGPT",
      model: "GPT-5.5",
      taskType: "architecture",
      workflowType: "iterative-chat",
      resultStatus: "excellent",
      dayOffset: 16,
      timeSpentMinutes: 45,
      estimatedTimeSavedMinutes: 150,
      estimatedCostUsd: 0.9,
      quotaFeeling: "fair",
      humanInterventionLevel: "light-review",
      qualityScore: 9,
      intentUnderstandingScore: 9,
      reliabilityScore: 8,
      costValueScore: 8,
      tags: ["architecture"],
    },
    {
      title: "Generate hero imagery for Eastbase",
      project: "Eastbase Studio",
      tool: "ChatGPT",
      model: "MiniMax M2",
      taskType: "image-generation",
      workflowType: "one-shot",
      resultStatus: "usable-with-edits",
      dayOffset: 17,
      outputSummary: "Nice vibe, hands were off in two shots.",
      timeSpentMinutes: 30,
      estimatedTimeSavedMinutes: 40,
      estimatedCostUsd: 0.6,
      quotaFeeling: "expensive",
      humanInterventionLevel: "moderate-edits",
      qualityScore: 6,
      uiTasteScore: 7,
      costValueScore: 5,
      tags: ["image"],
    },
    {
      title: "Debug N+1 in SmartTrips itinerary query",
      project: "SmartTrips",
      tool: "Claude Code",
      model: "GPT-5.5",
      taskType: "debugging",
      workflowType: "agent-autonomous",
      resultStatus: "excellent",
      dayOffset: 18,
      timeSpentMinutes: 20,
      estimatedTimeSavedMinutes: 90,
      estimatedCostUsd: 0.7,
      quotaFeeling: "fair",
      humanInterventionLevel: "none",
      testsRun: true,
      testsPassed: true,
      qualityScore: 9,
      speedScore: 9,
      reliabilityScore: 9,
      costValueScore: 8,
      tags: ["perf", "db"],
    },
    {
      title: "Cheap model: tweak marketing copy",
      project: "DueKind",
      tool: "ChatGPT",
      model: "5.4 mini",
      taskType: "marketing",
      workflowType: "one-shot",
      resultStatus: "good",
      dayOffset: 19,
      timeSpentMinutes: 12,
      estimatedTimeSavedMinutes: 30,
      estimatedCostUsd: 0.02,
      quotaFeeling: "cheap",
      humanInterventionLevel: "light-review",
      qualityScore: 7,
      speedScore: 9,
      costValueScore: 10,
      tags: ["copy"],
    },
    {
      title: "Auth flow with BetterAuth in DueKind",
      project: "DueKind",
      tool: "Codex",
      model: "Opus 4.8",
      taskType: "auth",
      workflowType: "agent-autonomous",
      resultStatus: "good",
      dayOffset: 21,
      timeSpentMinutes: 55,
      estimatedTimeSavedMinutes: 160,
      estimatedCostUsd: 1.8,
      quotaFeeling: "expensive",
      humanInterventionLevel: "moderate-edits",
      testsRun: true,
      testsPassed: true,
      requiredFollowupModel: true,
      followupModelId: null,
      qualityScore: 8,
      codeQualityScore: 8,
      reliabilityScore: 8,
      costValueScore: 6,
      tags: ["auth"],
    },
    {
      title: "Failed: agent rewrote unrelated files",
      project: "BurnCap",
      tool: "Codex",
      model: "Qwen3 Coder",
      taskType: "refactor",
      workflowType: "agent-autonomous",
      resultStatus: "failed",
      dayOffset: 22,
      outputSummary: "Went off-track and edited unrelated modules.",
      whatFailed: "Ignored scope, touched files it shouldn't.",
      doDifferently: "Constrain scope; smaller task; stronger model.",
      timeSpentMinutes: 45,
      estimatedTimeSavedMinutes: 0,
      estimatedCostUsd: 0.25,
      quotaFeeling: "cheap",
      humanInterventionLevel: "abandoned",
      testsRun: true,
      testsPassed: false,
      causedRegression: true,
      qualityScore: 2,
      reliabilityScore: 2,
      costValueScore: 2,
      tags: ["refactor", "fail"],
      failures: [
        {
          type: "ignored-instructions",
          severity: "high",
          description: "Edited modules outside the requested scope.",
          possibleFix: "Tighter scoping + read-only guardrails.",
        },
        {
          type: "broke-existing-code",
          severity: "high",
          description: "Introduced a regression in the tracker.",
        },
      ],
    },
    {
      title: "Gemini huge-context audit of monorepo",
      project: "MergeAttest",
      tool: "ChatGPT",
      model: "Gemini 3",
      taskType: "architecture",
      workflowType: "research-assistant",
      resultStatus: "good",
      dayOffset: 24,
      timeSpentMinutes: 40,
      estimatedTimeSavedMinutes: 140,
      estimatedCostUsd: 0.9,
      quotaFeeling: "fair",
      humanInterventionLevel: "light-review",
      qualityScore: 8,
      intentUnderstandingScore: 8,
      costValueScore: 8,
      tags: ["audit", "context"],
    },
    {
      title: "Over-engineered settings module",
      project: "SmartTrips",
      tool: "Claude Code",
      model: "GPT-5.5",
      taskType: "backend-api",
      workflowType: "agent-autonomous",
      resultStatus: "usable-with-edits",
      dayOffset: 26,
      outputSummary: "Worked but added needless abstraction layers.",
      whatFailed: "Three layers where one would do.",
      timeSpentMinutes: 40,
      estimatedTimeSavedMinutes: 50,
      estimatedCostUsd: 1.1,
      quotaFeeling: "fair",
      humanInterventionLevel: "heavy-rewrite",
      qualityScore: 6,
      codeQualityScore: 6,
      costValueScore: 5,
      tags: ["backend"],
      failures: [
        {
          type: "over-engineered",
          severity: "medium",
          description: "Unneeded abstraction layers.",
          possibleFix: "Ask for the simplest version first.",
        },
      ],
    },
    {
      title: "Write API docs for DueKind",
      project: "DueKind",
      tool: "ChatGPT",
      model: "Sonnet 4.6",
      taskType: "writing",
      workflowType: "writing-assistant",
      resultStatus: "excellent",
      dayOffset: 28,
      timeSpentMinutes: 30,
      estimatedTimeSavedMinutes: 110,
      estimatedCostUsd: 0.35,
      quotaFeeling: "cheap",
      humanInterventionLevel: "light-review",
      qualityScore: 9,
      intentUnderstandingScore: 9,
      costValueScore: 9,
      tags: ["docs"],
    },
    {
      title: "DeepSeek: trace memory leak",
      project: "SmartTrips",
      tool: "Cursor",
      model: "DeepSeek V3.2",
      taskType: "debugging",
      workflowType: "pair-programming",
      resultStatus: "good",
      dayOffset: 30,
      timeSpentMinutes: 35,
      estimatedTimeSavedMinutes: 80,
      estimatedCostUsd: 0.06,
      quotaFeeling: "cheap",
      humanInterventionLevel: "light-review",
      qualityScore: 8,
      reliabilityScore: 7,
      costValueScore: 10,
      tags: ["perf", "bug"],
    },
    {
      title: "Marketing landing rewrite",
      project: "Eastbase Studio",
      tool: "ChatGPT",
      model: "GPT-5.5",
      taskType: "marketing",
      workflowType: "iterative-chat",
      resultStatus: "good",
      dayOffset: 32,
      timeSpentMinutes: 30,
      estimatedTimeSavedMinutes: 70,
      estimatedCostUsd: 0.3,
      quotaFeeling: "cheap",
      humanInterventionLevel: "moderate-edits",
      qualityScore: 7,
      costValueScore: 8,
      tags: ["marketing"],
    },
    {
      title: "Opus UI polish pass on BurnCap",
      project: "BurnCap",
      tool: "Claude Code",
      model: "Opus 4.8",
      taskType: "frontend-ui",
      workflowType: "pair-programming",
      resultStatus: "excellent",
      dayOffset: 34,
      outputSummary: "Tasteful spacing, motion and empty states.",
      whatWorked: "Best UI taste of any model by far.",
      timeSpentMinutes: 30,
      estimatedTimeSavedMinutes: 120,
      estimatedCostUsd: 1.2,
      quotaFeeling: "expensive",
      humanInterventionLevel: "light-review",
      qualityScore: 10,
      uiTasteScore: 10,
      codeQualityScore: 9,
      costValueScore: 7,
      tags: ["ui", "polish"],
    },
    {
      title: "Qwen: scaffold CRUD endpoints",
      project: "DueKind",
      tool: "Cursor",
      model: "Qwen3 Coder",
      taskType: "backend-api",
      workflowType: "agent-autonomous",
      resultStatus: "good",
      dayOffset: 36,
      timeSpentMinutes: 25,
      estimatedTimeSavedMinutes: 90,
      estimatedCostUsd: 0.12,
      quotaFeeling: "cheap",
      humanInterventionLevel: "light-review",
      testsRun: true,
      testsPassed: true,
      qualityScore: 8,
      codeQualityScore: 7,
      costValueScore: 10,
      tags: ["crud", "value"],
    },
    {
      title: "Too verbose: explain webhook flow",
      project: "MergeAttest",
      tool: "ChatGPT",
      model: "5.4 mini",
      taskType: "research",
      workflowType: "research-assistant",
      resultStatus: "usable-with-edits",
      dayOffset: 38,
      whatFailed: "Buried the answer under walls of text.",
      timeSpentMinutes: 20,
      estimatedTimeSavedMinutes: 25,
      estimatedCostUsd: 0.03,
      quotaFeeling: "cheap",
      humanInterventionLevel: "moderate-edits",
      qualityScore: 5,
      speedScore: 7,
      costValueScore: 6,
      tags: ["research"],
      failures: [
        {
          type: "too-verbose",
          severity: "low",
          description: "Excessively long answer.",
          possibleFix: "Ask for a 5-line summary first.",
        },
      ],
    },
    {
      title: "Gemini: video storyboard for Eastbase",
      project: "Eastbase Studio",
      tool: "ChatGPT",
      model: "Gemini 3",
      taskType: "video-generation",
      workflowType: "one-shot",
      resultStatus: "usable-with-edits",
      dayOffset: 40,
      timeSpentMinutes: 35,
      estimatedTimeSavedMinutes: 60,
      estimatedCostUsd: 0.8,
      quotaFeeling: "expensive",
      humanInterventionLevel: "moderate-edits",
      qualityScore: 6,
      uiTasteScore: 6,
      costValueScore: 5,
      tags: ["video"],
    },
    {
      title: "Opus architecture for SmartTrips realtime",
      project: "SmartTrips",
      tool: "ChatGPT",
      model: "Opus 4.8",
      taskType: "architecture",
      workflowType: "iterative-chat",
      resultStatus: "excellent",
      dayOffset: 44,
      timeSpentMinutes: 50,
      estimatedTimeSavedMinutes: 200,
      estimatedCostUsd: 1.5,
      quotaFeeling: "expensive",
      humanInterventionLevel: "light-review",
      qualityScore: 9,
      intentUnderstandingScore: 9,
      reliabilityScore: 9,
      costValueScore: 7,
      tags: ["architecture", "realtime"],
    },
    {
      title: "Mini model: rename + cleanup pass",
      project: "BurnCap",
      tool: "Cursor",
      model: "5.4 mini",
      taskType: "refactor",
      workflowType: "pair-programming",
      resultStatus: "good",
      dayOffset: 47,
      timeSpentMinutes: 18,
      estimatedTimeSavedMinutes: 40,
      estimatedCostUsd: 0.03,
      quotaFeeling: "cheap",
      humanInterventionLevel: "light-review",
      qualityScore: 7,
      codeQualityScore: 7,
      costValueScore: 10,
      tags: ["cleanup"],
    },
  ];

  console.log(`Seeding ${scenarios.length} sessions…`);
  for (const sc of scenarios) {
    const { project, tool, model, failures, dayOffset, ...rest } = sc;
    const [row] = await db
      .insert(sessions)
      .values({
        ...rest,
        date: daysAgo(dayOffset),
        projectId: P[project] ?? null,
        toolId: T[tool] ?? null,
        modelId: M[model] ?? null,
      })
      .returning({ id: sessions.id });

    if (failures?.length) {
      await db.insert(failurePatterns).values(
        failures.map((f) => ({
          sessionId: row.id,
          type: f.type,
          severity: f.severity,
          description: f.description ?? null,
          possibleFix: f.possibleFix ?? null,
        })),
      );
    }
  }

  console.log("Seeding insights…");
  await db.insert(insights).values([
    {
      title: "Claude Code is best for large UI refactors",
      description:
        "Opus 4.8 via Claude Code handles 20+ file refactors without breaking tests, and its UI taste is well ahead of the pack.",
      relatedModelId: M["Opus 4.8"],
      relatedToolId: T["Claude Code"],
      confidence: "high",
      status: "confirmed",
    },
    {
      title: "Cheaper models break on cross-module refactors",
      description:
        "Qwen3 Coder and 5.4 mini lose the import graph on multi-module refactors. Reach for a flagship when scope spans modules.",
      relatedModelId: M["Qwen3 Coder"],
      confidence: "high",
      status: "confirmed",
    },
    {
      title: "DeepSeek is unbeatable value for debugging",
      description:
        "DeepSeek V3.2 finds bugs fast at near-zero cost. Best cost-value for focused debugging sessions.",
      relatedModelId: M["DeepSeek V3.2"],
      relatedToolId: T["Cursor"],
      confidence: "high",
      status: "active",
    },
    {
      title: "Codex is better when image context matters",
      description:
        "For tasks that mix screenshots/diagrams with code, Codex keeps the visual context better than Claude Code.",
      relatedToolId: T["Codex"],
      confidence: "medium",
      status: "active",
    },
    {
      title: "Use mini models for copy and renames",
      description:
        "5.4 mini is plenty for marketing copy and mechanical renames — flagship spend here is wasted.",
      relatedModelId: M["5.4 mini"],
      confidence: "high",
      status: "active",
    },
    {
      title: "Gemini shines on huge-context audits",
      description:
        "Gemini 3's 2M context makes whole-monorepo audits practical in one pass.",
      relatedModelId: M["Gemini 3"],
      relatedProjectId: P["MergeAttest"],
      confidence: "medium",
      status: "active",
    },
  ]);

  // Stamp ownership on everything just inserted (rows went in with null owner,
  // and resetFor cleared any prior null-owner rows).
  console.log("Assigning ownership to the demo account…");
  await db.update(projects).set({ ownerId }).where(isNull(projects.ownerId));
  await db.update(aiTools).set({ ownerId }).where(isNull(aiTools.ownerId));
  await db.update(models).set({ ownerId }).where(isNull(models.ownerId));
  await db.update(sessions).set({ ownerId }).where(isNull(sessions.ownerId));
  await db.update(insights).set({ ownerId }).where(isNull(insights.ownerId));

  // Give the demo a monthly budget so the budget alert & Cost tab have data.
  await db
    .update(user)
    .set({ monthlyBudgetUsd: 60 })
    .where(eq(user.id, ownerId));

  console.log("Seed complete ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
