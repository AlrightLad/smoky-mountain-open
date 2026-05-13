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
