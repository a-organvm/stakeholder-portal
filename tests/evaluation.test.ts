import { describe, expect, it } from "vitest";
import { evaluateSample, runEvaluationSuite } from "@/lib/evaluation";
import type { Citation } from "@/lib/citations";

function makeCitation(): Citation {
  return {
    id: "cite-1",
    source_name: "Manifest Snapshot",
    source_type: "manifest",
    url: null,
    relevance: 1,
    confidence: 0.9,
    freshness: 0.8,
    freshness_label: "fresh",
    snippet: "Snapshot generated with 111 repositories.",
    retrieved_at: "2026-03-05T00:00:00.000Z",
  };
}

describe("evaluation harness", () => {
  it("evaluates single sample coverage and keyword recall", () => {
    const result = evaluateSample({
      id: "s1",
      query: "How many repos are tracked?",
      response: "There are 111 repositories [cite-1].",
      citations: [makeCitation()],
      expected_keywords: ["repositories"],
      latency_ms: 500,
    });

    expect(result.citation_coverage).toBeGreaterThan(0);
    expect(result.unsupported_claims).toBe(false);
    expect(result.keyword_recall).toBe(1);
  });

  it("aggregates suite metrics", () => {
    const report = runEvaluationSuite([
      {
        id: "s1",
        query: "q1",
        response: "Known fact [cite-1].",
        citations: [makeCitation()],
        expected_keywords: ["known"],
        latency_ms: 100,
      },
      {
        id: "s2",
        query: "q2",
        response: "There are 55 live deployments.",
        citations: [makeCitation()],
        expected_keywords: ["deployments"],
        latency_ms: 300,
      },
    ]);

    expect(report.summary.total).toBe(2);
    expect(report.summary.hallucination_rate).toBeGreaterThanOrEqual(0);
    expect(report.summary.avg_keyword_recall).toBeGreaterThan(0);
    expect(report.summary.p95_latency_ms).toBeGreaterThan(0);
  });
});
