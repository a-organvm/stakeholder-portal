#!/usr/bin/env tsx

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { EvaluationSample } from "../src/lib/evaluation";
import { runEvaluationSuite } from "../src/lib/evaluation";

function parseInput(pathArg?: string): EvaluationSample[] {
  if (!pathArg) return [];
  const absolute = resolve(process.cwd(), pathArg);
  if (!existsSync(absolute)) {
    throw new Error(`Eval dataset not found: ${absolute}`);
  }
  const raw = readFileSync(absolute, "utf-8");
  const parsed = JSON.parse(raw) as EvaluationSample[];
  if (!Array.isArray(parsed)) {
    throw new Error("Evaluation input must be an array.");
  }
  return parsed;
}

function defaultSamples(): EvaluationSample[] {
  return [
    {
      id: "sample-1",
      query: "How many repos are in ORGANVM?",
      response:
        "ORGANVM currently tracks 111 repositories [cite-1]. It spans eight organs [cite-1].",
      citations: [
        {
          id: "cite-1",
          source_name: "Manifest",
          source_type: "manifest",
          url: null,
          relevance: 1,
          confidence: 0.92,
          freshness: 0.8,
          freshness_label: "fresh",
          snippet: "Snapshot generated ...",
          retrieved_at: new Date().toISOString(),
        },
      ],
      expected_keywords: ["repositories", "organs"],
      latency_ms: 710,
    },
  ];
}

function main(): void {
  const datasetPath = process.argv[2];
  const samples = datasetPath ? parseInput(datasetPath) : defaultSamples();
  const report = runEvaluationSuite(samples);

  // Compact machine-readable output for CI ingestion.
  console.log(JSON.stringify(report, null, 2));
}

main();
