import { describe, it, expect } from "vitest";
import { splitFile } from "@/lib/ingestion/code-splitter";

describe("splitFile", () => {
  it("splits TypeScript code along function boundaries", async () => {
    const code = `import { something } from "lib";

export function alpha(x: number): number {
  return x + 1;
}

export function beta(y: string): string {
  return y.toUpperCase();
}`;
    const chunks = await splitFile(code, "utils.ts", "my-repo");
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    const alphaChunk = chunks.find((c) => c.symbolName === "alpha");
    expect(alphaChunk).toBeDefined();
    expect(alphaChunk!.content).toContain("// File: my-repo/utils.ts | function: alpha");
    expect(alphaChunk!.content).toContain("return x + 1");

    const betaChunk = chunks.find((c) => c.symbolName === "beta");
    expect(betaChunk).toBeDefined();
    expect(betaChunk!.content).toContain("function: beta");
  });

  it("includes metadata header with doc comments", async () => {
    const code = `/** Computes the sum. */
export function sum(a: number, b: number): number {
  return a + b;
}`;
    const chunks = await splitFile(code, "math.ts", "repo");
    const sumChunk = chunks.find((c) => c.symbolName === "sum");
    expect(sumChunk).toBeDefined();
    expect(sumChunk!.content).toContain("Computes the sum");
  });

  it("falls back to text splitter for non-code files", async () => {
    const markdown = "# Title\n\n" + "Some content. ".repeat(100);
    const chunks = await splitFile(markdown, "README.md", "repo");
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    // Non-code chunks don't have symbolName
    expect(chunks[0].symbolName).toBeUndefined();
  });

  it("falls back when no symbols found in code file", async () => {
    const code = `// Just comments\n// Nothing to extract\nconst x = 1;\n`;
    const chunks = await splitFile(code, "simple.ts", "repo");
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  it("handles Python files", async () => {
    const code = `def greet(name: str) -> str:
    """Say hello."""
    return f"Hello, {name}!"

def farewell(name: str) -> str:
    return f"Goodbye, {name}!"
`;
    const chunks = await splitFile(code, "greet.py", "repo");
    const greetChunk = chunks.find((c) => c.symbolName === "greet");
    expect(greetChunk).toBeDefined();
    expect(greetChunk!.symbolType).toBe("function");
  });

  it("preserves line start/end metadata", async () => {
    const code = `export function first() {
  return 1;
}

export function second() {
  return 2;
}`;
    const chunks = await splitFile(code, "lines.ts", "repo");
    const first = chunks.find((c) => c.symbolName === "first");
    expect(first).toBeDefined();
    expect(first!.lineStart).toBe(1);
    expect(first!.lineEnd).toBeGreaterThan(1);
  });
});
