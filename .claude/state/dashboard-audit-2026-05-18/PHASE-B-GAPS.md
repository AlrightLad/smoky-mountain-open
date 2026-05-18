# PHASE-B-GAPS — dashboard.html cross-surface P9 audit — 2026-05-18 (session 2)

## Methodology

Per spec P9.1-P9.3 + PHASE B sub-phases B1-B7 + DONE WHEN D32-D34. The Founder Verification Packet (`task-queue/founder/dashboard-completion-verification.md`) identified a P9 gap on dashboard.html in session 1 — "~15 cards with 0 / — / Loading..." observed. This document is the surface-by-surface audit that closes that gap.

Method:
1. Read `templates/dashboards/dashboard.template.html` (1148 lines) for every consumer JS selector + data path.
2. Read `scripts/regen-dashboard.py` (1525 lines) for the data producer.
3. Read every aggregate JSON in `.claude/state/aggregates/` + `.claude/state/telemetry/aggregates/` + `.claude/state/quota-status.json`.
4. Re-regen + Playwright capture of `docs/reports/dashboard.html`.
5. Cross-compare displayed value vs underlying source per P9.1.

Fresh capture: `scripts/visual-audit/dashboard/dashboard-desktop.png` (post-regen, 2026-05-18).

## Producer/consumer parity matrix (P9.3)

| Aggregate JSON | Producer | Consumer (regen-dashboard.py) | Parity status |
|---|---|---|---|
| `current-snapshot.json` | `scripts/aggregate-telemetry.py` | `build_dashboard_data()` reads `snap` for weekly_tokens, ships_this_week, halts_this_week, fiq_depth, quota_status, manual_quota_latest, trend arrays | ⚠ **STALE for token fields** — does NOT include session transcripts. weekly_tokens=102,000 reflects pre-T1 state |
| `token-usage-snapshot.json` | `scripts/aggregate-token-usage.py` (includes session-transcripts via T1) | `build_dashboard_data()` reads only the today-bucket for `daily_tokens` (line 1447-1453) | ✅ MATCH (limited scope — only daily) |
| `test-health.json` | regen-all.sh failure tracker | `read_health_banner("test")` via `build_founder_queue()` → `system_health.test_health` → DOM `[data-fq-banner-summary="test"]` | ✅ MATCH (status=yellow rendering correctly) |
| `security-health.json` | TBD (Phase B2 — currently disconnected from AgentShield) | `read_health_banner("security")` → `system_health.security_health` → DOM `[data-fq-banner-summary="security"]` | ✅ MATCH (status=red rendering correctly; **BUT NOT YET WIRED to AgentShield baseline** per spec B2) |
| `approvals-pipeline.json` | `scripts/aggregate-approvals-pipeline.py` + `approvals_pipeline_status()` local derive | `approvals_pipeline_status()` → `system_health.approvals_pipeline` | ✅ MATCH (status=green, 32 in inbox displayed correctly) |
| `architecture-review.json` | (TBD — AI Engineer agent) + `architecture_review_status()` local | `architecture_review_status()` → `system_health.architecture_review` | ✅ MATCH (status=unknown, 0 pending shown correctly per spec B4 empty state) |
| `fiq-status.json` | Firebase index queue scanner | `snap.fiq_depth` (in current-snapshot.json via `aggregate-telemetry.py`) | ✅ MATCH (declared_count=26 = deployed_count=26, pending=0; FIQ depth 0 is truthful) |
| `quota-status.json` | sidecar.ps1 (PROP-003.a) | `snap.quota_status` (merged by aggregate-telemetry.py) | ⚠ **STALE for token fields** — sidecar derives weekly_tokens from cron-log events (not session transcripts), so quota_status.weekly_tokens=102,000 |
| `goal-status.json` | cron post-commit hook | (none — not consumed by dashboard.html directly) | N/A (consumed by other surfaces) |

## Per-card gap analysis

Cards confirmed TRUTHFUL on fresh dashboard.html capture (no fix needed):

| Card | DOM selector | Source | Displayed | Status |
|---|---|---|---|---|
| Amendments Pending (founder queue) | `[data-fq="amendments-pending"]` | `data.founder_queue.queue.amendments_pending` | 0 | ✅ TRUTHFUL |
| Bubbles Flagged | `[data-fq="bubbles-flagged"]` | `data.founder_queue.queue.bubbles_flagged` | 0 | ✅ TRUTHFUL |
| Proposals Pending | `[data-fq="proposals-pending"]` | `data.founder_queue.queue.proposals_pending` | 0 | ✅ TRUTHFUL |
| Open Escalations | `[data-fq="escalations-count"]` | `data.founder_queue.queue.open_escalations` | 0 | ✅ TRUTHFUL |
| Test Health (banner) | `[data-fq-banner-summary="test"]` | test-health.json via `read_health_banner` | yellow + summary | ✅ TRUTHFUL |
| Security Health (banner) | `[data-fq-banner-summary="security"]` | security-health.json | red + summary | ⚠ TRUTHFUL but NOT wired to AgentShield baseline (spec B2 future) |
| Approvals Pipeline (banner) | `[data-fq-banner-summary="approvals"]` | `approvals_pipeline_status()` local | green + summary | ✅ TRUTHFUL |
| Architecture Review (banner) | `[data-fq-banner-summary="architecture"]` | `architecture_review_status()` local | unknown + 0 pending | ✅ TRUTHFUL (intentional empty state per spec B4) |
| Working Tree | `[data-fq="working-tree"]` | `working_tree_status()` | dirty (39 files) | ✅ TRUTHFUL |
| Round-Trip Last Pass | `[data-fq="round-trip"]` | `last_regen_all_status()` | "unknown" + "watcher cycling" | ⚠ Subtitle "watcher cycling" doesn't show ts — spec B5 STALE indicator partial |
| Active Halts | `[data-fq="halts-count"]` | `active_halts()` | 0 + "no active halts" | ✅ TRUTHFUL |
| Tokens Today | `[data-kpi="daily-tokens"]` | token-usage-snapshot.json by_day today bucket | 127.45M | ✅ TRUTHFUL (computed from session transcripts) |
| Ships This Week | `[data-kpi="ships-week"]` | `snap.ships_this_week` | 32 | ✅ TRUTHFUL |
| Halts This Week | `[data-kpi="halts-week"]` | `snap.halts_this_week` | 0 | ✅ TRUTHFUL |
| FIQ Depth | `[data-kpi="fiq-depth"]` | `snap.fiq_depth` | 0 | ✅ TRUTHFUL (legitimate zero — no pending index builds) |
| Cycles Complete | `[data-kpi="cycles-complete"]` | `sumDataset('Complete')` from cycle_outcomes_7d | 1 | ✅ TRUTHFUL |
| Cycles Paused | `[data-kpi="cycles-paused"]` | `sumDataset('Paused')` | 0 | ✅ TRUTHFUL |
| Cycles Halted | `[data-kpi="cycles-halted"]` | `sumDataset('Halted')` | 3 | ✅ TRUTHFUL |
| Proposals Pending (KPI) | `[data-kpi="proposals-pending"]` | proposals_state pending count | 0 | ✅ TRUTHFUL |
| Proposals In-Flight (KPI) | `[data-kpi="proposals-in-flight"]` | proposals_state in_flight | 9 | ✅ TRUTHFUL |
| Proposals Shipped (KPI) | `[data-kpi="proposals-shipped"]` | proposals_state shipped | 4 | ✅ TRUTHFUL |
| Amendments Pending (KPI) | `[data-kpi="amendments-pending"]` | `amendments_state_counts().pending` | 0 | ✅ TRUTHFUL |
| Amendments Applied (KPI) | `[data-kpi="amendments-applied"]` | `amendments_state_counts().applied_total` | 25 | ✅ TRUTHFUL |
| Recent Handoffs table | DOM rows | `recent_handoffs()` | populated rows | ✅ TRUTHFUL |
| Recent Amendments table | DOM rows | recent AMD scans | populated rows | ✅ TRUTHFUL |

## ⚠ Confirmed P9 gaps (require fix)

### GAP-1 — TOKENS THIS WEEK: 102.0k (should be 4,028.02M / 4.03B)

| Field | Value |
|---|---|
| CARD | "TOKENS THIS WEEK" |
| DOM selector | `[data-kpi="weekly-tokens"]` |
| Template path | `dashboard.template.html:265` |
| Consumer JS read | `setText('[data-kpi="weekly-tokens"]', fmtNum(weeklyMeasured))` (line 462) → `weeklyMeasured` derived from `data.weekly_tokens` |
| Current source | `regen-dashboard.py:1458` → `snap.get("weekly_tokens", 0)` where snap = `current-snapshot.json` |
| Current source value | 102,000 (stale pre-T1+T5 state — aggregate-telemetry.py never ingested session transcripts) |
| Expected source | `token-usage-snapshot.json.session_transcripts.weekly_real_7d` = 4,028,022,905 |
| Root cause category | **WRONG_SOURCE** — consumer reads from current-snapshot.json (which doesn't include session transcripts) instead of token-usage-snapshot.json (which does, post-T1) |
| Fix path | Modify `build_dashboard_data()` in `scripts/regen-dashboard.py` to read `weekly_tokens` from token-usage-snapshot.json's `session_transcripts.weekly_real_7d`, falling back to `snap.weekly_tokens` if file missing |
| Sub-phase | **B-token-meter** (extension of T1+T5 cross-surface) |

### GAP-2 — TOKENS QUOTA WEEKLY: 102.0k (same root cause as GAP-1)

| Field | Value |
|---|---|
| CARD | "TOKENS QUOTA WEEKLY" |
| DOM selector | `[data-kpi="manual-quota-pct"]` |
| Template path | `dashboard.template.html:280` |
| Consumer JS read | Lines 509, 519, 528, 554 — derives from `qs.weekly_pct` or `mq.weekly_all_pct` where `qs = data.quota_status` |
| Current source | `snap.quota_status` (current-snapshot.json) → sidecar derives from cron-log telemetry events (NOT session transcripts) |
| Current source value | quota_status.weekly_tokens=102,000 |
| Expected source | Same as GAP-1 — `token-usage-snapshot.json.session_transcripts.weekly_real_7d` should be the underlying weekly_tokens |
| Root cause category | **WRONG_SOURCE** (downstream of GAP-1 — sidecar's quota derivation runs on stale weekly data) |
| Fix path | Two options: (a) extend `build_dashboard_data()` to override `quota_status.weekly_tokens` with session-transcript truth, OR (b) extend the sidecar / aggregate-telemetry.py to ingest session transcripts. Option (a) is surgical and aligns with the T1+T5 architectural pattern (consumer-side fix). |
| Sub-phase | **B-token-meter** |

### GAP-3 — TOKEN CONSUMPTION 7-DAY chart shows mostly empty

| Field | Value |
|---|---|
| CARD | "TOKEN CONSUMPTION 7 DAY" trend chart |
| DOM selector | Chart canvas + bars |
| Template path | `dashboard.template.html` (chart JS) |
| Consumer JS read | `data.token_trend_7d` |
| Current source | `snap.token_trend_7d` (current-snapshot.json) |
| Current source value | 7-day trend has only 1 bar with 102k — reflects the 1 real telemetry event from 2026-05-13 (pre-T1) |
| Expected source | `token-usage-snapshot.json.by_day` aggregated to last 7 days. Real numbers in hundreds-of-millions to billions per day. |
| Root cause category | **WRONG_SOURCE** (same as GAP-1) |
| Fix path | In `build_dashboard_data()`, replace `snap.token_trend_7d` with a computation that aggregates the last 7 day-buckets from token-usage-snapshot.json's `by_agent.*.by_day` |
| Sub-phase | **B-token-meter** |

### GAP-4 — Round-Trip Last Pass card: "unknown" + subtitle "watcher cycling" lacks ts (partial B5)

| Field | Value |
|---|---|
| CARD | "Round-Trip Last Pass" + "8 days stale" + "0 of 3" |
| DOM selector | `[data-fq="round-trip"]` + subtitle anchor |
| Template path | `dashboard.template.html` (around the founder review queue) |
| Consumer JS read | `lr = hh.last_regen_all || {}`; `lrTs = lr.ts || hh.round_trip_last_pass || 'unknown'` |
| Current source | `last_regen_all_status()` in regen-dashboard.py |
| Current source value | "unknown" — `lr.ts` is null/empty |
| Expected source | Most-recent `tests/round-trip-test.py` exit-0 run timestamp |
| Root cause category | **MISSING_FIELD** — `last_regen_all_status()` may return `{ts: null, status: 'UNKNOWN'}` when no recent round-trip-test pass is recorded |
| Fix path | Investigate `last_regen_all_status()` — if it reads from `.claude/state/dashboard-health/last-regen-all.json` (or similar), confirm that file is being written by the post-commit hook. If not, wire it. Spec B5 explicitly: "round-trip-last-pass STALE indicator". |
| Sub-phase | **B5** |
| Note | The "8 days stale" displayed somewhere is informative but the upper "unknown" anchor needs a timestamp or honest "never recorded" state. |

### GAP-5 — security-health.json not yet wired to AgentShield baseline (Phase B2 future)

| Field | Value |
|---|---|
| CARD | "Security health" banner |
| DOM selector | `[data-fq-banner-summary="security"]` |
| Current source | security-health.json status=red, summary="2 potential credential leak(s) detected in tracked..." |
| Note | The card RENDERS truthfully from security-health.json. But the underlying scan that writes security-health.json is **NOT yet AgentShield**. It's a pre-existing credential-leak scanner. Spec B2 says "security-health aggregator wired (becomes the AgentShield surface)" — that wire is pending. |
| Root cause category | **WIRE-INCOMPLETE** (not a render bug; an integration gap per spec) |
| Fix path | (Future Phase B2 ship) Modify the producer of security-health.json to ingest AgentShield's grade + finding counts. Until then, the surface is honest about what it currently scans. |
| Sub-phase | **B2** (deferred to dedicated B2 ship) |

## Silent fallback-to-zero paths in regen-dashboard.py (P9.2 audit)

The following `data.get('x', 0)` or `data.get('x', [])` fallback patterns were found. Most are LEGITIMATE (intentional empty-state defaults). A few are SUSPECT.

| Line | Pattern | Field | Verdict |
|---|---|---|---|
| 1458 | `snap.get("weekly_tokens", 0)` | weekly_tokens | **SUSPECT — masks GAP-1.** Fallback to 0 when current-snapshot.json lacks the field. With the GAP-1 fix this becomes irrelevant (consumer reads from token-usage-snapshot.json instead) |
| 1459 | `snap.get("weekly_tokens_estimated", 0)` | weekly_tokens_estimated | LEGITIMATE — separate field, used for the estimated/real disaggregation |
| 1463 | `snap.get("ships_this_week", 0)` | ships_this_week | LEGITIMATE (genuine zero is plausible early in the week) |
| 1467 | `snap.get("halts_this_week", 0)` | halts_this_week | LEGITIMATE (zero halts is the goal) |
| 1468 | `snap.get("fiq_depth", 0)` | fiq_depth | LEGITIMATE (FIQ=0 = no pending builds, ideal state) |
| 1471 | `snap.get("tokens_by_role", {"labels": [], "values": []})` | role chart data | LEGITIMATE empty-state; chart renders an honest empty state |
| 1472-1479 | similar `{"labels": [], "values": []}` defaults for trend charts | trend chart data | LEGITIMATE (charts honest about empty data) |
| 1454 | `daily_tokens = 0` after except OSError | daily_tokens | LEGITIMATE — file missing on first run is plausible; logs `OSError` but doesn't crash |

No additional `data.get('x', 0)` silent-fallback antipatterns found beyond GAP-1 root cause.

## Sub-phase summary

| Spec sub-phase | Status | Notes |
|---|---|---|
| B1 — test-health aggregator wired + verified | ✅ DONE (this session confirms) | aggregate runs, status=yellow surfaces correctly |
| B2 — security-health aggregator wired (becomes the AgentShield surface) | ⏸ DEFERRED | Surface renders truthfully but underlying scan is NOT AgentShield yet. Future ship. |
| B3 — approvals-pipeline aggregator wired | ✅ DONE | counts.proposals_pending=0, proposals_approved=9, proposals_shipped=4 all match displayed values |
| B4 — architecture-review aggregator OR intentional empty state | ✅ DONE | Intentional empty state "0 pending recommendations" matches Linear/Stripe empty-state pattern |
| B5 — round-trip-last-pass STALE indicator | ⚠ PARTIAL — GAP-4 | "unknown" displayed when no pass recorded. Needs to either wire ts or show honest "never recorded" copy |
| B6 — every aggregator writes meta block (generated_at, source_files, schema_version) | ✅ DONE | All 5 aggregates audited have generated_at + schema_version + most have source_files |
| B7 — post-commit hook runs every aggregator + regen + inject + smoke + AgentShield + P9 self-check | ⚠ PARTIAL | Hook runs regen-all (which runs aggregators + regens); does NOT yet run AgentShield in-line; D34 self-check shipped in session 1 |
| **B-token-meter** (new sub-phase from this audit) | ❌ OPEN — GAP-1/2/3 | The cross-surface token data unification — fix this ship |

## Recommended fix order

1. **GAP-1 + GAP-3** in single edit to `regen-dashboard.py`:
   - `weekly_tokens` reads from token-usage-snapshot.json.session_transcripts.weekly_real_7d (with fallback)
   - `token_trend_7d` computed from token-usage-snapshot.json.by_agent.*.by_day last-7-days aggregation

2. **GAP-2** as part of same edit:
   - `quota_status.weekly_tokens` overridden in `build_dashboard_data` with session-transcript-derived value

3. **GAP-4** small edit to `last_regen_all_status()`:
   - When ts is null, return `{status: 'NEVER', ts: 'never recorded', age_minutes: null}` instead of `{status: 'UNKNOWN'}` so the UI shows honest copy

4. **GAP-5** deferred — separate B2 ship that does the AgentShield integration properly

5. After fix: re-run regen, V1 capture dashboard.html, Read PNG, update DATA-TRUTH-MATRIX.md to mark all `dashboard.html` rows TRUTHFUL.

## Closes-on-fix

| DONE WHEN | Status post-fix |
|---|---|
| D33 — Dashboard renders ZERO unexplained "0" / "—" / "N/A" placeholders | CLOSES (GAP-1/2/3/4 are the remaining suspect placeholders) |
| D32 — DATA-TRUTH-MATRIX every value TRUTHFUL | CLOSES for dashboard.html (other surfaces still pending) |
| D34 — Every aggregator has --self-test mode | Already CLOSED in session 1 for ingest-session-transcripts.py; will continue to pass after GAP-1 fix |

## Out-of-scope (do not touch this ship)

- src/pages/, src/core/, functions/, firestore.rules — production app code
- Phase T6 pie chart UI work — depends on this ship closing first (T1+T5 cross-surface unification)
- Phase M main-flows iteration — separate surface
- Phase B2 AgentShield wire — deferred for dedicated ship
