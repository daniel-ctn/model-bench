import {
  CONFIDENCE_LEVELS,
  FAILURE_TYPES,
  INSIGHT_STATUSES,
  INTERVENTION_LEVELS,
  MODEL_PROVIDERS,
  MODEL_STRENGTHS,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  QUOTA_FEELINGS,
  RESULT_STATUSES,
  SEVERITIES,
  TASK_TYPES,
  TOOL_CATEGORIES,
  WORKFLOW_TYPES,
} from "@/db/schema";
import type {
  AiTool,
  FailurePattern,
  Insight,
  Model,
  Project,
  Session,
} from "@/db/schema";

/* Enum unions derived from the schema's value tuples */
export type ProjectType = (typeof PROJECT_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ToolCategory = (typeof TOOL_CATEGORIES)[number];
export type ModelProvider = (typeof MODEL_PROVIDERS)[number];
export type ModelStrength = (typeof MODEL_STRENGTHS)[number];
export type TaskType = (typeof TASK_TYPES)[number];
export type WorkflowType = (typeof WORKFLOW_TYPES)[number];
export type ResultStatus = (typeof RESULT_STATUSES)[number];
export type QuotaFeeling = (typeof QUOTA_FEELINGS)[number];
export type InterventionLevel = (typeof INTERVENTION_LEVELS)[number];
export type FailureType = (typeof FAILURE_TYPES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type InsightStatus = (typeof INSIGHT_STATUSES)[number];

/* Composite read models used across the app */
export type SessionWithRelations = Session & {
  project: Project | null;
  tool: AiTool | null;
  model: Model | null;
  followupModel: Model | null;
  failurePatterns: FailurePattern[];
};

export type InsightWithRelations = Insight & {
  tool: AiTool | null;
  model: Model | null;
  project: Project | null;
};

/** Visual tone used by badges, indicators and the worth-it label. */
export type Tone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";
