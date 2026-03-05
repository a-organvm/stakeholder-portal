import type { Organ } from "@/lib/types";
import { ORGAN_COLORS, ORGAN_BG_CLASSES } from "@/lib/organ-colors";

export function OrganCard({ organ }: { organ: Organ }) {
  const color = ORGAN_COLORS[organ.key] || "#64748b";
  const bg = ORGAN_BG_CLASSES[organ.key] || ORGAN_BG_CLASSES["META-ORGANVM"];

  return (
    <a
      href={`/organs/${organ.key}`}
      className={`block rounded-lg border p-5 transition-all hover:scale-[1.02] ${bg}`}
    >
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          {organ.key}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-semibold">
        {organ.name}{" "}
        <span className="text-[var(--color-text-muted)]">({organ.greek})</span>
      </h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        {organ.domain}
      </p>
      <div className="mt-3 text-sm">
        <span className="font-medium">{organ.repo_count}</span>{" "}
        <span className="text-[var(--color-text-muted)]">repos</span>
      </div>
    </a>
  );
}
