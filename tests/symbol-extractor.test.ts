import { describe, it, expect } from "vitest";
import { extractSymbols } from "@/lib/ingestion/symbol-extractor";

describe("extractSymbols", () => {
  describe("TypeScript extraction", () => {
    it("extracts exported functions", () => {
      const code = `export function planQuery(query: string): QueryPlan {
  const manifest = getManifest();
  return plan;
}`;
      const symbols = extractSymbols(code, "query-planner.ts");
      expect(symbols.length).toBeGreaterThanOrEqual(1);
      const fn = symbols.find((s) => s.name === "planQuery");
      expect(fn).toBeDefined();
      expect(fn!.symbolType).toBe("function");
      expect(fn!.visibility).toBe("export");
      expect(fn!.lineStart).toBe(1);
    });

    it("extracts async functions", () => {
      const code = `export async function hybridRetrieve(query: string): Promise<Result> {
  return result;
}`;
      const symbols = extractSymbols(code, "retrieval.ts");
      const fn = symbols.find((s) => s.name === "hybridRetrieve");
      expect(fn).toBeDefined();
      expect(fn!.symbolType).toBe("function");
    });

    it("extracts arrow function consts", () => {
      const code = `export const fetchData = async (url: string) => {
  return fetch(url);
};`;
      const symbols = extractSymbols(code, "utils.ts");
      const fn = symbols.find((s) => s.name === "fetchData");
      expect(fn).toBeDefined();
      expect(fn!.symbolType).toBe("function");
    });

    it("extracts classes", () => {
      const code = `export class KnowledgeGraph {
  private nodes = new Map();
  addNode(entity: Entity): void {}
}`;
      const symbols = extractSymbols(code, "graph.ts");
      const cls = symbols.find((s) => s.name === "KnowledgeGraph");
      expect(cls).toBeDefined();
      expect(cls!.symbolType).toBe("class");
      expect(cls!.visibility).toBe("export");
    });

    it("extracts interfaces", () => {
      const code = `export interface RetrievalSource {
  id: string;
  type: string;
}`;
      const symbols = extractSymbols(code, "types.ts");
      const iface = symbols.find((s) => s.name === "RetrievalSource");
      expect(iface).toBeDefined();
      expect(iface!.symbolType).toBe("interface");
    });

    it("extracts type aliases", () => {
      const code = `export type QueryStrategy =
  | "deterministic"
  | "exploratory";`;
      const symbols = extractSymbols(code, "planner.ts");
      const t = symbols.find((s) => s.name === "QueryStrategy");
      expect(t).toBeDefined();
      expect(t!.symbolType).toBe("type");
    });

    it("extracts exported constants", () => {
      const code = `export const STOP_WORDS = new Set(["the", "and"]);`;
      const symbols = extractSymbols(code, "config.ts");
      const c = symbols.find((s) => s.name === "STOP_WORDS");
      expect(c).toBeDefined();
      expect(c!.symbolType).toBe("const");
    });

    it("extracts preceding doc comments", () => {
      const code = `/** Computes TF-IDF score. */
export function computeTfIdf(tokens: string[]): number {
  return 0;
}`;
      const symbols = extractSymbols(code, "scoring.ts");
      const fn = symbols.find((s) => s.name === "computeTfIdf");
      expect(fn).toBeDefined();
      expect(fn!.docComment).toContain("TF-IDF");
    });

    it("skips private/underscore symbols", () => {
      const code = `function _helper() {}
export function publicFn() {}`;
      const symbols = extractSymbols(code, "utils.ts");
      expect(symbols.find((s) => s.name === "_helper")).toBeUndefined();
      expect(symbols.find((s) => s.name === "publicFn")).toBeDefined();
    });

    it("handles TSX files", () => {
      const code = `export function MyComponent({ name }: Props) {
  return <div>{name}</div>;
}`;
      const symbols = extractSymbols(code, "component.tsx");
      expect(symbols.find((s) => s.name === "MyComponent")).toBeDefined();
    });
  });

  describe("Python extraction", () => {
    it("extracts top-level functions", () => {
      const code = `def load_registry(path: str) -> dict:
    """Load the registry JSON."""
    with open(path) as f:
        return json.load(f)`;
      const symbols = extractSymbols(code, "loader.py");
      const fn = symbols.find((s) => s.name === "load_registry");
      expect(fn).toBeDefined();
      expect(fn!.symbolType).toBe("function");
      expect(fn!.visibility).toBe("public");
    });

    it("extracts classes", () => {
      const code = `class StateMachine:
    """Promotion state machine."""
    def __init__(self):
        pass`;
      const symbols = extractSymbols(code, "state.py");
      const cls = symbols.find((s) => s.name === "StateMachine");
      expect(cls).toBeDefined();
      expect(cls!.symbolType).toBe("class");
    });

    it("extracts async functions", () => {
      const code = `async def fetch_data(url: str) -> dict:
    async with aiohttp.get(url) as resp:
        return await resp.json()`;
      const symbols = extractSymbols(code, "fetcher.py");
      expect(symbols.find((s) => s.name === "fetch_data")).toBeDefined();
    });

    it("extracts Python docstrings", () => {
      const code = `def compute(x: int) -> int:
    """Compute the result from input."""
    return x * 2`;
      const symbols = extractSymbols(code, "math.py");
      const fn = symbols.find((s) => s.name === "compute");
      expect(fn).toBeDefined();
      expect(fn!.docComment).toContain("Compute the result");
    });

    it("skips private methods", () => {
      const code = `def _private():
    pass

def public_fn():
    pass`;
      const symbols = extractSymbols(code, "utils.py");
      expect(symbols.find((s) => s.name === "_private")).toBeUndefined();
      expect(symbols.find((s) => s.name === "public_fn")).toBeDefined();
    });
  });

  describe("unsupported files", () => {
    it("returns empty for unsupported extensions", () => {
      const symbols = extractSymbols("some content", "data.json");
      expect(symbols).toEqual([]);
    });

    it("returns empty for CSS files", () => {
      const symbols = extractSymbols(".body { color: red; }", "styles.css");
      expect(symbols).toEqual([]);
    });
  });
});
