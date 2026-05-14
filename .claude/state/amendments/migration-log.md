---
doc: amendments lifecycle migration log
date: 2026-05-14
authored_by: claude-code
trigger: Founder NEW DASHBOARD directive — amendments lifecycle build, Deliverable 5
---

# Amendments Lifecycle — Migration Log

Source: `.claude/state/wave-zero-dry-run/remediation/proposed-*.md`
(four governance amendment drafts authored during DC-1..DC-9 +
the 2026-05-14 PROTOCOL UPDATE)

Destination: `.claude/state/amendments/pending/AMD-NNN-<slug>.md`
(5-state lifecycle: pending / approved / applied / deferred / rejected)

## Migration mapping

| AMD ID | Source draft (deleted) | New canonical home | Type | Depends on |
|---|---|---|---|---|
| AMD-001 | `proposed-PAUSE_DISCIPLINE_v8.2_remove-fictional-cap.md` | `pending/AMD-001-PAUSE_DISCIPLINE_v8.2_remove-fictional-cap.md` | new-file | — |
| AMD-002 | `proposed-CRON_CONFIGURATION_v8.2_remove-fictional-cap.md` | `pending/AMD-002-CRON_CONFIGURATION_v8.2_remove-fictional-cap.md` | edit-section | AMD-001 |
| AMD-003 | `proposed-parbaughs-design-bot-dashboard-checklist.md` | `pending/AMD-003-design-bot-dashboard-checklist.md` | append-to-existing | — |
| AMD-004 | `proposed-AUTONOMOUS_FAILURE_RECOVERY_v8.3.md` | `pending/AMD-004-AUTONOMOUS_FAILURE_RECOVERY_v8.3.md` | new-file | — |

## Migration method

`git mv` to preserve history. Each draft's frontmatter was replaced
with the canonical AMD schema (id / title / target_canonical_path /
source_draft_path / scope_summary / type / section_anchor / depends_on /
authored_by / authored_at / bubble_of_record / estimate_tokens_to_apply /
rollback_strategy / status). Body content below the frontmatter is
unchanged from the original drafts.

The `source_draft_path` field in each AMD's frontmatter is the
historical reference path (pre-migration). The file no longer exists
at that path; the field documents provenance.

## Source directory

`.claude/state/wave-zero-dry-run/remediation/` is now empty. Per
Founder's "leave it as workshop area" directive, the directory is
not deleted. Future amendment drafts may use it as the authoring area
before promotion to the canonical lifecycle (`.claude/state/amendments/
pending/`).

## Cross-reference impact

Existing committed docs reference the OLD draft paths:
- `dashboard-consolidation-summary.md`
- `transition-summary.md`
- `SUMMARY.md`
- `AMD-004` body itself (cross-references in §10)

These cross-references in past commits are historical record and
remain valid as such. The migration log here is the canonical
provenance map for any agent looking for "where did proposed-* go?"

## Numbering convention

- AMD IDs assigned sequentially in chronological order of original
  authoring (AMD-001 was authored first, AMD-004 last).
- Slug format: `AMD-NNN-<descriptive-kebab-case>.md`.
- ID stays with the amendment through its lifecycle (pending →
  approved → applied / deferred / rejected); only the directory changes.

## Next AMD ID

Next sequential ID for a newly-authored amendment is **AMD-005**.
The amendments lifecycle build itself (subsequent commits in this
session) may generate one or more new amendments (e.g., a
PROPOSAL_LIFECYCLE_v8.2 follow-up if the build surfaces gaps).
