import type { AxiomStatus } from "@/data/constitutional";

const STATUS_STYLES: Record<AxiomStatus, string> = {
  ALIGNED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  DRIFT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  CONFLICT: "bg-red-500/15 text-red-400 border-red-500/30",
  MISSING: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export function AxiomStatusBadge({ status }: { status: AxiomStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
