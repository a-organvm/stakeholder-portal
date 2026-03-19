import type { SpecEntry } from "@/data/constitutional";
import { PhaseStatusBadge } from "./PhaseStatusBadge";

function ArtifactPill({ label, present }: { label: string; present: boolean }) {
  if (!present) return null;
  return (
    <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-3)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
      {label}
    </span>
  );
}

export function SpecCard({ spec }: { spec: SpecEntry }) {
  return (
    <div className="flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[rgba(255,255,255,0.12)]">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-[var(--color-accent-bright)]">
          {spec.id}
        </span>
        <PhaseStatusBadge status={spec.status} />
      </div>

      <h4 className="mt-1.5 text-sm font-semibold leading-snug">
        {spec.title}
      </h4>

      <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        <span className="font-mono">{spec.groundingLines} lines</span>
        {spec.dateCompleted && (
          <span>{spec.dateCompleted}</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        <ArtifactPill label="lit" present={spec.hasLiteratureMatrix} />
        <ArtifactPill label="risk" present={spec.hasRiskRegister} />
        <ArtifactPill label="inv" present={spec.hasInventory} />
        <ArtifactPill label="brief" present={spec.hasResearchBrief} />
        <ArtifactPill label="src" present={spec.hasSources} />
      </div>
    </div>
  );
}
