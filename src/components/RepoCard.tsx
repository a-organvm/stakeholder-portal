import type { Repo } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { ORGAN_COLORS } from "@/lib/organ-colors";

export function RepoCard({ repo }: { repo: Repo }) {
  const color = ORGAN_COLORS[repo.organ] || "#64748b";

  return (
    <a
      href={`/repos/${repo.slug}`}
      className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-accent-dim)] hover:bg-[var(--color-surface-2)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="truncate text-sm font-semibold">
              {repo.display_name}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
            {repo.description || "No description"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge label={repo.tier} variant="tier" />
        <StatusBadge label={repo.promotion_status} variant="promotion" />
        {repo.ci_workflow && (
          <StatusBadge label={repo.ci_workflow} variant="ci" />
        )}
      </div>
      {repo.deployment_urls.length > 0 && (
        <div className="mt-2 text-xs text-green-400">Deployed</div>
      )}
      {repo.git_stats.total_commits && (
        <div className="mt-1 text-xs text-[var(--color-text-muted)]">
          {repo.git_stats.total_commits} commits
          {repo.git_stats.weekly_velocity
            ? ` / ${repo.git_stats.weekly_velocity}/wk`
            : ""}
        </div>
      )}
    </a>
  );
}
