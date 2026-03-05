"use client";

import { useState, useMemo } from "react";
import { getRepos, getOrgans } from "@/lib/manifest";
import { RepoCard } from "@/components/RepoCard";
import { SearchBar } from "@/components/SearchBar";
import type { Repo } from "@/lib/types";

const repos = getRepos();
const organs = getOrgans();

const TIERS = ["flagship", "standard", "infrastructure", "archive", "stub"];
const PROMOS = ["GRADUATED", "PUBLIC_PROCESS", "CANDIDATE", "LOCAL", "ARCHIVED"];

function filterAndSearch(
  allRepos: Repo[],
  query: string,
  organ: string,
  tier: string,
  promo: string,
  sort: string
): Repo[] {
  let filtered = allRepos;

  if (organ) filtered = filtered.filter((r) => r.organ === organ);
  if (tier) filtered = filtered.filter((r) => r.tier === tier);
  if (promo) filtered = filtered.filter((r) => r.promotion_status === promo);

  if (query.trim()) {
    const terms = query.toLowerCase().split(/\s+/);
    filtered = filtered.filter((r) => {
      const hay = `${r.name} ${r.display_name} ${r.description} ${r.organ} ${r.tech_stack.join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  filtered.sort((a, b) => {
    switch (sort) {
      case "name":
        return a.name.localeCompare(b.name);
      case "organ":
        return a.organ.localeCompare(b.organ) || a.name.localeCompare(b.name);
      case "commits":
        return (
          (b.git_stats.total_commits || 0) - (a.git_stats.total_commits || 0)
        );
      case "recent":
        return (
          (b.git_stats.last_commit || "").localeCompare(
            a.git_stats.last_commit || ""
          )
        );
      default:
        return 0;
    }
  });

  return filtered;
}

export default function ReposPage() {
  const [query, setQuery] = useState("");
  const [organ, setOrgan] = useState("");
  const [tier, setTier] = useState("");
  const [promo, setPromo] = useState("");
  const [sort, setSort] = useState("organ");

  const results = useMemo(
    () => filterAndSearch(repos, query, organ, tier, promo, sort),
    [query, organ, tier, promo, sort]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Repositories</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {repos.length} repos across {organs.length} organs
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar
            placeholder="Search repos by name, description, tech..."
            onSearch={setQuery}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={organ}
            onChange={(e) => setOrgan(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs"
          >
            <option value="">All Organs</option>
            {organs.map((o) => (
              <option key={o.key} value={o.key}>
                {o.key}: {o.name}
              </option>
            ))}
          </select>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs"
          >
            <option value="">All Tiers</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs"
          >
            <option value="">All Promotions</option>
            {PROMOS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs"
          >
            <option value="organ">Sort: Organ</option>
            <option value="name">Sort: Name</option>
            <option value="commits">Sort: Commits</option>
            <option value="recent">Sort: Recent</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        Showing {results.length} of {repos.length} repos
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <RepoCard key={r.slug} repo={r} />
        ))}
      </div>
    </div>
  );
}
