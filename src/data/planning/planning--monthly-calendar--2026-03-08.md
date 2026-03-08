# Styx — Monthly Operations Calendar (2026-03-08)

Chronological reorganization of the full business organism timeline. Every item from every department, sorted by the month it needs to happen.

## Reading Guide

- **Source**: `planning--timeline-with-owners--2026-03-06.md` (reorganized by month)
- **Supplements, never replaces** the source timeline document
- **Owner codes**: AI (Claude Code), H:MN (Mobile Native), H:LC (Legal/Compliance), H:BD (Business Development), H:RO (Release Ops), H:CR (Cryptography), H:FO (Founders)
- **Dept codes**: ENG (Engineering), LEG (Legal), PRD (Product), OPS (Operations), GRO (Growth), FIN (Finance), CXS (Customer Success), B2B (Enterprise Sales)
- **Status convention**: Items spanning two months are placed in the earlier month with a span note
- **Phase gates**: Beta (Apr 30), Gamma (Jun 30), Delta (Sep 30), Omega (Dec 31)

---

## March 2026

### Phase Context
Beta begins. Foundation hardening complete. Focus: start all P0 engineering work, activate 4 department agents, make critical hires, retain counsel.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | ENG | TKT-P0-001: Real-money FBO settlement — API endpoints (settlement preview/execute/status) | AI | Not Started | F-CORE-04, F-INFRA-01 |
| 2 | ENG | TKT-P0-001: Schema — `settlement_runs` table + ledger metadata | AI | Not Started | — |
| 3 | ENG | TKT-P0-001: UI — desktop settlement status card + web admin timeline | AI | Not Started | — |
| 4 | ENG | TKT-P0-001: Tests — idempotent retry, timeout recovery, ledger invariants | AI | Not Started | — |
| 5 | ENG | TKT-P0-002: Native camera — API capture source + nonce challenge on proof upload | AI | Not Started | F-MOBILE-01 |
| 6 | ENG | TKT-P0-002: Schema — `capture_source`, `capture_nonce`, `capture_verified` | AI | Not Started | — |
| 7 | ENG | TKT-P0-002: Native Swift camera module (no gallery) | **H:MN** | Not Started | Xcode (spans Mar-Apr) |
| 8 | ENG | TKT-P0-003: KYC — API start/status endpoints, contract creation gate | AI | Not Started | F-AEGIS-05 |
| 9 | ENG | TKT-P0-003: Schema — `users.kyc_*` columns, `kyc_events` table | AI | Not Started | — |
| 10 | ENG | TKT-P0-003: UI — web/mobile KYC onboarding step | AI | Not Started | — |
| 11 | ENG | TKT-P0-003: Vendor — KYC provider selection + DPA | H:BD, H:LC | Not Started | (spans Mar-Apr) |
| 12 | ENG | TKT-P0-004: Geofence — API policy introspection endpoint, fail-closed enforcement | AI | Not Started | F-AEGIS-02 |
| 13 | ENG | TKT-P0-004: Schema — `compliance_decisions` table | AI | Not Started | — |
| 14 | ENG | TKT-P0-004: UI — state availability matrix + restricted messaging | AI | Not Started | — |
| 15 | ENG | TKT-P0-004: Tests — route-by-route geofence guard regression | AI | Not Started | — |
| 16 | ENG | TKT-P1-009: Self-exclusion — API endpoints + runtime gate | AI | Not Started | F-AEGIS-06 |
| 17 | ENG | TKT-P1-009: Schema — `self_exclusions` table | AI | Not Started | — |
| 18 | ENG | TKT-P1-009: UI — web/mobile compliance page | AI | Not Started | — |
| 19 | ENG | TKT-P1-009: Tests — guard tests for exclusion enforcement | AI | Not Started | — |
| 20 | ENG | F-AEGIS-02: Geofencing fail-closed hardening | AI | Partial (covered by TKT-P0-004) | — |
| 21 | ENG | F-AEGIS-04: Recovery protocol guardrails | AI | Partial | — |
| 22 | ENG | F-AEGIS-06: Self-exclusion & responsible use | AI | Not Started (covered by TKT-P1-009) | — |
| 23 | ENG | F-UX-02: Endowed progress ($5 onboarding bonus) | AI | Partial | — |
| 24 | ENG | F-UX-03: Dynamic downscale intervention | AI | Partial | — |
| 25 | ENG | F-UX-06: Bounded stake selection UI | AI | Partial | — |
| 26 | ENG | F-DESKTOP-04: Hash collider tool (wiring) | AI | Partial | — |
| 27 | LEG | Retain outside counsel (retainer) | H:FO | Not Started | — |
| 28 | PRD | Define beta success metrics (completion rate, NPS, 7-day retention) | Agent + H:FO | Not Started | — |
| 29 | OPS | Uptime monitoring setup (UptimeRobot or Better Uptime) | AI + H:RO | Not Started | — |
| 30 | FIN | Unit economics model v1 ($39 contract: $9 platform fee, $30 stake) | Agent + H:FO | Not Started | — |
| 31 | OPS | Apple Developer Account + TestFlight setup | H:RO, H:FO | Not Started | — |
| 32 | ENG | Hire/contract mobile native engineer (Swift) | H:FO | Not Started | Single biggest Beta blocker |
| 33 | LEG | Engage legal counsel (retainer) | H:FO | Not Started | Custody model, state matrix, whitepaper |
| 34 | ALL | Seed deep agents: `styx-legal`, `styx-finance`, `styx-product`, `styx-ops` | AI | Not Started | — |

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | Hire/contract Swift mobile native engineer | H:FO | Single biggest Beta blocker — camera module (#123, #134) |
| 2 | Retain outside legal counsel | H:FO | Required for 5+ Beta gate sign-offs |
| 3 | Apple Developer Account enrollment | H:FO, H:RO | Prerequisite for any iOS distribution |
| 4 | KYC vendor selection (Stripe Identity / Jumio / Persona) | H:BD, H:LC | DPA negotiation takes weeks |
| 5 | Define beta success metrics | H:FO | Product direction |
| 6 | Unit economics sign-off | H:FO | Revenue model validation |

### Agent Seeding Due

| Agent | Dept | Knowledge Corpus | First Task |
|-------|------|-----------------|------------|
| `styx-legal` | LEG | `docs/legal/*`, blocked handoff index, `services/geofencing.ts` | Draft App Store UGC policy checklist |
| `styx-finance` | FIN | `services/billing.ts`, Stripe docs, B2B pricing research | Build unit economics model for $39 contract |
| `styx-product` | PRD | Behavioral/psychology research, competitor teardowns, `FEATURE-BACKLOG.md` | Audit 5 critical UX flows for No-Contact recovery |
| `styx-ops` | OPS | `render.yaml`, `docker-compose.yml`, `scripts/smoke/*`, CI workflows, Terraform | Draft incident response runbook v1 |

---

## April 2026

### Phase Context
Beta gate target: **April 30, 2026**. All P0 blockers must close. Jurisdiction + payout controls enforceable. Internal dogfood begins.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | ENG | TKT-P0-001: Legal — signed custody model review | H:LC | Not Started | — |
| 2 | ENG | TKT-P0-001: Legal — processor terms review for skill-contest | H:LC, H:BD | Not Started | — |
| 3 | ENG | TKT-P0-002: Tests — nonce replay rejection, integration tests | AI + H:MN | Not Started | — |
| 4 | ENG | TKT-P0-002: Legal — App Store camera/recording disclosure checklist | H:LC | Not Started | — |
| 5 | ENG | TKT-P0-003: Tests — tier gating, provider error/retry | AI | Not Started | — |
| 6 | ENG | TKT-P0-004: Legal — counsel sign-off on state matrix | H:LC | Not Started | — |
| 7 | ENG | TKT-P0-011: Forfeit disposition policy engine + refund-only kill switch (full ticket) | AI + H:LC | Not Started | TKT-P0-001, TKT-P0-004 |
| 8 | ENG | TKT-P0-011: API — disposition policy endpoints + admin mutation | AI | Not Started | — |
| 9 | ENG | TKT-P0-011: Schema — `jurisdiction_disposition_modes` table | AI | Not Started | — |
| 10 | ENG | TKT-P0-011: UI — compliance admin panel for per-state modes | AI | Not Started | — |
| 11 | ENG | TKT-P0-011: Legal — counsel sign-off on per-state mode mapping | H:LC | Not Started | — |
| 12 | ENG | TKT-P0-011: Tests — payout outcome matrix, override rollback | AI | Not Started | — |
| 13 | ENG | TKT-P1-009: Legal — terms + responsible-use page review | H:LC | Not Started | — |
| 14 | ENG | F-LEGAL-03: State-by-state compliance toggles | AI + H:LC | Partial | — |
| 15 | ENG | F-LEGAL-04: Refund-only mode (legal contingency) | AI + H:LC | Partial (covered by TKT-P0-011) | — |
| 16 | ENG | F-LEGAL-05: Skill-based contest whitepaper | H:LC | Not Started (covered by TKT-P1-019) | — |
| 17 | LEG | Custody model sign-off (FBO escrow structure) | H:LC | Not Started | — |
| 18 | LEG | State jurisdiction matrix sign-off | H:LC | Not Started | — |
| 19 | LEG | Skill-contest whitepaper draft + review | Agent + H:LC | Not Started | — |
| 20 | LEG | App Store UGC moderation policy | Agent + H:LC | Not Started | — |
| 21 | PRD | No-Contact recovery UX audit (5 critical task flows) | Agent | Not Started | — |
| 22 | OPS | Render starter to production plan upgrade path | H:RO + H:FO | Not Started | — |
| 23 | OPS | Database backup policy + tested restore | AI + H:RO | Not Started | — |
| 24 | OPS | Incident response runbook v1 | Agent + H:FO | Not Started | — |
| 25 | OPS | Monitoring + alerting setup (Sentry done + uptime + PagerDuty) | AI + H:RO | Not Started | — |
| 26 | FIN | Stripe production account setup | H:FO | Not Started | — |
| 27 | CXS | Support channel setup (email + Discord) | H:FO | Not Started | — |
| 28 | GRO | Seed user recruitment plan (Reddit, breakup communities) | Agent + H:FO | Not Started | — |
| 29 | OPS | Internal dogfood beta (founders + 5-10 trusted) | H:FO | Not Started | — |

### Blocked Handoffs Due This Month (Beta Gate)

| Issue | Description | Owner | Status |
|-------|-------------|-------|--------|
| [#123](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/123) | Native iOS/Android camera module | H:MN | Not Started |
| [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132) | KYC / identity verification integration | H:LC | Not Started |
| [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133) | High-risk merchant account for production settlement | H:LC, H:BD | Not Started |
| [#134](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/134) | Native mobile blockers: HealthKit + secure camera | H:MN | Not Started |
| [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136) | Skill-based contest whitepaper + counsel sign-off | H:LC | Not Started |
| [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141) | App Store Connect + TestFlight provisioning | H:MN, H:RO | Not Started |
| [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146) | App Store UGC moderation policy + submission package | H:LC, H:RO | Not Started |

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | Custody model sign-off | H:LC | Beta gate requirement |
| 2 | State jurisdiction matrix sign-off | H:LC | Beta gate requirement |
| 3 | Skill-contest whitepaper review | H:LC | Beta gate requirement |
| 4 | Processor terms review | H:LC, H:BD | Beta gate requirement |
| 5 | Stripe production account setup | H:FO | Real-money settlement prerequisite |
| 6 | Render production upgrade decision | H:FO, H:RO | Scaling before beta users |
| 7 | Support channel setup | H:FO | Needed before external testers |
| 8 | Beta go/no-go decision (Apr 30) | H:FO | Phase gate approval |

### Readiness Checklist: Before TestFlight Beta (Target: End of April)

- [ ] Sentry error monitoring active (already done)
- [ ] Uptime monitoring (UptimeRobot / Better Uptime)
- [ ] Beta feedback channel (Discord or dedicated email)
- [ ] Render starter plan to production plan upgrade
- [ ] Database backup policy verified + tested restore
- [ ] `scripts/smoke/beta-readiness.sh` passes with `REQUIRE_TARGETS=true`
- [ ] Apple Developer Account + TestFlight provisioned (Issue #141)

### Hiring Due

| Role | Scenario | Why |
|------|----------|-----|
| Mobile Native Engineer (Swift) — contract | ALL scenarios | Camera module, HealthKit — Beta gate blocker (#123, #134). Should already be in-seat from March. |
| Legal Counsel (retainer) | ALL scenarios | Should already be retained from March. |

---

## May 2026

### Phase Context
Gamma begins. TestFlight external beta launches (50-100 users). Proof integrity hardening: health data bridges, video pipeline, identity redaction.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | ENG | TKT-P1-007: Native iOS HealthKit Swift bridge | **H:MN** | Not Started | Xcode |
| 2 | ENG | TKT-P1-013: UI — proof capture processing states | AI | Not Started | — |
| 3 | ENG | TKT-P1-014: UI — Fury workbench masked display | AI | Not Started | — |
| 4 | ENG | TKT-P1-008: UI — admin collusion cluster screen | AI | Not Started | — |
| 5 | ENG | TKT-P1-015: API — enforcement evaluate + appeals workflow | AI | Not Started | TKT-P1-008 |
| 6 | ENG | TKT-P1-015: Schema — `fury_enforcement_cases`, `fury_penalties` | AI | Not Started | — |
| 7 | ENG | F-MOBILE-01: Native camera full module (Swift/Kotlin) | H:MN | Stub | (spans May-Jun) |
| 8 | PRD | User interview protocol (10 beta testers) | Agent + H:FO | Not Started | — |
| 9 | OPS | Load testing (target: 500 concurrent users) | AI | Not Started | — |
| 10 | FIN | Financial reconciliation process (ledger <> Stripe) | Agent + AI | Not Started | — |
| 11 | GRO | Landing page copy + conversion funnel | Agent + H:FO | Not Started | — |
| 12 | GRO | Seed user recruitment begins (Reddit, breakup communities, therapist referrals) | H:FO | Not Started | — |
| 13 | OPS | TestFlight external beta (50-100 users) launch | H:RO, H:FO | Not Started | — |

### Blocked Handoffs Active This Month (Due Jun 30)

| Issue | Description | Owner | Due | Status |
|-------|-------------|-------|-----|--------|
| [#124](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/124) | HealthKit native bridge (iOS) | H:MN | 2026-06-30 | Not Started |
| [#125](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/125) | Google Health Connect bridge (Android) | H:MN | 2026-06-30 | Not Started |
| [#126](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/126) | Fitbit/WHOOP API integration | H:BD | 2026-06-30 | Not Started |
| [#148](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/148) | Cross-jurisdictional consent matrix counsel review | H:LC | 2026-06-30 | Not Started |

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | User interview protocol approval | H:FO | First real-user feedback loop |
| 2 | TestFlight external beta launch decision | H:FO, H:RO | First non-founders on the platform |
| 3 | Landing page direction | H:FO | Growth positioning |

### Hiring Due

| Role | Scenario | Why |
|------|----------|-----|
| Kotlin contractor (short engagement) | Conservative | Android bridge for Gamma parity |
| Mobile Native (Kotlin) — contract or PT | Moderate | Android parity for Gamma |
| Mobile Native (Kotlin) — FT | Aggressive | Full Android parity |
| QA / Beta Coordinator — PT | Moderate | Manage TestFlight cohort, triage feedback |
| QA / Beta Coordinator — FT | Aggressive | Testing + feedback ops |

---

## June 2026

### Phase Context
Gamma gate target: **June 30, 2026**. Trust network hardening complete. Collusion enforcement live. Beta feedback synthesis.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | ENG | TKT-P1-007: Native Android Google Health Connect Kotlin bridge | **H:MN** | Not Started | Android Studio |
| 2 | ENG | TKT-P1-015: UI — admin enforcement + appeal panel | AI | Not Started | — |
| 3 | ENG | TKT-P1-015: Legal — internal reviewer sanctions + appeal rights policy | H:LC | Not Started | — |
| 4 | ENG | TKT-P1-015: Tests — honey-trap simulation, false-positive rollback | AI | Not Started | — |
| 5 | ENG | F-CORE-09: Finish line spike (double stake) | AI | Not Started | — |
| 6 | LEG | Cross-jurisdictional consent matrix | Agent + H:LC | Not Started | — |
| 7 | LEG | Reviewer sanctions + appeal rights policy | Agent + H:LC | Not Started | — |
| 8 | CXS | FAQ / Help Center v1 (10 articles) | Agent | Not Started | — |
| 9 | PRD | Beta feedback synthesis + iteration | AI + H:FO | Not Started | — |

### Gamma Gate Checklist (June 30)

Must be true before gate closes:
- [ ] Proof submissions have end-to-end processing traceability
- [ ] Reviewer workflow does not expose identity artifacts for masked classes
- [ ] Collusion prevention and enforcement are both active, not just detection-only
- [ ] Issues #124, #125, #126, #148 resolved

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | Reviewer sanctions policy sign-off | H:LC | Gamma gate requirement |
| 2 | Cross-jurisdictional consent matrix sign-off | H:LC | Gamma gate requirement |
| 3 | Gamma go/no-go decision (Jun 30) | H:FO | Phase gate approval |

---

## July 2026

### Phase Context
Delta begins. Real-money pilot launches (10-25 users). Retention + network effects: recovery protections, weekend multipliers, accountability partners, push notifications.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | ENG | TKT-P1-005: Recovery danger-zone lockdowns + 24h timelock (full ticket) | AI | Not Started | F-AEGIS-04, F-CORE-11 |
| 2 | ENG | TKT-P1-005: API — break-request/cancel/lock-status endpoints | AI | Not Started | — |
| 3 | ENG | TKT-P1-005: Schema — `recovery_break_requests` table | AI | Not Started | — |
| 4 | ENG | TKT-P1-005: UI — mobile cooldown countdown + dashboard danger-zone banners | AI | Not Started | — |
| 5 | ENG | TKT-P1-005: Tests — scheduler tests, Day 3/21 lock-window policy | AI | Not Started | — |
| 6 | ENG | TKT-P1-012: Weekend multiplier policy engine (full ticket) | AI | Not Started | F-CORE-10 |
| 7 | ENG | TKT-P1-012: API — attestation risk-window metadata + penalty preview | AI | Not Started | — |
| 8 | ENG | TKT-P1-012: Schema — `contract_penalty_windows` table | AI | Not Started | — |
| 9 | ENG | TKT-P1-012: UI — weekend risk badge + explicit penalty delta | AI | Not Started | — |
| 10 | ENG | TKT-P1-012: Tests — timezone/DST boundary, penalty parity | AI | Not Started | — |
| 11 | ENG | TKT-P1-017: Accountability partner protocol — API endpoints | AI | Not Started | F-SOCIAL-01 |
| 12 | ENG | TKT-P1-017: Schema — `accountability_partner_events`, status enum hardening | AI | Not Started | — |
| 13 | ENG | TKT-P1-006: Push pipeline — API push register hardening + dispatch job API | AI | Not Started | F-MOBILE-03 |
| 14 | ENG | TKT-P1-006: Schema — `push_tokens`, `push_deliveries` | AI | Not Started | — |
| 15 | ENG | TKT-P1-006: Native — APNs certificate + FCM config | **H:MN, H:RO** | Not Started | Apple/Google creds (spans Jul-Aug) |
| 16 | OPS | CDN/WAF production config verification | AI | Not Started | — |
| 17 | GRO | Content calendar (4 posts/month) | Agent | Not Started | — |
| 18 | CXS | Onboarding email sequence (7-day drip) | Agent | Not Started | — |
| 19 | FIN | Real-money pilot launch (10-25 users) — first real dollar through system | H:FO, H:LC | Not Started | — |

### Agent Seeding Due (Delta Prep)

| Agent | Dept | Knowledge Corpus | First Task |
|-------|------|-----------------|------------|
| `styx-growth` | GRO | Market analysis docs, competitor teardowns, demographic data | SEO keyword research (10 targets for No-Contact recovery niche) |
| `styx-support` | CXS | `behavioral-logic.ts`, `FEATURE-BACKLOG.md`, beta-readiness contract | Draft FAQ v1 (10 articles) |

### Readiness Checklist: Before Real-Money Pilot

- [ ] Stripe production keys configured
- [ ] High-risk merchant account active (Issue #133)
- [ ] Incident response runbook written
- [ ] Financial reconciliation process documented (ledger <> Stripe)
- [ ] Legal counsel on-call for compliance questions
- [ ] `scripts/validation/01-phantom-money-check.ts` passing in production

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | Real-money pilot go/no-go | H:FO, H:LC | First actual money through system |
| 2 | APNs/FCM credential provisioning | H:RO | Push pipeline dependency |

### Hiring Due

| Role | Scenario | Why |
|------|----------|-----|
| Growth / Community Manager | Aggressive | Earlier community building |

---

## August 2026

### Phase Context
Delta continues. Open beta expansion (500+ users). Accountability partner lifecycle, endowed progress, identity onboarding, push notification settings.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | ENG | TKT-P1-017: UI — contract detail partner lifecycle | AI | Not Started | — |
| 2 | ENG | TKT-P1-017: Legal — disclosure review for partner authority | H:LC | Not Started | — |
| 3 | ENG | TKT-P1-017: Tests — invite/respond/veto E2E, permission tests | AI | Not Started | — |
| 4 | ENG | TKT-P1-010: Endowed progress + downscale UX completion (full ticket) | AI | Not Started | F-UX-02, F-UX-03 |
| 5 | ENG | TKT-P1-010: API — progress-model endpoint | AI | Not Started | — |
| 6 | ENG | TKT-P1-010: Schema — `contract_progress_events` table | AI | Not Started | — |
| 7 | ENG | TKT-P1-010: UI — bounded stake selector + progress visualization | AI | Not Started | — |
| 8 | ENG | TKT-P1-010: Tests — UI contract creation + progress integration | AI | Not Started | — |
| 9 | ENG | TKT-P1-016: Identity-based oath onboarding flow (full ticket) | AI | Not Started | F-UX-01 |
| 10 | ENG | TKT-P1-016: API — identity-oath persist/resume endpoints | AI | Not Started | — |
| 11 | ENG | TKT-P1-016: Schema — `user_identity_oaths` table | AI | Not Started | — |
| 12 | ENG | TKT-P1-016: UI — web/mobile onboarding wizard | AI | Not Started | — |
| 13 | ENG | TKT-P1-016: Tests — resume/completion, copy variant determinism | AI | Not Started | — |
| 14 | ENG | TKT-P1-018: API — dashboard progress aggregate + leaderboard SSE | AI | Not Started | F-UX-05, F-WEB-04 |
| 15 | ENG | TKT-P1-006: UI — mobile notification settings | AI | Not Started | — |
| 16 | ENG | F-AEGIS-08: RAIN mindfulness notifications | AI | Not Started | — |
| 17 | ENG | F-UX-05: Daily dashboard goal-gradient visualization | AI | Partial (covered by TKT-P1-018) | — |
| 18 | LEG | Partner authority disclosure review | H:LC | Not Started | — |
| 19 | OPS | APNs/FCM credential management | H:RO | Not Started | — |
| 20 | GRO | SEO strategy (10 target keywords for No-Contact recovery) | Agent | Not Started | — |
| 21 | PRD | Feature prioritization from usage analytics | Agent + H:FO | Not Started | — |
| 22 | FIN | CAC/LTV tracking dashboard | Agent | Not Started | — |
| 23 | GRO | Open beta expansion (500+ users) — wider TestFlight + web access | H:FO | Not Started | — |

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | Partner authority disclosure sign-off | H:LC | Legal requirement for accountability partner feature |
| 2 | Feature prioritization from real usage data | H:FO | Data-driven product direction |
| 3 | Open beta expansion go/no-go | H:FO | Scaling user base |

---

## September 2026

### Phase Context
Delta gate target: **September 30, 2026**. Behavioral flywheel must be live and measurable. App Store submission. Enterprise sales prep begins.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | ENG | TKT-P1-018: Schema — `leaderboard_events`, `dashboard_progress_snapshots` | AI | Not Started | — |
| 2 | ENG | TKT-P1-018: UI — multi-layer goal-gradient + tavern SSE leaderboard | AI | Not Started | — |
| 3 | ENG | TKT-P1-018: Tests — SSE reconnect/fallback, snapshot contract | AI | Not Started | — |
| 4 | ENG | TKT-P1-006: Tests — provider mock, invalid token demotion | AI | Not Started | — |
| 5 | ENG | F-AEGIS-09: Ostrich effect detection | AI | Not Started | — |
| 6 | ENG | F-WEB-04: Real-time leaderboard (SSE) | AI | Partial (covered by TKT-P1-018) | — |
| 7 | GRO | Referral program design (endowed invite credits) | Agent + H:FO | Not Started | — |
| 8 | CXS | Churn signal detection (Ostrich Effect patterns) | Agent + AI | Not Started | — |
| 9 | B2B | Identify 50 target therapists/coaches (ICP definition) | Agent + H:FO | Not Started | — |
| 10 | OPS | App Store submission | H:RO, H:LC | Not Started | Full review package with UGC policy |

### Blocked Handoffs Due This Month (Delta Gate)

| Issue | Description | Owner | Due | Status |
|-------|-------------|-------|-----|--------|
| [#127](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/127) | Remote push notifications setup (APNs/FCM) | H:MN, H:RO | 2026-09-30 | Not Started |
| [#135](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/135) | Video pipeline + native dashboard UI blockers | H:RO | 2026-09-30 | Not Started |

### Delta Gate Checklist (September 30)

Must be true before gate closes:
- [ ] Recovery-path protections are fully operational
- [ ] Core retention loop is visible and continuous (onboarding -> progress -> reminders -> social proof)
- [ ] Engagement systems are live with resilient fallback behavior
- [ ] Issues #127, #135 resolved

### Agent Seeding Due (Omega Prep)

| Agent | Dept | Knowledge Corpus | First Task |
|-------|------|-----------------|------------|
| `styx-enterprise` | B2B | B2B expansion research, competitor coaching software pricing | Define ICP for therapist/coach market |

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | App Store submission approval | H:RO, H:LC | Full review package required |
| 2 | Referral program design approval | H:FO | Growth mechanics |
| 3 | ICP definition for B2B | H:FO | Enterprise strategy direction |
| 4 | Delta go/no-go decision (Sep 30) | H:FO | Phase gate approval |

### Hiring Due

| Role | Scenario | Why |
|------|----------|-----|
| Growth / Community Manager | Moderate | Pre-launch community, support, content |
| Enterprise Sales / BD | Aggressive | B2B pilot outreach to therapists/coaches |

---

## October 2026

### Phase Context
Omega begins. **App Store launch (public)**. Enterprise packaging: compliance artifacts, whitepaper release gate, HR dashboard, B2B orchestration. Growth marketing kickoff.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | ENG | TKT-P1-019: API — compliance artifact metadata endpoint | AI | Not Started | F-LEGAL-05 |
| 2 | ENG | TKT-P1-019: Schema — `compliance_artifacts` table | AI | Not Started | — |
| 3 | ENG | TKT-P1-019: UI — legal site section with artifact + jurisdiction matrix | AI | Not Started | — |
| 4 | ENG | TKT-P1-019: Legal — counsel approval + dated signature per version | **H:LC** | Not Started | (spans Oct-Nov) |
| 5 | LEG | SOC 2 Type I audit initiation | H:LC + H:FO | Not Started | — |
| 6 | PRD | Enterprise UX audit (HR dashboard, coach dashboard) | Agent | Not Started | — |
| 7 | OPS | Load testing (target: 5,000 concurrent users) | AI | Not Started | — |
| 8 | FIN | B2B pricing model ($49/$149/$349 tiers per research doc) | Agent + H:FO | Not Started | — |
| 9 | GRO | PR strategy for App Store launch | Agent + H:FO | Not Started | — |
| 10 | B2B | Outreach sequence (email + LinkedIn) | Agent + H:BD | Not Started | — |
| 11 | B2B | Enterprise demo environment provisioned | AI | Not Started | — |
| 12 | OPS | App Store launch (public) — general availability | H:RO | Not Started | — |
| 13 | GRO | Growth marketing kickoff (content, SEO, therapist partnerships) | H:FO | Not Started | — |

### Readiness Checklist: Before App Store Launch

- [ ] Apple App Review submission package (UGC policy, privacy nutrition label)
- [ ] Customer support email/system operational
- [ ] Terms of Service + Privacy Policy counsel-approved
- [ ] GDPR data export/deletion tested in production
- [ ] Load testing completed (target: 1,000 concurrent users)
- [ ] CDN/WAF production config verified (`scripts/infra/waf-rules.sh`)
- [ ] `scripts/validation/04-redacted-build-check.sh` + `scripts/gatekeeper-scan.sh` passing

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | SOC 2 audit initiation | H:FO, H:LC | Enterprise credibility |
| 2 | B2B pricing finalization | H:FO | Revenue model for enterprise tier |
| 3 | App Store launch go/no-go | H:RO | Public availability |
| 4 | PR strategy approval | H:FO | Launch positioning |

### Hiring Due

| Role | Scenario | Why |
|------|----------|-----|
| DevOps / SRE — PT | Aggressive | Production reliability at scale |
| Content / Marketing | Aggressive | SEO, social, PR for App Store launch |

---

## November 2026

### Phase Context
Omega continues. First enterprise pilot (1-3 practitioners). HR dashboard and B2B orchestration panel ship. Enterprise security posture preparation.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | ENG | TKT-P1-019: CI — release gate for missing/expired artifact | AI | Not Started | — |
| 2 | ENG | TKT-P1-019: Tests — artifact hash mismatch rejection | AI | Not Started | — |
| 3 | ENG | F-WEB-03: HR dashboard (role-based access + org authz) | AI | Partial | F-B2B-01 |
| 4 | ENG | F-DESKTOP-05: B2B orchestration panel (billing + scopes) | AI | Partial | F-B2B-01 |
| 5 | LEG | Enterprise DPA template | Agent + H:LC | Not Started | — |
| 6 | OPS | Auto-scaling + cost alerting | AI + H:RO | Not Started | — |
| 7 | FIN | Revenue reporting (MRR, churn, ARPU) | Agent | Not Started | — |
| 8 | GRO | Therapist/coach partnership outreach templates | Agent + H:BD | Not Started | — |
| 9 | B2B | Security questionnaire template | Agent + H:LC | Not Started | — |
| 10 | B2B | First pilot onboarding (1-3 practitioners) | H:BD + H:FO | Not Started | — |
| 11 | CXS | In-app help / chatbot | Agent + AI | Not Started | — |

### Readiness Checklist: Before Enterprise Sales

- [ ] SOC 2 Type I audit initiated (or roadmap documented)
- [ ] Enterprise security questionnaire template ready
- [ ] SLA document drafted
- [ ] Data processing agreement (DPA) template ready
- [ ] Enterprise demo environment provisioned on Render
- [ ] HR dashboard (F-WEB-03) and B2B orchestration panel (F-DESKTOP-05) functional

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | Enterprise DPA review | H:LC | Required for B2B contracts |
| 2 | First pilot practitioner selection | H:BD, H:FO | B2B2C validation |
| 3 | SLA terms | H:FO | Enterprise commitment |

---

## December 2026

### Phase Context
Omega gate target: **December 31, 2026**. Enterprise packaging and legal release controls complete. Enterprise pricing goes live. Year-end targets assessed.

### All Items This Month

| # | Dept | Item | Owner | Status | Deps / Blocked By |
|---|------|------|-------|--------|-------------------|
| 1 | LEG | Prize indemnity insurance evaluation | H:LC + H:BD | Not Started | — |
| 2 | B2B | Enterprise pricing live ($49/$149/$349 tiers) | H:FO + H:BD | Not Started | — |
| 3 | FIN | Revenue reporting: EOY MRR, churn, ARPU | Agent | Not Started | — |

### Blocked Handoffs Due This Month (Omega Gate)

| Issue | Description | Owner | Due | Status |
|-------|-------------|-------|-----|--------|
| [#128](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/128) | Biometric lock (voice/face) | H:MN | 2026-12-31 | Not Started |
| [#129](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/129) | Plaid Link integration | H:BD | 2026-12-31 | Not Started |
| [#130](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/130) | EVM smart contract escrow | H:CR | 2026-12-31 | Not Started |
| [#131](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/131) | ZKP milestone verification | H:CR | 2026-12-31 | Not Started |
| [#137](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/137) | Prize indemnity insurance procurement | H:LC | 2026-12-31 | Not Started |
| [#138](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/138) | Web shop payment routing + Apple neutral notice | H:LC, H:RO | 2026-12-31 | Not Started |
| [#139](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/139) | "Styx-Certified" hardware partnership program | H:BD | 2026-12-31 | Not Started |
| [#140](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/140) | Insurance cross-pollination partnership | H:BD | 2026-12-31 | Not Started |
| [#142](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/142) | C2PA content provenance + TSA infrastructure | H:CR | 2026-12-31 | Not Started |
| [#143](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/143) | Continuous mobile app attestation SDK procurement | H:MN | 2026-12-31 | Not Started |
| [#144](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/144) | ZK privacy layer for digital exhaust | H:CR | 2026-12-31 | Not Started |
| [#147](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/147) | Stablecoin stakes regulatory + banking pathway | H:LC, H:BD | 2026-12-31 | Not Started |

### Omega Gate Checklist (December 31)

Must be true before gate closes:
- [ ] Counsel-approved artifact trail is tied to release controls
- [ ] Enterprise package has clear compliance posture, reporting surface, and billing model
- [ ] Platform can support procurement conversations with evidence-backed controls

### Human Decisions Required This Month

| # | Item | Owner | Why Critical |
|---|------|-------|-------------|
| 1 | Enterprise pricing go-live | H:FO, H:BD | Revenue activation |
| 2 | Prize indemnity insurance decision | H:LC, H:BD | Future feature unlock |
| 3 | Omega go/no-go decision (Dec 31) | H:FO | Phase gate approval |

---

## Summary Tables

### Human Work by Month

| Month | H:FO | H:LC | H:MN | H:BD | H:RO | H:CR |
|-------|------|------|------|------|------|------|
| Mar | 6 | 0 | 0 | 1 | 1 | 0 |
| Apr | 4 | 7 | 2 | 2 | 3 | 0 |
| May | 2 | 0 | 2 | 1 | 1 | 0 |
| Jun | 1 | 2 | 1 | 0 | 0 | 0 |
| Jul | 1 | 0 | 1 | 0 | 1 | 0 |
| Aug | 2 | 1 | 0 | 0 | 1 | 0 |
| Sep | 2 | 1 | 1 | 0 | 1 | 0 |
| Oct | 3 | 2 | 0 | 1 | 1 | 0 |
| Nov | 2 | 2 | 0 | 2 | 0 | 0 |
| Dec | 2 | 2 | 2 | 4 | 1 | 4 |

### Phase Gates

| Gate | Date | Key Blockers |
|------|------|-------------|
| Beta | Apr 30, 2026 | H:MN (Swift camera #123), H:LC (custody + whitepaper #132/#136), H:BD (merchant account #133), H:RO (TestFlight #141) |
| Gamma | Jun 30, 2026 | H:MN (HealthKit #124, Health Connect #125), H:BD (Fitbit/WHOOP #126), H:LC (consent matrix #148) |
| Delta | Sep 30, 2026 | H:MN + H:RO (push notifications #127), H:RO (video pipeline #135) |
| Omega | Dec 31, 2026 | H:LC (whitepaper release gate, insurance #137), H:CR (EVM #130, ZKP #131, C2PA #142, ZK privacy #144), H:BD (Plaid #129, hardware #139, insurance #140) |

### Blocked Handoffs — All 25 Issues by Gate

| Gate | Issues | Count |
|------|--------|-------|
| Beta (Apr 30) | #123, #132, #133, #134, #136, #141, #146 | 7 |
| Gamma (Jun 30) | #124, #125, #126, #148 | 4 |
| Delta (Sep 30) | #127, #135 | 2 |
| Omega (Dec 31) | #128, #129, #130, #131, #137, #138, #139, #140, #142, #143, #144, #147 | 12 |
| **Total** | | **25** |

### Department Activation Timeline

| Dept | Activates | Peak Month | Agent Seeded |
|------|-----------|-----------|-------------|
| ENG | Alpha (done) | Mar-Apr | Already active |
| LEG | Alpha (done) | Apr | Mar 2026 |
| PRD | Beta (Mar) | Apr-May | Mar 2026 |
| OPS | Beta (Mar) | Apr | Mar 2026 |
| FIN | Beta (Mar) | Mar-Apr | Mar 2026 |
| GRO | Delta (Jul) | Sep-Oct | Jul 2026 |
| CXS | Delta (Jul) | Jul-Sep | Jul 2026 |
| B2B | Omega (Oct) | Nov | Sep 2026 |

### Hiring Timeline (All Scenarios)

| Month | Role | Conservative | Moderate | Aggressive |
|-------|------|-------------|----------|-----------|
| Mar | Swift contractor | Required | Required | Required |
| Mar | Legal counsel (retainer) | Required | Required | Required |
| May | Kotlin contractor | Short engagement | PT | FT |
| May | QA / Beta Coordinator | — | PT | FT |
| Jul | Growth / Community Manager | — | — | Yes |
| Sep | Growth / Community Manager | — | Yes | (already hired) |
| Sep | Enterprise Sales / BD | — | — | Yes |
| Oct | DevOps / SRE | — | — | PT |
| Oct | Content / Marketing | — | — | Yes |

### Agent Seeding Schedule

| Month | Agents |
|-------|--------|
| Mar 2026 | `styx-legal`, `styx-finance`, `styx-product`, `styx-ops` |
| Jul 2026 | `styx-growth`, `styx-support` |
| Sep 2026 | `styx-enterprise` |

---

*Generated 2026-03-08. Source: `planning--timeline-with-owners--2026-03-06.md` + `planning--blocked-handoff-index--latest.md` + `planning--roadmap--alpha-to-omega--definitive--2026-03-04.md`. This document supplements — never replaces — the source timeline.*
