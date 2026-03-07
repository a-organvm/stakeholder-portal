/**
 * Code-Aware Chunking
 *
 * For code files, chunk along symbol boundaries instead of character count.
 * Each function/class gets its own chunk with a metadata header.
 * Falls back to RecursiveCharacterTextSplitter for non-code files.
 */

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { extractSymbols } from "./symbol-extractor";

const MAX_CHUNK_SIZE = 2000;

const fallbackSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export interface CodeChunk {
  content: string;
  symbolName?: string;
  symbolType?: string;
  lineStart?: number;
  lineEnd?: number;
}

function isCodeFile(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return !!ext && ["ts", "tsx", "js", "jsx", "py"].includes(ext);
}

/**
 * Split a file into chunks, using symbol boundaries for code files.
 */
export async function splitFile(
  content: string,
  filePath: string,
  repo: string
): Promise<CodeChunk[]> {
  if (!isCodeFile(filePath)) {
    const docs = await fallbackSplitter.createDocuments([content]);
    return docs.map((d) => ({ content: d.pageContent }));
  }

  const symbols = extractSymbols(content, filePath);
  if (symbols.length === 0) {
    const docs = await fallbackSplitter.createDocuments([content]);
    return docs.map((d) => ({ content: d.pageContent }));
  }

  const lines = content.split("\n");
  const chunks: CodeChunk[] = [];
  const covered = new Set<number>();

  // Sort symbols by line start
  symbols.sort((a, b) => a.lineStart - b.lineStart);

  for (const sym of symbols) {
    const start = Math.max(0, sym.lineStart - 1);
    const end = Math.min(lines.length, sym.lineEnd);
    const symbolLines = lines.slice(start, end);
    let body = symbolLines.join("\n");

    // Truncate very large symbols
    if (body.length > MAX_CHUNK_SIZE) {
      body = body.slice(0, MAX_CHUNK_SIZE) + "\n// ... truncated";
    }

    const header = `// File: ${repo}/${filePath} | ${sym.symbolType}: ${sym.name}`;
    const chunkContent = sym.docComment
      ? `${header}\n// ${sym.docComment.split("\n")[0]}\n${body}`
      : `${header}\n${body}`;

    chunks.push({
      content: chunkContent,
      symbolName: sym.name,
      symbolType: sym.symbolType,
      lineStart: sym.lineStart,
      lineEnd: sym.lineEnd,
    });

    for (let i = start; i < end; i++) covered.add(i);
  }

  // Collect uncovered lines into gap chunks
  const gapLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!covered.has(i)) {
      gapLines.push(lines[i]);
    } else if (gapLines.length > 0) {
      const gapText = gapLines.join("\n").trim();
      if (gapText.length >= 50) {
        chunks.push({
          content: `// File: ${repo}/${filePath} | (module scope)\n${gapText}`,
        });
      }
      gapLines.length = 0;
    }
  }
  // Flush remaining gap
  if (gapLines.length > 0) {
    const gapText = gapLines.join("\n").trim();
    if (gapText.length >= 50) {
      chunks.push({
        content: `// File: ${repo}/${filePath} | (module scope)\n${gapText}`,
      });
    }
  }

  return chunks;
}
