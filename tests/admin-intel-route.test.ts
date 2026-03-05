import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { GET, POST } from "@/app/api/admin/intel/route";
import { incrementCounter, resetMetrics } from "@/lib/observability";
import { resetFeedback, submitFeedback } from "@/lib/feedback";
import { resetAuditLog } from "@/lib/security";
import { resetDedup } from "@/lib/ingestion";
import { resetEntityRegistry } from "@/lib/entity-registry";
import { resetKnowledgeGraph } from "@/lib/graph";
import {
  registerConnector,
  resetConnectors,
  type ConnectorAdapter,
  type ConnectorConfig,
  type ConnectorState,
  type IngestRecord,
} from "@/lib/connectors/types";
import { createEnvelope } from "@/lib/ontology";
import {
  ADMIN_CSRF_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  createAdminCsrfToken,
  createAdminSessionToken,
} from "@/lib/admin-auth";

// In-memory scorecard store shared between mock runMaintenanceCycle and readRecentMaintenanceScorecards
const scorecardsStore: unknown[] = [];

vi.mock("@/lib/maintenance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/maintenance")>("@/lib/maintenance");
  return {
    ...actual,
    getMaintenanceRunState: async () => ({ running: false, scorecard_id: null, started_at: null }),
    runMaintenanceCycle: async (opts?: Parameters<typeof actual.runMaintenanceCycle>[0]) => {
      const sc = await actual.runMaintenanceCycle({ ...opts, persist_scorecard: false });
      scorecardsStore.push(sc);
      return sc;
    },
    readRecentMaintenanceScorecards: async (limit = 20) =>
      [...scorecardsStore].reverse().slice(0, limit) as Awaited<ReturnType<typeof actual.readRecentMaintenanceScorecards>>,
  };
});


const originalEnv = { ...process.env };

class InlineAdminConnector implements ConnectorAdapter {
  readonly id = "inline-admin";
  readonly name = "Inline Admin Connector";
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
        dedup_key: "inline-admin:repo-1",
        entity_class: "repo",
        name: "inline-admin-repo",
        description: "inline repo",
        attributes: {},
        envelope: createEnvelope({ source_id: "inline-admin", source_type: "manual" }),
      },
    ];
  }
}

function makeHeaders(
  role: "public" | "stakeholder" | "contributor" | "admin" = "admin",
  token = "topsecret" // allow-secret
): HeadersInit {
  return {
    "content-type": "application/json",
    "x-admin-token": token,
    "x-portal-role": role,
  };
}

describe("admin intel route", () => {
  let tmpDir = "";

  beforeEach(() => {
    scorecardsStore.length = 0;
    tmpDir = mkdtempSync(join(tmpdir(), "admin-intel-route-"));

    process.env = {
      ...originalEnv,
      ADMIN_API_TOKEN: "topsecret",
      ADMIN_SESSION_SECRET: "session-secret",
      ADMIN_LOGIN_PASSWORD: "topsecret",
      MAINTENANCE_SCORECARD_PATH: join(tmpDir, "scorecards.ndjson"),
    };
    resetMetrics();
    resetFeedback();
    resetAuditLog();
    resetDedup();
    resetEntityRegistry();
    resetKnowledgeGraph();
    resetConnectors();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects requests with invalid admin token", async () => {
    const res = await GET(
      new Request("http://localhost/api/admin/intel?op=metrics", {
        headers: makeHeaders("admin", "wrong"),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns metrics snapshot when authorized", async () => {
    incrementCounter("chat.requests_total", 3);
    const res = await GET(
      new Request("http://localhost/api/admin/intel?op=metrics", {
        headers: makeHeaders("stakeholder"),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(
      body.metrics.counters.some(
        (c: { name: string; value: number }) =>
          c.name === "chat.requests_total" && c.value === 3
      )
    ).toBe(true);
    expect(body.feedback.total).toBe(0);
  });

  it("accepts authenticated session cookie without x-admin-token", async () => {
    incrementCounter("chat.requests_total", 1);
    const sessionToken = createAdminSessionToken("admin", "session-user", 3600);
    expect(sessionToken).toBeTruthy();
    const res = await GET(
      new Request("http://localhost/api/admin/intel?op=metrics", {
        headers: {
          cookie: `${ADMIN_SESSION_COOKIE_NAME}=${sessionToken || ""}`,
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metrics.counters.length).toBeGreaterThan(0);
  });

  it("requires CSRF header for session-authenticated write actions", async () => {
    registerConnector(new InlineAdminConnector());
    const sessionToken = createAdminSessionToken("admin", "session-user", 3600);
    const csrfToken = createAdminCsrfToken();
    expect(sessionToken).toBeTruthy();

    const noCsrfRes = await POST(
      new Request("http://localhost/api/admin/intel", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${ADMIN_SESSION_COOKIE_NAME}=${sessionToken || ""}; ${ADMIN_CSRF_COOKIE_NAME}=${csrfToken}`,
        },
        body: JSON.stringify({
          action: "run_ingestion_cycle",
          connector_ids: ["inline-admin"],
        }),
      })
    );
    expect(noCsrfRes.status).toBe(403);

    const withCsrfRes = await POST(
      new Request("http://localhost/api/admin/intel", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-csrf": csrfToken,
          cookie: `${ADMIN_SESSION_COOKIE_NAME}=${sessionToken || ""}; ${ADMIN_CSRF_COOKIE_NAME}=${csrfToken}`,
        },
        body: JSON.stringify({
          action: "run_ingestion_cycle",
          connector_ids: ["inline-admin"],
        }),
      })
    );
    expect(withCsrfRes.status).toBe(200);
    const body = await withCsrfRes.json();
    expect(body.report.total_ingested).toBe(1);
  });

  it("runs ingestion cycle through admin action", async () => {
    registerConnector(new InlineAdminConnector());
    const res = await POST(
      new Request("http://localhost/api/admin/intel", {
        method: "POST",
        headers: makeHeaders("contributor"),
        body: JSON.stringify({
          action: "run_ingestion_cycle",
          connector_ids: ["inline-admin"],
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report.total_records_synced).toBe(1);
    expect(body.report.total_ingested).toBe(1);
  });

  it("supports subject export and enforces delete privilege", async () => {
    submitFeedback("q", "r", "correct", null, [], "client-x");

    const exportRes = await POST(
      new Request("http://localhost/api/admin/intel", {
        method: "POST",
        headers: makeHeaders("stakeholder"),
        body: JSON.stringify({
          action: "export_subject_data",
          client_id: "client-x",
        }),
      })
    );
    expect(exportRes.status).toBe(200);
    const exported = await exportRes.json();
    expect(exported.result.feedback_entries).toHaveLength(1);

    const deniedDeleteRes = await POST(
      new Request("http://localhost/api/admin/intel", {
        method: "POST",
        headers: makeHeaders("stakeholder"),
        body: JSON.stringify({
          action: "delete_subject_data",
          client_id: "client-x",
        }),
      })
    );
    expect(deniedDeleteRes.status).toBe(403);

    const adminDeleteRes = await POST(
      new Request("http://localhost/api/admin/intel", {
        method: "POST",
        headers: makeHeaders("admin"),
        body: JSON.stringify({
          action: "delete_subject_data",
          client_id: "client-x",
        }),
      })
    );
    expect(adminDeleteRes.status).toBe(200);
    const deleted = await adminDeleteRes.json();
    expect(deleted.result.deleted_feedback_entries).toBe(1);
  });

  it("runs evaluation action with provided samples", async () => {
    const res = await POST(
      new Request("http://localhost/api/admin/intel", {
        method: "POST",
        headers: makeHeaders("admin"),
        body: JSON.stringify({
          action: "run_eval",
          samples: [
            {
              id: "s1",
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
                  freshness: 0.8,
                  freshness_label: "fresh",
                  snippet: "manifest",
                  retrieved_at: "2026-03-05T00:00:00.000Z",
                },
              ],
              latency_ms: 250,
            },
          ],
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report.summary.total).toBe(1);
  });

  it("runs maintenance cycle and exposes scorecards + health", async () => {
    registerConnector(new InlineAdminConnector());

    const runRes = await POST(
      new Request("http://localhost/api/admin/intel", {
        method: "POST",
        headers: makeHeaders("admin"),
        body: JSON.stringify({
          action: "run_maintenance_cycle",
          connector_ids: ["inline-admin"],
          incremental: true,
          run_retention: false,
        }),
      })
    );
    expect(runRes.status).toBe(200);
    const runBody = await runRes.json();
    expect(runBody.scorecard.ingestion.total_records_synced).toBe(1);

    const scorecardsRes = await GET(
      new Request("http://localhost/api/admin/intel?op=scorecards&limit=5", {
        headers: makeHeaders("stakeholder"),
      })
    );
    expect(scorecardsRes.status).toBe(200);
    const scorecardsBody = await scorecardsRes.json();
    expect(scorecardsBody.scorecards.length).toBeGreaterThan(0);

    const healthRes = await GET(
      new Request("http://localhost/api/admin/intel?op=health", {
        headers: makeHeaders("stakeholder"),
      })
    );
    expect(healthRes.status).toBe(200);
    const healthBody = await healthRes.json();
    expect(["healthy", "degraded", "critical"]).toContain(healthBody.status);
  });
});
