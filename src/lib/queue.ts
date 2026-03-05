/**
 * Postgres-backed job queue using SKIP LOCKED for concurrency-safe dequeuing.
 *
 * Design:
 *  - Enqueue a job → insert row with status='pending'
 *  - Worker dequeues → UPDATE ... RETURNING with SKIP LOCKED picks one row atomically
 *  - On success → mark done, store result
 *  - On failure → increment attempts; if attempts >= maxAttempts → dead_letter
 *  - Retry backoff: 2^attempt * baseMs ms (jittered), stored in runAt
 */

import { and, eq, lt, or, sql } from "drizzle-orm";
import { db } from "./db";
import { jobs } from "./db/schema";
import { randomUUID } from "crypto";

export type JobType = typeof jobs.$inferSelect["type"];
export type JobStatus = typeof jobs.$inferSelect["status"];

export interface EnqueueOptions {
  type: JobType;
  payload?: unknown;
  maxAttempts?: number;
  /** Run no earlier than this time (for delayed jobs). Defaults to now. */
  runAt?: Date;
}

export interface DequeuedJob {
  id: string;
  type: JobType;
  payload: unknown;
  attempts: number;
}

const RETRY_BASE_MS = 1_000; // 1 s base; doubles per attempt

function nextRunAt(attempt: number): Date {
  const jitter = Math.random() * 500;
  const delayMs = Math.pow(2, attempt) * RETRY_BASE_MS + jitter;
  return new Date(Date.now() + delayMs);
}

/** Insert a new job into the queue. Returns the job id. */
export async function enqueueJob(opts: EnqueueOptions): Promise<string> {
  const id = randomUUID();
  await db.insert(jobs).values({
    id,
    type: opts.type,
    status: "pending",
    payload: opts.payload ?? null,
    maxAttempts: opts.maxAttempts ?? 3,
    runAt: opts.runAt ?? new Date(),
    scheduledAt: new Date(),
    createdAt: new Date(),
    attempts: 0,
  });
  return id;
}

/**
 * Atomically claim the next available job of a given type using SKIP LOCKED.
 * Returns null if no job is ready.
 */
export async function dequeueJob(type: JobType, workerId: string): Promise<DequeuedJob | null> {
  const result = await db.execute(sql`
    UPDATE jobs
    SET status = 'running',
        started_at = NOW(),
        worker_id = ${workerId},
        attempts = attempts + 1
    WHERE id = (
      SELECT id FROM jobs
      WHERE type = ${type}
        AND status IN ('pending', 'failed')
        AND attempts < max_attempts
        AND run_at <= NOW()
      ORDER BY run_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, type, payload, attempts
  `);

  const rows = result.rows as Array<{ id: string; type: JobType; payload: unknown; attempts: number }>;
  if (!rows.length) return null;
  return rows[0];
}

/** Mark a job as successfully completed. */
export async function completeJob(id: string, result: unknown): Promise<void> {
  await db.update(jobs).set({
    status: "done",
    completedAt: new Date(),
    result: result ?? null,
    workerId: null,
  }).where(eq(jobs.id, id));
}

/** Mark a job as failed. Re-schedules if attempts remain; otherwise moves to dead_letter. */
export async function failJob(id: string, errorMessage: string): Promise<void> {
  const [job] = await db.select({ attempts: jobs.attempts, maxAttempts: jobs.maxAttempts })
    .from(jobs)
    .where(eq(jobs.id, id));

  if (!job) return;

  const reachedLimit = job.attempts >= job.maxAttempts;

  await db.update(jobs).set({
    status: reachedLimit ? "dead_letter" : "failed",
    errorMessage,
    completedAt: reachedLimit ? new Date() : undefined,
    runAt: reachedLimit ? undefined : nextRunAt(job.attempts),
    workerId: null,
  }).where(eq(jobs.id, id));
}

/** Retrieve dead-letter jobs for inspection. */
export async function getDeadLetterJobs(limit = 50) {
  return db.select().from(jobs)
    .where(eq(jobs.status, "dead_letter"))
    .orderBy(jobs.completedAt)
    .limit(limit);
}

/** Retry a dead-letter job (resets attempts to 0, status to pending). */
export async function retryDeadLetterJob(id: string): Promise<void> {
  await db.update(jobs).set({
    status: "pending",
    attempts: 0,
    errorMessage: null,
    completedAt: null,
    runAt: new Date(),
    workerId: null,
  }).where(and(eq(jobs.id, id), eq(jobs.status, "dead_letter")));
}

/** Cancel pending/failed jobs of a given type (used before re-enqueueing). */
export async function cancelPendingJobsOfType(type: JobType): Promise<void> {
  await db.update(jobs).set({
    status: "dead_letter",
    errorMessage: "cancelled",
    completedAt: new Date(),
  }).where(and(
    eq(jobs.type, type),
    or(eq(jobs.status, "pending"), eq(jobs.status, "failed")),
  ));
}

/** Purge old completed/dead jobs older than `olderThanDays` days. */
export async function purgeOldJobs(olderThanDays = 30): Promise<void> {
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000);
  await db.delete(jobs).where(
    and(
      or(eq(jobs.status, "done"), eq(jobs.status, "dead_letter")),
      lt(jobs.createdAt, cutoff),
    )
  );
}
