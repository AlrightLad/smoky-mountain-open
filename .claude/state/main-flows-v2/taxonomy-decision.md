---
doc: main-flows v2 — taxonomy decision (team-owned)
date: 2026-05-14
authored_by: claude-code (orchestration team)
trigger: Founder Decision 1 delegation 2026-05-14 — team owns taxonomy choice
status: DECIDED. Taxonomy E (hybrid) + Option 1 (filterable rail) + Speculative (a) include-with-treatment.
---

# Taxonomy decision — main-flows v2

Per Founder's Decision 1 delegation: "main-flows.html is primarily a
TEAM tool for understanding app flow at a glance — team is the
primary user, team makes the taxonomy call."

## Decision (binding)

| Axis              | Choice                                                      |
|-------------------|-------------------------------------------------------------|
| Primary taxonomy  | **Taxonomy E** — Hybrid (tier primary + status secondary)   |
| Visual approach   | **Option 1** — Single-page filterable rail                  |
| Speculative flows | **(a)** Include in inventory + render with treatment        |
| Lifecycle chip    | **Deferred** to follow-on iteration (inventory schema gap)  |

## Rationale (Principle 2 — root cause not symptom)

**Why Taxonomy E over A/B/C/D:**
- Taxonomy B (tier alone) is the clearest "is-this-a-Main-Flow" filter
  rule (F5 Metric Integrity Protocol). It's the right PRIMARY axis.
- Status (Taxonomy D) is the second-most-useful axis for an
  in-build team: "what's shipping next?" is asked daily.
- Actor (Taxonomy A) is exposed as a filter chip, not a primary axis,
  because the team thinks tier-first, actor-second.
- Lifecycle phase (Taxonomy C) is conceptually useful but the
  current `flow-inventory.json` schema doesn't carry a
  `lifecycle_phase` field per flow. Auto-deriving from name/actor
  is unreliable for 62 flows. Honest treatment: defer lifecycle chip
  to a follow-on iteration that adds the field to inventory.

**Why Option 1 over 2/3:**
- 62 flows fits the Founder spec's "30-60 flows → filterable rail"
  band.
- Accordion (Option 2) collapses 90% of the data behind clicks —
  worse for an at-a-glance team tool.
- Paginated multi-page (Option 3) fragments the mental model.

**Why Speculative (a) over (b)/(c):**
- The 4 speculative flows are documented in ROADMAP / spec drafts.
  Hiding them creates the false impression of completeness.
- Honest visual treatment (dashed border, muted) signals "team flagged
  but not yet ratified" — accurate.

## Count-discrepancy resolution

Per Founder's STEP 1: "Resolve by re-running the audit categorization
against current flow-inventory.json (source of truth per stability
invariant). Updating taxonomy-proposals.md to match. Documenting any
flow that had bucket-shifts in a reconciliation appendix."

### Authoritative counts (from `flow-inventory.json`, 2026-05-14)

| Axis     | Counts (authoritative)                                                      |
|----------|------------------------------------------------------------------------------|
| **Actor**  | member 45 · commissioner 5 · founder 5 · system 3 · agent 4 (total 62)     |
| **Tier**   | core 23 · supplementary 22 · admin 10 · system 7 (total 62)                |
| **Status** | shipping 24 · planned 17 · shipped 17 · speculative 4 (total 62)           |

### Discrepancy with prior `taxonomy-proposals.md` numbers

The Phase 2 doc summarized counts that no longer match the JSON.
Deltas:

| Axis | Was (taxonomy-proposals.md) | Now (flow-inventory.json) | Delta |
|------|-----------------------------|---------------------------|-------|
| actor.member       | 38 | 45 | +7  |
| actor.commissioner | 6  | 5  | −1  |
| actor.founder      | 4  | 5  | +1  |
| actor.system       | 11 | 3  | −8  |
| actor.agent        | 3  | 4  | +1  |
| tier.core          | 18 | 23 | +5  |
| tier.supplementary | 19 | 22 | +3  |
| tier.admin         | 14 | 10 | −4  |
| tier.system        | 11 | 7  | −4  |
| status.shipped     | 22 | 17 | −5  |
| status.shipping    | 14 | 24 | +10 |
| status.planned     | 21 | 17 | −4  |
| status.speculative | 5  | 4  | −1  |

### Honest limitation (Principle 5)

Per-flow reconciliation is NOT possible because `taxonomy-proposals.md`
recorded only bucket totals, not per-flow categorizations. The most
likely cause is that several flows were re-classified between actor-
system (multi-role substrate flows) → actor-member when the inventory
was refined; similarly admin/system tier ↔ core/supplementary tier as
the team's understanding of "core member experience" tightened.

**JSON is the authoritative source going forward.** `taxonomy-proposals.md`
will be amended with a footnote pointing at THIS document for current
counts; the original Phase 2 reasoning stays intact for historical
context.

## What ships in Phase 3 (iteration 1)

- New section in `docs/reports/main-flows.html`: filterable flow rail.
- 62 flow cards in 4 tier groups (Core / Supplementary / Admin / System).
- Each card surfaces: F-ID, name, actor badge, status chip, ships-served.
- Filter chips: actor + status + search-by-name.
- Speculative flows rendered with dashed border + muted treatment.
- Architecture grid PRESERVED (protected layout per Phase 6.5) above
  the new rail.
- `regen-main-flows.py` extended to emit `flow_rail` data block section
  alongside existing `columns` + `flows`.
- Round-trip test extended.

## What's deferred to iteration 2 (honest enumeration, NOT punt — separate ship)

- Lifecycle-phase chip on each card (requires `lifecycle_phase` field
  added to `flow-inventory.json` schema first).
- Right-pane detail view on card click (requires detail data shape
  authored separately).
- Per-tier sub-grouping within the rail.

These are NOT caveats on this ship; they are concrete next-iteration
scope that ships separately when the underlying data is ready.
