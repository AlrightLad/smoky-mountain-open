---
id: AMD-006
title: P18 amendments-lifecycle discipline (4th operational view)
target_canonical_path: docs/agents/PROTOCOLS_v8.1_ADDENDUM.md
source_draft_path: .claude/state/amendments/pending/AMD-006-P18-amendments-discipline.md
scope_summary: Add P18.5 to PROTOCOLS_v8.1_ADDENDUM declaring amendments.html as the 4th operational view, with source-of-truth invariant (.claude/state/amendments/), JSON round-trip validation extended to AMD schema, and Critic checklist deltas for the new round-trip [amendments] section.
type: append-to-existing
section_anchor: null
depends_on: []
authored_by: claude-code
authored_at: 2026-05-14T01:50:00Z
bubble_of_record: null
estimate_tokens_to_apply: 4000
rollback_strategy: git revert; this section is additive (no existing P18 sub-section overwritten).
status: pending
---

# P18.5 — Amendments-lifecycle discipline

Extends P18 (Operational View Discipline) to cover amendments.html, the
4th operational view shipped 2026-05-14 alongside the AMD lifecycle.

## P18.5.1 — Source-of-truth invariant

amendments.html projects state from `.claude/state/amendments/`:

| View                | State store                            | Authoritative format                    |
|---------------------|----------------------------------------|------------------------------------------|
| amendments.html     | `.claude/state/amendments/{pending,approved,deferred,applied,rejected}/` | One AMD-NNN markdown file per amendment |

State wins. Never hand-edit amendments.html or any AMD-NNN.md after
authoring. Move AMDs between buckets via:
- Manual move (Founder applies an approved AMD locally), OR
- Watcher (`scripts/cron/downloads-watcher.ps1` detects
  `amendments-*.json` → `apply-amendments.sh` → AMD moves to
  applied/deferred/rejected/).

## P18.5.2 — Schema invariants

Each AMD frontmatter MUST include:
- `id` (AMD-NNN, monotonically increasing across all buckets)
- `title` (Founder-facing summary)
- `target_canonical_path` (the docs/agents/* file the amendment touches)
- `source_draft_path` (this file's path, for round-trip linkage)
- `scope_summary` (one-paragraph what + why)
- `type` ∈ {new-file, replace-existing, append-to-existing, edit-section}
- `depends_on[]` (other AMD-NNN that must apply first)
- `authored_by`, `authored_at`
- `estimate_tokens_to_apply`, `rollback_strategy`
- `status`

Type semantics drive apply-amendments.sh:
- **new-file** — `target_canonical_path` does NOT yet exist; AMD body
  (after frontmatter strip) becomes the new file.
- **replace-existing** — `target_canonical_path` exists; AMD body
  replaces its entire content.
- **append-to-existing** — AMD body appended verbatim at end-of-file.
- **edit-section** — Requires `section_anchor`; splices AMD body in
  place of the marked section (heading or sentinel line).

## P18.5.3 — JSON round-trip validation extension

`tests/round-trip-test.py [amendments]` section MUST verify:
- amendments.html data block parses + has top-level keys
  `{amendments, counts, as_of, schema_version}`
- All 5 state buckets present in `amendments.amendments`
- Inline bucket lengths equal on-disk counts for
  uncapped buckets (pending / approved / deferred)
- `counts.applied_total` + `counts.rejected_total` equal on-disk
  (display caps at 50; total is authoritative)
- Every pending AMD has the 4 required fields + valid `type`
- `dashboard.html.amendments_counts.pending` matches
  `amendments.html.counts.pending` matches on-disk
  `AMD-*.md` count in `pending/`

## P18.5.4 — Decision-capture / watcher contract

amendments.html captures Founder decisions in browser localStorage
(`pb_amendment_decisions`). On Export, generates
`amendments-<ts>.json` with `kind: "amendments"`:

```json
{
  "schema_version": 1,
  "kind": "amendments",
  "source_report_generated_at": "<as_of>",
  "generated_at": "<ts>",
  "decisions": [
    {"amendment_id": "AMD-XXX", "decision": "approve|reject|defer",
     "note": "...", "decided_at": "<ts>"}
  ]
}
```

The watcher's kind detection step (downloads-watcher.ps1, line
~120-160) inspects each `*-decisions-*.json` AND `amendments-*.json`
in Downloads; routes by the inner `kind` field to either
`apply-decisions.sh` (kind="decisions") or `apply-amendments.sh`
(kind="amendments"). Missing/unrecognized kind defaults to
"decisions" for backward compatibility.

## P18.5.5 — Critic checklist deltas (amendments-aware reviews)

When Critic reviews a proposal/amendment/PR that touches docs/agents/*,
the checklist gains these gates:

- [ ] If the change is governance-meaningful (protocol, addendum, role
      semantics, halt criteria, runbook), is there an AMD-NNN in
      `.claude/state/amendments/pending/` instead of a direct
      docs/agents/* edit? Hook 4 will block direct edits anyway; this
      gate catches drift before commit.
- [ ] Does the AMD's `target_canonical_path` match the actual file the
      author intends to amend?
- [ ] Does AMD `type` match the change shape? (new-file for a doc that
      doesn't exist; edit-section requires section_anchor; etc.)
- [ ] Are `depends_on[]` AMDs authored as separate AMD-NNN files (not
      bundled into one omnibus AMD)?
- [ ] Does the round-trip test still pass with the new AMD present?
      (`scripts/regen-all.{ps1,sh}` runs round-trip as the gate.)

## P18.5.6 — Apply-amendments staging discipline

`apply-amendments.sh` MUST stage only the files it touched, NOT
`git add -A docs/agents/`. The script's Python helper emits each
`target_canonical_path` (post-apply) to an `AMD_TOUCHED_LOG`
tempfile; bash reads that file and stages only those paths. This
prevents Plan-A failures where an unrelated docs/agents file (e.g.,
in-progress W0.DR4 work) is accidentally swept into the AMD commit.

(Codified after the 2026-05-14 E2E test where deferring AMD-002
swept an untracked docs/agents/_W0.DR4_FIXTURE.md into the commit;
fix per AUTONOMOUS_FAILURE_RECOVERY v8.3 Plan-B revert-and-retry.)
