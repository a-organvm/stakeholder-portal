const TIER_COLORS: Record<string, string> = {
  flagship: "bg-amber-900/50 text-amber-300 border-amber-700",
  standard: "bg-blue-900/50 text-blue-300 border-blue-700",
  infrastructure: "bg-gray-800/50 text-gray-300 border-gray-600",
  archive: "bg-gray-900/50 text-gray-500 border-gray-700",
  stub: "bg-gray-900/50 text-gray-500 border-gray-700",
};

const PROMO_COLORS: Record<string, string> = {
  GRADUATED: "bg-green-900/50 text-green-300 border-green-700",
  PUBLIC_PROCESS: "bg-blue-900/50 text-blue-300 border-blue-700",
  CANDIDATE: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  LOCAL: "bg-gray-800/50 text-gray-400 border-gray-600",
  ARCHIVED: "bg-gray-900/50 text-gray-500 border-gray-700",
};

export function StatusBadge({
  label,
  variant = "tier",
}: {
  label: string;
  variant?: "tier" | "promotion" | "ci";
}) {
  const colors =
    variant === "promotion"
      ? PROMO_COLORS[label] || PROMO_COLORS.LOCAL
      : variant === "ci"
        ? label
          ? "bg-green-900/50 text-green-300 border-green-700"
          : "bg-gray-800/50 text-gray-500 border-gray-600"
        : TIER_COLORS[label] || TIER_COLORS.standard;

  const displayLabel = variant === "ci" ? (label ? "CI" : "No CI") : label;

  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {displayLabel}
    </span>
  );
}
