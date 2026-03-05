import { getManifest, getMetrics } from "@/lib/manifest";
import { MetricGrid } from "@/components/MetricGrid";
import { OrganCard } from "@/components/OrganCard";
import Link from "next/link";

export default function HomePage() {
  const manifest = getManifest();
  const metrics = getMetrics();

  const metricItems = [
    { label: "Repositories", value: metrics.repos },
    { label: "Organs", value: metrics.organs },
    { label: "Sprints", value: metrics.sprints },
    { label: "CI Workflows", value: metrics.ciWorkflows },
    { label: "Deployments", value: metrics.deployments },
    { label: "Essays", value: metrics.essays },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="py-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          ORGANVM
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-text-muted)]">
          Eight-organ creative-institutional system. {metrics.repos} repos,{" "}
          {metrics.organs} organs, {metrics.sprints} sprints.
          One AI-orchestrated vision.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/ask"
            className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Ask anything
          </Link>
          <Link
            href="/repos"
            className="rounded-lg border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface)]"
          >
            Browse repos
          </Link>
        </div>
      </section>

      {/* Metrics */}
      <section>
        <MetricGrid metrics={metricItems} />
      </section>

      {/* Organs */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">The Eight Organs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {manifest.organs.map((organ) => (
            <OrganCard key={organ.key} organ={organ} />
          ))}
        </div>
      </section>

      {/* Recent deployments */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Live Deployments</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.deployments.slice(0, 12).map((d) => (
            <a
              key={d.url}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
              <div className="min-w-0">
                <div className="truncate font-medium">{d.repo}</div>
                <div className="truncate text-xs text-[var(--color-text-muted)]">
                  {d.url}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
