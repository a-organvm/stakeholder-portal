import { getRepos, getRepo, getOrgan } from "@/lib/manifest";
import { StatusBadge } from "@/components/StatusBadge";
import { ORGAN_COLORS } from "@/lib/organ-colors";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getRepos().map((r) => ({ slug: r.slug }));
}

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const repo = getRepo(slug);
  if (!repo) notFound();

  const organ = getOrgan(repo.organ);
  const color = ORGAN_COLORS[repo.organ] || "#64748b";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <a href={`/organs/${repo.organ}`} className="hover:text-white">
            {organ?.name || repo.organ} ({organ?.greek})
          </a>
        </div>
        <h1 className="mt-2 text-3xl font-bold">{repo.display_name}</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          {repo.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge label={repo.tier} variant="tier" />
          <StatusBadge label={repo.promotion_status} variant="promotion" />
          <StatusBadge label={repo.status} variant="tier" />
          {repo.ci_workflow && (
            <StatusBadge label={repo.ci_workflow} variant="ci" />
          )}
          {repo.platinum_status && (
            <span className="inline-block rounded-full border border-amber-600 bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              Platinum
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Sections from CLAUDE.md / README.md */}
          {Object.entries(repo.sections).map(([key, content]) => (
            <section
              key={key}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <h2 className="mb-3 text-lg font-semibold capitalize">{key}</h2>
              <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-muted)]">
                {content}
              </pre>
            </section>
          ))}

          {Object.keys(repo.sections).length === 0 && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
              No detailed sections available for this repo. Check the GitHub
              repository for more information.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Links */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-2 text-sm font-semibold">Links</h3>
            <div className="space-y-1.5">
              {repo.github_url && (
                <a
                  href={repo.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[var(--color-accent)] hover:underline"
                >
                  GitHub
                </a>
              )}
              {repo.deployment_urls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm text-green-400 hover:underline"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>

          {/* Git stats */}
          {repo.git_stats.total_commits && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="mb-2 text-sm font-semibold">Git Stats</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Commits</dt>
                  <dd>{repo.git_stats.total_commits}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Velocity</dt>
                  <dd>{repo.git_stats.weekly_velocity}/wk</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">First</dt>
                  <dd>{repo.git_stats.first_commit}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Last</dt>
                  <dd>{repo.git_stats.last_commit}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Tech stack */}
          {repo.tech_stack.length > 0 && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="mb-2 text-sm font-semibold">Tech Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {repo.tech_stack.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {repo.dependencies.length > 0 && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="mb-2 text-sm font-semibold">Dependencies</h3>
              <ul className="space-y-1 text-sm text-[var(--color-text-muted)]">
                {repo.dependencies.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Revenue info */}
          {repo.revenue_model && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="mb-2 text-sm font-semibold">Revenue</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Model</dt>
                  <dd>{repo.revenue_model}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Status</dt>
                  <dd>{repo.revenue_status}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
