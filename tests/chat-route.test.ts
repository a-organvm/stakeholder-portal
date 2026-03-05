import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/retrieval", () => ({
  buildTier1Context: () => "tier1",
  buildTier2Context: () => "tier2",
}));

const fetchMock = vi.fn();

async function loadPostHandler() {
  vi.resetModules();
  const mod = await import("@/app/api/chat/route");
  return mod.POST;
}

function makeRequest(ip: string, payload: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_MODEL;
  delete process.env.GROQ_API_URL;
  delete process.env.OSS_LLM_API_KEY;
  delete process.env.OSS_LLM_MODEL;
  delete process.env.OSS_LLM_API_URL;
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/chat", () => {
  it("returns 400 for invalid JSON payload", async () => {
    const POST = await loadPostHandler();
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: "{invalid",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON payload" });
  });

  it("returns 400 when no valid messages are provided", async () => {
    const POST = await loadPostHandler();
    const res = await POST(makeRequest("10.0.0.2", { messages: [{ role: "system", content: 5 }] }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "No messages provided" });
  });

  it("enforces rate limiting per client IP", async () => {
    const POST = await loadPostHandler();
    const payload = { messages: [{ role: "user", content: "hello" }] };
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { role: "assistant", content: "ok" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    for (let i = 0; i < 10; i += 1) {
      const res = await POST(makeRequest("10.0.0.3", payload));
      expect(res.status).toBe(200);
    }

    const limited = await POST(makeRequest("10.0.0.3", payload));
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "Rate limited. Try again in a minute." });
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });

  it("forwards only the last 10 messages and truncates oversized content for OSS provider", async () => {
    process.env.GROQ_API_KEY = "gsk_test";
    const POST = await loadPostHandler();
    const longContent = "x".repeat(5000);
    const messages = Array.from({ length: 14 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `${i}:${longContent}`,
    }));
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { role: "assistant", content: "ok" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const res = await POST(makeRequest("10.0.0.4", { messages }));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [providerUrl, providerInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(providerUrl).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(providerInit.headers).toEqual(
      expect.objectContaining({
        Authorization: "Bearer gsk_test",
      })
    );
    const payload = JSON.parse(String(providerInit.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };

    expect(payload.model).toBe("llama-3.3-70b-versatile");
    expect(payload.messages).toHaveLength(11); // system prompt + last 10 chat messages
    for (const forwarded of payload.messages.slice(1)) {
      expect(forwarded.content.length).toBe(4000);
    }
  });

  it("uses anonymous OSS fallback provider when GROQ_API_KEY is not set", async () => {
    const POST = await loadPostHandler();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { role: "assistant", content: "ok" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const res = await POST(makeRequest("10.0.0.9", { messages: [{ role: "user", content: "hello" }] }));
    expect(res.status).toBe(200);
    const [providerUrl, providerInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(providerUrl).toBe("https://text.pollinations.ai/openai");
    expect(providerInit.headers).not.toEqual(
      expect.objectContaining({
        Authorization: expect.any(String),
      })
    );
  });

  it("returns offline snapshot response when OSS provider fails", async () => {
    fetchMock.mockResolvedValue(new Response("provider unavailable", { status: 503 }));
    const POST = await loadPostHandler();
    const res = await POST(
      makeRequest("10.0.0.5", {
        messages: [{ role: "user", content: "Give me a broad narrative summary of governance constraints." }],
      })
    );

    expect(res.status).toBe(200);

    const body = await res.text();
    expect(body).toContain("ORGANVM Snapshot Response");
    expect(body).toContain("live OSS model path is currently unavailable");
    expect(body).toContain("Primary provider: `GROQ_API_KEY`");
    expect(body).toContain("data: [DONE]");
  });

  it("returns deterministic sprint answer without calling provider", async () => {
    const POST = await loadPostHandler();
    const res = await POST(
      makeRequest("10.0.0.6", { messages: [{ role: "user", content: "What happened in the last sprint?" }] })
    );

    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    const body = await res.text();
    expect(body).toContain("Last Sprint Status");
    expect(body).toContain("completed sprints");
  });

  it("returns deterministic tech stack fallback when repo is unknown", async () => {
    const POST = await loadPostHandler();
    const res = await POST(
      makeRequest("10.0.0.7", { messages: [{ role: "user", content: "What's the tech stack for Styx?" }] })
    );

    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    const body = await res.text();
    expect(body).toContain("I could not find a repository named **Styx**");
    expect(body).toContain("repo snapshot");
  });
});
