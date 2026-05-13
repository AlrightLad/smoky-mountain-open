# Proposed PROPOSAL_LIFECYCLE_v8.2_AMENDMENT.md

> **Status:** Draft authored 2026-05-13 by the orchestration team for Founder ratification.
> **Apply path:** Founder applies (governance-protection hook blocks orchestration-team writes to `docs/agents/`). When ratified, this moves to `docs/agents/PROPOSAL_LIFECYCLE_v8.2_AMENDMENT.md`.
> **Trigger:** Founder URGENT — "Proposal lifecycle + automation: Downloads watcher + shipped detection + 4-state view."
> **Supersedes:** the implicit 4-state lifecycle in `PROACTIVE_IMPROVEMENT_PROTOCOL.md` § 8.1.

---

## 1 — Why this amendment exists

Proposals today move pending → approved | rejected | deferred and stop. Once approved, they vanish from `proposals.html` because the view shows only `pending/`. Founder sees no audit trail of what's been approved vs. what's been built vs. what's been deferred. The dashboard banner conflated "pending review" with "outstanding" (caught and fixed in commit `feeb86d`).

This amendment formalizes a 5-state lifecycle with a terminal `shipped/` state and auto-detection of "approved → shipped" transitions via git-log scan.

## 2 — The 5 states

| State        | Folder                                  | Visibility on proposals.html         | Mutability                  |
|--------------|------------------------------------------|--------------------------------------|------------------------------|
| **pending**  | `.claude/state/proposals/pending/`      | Section 1, expanded, intent-capture  | Mutable (Founder decision pending) |
| **approved** | `.claude/state/proposals/approved/`     | Section 2, expanded, WORKING badge   | Read-only (past decision point) |
| **deferred** | `.claude/state/proposals/deferred/`     | Section 3, collapsible, collapsed    | Read-only (Founder un-defer is future feature, not in this build) |
| **shipped**  | `.claude/state/proposals/shipped/`      | Section 4, collapsible, collapsed    | **Immutable** — no edits ever after shipped_at write |
| **rejected** | `.claude/state/proposals/rejected/`     | Section 5, collapsible, collapsed    | Read-only (terminal archive) |

## 3 — Transitions

```
                  Founder review
pending ──────────────────────────► approved
   │                                    │
   ├──────► deferred                    │ git log scan
   │                                    ▼
   └──────► rejected                shipped (terminal)
```

| From       | To       | Trigger                                              | Mechanism                                          |
|------------|----------|------------------------------------------------------|----------------------------------------------------|
| pending    | approved | Founder approves via `proposals.html` export         | `.claude/scripts/apply-decisions.sh` (existing)    |
| pending    | rejected | Founder rejects                                       | Same                                               |
| pending    | deferred | Founder defers                                        | Same                                               |
| approved   | shipped  | Commit references "Implements PROP-NNN" / "Closes PROP-NNN" | `scripts/scan-shipped-proposals.py` (new)    |
| deferred   | pending  | Founder un-defers                                     | **Future feature — NOT in this build**             |

### Transition rules

1. **`approved → shipped` requires explicit commit-message reference.** A commit message must contain `Implements PROP-NNN`, `Implements PROP-NNN-<slug>`, `Closes PROP-NNN`, or `Closes PROP-NNN-<slug>` (case-insensitive). The PROP id is the canonical form (PROP-NNN); slugs are optional.
2. **Multiple proposals per commit are valid.** A single commit may reference `Implements PROP-002, PROP-003` and ship both. Comma or space separator is accepted.
3. **Earliest matching commit wins** when a proposal is referenced in multiple commits.
4. **Once shipped, immutable.** No edits to the proposal file after `shipped_at` is written. Future-self / future agents are forbidden from rewriting shipped proposals — the field is a contract. Re-shipping (e.g., a rollback + re-implementation) creates a NEW proposal (PROP-NNN+1), not a re-edit of the original.
5. **`shipped_at` and `shipped_in_commit` fields are appended** to the proposal's frontmatter on transition:

```json
{
  "id": "PROP-NNN",
  ...existing fields...,
  "shipped_at": "<ISO-8601 UTC of commit author date>",
  "shipped_in_commit": "<7-char short sha>"
}
```

### Edge cases

- **Commit references PROP that does not exist in `approved/`** (e.g., already shipped, rejected, or typo): scanner logs a warning and skips. No error.
- **Same PROP referenced in multiple commits:** scanner picks the earliest matching commit (oldest commit-date). All other matches logged as informational.
- **Malformed proposal frontmatter:** scanner logs a warning, skips, does not crash.
- **`shipped/` folder missing:** scanner creates it on first run.

## 4 — Surfaces

### `proposals.html` (4-state view)

Five sections in display order:

1. **Pending review** (Section 1) — primary, expanded. Intent-capture UI (approve / reject / defer + note). Founder's active workspace.
2. **Approved — in flight** (Section 2) — visible, expanded. Per-card: id, title, lane, ship_target, approved_at, days-since-approved, WORKING badge. No buttons (past Founder's decision).
3. **Deferred** (Section 3) — collapsible `<details>`, collapsed by default. Per-card: id, title, deferred_at, deferred_note.
4. **Shipped — archive** (Section 4) — collapsible, collapsed. Per-card: id, title, shipped_at, shipped_in_commit (short sha; clickable if hosted on GitHub). Sort by shipped_at desc. Show last 50; link to full archive if more.
5. **Rejected — archive** (Section 5) — collapsible, collapsed. Same shape, sort by rejected_at desc.

### `dashboard.html` banner

Old (before this amendment): "X proposals awaiting Founder review" (single count, conflates states).

New: **"X pending · N in flight · M shipped"** (counts of pending, approved, shipped — three distinct surfaces). Banner text is data-bound; populated from `data.proposals_counts` populated by `regen-dashboard.py` reading the snapshot.

### Counts on every dashboard

| Dashboard                | Field                                | Source                                          |
|--------------------------|--------------------------------------|-------------------------------------------------|
| dashboard.html banner    | `proposals_counts.{pending,approved,shipped}` | `regen-dashboard.py` ← snapshot                 |
| dashboard.html metric tile (`Pending proposals`) | `proposals_pending`     | same source                                     |
| index.html status panel  | `status.proposals_pending` + new `status.proposals_in_flight` | `regen-index.py`         |
| proposals.html data block| `proposals.{pending,approved,deferred,shipped,rejected}` arrays + `counts.{...}` | `regen-proposals.py` (new) |

## 5 — `shipped-log.md` (append-only audit trail)

At `.claude/state/proposals/shipped-log.md`. Every move from `approved/` → `shipped/` appends a row:

```markdown
| PROP-id  | approved_at         | shipped_at          | commit_sha | commit_subject (first 80 chars) |
|----------|---------------------|---------------------|------------|----------------------------------|
| PROP-002 | 2026-05-13T13:50:00Z| 2026-05-13T14:25:00Z| 1e20920    | main-flows.html — architecture grid + flow highlight + steps panel |
```

The file is append-only; the scanner never modifies existing rows. The audit trail survives every regen.

## 6 — Telemetry events

New event types:

```json
{
  "event_type": "proposal.shipped",
  "data": {
    "prop_id": "PROP-NNN",
    "approved_at": "<ISO-8601>",
    "shipped_at": "<ISO-8601>",
    "shipped_in_commit": "<7-char sha>"
  }
}

{
  "event_type": "proposal.shipped_scan.complete",
  "data": {
    "moved": N,
    "skipped_already_shipped": N,
    "warnings": [<list of warning strings>]
  }
}
```

## 7 — Critic pre-close audit additions

Adds three items to the dashboard-consistency checklist from `proposed-METRIC_INTEGRITY_PROTOCOL.md § 3.1`:

```
- [ ] All 5 proposal-state sections render on proposals.html
- [ ] Banner count math holds: pending count ≠ approved count ≠ shipped count
- [ ] shipped-log.md append-only — no edits to historical rows
```

## 8 — Cross-references

- Spec amendment: extends `docs/agents/REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.4` (proposals.html spec) — Founder applies both at ratification.
- Lifecycle parent: `docs/agents/PROACTIVE_IMPROVEMENT_PROTOCOL.md` § 8.1.
- Metric integrity: `docs/agents/METRIC_INTEGRITY_PROTOCOL.md` (when ratified) § 3.1.
- Source of truth for shipped: git log + frontmatter `shipped_at` field. NOT a derived count — every shipped proposal's record is verifiable.

---

*Draft authored 2026-05-13 by orchestration-team. Awaiting Founder review + ratification + move to `docs/agents/PROPOSAL_LIFECYCLE_v8.2_AMENDMENT.md`.*
