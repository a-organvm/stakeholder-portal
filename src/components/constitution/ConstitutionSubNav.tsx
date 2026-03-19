import Link from "next/link";

const NAV_ITEMS = [
  { href: "/constitution", label: "Overview" },
  { href: "/constitution/specs", label: "Spec Ladder" },
  { href: "/constitution/traceability", label: "Traceability" },
  { href: "/constitution/bibliography", label: "Bibliography" },
  { href: "/constitution/author", label: "Author" },
];

export function ConstitutionSubNav({ active }: { active: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent-bright)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
