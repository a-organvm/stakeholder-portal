import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEntity, getEntityRegistry, resetEntityRegistry } from "@/lib/entity-registry";
import { getKnowledgeGraph, resetKnowledgeGraph } from "@/lib/graph";
import { runInference } from "@/lib/inference";

function registerRepo(attributes: Record<string, unknown>): string {
  const repo = createEntity("repo", "health-test-repo", "health test repo", attributes);
  getEntityRegistry().register(repo);
  getKnowledgeGraph().addNode(repo);
  return repo.id;
}

describe("inference: project-health", () => {
  beforeEach(() => {
    resetEntityRegistry();
    resetKnowledgeGraph();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks recently active low-issue repos as robust", () => {
    const repoId = registerRepo({
      total_commits: 100,
      open_issues: 2,
      pushed_at: "2026-03-04T00:00:00.000Z",
    });

    runInference();

    const enriched = getKnowledgeGraph().getNode(repoId);
    expect(enriched).toBeDefined();
    expect(enriched?.attributes.health_label).toBe("robust");
    expect(Number(enriched?.attributes.health_score)).toBeCloseTo(1, 5);
  });

  it("does not penalize repos when pushed_at is invalid", () => {
    const repoId = registerRepo({
      pushed_at: "not-a-date",
    });

    runInference();

    const enriched = getKnowledgeGraph().getNode(repoId);
    expect(enriched).toBeDefined();
    expect(Number(enriched?.attributes.health_score)).toBeCloseTo(0.5, 5);
    expect(enriched?.attributes.health_label).toBe("active");
  });
});
