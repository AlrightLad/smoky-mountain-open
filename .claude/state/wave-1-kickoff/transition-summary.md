---
doc: Wave 0 → Wave 1 transition summary
date: 2026-05-14
authored_by: claude-code
status: substrate phase complete; awaiting Founder Wave 1 authorization
---

# Wave 0 → Wave 1 Transition Summary

Substrate consolidation phase **complete**. Wave Zero Dry-Run disposition
**PASS-WITH-FINDINGS** (all findings are scheduled future work, not
regressions). Substrate is operationally sound for Wave 1 kickoff.

## Substrate consolidation summary

### 1 — Three crons live and scheduled

- `downloads-watcher.ps1` — 5-min cadence, scans `~/Downloads/` for
  `decisions-*.json` (and after amendments lifecycle ships,
  `amendments-*.json`), applies via `apply-decisions.sh`, commits locally.
  Emits `cron.downloads-watcher.start` / `.end` telemetry.
- `maintenance.ps1` — daily 02:55 local. 10 steps: pre-flight pause
  check, git fetch+gc, junk-quarantine sweep, log rotation, dependency
  updates (admin-gated), state-dir health audit, regen-all sanity,
  telemetry emit, daily report, local commit. Emits start/end telemetry.
- `overnight-triage.ps1` — daily 03:00 local. Launches Claude Code with
  fixed prompt to process FIQ + bug reports overnight. PAUSE HEURISTIC
  is op-count-based per Phase 6.6 (no hardcoded ceiling constants).

All three respect `cron-paused.json` and `last-verify.json` pre-flight
gates. All three run with Founder credentials via S4U.

### 2 — Eight dashboards on one theme, no charts except SVG donut

PARBAUGHS canonical palette (`--pb-billiard-green-*` + `--pb-chalk-*` +
`--pb-brass-*`). Every dashboard imports `dashboard-shell.css` which
transitively imports `design-tokens.css` and carries the legacy alias
layer (`--bg-page` → `--pb-billiard-green-900`, etc.) until per-page
sunset is complete.

Zero charts anywhere except:
- `token-usage.html` SVG donut (carved out by directive)
- `main-flows.html` SVG arrow overlay (protected — functional documentation)

12-commit consolidation arc (`328ae5c` .. `10b1e86`). 32 baseline
screenshots at `scripts/visual-audit/2026-05-14-DC8/` (4 viewports ×
8 dashboards).

### 3 — Fictional 3.5M cap removed (Phase 6.6)

Per DC-9. `dashboard.html` no longer shows "of 3.5M cap" subtitle or
"Weekly remaining / Budget" KPIs derived from a fictional denominator.
New KPI surfaces real "Anthropic quota (manual)" sourced from
`refresh-quota-manual.ps1` paste data with "no data" empty state.
`aggregate-telemetry.py` + `regen-dashboard.py` stopped emitting
`budget_pct`. Round-trip `[pause-discipline]` block enforces absence
of `3.5M / 3500000 / weekly_budget_cap / budget_pct / weekly_tokens_cap`
in the production tree.

Op-count pause heuristic stays until PROP-003 (token-meter-wiring-
sidecar) ships real metering.

### 4 — Proposal lifecycle 5-state

`.claude/state/proposals/{pending,approved,deferred,shipped,rejected}/`.
Watcher → `apply-decisions.sh` → state transitions. `proposals.html`
shows all 5 sections. PROPOSAL_LIFECYCLE_v8.2 schema validates via
round-trip `[lifecycle]` block.

4 approved proposals to date (PROP-001..004). PROP-003 is the load-bearing
dependency for retiring the op-count pause heuristic.

### 5 — Token observability with manual quota anchoring

`token-usage.html` — SVG donut + 3 sortable tables (by_agent / by_cron /
by_ship) + cross-panel reconciliation enforced. Three sources:
- A: Real telemetry events (cycle.budget.checkpoint deltas)
- B: Estimated from cron session duration (rate constants in
     aggregate-token-usage.py top)
- C: Manual paste via `refresh-quota-manual.ps1` (Founder workflow)

Never blended. Each panel surfaces real / estimated / manual as separate
buckets with distinct visual treatment (solid / hatched / asterisk-prefix).

### 6 — Wave Zero Dry-Run disposition: PASS-WITH-FINDINGS

V1-V6 PASS (run in W0 earlier). V7-V12 audited 2026-05-14:
- V7 PASS-WITH-FINDINGS (FIQ substrate not yet built)
- V8 PASS-WITH-FINDINGS (deep-research wired, no live exercise)
- V9 PASS-WITH-FINDINGS (4/6 heartbeat activities active)
- V10 PASS (proactive cycle proven by real artifacts)
- V11 PASS-WITH-FINDINGS (11/11 wired, 1/11 live exercise)
- V12 PASS-WITH-FINDINGS (4.5/5 active; obsolete sub-criterion)

Full details: `.claude/state/wave-zero-dry-run/SUMMARY.md` + per-V result files.

## Known carry-forward items

None block Wave 1 kickoff. All are scheduled future work documented
across the substrate state directory.

| # | Item | Source doc |
|---|---|---|
| 1 | PROP-003 token-meter-wiring-sidecar implementation | `.claude/state/proposals/approved/PROP-003-*.md` |
| 2 | Alias-layer sunset (3 of 5 non-protected dashboards still have refs) | `.claude/state/design-system/alias-sunset.md` |
| 3 | Round-trip test split (1320 lines → tests/checks/*.py modules) | `dashboard-consolidation-summary.md` |
| 4 | FIQ substrate build (V7 prereq) | `v7-result.md` |
| 5 | AGENT_WELLBEING_PROTOCOL substrate build (V9 prereq) | `v9-result.md` |
| 6 | V12 runbook amendments (drop markdown-reports + Chart.js sub-criteria) | `v12-result.md` |
| 7 | 10/11 handoff scenario organic exercise during Wave 1 ships | `v11-result.md` |
| 8 | Form-controls follow-up: 7 unstyled selects/inputs on activity + bubbles rail + proposals JS-note | `dashboard-consolidation-summary.md` |

## Governance amendment drafts ready for application

Four drafts at `.claude/state/wave-zero-dry-run/remediation/` pending
Founder application. After amendments.html ships, these go through the
new UI as the first batch of real amendments approved through the
lifecycle (per Founder's "first amendments approve cleanly through the
new UI" trigger).

| Draft | Target | Trigger source |
|---|---|---|
| `proposed-PAUSE_DISCIPLINE_v8.2_remove-fictional-cap.md` | `docs/agents/PAUSE_DISCIPLINE_v8.2_ADDENDUM.md` | DC-9 |
| `proposed-CRON_CONFIGURATION_v8.2_remove-fictional-cap.md` | `docs/agents/CRON_CONFIGURATION.md` (line 616 edit) | DC-9 |
| `proposed-parbaughs-design-bot-dashboard-checklist.md` | `.claude/skills/parbaughs-design-bot.md` (append) | DC-7; skill-approval gated |
| `proposed-AUTONOMOUS_FAILURE_RECOVERY_v8.3.md` | `docs/agents/AUTONOMOUS_FAILURE_RECOVERY_v8.3.md` (new file) | Founder PROTOCOL UPDATE 2026-05-14; operating immediately |

## Wave 1 first ship recommendation

Per `docs/agents/ROADMAP.md` Wave 1 shipping order:

> W1.S1 → W1.S2 → W1.S3 → W1.S4 → W1.S5 (W1.I3 parallel)

**Wave 1 first ship: W1.S1 — Design system codification**

> "Wave 2A spec → consumable CSS variables + component classes + JS helpers"

### Why this is the right first ship

1. **Substrate alignment**: the consolidation work just shipped the
   `--pb-*` token system + `.pb-*` shell primitives that W1.S1 will
   extend and codify. Doing W1.S1 now compounds the consolidation
   investment rather than letting it stale.
2. **Spike feeds in**: TASK 2 Design Tooling Spike (queued, scheduled
   for after V7-V12 / transition prep / before W1 ship 1) will produce
   concrete evidence on H1 + H2 from bubble `db-2026-05-14-001`.
   That evidence directly informs W1.S1's framework decisions (use
   shadcn? extend the current vanilla JS + custom CSS? hybrid?).
3. **Wave 2 gate**: Wave 1 is functional completion; Wave 2 is design
   coherence. W1.S1 builds the codified system Wave 2 will refine
   against. Skipping it pushes design coherence work to a less-
   prepared substrate.
4. **Tooling unlock**: W1.S1 codifies the canonical PARBAUGHS palette +
   component primitives into `_assets/design-system-components.css`
   shape so HQ pages can consume them directly (rather than each page
   re-implementing). All subsequent Wave 1 ships benefit.

### Suggested execution sequence inside W1.S1

a. Read the Wave 2A spec (when authored by Founder / Claude.ai)
b. Run TASK 2 Design Tooling Spike first (1-2 hours scope) — produce
   the comparison.md at `.claude/state/design-spike/comparison.md`
c. Author W1.S1 ship plan with fallback fields per AUTONOMOUS_FAILURE_RECOVERY_v8.3
d. Execute against the chosen approach (vanilla / shadcn / hybrid)
e. Critic gates on the W1.S1 spec checklist plus the new
   DASHBOARD PR CHECKLIST from the design-bot draft (if Founder
   has applied that amendment by then)

### Estimated token cost

- TASK 2 spike: 1-2 hours / ~200-400k tokens
- W1.S1 ship: 600k-1.2M tokens depending on framework decision
  (vanilla extension: lower; shadcn migration: higher)

## Consolidation close-out commits

| # | Hash | Title |
|---|---|---|
| 1 | `328ae5c` | Dashboard audit + dashboard-shell.css foundation |
| 2 | `c3d1d55` | Strip charts from dashboard.html |
| 3 | `58c3719` | Token-usage.html rebuilt SVG donut |
| 4 | `f987f85` | Phase 0 theme convergence |
| 5 | `00f8b3d` | Visual audit baseline |
| 6 | `cb117de` | Activity + bubbles + proposals normalized |
| 7 | `731f8bf` | Index + main-flows + design-system normalized |
| 8 | `2b3d794` | Remove fictional 3.5M cap |
| 9 | `512e66c` | Style proposals filter controls |
| 10 | `103027c` | DC-7 round-trip extensions |
| 11 | `e9aab62` | Open db-2026-05-14-001 UI/UX maturity gap |
| 12 | `10b1e86` | DC-8 mobile QA + cleanup + summary |
| 13 | `47aa793` | V7-V12 audit + SUMMARY |
| 14 | `86c9f9a` | AUTONOMOUS_FAILURE_RECOVERY v8.3 protocol draft |
| 15 | _(this commit)_ | Wave 0 → Wave 1 transition prep |

## Transition-ready report

Substrate phase complete. Wave Zero Dry-Run disposition PASS-WITH-FINDINGS.
15 substrate commits this consolidation session (12 DC + V7-V12 SUMMARY
+ AUTONOMOUS_FAILURE_RECOVERY + this transition prep). Per Founder
"don't pause for me unless escalation criteria fires" directive: no
escalation criteria have fired during V7-V12 / protocol / transition
prep work.

**Next per substrate final sequence**:

1. TASK 2 Design Tooling Spike (1-2 hour scope)
2. Amendments lifecycle build (per Founder NEW DASHBOARD: 4 commits =
   schema + apply-amendments.sh + amendments.html + watcher kind detection)
3. First amendments approve cleanly through the new UI (the 4 governance
   drafts authored across the consolidation become the first batch)
4. Consolidated report to Founder with: V7-V12 disposition,
   spike comparison.md path, substrate close-out commits list, Wave 1
   first ship recommendation

This file is the equivalent of the Scenario 7 founder-to-agent
ratification handoff specified by the runbook, adapted to the team-
owned-verification posture (no synchronous pause).

## Cross-references

- Substrate close-out: `.claude/state/wave-zero-dry-run/SUMMARY.md`
- Dashboard consolidation summary: `.claude/state/wave-zero-dry-run/dashboard-consolidation-summary.md`
- Long-running bubble: `.claude/state/discussion-bubbles/db-2026-05-14-001.md`
- Visual regression baseline: `scripts/visual-audit/2026-05-14-DC8/`
- ROADMAP: `docs/agents/ROADMAP.md` Wave 1 section
- Governance amendment drafts: `.claude/state/wave-zero-dry-run/remediation/`
- AUTONOMOUS_FAILURE_RECOVERY protocol: `.claude/state/wave-zero-dry-run/remediation/proposed-AUTONOMOUS_FAILURE_RECOVERY_v8.3.md` (operating immediately)
