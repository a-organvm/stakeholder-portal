import type { SpecStatus } from "@/data/constitutional";

const STATUS_STYLES: Record<SpecStatus, string> = {
  "G3 PASSED": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "G0 PASSED (SPECULATIVE)": "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const STATUS_LABELS: Record<SpecStatus, string> = {
  "G3 PASSED": "RATIFIED",
  "G0 PASSED (SPECULATIVE)": "SPECULATIVE",
};

export function PhaseStatusBadge({ status }: { status: SpecStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
