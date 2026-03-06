/**
 * Citation Enforcement
 *
 * Every material claim in a response must be backed by a source citation
 * with confidence and freshness metadata.
 */

import type { RetrievalSource } from "./hybrid-retrieval";

// ---------------------------------------------------------------------------
// Citation types
// ---------------------------------------------------------------------------

export interface Citation {
  id: string;
  source_name: string;
  source_type: string;
  url: string | null;
  relevance: number;
  confidence: number;
  freshness: number;
  freshness_label: "live" | "fresh" | "recent" | "aged" | "stale";
  snippet: string;
  retrieved_at: string;
}

export interface CitedResponse {
  text: string;
  citations: Citation[];
  citation_coverage: number;    // 0.0 – 1.0 (% of response backed by citations)
  confidence_score: number;     // overall response confidence
  has_unsupported_claims: boolean;
}

// ---------------------------------------------------------------------------
// Build citations from retrieval sources
// ---------------------------------------------------------------------------

export function buildCitations(sources: RetrievalSource[]): Citation[] {
  return sources
    .filter((s) => s.relevance > 0.25)
    .map((s, i) => ({
      id: `cite-${i + 1}`,
      source_name: s.display_name,
      source_type: s.source_type,
      url: s.url,
      relevance: s.relevance,
      confidence: s.confidence,
      freshness: s.freshness,
      freshness_label: getFreshnessLabel(s.freshness),
      snippet: s.snippet.slice(0, 200),
      retrieved_at: s.retrieved_at,
    }))
    .slice(0, 8);
}

function getFreshnessLabel(freshness: number): Citation["freshness_label"] {
  if (freshness >= 0.95) return "live";
  if (freshness >= 0.8) return "fresh";
  if (freshness >= 0.5) return "recent";
  if (freshness >= 0.3) return "aged";
  return "stale";
}

// ---------------------------------------------------------------------------
// Citation enforcement in system prompt
// ---------------------------------------------------------------------------

export function buildCitationInstructions(citations: Citation[]): string {
  if (citations.length === 0) {
    return "No source citations are available. State that information is from the static manifest snapshot.";
  }

  const sourceList = citations
    .slice(0, 10)
    .map((c) => {
      const link = c.url ? ` (${c.url})` : "";
      return `  [${c.id}] ${c.source_name}${link} — confidence: ${(c.confidence * 100).toFixed(0)}%, freshness: ${c.freshness_label}`;
    })
    .join("\n");

  return `CITATION REQUIREMENTS:
You MUST cite sources when making factual claims. Use [cite-N] notation inline.
Available sources:
${sourceList}

Rules:
1. Every factual claim must reference at least one [cite-N] source.
2. If you cannot find a source for a claim, preface it with "Based on available context" or do not make the claim.
3. Do not fabricate source references.
4. Prefer higher-confidence, fresher sources.`;
}

// ---------------------------------------------------------------------------
// Post-response citation analysis
// ---------------------------------------------------------------------------

export function analyzeCitations(
  responseText: string,
  citations: Citation[]
): {
  coverage: number;
  used_citations: string[];
  unsupported_claims: boolean;
} {
  const citationPattern = /\[cite-(\d+)\]/g;
  const usedIds = new Set<string>();
  let match;
  while ((match = citationPattern.exec(responseText)) !== null) {
    usedIds.add(`cite-${match[1]}`);
  }

  const used = [...usedIds].filter((id) => citations.some((c) => c.id === id));

  // Estimate coverage: sentences with citations vs total sentences
  const sentences = responseText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 10);

  const citedSentences = sentences.filter((s) => /\[cite-\d+\]/.test(s));
  const coverage = sentences.length > 0 ? citedSentences.length / sentences.length : 0;

  // Check for unsupported factual claims (heuristic) — only flag
  // genuinely falsifiable claims, not common descriptive statements
  const factualPatterns = [
    /(?:exactly|precisely)\s+\d+/i,
    /\b(?:founded|created|launched)\s+(?:in|on)\s+\d{4}/i,
    /\bgenerat(?:es?|ing)\s+\$[\d,.]+/i,
    /\b\d+%\s+(?:increase|decrease|growth)/i,
  ];

  const factualSentences = sentences.filter((s) =>
    factualPatterns.some((p) => p.test(s))
  );
  const uncitedFactual = factualSentences.filter(
    (s) => !/\[cite-\d+\]/.test(s)
  );

  // Only flag unsupported claims when >2 uncited factual sentences
  // AND >50% of factual sentences lack citations
  const unsupportedClaims =
    uncitedFactual.length > 2 &&
    factualSentences.length > 0 &&
    uncitedFactual.length / factualSentences.length > 0.5;

  return {
    coverage,
    used_citations: used,
    unsupported_claims: unsupportedClaims,
  };
}

// ---------------------------------------------------------------------------
// Build cited response object for API
// ---------------------------------------------------------------------------

export function buildCitedResponse(
  text: string,
  sources: RetrievalSource[]
): CitedResponse {
  const citations = buildCitations(sources);
  const analysis = analyzeCitations(text, citations);

  return {
    text,
    citations,
    citation_coverage: analysis.coverage,
    confidence_score: citations.length > 0
      ? citations.reduce((sum, c) => sum + c.confidence, 0) / citations.length
      : 0.3,
    has_unsupported_claims: analysis.unsupported_claims,
  };
}
