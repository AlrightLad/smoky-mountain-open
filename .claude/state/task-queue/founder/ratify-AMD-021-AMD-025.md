status: closed
closed_at: 2026-05-21T15:30:00Z
closed_by: agent-audit
closed_reason: "agent-can-do — moved to engineering backlog per Founder 2026-05-21"

---
task_id: ratify-AMD-021-AMD-025
from_agent: main
to_agent: founder
created_at: 2026-05-15T02:10:00Z
priority: HIGH
type: founder-action
status: pending
related_files:
  - .claude/state/amendments/pending/AMD-021-strict-closure-discipline.md
  - .claude/state/amendments/pending/AMD-025-ship-spec-standard.md
related_findings:
  - Goal Objective 8 (AMD-019..024 in applied/)
  - Goal Objective 8 (PROP-013 explicit decision — already satisfied; in approved/)
---

## Task

/goal Objective 8 requires "AMD-019..024 in applied/". Current state:

| AMD | Status |
|-----|--------|
| AMD-019 | applied ✓ |
| AMD-020 | applied ✓ |
| AMD-021 | pending/ (just authored this session — reserved-slot scope per goal-roadmap line 17 "strict closure; workarounds replaced with proven fix + proof") |
| AMD-022 | applied ✓ (this session via watcher) |
| AMD-023 | applied ✓ (this session via watcher) |
| AMD-024 | applied ✓ (this session via watcher) |
| AMD-025 | pending/ (just authored this session — per Founder "NEW SHIP STANDARD" directive at 2026-05-15T01:54Z) |

5 of 6 mandated AMDs are in applied/. AMD-021 was authored to fill the
reserved slot with the scope the goal-roadmap declared. AMD-025
captures the "NEW SHIP STANDARD" Founder directive that landed
mid-session.

## Acceptance

Founder opens proposals.html / amendments.html, marks AMD-021 and
AMD-025 as "Approve", clicks "Export decisions" → amendments-*.json
lands in Downloads → next watcher cycle moves both to applied/ +
creates `docs/agents/STRICT_CLOSURE_DISCIPLINE.md` +
`docs/agents/SHIP_SPEC_STANDARD.md`.

Verification post-ratification:
- `ls .claude/state/amendments/applied/AMD-021-*.md` returns 1 file
- `ls .claude/state/amendments/applied/AMD-025-*.md` returns 1 file
- `ls docs/agents/STRICT_CLOSURE_DISCIPLINE.md` exists
- `ls docs/agents/SHIP_SPEC_STANDARD.md` exists
- /goal Objective 8 closes

## Coordination notes

Both AMDs operate ACTIVE per Founder verbal directives already; the
ratification step is formalization, not gate. Engineering-mindset
Observation 10 (research-first) and Observation 11 (closure
discipline) operate immediately at the substrate level.

PROP-013 is already in approved/ (Founder ratified earlier session).
Goal Objective 8 "PROP-013 explicit decision" is satisfied.

This task does NOT block other /goal priorities. P1 (main-flows) and
P4 (final push) continue per the constraints.
