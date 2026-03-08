export type ViewMode = "month" | "status" | "dept" | "phase";

const MODES: { key: ViewMode; label: string }[] = [
  { key: "month", label: "By Month" },
  { key: "status", label: "By Status" },
  { key: "dept", label: "By Department" },
  { key: "phase", label: "By Phase" },
];

export function ViewModeSwitcher({
  active,
  onChange,
}: {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-1">
      {MODES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            active === key
              ? "bg-[var(--color-accent)] text-white shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
