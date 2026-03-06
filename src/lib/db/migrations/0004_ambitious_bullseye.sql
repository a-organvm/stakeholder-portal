ALTER TABLE "document_chunks" ADD COLUMN "file_mtime" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "commit_sha" text;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "ingested_at" timestamp with time zone DEFAULT now() NOT NULL;