/**
 * Outbound alert sink dispatch with escalation routing.
 */

import type { SystemAlert } from "./alerts";

type AlertChannel = "webhook" | "slack" | "email";

export interface AlertDispatchResult {
  sink: AlertChannel;
  attempted: boolean;
  delivered: boolean;
  attempt_count: number;
  status_code: number | null;
  error: string | null;
}

export interface AlertDispatchSummary {
  attempted: number;
  delivered: number;
  results: AlertDispatchResult[];
}

interface AlertDispatchContext {
  status: "healthy" | "degraded" | "critical";
  scorecard_id: string;
  completed_at: string;
  alerts: SystemAlert[];
}

interface AlertRoutingRules {
  warning_channels: AlertChannel[];
  critical_channels: AlertChannel[];
  category_channels: Partial<Record<SystemAlert["category"], AlertChannel[]>>;
}

const DEFAULT_ROUTING: AlertRoutingRules = {
  warning_channels: ["webhook", "slack"],
  critical_channels: ["webhook", "slack", "email"],
  category_channels: {
    security: ["webhook", "slack", "email"],
    compliance: ["webhook", "email"],
    latency: ["webhook", "slack"],
    ingestion: ["webhook", "slack"],
    quality: ["webhook", "slack"],
  },
};

function shouldDispatch(): boolean {
  return process.env.ALERT_SINKS_DISABLED !== "1";
}

function getRetryCount(): number {
  const parsed = Number.parseInt(process.env.ALERT_SINK_MAX_RETRIES || "2", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 2;
  return Math.min(parsed, 5);
}

function getRetryDelayMs(): number {
  const parsed = Number.parseInt(process.env.ALERT_SINK_RETRY_BASE_MS || "250", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 250;
  return Math.min(parsed, 5000);
}

function parseRoutingRules(): AlertRoutingRules {
  const raw = process.env.ALERT_ROUTING_JSON;
  if (!raw) return DEFAULT_ROUTING;

  try {
    const parsed = JSON.parse(raw) as Partial<AlertRoutingRules>;
    return {
      warning_channels: parsed.warning_channels ?? DEFAULT_ROUTING.warning_channels,
      critical_channels: parsed.critical_channels ?? DEFAULT_ROUTING.critical_channels,
      category_channels: parsed.category_channels ?? DEFAULT_ROUTING.category_channels,
    };
  } catch {
    return DEFAULT_ROUTING;
  }
}

function summarizeAlerts(alerts: SystemAlert[]): string {
  return alerts
    .map(
      (a) =>
        `- [${a.severity.toUpperCase()}] ${a.category}: ${a.message} (${a.metric_name}=${a.observed_value}, threshold=${a.threshold})`
    )
    .join("\n");
}

function pickChannelsForAlert(alert: SystemAlert, routing: AlertRoutingRules): AlertChannel[] {
  const severityChannels =
    alert.severity === "critical"
      ? routing.critical_channels
      : alert.severity === "warning"
        ? routing.warning_channels
        : [];

  const categoryChannels = routing.category_channels[alert.category] ?? [];
  const merged = new Set<AlertChannel>([...severityChannels, ...categoryChannels]);

  if (alert.severity === "warning" && process.env.ALERT_DISPATCH_WARNINGS !== "1") {
    if (process.env.ALERT_ROUTING_JSON) {
      // Explicit routing JSON can still opt-in warnings.
      return [...merged];
    }
    return [];
  }

  if (alert.severity === "info" && process.env.ALERT_DISPATCH_INFO !== "1") {
    return [];
  }

  return [...merged];
}

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<{ ok: boolean; status: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } finally {
    clearTimeout(timeoutId);
  }
}

function shouldRetryStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function delay(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function dispatchWithRetry(
  sink: AlertChannel,
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<AlertDispatchResult> {
  const maxRetries = getRetryCount();
  const retryDelay = getRetryDelayMs();
  const totalAttempts = maxRetries + 1;

  let lastStatus: number | null = null;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      const res = await postJson(url, body, headers);
      lastStatus = res.status;
      if (res.ok) {
        return {
          sink,
          attempted: true,
          delivered: true,
          attempt_count: attempt,
          status_code: res.status,
          error: null,
        };
      }
      lastError = `HTTP ${res.status}`;
      if (attempt < totalAttempts && shouldRetryStatus(res.status)) {
        await delay(retryDelay * attempt);
        continue;
      }
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : `${sink} dispatch failed`;
      if (attempt < totalAttempts) {
        await delay(retryDelay * attempt);
        continue;
      }
      return {
        sink,
        attempted: true,
        delivered: false,
        attempt_count: attempt,
        status_code: lastStatus,
        error: lastError,
      };
    }
  }

  return {
    sink,
    attempted: true,
    delivered: false,
    attempt_count: totalAttempts,
    status_code: lastStatus,
    error: lastError,
  };
}

function highestSeverity(alerts: SystemAlert[]): "critical" | "warning" | "info" {
  if (alerts.some((a) => a.severity === "critical")) return "critical";
  if (alerts.some((a) => a.severity === "warning")) return "warning";
  return "info";
}

function buildSlackMessage(context: AlertDispatchContext, alerts: SystemAlert[]): string {
  const severity = highestSeverity(alerts);
  const mention =
    severity === "critical"
      ? process.env.ALERT_SLACK_MENTION_CRITICAL || ""
      : process.env.ALERT_SLACK_MENTION_WARNING || "";
  const header = `ORGANVM ALERT [${severity.toUpperCase()}] status=${context.status.toUpperCase()} scorecard=${context.scorecard_id}`;
  return `${mention ? `${mention}\n` : ""}${header}\n${summarizeAlerts(alerts)}`;
}

function buildEmailSubject(context: AlertDispatchContext, alerts: SystemAlert[]): string {
  const severity = highestSeverity(alerts);
  const counts = alerts.reduce<Record<string, number>>((acc, alert) => {
    acc[alert.category] = (acc[alert.category] || 0) + 1;
    return acc;
  }, {});
  const categorySummary = Object.entries(counts)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
  return `ORGANVM ${severity.toUpperCase()} alert (${context.scorecard_id}) ${categorySummary}`;
}

function buildChannelBuckets(
  context: AlertDispatchContext
): Record<AlertChannel, SystemAlert[]> {
  const buckets: Record<AlertChannel, SystemAlert[]> = {
    webhook: [],
    slack: [],
    email: [],
  };

  const routing = parseRoutingRules();
  for (const alert of context.alerts) {
    for (const channel of pickChannelsForAlert(alert, routing)) {
      buckets[channel].push(alert);
    }
  }

  return buckets;
}

export async function dispatchAlertEscalations(
  context: AlertDispatchContext
): Promise<AlertDispatchSummary> {
  if (!shouldDispatch() || context.alerts.length === 0) {
    return { attempted: 0, delivered: 0, results: [] };
  }

  const buckets = buildChannelBuckets(context);
  const results: AlertDispatchResult[] = [];

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  const webhookAlerts = buckets.webhook;
  if (webhookUrl && webhookAlerts.length > 0) {
    results.push(
      await dispatchWithRetry("webhook", webhookUrl, {
        type: "organvm_alerts",
        status: context.status,
        scorecard_id: context.scorecard_id,
        completed_at: context.completed_at,
        alerts: webhookAlerts,
        message: summarizeAlerts(webhookAlerts),
      })
    );
  }

  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  const slackAlerts = buckets.slack;
  if (slackWebhook && slackAlerts.length > 0) {
    results.push(
      await dispatchWithRetry("slack", slackWebhook, {
        text: buildSlackMessage(context, slackAlerts),
      })
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.ALERT_EMAIL_TO;
  const emailFrom = process.env.ALERT_EMAIL_FROM;
  const emailAlerts = buckets.email;
  if (resendKey && emailTo && emailFrom && emailAlerts.length > 0) {
    results.push(
      await dispatchWithRetry(
        "email",
        "https://api.resend.com/emails",
        {
          from: emailFrom,
          to: [emailTo],
          subject: buildEmailSubject(context, emailAlerts),
          text: summarizeAlerts(emailAlerts),
        },
        { Authorization: `Bearer ${resendKey}` }
      )
    );
  }

  const attempted = results.length;
  const delivered = results.filter((r) => r.delivered).length;
  return { attempted, delivered, results };
}

// Backward-compatible shim.
export async function dispatchCriticalAlerts(
  context: AlertDispatchContext
): Promise<AlertDispatchSummary> {
  return dispatchAlertEscalations({
    ...context,
    alerts: context.alerts.filter((a) => a.severity === "critical"),
  });
}
