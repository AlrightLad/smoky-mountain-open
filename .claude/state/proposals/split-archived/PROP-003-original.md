---
{
  "id": "PROP-003",
  "title": "Token-meter-wiring sidecar — substantive heuristic-sunset path for HALT 25",
  "lane": 3,
  "lane_label": "Performance",
  "created_at": "2026-05-13T15:00:00Z",
  "rationale": "F1 diagnostic confirms Claude Code agents cannot introspect their own token consumption from inside the tool surface. The PAUSE_DISCIPLINE 90% trigger cannot fire without a meter. The defensive heuristic (agent-feel pacing) is a band-aid; this proposal is the real fix — a sidecar process that writes usage snapshots to a watched file the agent reads each turn. Data-Integrity's forcing-function dissent on db-003 is resolved by this substantive draft (NOT a stub).",
  "scope": "Author scripts/cron/usage-snapshot.ps1 + integration in PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 2.1 + auto-read in scripts/aggregate-telemetry.py.",
  "estimate": {
    "cost_tokens": 45000,
    "duration_minutes": 90,
    "risk": "medium"
  },
  "files_affected": [
    "scripts/cron/usage-snapshot.ps1 (new)",
    "scripts/cron/usage-snapshot-config.json (new — what to poll, how often, reset boundary)",
    "scripts/aggregate-telemetry.py (read .claude/state/usage-snapshot.json; populate weekly_tokens / weekly_cost / org_monthly_pct from real data)",
    ".claude/state/usage-snapshot.json (new — sidecar writes here; agent reads each turn)",
    "docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 2.1 (Founder-applied amendment: meter read via .claude/state/usage-snapshot.json)"
  ],
  "evidence_paths": [
    ".claude/state/wave-zero-dry-run/remediation/F1a-token-meter-gap-diagnostic.md",
    ".claude/state/discussion-bubbles/db-2026-05-13-003.md"
  ],
  "ship_target": "Post-Wave-Zero remediation ratification + cron-paused.json clear. Cycle 2 or earlier if Founder prioritizes.",
  "scope_files_affected": [
    "scripts/cron/usage-snapshot.ps1 (new)",
    "scripts/cron/usage-snapshot-config.json (new — what to poll, how often, reset boundary)",
    "scripts/aggregate-telemetry.py (read .claude/state/usage-snapshot.json; populate weekly_tokens / weekly_cost / org_monthly_pct from real data)",
    ".claude/state/usage-snapshot.json (new — sidecar writes here; agent reads each turn)",
    "docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 2.1 (Founder-applied amendment: meter read via .claude/state/usage-snapshot.json)"
  ],
  "fallback_plan": {
    "plan_a": "Source data via manual paste (refresh-quota-manual.ps1 already in repo). Sidecar prompts Founder once a day; agent reads .claude/state/usage-snapshot.json. Lowest infrastructure cost; bootstrap path.",
    "plan_b": "Source data via second Claude Code instance in headless mode invoking /cost periodically. Requires Claude Code to support headless /cost (uncertain at authoring). If unsupported: stay on plan_a indefinitely.",
    "plan_c": "Anthropic console scrape (login + parse). Brittle, breaks on UI changes. Last resort.",
    "abandon_criteria": "3 plans fail with distinct root causes within a single ship cycle, escalate per criterion #5 (cross-cutting architecture). The PAUSE_DISCIPLINE section 2.1 amendment piece becomes a separate AMD that can ship independently."
  },
  "rollback_strategy": "git revert <ship-closing-sha>; rm .claude/state/usage-snapshot.json (clean stale state); PAUSE_DISCIPLINE section 2.1 amendment rolled back separately via its own AMD revert. Risk-of-rollback LOW for sidecar mechanics (additive); MEDIUM for the governance amendment.",
  "cost_tokens": {
    "low": 150000,
    "high": 350000,
    "methodology": "Low end assumes plan_a (manual paste) only: sidecar PowerShell loop + aggregate-telemetry.py read integration + dashboard regen test ~150k. High end adds plan_b investigation + headless /cost integration if available (~200k additional). Original 45k estimate predated AMD-009; reflects raw code authoring without test/verification/round-trip discipline scope."
  },
  "bubble_voter_unanimity": {
    "bubble_id": "db-2026-05-13-003",
    "bubble_status": "approved-with-dissent",
    "vote_tally": {
      "approve": 2,
      "reject": 1,
      "abstain": 1
    },
    "dissent_note": "Data-Integrity's forcing-function dissent was that the heuristic-only approach (PAUSE_DISCIPLINE) wasn't sufficient. PROP-003 IS the substantive response to that dissent. By shipping the meter, the dissent is resolved. Founder ratified approval-with-dissent on this basis. Scanner should accept per PARBAUGHS lifecycle (approved-with-dissent is a valid approval state)."
  },
  "cross_cutting_assessment": {
    "category": "cross-cutting: dashboards + telemetry + cron + governance amendment",
    "rationale": "PROP-003 touches: (a) cron substrate via new usage-snapshot.ps1; (b) telemetry aggregator via aggregate-telemetry.py snapshot read; (c) dashboards downstream via populated weekly_tokens / org_monthly_pct fields; (d) governance via PAUSE_DISCIPLINE section 2.1 amendment that documents the meter as the canonical pause trigger. AMD-009 P4 forbids cross-cutting changes in a single proposal. Honest assessment: scanner WILL defer PROP-003 on P4 grounds. Founder may (a) split PROP-003 into PROP-003.a (mechanics) + AMD-XXX (governance), or (b) explicitly waive P4 for this one. Auto-execute pattern then runs the bundled work as one unit, with Critic gating each sub-deliverable to ship-complete."
  },
  "test_strategy_before_after": "BEFORE: dashboard weekly_tokens shows 0 OR the operator-asserted estimate (4.2M from session-summary, commit 8b7e117). aggregate-token-usage shows estimated=4.2M / real=0. AFTER: dashboard weekly_tokens reflects real meter reads when sidecar runs; operator-asserted source stays as a fallback when sidecar is stale > 600s. Round-trip extension: new [meter-wiring] block validating usage-snapshot.json schema + freshness gates. Token-usage dashboard 'real' column becomes non-zero for the first time in PARBAUGHS history.",
  "frontmatter_declares_auto_implement": {
    "value": false,
    "rationale": "PROP-003 is honestly cross-cutting (see cross_cutting_assessment). Per AMD-011 + AMD-009 P4, the scanner will defer it. Setting auto_implement=False is the honest declaration; Founder explicitly authorizes either a split or a P4 waiver before this ships under the auto-execute path."
  },
  "split_status": {
    "split_at": "2026-05-14T04:50:00Z",
    "split_by": "founder-directive-2026-05-14-option-A",
    "split_into": [
      "PROP-003.a",
      "AMD-014",
      "PROP-003.b"
    ],
    "note": "Split into PROP-003.a (sidecar mechanics) + AMD-014 (PAUSE_DISCIPLINE section 2.1 reactivation governance) + PROP-003.b (dashboard + telemetry integration) per Founder directive. Each ship is AMD-009-compliant; each is independently reversible. Original proposal preserved here for audit trail."
  }
}
---

## Body

### Architecture sketch

```
┌─────────────────────────┐         ┌───────────────────────┐
│  Founder's machine      │ writes  │  .claude/state/       │
│  scripts/cron/          │────────▶│    usage-snapshot.json│
│  usage-snapshot.ps1     │ every   │  (atomic temp-rename) │
│  (polls 1-5 min)        │ N sec   └───────────┬───────────┘
└────────┬────────────────┘                     │ reads
         │                                      │ each turn
         │ data source (one of):                ▼
         │  - /cost output from a 2nd Claude   ┌────────────┐
         │    Code instance running in         │ Claude     │
         │    background mode                  │ Code agent │
         │  - Anthropic console scrape         │ (this one) │
         │  - Local API proxy logs (if any)    └────────────┘
         └─────────────────────────────────────
```

The sidecar runs on Founder's machine as either a long-running PowerShell loop OR a Task Scheduler task firing every N minutes (Founder choice). It produces:

```json
{
  "as_of": "<ISO-8601 UTC>",
  "weekly_tokens": <int>,
  "weekly_cost_usd": <float>,
  "weekly_tokens_cap": 3500000,
  "weekly_pct": <0-1>,
  "org_monthly_tokens": <int>,
  "org_monthly_cap": <int>,
  "org_monthly_pct": <0-1>,
  "org_monthly_reset_boundary": "<ISO-8601 UTC>",
  "data_source": "claude-code-cost-output" | "console-scrape" | "manual",
  "stale_seconds": <int>,
  "_warning": "<set if stale > threshold>"
}
```

### Sub-questions Founder may want to think through

1. **Where does the sidecar get the data from?** Three candidates:
   - (a) A second Claude Code instance running headless / non-interactive, periodically invoking `/cost` and writing the output. Requires Claude Code to support headless `/cost` invocation; if not, kill option.
   - (b) Anthropic console scrape (login + parse). Brittle, breaks on UI changes. Last resort.
   - (c) Manual: Founder runs a one-line PowerShell that asks them to copy-paste the dashboard number once a day. Works, but Founder has to remember.
   - **Recommendation:** start with (c) as the bootstrap; explore (a) as the production target. Document (c) as a fallback even after (a) ships.

2. **How often does the sidecar poll?** Per minute is overkill (Anthropic's dashboard probably doesn't refresh that fast). Per 5 minutes is reasonable for a session running near-cap. Per hour is too coarse for the 90% trigger to fire in time. **Recommendation:** 5 minutes.

3. **What if the sidecar isn't running?** The agent reads `usage-snapshot.json`. If absent, OR `stale_seconds > 600` (10 min): HALT 25 fires per proposed-halt-25.md § 1.

4. **org-monthly reset boundary** — see PROP-004; this proposal pulls from there.

### Devil's-Advocate stress-tests absorbed (from db-003)

1. **"Sidecar-not-running" fallback:** addressed — HALT 25 fires; agent over-pauses.
2. **org-monthly reset boundary:** addressed — pulls from PROP-004 (configurable).
3. **"Agent-feel-based" heuristic is the actual rule, not threshold:** until this proposal ships, yes. After: meter reads provide the rule; agent-feel demotes to fallback.

### Acceptance criteria (for cycle that builds this)

1. `scripts/cron/usage-snapshot.ps1` produces a valid snapshot per the schema above on first run
2. `scripts/aggregate-telemetry.py` reads the snapshot and populates `weekly_tokens` + `org_monthly_pct` from real data (replaces the F2 placeholder zeros)
3. Dashboard regen surfaces the real values
4. PAUSE_DISCIPLINE § 2.1 amendment lands (Founder applies): "Meter is read from `.claude/state/usage-snapshot.json`; if absent or stale > 600s, HALT 25 fires."
5. 7 consecutive days of sidecar-running + no out-of-band quota events = HALT 25 sunset condition met (per proposed-halt-25.md § 6)

### Cross-references

- F1a diagnostic: `.claude/state/wave-zero-dry-run/remediation/F1a-token-meter-gap-diagnostic.md`
- Bubble: `.claude/state/discussion-bubbles/db-2026-05-13-003.md`
- Companion halt: `.claude/state/wave-zero-dry-run/remediation/proposed-halt-25.md`
- Companion quota: `.claude/state/proposals/pending/PROP-004-org-monthly-quota-type.md`
