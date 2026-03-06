import { describe, expect, it } from "vitest";
import {
  enqueueJob,
  completeJob,
  failJob,
  retryDeadLetterJob,
  cancelPendingJobsOfType,
  purgeOldJobs,
} from "@/lib/queue";
import type { JobType } from "@/lib/queue";

// The global test setup mocks @/lib/db with no-op methods.
// We just verify the functions call through without errors.

describe("queue", () => {
  it("enqueueJob returns a UUID string", async () => {
    const id = await enqueueJob({ type: "maintenance" as JobType });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    // Should look like a UUID (8-4-4-4-12 hex pattern)
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("enqueueJob respects optional parameters", async () => {
    const futureDate = new Date(Date.now() + 60_000);
    const id = await enqueueJob({
      type: "maintenance" as JobType,
      payload: { key: "value" },
      maxAttempts: 5,
      runAt: futureDate,
    });
    expect(typeof id).toBe("string");
  });

  it("completeJob resolves without error", async () => {
    await expect(
      completeJob("test-id", { result: "done" })
    ).resolves.toBeUndefined();
  });

  it("failJob resolves without error", async () => {
    await expect(
      failJob("test-id", "Something went wrong")
    ).resolves.toBeUndefined();
  });

  it("retryDeadLetterJob resolves without error", async () => {
    await expect(
      retryDeadLetterJob("dead-job-id")
    ).resolves.toBeUndefined();
  });

  it("cancelPendingJobsOfType resolves without error", async () => {
    await expect(
      cancelPendingJobsOfType("maintenance" as JobType)
    ).resolves.toBeUndefined();
  });

  it("purgeOldJobs resolves without error with default days", async () => {
    await expect(purgeOldJobs()).resolves.toBeUndefined();
  });

  it("purgeOldJobs accepts a custom olderThanDays parameter", async () => {
    await expect(purgeOldJobs(7)).resolves.toBeUndefined();
  });
});
