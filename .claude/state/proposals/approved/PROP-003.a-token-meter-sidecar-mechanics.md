---
{
  "id": "PROP-003.a",
  "title": "Token meter sidecar mechanics (scope-isolated from dashboards + governance)",
  "lane": 3,
  "lane_label": "Performance",
  "parent_proposal": "PROP-003",
  "split_rationale": "Per Founder directive 2026-05-14: PROP-003 split into 3 coherent ships. PROP-003.a is the pure-infrastructure half — backend script + cron + tests producing quota-status.json. NO dashboards, NO telemetry consumers, NO governance docs.",
  "created_at": "2026-05-14T04:50:00Z",
  "rationale": "Sidecar process on Founder's machine polls Anthropic-side usage and writes a snapshot file the agent reads each turn. Scope-isolated from downstream consumers so the data-production path can ship + verify before any consumer wiring lands.",
  "scope": "Author scripts/sidecar/usage-snapshot.ps1 + scripts/cron/install-sidecar.ps1 + tests/checks/quota-status-schema.py (new). Produce .claude/state/quota-status.json on a 5-minute cron cadence with the schema documented below.",
  "scope_files_affected": [
    "scripts/sidecar/usage-snapshot.ps1 (new)",
    "scripts/sidecar/usage-snapshot-config.json (new)",
    "scripts/cron/install-sidecar.ps1 (new)",
    "scripts/cron/uninstall-sidecar.ps1 (new)",
    "tests/checks/quota-status-schema.py (new)",
    ".claude/state/quota-status.json (new file the sidecar writes)"
  ],
  "evidence_paths": [
    ".claude/state/wave-zero-dry-run/remediation/F1a-token-meter-gap-diagnostic.md",
    ".claude/state/discussion-bubbles/db-2026-05-13-003.md",
    ".claude/state/proposals/split-archived/PROP-003-original.md (the pre-split full proposal)"
  ],
  "fallback_plan": {
    "plan_a": "Manual paste via refresh-quota-manual.ps1 (existing). Sidecar invokes refresh-quota-manual.ps1 on a cron, prompting Founder; Founder pastes the dashboard number; sidecar writes quota-status.json. Lowest friction.",
    "plan_b": "Headless Claude Code /cost invocation. Requires Claude Code to support non-interactive /cost output. If unsupported at ship-time: defer to plan_a indefinitely.",
    "plan_c": "Console scrape via WebDriver. Brittle, last resort.",
    "abandon_criteria": "3 plans fail with distinct root causes within a single ship cycle. Escalate per criterion #5; the sidecar mechanics ship as a stub that emits a 'no-data' quota-status.json until a data source lands."
  },
  "rollback_strategy": "git revert <ship-closing-sha>; PowerShell Unregister-ScheduledTask -TaskName 'PARBAUGHS-Token-Sidecar' -Confirm:$false; rm .claude/state/quota-status.json. Risk-of-rollback LOW (pure additive, no consumer exists yet to break).",
  "cost_tokens": {
    "low": 120000,
    "high": 250000,
    "methodology": "Low end: plan_a only (manual paste wrapper) + cron scaffolding + schema check + smoke. High end: plan_b investigation + headless integration if available. No dashboard or telemetry integration in this scope (that's PROP-003.b)."
  },
  "bubble_voter_unanimity": {
    "bubble_id": "db-2026-05-13-003",
    "bubble_status": "approved-with-dissent",
    "vote_tally": {
      "approve": 2,
      "reject": 1,
      "abstain": 1
    },
    "dissent_note": "Inherits db-003 lineage from parent PROP-003. Founder ratified approval-with-dissent; the dissent (heuristic-only is insufficient) is resolved BY shipping the meter, which this proposal is part of."
  },
  "cross_cutting_assessment": {
    "category": "single-component: cron substrate only",
    "rationale": "PROP-003.a is intentionally scope-isolated to pass AMD-009 P4 cleanly. New cron task is the only substrate touched. Dashboards/telemetry/governance pieces ship in PROP-003.b + AMD-014 separately. Founder Option A explicitly authorized this split for this purpose."
  },
  "test_strategy_before_after": "BEFORE: no .claude/state/quota-status.json exists; agent has no real meter reads. AFTER: file present with valid schema; tests/checks/quota-status-schema.py asserts shape on every round-trip; smoke test confirms cron fires + file appears + schema matches. No downstream dashboard impact yet (intentional).",
  "depends_on": [],
  "frontmatter_declares_auto_implement": {
    "value": true,
    "rationale": "PROP-003.a is AMD-009-compliant, single-component, no unshipped dependencies, smoke-testable. Scanner will mark READY; auto-execute is appropriate."
  },
  "ship_target": "Wave 1 parallel work — no Wave 1 ship blocks PROP-003.a since it's pure cron infrastructure.",
  "estimate": {
    "cost_tokens": 200000,
    "duration_minutes": 120,
    "risk": "low"
  }
}
---

## Body

### Schema (quota-status.json)

```json
{
  "as_of": "<ISO-8601 UTC>",
  "data_source": "manual-paste" | "headless-cost" | "console-scrape",
  "stale_seconds": <int>,
  "weekly_tokens": <int>,
  "weekly_cap": <int | null>,
  "weekly_pct": <0-1 | null>,
  "org_monthly_tokens": <int>,
  "org_monthly_cap": <int | null>,
  "org_monthly_pct": <0-1 | null>,
  "org_monthly_reset_boundary": "<ISO-8601 UTC | null>",
  "_warning": "<set if stale_seconds > threshold>"
}
```

### Cron cadence

5-minute polling default. Configurable via
`scripts/sidecar/usage-snapshot-config.json`:

```json
{
  "poll_interval_minutes": 5,
  "stale_threshold_seconds": 600,
  "data_source_priority": ["headless-cost", "manual-paste"],
  "weekly_cap_override": null,
  "org_monthly_reset_boundary_override": null
}
```

### Acceptance criteria (binding per AMD-009 P3)

1. `scripts/sidecar/usage-snapshot.ps1` produces a valid quota-status.json
   on first run per the schema above
2. `tests/checks/quota-status-schema.py` validates the schema; round-trip
   integrates this check
3. `scripts/cron/install-sidecar.ps1` registers a Scheduled Task that fires
   every 5 minutes; verified via Get-ScheduledTask
4. Smoke test: cron fires manually -> quota-status.json appears -> schema
   matches -> log entry confirms data_source
5. NO dashboards consume quota-status.json yet (the integration is
   PROP-003.b; this ship is intentionally isolated)
6. NO governance docs amended yet (AMD-014 reactivates PAUSE_DISCIPLINE
   section 2.1 separately)

### Cross-references

- Parent proposal (archived): `.claude/state/proposals/split-archived/PROP-003-original.md`
- Companion ship: PROP-003.b (dashboard + telemetry integration)
- Companion amendment: AMD-014 (PAUSE_DISCIPLINE section 2.1 reactivation)
- F1a diagnostic: `.claude/state/wave-zero-dry-run/remediation/F1a-token-meter-gap-diagnostic.md`
- Bubble: `.claude/state/discussion-bubbles/db-2026-05-13-003.md`
