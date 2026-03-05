import { getOrgans } from "@/lib/manifest";
import { OrganCard } from "@/components/OrganCard";

export default function OrgansPage() {
  const organs = getOrgans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">The Eight Organs</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          ORGANVM&apos;s institutional architecture
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {organs.map((organ) => (
          <OrganCard key={organ.key} organ={organ} />
        ))}
      </div>
    </div>
  );
}
