/**
 * Health and risk alerting primitives.
 */

import type { EvaluationSummary } from "./evaluation";
import type { IngestionCycleReport } from "./connectors/orchestrator";
import type { MetricsSnapshot } from "./observability";

export type AlertSeverity = "info" | "warning" | "critical";

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  category: "quality" | "latency" | "ingestion" | "security" | "compliance";
  message: string;
  metric_name: string;
  observed_value: number;
  threshold: number;
  generated_at: string;
}

export interface AlertThresholds {
  min_citation_coverage: number;
  max_hallucination_rate: number;
  max_eval_p95_latency_ms: number;
  max_audit_denied_ratio: number;
  max_ingestion_quarantine_rate: number;
  max_ingestion_dead_letters: number;
}

export interface AlertInput {
  evaluation?: EvaluationSummary | null;
  ingestion?: IngestionCycleReport | null;
  audit?: { total: number; denied: number } | null;
  metrics?: MetricsSnapshot | null;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  min_citation_coverage: 0.75,
  max_hallucination_rate: 0.1,
  max_eval_p95_latency_ms: 6_000,
  max_audit_denied_ratio: 0.2,
  max_ingestion_quarantine_rate: 0.15,
  max_ingestion_dead_letters: 20,
};

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getAlertThresholds(): AlertThresholds {
  return {
    min_citation_coverage: parseNumber(
      process.env.ALERT_MIN_CITATION_COVERAGE,
      DEFAULT_THRESHOLDS.min_citation_coverage
    ),
    max_hallucination_rate: parseNumber(
      process.env.ALERT_MAX_HALLUCINATION_RATE,
      DEFAULT_THRESHOLDS.max_hallucination_rate
    ),
    max_eval_p95_latency_ms: parseNumber(
      process.env.ALERT_MAX_EVAL_P95_MS,
      DEFAULT_THRESHOLDS.max_eval_p95_latency_ms
    ),
    max_audit_denied_ratio: parseNumber(
      process.env.ALERT_MAX_AUDIT_DENIED_RATIO,
      DEFAULT_THRESHOLDS.max_audit_denied_ratio
    ),
    max_ingestion_quarantine_rate: parseNumber(
      process.env.ALERT_MAX_INGEST_QUARANTINE_RATE,
      DEFAULT_THRESHOLDS.max_ingestion_quarantine_rate
    ),
    max_ingestion_dead_letters: parseNumber(
      process.env.ALERT_MAX_INGEST_DEAD_LETTERS,
      DEFAULT_THRESHOLDS.max_ingestion_dead_letters
    ),
  };
}

function makeAlert(
  partial: Omit<SystemAlert, "id" | "generated_at">
): SystemAlert {
  return {
    ...partial,
    id: `alert-${Math.random().toString(36).slice(2, 10)}`,
    generated_at: new Date().toISOString(),
  };
}

function toSeverity(overageRatio: number): AlertSeverity {
  if (overageRatio >= 0.5) return "critical";
  if (overageRatio >= 0.15) return "warning";
  return "info";
}

export function evaluateSystemAlerts(
  input: AlertInput,
  thresholds = getAlertThresholds()
): SystemAlert[] {
  const alerts: SystemAlert[] = [];

  const evaluation = input.evaluation;
  if (evaluation) {
    if (evaluation.avg_citation_coverage < thresholds.min_citation_coverage) {
      const gap =
        (thresholds.min_citation_coverage - evaluation.avg_citation_coverage) /
        Math.max(thresholds.min_citation_coverage, 0.0001);
      alerts.push(
        makeAlert({
          severity: toSeverity(gap),
          category: "quality",
          message: "Citation coverage is below threshold.",
          metric_name: "avg_citation_coverage",
          observed_value: evaluation.avg_citation_coverage,
          threshold: thresholds.min_citation_coverage,
        })
      );
    }

    if (evaluation.hallucination_rate > thresholds.max_hallucination_rate) {
      const over =
        (evaluation.hallucination_rate - thresholds.max_hallucination_rate) /
        Math.max(thresholds.max_hallucination_rate, 0.0001);
      alerts.push(
        makeAlert({
          severity: toSeverity(over),
          category: "quality",
          message: "Unsupported-claim rate exceeded threshold.",
          metric_name: "hallucination_rate",
          observed_value: evaluation.hallucination_rate,
          threshold: thresholds.max_hallucination_rate,
        })
      );
    }

    if (evaluation.p95_latency_ms > thresholds.max_eval_p95_latency_ms) {
      const over =
        (evaluation.p95_latency_ms - thresholds.max_eval_p95_latency_ms) /
        Math.max(thresholds.max_eval_p95_latency_ms, 1);
      alerts.push(
        makeAlert({
          severity: toSeverity(over),
          category: "latency",
          message: "Evaluation latency is above SLO threshold.",
          metric_name: "p95_latency_ms",
          observed_value: evaluation.p95_latency_ms,
          threshold: thresholds.max_eval_p95_latency_ms,
        })
      );
    }
  }

  const ingestion = input.ingestion;
  if (ingestion) {
    const denominator = Math.max(ingestion.total_records_synced, 1);
    const quarantineRate = ingestion.total_quarantined / denominator;
    if (quarantineRate > thresholds.max_ingestion_quarantine_rate) {
      const over =
        (quarantineRate - thresholds.max_ingestion_quarantine_rate) /
        Math.max(thresholds.max_ingestion_quarantine_rate, 0.0001);
      alerts.push(
        makeAlert({
          severity: toSeverity(over),
          category: "ingestion",
          message: "Ingestion quarantine rate exceeded threshold.",
          metric_name: "ingestion_quarantine_rate",
          observed_value: quarantineRate,
          threshold: thresholds.max_ingestion_quarantine_rate,
        })
      );
    }

    if (ingestion.dead_letters.length > thresholds.max_ingestion_dead_letters) {
      const over =
        (ingestion.dead_letters.length - thresholds.max_ingestion_dead_letters) /
        Math.max(thresholds.max_ingestion_dead_letters, 1);
      alerts.push(
        makeAlert({
          severity: toSeverity(over),
          category: "ingestion",
          message: "Dead-letter volume exceeded threshold.",
          metric_name: "ingestion_dead_letters",
          observed_value: ingestion.dead_letters.length,
          threshold: thresholds.max_ingestion_dead_letters,
        })
      );
    }
  }

  const audit = input.audit;
  if (audit && audit.total > 0) {
    const deniedRatio = audit.denied / audit.total;
    if (deniedRatio > thresholds.max_audit_denied_ratio) {
      const over =
        (deniedRatio - thresholds.max_audit_denied_ratio) /
        Math.max(thresholds.max_audit_denied_ratio, 0.0001);
      alerts.push(
        makeAlert({
          severity: toSeverity(over),
          category: "security",
          message: "Audit denied ratio exceeded threshold.",
          metric_name: "audit_denied_ratio",
          observed_value: deniedRatio,
          threshold: thresholds.max_audit_denied_ratio,
        })
      );
    }
  }

  // Placeholder hook: metrics-based alerts can be layered incrementally.
  void input.metrics;

  return alerts;
}

export function getOverallAlertStatus(alerts: SystemAlert[]): "healthy" | "degraded" | "critical" {
  if (alerts.some((a) => a.severity === "critical")) return "critical";
  if (alerts.some((a) => a.severity === "warning")) return "degraded";
  return "healthy";
}
