ALTER TABLE "sessions" ADD COLUMN "draft" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ingest_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_ingest_token_unique" UNIQUE("ingest_token");