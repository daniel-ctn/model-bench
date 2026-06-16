import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  Enum value tuples — single source of truth, reused by validations & UI    */
/* -------------------------------------------------------------------------- */

export const PROJECT_TYPES = [
  "personal",
  "commercial",
  "client",
  "experiment",
  "learning",
] as const;

export const PROJECT_STATUSES = ["active", "paused", "archived"] as const;

export const TOOL_CATEGORIES = [
  "coding-agent",
  "chat-assistant",
  "IDE",
  "research",
  "image",
  "video",
  "other",
] as const;

export const MODEL_PROVIDERS = [
  "OpenAI",
  "Anthropic",
  "Google",
  "xAI",
  "Alibaba",
  "DeepSeek",
  "Moonshot",
  "MiniMax",
  "other",
] as const;

export const MODEL_STRENGTHS = [
  "small",
  "medium",
  "flagship",
  "reasoning",
  "coding-specialized",
  "unknown",
] as const;

export const TASK_TYPES = [
  "frontend-ui",
  "frontend-state",
  "backend-api",
  "database",
  "auth",
  "refactor",
  "debugging",
  "testing",
  "architecture",
  "product-thinking",
  "writing",
  "research",
  "marketing",
  "image-generation",
  "video-generation",
  "other",
] as const;

export const WORKFLOW_TYPES = [
  "one-shot",
  "iterative-chat",
  "agent-autonomous",
  "pair-programming",
  "code-review",
  "research-assistant",
  "writing-assistant",
  "other",
] as const;

export const RESULT_STATUSES = [
  "excellent",
  "good",
  "usable-with-edits",
  "poor",
  "failed",
] as const;

export const QUOTA_FEELINGS = [
  "cheap",
  "fair",
  "expensive",
  "quota-heavy",
  "unknown",
] as const;

export const INTERVENTION_LEVELS = [
  "none",
  "light-review",
  "moderate-edits",
  "heavy-rewrite",
  "abandoned",
] as const;

export const FAILURE_TYPES = [
  "misunderstood-intent",
  "hallucinated-api",
  "bad-ui-taste",
  "broke-existing-code",
  "over-engineered",
  "under-engineered",
  "ignored-instructions",
  "too-verbose",
  "poor-debugging",
  "weak-tests",
  "bad-refactor",
  "other",
] as const;

export const SEVERITIES = ["low", "medium", "high"] as const;

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;

export const INSIGHT_STATUSES = ["active", "outdated", "confirmed"] as const;

/* -------------------------------------------------------------------------- */
/*  Postgres enum types                                                        */
/* -------------------------------------------------------------------------- */

export const projectTypeEnum = pgEnum("project_type", PROJECT_TYPES);
export const projectStatusEnum = pgEnum("project_status", PROJECT_STATUSES);
export const toolCategoryEnum = pgEnum("tool_category", TOOL_CATEGORIES);
export const modelProviderEnum = pgEnum("model_provider", MODEL_PROVIDERS);
export const modelStrengthEnum = pgEnum("model_strength", MODEL_STRENGTHS);
export const taskTypeEnum = pgEnum("task_type", TASK_TYPES);
export const workflowTypeEnum = pgEnum("workflow_type", WORKFLOW_TYPES);
export const resultStatusEnum = pgEnum("result_status", RESULT_STATUSES);
export const quotaFeelingEnum = pgEnum("quota_feeling", QUOTA_FEELINGS);
export const interventionEnum = pgEnum("intervention_level", INTERVENTION_LEVELS);
export const failureTypeEnum = pgEnum("failure_type", FAILURE_TYPES);
export const severityEnum = pgEnum("severity", SEVERITIES);
export const confidenceEnum = pgEnum("confidence", CONFIDENCE_LEVELS);
export const insightStatusEnum = pgEnum("insight_status", INSIGHT_STATUSES);

/* -------------------------------------------------------------------------- */
/*  Shared timestamp helpers                                                   */
/* -------------------------------------------------------------------------- */

const createdAt = timestamp("created_at", { mode: "date" })
  .notNull()
  .defaultNow();

const updatedAt = timestamp("updated_at", { mode: "date" })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

/* -------------------------------------------------------------------------- */
/*  Auth tables (better-auth)                                                   */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "date" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Tables                                                                     */
/* -------------------------------------------------------------------------- */

const ownerId = text("owner_id").references(() => user.id, {
  onDelete: "cascade",
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId,
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    type: projectTypeEnum("type").notNull().default("personal"),
    status: projectStatusEnum("status").notNull().default("active"),
    color: text("color").notNull().default("#7c5cff"),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("projects_owner_slug_unique").on(t.ownerId, t.slug)],
);

export const aiTools = pgTable("ai_tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId,
  name: text("name").notNull(),
  category: toolCategoryEnum("category").notNull().default("other"),
  website: text("website"),
  notes: text("notes"),
  createdAt,
  updatedAt,
});

export const models = pgTable("models", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId,
  provider: modelProviderEnum("provider").notNull().default("other"),
  name: text("name").notNull(),
  shortName: text("short_name"),
  modelFamily: text("model_family"),
  strengthLevel: modelStrengthEnum("strength_level").notNull().default("unknown"),
  pricingInputPerMTok: doublePrecision("pricing_input_per_mtok"),
  pricingOutputPerMTok: doublePrecision("pricing_output_per_mtok"),
  contextWindow: integer("context_window"),
  knowledgeCutoff: text("knowledge_cutoff"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt,
  updatedAt,
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId,
  title: text("title").notNull(),
  date: timestamp("session_date", { mode: "date" }).notNull().defaultNow(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  toolId: uuid("tool_id").references(() => aiTools.id, {
    onDelete: "set null",
  }),
  modelId: uuid("model_id").references(() => models.id, {
    onDelete: "set null",
  }),
  taskType: taskTypeEnum("task_type").notNull(),
  workflowType: workflowTypeEnum("workflow_type").notNull(),
  promptSummary: text("prompt_summary"),
  taskDescription: text("task_description"),
  outputSummary: text("output_summary"),
  resultStatus: resultStatusEnum("result_status").notNull(),
  timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),
  estimatedTimeSavedMinutes: integer("estimated_time_saved_minutes")
    .notNull()
    .default(0),
  estimatedCostUsd: doublePrecision("estimated_cost_usd"),
  quotaFeeling: quotaFeelingEnum("quota_feeling").notNull().default("unknown"),
  humanInterventionLevel: interventionEnum("human_intervention_level")
    .notNull()
    .default("none"),
  testsRun: boolean("tests_run").notNull().default(false),
  testsPassed: boolean("tests_passed"),
  causedRegression: boolean("caused_regression").notNull().default(false),
  requiredFollowupModel: boolean("required_followup_model")
    .notNull()
    .default(false),
  followupModelId: uuid("followup_model_id").references(() => models.id, {
    onDelete: "set null",
  }),
  // Primary quality metric — always captured. Secondary scores are optional.
  qualityScore: integer("quality_score").notNull().default(5),
  speedScore: integer("speed_score"),
  intentUnderstandingScore: integer("intent_understanding_score"),
  codeQualityScore: integer("code_quality_score"),
  uiTasteScore: integer("ui_taste_score"),
  reliabilityScore: integer("reliability_score"),
  costValueScore: integer("cost_value_score"),
  // Free-form reflection used in the session detail view.
  whatWorked: text("what_worked"),
  whatFailed: text("what_failed"),
  doDifferently: text("do_differently"),
  notes: text("notes"),
  tags: text("tags").array().notNull().default([]),
  createdAt,
  updatedAt,
});

export const failurePatterns = pgTable("failure_patterns", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  type: failureTypeEnum("type").notNull(),
  severity: severityEnum("severity").notNull().default("medium"),
  description: text("description"),
  possibleFix: text("possible_fix"),
  createdAt,
});

export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId,
  title: text("title").notNull(),
  description: text("description"),
  relatedToolId: uuid("related_tool_id").references(() => aiTools.id, {
    onDelete: "set null",
  }),
  relatedModelId: uuid("related_model_id").references(() => models.id, {
    onDelete: "set null",
  }),
  relatedProjectId: uuid("related_project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  confidence: confidenceEnum("confidence").notNull().default("medium"),
  status: insightStatusEnum("status").notNull().default("active"),
  createdAt,
  updatedAt,
});

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const projectsRelations = relations(projects, ({ many }) => ({
  sessions: many(sessions),
  insights: many(insights),
}));

export const aiToolsRelations = relations(aiTools, ({ many }) => ({
  sessions: many(sessions),
  insights: many(insights),
}));

export const modelsRelations = relations(models, ({ many }) => ({
  sessions: many(sessions, { relationName: "session_model" }),
  followupSessions: many(sessions, { relationName: "session_followup_model" }),
  insights: many(insights),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [sessions.projectId],
    references: [projects.id],
  }),
  tool: one(aiTools, {
    fields: [sessions.toolId],
    references: [aiTools.id],
  }),
  model: one(models, {
    fields: [sessions.modelId],
    references: [models.id],
    relationName: "session_model",
  }),
  followupModel: one(models, {
    fields: [sessions.followupModelId],
    references: [models.id],
    relationName: "session_followup_model",
  }),
  failurePatterns: many(failurePatterns),
}));

export const failurePatternsRelations = relations(
  failurePatterns,
  ({ one }) => ({
    session: one(sessions, {
      fields: [failurePatterns.sessionId],
      references: [sessions.id],
    }),
  }),
);

export const insightsRelations = relations(insights, ({ one }) => ({
  tool: one(aiTools, {
    fields: [insights.relatedToolId],
    references: [aiTools.id],
  }),
  model: one(models, {
    fields: [insights.relatedModelId],
    references: [models.id],
  }),
  project: one(projects, {
    fields: [insights.relatedProjectId],
    references: [projects.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type AiTool = typeof aiTools.$inferSelect;
export type NewAiTool = typeof aiTools.$inferInsert;
export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type FailurePattern = typeof failurePatterns.$inferSelect;
export type NewFailurePattern = typeof failurePatterns.$inferInsert;
export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;
