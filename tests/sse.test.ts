import { describe, expect, it } from "vitest";

import { parseSseChunk } from "@/lib/sse";

describe("parseSseChunk", () => {
  it("handles payloads split across chunks", () => {
    const first = parseSseChunk("", 'data: {"text":"hel');
    expect(first.payloads).toEqual([]);
    expect(first.done).toBe(false);
    expect(first.remainder).toBe('data: {"text":"hel');

    const second = parseSseChunk(first.remainder, 'lo"}\n\n');
    expect(second.payloads).toEqual(['{"text":"hello"}']);
    expect(second.done).toBe(false);
    expect(second.remainder).toBe("");
  });

  it("ignores non-data lines and keeps incomplete tail lines", () => {
    const parsed = parseSseChunk("", "event: ping\ndata: {\"text\":\"a\"}\nfoo");
    expect(parsed.payloads).toEqual(['{"text":"a"}']);
    expect(parsed.done).toBe(false);
    expect(parsed.remainder).toBe("foo");
  });

  it("stops parsing after done sentinel", () => {
    const parsed = parseSseChunk(
      "",
      'data: {"text":"before"}\ndata: [DONE]\ndata: {"text":"after"}\n'
    );
    expect(parsed.payloads).toEqual(['{"text":"before"}']);
    expect(parsed.done).toBe(true);
  });
});
