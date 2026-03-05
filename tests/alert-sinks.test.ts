import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dispatchAlertEscalations, dispatchCriticalAlerts } from "@/lib/alert-sinks";

const originalEnv = { ...process.env };

describe("alert sinks", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("skips dispatch when no critical alerts exist", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await dispatchCriticalAlerts({
      status: "degraded",
      scorecard_id: "sc-1",
      completed_at: "2026-03-05T00:00:00.000Z",
      alerts: [
        {
          id: "a1",
          severity: "warning",
          category: "quality",
          message: "warning",
          metric_name: "x",
          observed_value: 1,
          threshold: 0.5,
          generated_at: "2026-03-05T00:00:00.000Z",
        },
      ],
    });

    expect(result.attempted).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("dispatches to configured webhook/slack/email sinks", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://example.com/webhook";
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    process.env.RESEND_API_KEY = "re_test";
    process.env.ALERT_EMAIL_TO = "alerts@example.com";
    process.env.ALERT_EMAIL_FROM = "noreply@example.com";

    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await dispatchCriticalAlerts({
      status: "critical",
      scorecard_id: "sc-2",
      completed_at: "2026-03-05T00:00:00.000Z",
      alerts: [
        {
          id: "a2",
          severity: "critical",
          category: "security",
          message: "critical",
          metric_name: "audit_denied_ratio",
          observed_value: 0.5,
          threshold: 0.2,
          generated_at: "2026-03-05T00:00:00.000Z",
        },
      ],
    });

    expect(result.attempted).toBe(3);
    expect(result.delivered).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.results.every((entry) => entry.attempt_count === 1)).toBe(true);
  });

  it("does not dispatch warning-only alerts unless explicitly enabled", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://example.com/webhook";
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await dispatchAlertEscalations({
      status: "degraded",
      scorecard_id: "sc-3",
      completed_at: "2026-03-05T00:00:00.000Z",
      alerts: [
        {
          id: "a3",
          severity: "warning",
          category: "latency",
          message: "warning",
          metric_name: "p95_latency_ms",
          observed_value: 7000,
          threshold: 6000,
          generated_at: "2026-03-05T00:00:00.000Z",
        },
      ],
    });

    expect(result.attempted).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("dispatches warning alerts when ALERT_DISPATCH_WARNINGS=1", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://example.com/webhook";
    process.env.ALERT_DISPATCH_WARNINGS = "1";
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await dispatchAlertEscalations({
      status: "degraded",
      scorecard_id: "sc-4",
      completed_at: "2026-03-05T00:00:00.000Z",
      alerts: [
        {
          id: "a4",
          severity: "warning",
          category: "latency",
          message: "warning",
          metric_name: "p95_latency_ms",
          observed_value: 7000,
          threshold: 6000,
          generated_at: "2026-03-05T00:00:00.000Z",
        },
      ],
    });

    expect(result.attempted).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries transient webhook failures before succeeding", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://example.com/webhook";
    process.env.ALERT_SINK_MAX_RETRIES = "2";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("retry", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await dispatchCriticalAlerts({
      status: "critical",
      scorecard_id: "sc-5",
      completed_at: "2026-03-05T00:00:00.000Z",
      alerts: [
        {
          id: "a5",
          severity: "critical",
          category: "ingestion",
          message: "critical",
          metric_name: "dead_letter_ratio",
          observed_value: 0.3,
          threshold: 0.1,
          generated_at: "2026-03-05T00:00:00.000Z",
        },
      ],
    });

    expect(result.attempted).toBe(1);
    expect(result.delivered).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.results[0]?.attempt_count).toBe(2);
  });
});
