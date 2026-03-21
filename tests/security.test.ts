import { describe, it, expect, beforeEach } from "vitest";
import {
  checkPermission,
  maskPii,
  detectPii,
  logAudit,
  getAuditLog,
  getAuditStats,
  resetAuditLog,
  evaluateAccess,
} from "@/lib/security";
import type { AccessContext } from "@/lib/security";

function makeContext(role: "public" | "stakeholder" | "contributor" | "admin" = "public"): AccessContext {
  return {
    role,
    user_id: null,
    ip: "127.0.0.1",
    timestamp: new Date().toISOString(),
    attributes: {},
  };
}

describe("RBAC", () => {
  it("allows public read on repos", () => {
    expect(checkPermission("public", "repos", "read")).toBe(true);
  });

  it("denies public write on repos", () => {
    expect(checkPermission("public", "repos", "write")).toBe(false);
  });

  it("allows stakeholder read on metrics", () => {
    expect(checkPermission("stakeholder", "metrics", "read")).toBe(true);
  });

  it("allows contributor write on entities", () => {
    expect(checkPermission("contributor", "entities", "write")).toBe(true);
  });

  it("allows admin everything", () => {
    expect(checkPermission("admin", "anything", "admin")).toBe(true);
    expect(checkPermission("admin", "repos", "delete")).toBe(true);
  });
});

describe("evaluateAccess", () => {
  it("grants access for valid RBAC", () => {
    const result = evaluateAccess(makeContext("stakeholder"), "metrics", "read");
    expect(result.allowed).toBe(true);
  });

  it("denies access for insufficient RBAC", () => {
    const result = evaluateAccess(makeContext("public"), "metrics", "read");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("lacks");
  });
});

describe("PII masking", () => {
  it("masks email addresses", () => {
    const text = "Contact admin@example.com for info";
    expect(maskPii(text)).toBe("Contact [EMAIL REDACTED] for info");
  });

  it("masks API keys", () => {
    // Build the test key dynamically to avoid triggering GitHub secret scanning
    const prefix = "sk" + "_" + "live";
    const text = `Use token ${prefix}_abc123def456ghi789jkl012`;
    const masked = maskPii(text);
    expect(masked).toContain("[API KEY REDACTED]");
    expect(masked).not.toContain(prefix);
  });

  it("masks IP addresses", () => {
    const text = "Request from 192.168.1.100";
    expect(maskPii(text)).toContain("[IP REDACTED]");
  });

  it("leaves clean text unchanged", () => {
    const text = "This is a normal description of a repository";
    expect(maskPii(text)).toBe(text);
  });
});

describe("detectPii", () => {
  it("detects email addresses", () => {
    const findings = detectPii("user@test.com and admin@example.org");
    expect(findings.some((f) => f.type === "email" && f.count === 2)).toBe(true);
  });

  it("returns empty for clean text", () => {
    expect(detectPii("No sensitive data here")).toHaveLength(0);
  });
});

describe("audit logging", () => {
  beforeEach(() => resetAuditLog());

  it("logs audit entries", () => {
    logAudit("chat_query", "chat", makeContext(), true, "OK");
    const log = getAuditLog();
    expect(log).toHaveLength(1);
    expect(log[0].action).toBe("chat_query");
    expect(log[0].allowed).toBe(true);
  });

  it("tracks stats", () => {
    logAudit("read", "repos", makeContext(), true, "OK");
    logAudit("write", "repos", makeContext(), false, "Denied");

    const stats = getAuditStats();
    expect(stats.total).toBe(2);
    expect(stats.allowed).toBe(1);
    expect(stats.denied).toBe(1);
  });
});
