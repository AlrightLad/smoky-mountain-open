# Validation 2 — Pre-flight Audit Dry-Run

**Run:** 2026-05-13 (resume window after Python install)
**Outcome:** **PASS** — Critic detected all 3 planted contradictions, refused to approve.

---

## Setup

A synthetic ship Vision was authored at `.claude/state/wave-zero-dry-run/synthetic-specs/synthetic-ship-W0.DR2.md` containing 3 deliberate contradictions of escalating subtlety:

1. **Surface:** § 2 forbids masthead height change (CFR locked); § 3 prescribes a +48px height change. Same Vision, opposite directives.
2. **Constraint cross-ref:** § 2 forbids new sessionStorage keys (per CLAUDE.md); § 3 adds `pb_recent_range_carousel`.
3. **Architecture:** § 3 prescribes "wire page-shell consumers to opt into new height" — but page-shell.js architecture rule 2 forbids per-page chrome control. Subtle because the surface text reads plausibly; the architecture violation requires cross-referencing CLAUDE.md's Page Shell engineering rules to catch.

The spec is stored at the dry-run path and is NEVER promoted to `docs/agents/ship-visions/` — it's a synthetic artifact for this validation only.

## Execute

Critic ran a pre-flight audit per `docs/agents/CRITIC.md` § 3 + `CRITIC_P10_ADDENDUM.md`. Methodology was top-to-bottom Vision read + cross-reference of § 1/2/3/4 against governance docs.

Audit output written to: `.claude/state/audits/W0.DR2-audit-dry-run-cycle.md`

## Verify

| Verification | Expected | Observed | Result |
|---|---|---|---|
| Critic detects planted contradiction 1 (height) | yes | yes | ✓ |
| Critic detects planted contradiction 2 (sessionStorage) | yes | yes | ✓ |
| Critic detects planted contradiction 3 (architecture) | yes | yes | ✓ |
| Critic writes audit findings to `.claude/state/audits/` | yes | yes — `W0.DR2-audit-dry-run-cycle.md` | ✓ |
| Critic does NOT proceed to approve | correct | did not approve; recommended return-to-Vision-authoring | ✓ |
| Critic does NOT invoke Engineer | correct | no handoff written to Engineer; explicit "Engineer is not invoked on this spec" in audit | ✓ |

**Detection rate:** 3 / 3 (100%). Even the subtle architecture contradiction was caught by cross-referencing CLAUDE.md's Page Shell rules, not just rereading the spec text.

## Disposition

PASS. Critic mechanics work end-to-end:
- Synthetic contradictory spec → audit triggered → contradiction detection → audit file written → no approval propagated downstream.

## Notes

- This run was single-author (Critic role only). A real ship cycle would have Critic + Engineer + (where applicable) Data-Integrity + Performance/Security audits. The dry-run validates Critic's pre-flight detection slice; multi-role audits are exercised in V3 (discussion bubble) and V11 (handoff scenarios) downstream.
- The audit file's "Validation 2 cross-reference" section explicitly tabulates which planted contradictions were detected. Future Critic-related dry-runs can reuse this synthetic spec as a regression fixture — it has a defined ground truth.
- No real ship `W0.DR2` exists. The ID is reserved for dry-run use only and is documented as such inline in the spec to prevent future-self confusion.

## References

- Subject spec: `.claude/state/wave-zero-dry-run/synthetic-specs/synthetic-ship-W0.DR2.md`
- Audit output: `.claude/state/audits/W0.DR2-audit-dry-run-cycle.md`
- Runbook step: `docs/agents/WAVE_ZERO_DRY_RUN_RUNBOOK.md` § Validation 2
- Critic discipline: `docs/agents/CRITIC.md`, `docs/agents/CRITIC_P10_ADDENDUM.md`
