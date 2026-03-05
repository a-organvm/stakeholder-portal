# Stakeholder Portal Omnipresence + Omnipotence Plan (Execution Update v5)

Date: 2026-03-05  
Scope: `stakeholder-portal`

## v5 Objective

Complete three requested propulsion items:
1. Wire real scheduled maintenance trigger.
2. Add outbound critical alert sinks.
3. Replace manual `/admin/intel` token entry with session-based auth.

## Implemented

### 1) Scheduled/Cron Trigger

1. Added cron API route:
   - `src/app/api/cron/maintenance/route.ts`
2. Added scheduled GitHub workflow:
   - `.github/workflows/maintenance-cron.yml`
3. Workflow runs hourly and executes:
   - `npm run maintenance:run -- --incremental --connectors "$MAINTENANCE_CONNECTORS"`

### 2) Outbound Critical Alert Sinks

1. Added sink dispatcher:
   - `src/lib/alert-sinks.ts`
2. Integrated into maintenance cycle:
   - `src/lib/maintenance.ts` (`alert_dispatch` summary in scorecards)
3. Supported sinks:
   - Generic webhook (`ALERT_WEBHOOK_URL`)
   - Slack webhook (`SLACK_WEBHOOK_URL`)
   - Email via Resend (`RESEND_API_KEY`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM`)

### 3) Session-Based Admin Access

1. Added signed admin session helper:
   - `src/lib/admin-auth.ts`
2. Added admin session endpoints:
   - `src/app/api/admin/session/route.ts`
3. Updated admin intel route to use session-first auth with token fallback:
   - `src/app/api/admin/intel/route.ts`
4. Added login UX and guarded admin access:
   - `src/app/admin/login/page.tsx`
   - `src/components/AdminLoginForm.tsx`
   - `src/app/admin/intel/page.tsx` (redirect to login if no valid session)
   - `src/components/AdminIntelPanel.tsx` (session-backed operations, logout)

### 4) CLI and Docs

1. Maintenance CLI now supports:
   - `--connectors`
   - `--no-alerts`
2. Updated docs with session/cron/sink configuration and usage:
   - `README.md`

## Tests Added/Expanded

1. `tests/admin-auth.test.ts`
2. `tests/admin-session-route.test.ts`
3. `tests/alert-sinks.test.ts`
4. `tests/cron-maintenance-route.test.ts`
5. Expanded `tests/admin-intel-route.test.ts` for session-cookie auth

## Validation

1. `npm test`: 28 files, 155 tests passing.
2. `npm run lint`: clean.
3. `npx tsc --noEmit`: clean.
4. `npm run build`: successful.
