import type { SpecEntry, LayerInfo } from "@/data/constitutional";
import { getLayerStatus } from "@/data/constitutional";
import { SpecCard } from "./SpecCard";

export function LayerSection({
  layer,
  specs,
}: {
  layer: LayerInfo;
  specs: SpecEntry[];
}) {
  const status = getLayerStatus(layer.id);

  const statusColor =
    status === "RATIFIED"
      ? "text-emerald-400 border-emerald-500/30"
      : status === "SPECULATIVE"
        ? "text-amber-400 border-amber-500/30"
        : "text-blue-400 border-blue-500/30";

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-sm font-bold text-[var(--color-accent-bright)]">
          {layer.id}
        </span>
        <h3 className="text-base font-semibold uppercase tracking-wide">
          {layer.name}
        </h3>
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
        >
          {status}
        </span>
      </div>

      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        {layer.description}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {specs.map((spec) => (
          <SpecCard key={spec.id} spec={spec} />
        ))}
      </div>
    </section>
  );
}
