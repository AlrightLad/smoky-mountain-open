# Decision Bubbles

Active decision bubbles per HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md Gap 2 protocol.

## Naming

Files named `<timestamp>-<short-id>.md` where:
- `<timestamp>` is YYYYMMDD-HHMM format
- `<short-id>` is a kebab-case identifier of the decision (e.g., `firestore-listener-pattern`)

## Lifecycle

1. **Open** — Orchestrator creates file with question + options
2. **Voting** — Agents add votes per format in HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md
3. **Closed** — Orchestrator executes winning option; updates Status
4. **Archived** — At retrospective, moves to `docs/agents/lessons-learned/decision-bubbles/<wave>/<bubble-id>.md`

## Empty state

(No active decision bubbles at Phase 1 commit. First decision bubble fires at first ambiguous situation post-activation.)
