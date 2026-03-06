import { describe, it, expect } from "vitest";
import { planQuery } from "@/lib/query-planner";

describe("query planner", () => {
  it("classifies 'what is organvm' as deterministic", () => {
    const plan = planQuery("What is ORGANVM?");
    expect(plan.strategy).toBe("deterministic");
    expect(plan.estimated_cost).toBeLessThanOrEqual(2);
  });

  it("classifies 'last sprint' as deterministic", () => {
    const plan = planQuery("What happened in the last sprint?");
    expect(plan.strategy).toBe("deterministic");
  });

  it("classifies organ-specific queries as organ_scope", () => {
    const plan = planQuery("Tell me about Organ I theoria");
    expect(plan.strategy).toBe("organ_scope");
    expect(plan.target_organs).toContain("ORGAN-I");
  });

  it("classifies dependency queries as graph_traversal", () => {
    const plan = planQuery("What depends on organvm-engine?");
    expect(plan.strategy).toBe("graph_traversal");
  });

  it("classifies generic queries as exploratory", () => {
    const plan = planQuery("How is the project going overall?");
    expect(plan.strategy).toBe("exploratory");
  });

  it("detects multiple organs for cross_organ", () => {
    const plan = planQuery("Compare Organ I Theoria and Organ III Ergon");
    expect(plan.strategy).toBe("cross_organ");
    expect(plan.target_organs.length).toBeGreaterThanOrEqual(2);
  });

  it("marks potentially unanswerable queries", () => {
    const plan = planQuery("What is the competitor market share?");
    expect(plan.answerability).toBe("partial");
    expect(plan.suggested_followups.length).toBeGreaterThan(0);
  });

  it("decomposes compound queries", () => {
    const plan = planQuery("Show me flagship repos and also the deployment URLs");
    expect(plan.sub_queries.length).toBeGreaterThanOrEqual(2);
  });

  it("estimates higher cost for complex strategies", () => {
    const simple = planQuery("What is ORGANVM?");
    const complex = planQuery("Compare all organs and their dependencies");
    expect(complex.estimated_cost).toBeGreaterThan(simple.estimated_cost);
  });

  it("sets suggested_max_tokens based on strategy", () => {
    const deterministic = planQuery("Flagship repos");
    const exploratory = planQuery("Give me a broad overview of everything");
    expect(deterministic.suggested_max_tokens).toBeLessThan(exploratory.suggested_max_tokens);
  });

  it("classifies external recency queries as live_research", () => {
    const plan = planQuery("Give me the latest competitor news about this project");
    expect(plan.strategy).toBe("live_research");
    expect(plan.estimated_cost).toBeGreaterThanOrEqual(9);
    expect(plan.suggested_followups.some((s) => s.includes("scope"))).toBe(true);
  });

  it("does not classify normal internal queries with 'current' or 'latest' as live_research", () => {
    const plan = planQuery("What is the current status of organvm-engine?");
    expect(plan.strategy).not.toBe("live_research");
  });
});
