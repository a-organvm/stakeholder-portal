/**
 * Platform configuration registry.
 *
 * Centralizes runtime knobs for connector behavior, retention,
 * compliance posture, and query SLO expectations.
 */

export interface ConnectorRuntimeConfig {
  id: string;
  enabled: boolean;
  incremental_interval_seconds: number;
  max_records_per_sync: number;
  allow_webhooks: boolean;
}

export interface RetentionConfig {
  audit_days: number;
  feedback_days: number;
  telemetry_days: number;
}

export interface ComplianceConfig {
  pii_masking_enabled: boolean;
  pii_redact_logs: boolean;
  gdpr_enabled: boolean;
  hipaa_enabled: boolean;
  ccpa_enabled: boolean;
}

export interface QuerySloConfig {
  warm_cache_p95_ms: number;
  cold_path_p95_ms: number;
  webhook_freshness_seconds: number;
  scheduled_freshness_seconds: number;
}

export interface ObservabilityConfig {
  diagnostics_enabled: boolean;
  metric_window_size: number;
}

export interface PlatformConfig {
  connectors: Record<string, ConnectorRuntimeConfig>;
  retention: RetentionConfig;
  compliance: ComplianceConfig;
  query_slo: QuerySloConfig;
  observability: ObservabilityConfig;
}

const DEFAULT_CONNECTORS: Record<string, ConnectorRuntimeConfig> = {
  github: {
    id: "github",
    enabled: true,
    incremental_interval_seconds: 120,
    max_records_per_sync: 10_000,
    allow_webhooks: true,
  },
  workspace: {
    id: "workspace",
    enabled: true,
    incremental_interval_seconds: 300,
    max_records_per_sync: 20_000,
    allow_webhooks: false,
  },
  docs: {
    id: "docs",
    enabled: true,
    incremental_interval_seconds: 300,
    max_records_per_sync: 10_000,
    allow_webhooks: false,
  },
};

const DEFAULT_CONFIG: PlatformConfig = {
  connectors: DEFAULT_CONNECTORS,
  retention: {
    audit_days: 90,
    feedback_days: 180,
    telemetry_days: 30,
  },
  compliance: {
    pii_masking_enabled: true,
    pii_redact_logs: true,
    gdpr_enabled: true,
    hipaa_enabled: false,
    ccpa_enabled: true,
  },
  query_slo: {
    warm_cache_p95_ms: 2_000,
    cold_path_p95_ms: 6_000,
    webhook_freshness_seconds: 120,
    scheduled_freshness_seconds: 1_800,
  },
  observability: {
    diagnostics_enabled: false,
    metric_window_size: 5_000,
  },
};

function readInt(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBool(envKey: string, fallback: boolean): boolean {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getPlatformConfig(): PlatformConfig {
  const cfg = deepClone(DEFAULT_CONFIG);

  // Structured override for advanced scenarios.
  const jsonOverride = process.env.PLATFORM_CONFIG_JSON;
  if (jsonOverride) {
    try {
      const parsed = JSON.parse(jsonOverride) as Partial<PlatformConfig>;
      if (parsed.connectors) {
        cfg.connectors = { ...cfg.connectors, ...parsed.connectors };
      }
      if (parsed.retention) cfg.retention = { ...cfg.retention, ...parsed.retention };
      if (parsed.compliance) cfg.compliance = { ...cfg.compliance, ...parsed.compliance };
      if (parsed.query_slo) cfg.query_slo = { ...cfg.query_slo, ...parsed.query_slo };
      if (parsed.observability) {
        cfg.observability = { ...cfg.observability, ...parsed.observability };
      }
    } catch {
      // Ignore malformed JSON and keep deterministic defaults.
    }
  }

  cfg.retention.audit_days = readInt("RETENTION_AUDIT_DAYS", cfg.retention.audit_days);
  cfg.retention.feedback_days = readInt(
    "RETENTION_FEEDBACK_DAYS",
    cfg.retention.feedback_days
  );
  cfg.retention.telemetry_days = readInt(
    "RETENTION_TELEMETRY_DAYS",
    cfg.retention.telemetry_days
  );

  cfg.compliance.pii_masking_enabled = readBool(
    "PII_MASKING_ENABLED",
    cfg.compliance.pii_masking_enabled
  );
  cfg.compliance.pii_redact_logs = readBool(
    "PII_REDACT_LOGS",
    cfg.compliance.pii_redact_logs
  );
  cfg.compliance.gdpr_enabled = readBool("COMPLIANCE_GDPR", cfg.compliance.gdpr_enabled);
  cfg.compliance.hipaa_enabled = readBool("COMPLIANCE_HIPAA", cfg.compliance.hipaa_enabled);
  cfg.compliance.ccpa_enabled = readBool("COMPLIANCE_CCPA", cfg.compliance.ccpa_enabled);

  cfg.query_slo.warm_cache_p95_ms = readInt(
    "QUERY_WARM_P95_MS",
    cfg.query_slo.warm_cache_p95_ms
  );
  cfg.query_slo.cold_path_p95_ms = readInt(
    "QUERY_COLD_P95_MS",
    cfg.query_slo.cold_path_p95_ms
  );
  cfg.query_slo.webhook_freshness_seconds = readInt(
    "WEBHOOK_FRESHNESS_SECONDS",
    cfg.query_slo.webhook_freshness_seconds
  );
  cfg.query_slo.scheduled_freshness_seconds = readInt(
    "SCHEDULED_FRESHNESS_SECONDS",
    cfg.query_slo.scheduled_freshness_seconds
  );

  cfg.observability.diagnostics_enabled = readBool(
    "CHAT_DIAGNOSTICS_ENABLED",
    cfg.observability.diagnostics_enabled
  );
  cfg.observability.metric_window_size = readInt(
    "METRIC_WINDOW_SIZE",
    cfg.observability.metric_window_size
  );

  return cfg;
}

export function validatePlatformConfig(config: PlatformConfig): string[] {
  const errors: string[] = [];
  if (config.retention.audit_days < 1) errors.push("retention.audit_days must be >= 1");
  if (config.retention.feedback_days < 1) {
    errors.push("retention.feedback_days must be >= 1");
  }
  if (config.query_slo.warm_cache_p95_ms > config.query_slo.cold_path_p95_ms) {
    errors.push("query_slo.warm_cache_p95_ms must be <= query_slo.cold_path_p95_ms");
  }

  for (const connector of Object.values(config.connectors)) {
    if (!connector.id) errors.push("connector.id is required");
    if (connector.incremental_interval_seconds < 10) {
      errors.push(`connector ${connector.id} incremental interval must be >= 10s`);
    }
    if (connector.max_records_per_sync < 1) {
      errors.push(`connector ${connector.id} max_records_per_sync must be >= 1`);
    }
  }

  return errors;
}
