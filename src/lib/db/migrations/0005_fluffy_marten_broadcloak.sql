CREATE TYPE "public"."file_type" AS ENUM('file', 'directory');--> statement-breakpoint
CREATE TYPE "public"."symbol_type" AS ENUM('function', 'class', 'interface', 'type', 'const');--> statement-breakpoint
CREATE TABLE "code_symbols" (
	"id" text PRIMARY KEY NOT NULL,
	"repo" text NOT NULL,
	"organ" text NOT NULL,
	"path" text NOT NULL,
	"symbol_type" "symbol_type" NOT NULL,
	"name" text NOT NULL,
	"signature" text,
	"line_start" integer,
	"line_end" integer,
	"doc_comment" text,
	"parent_symbol" text,
	"visibility" text,
	"embedding" vector(384),
	"commit_sha" text,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_file_trees" (
	"id" text PRIMARY KEY NOT NULL,
	"repo" text NOT NULL,
	"organ" text NOT NULL,
	"path" text NOT NULL,
	"file_type" "file_type" NOT NULL,
	"extension" text,
	"size_bytes" bigint,
	"last_modified" timestamp with time zone,
	"commit_sha" text,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "symbol_repo_idx" ON "code_symbols" USING btree ("repo");--> statement-breakpoint
CREATE INDEX "symbol_name_idx" ON "code_symbols" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "symbol_type_idx" ON "code_symbols" USING btree ("symbol_type");--> statement-breakpoint
CREATE INDEX "symbol_embedding_idx" ON "code_symbols" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "file_tree_repo_idx" ON "repo_file_trees" USING btree ("repo");--> statement-breakpoint
CREATE INDEX "file_tree_ext_idx" ON "repo_file_trees" USING btree ("extension");--> statement-breakpoint
CREATE INDEX "file_tree_path_idx" ON "repo_file_trees" USING gin ("path" gin_trgm_ops);