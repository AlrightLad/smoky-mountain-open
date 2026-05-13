# Proposal Count — Ground Truth

**Captured:** 2026-05-13T19:40:00Z
**Authority:** This file is the canonical source of truth for proposal counts. Every dashboard number MUST match these counts. Any divergence is a bug.

---

## On-disk counts

| Folder      | Count | Filenames                                                          |
|-------------|-------|--------------------------------------------------------------------|
| pending     | **2** | `PROP-003-token-meter-wiring-sidecar.md`, `PROP-004-org-monthly-quota-type.md` |
| approved    | 1     | `PROP-002-main-flows-html-operational-view.md`                     |
| rejected    | 0     | —                                                                  |
| deferred    | 0     | —                                                                  |
| **total**   | **3** |                                                                    |

## Pending schema integrity check

Every pending proposal MUST have the canonical fields: `id, title, lane, rationale, scope, estimate_tokens, files_affected, ship_target`.

| File | id | schema status |
|------|----|----|
| PROP-003-token-meter-wiring-sidecar.md | PROP-003 | OK (no missing fields) |
| PROP-004-org-monthly-quota-type.md    | PROP-004 | OK (no missing fields) |

Both pass. The bug is NOT in proposal filtering.

## The canonical number Founder should see everywhere

**`proposals_pending = 2`** on every dashboard surface (banner, status panel, badge, list count).

If any dashboard shows a different number, that dashboard is wrong.
