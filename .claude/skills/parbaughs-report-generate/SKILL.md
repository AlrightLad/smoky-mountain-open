# parbaughs-report-generate

## Description

Generate markdown + HTML report pairs from telemetry aggregates and state stores. Nine output types:

**Time-windowed reports** (markdown + HTML pair, charts):
- `dashboard` — current snapshot, regenerated every heartbeat
- `daily` — one per day
- `weekly` — one per ISO week
- `ship` — one per ship close
- `wave` — one per wave close
- `quarterly` — one per calendar quarter

**Operational views** (HTML-only, read state stores directly, no aggregation):
- `discussion-bubbles` — discussion bubble decision archive (`.claude/state/discussion-bubbles/`)
- `activity` — handoff chronological feed (`.claude/state/handoffs/`)
- `proposals` — proactive proposal review with intent-capture (`.claude/state/proposals/pending/`)

Reports are READ-ONLY views; underlying telemetry/state is source of truth.

Proposals view is the ONE exception: it captures Founder intent (approve/reject/defer) in browser-local storage and exports a decisions JSON. The decisions are applied to the repo via `.claude/scripts/apply-decisions.sh`, NOT by this skill.

Trigger conditions:
- Heartbeat → regenerate `dashboard.md` + `dashboard.html`
- End-of-day heartbeat → daily report + regenerate `discussion-bubbles.html`, `activity.html`, `proposals.html` (reflect new handoffs/discussion-bubbles/proposals from the day)
- Proactive cycle (weekly) → weekly report + regenerate `proposals.html` (new proposals from this cycle)
- Ship completion → ship report + regenerate `discussion-bubbles.html` + `activity.html` (new discussion-bubbles/handoffs from this ship)
- Discussion Bubble close → regenerate `discussion-bubbles.html` immediately (debounced if multiple discussion bubbles in same cycle)
- Wave close → wave report
- Manual trigger or 13-week interval → quarterly report

## When to use

USE when:
- Cycle completes a report-trigger boundary (per above)
- Founder requests on-demand regeneration
- Backfill needed after telemetry recovery (e.g., post-HALT 22 resolution)
- Operational view source state changed since last regen (new discussion bubble, new handoff, new proposal)

DO NOT use when:
- Mid-cycle (telemetry still in flight; reports would be inconsistent)
- Telemetry aggregates flagged as integrity-failed (HALT 22 active)
- Operational view source state is mid-write (e.g., proposal being authored)

## How to use

### 1. Resolve report type

Determined by trigger event. See trigger conditions above. Multiple report types can be regenerated in a single skill invocation (e.g., heartbeat regenerates dashboard + may refresh operational views if state changed).

### 2. Read source data

**Time-windowed reports** read from `.claude/state/telemetry/aggregates/`:
- All read `current-snapshot.json`
- Daily filters events for date from `events/<date>.ndjson`
- Weekly aggregates over week
- Ship filters `ships.json` for ship_id + related cycle/handoff/discussion-bubble data
- Wave filters for wave_id across all aggregates
- Quarterly rolls up wave reports + 13 weeks of weekly data

**Operational views** read state stores directly:
- `discussion-bubbles` → scan `.claude/state/discussion-bubbles/*.md`, parse frontmatter + body
- `activity` → scan `.claude/state/handoffs/**/*.md`, parse frontmatter + extract scope/next_action
- `proposals` → scan `.claude/state/proposals/pending/*.md`, parse proposal frontmatter + body

For operational views, the renderer in HTML is data-driven via embedded JSON. The skill's job is producing the JSON correctly; the static HTML structure does not change between regenerations.

### 3. Compute report-specific metrics (time-windowed only)

Per REPORT_TEMPLATES.md § N for the report type:
- Sums, averages, trends (rolling windows)
- Trend direction (up/down/stable) from comparison to prior period
- Cross-references (handoff counts, discussion bubble counts, proposal lane breakdown)
- Per-role, per-activity, per-phase rollups

### 4. Render markdown report (time-windowed only)

Per REPORT_TEMPLATES.md template for type:
- Substitute `{variables}` with computed values
- Missing data → `—` or `n/a` (NEVER blank)
- Tables: pipe-format, aligned
- Mermaid diagrams (for wave report Gantt charts) embedded inline
- Cross-references resolve to actual repo paths
- Write to `.claude/state/reports/<type>/<name>.md`

Operational views do NOT produce markdown. They are HTML-only because:
- Discussion Bubble archive: data is already markdown in `.claude/state/discussion-bubbles/`, no rollup needed
- Activity feed: data is already markdown in `.claude/state/handoffs/`, no rollup needed
- Proposals: data is already markdown in `.claude/state/proposals/pending/`, no rollup needed
- Markdown view = browse the state directories directly in the repo

### 5. Render HTML report

Per REPORT_HTML_SPEC.md + REPORT_HTML_SPEC_v8.1_AMENDMENT.md:

**Time-windowed reports:**
- Load template skeleton: `docs/reports/_assets/template.html`
- Substitute report-specific sections
- Inject telemetry data as JSON inside `<script id="report-data" type="application/json">`
- Reference shared `dashboard.css` + `dashboard.js` from `_assets/`
- Reference Chart.js from cdnjs CDN
- Write to `docs/reports/<type>/<name>.html`

**Operational views:**
- HTML structure is static (lives at `docs/reports/{discussion-bubbles,activity,proposals}.html`)
- ONLY the embedded `<script id="report-data" type="application/json">` block is replaced
- Use `str_replace` or equivalent surgical edit to swap data block without touching surrounding markup
- Validate the JSON parses and the HTML still loads (basic checks)

### 6. Verify

For every output:
- HTML well-formed (no unclosed tags, valid JSON in data script)
- Embedded data passes `json.loads` or equivalent
- Required sections present per template / amendment
- For dashboard: pending proposals banner is hidden if proposals_pending == 0
- For proposals.html: every proposal has the required fields (id, title, lane, rationale, scope, estimate, files_affected, ship_target)

### 7. Update landing page

Update `docs/reports/index.html` with link to new time-windowed report (if any generated). Insert in correct section (Daily / Weekly / Ship / Wave / Quarterly). Sort by date descending.

Operational views don't need index updates (they're in the persistent "Operational views" section).

### 8. Log + emit telemetry

```
Journal:
[REPORT-<TYPE>-GENERATE] <key_metric>. md_path=<path>. html_path=<path>. generation_tokens=<N>.

Telemetry event (one per output):
{
  "event_type": "report.generated",
  "data": {
    "report_type": "<type>",
    "md_path": "<path>",
    "html_path": "<path>",
    "tokens_used": <N>,
    "view_kind": "time-windowed" | "operational"
  }
}
```

## Quality bar enforcement

Reject (regenerate or escalate) if:
- Markdown has unresolved `{placeholder}` strings
- HTML doesn't load in browser (broken JSON, missing CSS/JS references)
- Charts don't render (Chart.js init fails on data shape mismatch)
- Embedded data is invalid JSON
- Required sections missing per template
- Report data internally inconsistent (e.g., per-role token sum ≠ total)
- Operational view: data lists are empty when source state has entries (state read error)
- proposals.html: any proposal missing required fields

Resolution:
- Markdown placeholder unresolved → check aggregates for missing field → regenerate
- HTML broken → check JSON encoding of data block → regenerate
- Inconsistent data → flag HALT 22c (aggregate divergence)
- Operational view missing entries → check state directory read → if files exist but parse fails, flag HALT 22b (NDJSON corruption); if files don't exist, regen with empty list and log warning
- proposals.html missing fields → flag HALT 23 (operational view source state malformed)

## Generation cost

Per cycle:
- Dashboard: ~5k tokens
- Daily: ~4k tokens
- Weekly: ~8k tokens
- Ship: ~3k tokens (per ship completion)
- Wave: ~12k tokens (per wave close)
- Quarterly: ~15k tokens (per quarter)
- Discussion Bubbles regen: ~2k tokens (data block swap only)
- Activity regen: ~3k tokens (data block swap, more entries)
- Proposals regen: ~2k tokens (data block swap)

Weekly steady state cost:
- v8: ~250k tokens/week
- v8.1: +30k tokens/week (operational views regenerated daily + after each ship)
- **Total v8.1: ~280k tokens/week** (budget headroom remains intact within 3.5M/week cap)

## Idempotency

Time-windowed report generation is idempotent — running twice with same aggregates yields same output (bit-identical). Re-generation safe; no state mutation on aggregates.

Operational view regeneration is idempotent if source state unchanged. Output differs only if state changed between regens.

## Backfill mode

If reports missing for past dates (e.g., due to telemetry recovery):
- Skill accepts `--backfill <date>` flag
- Reads historical event files from `events/<date>.ndjson`
- Regenerates daily reports for missing dates
- Updates index.html

Backfill mode does NOT modify dashboard.html, discussion-bubbles.html, activity.html, or proposals.html (always reflect current state).

## Cross-references

- TELEMETRY_PROTOCOL.md (data source spec)
- REPORT_TEMPLATES.md (per-type markdown templates)
- REPORT_HTML_SPEC.md + REPORT_HTML_SPEC_v8.1_AMENDMENT.md (HTML rendering spec)
- HANDOFF_PROTOCOL.md (source data for activity.html)
- parbaughs-telemetry-emit skill (data emission upstream)
- parbaughs-handoff-note skill (handoff notes consumed by activity.html)
- PROTOCOLS_v8_ADDENDUM.md P17
- PROTOCOLS_v8.1_ADDENDUM.md P18 (operational view discipline)
- HALT_CRITERIA_v8_ADDENDUM.md item 22e (report generation fails)
- HALT_CRITERIA_v8.1_ADDENDUM.md item 23 (operational view source-state read fails)
- SESSION_JOURNAL_v8_ADDENDUM.md (logging conventions)
- `.claude/scripts/apply-decisions.sh` (consumer of proposals.html exported decisions)
