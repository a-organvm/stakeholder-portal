import { getSpecs, getLayers, getMetrics, getSpecsByLayer } from "@/data/constitutional";
import { ConstitutionSubNav } from "@/components/constitution/ConstitutionSubNav";
import { LayerSection } from "@/components/constitution/LayerSection";

export default function SpecLadderPage() {
  const specs = getSpecs();
  const layers = getLayers();
  const metrics = getMetrics();

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Spec Ladder
        </h1>
        <p className="max-w-2xl text-[var(--color-text-secondary)]">
          The constitutional stack: {metrics.totalSpecs} numbered specs +{" "}
          {metrics.totalInstruments} governance instruments across{" "}
          {layers.length} layers.
        </p>
        <ConstitutionSubNav active="/constitution/specs" />
      </section>

      {/* Summary strip */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <span>
              <span className="text-2xl font-bold">{specs.length}</span>{" "}
              <span className="text-[var(--color-text-muted)]">total specs</span>
            </span>
            <span className="text-[var(--color-border)]">|</span>
            <span>
              <span className="font-medium text-emerald-400">
                {metrics.specsRatified}
              </span>{" "}
              <span className="text-[var(--color-text-muted)]">ratified</span>
            </span>
            <span className="text-[var(--color-border)]">|</span>
            <span>
              <span className="font-medium text-amber-400">
                {metrics.specsSpeculative}
              </span>{" "}
              <span className="text-[var(--color-text-muted)]">speculative</span>
            </span>
          </div>
          <span className="font-mono text-xs text-[var(--color-text-muted)]">
            {metrics.totalGroundingLines.toLocaleString()} total grounding lines
          </span>
        </div>
      </section>

      {/* Layers */}
      <div className="space-y-12">
        {layers.map((layer) => {
          const layerSpecs = getSpecsByLayer(layer.id);
          if (layerSpecs.length === 0) return null;
          return (
            <LayerSection key={layer.id} layer={layer} specs={layerSpecs} />
          );
        })}
      </div>
    </div>
  );
}
