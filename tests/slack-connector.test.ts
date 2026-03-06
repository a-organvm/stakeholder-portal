import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Override the global DB mock for Slack connector tests, which need
// insert().values().onConflictDoUpdate() chaining to resolve properly.
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => [],
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => Promise.resolve(),
        onConflictDoNothing: () => Promise.resolve(),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    execute: () => Promise.resolve({ rows: [] }),
  },
}));

import { SlackConnector } from "@/lib/connectors/slack";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  delete process.env.SLACK_BOT_TOKEN;
  delete process.env.SLACK_CHANNEL_IDS;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SlackConnector", () => {
  it("exposes correct id and name", () => {
    const connector = new SlackConnector();
    expect(connector.id).toBe("slack");
    expect(connector.name).toBe("Slack");
  });

  it("initializes with idle state", () => {
    const connector = new SlackConnector();
    const state = connector.getState();
    expect(state.status).toBe("idle");
    expect(state.last_run).toBeNull();
    expect(state.records_ingested).toBe(0);
    expect(state.errors).toBe(0);
    expect(state.last_error).toBeNull();
  });

  it("returns empty array when no token is configured", async () => {
    const connector = new SlackConnector();
    connector.configure({
      id: "slack",
      name: "Slack",
      enabled: true,
      settings: {},
    });

    const records = await connector.sync();
    expect(records).toEqual([]);
    expect(connector.getState().status).toBe("error");
    expect(connector.getState().last_error).toContain("SLACK_BOT_TOKEN");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty array when no channels are configured", async () => {
    const connector = new SlackConnector();
    connector.configure({
      id: "slack",
      name: "Slack",
      enabled: true,
      settings: { slack_bot_token: "xoxb-test" },
    });

    const records = await connector.sync();
    expect(records).toEqual([]);
    expect(connector.getState().status).toBe("completed");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches messages and produces IngestRecord objects", async () => {
    const connector = new SlackConnector();
    connector.configure({
      id: "slack",
      name: "Slack",
      enabled: true,
      settings: {
        slack_bot_token: "xoxb-test",
        slack_channel_ids: ["C12345"],
      },
    });

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          messages: [
            {
              ts: "1709251200.000001",
              user: "U123",
              text: "Hello from Slack integration test!",
            },
            {
              ts: "1709251200.000002",
              user: "U456",
              text: "Another message here",
            },
            {
              ts: "1709251200.000003",
              subtype: "channel_join",
              text: "joined #channel",
            },
          ],
          has_more: false,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const records = await connector.sync();

    // "channel_join" subtype should be filtered out
    expect(records.length).toBe(2);
    expect(records[0].dedup_key).toContain("slack:message:C12345:");
    expect(records[0].entity_class).toBe("artifact");
    expect(records[0].envelope.source_type).toBe("slack");
    expect(records[0].attributes).toMatchObject({
      artifact_type: "slack_message",
      channel_id: "C12345",
      author: "U123",
    });
    expect(connector.getState().status).toBe("completed");
    expect(connector.getState().records_ingested).toBe(2);
  });

  it("updates state on API error", async () => {
    const connector = new SlackConnector();
    connector.configure({
      id: "slack",
      name: "Slack",
      enabled: true,
      settings: {
        slack_bot_token: "xoxb-test",
        slack_channel_ids: ["C12345"],
      },
    });

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ ok: false, error: "channel_not_found" }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const records = await connector.sync();
    expect(records).toEqual([]);
    expect(connector.getState().errors).toBe(1);
    expect(connector.getState().last_error).toContain("channel_not_found");
  });

  it("reads token from environment variable", async () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-env-token";
    process.env.SLACK_CHANNEL_IDS = "C99999";

    const connector = new SlackConnector();
    connector.configure({
      id: "slack",
      name: "Slack",
      enabled: true,
      settings: {},
    });

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, messages: [], has_more: false }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    await connector.sync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("conversations.history");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer xoxb-env-token");
  });

  it("skips messages without text", async () => {
    const connector = new SlackConnector();
    connector.configure({
      id: "slack",
      name: "Slack",
      enabled: true,
      settings: {
        slack_bot_token: "xoxb-test",
        slack_channel_ids: ["C12345"],
      },
    });

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          messages: [
            { ts: "1.0", user: "U1", text: "" },
            { ts: "2.0", user: "U2", text: "Has content" },
            { ts: "3.0", user: "U3" },
          ],
          has_more: false,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const records = await connector.sync();
    expect(records.length).toBe(1);
    expect(records[0].description).toBe("Has content");
  });
});
