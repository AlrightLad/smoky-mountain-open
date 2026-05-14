---
id: AMD-016
title: Infrastructure must answer its operational question
target_canonical_path: docs/agents/INFRASTRUCTURE_OPERATIONAL_QUESTION.md
source_draft_path: .claude/state/amendments/pending/AMD-016-infrastructure-operational-question.md
scope_summary: Codifies that every shipped infrastructure component must answer the operational question it was built to answer. Structural existence (sentinels pass, schema valid, lint clean) is necessary but NOT sufficient for ship-complete. Adds the Operational Question Test (3 questions per ship); adds Criterion 9 to AMD-011 readiness gate; binds Critic protocol gate on operational evidence not just sentinel verdicts.
type: new-file
section_anchor: null
depends_on: ["AMD-009", "AMD-011", "AMD-012"]
authored_by: claude-code (orchestration team)
authored_at: 2026-05-14T17:23:30Z
bubble_of_record: null
estimate_tokens_to_apply: 4000
rollback_strategy: git revert; the document is new. Principle continues to operate informally per Founder directive even if the formal artifact is rolled back.
status: pending
operating_status: ACTIVE — operating immediately per Founder directive 2026-05-14 "AUTHOR AMENDMENT — Infrastructure Must Answer Its Operational Question". Critic gates apply now; formal apply via amendments.html is paperwork rather than enablement. Retroactive audit of recent ships against the test pending.
---

# Infrastructure Must Answer Its Operational Question

Every shipped infrastructure component must answer the operational
question it was built to answer. Structural existence (sentinels pass,
schema valid, lint clean, round-trip green) is necessary but **NOT
sufficient** for ship-complete.

## Founder principle (recorded verbatim)

> "Infrastructure renders structurally correct values that DON'T
> answer the question the infrastructure exists to answer."
>
> Five instances this session demonstrate the pattern:
> 1. main-flows.html — sentinels passed 3x while Founder eyes saw
>    broken layout/theme/functionality
> 2. AMD-007 P18.6 Founder Review Queue — count rendered but click-
>    through didn't work
> 3. Install command — surfaced "cd file://" which doesn't execute
> 4. Recent Activity tables — all zeros despite real ship volume
> 5. Recent Ships token/cost columns — rendered correctly but tokens=0
>    because per-ship attribution wasn't built

## Two definitions of "complete"

- **IMPLEMENTATION COMPLETE**: the code exists, runs, passes structural
  tests (sentinels, schema validation, lint, parse, round-trip).
- **VALUE COMPLETE**: the infrastructure DELIVERS the operational
  answer to the Founder / team that justified building it.

Ship-complete per AMD-009 P3 (ship complete or don't ship) requires
**VALUE COMPLETE**, not just IMPLEMENTATION COMPLETE.

## The Operational Question Test

Before declaring any infrastructure ship complete, the team documents:

1. **What operational question does this infrastructure exist to
   answer?**
   (e.g., "How many tokens did PROP-003.a cost?")

2. **What does a working state look like end-to-end?**
   (e.g., "Founder opens dashboard.html → sees PROP-003.a row → sees
   tokens=X, cost=$Y populated from real data, NOT 0")

3. **Has that working state been verified visually + functionally,
   not just by sentinel counts?**
   (e.g., "Screenshot of dashboard showing actual numbers attached
   to commit; tooltip math verified; verified with synthetic data
   injection if needed")

If any of 1-3 fail, ship is **NOT complete** per AMD-009 P3, regardless
of how many structural tests pass.

## Critic protocol update

Critic gates ship-complete on operational question answered, not just
on structural verification. Sentinel-counts-only verdicts are
**INSUFFICIENT** for value-completeness claims.

Critic asks at ship-close:

- *"What question does this answer?"*
- *"Where's the evidence it actually answers it?"*
- *"Has Founder eyes-test passed, or only sentinels?"*

If the team can't cite operational evidence, Critic blocks ship-close.

## Five worked examples (the pattern's evidence base)

### Example 1 — Token observability (PROP-003.a + .b)
- Question: "What did each ship cost?"
- Implementation complete: sidecar writes quota-status.json
- Value complete: dashboard shows per-ship tokens + cost from real
  attributed data
- **Gap**: PROP-003.a + .b shipped implementation-complete; per-ship
  attribution + dashboard display were missing → value-incomplete

### Example 2 — Founder Review Queue (AMD-007 P18.6)
- Question: "What needs my decision right now?"
- Implementation complete: KPI card renders count
- Value complete: Founder clicks → sees actual escalations with
  proposed answers + can resolve via familiar flow
- **Gap**: count rendered but click-through wasn't built →
  value-incomplete

### Example 3 — Cron install banner
- Question: "What command do I run to fix this?"
- Implementation complete: banner surfaces a command
- Value complete: command executes cleanly when Founder pastes it
- **Gap**: command contained "cd file://" → not executable →
  value-incomplete

### Example 4 — Recent Activity tables
- Question: "What did the team do this week?"
- Implementation complete: tables render with date columns
- Value complete: tables show real ship counts, real token
  consumption, real handoffs per day
- **Gap**: all zeros despite real activity → value-incomplete

### Example 5 — main-flows.html
- Question: "What is the PARBAUGHS architecture + 62 flows?"
- Implementation complete: structural sentinels pass (grid exists,
  SVG arrows exist, rail exists)
- Value complete: looks like Janowiak reference; all 62 flows
  scrollable + filterable + clickable; smoke proves usability
- **Gap**: 3 rounds of "resolved" claims while Founder eyes saw
  broken state → value-incomplete

## Enforcement

Pre-ship readiness scan (per AMD-011) adds new criterion:

**9. Operational question answered with evidence**

This sits alongside the existing 8 AMD-009 criteria. Scanner defers
proposals / ships where this criterion lacks evidence documentation.
AMD-011's auto-execute pipeline applies the test to every ship.

## Retroactive application

After AMD-016 binds, the team audits all recent ships against the
operational-question test:

- PROP-002, PROP-003.a, PROP-003.b, PROP-004
- AMD-009 through AMD-015 (now -017)
- main-flows v2 R1-R7+R9
- Each Wave 0 dry-run ship
- Dashboard infrastructure ships
- Escalations lifecycle ship

For each, document: what question did this answer? Is it value-complete
or only implementation-complete? If implementation-only: gap analysis
+ remediation ship plan. This becomes the basis for completing
Phase C dashboard infrastructure properly — most current "shipped"
infrastructure is implementation-complete but not value-complete.

## Interaction with other amendments

| Amendment | Interaction |
|---|---|
| AMD-009 P3 (ship complete or don't ship) | AMD-016 sharpens "complete" to require value, not just implementation |
| AMD-009 P4 (test before declaring done) | AMD-016 specifies tests must verify operational answers, not just structural assertions |
| AMD-011 (auto-execute readiness) | AMD-016 adds criterion 9 to the 8-criteria gate |
| AMD-012 (smoke testing) | AMD-016 makes visual + functional smoke the primary evidence mechanism |
| AMD-015 (team-proposes; Agent 2 ratifies) | AMD-016 applies to the team's proposed answers — proposals must include their operational question |
| AMD-017 (continuation discipline) | AMD-016 sharpens what "ship complete" means at Step 4 of the continuation procedure |

## Honest failure mode (AMD-009 P5)

The team has habitually optimized for structural completeness because
it's measurable. This amendment forces optimization for operational
completeness, which is measurable but requires discipline:

- Document the question upfront
- Document the working state upfront
- Verify end-to-end before claiming ship-complete

Founder review remains the ultimate gate; the amendment exists to
catch these gaps **before** Founder review surfaces them.

## Cross-references

- AMD-009 SENIOR_ENGINEERING_STANDARD (the foundation principle this
  amendment sharpens)
- AMD-011 AUTO_EXECUTE_PROTOCOL (criterion 9 added to readiness gate)
- AMD-012 SMOKE_TESTING_GOVERNANCE (visual + functional evidence)
- AMD-015 TEAM_PROPOSES_AGENT_2_RATIFIES (proposed answers include
  operational question)
- AMD-017 CONTINUATION_DISCIPLINE (Step 4 ship-complete now requires
  AMD-016 evidence)
- AUTONOMOUS_FAILURE_RECOVERY v8.3
- Founder directive 2026-05-14 "AUTHOR AMENDMENT — Infrastructure
  Must Answer Its Operational Question" (verbatim source)
