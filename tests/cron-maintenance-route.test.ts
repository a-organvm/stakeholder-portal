import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { GET } from "@/app/api/cron/maintenance/route";
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

const originalEnv = { ...process.env };

class InlineCronConnector implements ConnectorAdapter {
  readonly id = "inline-cron";
  readonly name = "Inline Cron";
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
        dedup_key: "inline-cron:repo",
        entity_class: "repo",
        name: "inline-cron-repo",
        description: "cron repo",
        attributes: {},
        envelope: createEnvelope({ source_id: "inline-cron", source_type: "manual" }),
      },
    ];
  }
}

describe("cron maintenance route", () => {
  let tmpDir = "";

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "cron-maintenance-"));
    process.env = {
      ...originalEnv,
      CRON_SECRET: "cron-secret",
      CRON_CONNECTOR_IDS: "inline-cron",
      MAINTENANCE_SCORECARD_PATH: join(tmpDir, "scorecards.ndjson"),
    };
    resetConnectors();
    resetDedup();
    resetEntityRegistry();
    resetKnowledgeGraph();
    registerConnector(new InlineCronConnector());
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetConnectors();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects unauthorized cron triggers", async () => {
    const res = await GET(new Request("http://localhost/api/cron/maintenance"));
    expect(res.status).toBe(401);
  });

  it("runs maintenance when authorized", async () => {
    const res = await GET(
      new Request("http://localhost/api/cron/maintenance", {
        headers: {
          "x-cron-secret": "cron-secret",
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.scorecard_id).toBeTruthy();
  });
});
