"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const FACET_URLS: Record<string, string> = {
  portfolio: "https://4444j99.github.io/portfolio/",
  hermeneus: "https://stakeholder-portal-ten.vercel.app",
  "knowledge-base": "#",
  nexus: "#",
};

const FACET_LABELS: Record<string, string> = {
  portfolio: "Portfolio",
  hermeneus: "Hermeneus",
  "knowledge-base": "Knowledge Base",
  nexus: "Nexus",
};

function PrismBreadcrumbInner() {
  const searchParams = useSearchParams();
  const prism = searchParams.get("prism");

  if (!prism) return null;

  const parts = prism.split(".");
  const facet = parts[0];
  const page = parts[1];
  const entity = parts[2];

  const facetUrl = FACET_URLS[facet];
  const facetLabel = FACET_LABELS[facet];

  if (!facetUrl || !facetLabel) return null;

  const crumbs: { label: string; href?: string }[] = [
    { label: facetLabel, href: facetUrl },
  ];

  if (page) {
    const pageLabel = page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, " ");
    crumbs.push({ label: pageLabel });
  }

  if (entity) {
    const entityLabel = entity.charAt(0).toUpperCase() + entity.slice(1).replace(/-/g, " ");
    crumbs.push({ label: entityLabel });
  }

  return (
    <div className="mx-auto max-w-7xl px-6">
      <nav
        aria-label="Origin breadcrumb"
        className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] py-2"
      >
        <a
          href={facetUrl}
          className="hover:text-blue-400 transition-colors flex items-center gap-1"
        >
          <span aria-hidden="true">&larr;</span>
          {crumbs[0].label}
        </a>
        {crumbs.slice(1).map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            <span aria-hidden="true" className="opacity-40">&rsaquo;</span>
            <span>{crumb.label}</span>
          </span>
        ))}
      </nav>
    </div>
  );
}

export function PrismBreadcrumb() {
  return (
    <Suspense fallback={null}>
      <PrismBreadcrumbInner />
    </Suspense>
  );
}
