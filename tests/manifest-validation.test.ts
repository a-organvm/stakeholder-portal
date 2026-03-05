import { describe, expect, it } from "vitest";

import manifestData from "@/data/manifest.json";
import { parseManifest } from "@/validation/manifest";

describe("parseManifest", () => {
  it("accepts the bundled manifest snapshot", () => {
    const parsed = parseManifest(manifestData);
    expect(parsed.system.total_repos).toBeGreaterThan(0);
    expect(parsed.repos.length).toBeGreaterThan(0);
    expect(parsed.organs.length).toBeGreaterThan(0);
  });

  it("rejects non-array tech_stack values", () => {
    const badManifest = structuredClone(manifestData) as Record<string, unknown>;
    const repos = badManifest.repos as Array<Record<string, unknown>>;
    repos[0] = { ...repos[0], tech_stack: "python,typescript" };

    expect(() => parseManifest(badManifest)).toThrow(/tech_stack/);
  });

  it("rejects malformed dependency graph nodes", () => {
    const badManifest = structuredClone(manifestData) as Record<string, unknown>;
    const graph = badManifest.dependency_graph as Record<string, unknown>;
    graph.nodes = [{ id: 42, organ: "META-ORGANVM", tier: "standard" }];

    expect(() => parseManifest(badManifest)).toThrow(/dependency_graph\.nodes\[0\]\.id/);
  });
});
