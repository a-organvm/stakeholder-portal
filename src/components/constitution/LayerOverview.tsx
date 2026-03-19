import type { SpecEntry, LayerInfo } from "@/data/constitutional";
import { getLayerStatus } from "@/data/constitutional";

function LayerBar({
  layer,
  specs,
}: {
  layer: LayerInfo;
  specs: SpecEntry[];
}) {
  const status = getLayerStatus(layer.id);
  const ratified = specs.filter((s) => s.status === "G3 PASSED").length;
  const total = specs.length;
  const pct = total > 0 ? (ratified / total) * 100 : 0;

  const statusColor =
    status === "RATIFIED"
      ? "text-emerald-400"
      : status === "SPECULATIVE"
        ? "text-amber-400"
        : "text-blue-400";

  const barColor =
    status === "RATIFIED"
      ? "bg-emerald-500/60"
      : status === "SPECULATIVE"
        ? "bg-amber-500/40"
        : "bg-blue-500/50";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--color-accent-bright)]">
            {layer.id}
          </span>
          <span className="text-sm font-medium">{layer.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">
            {specs.map((s) => s.id).join(", ")}
          </span>
          <span className={`text-xs font-medium ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LayerOverview({
  layers,
  specs,
}: {
  layers: LayerInfo[];
  specs: SpecEntry[];
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Layer Ratification
      </h3>
      <div className="space-y-4">
        {layers.map((layer) => (
          <LayerBar
            key={layer.id}
            layer={layer}
            specs={specs.filter((s) => s.layer === layer.id)}
          />
        ))}
      </div>
    </div>
  );
}
