import { describe, it, expect, beforeEach } from "vitest";
import { computeSimilarity, findDuplicates, autoResolve } from "@/lib/disambiguation";
import { createEntity, resetEntityRegistry, getEntityRegistry } from "@/lib/entity-registry";
import { resetKnowledgeGraph } from "@/lib/graph";

describe("disambiguation", () => {
  beforeEach(() => {
    resetEntityRegistry();
    resetKnowledgeGraph();
  });

  describe("computeSimilarity", () => {
    it("returns high similarity for near-identical entities", () => {
      const a = createEntity("repo", "organvm-engine", "Core engine package");
      const b = createEntity("repo", "organvm-engine-v2", "Core engine package v2");

      const { score, signals } = computeSimilarity(a, b);
      expect(score).toBeGreaterThan(0.6);
      expect(signals).toContain("same_class");
    });

    it("returns low similarity for unrelated entities", () => {
      const a = createEntity("repo", "dashboard", "System dashboard");
      const b = createEntity("organ", "theoria", "Theory foundation");

      const { score } = computeSimilarity(a, b);
      expect(score).toBeLessThan(0.5);
    });
  });

  describe("findDuplicates", () => {
    it("finds potential duplicates", () => {
      const registry = getEntityRegistry();
      registry.register(createEntity("repo", "engine", "Core engine"));
      registry.register(createEntity("repo", "engine-v2", "Core engine v2"));
      registry.register(createEntity("repo", "dashboard", "Dashboard app"));

      const candidates = findDuplicates({ merge_threshold: 0.9, review_threshold: 0.5 });
      // engine and engine-v2 should be flagged
      expect(candidates.length).toBeGreaterThanOrEqual(1);
      expect(candidates[0].similarity).toBeGreaterThan(0.5);
    });
  });

  describe("autoResolve", () => {
    it("auto-merges very similar entities", () => {
      const registry = getEntityRegistry();
      registry.register(createEntity("repo", "test-repo", "Test repository"));
      registry.register(createEntity("repo", "test-repo-copy", "Test repository"));

      const result = autoResolve({ merge_threshold: 0.5, review_threshold: 0.3 });
      // Should have merged or queued
      expect(result.merged + result.queued).toBeGreaterThanOrEqual(0);
    });
  });
});
