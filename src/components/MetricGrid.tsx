import { MetricCard } from "./MetricCard";

export function MetricGrid({
  metrics,
}: {
  metrics: { label: string; value: string | number }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} />
      ))}
    </div>
  );
}
