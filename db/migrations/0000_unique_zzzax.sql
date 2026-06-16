CREATE TYPE "public"."confidence" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."failure_type" AS ENUM('misunderstood-intent', 'hallucinated-api', 'bad-ui-taste', 'broke-existing-code', 'over-engineered', 'under-engineered', 'ignored-instructions', 'too-verbose', 'poor-debugging', 'weak-tests', 'bad-refactor', 'other');--> statement-breakpoint
CREATE TYPE "public"."insight_status" AS ENUM('active', 'outdated', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."intervention_level" AS ENUM('none', 'light-review', 'moderate-edits', 'heavy-rewrite', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."model_provider" AS ENUM('OpenAI', 'Anthropic', 'Google', 'xAI', 'Alibaba', 'DeepSeek', 'Moonshot', 'MiniMax', 'other');--> statement-breakpoint
CREATE TYPE "public"."model_strength" AS ENUM('small', 'medium', 'flagship', 'reasoning', 'coding-specialized', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('personal', 'commercial', 'client', 'experiment', 'learning');--> statement-breakpoint
CREATE TYPE "public"."quota_feeling" AS ENUM('cheap', 'fair', 'expensive', 'quota-heavy', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."result_status" AS ENUM('excellent', 'good', 'usable-with-edits', 'poor', 'failed');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('frontend-ui', 'frontend-state', 'backend-api', 'database', 'auth', 'refactor', 'debugging', 'testing', 'architecture', 'product-thinking', 'writing', 'research', 'marketing', 'image-generation', 'video-generation', 'other');--> statement-breakpoint
CREATE TYPE "public"."tool_category" AS ENUM('coding-agent', 'chat-assistant', 'IDE', 'research', 'image', 'video', 'other');--> statement-breakpoint
CREATE TYPE "public"."workflow_type" AS ENUM('one-shot', 'iterative-chat', 'agent-autonomous', 'pair-programming', 'code-review', 'research-assistant', 'writing-assistant', 'other');--> statement-breakpoint
CREATE TABLE "ai_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "tool_category" DEFAULT 'other' NOT NULL,
	"website" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failure_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "failure_type" NOT NULL,
	"severity" "severity" DEFAULT 'medium' NOT NULL,
	"description" text,
	"possible_fix" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"related_tool_id" uuid,
	"related_model_id" uuid,
	"related_project_id" uuid,
	"confidence" "confidence" DEFAULT 'medium' NOT NULL,
	"status" "insight_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "model_provider" DEFAULT 'other' NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"model_family" text,
	"strength_level" "model_strength" DEFAULT 'unknown' NOT NULL,
	"pricing_input_per_mtok" double precision,
	"pricing_output_per_mtok" double precision,
	"context_window" integer,
	"knowledge_cutoff" text,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"type" "project_type" DEFAULT 'personal' NOT NULL,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"color" text DEFAULT '#7c5cff' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"session_date" timestamp DEFAULT now() NOT NULL,
	"project_id" uuid,
	"tool_id" uuid,
	"model_id" uuid,
	"task_type" "task_type" NOT NULL,
	"workflow_type" "workflow_type" NOT NULL,
	"prompt_summary" text,
	"task_description" text,
	"output_summary" text,
	"result_status" "result_status" NOT NULL,
	"time_spent_minutes" integer DEFAULT 0 NOT NULL,
	"estimated_time_saved_minutes" integer DEFAULT 0 NOT NULL,
	"estimated_cost_usd" double precision,
	"quota_feeling" "quota_feeling" DEFAULT 'unknown' NOT NULL,
	"human_intervention_level" "intervention_level" DEFAULT 'none' NOT NULL,
	"tests_run" boolean DEFAULT false NOT NULL,
	"tests_passed" boolean,
	"caused_regression" boolean DEFAULT false NOT NULL,
	"required_followup_model" boolean DEFAULT false NOT NULL,
	"followup_model_id" uuid,
	"quality_score" integer DEFAULT 5 NOT NULL,
	"speed_score" integer,
	"intent_understanding_score" integer,
	"code_quality_score" integer,
	"ui_taste_score" integer,
	"reliability_score" integer,
	"cost_value_score" integer,
	"what_worked" text,
	"what_failed" text,
	"do_differently" text,
	"notes" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "failure_patterns" ADD CONSTRAINT "failure_patterns_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_related_tool_id_ai_tools_id_fk" FOREIGN KEY ("related_tool_id") REFERENCES "public"."ai_tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_related_model_id_models_id_fk" FOREIGN KEY ("related_model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_related_project_id_projects_id_fk" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tool_id_ai_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."ai_tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_followup_model_id_models_id_fk" FOREIGN KEY ("followup_model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;