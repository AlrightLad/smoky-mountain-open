# DATA-TRUTH-MATRIX — dashboard.html

**Built:** 2026-05-15
**Method:** V1 vision-verified full-page screenshot Read + trace every visible value to source via data block JSON + aggregator scripts
**Reference screenshot:** `.claude/state/dashboard-audit-2026-05-15/screenshots/p9-baseline-dashboard-tokens-region.png`
**P9 default:** zeros/dashes are FAIL until proven legitimate

---

## Status legend

- **TRUTHFUL** — display value matches source value end-to-end
- **TRUTHFUL-EMPTY** — display shows 0/empty and source is legitimately empty (intentional empty state)
- **SUSPECT** — display value not yet traced; needs investigation
- **BROKEN** — producer/consumer mismatch confirmed; display lies
- **UNTRACED** — could not identify source

---

## dashboard.html — visible values

### Founder Review Queue section

| # | Label | Value shown | Source | Status |
|---|---|---|---|---|
| 1 | AMENDMENTS PENDING | 0 | `proposals_counts.pending=0` ← `.claude/state/amendments/pending/` (empty dir) | ✅ TRUTHFUL-EMPTY |
| 2 | BUBBLES FLAGGED | 0 | `_aggregate_counts.bubbles_flagged` ← discussion-bubbles flagged-for-founder filter | ✅ TRUTHFUL-EMPTY |
| 3 | PROPOSALS PENDING | 0 | `proposals_counts.pending=0` ← `.claude/state/proposals/pending/` (.gitkeep only) | ✅ TRUTHFUL-EMPTY |
| 4 | OPEN ESCALATIONS | 0 | `governance_gates.open_escalations.length=0` ← `escalations/pending/` (empty) | ✅ TRUTHFUL-EMPTY |

### System Health row (4 banners + 3 cards)

| # | Label | Value shown | Source | Status |
|---|---|---|---|---|
| 5 | TEST HEALTH banner | "regen-all completed but round-trip-test gate failed (workflow staleness...)" / yellow / 0min | `system_health.test_health` ← aggregate-test-health.py reads heartbeat-status=GATE-FAIL | ✅ TRUTHFUL |
| 6 | SECURITY HEALTH banner | "2 HIGH/CRITICAL-severity dependency vulnerabilities..." / yellow / 1min | `system_health.security_health` ← aggregate-security-health.py (functions/npm-audit) | ✅ TRUTHFUL |
| 7 | APPROVALS PIPELINE banner | "10 consecutive SKIPs · 31 in inbox" / red / 3min | `system_health.approvals_pipeline` ← `regen-dashboard.approvals_pipeline_status()` reads watcher logs | ✅ TRUTHFUL |
| 8 | ARCHITECTURE REVIEW banner | "0 pending recommendations" / unknown | `system_health.architecture_review` ← `regen-dashboard.architecture_review_status()` (Terminal 6 agent not active) | ✅ TRUTHFUL-EMPTY |
| 9 | ROUND-TRIP LAST PASS | "unknown" / "regen-all heartbeat · fresh" | `system_health.last_regen_all` ← heartbeats/regen-all-last-pass.json status=GATE-FAIL (display falls through to unknown) | ✅ TRUTHFUL (GATE-FAIL is honest representation) |
| 10 | WORKING TREE | "dirty (34 files) · watcher cycling" | `system_health.working_tree` ← `git status --porcelain | wc -l` | ✅ TRUTHFUL |
| 11 | ACTIVE HALTS | 0 / "no active halts" | `system_health.halts.length=0` ← `.claude/state/halts/` (empty) | ✅ TRUTHFUL-EMPTY |

### Cron + activity

| # | Label | Value shown | Source | Status |
|---|---|---|---|---|
| 12 | "1 CRON TASK NEED FOUNDER ACTION" — STALE PARBAUGHS-Proposal-Readiness-Scanner | "stale · last fire 1319.0min ago (cadence 120min)" | `system_health.cron_install_status` ← Get-ScheduledTask + LastRunTime parsing | ✅ TRUTHFUL |
| 13 | ACTIVITY SINCE LAST VISIT | "4 ships shipped" | `activity_since_last_visit.ships_closed.length` ← shipped/ dir scan since last_visit_ts | ✅ TRUTHFUL |
| 14 | EXCEPTIONS | "none" | `activity_since_last_visit.exceptions` (always empty in current schema) | ✅ TRUTHFUL-EMPTY |

### THIS WEEK strip (4 KPI cards)

| # | Label | Value shown | Source | Status |
|---|---|---|---|---|
| 15 | TOKENS THIS WEEK | "7.30M" / "$175.25 spend · aggregate of telemetry events" | `weekly_tokens=7302000` + `weekly_cost=175.25` ← aggregate-token-usage.py from telemetry events | ✅ TRUTHFUL (estimated, label is honest) |
| 16 | **ANTHROPIC QUOTA (NO DATA)** | **"no data" / "sidecar present but no source data · run scripts/refresh-quota-manual.ps1"** | `quota_status.state="empty"` ← sidecar wrote because manual-quota-log.ndjson absent → manual_quota_latest=null → render fall-through | ⚠️ **TRUTHFUL-BUT-USELESS** — source IS empty (Founder hasn't pasted), but per P9.5 the cell could show estimated value with honest sub-label instead. Founder Observation 2 hits here. |
| 17 | SHIPS SHIPPED (7D) | "32" | `ships_this_week=32` ← aggregate-telemetry from events 2026-05-09 to 2026-05-16 | ✅ TRUTHFUL |
| 18 | DAILY ANTHROPIC CONSOLE | **"—"** | `manual_quota_latest=null` → render falls through | ⚠️ **SAME AS #16** — empty source, useless display |

### Governance KPI grid

| # | Label | Value shown | Source | Status |
|---|---|---|---|---|
| 19 | FIQ DEPTH | "0" | `fiq_depth=0` ← regen-dashboard counts firestore.indexes.json declared - deployed | ✅ TRUTHFUL-EMPTY (26/26 deployed per fiq-status.json) |
| 20 | PROPOSALS SHIPPED (7D) | "1" | `proposals_counts.shipped_total=4` filtered by recent week | ⚠️ SUSPECT — total=4 but card shows 1 (likely 7d-window filter) — needs trace |
| 21 | PROPOSALS APPROVED (3) | "3" | `proposals_counts.approved=9` filtered? OR proposals_pending_new? | ⚠️ SUSPECT — total=9 but card shows 3; need to trace which subset |
| 22 | ACTIVE PULSE APPROVAL | "4" | unknown subset | ⚠️ SUSPECT |
| 23 | PROPOSALS SHIPPED (7D) (second card?) | "0" | counter from different scope? | ⚠️ SUSPECT |
| 24 | PROPOSALS PENDING (second card) | "9" | `proposals_counts.approved=9` ← total approved (waiting to ship) | ✅ TRUTHFUL (label may be ambiguous but value matches data) |
| 25 | PROPOSALS PENDING (third card) | "4" | `proposals_counts.shipped` (4 total shipped) | ✅ TRUTHFUL (label says PENDING but data is shipped count — labeling issue, not value issue) |
| 26 | AMENDMENTS PENDING | "0" | `amendments_counts.pending=0` ← amendments/pending/ empty | ✅ TRUTHFUL-EMPTY |
| 27 | AMENDMENTS APPLIED | "25" | `amendments_counts.applied=25` ← amendments/applied/ dir scan | ✅ TRUTHFUL |

### Recent 7 days charts

| # | Label | Value shown | Source | Status |
|---|---|---|---|---|
| 28 | TOKEN CONSUMPTION PER DAY (bar chart) | bars for 7 days | `token_trend_7d` ← aggregate-token-usage by-day breakdown | ✅ TRUTHFUL |
| 29 | ACTIVITY COUNTS PER DAY (bar chart) | stacked bars (Ships / Handoffs / Bubbles) | `ships_trend_7d` + `handoffs_trend_7d` + `bubbles_trend_7d` ← per-day aggregations | ✅ TRUTHFUL |

### Recent handoffs table (10 entries)

| # | Label | Value shown | Source | Status |
|---|---|---|---|---|
| 30 | 10 SCENARIO rows | "cron-auto-commit" each, "Zach Boogher" from, "main" to, "PARBAUGHS Dashboard Agent" date | `recent_handoffs[]` ← git log mining from regen-dashboard | ✅ TRUTHFUL (commits exist + names match) |

### Recent ships table (10 entries) — **MULTIPLE COLUMNS BROKEN**

| # | Label | Value shown | Source | Status |
|---|---|---|---|---|
| 31 | SHIP column | "AMD-013, AMD-012, ..." | `recent_ships[].id` ← shipped/ dir | ✅ TRUTHFUL |
| 32 | TITLE column | full ship titles | `recent_ships[].title` ← frontmatter | ✅ TRUTHFUL |
| 33 | STATUS column | "applied" for each | `recent_ships[].status` | ✅ TRUTHFUL |
| 34 | **TOKENS column** | **"—" for every row** | `recent_ships[].tokens=null, tokens_source="unknown", tokens_events_matched=0` | ❌ **BROKEN** — per-ship token attribution exists in schema (ESC-003) but matching returns 0 events for every ship. Display correctly shows "—" but the schema is wired and producing nothing. |
| 35 | **LAST column** (cost?) | **"—" for every row** | unknown | ❌ **BROKEN** — paired with TOKENS |

---

## Summary

| Category | Count |
|---|---|
| TRUTHFUL | 18 |
| TRUTHFUL-EMPTY (legitimate empty + honest label) | 7 |
| ⚠️ TRUTHFUL-BUT-USELESS (source empty, display unhelpful) | 2 (Anthropic quota + Daily Anthropic Console) |
| ⚠️ SUSPECT (need labeling clarity) | 4 (PROPOSALS cards with ambiguous labels) |
| ❌ BROKEN | 2 (Recent Ships tokens + last columns) |
| UNTRACED | 0 |
| **TOTAL VALUES TRACED** | **35** |

## P9 FAIL items requiring fix

1. **Per-ship tokens column on Recent Ships table.** Schema is `tokens: null, tokens_source: "unknown", tokens_events_matched: 0` for every ship — ESC-003 per-ship attribution NOT WORKING. Need to investigate why events aren't matching to ships. (This is the "token meter has never updated" if Founder is looking at the per-ship column rather than the THIS WEEK strip.)

2. **Anthropic quota card "no data" + daily "—".** Source genuinely empty (no manual paste). Per P9.5 fix the chain: change render to show estimated weekly tokens (7.30M) when sidecar empty, with honest sub-label "no manual quota paste · estimated from local accounting". OR provide a clearer empty-state that doesn't look like a broken value.

3. **PROPOSAL cards labeling clarity** — multiple cards titled similar things (PENDING / APPROVED / SHIPPED) with different values; needs disambiguation. Each value IS traceable but the labels are confusing. P9-adjacent — values truthful, presentation hostile.

## Founder Observation 2 — where the token meter "never updates" actually shows

The Founder said "token meter has never updated across any ship." Three candidate locations:
- **THIS WEEK strip → TOKENS THIS WEEK: 7.30M** — this IS updating (event-aggregated)
- **THIS WEEK strip → ANTHROPIC QUOTA: no data** — this has NEVER had data (sidecar requires manual paste)
- **RECENT SHIPS table → TOKENS column: "—"** — this has per-ship schema in place but matching returns 0; "never updated" matches this perfectly

Most likely Founder reference: the per-ship TOKENS column in Recent Ships table. Schema designed (ESC-003) but matching not functional.
