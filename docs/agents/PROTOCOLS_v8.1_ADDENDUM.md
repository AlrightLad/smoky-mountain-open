# PROTOCOLS — v8.1 addendum

Adds protocol P18 to the protocol stack.

Status: **RATIFIED** governance v8.1
Cross-refs: PROTOCOLS.md (v1-v5), PROTOCOLS_v6_ADDENDUM.md (P11-P13), PROTOCOLS_v7_ADDENDUM.md (P14-P15), PROTOCOLS_v8_ADDENDUM.md (P16-P17)

---

## P18 — Operational View Discipline

**Principle:** Operational views (discussion-bubbles.html, activity.html, proposals.html) are PRESENTATION OVER STATE STORES. State stores are the source of truth; views are projections. Views are regenerated, state stores are not.

### P18.1 — Source-of-truth invariant

For every operational view, the corresponding state store directory is authoritative:

| View | State store | Authoritative file format |
|---|---|---|
| discussion-bubbles.html | `.claude/state/discussion-bubbles/` | One markdown file per discussion bubble |
| activity.html | `.claude/state/handoffs/<scenario>/` | One markdown file per handoff |
| proposals.html | `.claude/state/proposals/pending/` | One markdown file per proposal |

When state and view disagree, **state wins**. Regenerate the view from state. Never edit a view file by hand.

### P18.2 — Surgical regen, not full re-render

The HTML structure (markup, scripts, styles, filter bar, layout) is checked into the repo and treated as code. Only the embedded `<script id="report-data" type="application/json">` block is mutated during regeneration.

This is intentional:
- Reduces token cost per regen (~2k vs ~5k for full render)
- Keeps diffs reviewable (only data changes show in git diff)
- Reduces risk of accidental structure regression
- Allows hand-improvements to HTML structure (CSS tweaks, new filters) to persist

**Implementation requirement:** parbaughs-report-generate must use `str_replace`-equivalent for the data block. Skill must reject full re-render of operational view HTML.

### P18.3 — JSON round-trip validation

After replacing the data block, the skill MUST:
1. Parse the modified HTML
2. Extract the embedded JSON
3. Parse it (must not raise)
4. Compare deserialized content to the original data object — must be equal

If any step fails, the skill MUST NOT write the file. Flag HALT 23 (operational view source-state read fails or write validation fails).

### P18.4 — Decision capture is intent, not state

proposals.html captures Founder decisions in browser-local storage. These are INTENT, not committed state. The state mutation happens when:
1. Founder clicks "Export decisions" → downloads JSON
2. Founder runs `.claude/scripts/apply-decisions.sh path/to/decisions.json`
3. The script moves proposal files between `pending/` / `approved/` / `rejected/` / `deferred/`
4. The script commits the changes

Until step 4, no proposal state has changed. The browser-local intent can be cleared, modified, or ignored without consequence.

**Multi-device implication:** Decisions captured on one browser are NOT visible on another. This is acceptable for the single-Founder workflow but should be reconsidered if decision-making ever distributes.

### P18.5 — Apply-decisions script discipline

`.claude/scripts/apply-decisions.sh` is the ONLY sanctioned path for moving proposals from pending to a decided directory. Agents MUST NOT move proposal files directly. Reasons:
- Script appends a decision-log entry to `.claude/state/proposals/decisions-log.ndjson`
- Script formats commit messages consistently
- Script handles Founder notes append
- Script validates the JSON shape before acting (rejects malformed input)

Direct file moves bypass the audit trail and break decision-log integrity.

### P18.6 — Regen cadence

- **discussion-bubbles.html** regenerated on every discussion bubble close event AND on end-of-day heartbeat (debounce: if a discussion bubble close already triggered regen within last 15 minutes, skip the heartbeat regen)
- **activity.html** regenerated on every ship close AND end-of-day heartbeat (same debounce rule)
- **proposals.html** regenerated whenever a new proposal lands in `pending/` OR on weekly proactive cycle close

Operational views are NOT regenerated on every heartbeat (would waste tokens). They are event-driven.

### P18.7 — Empty-state contract

If a state store is empty (no discussion bubbles yet, no handoffs in window, no pending proposals), the view MUST still render correctly with an empty data array. Renderer-side empty-state UI is required ("No proposals match current filters", "No discussion bubbles recorded", etc).

Empty state is not an error condition. Logging "empty state encountered" once is fine; logging it every regen is noise.

### P18.8 — Founder edit boundary

If the Founder manually edits an operational view HTML file (e.g., adds custom CSS, adjusts layout), the skill's surgical regen pattern preserves those edits as long as they don't touch the JSON data block.

**Founder-modifiable zones:**
- All HTML outside the `<script id="report-data">` block
- All CSS in `<style>` tags
- All JS in trailing `<script>` tags after the data block

**Skill-managed zone:**
- Contents of `<script id="report-data" type="application/json">...</script>` only

The skill must NEVER touch the Founder-modifiable zones. If the skill notices structural drift (missing required elements like the filter bar), it must flag HALT 23.4 (operational view structural integrity) rather than silently overwriting.

---

## Protocol consolidation summary (v1-v8.1)

| ID | Protocol | Source |
|---|---|---|
| P1 | Audit-first | v1 |
| P2 | Caddy Notes | v1 |
| P3 | Semver | v1 |
| P4 | Discussion Bubble write | v2 |
| P5 | Validator strictness | v3 |
| P6 | CSS token alias | v4 |
| P7 | Legacy field consumer | v4 |
| P8 | State re-assignment | v4 |
| P9 | Firestore writer | v5 |
| P10 | Loop-and-verify | v5 |
| P11 | Founder Input Queue triage | v6 |
| P12 | Extended thinking / deep research | v6 |
| P13 | Agent wellbeing | v6 |
| P14 | Headless operation | v7 |
| P15 | Proactive improvement | v7 |
| P16 | Handoff discipline | v8 |
| P17 | Telemetry discipline | v8 |
| P18 | Operational view discipline | **v8.1** |


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


# P18.6 — Dashboard = Founder's Newspaper

## Principle

`docs/reports/dashboard.html` is Founder's canonical newspaper. Every item
requiring Founder eyes is surfaced on the dashboard. Team session logs,
state-tree files, and per-surface dashboards (amendments.html,
proposals.html, etc.) are NOT acceptable substitutes — they're drill-down
destinations that the dashboard LINKS TO, not standalone review surfaces.

Founder should be able to open dashboard.html cold (no context from prior
session) and within 60 seconds answer:
- "What needs my decision today?"
- "What changed since I last looked?"
- "Is anything broken?"

If a Founder-eyes item exists somewhere in the repo and is NOT on the
dashboard, the dashboard is wrong and must be fixed before the work that
created the item is considered done.

## What MUST surface on dashboard.html

### Open governance gates
- Amendments awaiting approval (count + link to amendments.html)
- Discussion bubbles flagged for Founder attention (count + link to
  discussion-bubbles.html)
- Proposals awaiting decision (count + link to proposals.html)
- Open Phase-gate escalations (taxonomy decisions, cross-cutting
  architecture choices — per escalation criterion #5)

### System health
- Cron last-fire status (each cron: when last fired, success/fail)
- Last regen-all status
- Working tree status (clean vs. uncommitted)
- HALT state (any active halts visible)
- Round-trip test last-pass status

### Activity since last Founder visit
- Commits since last Founder session
- Files changed since last Founder session
- Ships closed
- Bubbles closed with disposition
- Proposals applied
- Amendments applied

### Open exceptions / errors
- Any failed cron runs
- Any AUTONOMOUS_FAILURE_RECOVERY abandon_criteria hit
- Any test failures
- Any stuck states (last-verify.json present > 24h)

## What MUST NOT surface on dashboard.html

- Routine work-in-progress (lives in `.claude/state/`)
- Audit trails (lives in dedicated logs)
- Detailed technical reports (live in state files; dashboard LINKS to
  them when relevant — never inlines)

## Section layout

Add a "Founder Review Queue" section to dashboard.html, positioned
at the top of the page (above the existing "This week" + "Recent 7
days" sections).

- Visually distinct: brass accent border, larger headline treatment.
- Each queue item: `{type, count, last_updated, link}` — kept terse.
- Empty queue is a valid state — render an "All caught up" message
  rather than collapsing the section (Founder needs the affirmative
  signal that nothing is waiting).
- Stale items (`last_updated > 3 days ago`) flagged distinctly (warning
  border or icon) — surfaces bit-rot in the queue.

## Data wiring

Extend `scripts/regen-dashboard.py` to aggregate queue items:

```python
def build_founder_queue():
    return {
        "governance_gates": {
            "amendments_pending":   count_amendments_pending(),
            "amendments_link":      "amendments.html",
            "bubbles_flagged":      count_bubbles_flagged_for_founder(),
            "bubbles_link":         "discussion-bubbles.html",
            "proposals_pending":    count_proposals_pending(),
            "proposals_link":       "proposals.html",
            "open_escalations":     list_open_phase_escalations(),
        },
        "system_health": {
            "crons":                cron_last_fire_map(),
            "last_regen_all":       last_regen_all_status(),
            "working_tree":         working_tree_status(),
            "halts":                active_halts(),
            "round_trip_last_pass": round_trip_last_pass_ts(),
        },
        "activity_since_last_visit": {
            "commits":             commits_since_last_founder_visit(),
            "files_changed":       files_changed_since_last_visit(),
            "ships_closed":        ships_closed_since_last_visit(),
            "bubbles_closed":      bubbles_closed_since_last_visit(),
            "proposals_applied":   proposals_applied_since_last_visit(),
            "amendments_applied":  amendments_applied_since_last_visit(),
        },
        "exceptions": {
            "failed_crons":        failed_cron_runs_recent(),
            "abandon_triggers":    autonomous_failure_abandon_evidence(),
            "test_failures":       recent_test_failures(),
            "stuck_states":        stuck_last_verify_states(),
        },
    }
```

Each section auto-collapses to a `{count, last_updated}` summary at the
top; click-to-expand for the full list. "Last Founder visit" tracked via
a state file (`.claude/state/founder/last-visit.json`) updated whenever
Founder explicitly marks the dashboard as reviewed.

## Critic gates added to every commit

```
[ ] If this commit creates anything Founder needs to see, the dashboard
    data block reflects it.
[ ] If this commit closes something Founder was awaiting, the dashboard
    data block reflects the closure.
[ ] Founder Review Queue count is accurate (no stale entries pointing
    to closed items; no missing entries for open items).
```

These run alongside existing protocol gates (P18.1 source-of-truth,
P18.3 round-trip validation, P18.5.5 amendments-aware reviews).

## Existing reports policy

Every team report that surfaces ANYTHING needing Founder eyes MUST ALSO
update the dashboard so Founder can find it on next visit WITHOUT
reading the team's session log.

Existing reports authored before this protocol landed
(`.claude/state/wave-zero-dry-run/CONSOLIDATED_REPORT_TO_FOUNDER.md`,
etc.) MAY remain as detail surfaces, but the dashboard MUST link to
them from the corresponding queue item — Founder should never need to
open a state-tree report cold to discover a pending gate.

## Operating discipline (immediate, pre-implementation)

The protocol is ACTIVE from the moment AMD-007 is authored. Until
dashboard.html + regen-dashboard.py implementation lands (Wave 1
follow-on ship), the team manually maintains a queue stub at
`.claude/state/founder/review-queue.json` so the gate is honored even
when the rendered surface is incomplete. The Critic gates above apply
against that stub until the rendered surface exists.

This avoids the "we'll surface it once the dashboard supports it"
anti-pattern that would let Founder-eyes items slip during the
implementation window.

## Implementation scope (Wave 1 follow-on ship)

A separate ship plan (W1.S?? — "Founder Review Queue Implementation")
will:

1. Build the "Founder Review Queue" section in dashboard.html.
2. Extend regen-dashboard.py with the aggregator functions above.
3. Wire stale-flag thresholds + empty-queue copy.
4. Add the 3 Critic gates to the Critic checklist skill.
5. Add round-trip validation: dashboard.html must always have a
   `founder_queue` top-level key in its data block; counts must match
   on-disk source-of-truth (parallels the existing proposals_pending
   and amendments_counts cross-dash consistency checks).

## Cross-references

- P18 Operational View Discipline (PROTOCOLS_v8.1_ADDENDUM.md)
- P18.5 Amendments-lifecycle (added by AMD-006, applied 2026-05-14)
- AUTONOMOUS_FAILURE_RECOVERY_v8.3 §3 abandon_criteria (drives the
  "abandon_triggers" exception surface)
- 5 escalation criteria (drives "open Phase-gate escalations" queue)
