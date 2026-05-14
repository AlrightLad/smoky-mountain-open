---
id: AMD-005
title: Deprecate op-count defensive pause heuristic (trust substrate guardrails)
target_canonical_path: docs/agents/AUTONOMOUS_FAILURE_RECOVERY_v8.3.md
source_draft_path: .claude/state/amendments/pending/AMD-005-deprecate-op-count-pause.md
scope_summary: Removes the "defensive pause every 5 atomic ops" heuristic that was a placeholder for missing token-metering substrate. Replaces with explicit STOP CONDITIONS (HALT 1-25 / API error / AUTONOMOUS_FAILURE_RECOVERY abandon / 5 escalation criteria / Founder pause / natural ship completion). Commits stay atomic; pause-rate is independent of that discipline.
type: append-to-existing
section_anchor: "## 9 — Status"
depends_on: ["AMD-004"]
authored_by: claude-code
authored_at: 2026-05-14T01:55:00Z
bubble_of_record: null
estimate_tokens_to_apply: 1500
rollback_strategy: git revert; pre-deprecation behavior re-emerges automatically (the op-count heuristic was a soft rule, not a hard mechanism in code).
status: pending
operating_status: ACTIVE — deprecation operates immediately per Founder PROTOCOL UPDATE 2026-05-14; formalization artifact only.
---

# AMD-005 — Deprecate op-count defensive pause heuristic

This amendment retires the "defensive pause every 5 atomic ops" rule
that appeared in earlier substrate directives. Founder trusts the
current substrate guardrails to handle real pause conditions without
arbitrary op-count throttling.

## Why the heuristic existed

The op-count rule was a placeholder from when:
- No real token metering existed (F1a gap, addressed by PROP-003)
- Agents had no way to self-monitor consumption
- The substrate hadn't proven itself operationally

That world is gone. Current substrate provides everything the heuristic
was approximating:

| Real protection | Source |
|---|---|
| HALT 24 (auto-resume failure) catches genuinely stuck states | `docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md` § 4 |
| HALT 25 (meter unavailable) catches integrity issues | `docs/agents/HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md` |
| AUTONOMOUS_FAILURE_RECOVERY v8.3 handles real failures via Plan A → B → C | `AMD-004` |
| Critic gates every PR pre-close | `.claude/skills/parbaughs-critic-checklist.md` |
| Round-trip test catches drift | `tests/round-trip-test.py` (14 check blocks) |
| Cron-paused.json governance respect | All 3 cron scripts |
| last-verify.json checkpointing when actually needed | PAUSE_DISCIPLINE_v8.2 (AMD-001) |

The op-count rule was preventing autonomous flow without adding real
protection. The team's substantive-work signal is "did Critic gate
substantive vs fluff?" — not "did the op count hit 5?"

## The new protocol

Agents continue working through multi-phase ships until ONE of these
stop conditions fires:

```
STOP CONDITIONS (real, not heuristic):
  1. A HALT criterion fires (1-25 per HALT_CRITERIA_v8.1_ADDENDUM)
  2. A genuine API error occurs (not a parse failure that has a fix)
  3. AUTONOMOUS_FAILURE_RECOVERY v8.3 abandon_criteria met
     (3+ distinct approach attempts failed)
  4. One of the 5 escalation criteria fires
  5. Founder explicitly requests pause
  6. Ship work for the current task is COMPLETE (natural end of turn)
```

NOT stop conditions:
- Atomic op count
- Time elapsed (within reason)
- "Feeling tired" (agents don't get tired; this was projection)
- "Should we check with Founder?" without one of the 5 criteria
- Conservative caution without specific reason

## Commit discipline stays

Commits remain atomic and small (one logical change per commit). That
discipline is independent of pause-rate; it's about reversibility.

Multi-commit ships still split work across multiple commits. What
changes is: the team doesn't artificially stop between commits when
nothing is actually wrong.

## Application target

This amendment appends a new section "## 11 — Op-count deprecation
(2026-05-14)" to `docs/agents/AUTONOMOUS_FAILURE_RECOVERY_v8.3.md`
(target file from AMD-004; depends_on chain ensures AMD-004 is applied
first).

The appended section contains the new STOP CONDITIONS list above
plus the WHY block, plus the explicit NOT-stop-conditions list. The
existing AUTONOMOUS_FAILURE_RECOVERY content remains unchanged.

## Status

Effective NOW for:
- Main-flows v2 Phase 1 audit (resume + run through to commit)
- Amendments lifecycle 3/4 + 4/4 (run through to completion)
- First amendments approval via amendments.html
- Design tooling spike (queued)
- All future Wave 1 ship work

This draft becomes the 5th amendment Founder approves through
amendments.html when it ships.

## Cross-references

- `AMD-004` AUTONOMOUS_FAILURE_RECOVERY_v8.3 (depends_on; provides the
  target doc this amendment appends to)
- Founder PROTOCOL UPDATE 2026-05-14: "Remove defensive pause heuristic"
- Historical earlier directives where the op-count rule appeared:
  - Substrate final sequence directive ("Defensive pause every 5 atomic ops")
  - Multiple turn-level directives during DC-1..DC-9 work
