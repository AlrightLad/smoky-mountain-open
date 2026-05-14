---
id: AMD-007
title: Dashboard = Founder's Newspaper protocol (canonical review surface)
target_canonical_path: docs/agents/PROTOCOLS_v8.1_ADDENDUM.md
source_draft_path: .claude/state/amendments/pending/AMD-007-dashboard-as-newspaper.md
scope_summary: Establishes dashboard.html as the canonical start-of-day / end-of-day Founder surface. Every Founder-review-needed item — governance gates, system health, activity since last visit, open exceptions — routes through a "Founder Review Queue" section on dashboard.html. Critic gates added to every commit. Operating immediately; dashboard.html + regen-dashboard.py implementation queued for the next ship cycle.
type: append-to-existing
section_anchor: null
depends_on: []
authored_by: claude-code
authored_at: 2026-05-14T02:05:00Z
bubble_of_record: null
estimate_tokens_to_apply: 5500
rollback_strategy: git revert; protocol text is additive, queue logic in regen-dashboard.py is a clean subtree.
status: pending
operating_status: ACTIVE — protocol operates immediately per Founder directive 2026-05-14; dashboard.html + regen-dashboard.py implementation is a separate Wave 1 ship.
id_conflict_note: Founder directive originally specified filename AMD-006-dashboard-as-newspaper.md, but AMD-006-P18-amendments-discipline.md is already in applied/ (committed 9edb38e this session). Using AMD-007 to preserve the monotonic-ID invariant per AMD frontmatter schema P18.5.2. Title and content match Founder's stated intent verbatim.
---

# P18.6 — Dashboard = Founder's Newspaper

## Principle

`docs/reports/dashboard.html` is Founder's canonical newspaper. Every item
requiring Founder eyes is surfaced on the dashboard. Team session logs,
state-tree files, and per-surface dashboards (amendments.html,
proposals.html, etc.) are NOT acceptable substitutes — they're drill-down
destinations that the dashboard LINKS TO, not standalone review surfaces.

Founder should be able to open dashboard.html cold (no context from prior
session) and within 60 seconds answer:
- "What needs my decision today?"
- "What changed since I last looked?"
- "Is anything broken?"

If a Founder-eyes item exists somewhere in the repo and is NOT on the
dashboard, the dashboard is wrong and must be fixed before the work that
created the item is considered done.

## What MUST surface on dashboard.html

### Open governance gates
- Amendments awaiting approval (count + link to amendments.html)
- Discussion bubbles flagged for Founder attention (count + link to
  discussion-bubbles.html)
- Proposals awaiting decision (count + link to proposals.html)
- Open Phase-gate escalations (taxonomy decisions, cross-cutting
  architecture choices — per escalation criterion #5)

### System health
- Cron last-fire status (each cron: when last fired, success/fail)
- Last regen-all status
- Working tree status (clean vs. uncommitted)
- HALT state (any active halts visible)
- Round-trip test last-pass status

### Activity since last Founder visit
- Commits since last Founder session
- Files changed since last Founder session
- Ships closed
- Bubbles closed with disposition
- Proposals applied
- Amendments applied

### Open exceptions / errors
- Any failed cron runs
- Any AUTONOMOUS_FAILURE_RECOVERY abandon_criteria hit
- Any test failures
- Any stuck states (last-verify.json present > 24h)

## What MUST NOT surface on dashboard.html

- Routine work-in-progress (lives in `.claude/state/`)
- Audit trails (lives in dedicated logs)
- Detailed technical reports (live in state files; dashboard LINKS to
  them when relevant — never inlines)

## Section layout

Add a "Founder Review Queue" section to dashboard.html, positioned
at the top of the page (above the existing "This week" + "Recent 7
days" sections).

- Visually distinct: brass accent border, larger headline treatment.
- Each queue item: `{type, count, last_updated, link}` — kept terse.
- Empty queue is a valid state — render an "All caught up" message
  rather than collapsing the section (Founder needs the affirmative
  signal that nothing is waiting).
- Stale items (`last_updated > 3 days ago`) flagged distinctly (warning
  border or icon) — surfaces bit-rot in the queue.

## Data wiring

Extend `scripts/regen-dashboard.py` to aggregate queue items:

```python
def build_founder_queue():
    return {
        "governance_gates": {
            "amendments_pending":   count_amendments_pending(),
            "amendments_link":      "amendments.html",
            "bubbles_flagged":      count_bubbles_flagged_for_founder(),
            "bubbles_link":         "discussion-bubbles.html",
            "proposals_pending":    count_proposals_pending(),
            "proposals_link":       "proposals.html",
            "open_escalations":     list_open_phase_escalations(),
        },
        "system_health": {
            "crons":                cron_last_fire_map(),
            "last_regen_all":       last_regen_all_status(),
            "working_tree":         working_tree_status(),
            "halts":                active_halts(),
            "round_trip_last_pass": round_trip_last_pass_ts(),
        },
        "activity_since_last_visit": {
            "commits":             commits_since_last_founder_visit(),
            "files_changed":       files_changed_since_last_visit(),
            "ships_closed":        ships_closed_since_last_visit(),
            "bubbles_closed":      bubbles_closed_since_last_visit(),
            "proposals_applied":   proposals_applied_since_last_visit(),
            "amendments_applied":  amendments_applied_since_last_visit(),
        },
        "exceptions": {
            "failed_crons":        failed_cron_runs_recent(),
            "abandon_triggers":    autonomous_failure_abandon_evidence(),
            "test_failures":       recent_test_failures(),
            "stuck_states":        stuck_last_verify_states(),
        },
    }
```

Each section auto-collapses to a `{count, last_updated}` summary at the
top; click-to-expand for the full list. "Last Founder visit" tracked via
a state file (`.claude/state/founder/last-visit.json`) updated whenever
Founder explicitly marks the dashboard as reviewed.

## Critic gates added to every commit

```
[ ] If this commit creates anything Founder needs to see, the dashboard
    data block reflects it.
[ ] If this commit closes something Founder was awaiting, the dashboard
    data block reflects the closure.
[ ] Founder Review Queue count is accurate (no stale entries pointing
    to closed items; no missing entries for open items).
```

These run alongside existing protocol gates (P18.1 source-of-truth,
P18.3 round-trip validation, P18.5.5 amendments-aware reviews).

## Existing reports policy

Every team report that surfaces ANYTHING needing Founder eyes MUST ALSO
update the dashboard so Founder can find it on next visit WITHOUT
reading the team's session log.

Existing reports authored before this protocol landed
(`.claude/state/wave-zero-dry-run/CONSOLIDATED_REPORT_TO_FOUNDER.md`,
etc.) MAY remain as detail surfaces, but the dashboard MUST link to
them from the corresponding queue item — Founder should never need to
open a state-tree report cold to discover a pending gate.

## Operating discipline (immediate, pre-implementation)

The protocol is ACTIVE from the moment AMD-007 is authored. Until
dashboard.html + regen-dashboard.py implementation lands (Wave 1
follow-on ship), the team manually maintains a queue stub at
`.claude/state/founder/review-queue.json` so the gate is honored even
when the rendered surface is incomplete. The Critic gates above apply
against that stub until the rendered surface exists.

This avoids the "we'll surface it once the dashboard supports it"
anti-pattern that would let Founder-eyes items slip during the
implementation window.

## Implementation scope (Wave 1 follow-on ship)

A separate ship plan (W1.S?? — "Founder Review Queue Implementation")
will:

1. Build the "Founder Review Queue" section in dashboard.html.
2. Extend regen-dashboard.py with the aggregator functions above.
3. Wire stale-flag thresholds + empty-queue copy.
4. Add the 3 Critic gates to the Critic checklist skill.
5. Add round-trip validation: dashboard.html must always have a
   `founder_queue` top-level key in its data block; counts must match
   on-disk source-of-truth (parallels the existing proposals_pending
   and amendments_counts cross-dash consistency checks).

## Cross-references

- P18 Operational View Discipline (PROTOCOLS_v8.1_ADDENDUM.md)
- P18.5 Amendments-lifecycle (added by AMD-006, applied 2026-05-14)
- AUTONOMOUS_FAILURE_RECOVERY_v8.3 §3 abandon_criteria (drives the
  "abandon_triggers" exception surface)
- 5 escalation criteria (drives "open Phase-gate escalations" queue)
