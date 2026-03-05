/**
 * Connector ingestion orchestrator.
 *
 * Executes registered connectors, routes output through ingestion,
 * and persists dead-letter diagnostics for operator review.
 */

import { appendFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { ingestRecords } from "../ingestion";
import { incrementCounter, recordTiming, withTimingAsync } from "../observability";
import { getPlatformConfig } from "../platform-config";
import type { IngestRecord, ConnectorAdapter, ConnectorConfig } from "./types";
import { getConnector, listConnectors } from "./types";
import { ensureDefaultConnectorsRegistered } from "./index";

export interface DeadLetterEvent {
  connector_id: string;
  stage: "sync" | "ingest";
  reason: string;
  occurred_at: string;
  record: IngestRecord | null;
  errors?: Array<{ field: string; message: string }>;
}

export interface ConnectorRunSummary {
  connector_id: string;
  status: "completed" | "skipped" | "error";
  records_synced: number;
  ingested: number;
  deduplicated: number;
  quarantined: number;
  errors: number;
  last_error: string | null;
}

export interface IngestionCycleReport {
  started_at: string;
  completed_at: string;
  total_records_synced: number;
  total_ingested: number;
  total_deduplicated: number;
  total_quarantined: number;
  connector_summaries: ConnectorRunSummary[];
  dead_letters: DeadLetterEvent[];
}

export interface IngestionCycleOptions {
  incremental?: boolean;
  since?: string;
  connector_ids?: string[];
  persist_dead_letters?: boolean;
}

function getDeadLetterPath(): string {
  return process.env.INGEST_DEAD_LETTER_PATH
    ?? join(process.cwd(), ".codex", "telemetry", "ingest-dead-letter.ndjson");
}

function persistDeadLetters(events: DeadLetterEvent[]): void {
  if (events.length === 0) return;
  const path = getDeadLetterPath();
  try {
    mkdirSync(dirname(path), { recursive: true });
    for (const event of events) {
      appendFileSync(path, `${JSON.stringify(event)}\n`, "utf-8");
    }
  } catch {
    // Best effort by design.
  }
}

function buildConnectorConfig(adapter: ConnectorAdapter): ConnectorConfig {
  const platform = getPlatformConfig();
  const runtime = platform.connectors[adapter.id];
  return {
    id: adapter.id,
    name: adapter.name,
    enabled: runtime?.enabled ?? true,
    settings: runtime
      ? {
          incremental_interval_seconds: runtime.incremental_interval_seconds,
          max_records_per_sync: runtime.max_records_per_sync,
          allow_webhooks: runtime.allow_webhooks,
        }
      : {},
  };
}

function selectConnectors(connectorIds?: string[]): ConnectorAdapter[] {
  if (!connectorIds || connectorIds.length === 0) return listConnectors();
  return connectorIds
    .map((id) => getConnector(id))
    .filter((connector): connector is ConnectorAdapter => Boolean(connector));
}

export async function runIngestionCycle(
  options: IngestionCycleOptions = {}
): Promise<IngestionCycleReport> {
  ensureDefaultConnectorsRegistered();
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const cfg = getPlatformConfig();

  const summaries: ConnectorRunSummary[] = [];
  const deadLetters: DeadLetterEvent[] = [];

  let totalSynced = 0;
  let totalIngested = 0;
  let totalDeduplicated = 0;
  let totalQuarantined = 0;

  const connectors = selectConnectors(options.connector_ids);
  for (const connector of connectors) {
    const runtime = cfg.connectors[connector.id];
    if (runtime && !runtime.enabled) {
      summaries.push({
        connector_id: connector.id,
        status: "skipped",
        records_synced: 0,
        ingested: 0,
        deduplicated: 0,
        quarantined: 0,
        errors: 0,
        last_error: "Connector disabled by platform config",
      });
      incrementCounter("ingestion.connector_skipped_total", 1, { connector: connector.id });
      continue;
    }

    connector.configure(buildConnectorConfig(connector));
    try {
      const records = await withTimingAsync(
        "ingestion.connector_sync_ms",
        () =>
          connector.sync({
            incremental: options.incremental,
            since: options.since,
          }),
        { connector: connector.id }
      );
      const limitedRecords = runtime
        ? records.slice(0, runtime.max_records_per_sync)
        : records;

      totalSynced += limitedRecords.length;
      incrementCounter("ingestion.connector_records_total", limitedRecords.length, {
        connector: connector.id,
      });

      const pipeline = ingestRecords(limitedRecords);
      totalIngested += pipeline.ingested;
      totalDeduplicated += pipeline.deduplicated;
      totalQuarantined += pipeline.quarantined;

      if (pipeline.quarantine.length > 0) {
        for (const q of pipeline.quarantine) {
          deadLetters.push({
            connector_id: connector.id,
            stage: "ingest",
            reason: "Record quarantined during validation",
            occurred_at: q.quarantined_at,
            record: q.record,
            errors: q.errors.map((err) => ({
              field: err.field,
              message: err.message,
            })),
          });
        }
      }

      summaries.push({
        connector_id: connector.id,
        status: "completed",
        records_synced: limitedRecords.length,
        ingested: pipeline.ingested,
        deduplicated: pipeline.deduplicated,
        quarantined: pipeline.quarantined,
        errors: pipeline.errors.length,
        last_error: null,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      deadLetters.push({
        connector_id: connector.id,
        stage: "sync",
        reason,
        occurred_at: new Date().toISOString(),
        record: null,
      });
      summaries.push({
        connector_id: connector.id,
        status: "error",
        records_synced: 0,
        ingested: 0,
        deduplicated: 0,
        quarantined: 0,
        errors: 1,
        last_error: reason,
      });
      incrementCounter("ingestion.connector_error_total", 1, { connector: connector.id });
    }
  }

  if (options.persist_dead_letters !== false && deadLetters.length > 0) {
    persistDeadLetters(deadLetters);
  }

  const completedAt = new Date().toISOString();
  recordTiming("ingestion.cycle_duration_ms", Date.now() - startedMs);

  return {
    started_at: startedAt,
    completed_at: completedAt,
    total_records_synced: totalSynced,
    total_ingested: totalIngested,
    total_deduplicated: totalDeduplicated,
    total_quarantined: totalQuarantined,
    connector_summaries: summaries,
    dead_letters: deadLetters,
  };
}
