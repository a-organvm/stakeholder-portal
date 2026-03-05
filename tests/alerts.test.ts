import { describe, expect, it } from "vitest";
import {
  evaluateSystemAlerts,
  getOverallAlertStatus,
  type AlertThresholds,
} from "@/lib/alerts";

const THRESHOLDS: AlertThresholds = {
  min_citation_coverage: 0.8,
  max_hallucination_rate: 0.05,
  max_eval_p95_latency_ms: 2000,
  max_audit_denied_ratio: 0.1,
  max_ingestion_quarantine_rate: 0.1,
  max_ingestion_dead_letters: 2,
};

describe("alerts", () => {
  it("returns healthy when no thresholds are breached", () => {
    const alerts = evaluateSystemAlerts(
      {
        evaluation: {
          total: 10,
          avg_citation_coverage: 0.9,
          hallucination_rate: 0.01,
          avg_keyword_recall: 0.8,
          p95_latency_ms: 500,
        },
        ingestion: {
          started_at: "2026-03-05T00:00:00.000Z",
          completed_at: "2026-03-05T00:01:00.000Z",
          total_records_synced: 100,
          total_ingested: 95,
          total_deduplicated: 4,
          total_quarantined: 1,
          connector_summaries: [],
          dead_letters: [],
        },
        audit: { total: 100, denied: 3 },
      },
      THRESHOLDS
    );

    expect(alerts).toHaveLength(0);
    expect(getOverallAlertStatus(alerts)).toBe("healthy");
  });

  it("produces alerts when quality and security regress", () => {
    const alerts = evaluateSystemAlerts(
      {
        evaluation: {
          total: 10,
          avg_citation_coverage: 0.4,
          hallucination_rate: 0.3,
          avg_keyword_recall: 0.2,
          p95_latency_ms: 7000,
        },
        ingestion: {
          started_at: "2026-03-05T00:00:00.000Z",
          completed_at: "2026-03-05T00:01:00.000Z",
          total_records_synced: 10,
          total_ingested: 2,
          total_deduplicated: 1,
          total_quarantined: 7,
          connector_summaries: [],
          dead_letters: [{ connector_id: "x", stage: "sync", reason: "boom", occurred_at: "2026-03-05T00:00:00.000Z", record: null }],
        },
        audit: { total: 10, denied: 5 },
      },
      THRESHOLDS
    );

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some((a) => a.metric_name === "avg_citation_coverage")).toBe(true);
    expect(alerts.some((a) => a.metric_name === "hallucination_rate")).toBe(true);
    expect(alerts.some((a) => a.metric_name === "audit_denied_ratio")).toBe(true);
    expect(getOverallAlertStatus(alerts)).toBe("critical");
  });
});
