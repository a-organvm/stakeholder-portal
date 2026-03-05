import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEnvelope } from "@/lib/ontology";
import { runIngestionCycle } from "@/lib/connectors/orchestrator";
import {
  registerConnector,
  resetConnectors,
  type ConnectorAdapter,
  type ConnectorConfig,
  type ConnectorState,
  type IngestRecord,
} from "@/lib/connectors/types";
import { resetDedup } from "@/lib/ingestion";
import { resetEntityRegistry } from "@/lib/entity-registry";
import { resetKnowledgeGraph } from "@/lib/graph";

const originalEnv = { ...process.env };

class InlineConnector implements ConnectorAdapter {
  readonly id = "inline-test";
  readonly name = "Inline Test";
  private state: ConnectorState = {
    status: "idle",
    last_run: null,
    records_ingested: 0,
    errors: 0,
    last_error: null,
  };

  configure(config: ConnectorConfig): void {
    // no-op for tests
    void config;
  }

  getState(): ConnectorState {
    return { ...this.state };
  }

  async sync(): Promise<IngestRecord[]> {
    return [
      {
        dedup_key: "inline:valid",
        entity_class: "repo",
        name: "inline-repo",
        description: "inline repo",
        attributes: {},
        envelope: createEnvelope({ source_id: "inline", source_type: "manual" }),
      },
      {
        dedup_key: "inline:invalid-rel",
        entity_class: "repo",
        name: "inline-repo-2",
        description: "invalid relation",
        attributes: {},
        envelope: createEnvelope({ source_id: "inline", source_type: "manual" }),
        relationships: [{ type: "depends_on", target_hint: "not-an-id" }],
      },
    ];
  }
}

describe("connector orchestrator", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    resetConnectors();
    resetDedup();
    resetEntityRegistry();
    resetKnowledgeGraph();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("runs sync + ingestion and emits dead letters for quarantined records", async () => {
    registerConnector(new InlineConnector());
    const report = await runIngestionCycle({
      connector_ids: ["inline-test"],
      persist_dead_letters: false,
    });

    expect(report.total_records_synced).toBe(2);
    expect(report.total_ingested).toBe(1);
    expect(report.total_quarantined).toBe(1);
    expect(report.dead_letters).toHaveLength(1);
    expect(report.dead_letters[0].stage).toBe("ingest");
  });

  it("skips connector when disabled by platform config", async () => {
    registerConnector(new InlineConnector());
    process.env.PLATFORM_CONFIG_JSON = JSON.stringify({
      connectors: {
        "inline-test": {
          id: "inline-test",
          enabled: false,
          incremental_interval_seconds: 60,
          max_records_per_sync: 100,
          allow_webhooks: false,
        },
      },
    });

    const report = await runIngestionCycle({
      connector_ids: ["inline-test"],
      persist_dead_letters: false,
    });

    expect(report.total_records_synced).toBe(0);
    expect(report.connector_summaries[0]?.status).toBe("skipped");
  });
});
