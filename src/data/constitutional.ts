/**
 * Constitutional corpus data — static hardcoded module.
 *
 * All axiom, spec, instrument, and layer data is hardcoded here from the
 * post-flood/specs/ corpus. This will be replaced by automated ingestion
 * in a future phase.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AxiomStatus = "ALIGNED" | "DRIFT" | "CONFLICT" | "MISSING";

export interface Axiom {
  id: string;
  name: string;
  summary: string;
  status: AxiomStatus;
  gap: string;
}

export type SpecStatus = "G3 PASSED" | "G0 PASSED (SPECULATIVE)";

export interface SpecEntry {
  id: string;
  title: string;
  layer: string;
  layerName: string;
  status: SpecStatus;
  dateStarted: string;
  dateCompleted: string;
  signoff: string;
  groundingLines: number;
  hasLiteratureMatrix: boolean;
  hasRiskRegister: boolean;
  hasInventory: boolean;
  hasResearchBrief: boolean;
  hasSources: boolean;
}

export interface LayerInfo {
  id: string;
  name: string;
  description: string;
}

export interface ConstitutionalMetrics {
  totalSpecs: number;
  totalInstruments: number;
  totalBibEntries: number;
  totalGroundingLines: number;
  traceabilityCoveragePct: number;
  specsRatified: number;
  specsSpeculative: number;
  axiomsAligned: number;
  axiomsDrift: number;
  axiomsConflict: number;
  axiomsMissing: number;
}

// ---------------------------------------------------------------------------
// Axioms (from SPEC-000/inventory.md)
// ---------------------------------------------------------------------------

export const AXIOMS: Axiom[] = [
  {
    id: "AX-000-001",
    name: "Ontological Primacy",
    summary:
      "Entities are identity-first. UIDs assigned at creation, survive renames/merges/splits. resolve_entity() resolves names to identities before behavioral dispatch.",
    status: "ALIGNED",
    gap: "Minor: behaviors were built before ontologia (chronological inversion). No structural gap remains.",
  },
  {
    id: "AX-000-002",
    name: "Organizational Closure",
    summary:
      "Governance validates registry and dependency graph against governance-rules.json. JSON Schema exists for governance-rules. But the governance loader does not validate governance-rules.json against its own schema at load time.",
    status: "DRIFT",
    gap: "Governance does not govern itself. Schema exists but is not enforced by the governance loader.",
  },
  {
    id: "AX-000-003",
    name: "Individual Primacy",
    summary:
      "No axiom, constraint, or policy in any code or config encodes this principle. VISION.md mentions \"empowerment\" as prose. No governance rule prevents system optimization from overriding individual empowerment.",
    status: "MISSING",
    gap: "Value commitment with zero structural encoding.",
  },
  {
    id: "AX-000-004",
    name: "Constitutional Governance",
    summary:
      "Every repo requires seed.yaml. Promotion state machine restricts transitions. Dependency graph enforces acyclicity. save_registry() guards against corruption.",
    status: "ALIGNED",
    gap: "Minor: LIMINAL zone (intake/, stakeholder-portal/) exists outside governance by design. Definitional question whether LIMINAL is \"inside the system.\"",
  },
  {
    id: "AX-000-005",
    name: "Evolutionary Recursivity",
    summary:
      "governance-rules.json is editable. evolution-policy.schema.json defines a policy framework. But no code implements governed rule-modification. State machine transitions are hardcoded in Python.",
    status: "DRIFT",
    gap: "System can be modified but cannot govern its own modification. The \"rules for modifying rules\" layer is schema-defined but not code-implemented.",
  },
  {
    id: "AX-000-006",
    name: "Topological Plasticity",
    summary:
      "8-organ topology hardcoded in organ_config.py, dependency_graph.py, and organ-definitions.schema.json. No mechanism to add/remove/fuse/split organs through any governed process.",
    status: "CONFLICT",
    gap: "Direct conflict. Axiom says \"governed variable\"; code says \"frozen constant\" in 3 locations. Adding an organ requires editing Python source.",
  },
  {
    id: "AX-000-007",
    name: "Alchemical Inheritance",
    summary:
      "ontologia has full lineage system (LineageType, LineageRecord, LineageIndex, trace_ancestry). 52 dissolved repos carry freetext note fields.",
    status: "DRIFT",
    gap: "Ontologia lineage not wired to registry's dissolved repos. No auto-creation of LineageRecord on archive/dissolve.",
  },
  {
    id: "AX-000-008",
    name: "Multiplex Flow Governance",
    summary:
      "Engine distinguishes edge_type in pulse/flow.py. Dependency flow governed (acyclicity enforced). governance-rules.json defines allowed_edges.",
    status: "DRIFT",
    gap: "Only dependency layer governed. 4 other flow types (information, governance, evolution, signal) not tracked as independent graph layers.",
  },
  {
    id: "AX-000-009",
    name: "Modular Alchemical Synthesis",
    summary:
      "No signal_inputs/signal_outputs in seed.yaml. No patch matrix. No attenuation policy. No modulation concept. No 14 canonical signal classes in code.",
    status: "MISSING",
    gap: "Almost entirely unimplemented. The modular synthesis paradigm exists only in the corpus and SPEC-000 grounding.",
  },
];

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

export const LAYERS: LayerInfo[] = [
  {
    id: "L1",
    name: "Metaphysical Identity",
    description:
      "The system's foundational ontology: what entities exist, how identity persists, what primitives compose the world.",
  },
  {
    id: "L2",
    name: "Constitutional Logic",
    description:
      "Invariants, logical constraints, and the rulebook that governs system behavior and transitions.",
  },
  {
    id: "L3A",
    name: "Structural Architecture",
    description:
      "Architecture documents, interface contracts, and evolution/migration laws that shape the system's physical structure.",
  },
  {
    id: "L3B",
    name: "Governance Instruments",
    description:
      "Concrete governance mechanisms: fusion protocols, formation declarations, functional taxonomy, era transitions.",
  },
  {
    id: "L4A",
    name: "Sensing & Observation",
    description:
      "Event spine, temporal metrics, variable resolution, and heartbeat/affect monitoring for system self-awareness.",
  },
  {
    id: "L4B",
    name: "Diagnosis & Meta-Evolution",
    description:
      "Structural interrogation, Alpha-Omega phase map, meta-evolution architecture, AMMOI reconciliation, and graph indices.",
  },
  {
    id: "L5",
    name: "Swarm Governance",
    description:
      "Agent topology, resource constraints, escalation policies, epistemic routing, and agent authority matrices.",
  },
];

// ---------------------------------------------------------------------------
// Specs (18 numbered SPEC-XXX + 9 instruments = 27 total)
// ---------------------------------------------------------------------------

export const SPECS: SpecEntry[] = [
  // Layer L1 — Metaphysical Identity
  {
    id: "SPEC-000",
    title: "System Manifesto",
    layer: "L1",
    layerName: "Metaphysical Identity",
    status: "G3 PASSED",
    dateStarted: "2026-03-17",
    dateCompleted: "2026-03-18",
    signoff: "G0 2026-03-18, G3 2026-03-18 (v1.1)",
    groundingLines: 274,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: true,
    hasResearchBrief: false,
    hasSources: true,
  },
  {
    id: "SPEC-001",
    title: "Ontology Charter",
    layer: "L1",
    layerName: "Metaphysical Identity",
    status: "G3 PASSED",
    dateStarted: "2026-03-18",
    dateCompleted: "2026-03-18",
    signoff: "G0 2026-03-18, G3 2026-03-18 (v1.1)",
    groundingLines: 243,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: true,
    hasResearchBrief: false,
    hasSources: true,
  },
  {
    id: "SPEC-002",
    title: "Primitive Register",
    layer: "L1",
    layerName: "Metaphysical Identity",
    status: "G3 PASSED",
    dateStarted: "2026-03-18",
    dateCompleted: "2026-03-18",
    signoff: "G0 2026-03-18, G3 2026-03-18 (v1.1)",
    groundingLines: 248,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: true,
    hasResearchBrief: false,
    hasSources: true,
  },
  // Layer L2 — Constitutional Logic
  {
    id: "SPEC-003",
    title: "Invariant Register",
    layer: "L2",
    layerName: "Constitutional Logic",
    status: "G3 PASSED",
    dateStarted: "2026-03-18",
    dateCompleted: "2026-03-19",
    signoff: "G0 2026-03-19, G3 2026-03-19 (v1.1)",
    groundingLines: 175,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: true,
    hasResearchBrief: true,
    hasSources: false,
  },
  {
    id: "SPEC-004",
    title: "Logical Specification",
    layer: "L2",
    layerName: "Constitutional Logic",
    status: "G3 PASSED",
    dateStarted: "2026-03-18",
    dateCompleted: "2026-03-19",
    signoff: "G0 2026-03-19, G3 2026-03-19 (v1.1)",
    groundingLines: 196,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: true,
    hasResearchBrief: false,
    hasSources: true,
  },
  {
    id: "SPEC-005",
    title: "Rulebook",
    layer: "L2",
    layerName: "Constitutional Logic",
    status: "G3 PASSED",
    dateStarted: "2026-03-18",
    dateCompleted: "2026-03-19",
    signoff: "G0 2026-03-19, G3 2026-03-19 (v1.1)",
    groundingLines: 175,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: true,
    hasResearchBrief: false,
    hasSources: true,
  },
  // Layer L3A — Structural Architecture
  {
    id: "SPEC-006",
    title: "Architecture Document",
    layer: "L3A",
    layerName: "Structural Architecture",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 139,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: true,
  },
  {
    id: "SPEC-007",
    title: "Interface Contract Spec",
    layer: "L3A",
    layerName: "Structural Architecture",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 149,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: true,
  },
  {
    id: "SPEC-008",
    title: "Evolution & Migration Law",
    layer: "L3A",
    layerName: "Structural Architecture",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 172,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: true,
  },
  // Layer L3B — Governance Instruments
  {
    id: "SPEC-012",
    title: "Repo Fusion Protocol",
    layer: "L3B",
    layerName: "Governance Instruments",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 94,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: true,
  },
  {
    id: "INST-FORMATION",
    title: "Formation Protocol",
    layer: "L3B",
    layerName: "Governance Instruments",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 112,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "INST-TAXONOMY",
    title: "Functional Taxonomy",
    layer: "L3B",
    layerName: "Governance Instruments",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 118,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "INST-ERA",
    title: "Era Model",
    layer: "L3B",
    layerName: "Governance Instruments",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 145,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  // Layer L4A — Sensing & Observation
  {
    id: "INST-EVENT-SPINE",
    title: "Event Spine",
    layer: "L4A",
    layerName: "Sensing & Observation",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 71,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "INST-TEMPORAL-METRICS",
    title: "Temporal Metrics",
    layer: "L4A",
    layerName: "Sensing & Observation",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 69,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "INST-VARIABLE-RES",
    title: "Variable Resolution",
    layer: "L4A",
    layerName: "Sensing & Observation",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 74,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "INST-HEARTBEAT",
    title: "Heartbeat & Affect",
    layer: "L4A",
    layerName: "Sensing & Observation",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 68,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  // Layer L4B — Diagnosis & Meta-Evolution
  {
    id: "SPEC-009",
    title: "Structural Interrogation",
    layer: "L4B",
    layerName: "Diagnosis & Meta-Evolution",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 67,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "SPEC-010",
    title: "Alpha-Omega Phase Map",
    layer: "L4B",
    layerName: "Diagnosis & Meta-Evolution",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 68,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "SPEC-011",
    title: "Meta-Evolution Architecture",
    layer: "L4B",
    layerName: "Diagnosis & Meta-Evolution",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 76,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "INST-AMMOI",
    title: "AMMOI Reconciliation",
    layer: "L4B",
    layerName: "Diagnosis & Meta-Evolution",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 67,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "INST-GRAPH-INDICES",
    title: "Graph Indices (CCI/DDI/FVI/CRI/ECI)",
    layer: "L4B",
    layerName: "Diagnosis & Meta-Evolution",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 75,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  // Layer L5 — Swarm Governance
  {
    id: "SPEC-013",
    title: "Agent Swarm Topology",
    layer: "L5",
    layerName: "Swarm Governance",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 70,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "SPEC-014",
    title: "Resource & Compute Constraints",
    layer: "L5",
    layerName: "Swarm Governance",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 71,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "SPEC-015",
    title: "Escalation & Attention Policy",
    layer: "L5",
    layerName: "Swarm Governance",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 75,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "SPEC-016",
    title: "Epistemic Routing",
    layer: "L5",
    layerName: "Swarm Governance",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 83,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
  {
    id: "SPEC-017",
    title: "Agent Authority Matrix",
    layer: "L5",
    layerName: "Swarm Governance",
    status: "G0 PASSED (SPECULATIVE)",
    dateStarted: "2026-03-19",
    dateCompleted: "",
    signoff: "G0 2026-03-19",
    groundingLines: 79,
    hasLiteratureMatrix: true,
    hasRiskRegister: true,
    hasInventory: false,
    hasResearchBrief: false,
    hasSources: false,
  },
];

// ---------------------------------------------------------------------------
// Accessor functions
// ---------------------------------------------------------------------------

export function getAxioms(): Axiom[] {
  return AXIOMS;
}

export function getSpecs(): SpecEntry[] {
  return SPECS;
}

export function getSpecsByLayer(layer: string): SpecEntry[] {
  return SPECS.filter((s) => s.layer === layer);
}

export function getLayers(): LayerInfo[] {
  return LAYERS;
}

export function getLayerStatus(layer: string): "RATIFIED" | "SPECULATIVE" | "MIXED" {
  const layerSpecs = getSpecsByLayer(layer);
  if (layerSpecs.length === 0) return "SPECULATIVE";
  const allRatified = layerSpecs.every((s) => s.status === "G3 PASSED");
  const allSpeculative = layerSpecs.every((s) => s.status === "G0 PASSED (SPECULATIVE)");
  if (allRatified) return "RATIFIED";
  if (allSpeculative) return "SPECULATIVE";
  return "MIXED";
}

export function getMetrics(): ConstitutionalMetrics {
  const ratified = SPECS.filter((s) => s.status === "G3 PASSED").length;
  const speculative = SPECS.filter((s) => s.status === "G0 PASSED (SPECULATIVE)").length;
  const aligned = AXIOMS.filter((a) => a.status === "ALIGNED").length;
  const drift = AXIOMS.filter((a) => a.status === "DRIFT").length;
  const conflict = AXIOMS.filter((a) => a.status === "CONFLICT").length;
  const missing = AXIOMS.filter((a) => a.status === "MISSING").length;

  return {
    totalSpecs: 18,
    totalInstruments: 9,
    totalBibEntries: 130,
    totalGroundingLines: SPECS.reduce((sum, s) => sum + s.groundingLines, 0),
    traceabilityCoveragePct: 100,
    specsRatified: ratified,
    specsSpeculative: speculative,
    axiomsAligned: aligned,
    axiomsDrift: drift,
    axiomsConflict: conflict,
    axiomsMissing: missing,
  };
}
