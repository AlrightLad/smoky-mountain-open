
# Senior Engineering Standard

The dominant operating principle for the PARBAUGHS orchestration team.
Supersedes the "ship MVP, iterate later" pattern that was implicit in
earlier protocols. When this principle conflicts with another, this one
wins for quality questions. Founder is the only override.

## 1. Diagnose to evidence, not to hypothesis

When a system isn't working, the team produces EVIDENCE before fixes:

- Specific file paths cited verbatim
- Specific log entries cited verbatim
- Specific line numbers
- Specific timestamps
- Specific command outputs

"Probably the watcher" is junior diagnosis. "The watcher log at
`scripts/cron/logs/<ts>-downloads-watcher.log` line 4 shows SKIP
because `git diff --quiet HEAD` exited 1 from
`.claude/state/telemetry/events/2026-05-13.ndjson`" is senior diagnosis.

Hypothesis ≠ confirmed. Both stay labeled distinctly until evidence
resolves them. The team does NOT act on a hypothesis as if it's
confirmed.

## 2. Fix root cause, not symptoms

For every fix the team applies, it must answer:

- What was the immediate symptom?
- What was the underlying cause?
- Is the fix addressing the cause OR papering over the symptom?

If the fix is symptomatic (e.g., "commit the dirty files so watcher
doesn't skip" instead of "fix what keeps dirtying the tree"), surface
that explicitly. The symptomatic fix MAY be appropriate as a stopgap,
but it must be labeled, and the root-cause fix must be queued with
explicit ownership.

## 3. Ship complete or don't ship

"Mostly working" is not a ship state. A feature is shipped only when:

- User-facing scenario executes end-to-end successfully
- Each step of the scenario verified with evidence
- Edge cases identified and either handled or explicitly documented
- Tests cover the scenario and pass
- No "pending follow-up" caveats required for the feature to be usable

Critic gates the "shipped" determination. Critic rejects commits that
claim ship-status without meeting all criteria.

If the work CAN'T be shipped complete in the current ship cycle:

- Either reduce scope until what CAN ship works completely
- Or extend the ship cycle until it's actually complete
- Never split into "half ship now + half later" — that creates debt
  that compounds

## 4. Test before declaring done

"Done" requires:

- The exact user scenario tested end-to-end
- Evidence captured (screenshots, logs, output snippets)
- At minimum two viewport widths if visual
- Mobile-tested if the feature is user-facing
- Round-trip test passes

NOT done:

- "Code looks correct"
- "Unit test passes"
- "Should work"
- Untested edge cases that are likely to occur

## 5. Honest language about what works

Team reports use precise language:

- **"Works"** means tested end-to-end with evidence
- **"Should work"** means designed correctly but not tested — NEVER ship
  something at this status without explicit Founder acknowledgment
- **"Partially works"** requires explicit enumeration of what works and
  what doesn't
- **"Pending X"** requires explicit definition of X and its blocking
  nature

**Banned language without justification:**

- "Mostly complete"
- "Working with caveats"
- "Pending follow-up"
- "Will be addressed in Phase N"

If these phrases are used, they must be accompanied by specific concrete
follow-up commits owned by specific agents with specific timelines.

## 6. No punt to future

When the team identifies that something needs X to be truly complete,
the choice is:

- Ship X NOW as part of this work (preferred)
- Don't ship the partial version at all
- If absolutely must ship partial: the partial state must be CLEARLY
  labeled as not-yet-functional in every Founder-facing surface

"PROP-003 will eventually make this work" is NOT acceptable framing for
shipping. Either build the necessary substrate now or scope the feature
smaller so it works without that substrate.

## 7. Acknowledge what breaks

If during a ship the team discovers something previously shipped is
broken or partial, they STOP the current work and report:

- What's broken
- When it actually shipped vs claimed shipped
- What the resolution is

The temptation is to ship the new thing on top of the broken thing.
Senior engineering refuses this. Fix the broken thing or revert the
previous ship.

## 8. Critic empowerment

Critic's authority is reinforced:

- Can block any commit that violates these principles
- Can mandate evidence requirements before approval
- Can require additional testing scenarios before ship determination
- Cannot be overridden by other voters or Orchestrator on quality
  questions
- Only Founder can override Critic, and override is explicit

## Enforcement

This amendment becomes the dominant operating principle. Conflicts with
prior amendments resolve in favor of this one for quality questions.

Applies retroactively to in-flight work. As of authoring:

- **AMD-008 application failure** — apply-amendments.sh was destroyed
  mid-execution because type=replace-existing was wrong for a surgical
  code patch (the AMD body was prose, not script source). Per principle
  #2 (root cause not symptom), the lifecycle's `replace-existing` type
  is fundamentally unsuited for code patches; either author the FULL
  corrected file as the AMD body, or add a new `code-patch` type that
  takes a diff. Currently treated as: AMD-008 INTENT applied as a code
  edit immediately after the script-restoration; AMD-008 lifecycle file
  in applied/ as expected.
- **Token usage dashboard** — `_meter_status: gap-per-F1a` + "(meter
  unwired)" labels are principle-#6 violations. Per the principle,
  either real measurement substrate ships now or the dashboard's
  zero-data sections get explicitly labeled "not yet instrumented."
- **All open Founder-eyes items** — must meet principle #5 honest
  language in every report going forward.

## Cross-references

- AUTONOMOUS_FAILURE_RECOVERY v8.3 §10 (failure-pattern documentation)
- PROTOCOLS_v8.1_ADDENDUM P18.6 (Founder's Newspaper — surfaces every
  Founder-review-needed item with these standards intact)
- AMD-008 (the meta-amendment case that proved principle #2 + #7)

## Pre-commit Critic checklist (operationalizing the standard)

Every commit gets these Critic gates added to whatever existing gates
already exist:

```
[ ] Diagnosis is evidence-based (P1) — every claim cites a file path,
    line number, or log entry
[ ] If a fix was applied, root cause is named (P2) — symptomatic fix
    labeled as such if it's a stopgap
[ ] If the commit claims "shipped" or "complete" (P3), all criteria are
    met and Critic verified each
[ ] If the commit claims a feature works (P4), evidence is in the commit
    message or linked report — not just code
[ ] Language is precise (P5) — no banned phrases without justification
[ ] No punt to future state (P6) — partial states are clearly labeled
[ ] If prior-shipped work was discovered broken (P7), it's surfaced in
    this commit or a STOP-and-report commit ahead of this one
[ ] Critic authority preserved (P8) — Critic's veto was respected
```
