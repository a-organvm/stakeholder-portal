# Stakeholder Portal Omnipresence + Omnipotence Plan (Execution Update v6)

Date: 2026-03-05  
Scope: `stakeholder-portal`  
Reference chain:
1. `2026-03-05-omnipresence-contextual-awareness-plan.md`
2. `2026-03-05-omnipresence-contextual-awareness-plan-v2.md`
3. `2026-03-05-omnipresence-contextual-awareness-plan-v3.md`
4. `2026-03-05-omnipresence-contextual-awareness-plan-v4.md`
5. `2026-03-05-omnipresence-contextual-awareness-plan-v5.md`

## v6 Objective

Harden the newly shipped admin session + scheduler + alerting features for production-grade safety and resilience:
1. Enforce CSRF for session-authenticated admin writes.
2. Prevent duplicate overlapping maintenance runs under concurrent triggers.
3. Add retry/backoff resilience for outbound alert sinks.

## Implemented in v6

### 1) Session CSRF Hardening

Added/updated:
1. `src/lib/admin-auth.ts`
2. `src/app/api/admin/session/route.ts`
3. `src/app/api/admin/intel/route.ts`
4. `src/components/AdminIntelPanel.tsx`

Capabilities:
1. Signed admin session + CSRF cookie pair (`organvm_admin_session`, `organvm_admin_csrf`).
2. Session status endpoint now returns `csrf_token` for UI use.
3. Session-authenticated write/delete/admin actions on `/api/admin/intel` require `x-admin-csrf`.
4. Token-based automation path remains supported without CSRF requirement.
5. Admin session/login and token fallback comparisons are now constant-time.

### 2) Maintenance Single-Flight Concurrency Control

Added/updated:
1. `src/lib/maintenance.ts`
2. `src/app/api/cron/maintenance/route.ts`

Capabilities:
1. In-process single-flight guard for `runMaintenanceCycle`.
2. Concurrent triggers share one in-flight maintenance run and result.
3. Runtime state introspection via `getMaintenanceRunState`.
4. Cron response now includes whether it attached to an already-active run.

### 3) Alert Sink Retry/Backoff

Added/updated:
1. `src/lib/alert-sinks.ts`

Capabilities:
1. Per-sink retry logic for transient failures (`429`/`5xx`) and transport exceptions.
2. Configurable retry policy:
   - `ALERT_SINK_MAX_RETRIES`
   - `ALERT_SINK_RETRY_BASE_MS`
3. Dispatch result now includes `attempt_count` per sink.

### 4) Configuration + Docs Alignment

Updated:
1. `.env.example`
2. `README.md`

Coverage:
1. Added all new admin/cron/alert env variables.
2. Documented CSRF requirement for session-authenticated write actions.
3. Documented single-flight maintenance behavior and alert retry flags.

## Tests Added/Expanded

1. `tests/admin-auth.test.ts`
   - CSRF token/cookie generation and validation coverage.
2. `tests/admin-session-route.test.ts`
   - Verifies CSRF cookie issuance and session payload CSRF token.
3. `tests/admin-intel-route.test.ts`
   - Verifies session write actions fail without CSRF and pass with valid CSRF.
4. `tests/maintenance.test.ts`
   - Verifies concurrent callers share a single in-flight maintenance run.
5. `tests/alert-sinks.test.ts`
   - Verifies transient failure retries before successful dispatch.

## Validation

1. `npm test`: 28 files, 161 tests passing.
2. `npm run lint`: clean.
3. `npx tsc --noEmit`: clean.
4. `npm run build`: successful.
