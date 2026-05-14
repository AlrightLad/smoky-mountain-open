
# MAIN_FLOWS — v2

The team operationally uses this document as the canonical pointer to
flow definitions. v1 (pre-2026-05-14) ranked 8 MF-NN flows as the
member-of-MAIN-FLOWS set. v2 reframes:

- **Inventory is canonical:** every flow lives in
  `.claude/state/main-flows-v2/flow-inventory.json`. 62 flows at
  authoring; append-only per the stability invariant (F-IDs are
  permanent).
- **Rendering is canonical:** `docs/reports/main-flows.html` is the
  team's at-a-glance surface. Includes the protected architecture
  grid + the filterable flow rail (Phase 3 iter 1, 2026-05-14).
- **Taxonomy is decided:** Taxonomy E hybrid (tier primary + status
  secondary). Decision artifact at
  `.claude/state/main-flows-v2/taxonomy-decision.md`.

## What "is a Main Flow" means now

A flow is in the Main Flows inventory if it has a citable source —
spec doc, ROADMAP entry, or substrate state-tree document. Flows that
exist only in conversation or imagination DO NOT enter the inventory.

The F5 Metric Integrity Protocol's "does this serve a Main Flow?"
filter is satisfied if the entity in question maps to a flow in
`flow-inventory.json` with status ∈ {shipped, shipping, planned}.
Speculative flows DO satisfy F5 — they're inventoried but explicitly
flagged as not-yet-ratified.

## Authoritative counts (as of 2026-05-14)

- **Total:** 62 flows
- **By actor:** member 45 · commissioner 5 · founder 5 · system 3 · agent 4
- **By tier:** core 23 · supplementary 22 · admin 10 · system 7
- **By status:** shipping 24 · planned 17 · shipped 17 · speculative 4

## Counts amended

Earlier versions of this doc (v1) ranked 8 specific MF-NN flows. Those
8 are preserved in the v2 inventory as Core-tier entries. New flows
discovered by the v2 audit have F-IDs > F8 per the stability invariant.

## Cross-references

- Inventory: `.claude/state/main-flows-v2/flow-inventory.json`
- Source audit: `.claude/state/main-flows-v2/flow-inventory-sources.md`
- Taxonomy proposals (Phase 2 deliberation): `.claude/state/main-flows-v2/taxonomy-proposals.md`
- Taxonomy decision (Phase 2 team-owned conclusion): `.claude/state/main-flows-v2/taxonomy-decision.md`
- Rendered dashboard: `docs/reports/main-flows.html`
- F5 Metric Integrity Protocol: `docs/agents/METRIC_INTEGRITY_PROTOCOL.md`
- Long-running design bubble: `.claude/state/discussion-bubbles/db-2026-05-14-001.md`

## What's deferred (honest enumeration, NOT pending-follow-up)

These items are documented as separate-ship work, NOT caveats on this
amendment's completeness:

- **Lifecycle-phase chip on each rail card** — requires
  `lifecycle_phase` field added to inventory schema.
- **Click-to-detail flow view** — requires per-flow detail schema.
- **Per-tier sub-grouping by status within the rail** — UI iteration.

These ship when their underlying data is ready, as separate ships.
