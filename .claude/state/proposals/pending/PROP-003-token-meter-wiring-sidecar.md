---
{
  "id": "PROP-003",
  "title": "Token-meter-wiring sidecar — substantive heuristic-sunset path for HALT 25",
  "lane": "Lane 3 — Performance / Infrastructure",
  "rationale": "F1 diagnostic confirms Claude Code agents cannot introspect their own token consumption from inside the tool surface. The PAUSE_DISCIPLINE 90% trigger cannot fire without a meter. The defensive heuristic (agent-feel pacing) is a band-aid; this proposal is the real fix — a sidecar process that writes usage snapshots to a watched file the agent reads each turn. Data-Integrity's forcing-function dissent on db-003 is resolved by this substantive draft (NOT a stub).",
  "scope": "Author scripts/cron/usage-snapshot.ps1 + integration in PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 2.1 + auto-read in scripts/aggregate-telemetry.py.",
  "estimate_tokens": 45000,
  "files_affected": [
    "scripts/cron/usage-snapshot.ps1 (new)",
    "scripts/cron/usage-snapshot-config.json (new — what to poll, how often, reset boundary)",
    "scripts/aggregate-telemetry.py (read .claude/state/usage-snapshot.json; populate weekly_tokens / weekly_cost / org_monthly_pct from real data)",
    ".claude/state/usage-snapshot.json (new — sidecar writes here; agent reads each turn)",
    "docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 2.1 (Founder-applied amendment: meter read via .claude/state/usage-snapshot.json)"
  ],
  "ship_target": "Post-Wave-Zero remediation ratification + cron-paused.json clear. Cycle 2 or earlier if Founder prioritizes."
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
