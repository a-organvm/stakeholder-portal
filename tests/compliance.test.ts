import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyRetentionPolicies,
  deleteSubjectData,
  exportSubjectData,
} from "@/lib/compliance";
import { submitFeedback, resetFeedback } from "@/lib/feedback";
import {
  logAudit,
  resetAuditLog,
  type AccessContext,
} from "@/lib/security";

const originalEnv = { ...process.env };

function makeContext(userId: string): AccessContext {
  return {
    role: "stakeholder",
    user_id: userId,
    ip: "127.0.0.1",
    timestamp: new Date().toISOString(),
    attributes: {},
  };
}

describe("compliance utilities", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    resetFeedback();
    resetAuditLog();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("exports and deletes subject data by client identifier", () => {
    submitFeedback("q", "a", "correct", null, [], "client-1");
    logAudit("chat_query", "chat", makeContext("client-1"), true, "ok");

    const exported = exportSubjectData("client-1");
    expect(exported.feedback_entries).toHaveLength(1);
    expect(exported.audit_entries).toHaveLength(1);

    const deleted = deleteSubjectData("client-1");
    expect(deleted.deleted_feedback_entries).toBe(1);
    expect(deleted.deleted_audit_entries).toBe(1);

    const afterDelete = exportSubjectData("client-1");
    expect(afterDelete.feedback_entries).toHaveLength(0);
    expect(afterDelete.audit_entries).toHaveLength(0);
  });

  it("applies retention cutoffs from platform config", () => {
    process.env.PLATFORM_CONFIG_JSON = JSON.stringify({
      retention: {
        audit_days: 30,
        feedback_days: 30,
        telemetry_days: 7,
      },
    });

    const oldFeedback = submitFeedback("old q", "old a", "missing", null, [], "old-client");
    const newFeedback = submitFeedback("new q", "new a", "correct", null, [], "new-client");
    oldFeedback.created_at = "2025-01-01T00:00:00.000Z";
    newFeedback.created_at = "2026-03-01T00:00:00.000Z";

    const oldAudit = logAudit("read", "repos", makeContext("old-client"), true, "ok");
    const newAudit = logAudit("read", "repos", makeContext("new-client"), true, "ok");
    oldAudit.timestamp = "2025-01-01T00:00:00.000Z";
    newAudit.timestamp = "2026-03-01T00:00:00.000Z";

    const result = applyRetentionPolicies(Date.parse("2026-03-05T00:00:00.000Z"));
    expect(result.purged_feedback_entries).toBe(1);
    expect(result.purged_audit_entries).toBe(1);

    expect(exportSubjectData("old-client").feedback_entries).toHaveLength(0);
    expect(exportSubjectData("new-client").feedback_entries).toHaveLength(1);
  });
});
