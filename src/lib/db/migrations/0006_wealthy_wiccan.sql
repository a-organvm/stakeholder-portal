CREATE TYPE "public"."planning_status" AS ENUM('not_started', 'in_progress', 'blocked', 'done');--> statement-breakpoint
CREATE TABLE "planning_items" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"dept" text NOT NULL,
	"owner" text NOT NULL,
	"month" text NOT NULL,
	"phase" text NOT NULL,
	"status" "planning_status" DEFAULT 'not_started' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"issue_url" text,
	"blocked_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
