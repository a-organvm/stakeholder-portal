/**
 * Lightweight in-memory observability primitives.
 *
 * Tracks counters and latency samples for chat/retrieval/ingestion flows.
 */

import { getPlatformConfig } from "./platform-config";

type Tags = Record<string, string | number | boolean | null | undefined>;

export interface MetricCounter {
  name: string;
  value: number;
}

export interface MetricTiming {
  name: string;
  count: number;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  max_ms: number;
}

export interface MetricsSnapshot {
  counters: MetricCounter[];
  timings: MetricTiming[];
}

const counters = new Map<string, number>();
const timingSamples = new Map<string, number[]>();

function encodeKey(name: string, tags?: Tags): string {
  if (!tags || Object.keys(tags).length === 0) return name;
  const normalized = Object.entries(tags)
    .filter(([, value]) => value !== null && typeof value !== "undefined")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(",");
  return normalized ? `${name}{${normalized}}` : name;
}

function getPercentile(sorted: number[], quantile: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * quantile))
  );
  return sorted[idx];
}

function pushTimingSample(metricKey: string, valueMs: number): void {
  const cfg = getPlatformConfig();
  const windowSize = Math.max(50, cfg.observability.metric_window_size);
  const existing = timingSamples.get(metricKey) || [];
  existing.push(valueMs);
  if (existing.length > windowSize) {
    existing.splice(0, existing.length - windowSize);
  }
  timingSamples.set(metricKey, existing);
}

export function incrementCounter(name: string, delta = 1, tags?: Tags): void {
  if (!Number.isFinite(delta)) return;
  const key = encodeKey(name, tags);
  counters.set(key, (counters.get(key) || 0) + delta);
}

export function recordTiming(name: string, durationMs: number, tags?: Tags): void {
  if (!Number.isFinite(durationMs) || durationMs < 0) return;
  const key = encodeKey(name, tags);
  pushTimingSample(key, durationMs);
}

export function withTiming<T>(name: string, fn: () => T, tags?: Tags): T {
  const started = Date.now();
  try {
    return fn();
  } finally {
    recordTiming(name, Date.now() - started, tags);
  }
}

export async function withTimingAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Tags
): Promise<T> {
  const started = Date.now();
  try {
    return await fn();
  } finally {
    recordTiming(name, Date.now() - started, tags);
  }
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const counterEntries = [...counters.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const timings = [...timingSamples.entries()]
    .map(([name, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const sum = sorted.reduce((acc, n) => acc + n, 0);
      return {
        name,
        count: sorted.length,
        avg_ms: sorted.length > 0 ? sum / sorted.length : 0,
        p50_ms: getPercentile(sorted, 0.5),
        p95_ms: getPercentile(sorted, 0.95),
        max_ms: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    counters: counterEntries,
    timings,
  };
}

export function resetMetrics(): void {
  counters.clear();
  timingSamples.clear();
}
