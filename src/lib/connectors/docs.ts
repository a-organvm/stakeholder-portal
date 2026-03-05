/**
 * Docs Connector
 *
 * Indexes markdown/plaintext docs from configured paths.
 * Useful for ingesting ADRs, specs, and knowledge notes.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, extname, join, relative, resolve } from "path";
import { createEnvelope } from "../ontology";
import type {
  ConnectorAdapter,
  ConnectorConfig,
  ConnectorState,
  IngestRecord,
} from "./types";

const SUPPORTED_DOC_EXTENSIONS = new Set([".md", ".mdx", ".txt", ".rst"]);

export class DocsConnector implements ConnectorAdapter {
  readonly id = "docs";
  readonly name = "Docs";

  private config: ConnectorConfig | null = null;
  private state: ConnectorState = {
    status: "idle",
    last_run: null,
    records_ingested: 0,
    errors: 0,
    last_error: null,
  };

  configure(config: ConnectorConfig): void {
    this.config = config;
  }

  getState(): ConnectorState {
    return { ...this.state };
  }

  private get rootDir(): string {
    return process.cwd();
  }

  private get paths(): string[] {
    const configured = this.config?.settings.paths;
    if (Array.isArray(configured) && configured.length > 0) {
      return configured
        .map((p) => (typeof p === "string" ? p : ""))
        .filter(Boolean);
    }
    return ["docs", "."];
  }

  private get maxFiles(): number {
    const raw = this.config?.settings.max_files;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
    return 500;
  }

  private get maxContentChars(): number {
    const raw = this.config?.settings.max_content_chars;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 100) return Math.floor(parsed);
    return 4_000;
  }

  async sync(options?: { incremental?: boolean; since?: string }): Promise<IngestRecord[]> {
    this.state.status = "running";
    const records: IngestRecord[] = [];
    const sinceMs = options?.since ? Date.parse(options.since) : Number.NaN;
    const hasSince = Number.isFinite(sinceMs);

    try {
      const files = this.collectDocFiles();
      for (const filePath of files) {
        if (records.length >= this.maxFiles) break;

        const stats = statSync(filePath);
        if (hasSince && stats.mtimeMs < sinceMs) continue;

        const record = this.fileToRecord(filePath, stats.mtime.toISOString(), stats.size);
        if (record) records.push(record);
      }

      this.state.status = "completed";
      this.state.last_run = new Date().toISOString();
      this.state.records_ingested += records.length;
    } catch (error) {
      this.state.status = "error";
      this.state.errors += 1;
      this.state.last_error = error instanceof Error ? error.message : String(error);
    }

    return records;
  }

  private collectDocFiles(): string[] {
    const found = new Set<string>();
    for (const configuredPath of this.paths) {
      const absolute = resolve(this.rootDir, configuredPath);
      if (!existsSync(absolute)) continue;
      this.walk(absolute, found);
    }
    return [...found];
  }

  private walk(dirPath: string, found: Set<string>): void {
    let entries: string[] = [];
    try {
      entries = readdirSync(dirPath);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      if (entry === "node_modules") continue;
      if (entry === ".next") continue;
      const absolute = join(dirPath, entry);
      let stats;
      try {
        stats = statSync(absolute);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        this.walk(absolute, found);
        continue;
      }

      const ext = extname(absolute).toLowerCase();
      if (!SUPPORTED_DOC_EXTENSIONS.has(ext)) continue;
      found.add(absolute);
    }
  }

  private fileToRecord(filePath: string, modifiedAt: string, size: number): IngestRecord | null {
    let content = "";
    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      return null;
    }

    const relPath = relative(this.rootDir, filePath) || basename(filePath);
    const preview = content.slice(0, this.maxContentChars);
    const titleLine = content
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    const displayName = titleLine?.replace(/^#+\s*/, "").slice(0, 120) || relPath;

    return {
      dedup_key: `docs:file:${relPath}`,
      entity_class: "artifact",
      name: relPath.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase(),
      display_name: displayName,
      description: `Documentation artifact from ${relPath}`,
      attributes: {
        artifact_type: "doc",
        path: relPath,
        format: extname(filePath).slice(1).toLowerCase() || "text",
        size_bytes: size,
        modified_at: modifiedAt,
        content_preview: preview,
      },
      envelope: createEnvelope({
        source_id: `docs:${relPath}`,
        source_type: "docs",
        channel: "crawl",
        confidence: 0.95,
        valid_from: modifiedAt,
      }),
    };
  }
}
