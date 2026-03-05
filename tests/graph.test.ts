import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeGraph, getKnowledgeGraph, resetKnowledgeGraph } from "@/lib/graph";
import { createEntity } from "@/lib/entity-registry";
import { createEnvelope } from "@/lib/ontology";
import type { Relationship } from "@/lib/ontology";

function makeEdge(
  id: string,
  sourceId: string,
  targetId: string,
  type: Relationship["type"] = "depends_on"
): Relationship {
  return {
    id,
    type,
    source_id: sourceId,
    target_id: targetId,
    strength: 0.9,
    direction: "forward",
    evidence: ["test"],
    envelope: createEnvelope({ source_id: "test", source_type: "test" }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("KnowledgeGraph", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  it("adds and retrieves nodes", () => {
    const entity = createEntity("repo", "test-repo", "A test repo");
    graph.addNode(entity);

    expect(graph.hasNode(entity.id)).toBe(true);
    expect(graph.getNode(entity.id)).toBe(entity);
    expect(graph.nodeCount()).toBe(1);
  });

  it("adds and retrieves edges", () => {
    const a = createEntity("repo", "repo-a", "A");
    const b = createEntity("repo", "repo-b", "B");
    graph.addNode(a);
    graph.addNode(b);

    const edge = makeEdge("e1", a.id, b.id);
    graph.addEdge(edge);

    expect(graph.edgeCount()).toBe(1);
    expect(graph.getEdge("e1")).toBe(edge);
  });

  it("finds neighbors", () => {
    const a = createEntity("repo", "repo-a", "A");
    const b = createEntity("repo", "repo-b", "B");
    const c = createEntity("repo", "repo-c", "C");
    graph.addNode(a);
    graph.addNode(b);
    graph.addNode(c);
    graph.addEdge(makeEdge("e1", a.id, b.id));
    graph.addEdge(makeEdge("e2", a.id, c.id));

    const outgoing = graph.neighbors(a.id, "outgoing");
    expect(outgoing).toHaveLength(2);

    const incoming = graph.neighbors(b.id, "incoming");
    expect(incoming).toHaveLength(1);
    expect(incoming[0].entity.id).toBe(a.id);
  });

  it("traverses BFS up to maxDepth", () => {
    const a = createEntity("repo", "a", "A");
    const b = createEntity("repo", "b", "B");
    const c = createEntity("repo", "c", "C");
    const d = createEntity("repo", "d", "D");
    graph.addNode(a);
    graph.addNode(b);
    graph.addNode(c);
    graph.addNode(d);
    graph.addEdge(makeEdge("e1", a.id, b.id));
    graph.addEdge(makeEdge("e2", b.id, c.id));
    graph.addEdge(makeEdge("e3", c.id, d.id));

    const depth1 = graph.traverse(a.id, 1);
    expect(depth1).toHaveLength(1);

    const depth3 = graph.traverse(a.id, 3);
    expect(depth3).toHaveLength(3);
  });

  it("finds shortest path", () => {
    const a = createEntity("repo", "a", "A");
    const b = createEntity("repo", "b", "B");
    const c = createEntity("repo", "c", "C");
    graph.addNode(a);
    graph.addNode(b);
    graph.addNode(c);
    graph.addEdge(makeEdge("e1", a.id, b.id));
    graph.addEdge(makeEdge("e2", b.id, c.id));

    const path = graph.shortestPath(a.id, c.id);
    expect(path).toEqual([a.id, b.id, c.id]);
  });

  it("returns null for unreachable path", () => {
    const a = createEntity("repo", "a", "A");
    const b = createEntity("repo", "b", "B");
    graph.addNode(a);
    graph.addNode(b);
    // No edge between them

    expect(graph.shortestPath(a.id, b.id)).toBeNull();
  });

  it("extracts subgraph", () => {
    const a = createEntity("repo", "a", "A");
    const b = createEntity("repo", "b", "B");
    const c = createEntity("repo", "c", "C");
    graph.addNode(a);
    graph.addNode(b);
    graph.addNode(c);
    graph.addEdge(makeEdge("e1", a.id, b.id));
    graph.addEdge(makeEdge("e2", b.id, c.id));

    const sub = graph.subgraph(a.id, 2);
    expect(sub.nodes).toHaveLength(3);
    expect(sub.edges.length).toBeGreaterThanOrEqual(2);
  });

  it("computes stats", () => {
    graph.addNode(createEntity("repo", "a", "A"));
    graph.addNode(createEntity("organ", "i", "I"));
    graph.addEdge(makeEdge("e1", "repo:a", "organ:i", "belongs_to"));

    const stats = graph.stats();
    expect(stats.nodes).toBe(2);
    expect(stats.edges).toBe(1);
    expect(stats.nodesByClass.repo).toBe(1);
    expect(stats.nodesByClass.organ).toBe(1);
    expect(stats.edgesByType.belongs_to).toBe(1);
  });

  it("removes nodes and connected edges", () => {
    const a = createEntity("repo", "a", "A");
    const b = createEntity("repo", "b", "B");
    graph.addNode(a);
    graph.addNode(b);
    graph.addEdge(makeEdge("e1", a.id, b.id));

    graph.removeNode(a.id);
    expect(graph.nodeCount()).toBe(1);
    expect(graph.edgeCount()).toBe(0);
  });
});

describe("graph singleton", () => {
  beforeEach(() => resetKnowledgeGraph());

  it("returns same instance", () => {
    const a = getKnowledgeGraph();
    const b = getKnowledgeGraph();
    expect(a).toBe(b);
  });
});
