/**
 * Offline evaluation harness for answer quality.
 *
 * Focuses on grounding quality, unsupported-claim rate, and latency.
 */

import type { Citation } from "./citations";
import { analyzeCitations } from "./citations";

export interface EvaluationSample {
  id: string;
  query: string;
  response: string;
  citations: Citation[];
  expected_keywords?: string[];
  latency_ms?: number;
}

export interface EvaluationResult {
  id: string;
  query: string;
  citation_coverage: number;
  unsupported_claims: boolean;
  used_citations: string[];
  keyword_recall: number;
  latency_ms: number | null;
}

export interface EvaluationSummary {
  total: number;
  avg_citation_coverage: number;
  hallucination_rate: number;
  avg_keyword_recall: number;
  p95_latency_ms: number;
}

export interface EvaluationReport {
  summary: EvaluationSummary;
  results: EvaluationResult[];
}

function computeKeywordRecall(response: string, expectedKeywords: string[]): number {
  if (expectedKeywords.length === 0) return 1;
  const text = response.toLowerCase();
  const hits = expectedKeywords.filter((k) => text.includes(k.toLowerCase())).length;
  return hits / expectedKeywords.length;
}

function percentile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q)));
  return sorted[idx];
}

export function evaluateSample(sample: EvaluationSample): EvaluationResult {
  const analysis = analyzeCitations(sample.response, sample.citations);
  const keywordRecall = computeKeywordRecall(
    sample.response,
    sample.expected_keywords ?? []
  );

  return {
    id: sample.id,
    query: sample.query,
    citation_coverage: analysis.coverage,
    unsupported_claims: analysis.unsupported_claims,
    used_citations: analysis.used_citations,
    keyword_recall: keywordRecall,
    latency_ms: Number.isFinite(sample.latency_ms) ? sample.latency_ms ?? null : null,
  };
}

export function runEvaluationSuite(samples: EvaluationSample[]): EvaluationReport {
  const results = samples.map(evaluateSample);
  const total = results.length;
  const coverageSum = results.reduce((sum, r) => sum + r.citation_coverage, 0);
  const hallucinations = results.filter((r) => r.unsupported_claims).length;
  const recallSum = results.reduce((sum, r) => sum + r.keyword_recall, 0);
  const latencies = results
    .map((r) => r.latency_ms)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));

  return {
    summary: {
      total,
      avg_citation_coverage: total > 0 ? coverageSum / total : 0,
      hallucination_rate: total > 0 ? hallucinations / total : 0,
      avg_keyword_recall: total > 0 ? recallSum / total : 0,
      p95_latency_ms: percentile(latencies, 0.95),
    },
    results,
  };
}
