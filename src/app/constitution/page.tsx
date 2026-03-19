import { getAxioms, getSpecs, getLayers, getMetrics } from "@/data/constitutional";
import { ConstitutionSubNav } from "@/components/constitution/ConstitutionSubNav";
import { AxiomTree } from "@/components/constitution/AxiomTree";
import { LayerOverview } from "@/components/constitution/LayerOverview";

function MetricCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

export default function ConstitutionPage() {
  const axioms = getAxioms();
  const specs = getSpecs();
  const layers = getLayers();
  const metrics = getMetrics();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          The ORGANVM Constitution
        </h1>
        <p className="max-w-2xl text-[var(--color-text-secondary)]">
          {metrics.totalSpecs + metrics.totalInstruments} specs.{" "}
          {axioms.length} axioms. {metrics.totalBibEntries} academic sources.
          Formally grounded.
        </p>
        <ConstitutionSubNav active="/constitution" />
      </section>

      {/* Metrics strip */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <MetricCell label="Specs Ratified" value={metrics.specsRatified} />
          <MetricCell label="Speculative" value={metrics.specsSpeculative} />
          <MetricCell label="BibTeX Entries" value={metrics.totalBibEntries} />
          <MetricCell
            label="Grounding Lines"
            value={metrics.totalGroundingLines.toLocaleString()}
          />
        </div>
      </section>

      {/* Axiom alignment summary */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Implementation Status
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-emerald-500/60" />
            <span>
              <span className="font-medium text-emerald-400">
                {metrics.traceabilityCoveragePct}%
              </span>{" "}
              <span className="text-[var(--color-text-muted)]">
                traceability coverage
              </span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-400">
            ALIGNED {metrics.axiomsAligned}
          </span>
          <span className="rounded-md bg-amber-500/15 px-2 py-1 text-amber-400">
            DRIFT {metrics.axiomsDrift}
          </span>
          <span className="rounded-md bg-red-500/15 px-2 py-1 text-red-400">
            CONFLICT {metrics.axiomsConflict}
          </span>
          <span className="rounded-md bg-zinc-500/15 px-2 py-1 text-zinc-400">
            MISSING {metrics.axiomsMissing}
          </span>
        </div>
      </section>

      {/* Axiom tree */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Axiom Tree</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          {axioms.length} axioms defined in SPEC-000. Each axiom is traced to
          the current codebase with an alignment status.
        </p>
        <AxiomTree axioms={axioms} />
      </section>

      {/* Layer overview */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Layer Ratification Progress</h2>
        <LayerOverview layers={layers} specs={specs} />
      </section>
    </div>
  );
}
