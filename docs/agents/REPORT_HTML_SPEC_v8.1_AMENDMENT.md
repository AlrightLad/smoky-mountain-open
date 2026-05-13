# REPORT_HTML_SPEC — v8.1 amendment

Adds three operational view specifications to the v8 HTML spec.

Status: **RATIFIED** governance v8.1
Supersedes: nothing (additive to v8 spec)
Cross-refs: REPORT_HTML_SPEC.md (v8 base), parbaughs-report-generate SKILL.md, PROTOCOLS_v8.1_ADDENDUM.md P18, HALT_CRITERIA_v8.1_ADDENDUM.md item 23

---

## §amendment.1 — Operational views: shared design rules

Three new HTML views: `discussion-bubbles.html`, `activity.html`, `proposals.html`. All three share:

1. **HTML-only.** No paired markdown report. Source data is markdown in state stores (`.claude/state/{discussion bubbles,handoffs,proposals}/`); the HTML wraps a presentation layer.
2. **Data-driven via embedded JSON.** The `<script id="report-data" type="application/json">` block is the entire data contract. The rest of the file is structural HTML + JS that reads that block.
3. **Surgical regeneration.** The skill replaces ONLY the JSON block contents on regen, never the surrounding HTML structure. Use `str_replace` or equivalent. This keeps HTML stable, makes diffs reviewable, and reduces token cost per regen.
4. **No external dependencies.** No Chart.js, no CDN imports. Plain CSS vars + inline JS for interaction.
5. **Theme toggle present.** Same pattern as dashboard.html — `<button class="theme-toggle">`, persists to `localStorage` under `parbaughs-reports-theme`.
6. **Footer nav present.** Cross-links to other views and to GitHub repo.
7. **Filter bar present.** Per-view filters documented per section below. All filters are client-side; no server round-trip.

The static HTML structure for each view is checked into the repo at `docs/reports/{discussion bubbles,activity,proposals}.html`. The regen skill mutates only the data block.

---

## §amendment.2 — discussion-bubbles.html spec

**Purpose:** Slack/Discord-style threaded transcripts of every multi-agent deliberation. Master/detail layout: scrollable thread list (left rail) + full transcript pane (right). Founder reads this to inspect decision quality, see dissent patterns, find precedent, and follow how agents argued. Each discussion bubble = one chat thread.

**Source:** `.claude/state/discussion-bubbles/*.md`

**Data block schema:**
```json
{
  "discussion_bubbles": [
    {
      "id": "db-<YYYY-MM-DD>-<NNN>",
      "topic": "string — short title shown in thread list (the meeting subject)",
      "claim": "string — the proposition being decided (shown as quoted preamble in transcript)",
      "summary": "string — 1-2 sentence outcome blurb (shown in thread list preview)",
      "ship_id": "W1.S3" | "W1.I2" | "M3" | "v8.1-operational-views" | "...",
      "wave": "W1" | "W2" | "W3" | "W4" | null,
      "opened_at": "ISO-8601 UTC",
      "closed_at": "ISO-8601 UTC" | null,
      "status": "open" | "approved" | "approved-with-dissent" | "rejected" | "tied",
      "decision": "string — full decision rationale (rendered in last message)",
      "vote_tally": { "approve": N, "reject": N, "abstain": N },
      "messages": [
        {
          "author": "engineer" | "critic" | "performance-load" | "data-integrity" | "security"
                  | "orchestrator" | "design-bot" | "devil-advocate" | "plain-english-translator"
                  | "historical-pattern" | "future-self" | "end-user-persona" | "flow-doc"
                  | "ui-polisher" | "fiq-triage" | "discussion-bubble-orchestrator",
          "role_in_bubble": "open" | "voting" | "contributing" | "bubble-only" | "decision" | "summary",
          "timestamp": "ISO-8601 UTC",
          "content": "string — markdown-rendered text (plain text supported; newlines preserved)",
          "vote": "approve" | "reject" | "abstain" | null
        }
      ]
    }
  ]
}
```

**Role-in-bubble semantics:**
- `open` — orchestrator's bubble-opening message (sets quorum, names the question)
- `voting` — an agent with voting privileges casting their position (always paired with `vote` field)
- `contributing` — a participant who can speak but doesn't vote (e.g., orchestrator clarifications, end-user-persona findings)
- `bubble-only` — agents with bubble-only status (devil-advocate, historical-pattern, future-self, plain-english-translator) — stress-test without voting
- `decision` — orchestrator's closing message announcing the vote result and outcome
- `summary` — optional final synthesis from plain-english-translator

**Status semantics:**
- `open` — bubble currently in flight (animated pulsing dot in UI)
- `approved` — quorum approved, no dissent recorded
- `approved-with-dissent` — quorum approved but at least one voting agent rejected
- `rejected` — quorum did not approve
- `tied` — vote tied; orchestrator break required (will be re-rendered as approved/rejected once tiebreaker fires)

**Required UI elements:**
- Master/detail layout: 360px left rail + flex-1 right pane (stacks vertically below 900px viewport)
- Left rail filters: status (all/open/approved/approved-with-dissent/rejected/tied) + ship (auto-populated)
- Left rail thread items grouped by day with sticky day-divider headers (Today / Yesterday / weekday name / explicit date)
- Each thread item: status dot (color-coded), topic title (1 line, truncated), submeta (time · message count · status text + vote string), 2-line summary snippet
- Right pane on selection: thread header (title, id, full date, vote tally badge, ship, message count), claim block (italic, brass left-border), then message stream
- Each message: 32px circular avatar with agent initials in agent's role color, author name + role badge + vote badge + timestamp, content bubble with left-border in agent's role color
- Open/decision messages styled with brass tint to distinguish from regular participant messages
- Mobile (≤900px): back button surfaces in right pane when a thread is selected; pane stacks below list

**Voting agents (per Pass 3e governance):** engineer, critic (always); performance-load (W2+), data-integrity (W2+), security (Launch A+). Other agents contribute or operate bubble-only without voting authority.

**Agent role colors (consumed via `data-author` CSS selectors):**
| Agent | Color token |
|---|---|
| engineer | --accent-brass |
| critic, security, devil-advocate | --accent-claret |
| orchestrator, historical-pattern, flow-doc | --accent-moss |
| performance-load, end-user-persona, fiq-triage | --accent-amber |
| data-integrity, plain-english-translator | --accent-teal |
| design-bot, future-self, ui-polisher | --accent-violet |
| discussion-bubble-orchestrator | --accent-brass |

**Regen trigger:** any new message appended to any discussion bubble state file, or status transition (open → approved/rejected/tied), or new bubble file written. Debounce to 1 regen per 30s if multiple updates land in burst.

**Initial selection:** the most recently opened bubble auto-selects on page load so Founder sees fresh content without needing to click.

---

## §amendment.3 — activity.html spec

**Purpose:** Chronological feed of every agent handoff. The "chat log" view of agent-to-agent communication. Founder reads this to understand the agent conversation flow, troubleshoot stuck cycles, review who-did-what.

**Source:** `.claude/state/handoffs/**/*.md`

**Data block schema:**
```json
{
  "handoffs": [
    {
      "id": "<scenario>-<YYYYMMDD>-<HHMMSS>-<slug>",
      "scenario": "cycle-to-cycle" | "agent-to-agent" | "subagent-to-parent"
                | "parent-to-subagent" | "proactive-to-ship" | "halt-to-resume"
                | "founder-to-agent" | "discussion-bubble-to-caller"
                | "cross-ship" | "wave-to-wave" | "parallel-merge",
      "from_agent": "string",
      "to_agent": "string",
      "created_at": "ISO-8601 UTC",
      "cycle_id": "ship-cycle-<N>" | "proactive-cycle-<N>" | ...,
      "ship_id": "W1.S3" | null,
      "scope_completed": ["array of strings"],
      "scope_remaining": ["array of strings"],
      "next_action": "string",
      "blockers": "string ('none' if none)",
      "context_required": ["array of repo paths"]
    }
  ],
  "agents": ["array of all known agent names — populates filter dropdown"],
  "ships": ["array of all known ship ids — populates filter dropdown"]
}
```

**Required UI elements:**
- Filter bar: Scenario (all + 11 scenarios from HANDOFF_PROTOCOL.md), Agent (populated from data.agents), Ship (populated from data.ships), Range (24h/7d/30d/all)
- Count display: `N shown`
- Stream view: vertical timeline with day dividers
- Each item: timestamp, from→to arrow, scenario badge, ship/cycle context, next action, scope completed (✓), scope remaining (○), context paths, blockers (warn-styled if present)
- Color-coded timeline dots by scenario (one color per scenario, defined in CSS)

**Required CSS classes:**
- `.activity-item.scenario-<scenario-name>` — colored timeline dot per scenario
- `.day-divider` — date header between groups
- `.activity-card` — handoff content container

**Sort:** Always newest first (descending by `created_at`).

---

## §amendment.4 — proposals.html spec

**Purpose:** Founder reviews proactive-cycle proposals. Marks approve / reject / defer + optional note. Exports decisions JSON. Applies via `.claude/scripts/apply-decisions.sh`.

**Source:** `.claude/state/proposals/pending/*.md`

**Data block schema:**
```json
{
  "generated_at": "ISO-8601 UTC",
  "proposals": [
    {
      "id": "PROP-<NNN>-<slug>",
      "title": "string",
      "lane": 1 | 2 | 3 | 4,
      "lane_label": "UI Polish" | "Bug Discovery" | "Performance" | "Design System Extension",
      "created_at": "ISO-8601 UTC",
      "rationale": "string — why this proposal exists",
      "scope": "string — what work is involved",
      "estimate": {
        "cost_tokens": N,
        "duration_minutes": N,
        "risk": "low" | "medium" | "high"
      },
      "files_affected": ["array of repo paths"],
      "evidence_paths": ["array of research/audit paths"],
      "ship_target": "W1.S4" | "Deferred — <reason>" | "..."
    }
  ]
}
```

**Required UI elements:**
- Help banner explaining intent-capture + JSON export workflow
- Sticky summary bar: counts of pending, approve, reject, defer, undecided
- Buttons: Clear all, Export decisions (primary)
- Filter bar: Lane (all/1/2/3/4), Status (all/undecided/decided), Sort (cost asc/desc, by lane, newest)
- Proposal card list with required sections per card:
  - Header: id, title, lane badge, generated timestamp, ship target
  - Rationale
  - Scope
  - Estimate (token cost, duration, risk)
  - Files affected
  - Evidence paths (if present)
  - Decision bar: Approve / Reject / Defer buttons + Note input + Clear

**Decision state:**
- Stored in `localStorage` under key `parbaughs-proposal-decisions-v1`
- Shape:
  ```json
  {
    "<proposal-id>": {
      "type": "approve" | "reject" | "defer",
      "note": "string (optional)",
      "decided_at": "ISO-8601 UTC"
    }
  }
  ```
- Decisions persist across page reloads
- Clicking the same button twice unmarks the decision
- Clear button per proposal removes its decision
- Clear all button confirms then wipes all decisions

**Export decisions JSON shape:**
```json
{
  "schema_version": 1,
  "generated_at": "ISO-8601 UTC (when export ran)",
  "source_report_generated_at": "ISO-8601 UTC (from data.generated_at)",
  "decisions": [
    {
      "proposal_id": "PROP-008-css-token-cleanup",
      "decision": "approve" | "reject" | "defer",
      "note": "string (empty if no note)",
      "decided_at": "ISO-8601 UTC"
    }
  ]
}
```

**Export mechanism:**
- Try `window.showSaveFilePicker()` (Chrome/Edge)
- Fall back to anchor-tag download (`<a download>`)
- Filename: `decisions-<YYYY-MM-DD-HH-MM-SS>.json`
- Show alert with next-step instruction after successful export

**CSS classes:**
- `.proposal-card.decided-approved` / `.decided-rejected` / `.decided-deferred` — colored left border + gradient background
- `.proposal-lane.lane-<N>` — lane color badge
- `.btn-approve.active` / `.btn-reject.active` / `.btn-defer.active` — active state styling
- `.summary-bar` (sticky at top of viewport when scrolling)

---

## §amendment.5 — Data block swap pattern

Operational views are regenerated via surgical data-block replacement:

```python
# Pseudocode for regen
data = build_data_from_state()
json_block = json.dumps(data, indent=2)

# Match the entire <script id="report-data"> block contents
old_pattern = re.compile(
    r'(<script id="report-data" type="application/json">)\s*(.*?)\s*(</script>)',
    re.DOTALL
)
html = old_pattern.sub(
    lambda m: f'{m.group(1)}\n{json_block}\n    {m.group(3)}',
    html
)
```

After replacement:
1. Validate the resulting HTML still parses (basic well-formed check).
2. Validate the embedded JSON parses.
3. Verify the data block round-trips: parse from updated HTML, compare to source data.
4. If any check fails, do NOT write the file. Flag HALT 23.

---

## §amendment.6 — Index page integration

`docs/reports/index.html` (v8.1) gains an **Operational views** section with cards for Dashboard, Discussion Bubbles, Activity, Proposals. These cards persist regardless of report regeneration cadence — they are not added/removed dynamically.

Index page also surfaces the four operational views in a "Recent reports" stub with last-update timestamps reflecting their last regen.

---

## §amendment.7 — Performance considerations

- discussion-bubbles.html: O(N) discussion bubbles. Expect 10-50/wave. No paging needed under 1000.
- activity.html: O(N) handoffs. Expect 200-500/week. Filter dropdown defaults to 7d to keep DOM weight reasonable. Add paging if exceeds 5000 entries.
- proposals.html: O(N) proposals. Expect 3-8/proactive-cycle. No paging concerns.

All three views render in pure JS without virtualization. If activity.html grows past ~5000 entries in the 30d window, the skill should chunk into separate views (e.g., `activity-2026-W19.html`).

---

## §amendment.8 — Accessibility (defer to v8.2)

Operational views inherit dashboard.css a11y baseline. Specific gaps for follow-up ship:
- Filter dropdowns need aria-label
- Modal-style decision buttons in proposals.html could benefit from role="group" aria-labelledby
- Day dividers in activity.html should use proper heading hierarchy
- proposal-card focus management on decision capture

Tracked separately in v8.2 a11y polish ship.

---

## §amendment.9 — Scenario token canonical mapping

The activity.html data block emits canonical scenario tokens matching the HANDOFF_PROTOCOL.md scenario headings. These tokens may NOT match the storage folder name on disk. The generator MUST translate folder → canonical scenario token when reading handoff state files.

**Canonical scenario tokens (used in data block + CSS classes + dropdown filter):**

| Scenario # | Canonical token (data block / CSS / filter) | Storage folder on disk |
|---|---|---|
| 1 | `cycle-to-cycle` | `.claude/state/handoffs/cycle-to-cycle/` |
| 2 | `agent-to-agent` | `.claude/state/handoffs/agent-to-agent/` |
| 3 | `subagent-to-parent` | `.claude/state/handoffs/subagent-returns/` |
| 4 | `parent-to-subagent` | `.claude/state/handoffs/dispatches/` |
| 5 | `proactive-to-ship` | `.claude/state/handoffs/proactive-to-ship/` |
| 6 | `halt-to-resume` | `.claude/state/handoffs/halts/` |
| 7 | `founder-to-agent` | `.claude/state/handoffs/founder-responses/` |
| 8 | `discussion-bubble-to-caller` | `.claude/state/handoffs/discussion-bubbles/` |
| 9 | `cross-ship` | `.claude/state/handoffs/cross-ship/` |
| 10 | `wave-to-wave` | `.claude/state/handoffs/wave-transitions/` |
| 11 | `parallel-merge` | `.claude/state/handoffs/parallel-merge/` |

**Generator translation table (folder → canonical token):**

```python
FOLDER_TO_SCENARIO = {
    "cycle-to-cycle":      "cycle-to-cycle",
    "agent-to-agent":      "agent-to-agent",
    "subagent-returns":    "subagent-to-parent",
    "dispatches":          "parent-to-subagent",
    "proactive-to-ship":   "proactive-to-ship",
    "halts":               "halt-to-resume",
    "founder-responses":   "founder-to-agent",
    "discussion-bubbles":  "discussion-bubble-to-caller",
    "cross-ship":          "cross-ship",
    "wave-to-wave":        "wave-to-wave",
    "wave-transitions":    "wave-to-wave",
    "parallel-merge":      "parallel-merge",
}
```

**Why the mismatch:** Storage folder names are operational artifacts (descriptive of "what's in here"). Scenario tokens describe the handoff *direction*. The two were authored at different times. Aligning the folder names to scenario tokens is tracked as a follow-up cleanup (out of scope for v8.1). For v8.1, the generator owns the translation.

**Telemetry note:** The `handoff.created` event in TELEMETRY_PROTOCOL.md emits scenario as a numeric ID (1-11), not a string token. Numeric IDs are stable across renames. Operational views translate number → canonical token when rendering.

---

## §amendment.10 — Discussion bubble chat metaphor (v8.1.1)

`discussion-bubbles.html` renders as a two-pane chat application: scrollable bubble list on the left (each entry = one "chat"), full transcript view on the right (the "conversation"). This makes Founder review of agent reasoning low-friction — open one bubble → read the actual back-and-forth between agents, with timestamps and role attribution.

### Schema extension to bubble state file

Bubble frontmatter in `.claude/state/discussion-bubbles/<id>.md` extended with:

```json
{
  "id": "...",
  "topic": "...",
  "claim": "...",
  "ship_id": "...",
  "opened_at": "...",
  "closed_at": "...",
  "status": "approved" | "rejected" | "tied" | "approved-with-dissent",
  "decision": "...",
  "vote_tally": { "approve": N, "reject": N, "abstain": N },

  "brief_summary": "1-2 sentence preview shown in sidebar list. If omitted, generator derives from claim + decision.",

  "transcript": [
    {
      "agent": "discussion-bubble-orchestrator",
      "timestamp": "2026-05-12T14:00:00Z",
      "type": "open",
      "content": "Framing message that opened the bubble."
    },
    {
      "agent": "engineer",
      "timestamp": "2026-05-12T14:02:30Z",
      "type": "contributing",
      "content": "Substantive argument."
    },
    {
      "agent": "devil-advocate",
      "timestamp": "2026-05-12T14:05:00Z",
      "type": "bubble-only",
      "content": "Non-voting perspective."
    },
    {
      "agent": "engineer",
      "timestamp": "2026-05-12T14:15:00Z",
      "type": "vote",
      "vote": "approve",
      "content": "Vote rationale."
    },
    {
      "agent": "discussion-bubble-orchestrator",
      "timestamp": "2026-05-12T14:18:00Z",
      "type": "decision",
      "content": "Closing decision summary."
    }
  ]
}
```

### Message type taxonomy

| `type` | Meaning | Vote bearing |
|---|---|---|
| `open` | First message; orchestrator frames the bubble | no |
| `contributing` | Substantive argument from voting agent | no (precedes their vote) |
| `bubble-only` | Perspective from non-voting agent (Devil's Advocate, Plain English Translator, Historical Pattern, Future Self) | never |
| `vote` | Voting agent casts vote with rationale; requires `vote` field (approve/reject/abstain) | yes |
| `decision` | Final closing message; orchestrator summarizes outcome | no |

### Agent role categories (for avatar coloring)

The renderer maps `agent` to one of six visual categories:

| Category | Token | Agents |
|---|---|---|
| `coord` | brass | orchestrator, ship-orchestrator, proactive-orchestrator, discussion-bubble-orchestrator |
| `build` | teal | engineer |
| `quality` | claret | critic, security |
| `vote` | moss | performance-load, data-integrity, design-bot |
| `perspective` | violet | devil-advocate, plain-english-translator, historical-pattern, future-self |
| `user` | amber | end-user-persona, founder |

Unknown agents fall back to `coord` (brass).

### Vote-tally integrity check

`vote_tally.approve + vote_tally.reject + vote_tally.abstain` MUST equal the count of `type: "vote"` messages in `transcript`. Generator surfaces a HALT 23 (operational view source-state malformed) if mismatched.

### UI behaviors

**Sidebar (left pane):**
- Header: title + search input (filters topic, claim, agent names in transcript)
- Filter chips: status (all / approved / dissent / rejected / tied)
- List items sorted by `opened_at` descending (most recent first)
- Each item: date stamp + topic + brief_summary + status badge + vote tally
- Selected item highlighted with brass left border
- Active selection persisted in `localStorage["parbaughs-discussion-bubble-active-id"]`

**Transcript pane (right pane):**
- Sticky header: topic + ship_id + decision banner (vote tally + status)
- Claim block under header (the proposition being decided)
- Scrollable transcript area:
  - Each message: agent avatar (color-coded) + agent name + timestamp + content + type badge
  - Vote messages additionally show approve/reject/abstain pill
  - Bubble-only messages styled with subtle background tint (visually distinguished from votes)
- Empty state: "Select a discussion bubble to view the transcript."

**Mobile (<768px):**
- Sidebar becomes full-width list
- Selecting a bubble slides the transcript pane in with a back arrow
- Back arrow returns to list

**Persistence:**
- Active bubble ID survives page reload
- Search input + filter chips survive page reload (separate localStorage keys)

### Generator regen cost

Per regen: ~3k tokens (transcript bulk is larger than v8.0 bubble cards; was ~2k). Updates weekly steady state to ~283k tokens/week.
