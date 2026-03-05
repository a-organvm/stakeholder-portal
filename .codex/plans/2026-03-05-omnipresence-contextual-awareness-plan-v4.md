# Stakeholder Portal Omnipresence + Omnipotence Plan (Execution Update v4)

Date: 2026-03-05  
Scope: `stakeholder-portal`  
Reference chain:
1. `2026-03-05-omnipresence-contextual-awareness-plan.md`
2. `2026-03-05-omnipresence-contextual-awareness-plan-v2.md`
3. `2026-03-05-omnipresence-contextual-awareness-plan-v3.md`

## v4 Objective

Move from callable backend primitives to operational control-plane completeness:
1. Scheduled-style maintenance orchestration with persisted scorecards.
2. Alert thresholding on quality/latency/ingestion/security risk.
3. Admin operator UI for direct execution + inspection.

## Implemented in v4

### 1) Alert Engine

Added:
1. `src/lib/alerts.ts`

Capabilities:
1. Threshold model with env overrides.
2. Alert generation for:
   - low citation coverage
   - high hallucination rate
   - high eval latency
   - high ingestion quarantine/dead-letter rates
   - high audit denied ratio
3. Overall status classification (`healthy`, `degraded`, `critical`).

### 2) Maintenance Cycle + Scorecards

Added:
1. `src/lib/maintenance.ts`
2. `scripts/run-maintenance.ts`
3. npm script: `maintenance:run`

Capabilities:
1. Single-cycle orchestration:
   - ingestion
   - retention
   - optional eval suite
   - metrics + audit snapshot
   - alert computation
2. Scorecard persistence:
   - NDJSON append path configurable via `MAINTENANCE_SCORECARD_PATH`
3. Scorecard retrieval utility for admin/API use.

### 3) Admin API Expansion

Updated:
1. `src/app/api/admin/intel/route.ts`

New GET ops:
1. `op=health`
2. `op=scorecards`

New POST action:
1. `run_maintenance_cycle`

Existing token + RBAC/ABAC authorization preserved.

### 4) Admin Operator UI

Added:
1. `src/components/AdminIntelPanel.tsx`
2. `src/app/admin/intel/page.tsx`
3. Navigation link in `src/app/layout.tsx`

Capabilities:
1. Metrics/health/scorecard reads.
2. Ingestion and maintenance-cycle triggers.
3. Retention execution.
4. Eval suite execution with editable JSON sample payload.
5. Subject export/delete actions.

### 5) Tests Added

1. `tests/alerts.test.ts`
2. `tests/maintenance.test.ts`
3. Expanded `tests/admin-intel-route.test.ts` for maintenance + scorecards + health.

## Validation

1. `npm test`: 24 files, 143 tests passing.
2. `npm run lint`: clean.
3. `npx tsc --noEmit`: clean.
4. `npm run build`: successful.

## Next Recommended Slice

1. Add cron/queue scheduler integration for automatic maintenance runs.
2. Add auth session integration replacing manual token entry in `/admin/intel`.
3. Add alert notification sinks (Slack/webhook/email) for `critical` status.
