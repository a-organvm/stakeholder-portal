/**
 * Regex-Based Symbol Extractor
 *
 * Extracts function, class, interface, type, and const declarations
 * from TypeScript/JavaScript and Python files using regex patterns.
 * No AST parser — pragmatic for 16GB RAM constraint.
 */

export interface ExtractedSymbol {
  name: string;
  symbolType: "function" | "class" | "interface" | "type" | "const";
  signature: string;
  lineStart: number;
  lineEnd: number;
  docComment: string | null;
  parentSymbol: string | null;
  visibility: "export" | "public" | "private" | null;
}

// ---------------------------------------------------------------------------
// TypeScript / JavaScript patterns
// ---------------------------------------------------------------------------

const TS_PATTERNS: Array<{
  type: ExtractedSymbol["symbolType"];
  regex: RegExp;
  signatureGroup: number;
  nameGroup: number;
}> = [
  // export function foo(...) or function foo(...)
  {
    type: "function",
    regex: /^(export\s+)?(?:async\s+)?function\s+(\w+)\s*(\([^)]*\))/gm,
    nameGroup: 2,
    signatureGroup: 0,
  },
  // export const foo = (...) => or export const foo = function
  {
    type: "function",
    regex: /^(export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*(?::\s*\S+\s*)?=>|function)/gm,
    nameGroup: 2,
    signatureGroup: 0,
  },
  // export class Foo
  {
    type: "class",
    regex: /^(export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/gm,
    nameGroup: 2,
    signatureGroup: 0,
  },
  // export interface Foo
  {
    type: "interface",
    regex: /^(export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?\s*\{/gm,
    nameGroup: 2,
    signatureGroup: 0,
  },
  // export type Foo =
  {
    type: "type",
    regex: /^(export\s+)?type\s+(\w+)(?:<[^>]+>)?\s*=/gm,
    nameGroup: 2,
    signatureGroup: 0,
  },
  // export const FOO = (non-function constants, typically UPPER_CASE or PascalCase)
  {
    type: "const",
    regex: /^(export\s+)const\s+([A-Z][\w]*)\s*(?::\s*[^=]+)?\s*=/gm,
    nameGroup: 2,
    signatureGroup: 0,
  },
];

// ---------------------------------------------------------------------------
// Python patterns
// ---------------------------------------------------------------------------

const PY_PATTERNS: Array<{
  type: ExtractedSymbol["symbolType"];
  regex: RegExp;
  nameGroup: number;
}> = [
  // def foo(...):
  {
    type: "function",
    regex: /^(\s*)(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/gm,
    nameGroup: 2,
  },
  // class Foo:
  {
    type: "class",
    regex: /^(\s*)class\s+(\w+)(?:\(([^)]*)\))?\s*:/gm,
    nameGroup: 2,
  },
];

// ---------------------------------------------------------------------------
// Doc comment extraction
// ---------------------------------------------------------------------------

function extractPrecedingDocComment(lines: string[], lineIndex: number): string | null {
  const comments: string[] = [];
  let i = lineIndex - 1;

  // TypeScript/JavaScript: /** ... */ or // comments
  while (i >= 0) {
    const trimmed = lines[i].trim();
    if (trimmed.endsWith("*/")) {
      // Multi-line comment block
      while (i >= 0) {
        comments.unshift(lines[i].trim());
        if (lines[i].trim().startsWith("/**") || lines[i].trim().startsWith("/*")) break;
        i--;
      }
      break;
    } else if (trimmed.startsWith("//")) {
      comments.unshift(trimmed.slice(2).trim());
      i--;
    } else if (trimmed.startsWith("#")) {
      // Python comment
      comments.unshift(trimmed.slice(1).trim());
      i--;
    } else {
      break;
    }
  }

  if (comments.length === 0) return null;
  return comments.join("\n").slice(0, 500);
}

function extractPythonDocstring(lines: string[], defLineIndex: number): string | null {
  // Look for docstring on the next non-empty line after the def/class line
  for (let i = defLineIndex + 1; i < Math.min(defLineIndex + 3, lines.length); i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
      const quote = trimmed.slice(0, 3);
      if (trimmed.endsWith(quote) && trimmed.length > 6) {
        return trimmed.slice(3, -3).trim().slice(0, 500);
      }
      // Multi-line docstring
      const docLines = [trimmed.slice(3)];
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].trim().endsWith(quote)) {
          docLines.push(lines[j].trim().slice(0, -3));
          return docLines.join("\n").trim().slice(0, 500);
        }
        docLines.push(lines[j].trim());
      }
    }
    if (trimmed && !trimmed.startsWith("#")) break;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Find end of symbol (heuristic: brace/indent counting)
// ---------------------------------------------------------------------------

function findEndLineTS(lines: string[], startLine: number): number {
  let braceDepth = 0;
  let foundOpen = false;

  for (let i = startLine; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") { braceDepth++; foundOpen = true; }
      if (ch === "}") braceDepth--;
    }
    if (foundOpen && braceDepth <= 0) return i;
  }
  return Math.min(startLine + 1, lines.length - 1);
}

function findEndLinePy(lines: string[], startLine: number): number {
  const startIndent = lines[startLine].match(/^(\s*)/)?.[1].length ?? 0;
  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
    if (indent <= startIndent) return i - 1;
  }
  return lines.length - 1;
}

// ---------------------------------------------------------------------------
// Main extraction
// ---------------------------------------------------------------------------

export function extractSymbols(content: string, filePath: string): ExtractedSymbol[] {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const lines = content.split("\n");
  const symbols: ExtractedSymbol[] = [];
  const seen = new Set<string>();

  if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
    for (const pattern of TS_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(content)) !== null) {
        const name = match[pattern.nameGroup];
        if (!name || name.startsWith("_")) continue;

        const lineStart = content.slice(0, match.index).split("\n").length;
        const key = `${pattern.type}:${name}:${lineStart}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const lineEnd = (pattern.type === "function" || pattern.type === "class")
          ? findEndLineTS(lines, lineStart - 1) + 1
          : lineStart;

        const isExport = match[1]?.trim() === "export";
        const docComment = extractPrecedingDocComment(lines, lineStart - 1);

        symbols.push({
          name,
          symbolType: pattern.type,
          signature: match[0].trim().slice(0, 200),
          lineStart,
          lineEnd,
          docComment,
          parentSymbol: null,
          visibility: isExport ? "export" : null,
        });
      }
    }
  } else if (ext === "py") {
    for (const pattern of PY_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(content)) !== null) {
        const name = match[pattern.nameGroup];
        if (!name || name.startsWith("_")) continue;

        const indent = match[1]?.length ?? 0;
        const lineStart = content.slice(0, match.index).split("\n").length;
        const key = `${pattern.type}:${name}:${lineStart}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const lineEnd = findEndLinePy(lines, lineStart - 1) + 1;
        const docComment = extractPythonDocstring(lines, lineStart - 1)
          ?? extractPrecedingDocComment(lines, lineStart - 1);

        symbols.push({
          name,
          symbolType: pattern.type,
          signature: match[0].trim().slice(0, 200),
          lineStart,
          lineEnd,
          docComment,
          parentSymbol: indent > 0 ? "nested" : null,
          visibility: indent === 0 ? "public" : "private",
        });
      }
    }
  }

  return symbols;
}
