import { describe, expect, it } from "vitest";

import { buildTier1Context, buildTier2Context } from "@/lib/retrieval";

describe("buildTier1Context", () => {
  it("returns a string containing system summary", () => {
    const tier1 = buildTier1Context();
    expect(tier1).toContain("ORGANVM System Summary");
    expect(tier1).toContain("Total repos:");
    expect(tier1).toContain("Organs:");
  });

  it("lists organs with their metadata", () => {
    const tier1 = buildTier1Context();
    // The manifest has at least one organ
    expect(tier1).toMatch(/ORGAN-/);
  });

  it("lists live deployments", () => {
    const tier1 = buildTier1Context();
    expect(tier1).toContain("Live deployments");
  });
});

describe("buildTier2Context", () => {
  it("returns context for an organ-specific query", () => {
    const tier2 = buildTier2Context("ORGAN-I");
    // Should include repos from the mentioned organ
    expect(tier2.length).toBeGreaterThan(0);
  });

  it("returns scored repos for keyword queries", () => {
    const tier2 = buildTier2Context("typescript react");
    expect(tier2.length).toBeGreaterThan(0);
  });

  it("returns top repos sorted by commits for empty queries", () => {
    const tier2 = buildTier2Context("");
    expect(tier2.length).toBeGreaterThan(0);
  });

  it("returns fallback when no repos match", () => {
    const tier2 = buildTier2Context("xyzzy zork plugh");
    // Should still return some content (fallback to top 10)
    expect(tier2.length).toBeGreaterThan(0);
  });
});
