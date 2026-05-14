---
audit: Phase 6.6 fictional 3.5M weekly cap remediation
date: 2026-05-13
authored_by: claude-code
trigger: DC-9 of Dashboard Consolidation
scope: codebase + governance docs
---

# Fictional 3.5M Weekly Cap — Audit + Remediation Map

The v8.1 governance referenced a "3.5M weekly token cap" and "90% pause
threshold" against that fictional number. Founder's real ceiling is the
Anthropic account quota (session 5-hour rolling reset + weekly Friday
23:00 reset, surfaced in claude.ai billing). The 3.5M was a placeholder
that drifted into code as if it were a real meter.

Agents pausing on fiction is worse than not pausing at all — false confidence.

## Reference search

```
grep -rn '3\.5M\|3500000\|3,500,000\|weekly_budget_cap\|budget_pct\|weekly_tokens_cap\|3\.15M\|3150000' \
  docs/agents/ docs/reports/ scripts/ .claude/ tests/
```

## Classified findings

### Type A — Display only (dashboards, KPI subtitles, summary docs)

Action: **REMOVE**. Replace with real-quota-aware framing OR drop entirely.

| File | Line | Reference | Action |
|---|---:|---|---|
| `docs/reports/dashboard.html` | 49 | `"of 3.5M cap"` subtitle on Weekly Remaining card | REMOVE card + replace with manual-quota-aware variant |
| `docs/reports/dashboard.html` | 193 | `"budget_pct": 0.0` in data block | KEEP field name (round-trip refs it) but stop deriving from fictional cap; either source from manual quota or set to null |
| `docs/reports/dashboard.html` | 328 | `var weeklyCap = 3500000;` in JS | REMOVE constant + the derived "weeklyRemaining" KPI |
| `docs/reports/dashboard.html` | 334 | `setText('[data-kpi="budget-pct"]', ...)` | REMOVE — no more Budget KPI card |
| `docs/reports/_assets/dashboard.js` | 230 | `const budgetPct = data.budget_pct \|\| 0;` | REMOVE — no longer used by dashboard.html; other consumers (none in scope) would need migration |
| `docs/reports/_assets/template.html` | 49 | `{{ budget_pct_display }}` template var | DEFER — already slated for delete in DC-8 (stale Chart.js boilerplate) |

### Type B — Pause trigger (PAUSE_DISCIPLINE_v8.1_ADDENDUM + cron scripts)

Action: **REPLACE** the fictional cap check with op-count-based heuristic
until PROP-003 ships real metering. Author governance amendment draft.

| File | Line | Reference | Action |
|---|---:|---|---|
| `docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md` | 77 | "Weekly tokens (3.5M cap): resets Sunday 00:00 UTC" | DRAFT v8.2 amendment: replace section 2.1 with op-count heuristic + manual-quota-paste fallback |
| `docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md` | 28-58 | Section 2.1 "Rate-limit threshold (90% usage)" — uses fictional cap as denominator | DRAFT v8.2 amendment: replace 90% pct check with `op-count >= 5` heuristic; preserve last-verify.json schema but `usage_pct` becomes optional (null when no real meter) |
| `scripts/cron/overnight-triage.ps1` | n/a | No explicit cap reference, but the cron's pause heuristic implicitly relies on PAUSE_DISCIPLINE | ADD comment block documenting op-count-based heuristic + PROP-003 dependency |
| `scripts/cron/overnight-triage-prompt.txt` | n/a | Agent prompt may instruct on pause discipline | ADD same op-count comment block |

### Type C — Halt criterion (HALT_CRITERIA + PAUSE_DISCIPLINE secondary)

Action: **REPHRASE** the halt criterion to be dormant until real meter exists.

| File | Line | Reference | Action |
|---|---:|---|---|
| `docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md` | 110-198 | Section 4 "New halt: item 24 — Pause auto-resume failure" depends on a real rate-limit pause having fired | DRAFT v8.2 amendment: document that item 24 is dormant when pause heuristic is op-count-based (cannot fail to auto-resume what never fired against fiction); reactivates when PROP-003 ships |
| `docs/agents/CRON_CONFIGURATION.md` | 616 | "Weekly token budget alert: 3.5M/week expected, alert at 4.5M/week" | DRAFT amendment: rephrase as "Whatever the active Anthropic quota is per claude.ai billing — alert thresholds tracked from manual-quota-log + Source-B estimation, NOT from a hardcoded 3.5M constant" |

### Type D — Test assertion

Action: **REMOVE** the assertion OR update to assert against the new path.

| File | Line | Reference | Action |
|---|---:|---|---|
| `tests/round-trip-test.py` | 75 | `"budget_pct": 0.689` in synthetic fixture | REMOVE (or set to null) — no longer surface a fictional value to dashboards |
| `tests/round-trip-test.py` | 348 | `"budget_pct": snap["budget_pct"]` in dashboard_data assembly | REMOVE — dashboard.html no longer reads this |
| `tests/round-trip-test.py` | — | (new) `[pause-discipline]` check | ADD — fail test on any production-tree reference to `3500000` / `3.5M` / `weekly_budget_cap` / `budget_pct` outside this audit doc + governance drafts |

### Type E — Telemetry event field

Action: **REMOVE** the field from active emitters. Past events stay
(immutable telemetry record).

| File | Line | Reference | Action |
|---|---:|---|---|
| `scripts/aggregate-telemetry.py` | 244 | `"budget_pct": ... min(weekly_tokens / 3_500_000, 1.0)` | REMOVE — stop computing budget_pct against fictional denominator. Emit null or remove field. |
| `scripts/regen-dashboard.py` | 116 | `"budget_pct": snap.get("budget_pct", 0.0)` | REMOVE — stop surfacing the value to dashboard data block. Add manual_quota_latest emit instead. |
| `.claude/state/telemetry/aggregates/current-snapshot.json` | 10 | `"budget_pct": 0.0` (regenerated each run) | NO direct edit — regen rewrites; once aggregate-telemetry stops emitting, next regen omits it. |
| `.claude/state/telemetry/events/2026-05-13.ndjson` | 2 | Past `cycle.budget.checkpoint` event with `weekly_tokens_cap: 3500000` | KEEP — immutable telemetry record. Future events from PROP-003-wired meter will have real `weekly_tokens_cap` values; old events stay as-is. |
| `.claude/state/telemetry/ingestion-audit.md` | 12 | Documents the event schema | LEAVE — descriptive doc, references existing schema. |
| `.claude/skills/parbaughs-report-generate/SKILL.md` | 180 | "~280k tokens/week (budget headroom remains intact within 3.5M/week cap)" | LEAVE for now — descriptive estimate, not pause trigger. Flag for SKILL doc revision when PROP-003 ships. |
| `.claude/state/proposals/approved/PROP-003-token-meter-wiring-sidecar.md` | 58 | `"weekly_tokens_cap": 3500000` in proposal example payload | LEAVE — historical proposal artifact; the actual cap will be set from real telemetry when sidecar ships. |
| `.claude/state/proposals/approved/PROP-004-org-monthly-quota-type.md` | 44 | "Weekly tokens (3.5M cap)" descriptive | LEAVE — historical proposal artifact. |
| `docs/agents/TELEMETRY_PROTOCOL.md` | 429 | "~3.2M/week → new steady state ~3.5M/week" | LEAVE for now — descriptive estimate, not pause trigger. Flag for revision when real telemetry replaces estimate. |
| `docs/agents/WAVE_ZERO_DRY_RUN_RUNBOOK.md` | 304 | Runbook reference to "weekly cap is 3.5M tokens" | LEAVE for now — runbook artifact from W0 dry-run, not active heuristic. Flag for revision. |
| `scripts/refresh-quota-manual.ps1` | 38-39 | `$caps = @{ "weekly-all" = 3500000; "weekly-sonnet" = 3500000; ... }` | LEAVE — these are placeholder caps for the % → token conversion in manual paste. Real value at the time of paste comes from Founder's input %. Document that these are placeholders pending real-cap config. |
| `scripts/cron/quarantine/2026-05-13/*` | various | Quarantined working-tree artifacts | LEAVE — dead files, no active references. Quarantine is the maintenance script's holding area. |

## Action plan summary

Per Type:
- **A**: Strip 3 fictional KPI cards from dashboard.html. Remove dead JS. Remove legacy dashboard.js budgetPct logic.
- **B**: Author proposed-PAUSE_DISCIPLINE_v8.2.md draft. Comment op-count heuristic on overnight-triage scripts.
- **C**: Same v8.2 draft includes item 24 dormancy note. Author proposed-CRON_CONFIGURATION-v8.2.md amendment.
- **D**: Strip budget_pct from round-trip fixture + assembly. Add new `[pause-discipline]` round-trip check.
- **E**: Strip budget_pct emit from aggregate-telemetry.py + regen-dashboard.py. Surface manual_quota_latest instead.

## What this DOES NOT remediate

- Past telemetry events with `weekly_tokens_cap: 3500000` (immutable record).
- Historical proposal docs (PROP-003, PROP-004) referencing the fictional cap as starting context — these described the *problem* and shouldn't be rewritten.
- The 3.5M placeholder in `refresh-quota-manual.ps1` — that's a manual paste % → token conversion knob, not a pause threshold. Stays until real cap value is sourced (PROP-003 ship).
- Descriptive references in runbook + protocol docs (TELEMETRY_PROTOCOL, WAVE_ZERO_DRY_RUN_RUNBOOK) — flagged for revision in their own ships when real telemetry replaces estimates.

## Dependency on PROP-003

Until PROP-003 (token-meter-wiring-sidecar) ships and runs reliably:
- Pause discipline is op-count-based, NOT percentage-based
- HALT item 24 is dormant (cannot fire on fiction)
- Manual quota paste via `refresh-quota-manual.ps1` is the only ground
  truth, and only when Founder remembers to run it
- Dashboard KPIs show consumption without ceiling reference

PROP-003 is queued as Wave 1 priority. When it ships, this Phase 6.6 work
gets revisited: pause discipline reverts to percentage-based with REAL
quota numbers; halt item 24 reactivates.
