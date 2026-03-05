import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { runMaintenanceCycle, readRecentMaintenanceScorecards } from "@/lib/maintenance";
import {
  registerConnector,
  resetConnectors,
  type ConnectorAdapter,
  type ConnectorConfig,
  type ConnectorState,
  type IngestRecord,
} from "@/lib/connectors/types";
import { createEnvelope } from "@/lib/ontology";
import { resetDedup } from "@/lib/ingestion";
import { resetEntityRegistry } from "@/lib/entity-registry";
import { resetKnowledgeGraph } from "@/lib/graph";
import { resetFeedback } from "@/lib/feedback";
import { resetAuditLog } from "@/lib/security";
import { resetMetrics } from "@/lib/observability";

class InlineMaintenanceConnector implements ConnectorAdapter {
  readonly id = "inline-maint";
  readonly name = "Inline Maintenance";
  private state: ConnectorState = {
    status: "idle",
    last_run: null,
    records_ingested: 0,
    errors: 0,
    last_error: null,
  };

  configure(config: ConnectorConfig): void {
    void config;
  }

  getState(): ConnectorState {
    return { ...this.state };
  }

  async sync(): Promise<IngestRecord[]> {
    return [
      {
        dedup_key: "inline-maint:repo",
        entity_class: "repo",
        name: "inline-maint-repo",
        description: "inline repo",
        attributes: {},
        envelope: createEnvelope({ source_id: "inline-maint", source_type: "manual" }),
      },
    ];
  }
}

class SlowMaintenanceConnector implements ConnectorAdapter {
  readonly id = "slow-maint";
  readonly name = "Slow Maintenance";
  private state: ConnectorState = {
    status: "idle",
    last_run: null,
    records_ingested: 0,
    errors: 0,
    last_error: null,
  };
  static syncCalls = 0;

  configure(config: ConnectorConfig): void {
    void config;
  }

  getState(): ConnectorState {
    return { ...this.state };
  }

  async sync(): Promise<IngestRecord[]> {
    SlowMaintenanceConnector.syncCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return [
      {
        dedup_key: "slow-maint:repo",
        entity_class: "repo",
        name: "slow-maint-repo",
        description: "slow repo",
        attributes: {},
        envelope: createEnvelope({ source_id: "slow-maint", source_type: "manual" }),
      },
    ];
  }
}

describe("maintenance cycle", () => {
  const originalEnv = { ...process.env };
  let tmpDir = "";

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "maintenance-tests-"));
    process.env = {
      ...originalEnv,
      MAINTENANCE_SCORECARD_PATH: join(tmpDir, "scorecards.ndjson"),
    };
    resetConnectors();
    resetDedup();
    resetEntityRegistry();
    resetKnowledgeGraph();
    resetFeedback();
    resetAuditLog();
    resetMetrics();
    registerConnector(new InlineMaintenanceConnector());
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetConnectors();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("runs maintenance and persists scorecard", async () => {
    const scorecard = await runMaintenanceCycle({
      connector_ids: ["inline-maint"],
      incremental: true,
      run_retention: false,
      evaluation_samples: [
        {
          id: "m1",
          query: "How many repos?",
          response: "There are 103 repos [cite-1].",
          citations: [
            {
              id: "cite-1",
              source_name: "Manifest",
              source_type: "manifest",
              url: null,
              relevance: 1,
              confidence: 0.9,
              freshness: 0.9,
              freshness_label: "fresh",
              snippet: "Manifest",
              retrieved_at: "2026-03-05T00:00:00.000Z",
            },
          ],
          latency_ms: 200,
        },
      ],
      persist_scorecard: true,
    });

    expect(scorecard.ingestion.total_records_synced).toBe(1);
    expect(scorecard.evaluation?.summary.total).toBe(1);

    const recent = readRecentMaintenanceScorecards(5);
    expect(recent).toHaveLength(1);
    expect(recent[0].id).toBe(scorecard.id);
  });

  it("shares a single in-flight maintenance run across concurrent callers", async () => {
    resetConnectors();
    SlowMaintenanceConnector.syncCalls = 0;
    registerConnector(new SlowMaintenanceConnector());

    const [first, second] = await Promise.all([
      runMaintenanceCycle({
        connector_ids: ["slow-maint"],
        incremental: true,
        run_retention: false,
        persist_scorecard: false,
      }),
      runMaintenanceCycle({
        connector_ids: ["slow-maint"],
        incremental: true,
        run_retention: false,
        persist_scorecard: false,
      }),
    ]);

    expect(first.id).toBe(second.id);
    expect(SlowMaintenanceConnector.syncCalls).toBe(1);
  });
});
