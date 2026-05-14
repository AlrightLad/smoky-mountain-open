---
id: ESC-001
title: main-flows-v2 Phase 2 taxonomy + visual approach + speculative flows decisions
type: cross-cutting
origin_commit: 68771a9
origin_ship: main-flows-v2-phase-2
question: |
  Phase 2 of main-flows v2 surfaced three sub-decisions requiring Founder ratification:
    (a) Taxonomy: Which of A (by actor) / B (by tier) / C (by lifecycle) / D (by ship/wave) / E (hybrid) organizes the 62-flow inventory?
    (b) Visual approach: Option 1 (single-page rail with filter chips) / Option 2 (grouped accordion) / Option 3 (paginated by category)?
    (c) Speculative flows: (a) include + render with treatment / (b) include data, hide UI / (c) remove from inventory?
context_summary: |
  Phase 1 discovered 62 flows across 17 sources. Phase 2 proposed 3 taxonomies + 3 visual approaches + a speculative-flows decision. The Founder gate is criterion #5 (cross-cutting architecture decision). Defaults documented; team operates against the defaults absent explicit ratification.
proposed_answer: Taxonomy E (hybrid — tier primary + status secondary + lifecycle chip) + Option 1 (single-page rail with filter chips) + Speculative-(a) (include + render with treatment)
rationale: |
  - Tier primary preserves the F5 Main Flow filter rule clarity
  - Status secondary surfaces roadmap progress without dominating
  - Lifecycle chip gives Founder a 'what part of the product' reading lane
  - Single-page rail at 62 flows is tight but viable with filters; doesn't fragment context across pages
  - Architecture grid stays (protected layout per Phase 6.5)
  - 5 speculative flows are documented enough in ROADMAP Launch Phase C/A to be cited; rendering with explicit treatment is more honest than hiding
options:
  - id: a-A
    label: Taxonomy A — By actor (member/commissioner/founder/system/agent)
    rationale: Matches 'who experiences this flow' mental model; member bucket large (38) needs sub-grouping
  - id: a-B
    label: Taxonomy B — By tier (core/supplementary/admin/system)
    rationale: Signals product-facing vs invisible; matches F5 Main Flow filter; tier judgment-call risk
  - id: a-C
    label: Taxonomy C — By lifecycle phase (mental model of 'what part of the product')
    rationale: Lifecycle-mapped; semantically rich; harder to bucket cleanly
  - id: a-D
    label: Taxonomy D — By ship/wave (roadmap state)
    rationale: Aligns with ROADMAP execution; couples flow inventory to ship plan
  - id: a-E
    label: Taxonomy E — Hybrid (tier primary + status secondary + lifecycle chip) [team recommendation]
    rationale: Tier preserves F5; status secondary informs roadmap; lifecycle chip adds Founder reading lane
  - id: b-1
    label: Option 1 — Single-page rail with filter chips [team recommendation]
    rationale: Tight at 62 flows but viable; no context fragmentation across pages
  - id: b-2
    label: Option 2 — Grouped accordion (per Taxonomy B tier)
    rationale: Easier scan but multiple expanded states; tier judgment-call risk
  - id: b-3
    label: Option 3 — Paginated by category (multi-page)
    rationale: Avoids 62-row density; fragments context across pages
  - id: c-a
    label: Speculative flows (a) — Include + render with treatment (dashed border) [team recommendation]
    rationale: Most honest; 5 speculative flows documented in ROADMAP; visible-but-flagged signals 'flagged not yet ratified'
  - id: c-b
    label: Speculative flows (b) — Include in data, exclude from UI
    rationale: Cleaner UI but data/UI divergence creates auditability gap
  - id: c-c
    label: Speculative flows (c) — Remove from inventory entirely
    rationale: Smallest scope but loses speculation history
default_if_no_response: Taxonomy E + Option 1 + Speculative-(a) per taxonomy-proposals.md § 'Default if no response within reasonable window'
default_window_hours: 24
authored_by: claude-code
authored_at: 2026-05-13T21:36:00Z
estimated_decision_complexity: deep
blocks_ship: false
source_artifact_paths:
  - .claude/state/main-flows-v2/taxonomy-proposals.md
  - .claude/state/main-flows-v2/flow-inventory.json
  - .claude/state/main-flows-v2/reference-spec.md
  - .claude/state/main-flows-v2/visual-diff-2026-05-14.md
founder_decision: applied-via-direction
founder_decision_options:
  - a-E
  - b-1
  - c-a
founder_note: |
  Visual approach (decision b) confirmed via Founder direction 2026-05-14 in visual-diff-2026-05-14.md: 'Q2: All 62 (scrollable) — architecture rail shows every flow with search + filter chips, scrollable.' This maps directly to Option 1 (b-1).

  Taxonomy (decision a) and speculative-flows (decision c) operating against the documented defaults (Taxonomy E + Speculative-(a)) per the team-authored default-if-no-response policy. Founder did not explicitly affirm or refine; default-operative state is now binding for these two sub-decisions.

  Implementation confirmed across Ships R1-R9 (commits 3b3a5a6 main-flows R1-R4 + e6a196d main-flows R5+R6+R7+R9). 62-flow rail with search + actor/tier filter chips lives in docs/reports/main-flows.html. Taxonomy E surfaces in flow-inventory.json's `tier` field. Speculative flows render with `[data-status="speculative"]` dashed-border treatment.
applied_at: 2026-05-14T16:42:00Z
applied_commit: e6a196d
---

# ESC-001 — main-flows-v2 Phase 2 decisions

## Status: APPLIED 2026-05-14

This escalation was migrated from the manual review-queue.json stub
(per Founder directive 2026-05-14 'escalations lifecycle') to the
canonical `.claude/state/escalations/applied/` directory. Visual
approach (decision b) was explicitly confirmed by Founder via the
2026-05-14 visual-diff direction; taxonomy + speculative-flows
(decisions a + c) are operating against the documented defaults
(team-authored, AMD-009-aligned).

## Implementation evidence

- Ships R1-R4 (commit `3b3a5a6`): Janowiak reference replication —
  black canvas + transparent cards + yellow accents.
- Ships R5+R6+R7+R9 (commit `e6a196d`): catalog theme remap +
  column header cleanup + step description mono + clear-selection
  affordance.
- `docs/reports/main-flows.html` carries the 62-flow rail with
  search + filter chips (visual approach Option 1).
- `flow-inventory.json` uses Taxonomy E categorization (tier field).
- Speculative flows render with `[data-status="speculative"]`
  dashed-border treatment.
- Round-trip `[main-flows]` checks PASS verifying the 62-flow rail +
  filter functionality.

## Cross-references

- Source proposal: `.claude/state/main-flows-v2/taxonomy-proposals.md`
- Implementation: `docs/reports/main-flows.html`
- Visual diff with Janowiak: `.claude/state/main-flows-v2/visual-diff-2026-05-14.md`
- AMD-010 main-flows v2 governance
- AMD-009 senior engineering standard
- AMD-015 team proposes; Agent 2 ratifies (this escalation's proposed-answer authoring)
