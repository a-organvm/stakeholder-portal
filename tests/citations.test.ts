import { describe, it, expect } from "vitest";
import {
  buildCitations,
  buildCitationInstructions,
  analyzeCitations,
  buildCitedResponse,
} from "@/lib/citations";
import type { RetrievalSource } from "@/lib/hybrid-retrieval";

function makeSource(overrides: Partial<RetrievalSource> = {}): RetrievalSource {
  return {
    id: "repo:test",
    type: "repo",
    name: "test-repo",
    display_name: "Test Repo",
    relevance: 0.8,
    freshness: 0.9,
    confidence: 0.85,
    snippet: "A test repository for unit testing",
    url: "/repos/test-repo",
    source_type: "manifest",
    retrieved_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildCitations", () => {
  it("converts retrieval sources to citations", () => {
    const sources = [makeSource(), makeSource({ id: "repo:other", name: "other" })];
    const citations = buildCitations(sources);

    expect(citations).toHaveLength(2);
    expect(citations[0].id).toBe("cite-1");
    expect(citations[1].id).toBe("cite-2");
    expect(citations[0].freshness_label).toBe("fresh");
  });

  it("filters out low-relevance sources", () => {
    const sources = [
      makeSource({ relevance: 0.05 }),
      makeSource({ id: "repo:good", relevance: 0.8 }),
    ];
    const citations = buildCitations(sources);
    expect(citations).toHaveLength(1);
  });

  it("labels freshness correctly", () => {
    const citations = buildCitations([
      makeSource({ freshness: 1.0 }),
      makeSource({ id: "r2", freshness: 0.85 }),
      makeSource({ id: "r3", freshness: 0.6 }),
      makeSource({ id: "r4", freshness: 0.35 }),
      makeSource({ id: "r5", freshness: 0.1 }),
    ]);

    expect(citations[0].freshness_label).toBe("live");
    expect(citations[1].freshness_label).toBe("fresh");
    expect(citations[2].freshness_label).toBe("recent");
    expect(citations[3].freshness_label).toBe("aged");
    expect(citations[4].freshness_label).toBe("stale");
  });
});

describe("buildCitationInstructions", () => {
  it("returns citation rules when sources exist", () => {
    const citations = buildCitations([makeSource()]);
    const instructions = buildCitationInstructions(citations);

    expect(instructions).toContain("CITATION REQUIREMENTS");
    expect(instructions).toContain("[cite-1]");
    expect(instructions).toContain("Test Repo");
  });

  it("returns fallback message when no sources", () => {
    const instructions = buildCitationInstructions([]);
    expect(instructions).toContain("static manifest snapshot");
  });
});

describe("analyzeCitations", () => {
  it("detects used citations", () => {
    const citations = buildCitations([makeSource(), makeSource({ id: "r2" })]);
    const text = "The system has 100 repos [cite-1]. The engine powers everything [cite-2].";

    const analysis = analyzeCitations(text, citations);
    expect(analysis.used_citations).toHaveLength(2);
    expect(analysis.coverage).toBeGreaterThan(0);
  });

  it("detects unsupported factual claims", () => {
    const citations = buildCitations([makeSource()]);
    const text = "There are 50 active repos. The system uses Python.";

    const analysis = analyzeCitations(text, citations);
    expect(analysis.unsupported_claims).toBe(true);
  });
});

describe("buildCitedResponse", () => {
  it("assembles complete cited response", () => {
    const sources = [makeSource()];
    const response = buildCitedResponse("Test response [cite-1].", sources);

    expect(response.text).toBe("Test response [cite-1].");
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.confidence_score).toBeGreaterThan(0);
  });
});
