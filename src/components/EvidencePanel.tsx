"use client";

import { useState } from "react";

export interface EvidenceCitation {
  id: string;
  source_name: string;
  source_type: string;
  url: string | null;
  relevance: number;
  confidence: number;
  freshness: number;
  freshness_label: "live" | "fresh" | "recent" | "aged" | "stale";
  snippet: string;
}

interface EvidencePanelProps {
  citations: EvidenceCitation[];
  confidence_score: number;
  citation_coverage: number;
}

const FRESHNESS_COLORS: Record<string, string> = {
  live: "text-green-400",
  fresh: "text-green-300",
  recent: "text-yellow-300",
  aged: "text-orange-300",
  stale: "text-red-300",
};

export function EvidencePanel({
  citations,
  confidence_score,
  citation_coverage,
}: EvidencePanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (citations.length === 0) return null;

  const topCitations = expanded ? citations : citations.slice(0, 3);

  return (
    <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      {/* Header bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-xs text-[var(--color-text-muted)]"
      >
        <span className="font-medium">
          Sources ({citations.length}) | Confidence:{" "}
          {(confidence_score * 100).toFixed(0)}% | Coverage:{" "}
          {(citation_coverage * 100).toFixed(0)}%
        </span>
        <span>{expanded ? "Collapse" : "Expand"}</span>
      </button>

      {/* Citation list */}
      <div className="mt-2 space-y-2">
        {topCitations.map((c) => (
          <div
            key={c.id}
            className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[var(--color-accent)]">
                [{c.id}]
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-medium ${FRESHNESS_COLORS[c.freshness_label] || ""}`}
                >
                  {c.freshness_label}
                </span>
                <span className="text-[var(--color-text-muted)]">
                  {(c.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="mt-1">
              {c.url ? (
                <a
                  href={c.url}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  {c.source_name}
                </a>
              ) : (
                <span className="text-[var(--color-text)]">{c.source_name}</span>
              )}
              <span className="ml-2 text-[var(--color-text-muted)]">
                ({c.source_type})
              </span>
            </div>
            {expanded && c.snippet && (
              <p className="mt-1 text-[var(--color-text-muted)] line-clamp-2">
                {c.snippet}
              </p>
            )}
          </div>
        ))}
      </div>

      {!expanded && citations.length > 3 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-[var(--color-accent)] hover:underline"
        >
          +{citations.length - 3} more sources
        </button>
      )}
    </div>
  );
}
