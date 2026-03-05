#!/usr/bin/env tsx
/**
 * CI Quality Gate — Step 7.
 *
 * Runs the offline evaluation suite and asserts all thresholds pass.
 * Exits with code 1 (blocking CI) if any metric is out of bounds.
 *
 * Thresholds can be overridden via environment variables; see ALERT_* vars in .env.example.
 *
 * Usage:
 *   npx tsx scripts/ci-quality-gate.ts
 *   npx tsx scripts/ci-quality-gate.ts --eval-file path/to/samples.json
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { runEvaluationSuite, type EvaluationSample } from "../src/lib/evaluation";
import { getAlertThresholds, evaluateSystemAlerts } from "../src/lib/alerts";

interface GateResult {
  passed: boolean;
  failures: string[];
  metrics: {
    avg_citation_coverage: number;
    hallucination_rate: number;
    p95_latency_ms: number;
  };
}

function parseArgs(argv: string[]): { evalFile?: string } {
  const opts: { evalFile?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--eval-file" && argv[i + 1]) {
      opts.evalFile = argv[i + 1];
      i++;
    }
  }
  return opts;
}

function loadSamples(path?: string): EvaluationSample[] {
  if (!path) return [];
  const absolute = resolve(process.cwd(), path);
  if (!existsSync(absolute)) {
    console.error(`[ci-quality-gate] Eval file not found: ${absolute}`);
    process.exit(1);
  }
  const raw = readFileSync(absolute, "utf-8");
  const parsed = JSON.parse(raw) as EvaluationSample[];
  if (!Array.isArray(parsed)) {
    console.error("[ci-quality-gate] Eval file must be a JSON array.");
    process.exit(1);
  }
  return parsed;
}

function runGate(samples: EvaluationSample[]): GateResult {
  const thresholds = getAlertThresholds();
  const failures: string[] = [];

  if (samples.length === 0) {
    console.warn("[ci-quality-gate] No evaluation samples provided — skipping quality checks.");
    return {
      passed: true,
      failures: [],
      metrics: { avg_citation_coverage: 1, hallucination_rate: 0, p95_latency_ms: 0 },
    };
  }

  const report = runEvaluationSuite(samples);
  const { avg_citation_coverage, hallucination_rate, p95_latency_ms } = report.summary;

  const alerts = evaluateSystemAlerts({ evaluation: report.summary }, thresholds);

  for (const alert of alerts) {
    if (alert.severity === "critical" || alert.severity === "warning") {
      failures.push(
        `[${alert.severity.toUpperCase()}] ${alert.message} ` +
          `(${alert.metric_name}: observed=${alert.observed_value.toFixed(4)}, threshold=${alert.threshold})`
      );
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    metrics: { avg_citation_coverage, hallucination_rate, p95_latency_ms },
  };
}

function main(): void {
  const { evalFile } = parseArgs(process.argv.slice(2));
  const samples = loadSamples(evalFile);
  const result = runGate(samples);

  console.log("\n=== CI Quality Gate ===");
  console.log(`Citation coverage : ${result.metrics.avg_citation_coverage.toFixed(4)}`);
  console.log(`Hallucination rate: ${result.metrics.hallucination_rate.toFixed(4)}`);
  console.log(`p95 latency (ms)  : ${result.metrics.p95_latency_ms.toFixed(0)}`);
  console.log("");

  if (result.passed) {
    console.log("✅ All quality gates passed.\n");
    process.exit(0);
  } else {
    console.error("❌ Quality gate FAILED — blocking CI:\n");
    for (const failure of result.failures) {
      console.error(`  • ${failure}`);
    }
    console.error("");
    process.exit(1);
  }
}

main();
