/**
 * Maintenance cycle orchestration and scorecard persistence.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { runIngestionCycle, type IngestionCycleReport } from "./connectors/orchestrator";
import {
  runEvaluationSuite,
  type EvaluationReport,
  type EvaluationSample,
} from "./evaluation";
import { applyRetentionPolicies, type RetentionResult } from "./compliance";
import { getMetricsSnapshot, type MetricsSnapshot } from "./observability";
import { getAuditStats } from "./security";
import {
  evaluateSystemAlerts,
  getOverallAlertStatus,
  getAlertThresholds,
  type SystemAlert,
  type AlertThresholds,
} from "./alerts";
import {
  dispatchAlertEscalations,
  type AlertDispatchSummary,
} from "./alert-sinks";

export interface MaintenanceCycleOptions {
  incremental?: boolean;
  since?: string;
  connector_ids?: string[];
  evaluation_samples?: EvaluationSample[];
  run_retention?: boolean;
  dispatch_alerts?: boolean;
  persist_scorecard?: boolean;
}

export interface MaintenanceScorecard {
  id: string;
  started_at: string;
  completed_at: string;
  ingestion: IngestionCycleReport;
  retention: RetentionResult | null;
  evaluation: EvaluationReport | null;
  audit: ReturnType<typeof getAuditStats>;
  metrics: MetricsSnapshot;
  thresholds: AlertThresholds;
  alerts: SystemAlert[];
  alert_dispatch: AlertDispatchSummary;
  status: "healthy" | "degraded" | "critical";
}

export interface MaintenanceRunState {
  running: boolean;
  scorecard_id: string | null;
  started_at: string | null;
}

let activeMaintenanceRun: Promise<MaintenanceScorecard> | null = null;
let activeMaintenanceState: MaintenanceRunState = {
  running: false,
  scorecard_id: null,
  started_at: null,
};

function makeScorecardId(timestampIso: string): string {
  return `maint-${timestampIso.replace(/[:.]/g, "-")}`;
}

function getScorecardPath(): string {
  return (
    process.env.MAINTENANCE_SCORECARD_PATH ??
    join(process.cwd(), ".codex", "telemetry", "maintenance-scorecards.ndjson")
  );
}

function persistScorecard(scorecard: MaintenanceScorecard): void {
  const output = getScorecardPath();
  try {
    mkdirSync(dirname(output), { recursive: true });
    appendFileSync(output, `${JSON.stringify(scorecard)}\n`, "utf-8");
  } catch {
    // Best-effort persistence by design.
  }
}

export function getMaintenanceRunState(): MaintenanceRunState {
  return { ...activeMaintenanceState };
}

export async function runMaintenanceCycle(
  options: MaintenanceCycleOptions = {}
): Promise<MaintenanceScorecard> {
  if (activeMaintenanceRun) {
    return activeMaintenanceRun;
  }

  const startedAt = new Date().toISOString();
  const runId = makeScorecardId(startedAt);
  activeMaintenanceState = {
    running: true,
    scorecard_id: runId,
    started_at: startedAt,
  };

  const runPromise = (async (): Promise<MaintenanceScorecard> => {
    const ingestion = await runIngestionCycle({
      incremental: options.incremental,
      since: options.since,
      connector_ids: options.connector_ids,
      persist_dead_letters: true,
    });

    const retention =
      options.run_retention === false ? null : applyRetentionPolicies();
    const evaluation =
      options.evaluation_samples && options.evaluation_samples.length > 0
        ? runEvaluationSuite(options.evaluation_samples)
        : null;

    const audit = getAuditStats();
    const metrics = getMetricsSnapshot();
    const thresholds = getAlertThresholds();
    const alerts = evaluateSystemAlerts(
      {
        evaluation: evaluation?.summary ?? null,
        ingestion,
        audit,
        metrics,
      },
      thresholds
    );
    const status = getOverallAlertStatus(alerts);
    const completedAt = new Date().toISOString();
    const alertDispatch =
      options.dispatch_alerts === false
        ? { attempted: 0, delivered: 0, results: [] }
        : await dispatchAlertEscalations({
            status,
            scorecard_id: runId,
            completed_at: completedAt,
            alerts,
          });

    const scorecard: MaintenanceScorecard = {
      id: runId,
      started_at: startedAt,
      completed_at: completedAt,
      ingestion,
      retention,
      evaluation,
      audit,
      metrics,
      thresholds,
      alerts,
      alert_dispatch: alertDispatch,
      status,
    };

    if (options.persist_scorecard !== false) {
      persistScorecard(scorecard);
    }

    return scorecard;
  })();

  activeMaintenanceRun = runPromise;
  try {
    return await runPromise;
  } finally {
    activeMaintenanceRun = null;
    activeMaintenanceState = {
      running: false,
      scorecard_id: null,
      started_at: null,
    };
  }
}

export function readRecentMaintenanceScorecards(limit = 20): MaintenanceScorecard[] {
  const path = getScorecardPath();
  if (!existsSync(path)) return [];

  let raw = "";
  try {
    raw = readFileSync(path, "utf-8");
  } catch {
    return [];
  }

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const recent = lines.slice(-Math.max(1, limit));

  const parsed: MaintenanceScorecard[] = [];
  for (const line of recent) {
    try {
      parsed.push(JSON.parse(line) as MaintenanceScorecard);
    } catch {
      // Skip malformed lines.
    }
  }
  return parsed.reverse();
}
