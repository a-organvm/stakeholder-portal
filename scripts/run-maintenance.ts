#!/usr/bin/env tsx

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { runMaintenanceCycle } from "../src/lib/maintenance";
import type { EvaluationSample } from "../src/lib/evaluation";

interface CliOptions {
  incremental: boolean;
  since?: string;
  evalFile?: string;
  noRetention: boolean;
  noAlerts: boolean;
  connectorIds?: string[];
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    incremental: false,
    noRetention: false,
    noAlerts: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--incremental") {
      options.incremental = true;
      continue;
    }
    if (arg === "--since") {
      options.since = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--eval-file") {
      options.evalFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--no-retention") {
      options.noRetention = true;
      continue;
    }
    if (arg === "--no-alerts") {
      options.noAlerts = true;
      continue;
    }
    if (arg === "--connectors") {
      const raw = argv[i + 1] || "";
      options.connectorIds = raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      i += 1;
    }
  }

  return options;
}

function loadEvalSamples(pathArg?: string): EvaluationSample[] | undefined {
  if (!pathArg) return undefined;
  const absolute = resolve(process.cwd(), pathArg);
  if (!existsSync(absolute)) {
    throw new Error(`Evaluation sample file not found: ${absolute}`);
  }
  const raw = readFileSync(absolute, "utf-8");
  const parsed = JSON.parse(raw) as EvaluationSample[];
  if (!Array.isArray(parsed)) {
    throw new Error("Evaluation sample file must be a JSON array.");
  }
  return parsed;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const evaluationSamples = loadEvalSamples(options.evalFile);

  const scorecard = await runMaintenanceCycle({
    incremental: options.incremental,
    since: options.since,
    connector_ids: options.connectorIds,
    evaluation_samples: evaluationSamples,
    run_retention: !options.noRetention,
    dispatch_alerts: !options.noAlerts,
    persist_scorecard: true,
  });

  console.log(JSON.stringify(scorecard, null, 2));
}

main();
