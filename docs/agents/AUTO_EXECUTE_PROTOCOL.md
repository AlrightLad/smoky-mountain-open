
# Auto-execute approved proposals (the auto-implementation gate)

## Founder directive (recorded verbatim)

> "The agent executes any proposal Founder has approved, BUT ONLY when
> the proposal can be shipped completely per AMD-009 Senior Engineering
> Standard. The gate isn't Founder review per execution. The gate is
> ship-completeness. Thoroughly scoped + deliberated proposals execute.
> Non-ready proposals wait until ready."

## Effect on db-2026-05-14-002

This directive resolves the open long-running bubble
`.claude/state/discussion-bubbles/db-2026-05-14-002.md` (auto-
implementation eligibility for approved proposals). The bubble had
proposed 6 options (manual / fully-auto / tagged-per-proposal /
tagged-and-gated / conservative-bounded / something-else); Founder
selected a refinement of option (d) tagged-and-gated: **the tag is
the AMD-009 ship-readiness assessment, not a per-proposal
`auto_implement: true` flag**.

Closure of db-002 is part of Step 2 (post-approval implementation),
NOT this amendment's text. See commit sequence below.

## Operating protocol

### Readiness assessment (Critic gate)

For each approved proposal in `.claude/state/proposals/approved/`,
the Critic verifies all 8 of:

1. **Scope bounded and enumerated** — every file affected is listed
   in the proposal's frontmatter or referenced ship-plan.
2. **Fallback plan documented** per AUTONOMOUS_FAILURE_RECOVERY v8.3
   (primary + Plan B + Plan C + abandon criteria).
3. **Reversible** — concrete rollback commands documented in the
   proposal or its ship plan.
4. **No cross-cutting architecture changes** — proposal does NOT
   modify governance, design-system foundation, cron substrate, or
   depend on other unshipped proposals.
5. **Round-trip test before/after coverage planned** — specific
   assertions named.
6. **Unanimous high confidence from originating bubble voters** (if
   the proposal originated from a bubble; non-bubble proposals
   skip this gate but DO still require all other gates).
7. **Frontmatter declares all of the above explicitly** — Critic can
   verify the gates from frontmatter alone, no spelunking required.
8. **Token-cost estimate has documented methodology** — not a single
   guess, range with reasoning.

If 8/8 → READY. If any gap → DEFERRED.

### READY path: auto-execute

1. Critic dispatches the proposal to ship cycle.
2. Team executes per AUTONOMOUS_FAILURE_RECOVERY v8.3:
   - Plan A primary approach
   - Fallback to B / C if blocked
   - Ship complete per AMD-009 OR escalate per criterion #5
3. On successful completion, proposal moves
   `approved/` → `shipped/`. Existing `scan-shipped-proposals.py`
   handles the move.
4. Founder Review Queue on `dashboard.html` reflects:
   - Proposal in flight (link to ship plan)
   - Estimated completion (token cost + rough ETA)
   - Ship complete when AMD-009 8/8 verified

### NOT READY path: ship-readiness-deferred

1. Proposal stays in `approved/` BUT a sibling-marker is written to
   `.claude/state/proposals/ship-readiness-deferred/<PROP-ID>.json`
   with the specific criteria that failed:
   ```json
   {
     "proposal_id": "PROP-XXX",
     "deferred_at": "<iso-ts>",
     "criteria_failed": ["Scope not enumerated — frontmatter missing files-affected list"],
     "resolution_path": "team or Founder authors missing fields; scanner re-evaluates next cycle"
   }
   ```
2. Founder Review Queue surfaces the proposal as
   "ship-readiness-deferred" with the gap stated.
3. Either Founder OR team can resolve the gap (authoring the missing
   frontmatter, narrowing scope, adding fallback) and re-evaluation
   happens on next scanner cycle.

### Mid-ship discipline

- In-flight ships finish on original plan. NEVER halt mid-ship to
  evaluate a newly-approved proposal.
- New approved proposals are evaluated at **ship boundaries** —
  commit messages matching the ship-close pattern (`*ship close*`,
  `*SHIPPED*`, `*ship_complete*`).
- If a proposal lands during ship execution, it queues to the next
  boundary's evaluation.

## Scanner specification (`.claude/scripts/scan-proposal-readiness.py`)

Pure Python, mirrors `scan-shipped-proposals.py` shape:

```python
def main():
    approved = list_proposals(".claude/state/proposals/approved")
    for prop in approved:
        criteria_failed = evaluate_amd009_readiness(prop)
        if not criteria_failed:
            # Mark READY; emit telemetry event for the
            # auto-execute trigger to pick up.
            emit_event("proposal.readiness.ready", {
                "proposal_id": prop["id"],
                "criteria_passed": 8,
            })
        else:
            # Write the ship-readiness-deferred marker.
            write_deferred_marker(prop["id"], criteria_failed)
            emit_event("proposal.readiness.deferred", {
                "proposal_id": prop["id"],
                "criteria_failed": criteria_failed,
            })
```

The scanner is READ-ONLY against the proposal files; it never edits
proposal frontmatter. Resolution of deferred gaps is a separate
authoring step (Founder or team), not the scanner's job.

## Scheduling

Two triggers:

1. **Cron — every 2 hours.** New scheduled task
   `PARBAUGHS-Proposal-Readiness-Scanner`. Mirrors
   `downloads-watcher`'s safety posture: respects `cron-paused.json`,
   refuses on dirty tree (unless the auto-commit pattern from
   `downloads-watcher.ps1` is replicated — likely yes).
2. **Ship-boundary trigger.** A post-commit hook (or scanner invocation
   inside the regen-all pipeline at ship-close commits) detects the
   ship-close pattern in HEAD's commit message and fires the scanner.

Combined effect: proposals get evaluated within 2 hours of approval,
OR immediately when the team transitions between ships, whichever
comes first.

## Dashboard surface (Founder Review Queue extension)

Extends the AMD-007 P18.6 Founder Review Queue. Adds 4 sub-counts to
the proposals section:

```
Proposals
  Ready for execution: N    (will auto-execute next cycle)
  Currently executing: P    (in-flight ship with progress)
  Ship-readiness-deferred: M (reasons enumerated)
  Completed since last visit: K (links to ship summaries)
```

Each sub-count links to a filtered view of `proposals.html`.

## Round-trip test extensions

Three new assertion blocks in `tests/round-trip-test.py`:

1. **`[proposal-readiness]`** — scanner runs cleanly against fixture
   proposals. Verifies the 8-criteria evaluator produces deterministic
   results for known-ready and known-deferred test cases.
2. **`[ship-readiness]`** — every proposal in `ship-readiness-
   deferred/` has a corresponding marker JSON with enumerated gaps;
   no orphan markers; no missing markers for deferred proposals.
3. **`[auto-execute]`** — every shipped proposal in `shipped/` has
   evidence that 8/8 criteria were verified at the time of execution
   (post-hoc audit log entry).

All three cited in the Critic protocol so Critic blocks commits that
violate these invariants.

## Commit sequence (Founder's directive verbatim)

Step 1 — Author this amendment. Founder approves via amendments.html.
**(This is Step 1; this commit's deliverable.)**

Step 2 — AFTER this amendment is applied:
- Build scanner + scheduling + state directories
- Extend Founder Review Queue
- Close `db-2026-05-14-002` with formal resolution citing this amendment
- Extend round-trip test

Step 3 — Test against current `approved/` queue (PROP-003, others if
any) as real-world test case. The scanner's first run is also its
acceptance test.

## Discipline (binding)

- AMD-009 senior standard applies throughout the auto-execution path.
- AUTONOMOUS_FAILURE_RECOVERY v8.3 in effect for any auto-executed ship.
- Critic gates the readiness assessment + the auto-execute trigger +
  the ship-complete verification (3 gates per proposal).
- Ship-complete or don't ship — this protocol enforces that
  contractually on every auto-executed proposal.
- NO mid-ship halts EVER. New proposals queue to next ship-boundary.
- In-flight ships finish on their original ship plan.

## What this amendment intentionally does NOT do

- Does NOT auto-author proposals — the team still authors; Founder
  still approves. Auto-execution kicks in AFTER Founder approval.
- Does NOT bypass Critic — Critic's role grows (3 gates now: readiness
  + trigger + ship-complete) rather than shrinks.
- Does NOT change the bubble-deliberation pattern for governance
  amendments — amendments still flow through amendments.html
  regardless of whether their target proposal would auto-execute.
- Does NOT modify the 5 escalation criteria. Auto-execution can still
  halt and escalate when one fires (e.g., a Plan-A failure that hits
  abandon criteria triggers criterion #5 escalation).

## Cross-references

- AMD-009 SENIOR_ENGINEERING_STANDARD (the gate criteria)
- AUTONOMOUS_FAILURE_RECOVERY v8.3 (the execution path)
- AMD-007 P18.6 Founder's Newspaper (the dashboard surface)
- AMD-006 P18.5 amendments lifecycle (the type discipline)
- db-2026-05-14-002 (the bubble this resolves)
- PROPOSAL_LIFECYCLE_v8.2 (the underlying state machine)
- `scripts/scan-shipped-proposals.py` (the scanner pattern to mirror)
