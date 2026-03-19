"use client";

import { useState } from "react";
import type { Axiom } from "@/data/constitutional";
import { AxiomStatusBadge } from "./AxiomStatusBadge";

function AxiomRow({
  axiom,
  expanded,
  onToggle,
}: {
  axiom: Axiom;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <span className="text-xs text-[var(--color-text-muted)] transition-transform duration-150"
          style={{ display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          {"\u25B6"}
        </span>
        <span className="font-mono text-xs text-[var(--color-accent-bright)]">
          {axiom.id}
        </span>
        <span className="flex-1 text-sm font-medium">{axiom.name}</span>
        <AxiomStatusBadge status={axiom.status} />
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 pl-12">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {axiom.summary}
          </p>
          {axiom.gap && (
            <div className="mt-2 rounded-md bg-[var(--color-surface-3)] px-3 py-2">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Gap:
              </span>{" "}
              <span className="text-xs text-[var(--color-text-secondary)]">
                {axiom.gap}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AxiomTree({ axioms }: { axioms: Axiom[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(axioms[0]?.id ?? null);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {axioms.map((axiom) => (
        <AxiomRow
          key={axiom.id}
          axiom={axiom}
          expanded={expandedId === axiom.id}
          onToggle={() =>
            setExpandedId((prev) => (prev === axiom.id ? null : axiom.id))
          }
        />
      ))}
    </div>
  );
}
