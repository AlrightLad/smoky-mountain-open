# Archived proposals

This directory holds proposals whose intent has been **subsumed by shipped substrate** but were never formally closed. Archiving is the cleanup move when the deliverable in a proposal is verifiably operative on disk (skill installed, script wired, hook active, AMD applied) yet the proposal file itself was never moved out of `approved/` or `ship-readiness-deferred/`.

## When a proposal belongs here vs other states

| State directory | Meaning |
|---|---|
| `pending/` | Authored but not yet Founder-approved |
| `approved/` | Founder approved; awaiting (or in flight for) implementation |
| `ship-readiness-deferred/` | Scanner-flagged for sparse frontmatter / missing token-cost methodology; needs author touch-up before apply-decisions pipeline can run automatically |
| `shipped/` | Implementation complete + closure verified + formal move done |
| **`archived/` (this dir)** | Substrate operative on disk; proposal was redundant administratively but Founder-approved formally. Subsumed by a shipped feature, an AMD, or a sister proposal whose scope expanded to cover this one. |
| `rejected/` | Founder declined |
| `split-archived/` | Original proposal that was split into 2+ sub-proposals (e.g., PROP-003 → PROP-003.a + PROP-003.b) |

## Why "archived" instead of "shipped"

`shipped/` indicates a clean roundtrip: proposal authored, ratified, implemented, closed. The 7 proposals archived 2026-05-19 followed a different path — their content was authored, approved, and the substrate was built and operated **before** the formal `approved/ → shipped/` move happened. By the time the formal closure was due, the proposals were redundant artifacts.

Rather than retroactively pretend they shipped cleanly, archiving acknowledges:

1. The Founder approved the content.
2. The substrate is operative (verifiable on disk).
3. The proposal file itself contributed no additional execution step beyond what was already done.

## Each archived proposal includes an "Archive metadata" trailing block

```
archived_at: <ISO timestamp>
archived_by: <attribution; e.g., founder-blanket-approval-2026-05-19>
obsoleted_by: <citation; e.g., SHIPPED — .claude/skills/X + AMD-Y operative>
```

The citation includes the specific AMDs, scripts, skills, or shipped features that absorbed the proposal's scope, plus a pointer to the triage document that authorized the archive.

## Audit trail

Decisions are journaled in `.claude/state/proposals/decisions-log.ndjson`. The corresponding apply log lives under `.claude/state/dashboard-audit-2026-05-18/PROPOSAL-TRIAGE-APPLY-LOG.md` for the 2026-05-19 batch.
