import { afterEach, describe, expect, it } from "vitest";
import { getPlatformConfig, validatePlatformConfig } from "@/lib/platform-config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("platform-config", () => {
  it("returns stable defaults", () => {
    const cfg = getPlatformConfig();
    expect(cfg.connectors.github.enabled).toBe(true);
    expect(cfg.retention.audit_days).toBeGreaterThan(0);
    expect(cfg.query_slo.cold_path_p95_ms).toBeGreaterThanOrEqual(cfg.query_slo.warm_cache_p95_ms);
  });

  it("supports env-based overrides", () => {
    process.env.RETENTION_AUDIT_DAYS = "30";
    process.env.CHAT_DIAGNOSTICS_ENABLED = "1";
    process.env.PLATFORM_CONFIG_JSON = JSON.stringify({
      connectors: {
        docs: {
          id: "docs",
          enabled: false,
          incremental_interval_seconds: 600,
          max_records_per_sync: 1000,
          allow_webhooks: false,
        },
      },
    });

    const cfg = getPlatformConfig();
    expect(cfg.retention.audit_days).toBe(30);
    expect(cfg.observability.diagnostics_enabled).toBe(true);
    expect(cfg.connectors.docs.enabled).toBe(false);
  });

  it("validates incompatible settings", () => {
    const cfg = getPlatformConfig();
    cfg.query_slo.warm_cache_p95_ms = 5000;
    cfg.query_slo.cold_path_p95_ms = 1000;
    const errors = validatePlatformConfig(cfg);
    expect(errors.some((err) => err.includes("warm_cache_p95_ms"))).toBe(true);
  });
});
