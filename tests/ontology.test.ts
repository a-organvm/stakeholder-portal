import { describe, it, expect } from "vitest";
import {
  ONTOLOGY_VERSION,
  ENTITY_CLASSES,
  RELATIONSHIP_TYPES,
  makeEntityId,
  parseEntityId,
  validateRelationship,
  createEnvelope,
} from "@/lib/ontology";

describe("ontology", () => {
  it("exports a valid version string", () => {
    expect(ONTOLOGY_VERSION).toBe("1.0.0");
  });

  it("defines 10 entity classes", () => {
    expect(ENTITY_CLASSES).toHaveLength(10);
    expect(ENTITY_CLASSES).toContain("organ");
    expect(ENTITY_CLASSES).toContain("repo");
    expect(ENTITY_CLASSES).toContain("artifact");
    expect(ENTITY_CLASSES).toContain("deployment");
    expect(ENTITY_CLASSES).toContain("issue");
    expect(ENTITY_CLASSES).toContain("conversation");
  });

  it("defines 15 relationship types", () => {
    expect(RELATIONSHIP_TYPES).toHaveLength(15);
    expect(RELATIONSHIP_TYPES).toContain("belongs_to");
    expect(RELATIONSHIP_TYPES).toContain("depends_on");
    expect(RELATIONSHIP_TYPES).toContain("deploys_to");
  });

  describe("makeEntityId", () => {
    it("creates deterministic IDs", () => {
      expect(makeEntityId("repo", "organvm-engine")).toBe("repo:organvm-engine");
      expect(makeEntityId("organ", "ORGAN-I")).toBe("organ:organ-i");
    });

    it("normalizes special characters", () => {
      expect(makeEntityId("repo", "My  Special--Repo!")).toBe("repo:my-special-repo");
    });
  });

  describe("parseEntityId", () => {
    it("parses valid entity IDs", () => {
      const result = parseEntityId("repo:organvm-engine");
      expect(result).toEqual({ entityClass: "repo", slug: "organvm-engine" });
    });

    it("returns null for invalid IDs", () => {
      expect(parseEntityId("invalid")).toBeNull();
      expect(parseEntityId("unknown:test")).toBeNull();
    });
  });

  describe("validateRelationship", () => {
    it("accepts valid relationships", () => {
      expect(validateRelationship("belongs_to", "repo", "organ")).toEqual({ valid: true });
      expect(validateRelationship("depends_on", "repo", "repo")).toEqual({ valid: true });
      expect(validateRelationship("deploys_to", "repo", "deployment")).toEqual({ valid: true });
    });

    it("rejects invalid source classes", () => {
      const result = validateRelationship("belongs_to", "organ", "organ");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("source must be repo");
    });

    it("rejects invalid target classes", () => {
      const result = validateRelationship("belongs_to", "repo", "repo");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("target must be organ");
    });
  });

  describe("createEnvelope", () => {
    it("creates envelope with defaults", () => {
      const env = createEnvelope({ source_id: "test", source_type: "test" });
      expect(env.source_id).toBe("test");
      expect(env.confidence).toBe(1.0);
      expect(env.valid_until).toBeNull();
      expect(env.environment).toBe("production");
    });

    it("allows overriding defaults", () => {
      const env = createEnvelope({
        source_id: "test",
        source_type: "github",
        confidence: 0.8,
        environment: "staging",
      });
      expect(env.confidence).toBe(0.8);
      expect(env.environment).toBe("staging");
    });
  });
});
