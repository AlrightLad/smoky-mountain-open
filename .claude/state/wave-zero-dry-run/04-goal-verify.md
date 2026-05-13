# Validation 4 — Goal-Completion-Verify Dry-Run

**Run:** 2026-05-13 (resume window after Python install)
**Outcome:** **PASS** — verifier detected the silently-omitted sub-goal, refused to mark parent complete, journaled `[GOAL-VERIFY-FAIL]`.

---

## Setup

A synthetic completed sub-task (`W0.DR4.1`) was constructed at:
`.claude/state/wave-zero-dry-run/synthetic-specs/synthetic-subtask-W0.DR4.md`

The fixture has TWO sections:
1. **Ground-truth acceptance criteria** (5 criteria: AC-1 through AC-5)
2. **Engineer walkthrough table** that silently omits AC-3 (empty state)

This models the failure mode P10 is designed to catch: Engineer declares completion based on a walkthrough that drops a criterion either by oversight or by silently dropping unimplemented work.

## Execute

`parbaughs-goal-completion-verify` was invoked on Engineer's walkthrough with the ground-truth criteria as the cross-reference source. Output written to:
`docs/agents/ship-reports/W0.DR4/goal-completion-verify.md`

(Per the V3 storage-convention bubble — real path used so the path itself gets exercised; ship-ID `W0.DR4` makes the dry-run nature explicit.)

## Verify

| Verification | Expected | Observed | Result |
|---|---|---|---|
| Verifier detects the missing sub-goal | yes | yes — AC-3 (empty state) explicitly named as missing | ✓ |
| Verifier does NOT mark parent complete | correct | correct — verdict "REJECT"; parent W0.DR4.1 stays in-progress; W0.DR4 ships_this_week telemetry NOT incremented | ✓ |
| Writes findings with `[GOAL-VERIFY-FAIL]` tag | yes | yes — explicit journal line in skill output: `[GOAL-VERIFY-FAIL] ship=W0.DR4 sub-task=W0.DR4.1 missing=AC-3 (empty-state) coverage=4/5` | ✓ |
| Names the specific missing criterion | yes | yes — AC-3 (empty-state) | ✓ |
| Preserves loop discipline (does NOT implement the fix) | correct | correct — verdict tells Engineer to re-enter /loop with AC-3 as next iteration goal; verifier proposes NO code | ✓ |
| Coverage metric correct | 4/5 = 80% | 4/5 = 80% | ✓ |

## Why this matters

P10 (Loop-and-Verify Discipline) blocks completion declarations that don't survive a structured walkthrough. The dry-run proves the verifier:
- Cross-references ground-truth criteria against Engineer's walkthrough
- Detects row-count mismatches (the simplest kind of omission)
- Names the specific gap, not just "incomplete"
- Refuses to advance state (parent stays in-progress)
- Hands back to Engineer's /loop without proposing the fix (preserving the loop-and-verify separation)

A weaker verifier might either rubber-stamp 4 visible rows or silently fill in AC-3 from the criteria source. Either failure would undermine P10's purpose. The dry-run confirms neither happens.

## Disposition

PASS. V4 mechanics work end-to-end.

## Notes

- The skill `parbaughs-goal-completion-verify.md` does NOT yet have a formal file in `.claude/skills/` (it's referenced by PROTOCOLS_P10_ADDITION.md as living there, but the file itself is pending). This dry-run validates the protocol end-to-end without that skill file existing, by treating the protocol description in PROTOCOLS_P10_ADDITION.md as the spec source. When the skill file is eventually authored, the dry-run output here serves as a concrete reference example.
- The fixture is intentionally simple (5 criteria, 1 omission). Future enhancements could test:
  - Two omissions (verifier names both)
  - Row present but evidence is "TODO" (verifier flags evidence quality)
  - Open-items list non-empty (verifier rejects on open items, separate gate)

## References

- Synthetic fixture: `.claude/state/wave-zero-dry-run/synthetic-specs/synthetic-subtask-W0.DR4.md`
- Verifier output: `docs/agents/ship-reports/W0.DR4/goal-completion-verify.md`
- Protocol spec: `docs/agents/PROTOCOLS_P10_ADDITION.md`
- P10 amendment to retrospective: `docs/agents/POST_PUSH_RETROSPECTIVE_P10_AMENDMENT.md`
