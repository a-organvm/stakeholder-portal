import { describe, expect, it, beforeEach } from "vitest";
import {
  getMetricsSnapshot,
  incrementCounter,
  recordTiming,
  resetMetrics,
  withTiming,
  withTimingAsync,
} from "@/lib/observability";

describe("observability", () => {
  beforeEach(() => resetMetrics());

  it("records counters with tags", () => {
    incrementCounter("chat.requests_total");
    incrementCounter("chat.requests_total");
    incrementCounter("chat.path_total", 1, { path: "deterministic" });

    const snapshot = getMetricsSnapshot();
    const requests = snapshot.counters.find((c) => c.name === "chat.requests_total");
    const path = snapshot.counters.find((c) => c.name.includes("path=deterministic"));

    expect(requests?.value).toBe(2);
    expect(path?.value).toBe(1);
  });

  it("computes timing distribution", () => {
    recordTiming("chat.request_duration_ms", 120);
    recordTiming("chat.request_duration_ms", 200);
    recordTiming("chat.request_duration_ms", 80);

    const snapshot = getMetricsSnapshot();
    const timing = snapshot.timings.find((t) => t.name === "chat.request_duration_ms");
    expect(timing?.count).toBe(3);
    expect((timing?.p95_ms || 0)).toBeGreaterThan(0);
  });

  it("wraps sync and async timings", async () => {
    withTiming("sync.operation", () => {
      for (let i = 0; i < 1000; i += 1) {
        // intentional no-op loop
      }
    });

    await withTimingAsync("async.operation", async () => {
      await Promise.resolve();
    });

    const snapshot = getMetricsSnapshot();
    expect(snapshot.timings.some((t) => t.name === "sync.operation")).toBe(true);
    expect(snapshot.timings.some((t) => t.name === "async.operation")).toBe(true);
  });
});
