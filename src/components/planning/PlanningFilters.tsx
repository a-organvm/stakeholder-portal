const DEPTS = ["ENG", "LEG", "PRD", "OPS", "GRO", "FIN", "CXS", "B2B"];
const OWNERS = ["AI", "H:MN", "H:LC", "H:BD", "H:RO", "H:CR", "H:FO"];
const PHASES = ["Beta", "Gamma", "Delta", "Omega"];

const selectClass =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)]";

export function PlanningFilters({
  dept,
  owner,
  phase,
  onDeptChange,
  onOwnerChange,
  onPhaseChange,
}: {
  dept: string;
  owner: string;
  phase: string;
  onDeptChange: (v: string) => void;
  onOwnerChange: (v: string) => void;
  onPhaseChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <select value={dept} onChange={(e) => onDeptChange(e.target.value)} className={selectClass}>
        <option value="">All Depts</option>
        {DEPTS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select value={owner} onChange={(e) => onOwnerChange(e.target.value)} className={selectClass}>
        <option value="">All Owners</option>
        {OWNERS.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <select value={phase} onChange={(e) => onPhaseChange(e.target.value)} className={selectClass}>
        <option value="">All Phases</option>
        {PHASES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}
