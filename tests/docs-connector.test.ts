import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { DocsConnector } from "@/lib/connectors/docs";

describe("DocsConnector", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "docs-connector-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("discovers and indexes .md files", async () => {
    const docsDir = join(tmpDir, "docs");
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, "readme.md"), "# Hello World\n\nSome content here.");
    writeFileSync(join(docsDir, "guide.md"), "# Guide\n\nStep by step instructions.");

    const connector = new DocsConnector();
    connector.configure({
      id: "docs",
      name: "Docs",
      enabled: true,
      settings: { paths: ["docs"] },
    });

    // Override rootDir via object introspection (private getter)
    Object.defineProperty(connector, "rootDir", { get: () => tmpDir });

    const records = await connector.sync();
    expect(records.length).toBe(2);
    for (const record of records) {
      expect(record.entity_class).toBe("artifact");
      expect(record.dedup_key).toMatch(/^docs:file:/);
      expect(record.envelope.source_type).toBe("docs");
    }
  });

  it("skips non-doc files", async () => {
    writeFileSync(join(tmpDir, "script.py"), "print('hello')");
    writeFileSync(join(tmpDir, "data.json"), "{}");
    writeFileSync(join(tmpDir, "notes.md"), "# Notes\n\nImportant stuff.");

    const connector = new DocsConnector();
    connector.configure({
      id: "docs",
      name: "Docs",
      enabled: true,
      settings: { paths: ["."] },
    });
    Object.defineProperty(connector, "rootDir", { get: () => tmpDir });

    const records = await connector.sync();
    expect(records.length).toBe(1);
    expect(records[0].display_name).toContain("Notes");
  });

  it("respects incremental sync with since parameter", async () => {
    writeFileSync(join(tmpDir, "old.md"), "# Old\n\nOld content.");
    // Set mtime to the past
    const oldDate = new Date("2020-01-01T00:00:00Z");
    const { utimesSync } = await import("fs");
    utimesSync(join(tmpDir, "old.md"), oldDate, oldDate);

    writeFileSync(join(tmpDir, "new.md"), "# New\n\nNew content.");

    const connector = new DocsConnector();
    connector.configure({
      id: "docs",
      name: "Docs",
      enabled: true,
      settings: { paths: ["."] },
    });
    Object.defineProperty(connector, "rootDir", { get: () => tmpDir });

    const records = await connector.sync({ incremental: true, since: "2025-01-01T00:00:00Z" });
    expect(records.length).toBe(1);
    expect(records[0].display_name).toContain("New");
  });

  it("extracts title from first heading", async () => {
    writeFileSync(join(tmpDir, "titled.md"), "# My Great Document\n\nBody text.");

    const connector = new DocsConnector();
    connector.configure({
      id: "docs",
      name: "Docs",
      enabled: true,
      settings: { paths: ["."] },
    });
    Object.defineProperty(connector, "rootDir", { get: () => tmpDir });

    const records = await connector.sync();
    expect(records[0].display_name).toBe("My Great Document");
  });

  it("updates connector state after sync", async () => {
    writeFileSync(join(tmpDir, "doc.md"), "# Doc\n\nContent.");

    const connector = new DocsConnector();
    connector.configure({
      id: "docs",
      name: "Docs",
      enabled: true,
      settings: { paths: ["."] },
    });
    Object.defineProperty(connector, "rootDir", { get: () => tmpDir });

    expect(connector.getState().status).toBe("idle");
    await connector.sync();
    expect(connector.getState().status).toBe("completed");
    expect(connector.getState().records_ingested).toBeGreaterThan(0);
  });

  it("skips node_modules and hidden directories", async () => {
    mkdirSync(join(tmpDir, "node_modules"), { recursive: true });
    writeFileSync(join(tmpDir, "node_modules", "pkg.md"), "# Package");
    mkdirSync(join(tmpDir, ".hidden"), { recursive: true });
    writeFileSync(join(tmpDir, ".hidden", "secret.md"), "# Secret");
    writeFileSync(join(tmpDir, "visible.md"), "# Visible\n\nContent.");

    const connector = new DocsConnector();
    connector.configure({
      id: "docs",
      name: "Docs",
      enabled: true,
      settings: { paths: ["."] },
    });
    Object.defineProperty(connector, "rootDir", { get: () => tmpDir });

    const records = await connector.sync();
    expect(records.length).toBe(1);
    expect(records[0].display_name).toContain("Visible");
  });
});
