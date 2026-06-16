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
  ConfidenceLevel,
  FailureType,
  InsightStatus,
  InterventionLevel,
  ModelProvider,
  ModelStrength,
  ProjectStatus,
  ProjectType,
  QuotaFeeling,
  ResultStatus,
  Severity,
  TaskType,
  Tone,
  ToolCategory,
  WorkflowType,
} from "@/types";

export type Option<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

function toOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): Option<T>[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

/** Generic label lookup with a humanised fallback. */
export function labelFor<T extends string>(
  labels: Record<T, string>,
  value: T | null | undefined,
): string {
  if (!value) return "—";
  return labels[value] ?? value;
}

/* -------------------------------- Projects -------------------------------- */

export const projectTypeLabels: Record<ProjectType, string> = {
  personal: "Personal",
  commercial: "Commercial",
  client: "Client",
  experiment: "Experiment",
  learning: "Learning",
};
export const projectTypeOptions = toOptions(PROJECT_TYPES, projectTypeLabels);

export const projectStatusLabels: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};
export const projectStatusOptions = toOptions(
  PROJECT_STATUSES,
  projectStatusLabels,
);
export const projectStatusTone: Record<ProjectStatus, Tone> = {
  active: "success",
  paused: "warning",
  archived: "neutral",
};

/** Curated palette for project accent colours. */
export const PROJECT_COLORS = [
  "#7c5cff",
  "#22d3ee",
  "#34d399",
  "#f59e0b",
  "#f472b6",
  "#60a5fa",
  "#a78bfa",
  "#fb7185",
] as const;

/* --------------------------------- Tools ---------------------------------- */

export const toolCategoryLabels: Record<ToolCategory, string> = {
  "coding-agent": "Coding agent",
  "chat-assistant": "Chat assistant",
  IDE: "IDE",
  research: "Research",
  image: "Image",
  video: "Video",
  other: "Other",
};
export const toolCategoryOptions = toOptions(
  TOOL_CATEGORIES,
  toolCategoryLabels,
);

/* --------------------------------- Models --------------------------------- */

export const modelProviderLabels: Record<ModelProvider, string> = {
  OpenAI: "OpenAI",
  Anthropic: "Anthropic",
  Google: "Google",
  xAI: "xAI",
  Alibaba: "Alibaba",
  DeepSeek: "DeepSeek",
  Moonshot: "Moonshot",
  MiniMax: "MiniMax",
  other: "Other",
};
export const modelProviderOptions = toOptions(
  MODEL_PROVIDERS,
  modelProviderLabels,
);

export const modelStrengthLabels: Record<ModelStrength, string> = {
  small: "Small",
  medium: "Medium",
  flagship: "Flagship",
  reasoning: "Reasoning",
  "coding-specialized": "Coding-specialized",
  unknown: "Unknown",
};
export const modelStrengthOptions = toOptions(
  MODEL_STRENGTHS,
  modelStrengthLabels,
);
export const modelStrengthTone: Record<ModelStrength, Tone> = {
  small: "neutral",
  medium: "info",
  flagship: "primary",
  reasoning: "primary",
  "coding-specialized": "success",
  unknown: "neutral",
};

/* -------------------------------- Sessions -------------------------------- */

export const taskTypeLabels: Record<TaskType, string> = {
  "frontend-ui": "Frontend · UI",
  "frontend-state": "Frontend · State",
  "backend-api": "Backend · API",
  database: "Database",
  auth: "Auth",
  refactor: "Refactor",
  debugging: "Debugging",
  testing: "Testing",
  architecture: "Architecture",
  "product-thinking": "Product thinking",
  writing: "Writing",
  research: "Research",
  marketing: "Marketing",
  "image-generation": "Image generation",
  "video-generation": "Video generation",
  other: "Other",
};
export const taskTypeOptions = toOptions(TASK_TYPES, taskTypeLabels);

export const workflowTypeLabels: Record<WorkflowType, string> = {
  "one-shot": "One-shot",
  "iterative-chat": "Iterative chat",
  "agent-autonomous": "Agent (autonomous)",
  "pair-programming": "Pair programming",
  "code-review": "Code review",
  "research-assistant": "Research assistant",
  "writing-assistant": "Writing assistant",
  other: "Other",
};
export const workflowTypeOptions = toOptions(
  WORKFLOW_TYPES,
  workflowTypeLabels,
);

export const resultStatusLabels: Record<ResultStatus, string> = {
  excellent: "Excellent",
  good: "Good",
  "usable-with-edits": "Usable w/ edits",
  poor: "Poor",
  failed: "Failed",
};
export const resultStatusOptions = toOptions(
  RESULT_STATUSES,
  resultStatusLabels,
);
export const resultStatusTone: Record<ResultStatus, Tone> = {
  excellent: "success",
  good: "info",
  "usable-with-edits": "warning",
  poor: "danger",
  failed: "danger",
};

export const quotaFeelingLabels: Record<QuotaFeeling, string> = {
  cheap: "Cheap",
  fair: "Fair",
  expensive: "Expensive",
  "quota-heavy": "Quota-heavy",
  unknown: "Unknown",
};
export const quotaFeelingOptions = toOptions(
  QUOTA_FEELINGS,
  quotaFeelingLabels,
);
export const quotaFeelingTone: Record<QuotaFeeling, Tone> = {
  cheap: "success",
  fair: "info",
  expensive: "warning",
  "quota-heavy": "danger",
  unknown: "neutral",
};

export const interventionLabels: Record<InterventionLevel, string> = {
  none: "None",
  "light-review": "Light review",
  "moderate-edits": "Moderate edits",
  "heavy-rewrite": "Heavy rewrite",
  abandoned: "Abandoned",
};
export const interventionOptions = toOptions(
  INTERVENTION_LEVELS,
  interventionLabels,
);
export const interventionTone: Record<InterventionLevel, Tone> = {
  none: "success",
  "light-review": "info",
  "moderate-edits": "warning",
  "heavy-rewrite": "danger",
  abandoned: "danger",
};

/* ---------------------------- Failure patterns ---------------------------- */

export const failureTypeLabels: Record<FailureType, string> = {
  "misunderstood-intent": "Misunderstood intent",
  "hallucinated-api": "Hallucinated API",
  "bad-ui-taste": "Bad UI taste",
  "broke-existing-code": "Broke existing code",
  "over-engineered": "Over-engineered",
  "under-engineered": "Under-engineered",
  "ignored-instructions": "Ignored instructions",
  "too-verbose": "Too verbose",
  "poor-debugging": "Poor debugging",
  "weak-tests": "Weak tests",
  "bad-refactor": "Bad refactor",
  other: "Other",
};
export const failureTypeOptions = toOptions(FAILURE_TYPES, failureTypeLabels);

export const severityLabels: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
export const severityOptions = toOptions(SEVERITIES, severityLabels);
export const severityTone: Record<Severity, Tone> = {
  low: "info",
  medium: "warning",
  high: "danger",
};

/* -------------------------------- Insights -------------------------------- */

export const confidenceLabels: Record<ConfidenceLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
export const confidenceOptions = toOptions(CONFIDENCE_LEVELS, confidenceLabels);
export const confidenceTone: Record<ConfidenceLevel, Tone> = {
  low: "neutral",
  medium: "info",
  high: "success",
};

export const insightStatusLabels: Record<InsightStatus, string> = {
  active: "Active",
  outdated: "Outdated",
  confirmed: "Confirmed",
};
export const insightStatusOptions = toOptions(
  INSIGHT_STATUSES,
  insightStatusLabels,
);
export const insightStatusTone: Record<InsightStatus, Tone> = {
  active: "info",
  outdated: "neutral",
  confirmed: "success",
};

/* ------------------------------- Score fields ----------------------------- */

/** The six optional secondary scores shown in the session form & detail. */
export const SECONDARY_SCORE_FIELDS = [
  { key: "speedScore", label: "Speed" },
  { key: "intentUnderstandingScore", label: "Intent understanding" },
  { key: "codeQualityScore", label: "Code quality" },
  { key: "uiTasteScore", label: "UI taste" },
  { key: "reliabilityScore", label: "Reliability" },
  { key: "costValueScore", label: "Cost value" },
] as const;

export type SecondaryScoreKey = (typeof SECONDARY_SCORE_FIELDS)[number]["key"];
