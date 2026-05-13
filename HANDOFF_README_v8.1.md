# Governance v8.1 — Handoff README

**Ship date:** 2026-05-13
**Predecessor:** v8 (already applied to repo)
**Status:** ready to apply
**Patch level:** v8.1.2 — pause discipline locked + Wave Zero Dry-Run runbook + First Proactive Cycle kickoff

---

## TL;DR

v8.1 adds three operational HTML views, a decisions-apply script, and renames `bubble` → `discussion bubble`. v8.1.1 upgraded `discussion-bubbles.html` to a Slack-style threaded transcript. **v8.1.2** locks pause-vs-halt discipline (90% rate-limit boundary is a PAUSE that auto-resumes, never a HALT requiring Founder restart) and ships two executable runbooks: Wave Zero Dry-Run (the pre-agents-loose gate) and First Proactive Cycle Kickoff (which hands dashboard improvement work to the orchestration team going forward).

---

## v8.1.2 — Pause discipline locked

Three drift problems in v8/v8.1 governance were creating the wrong mental model for the orchestration team:

1. **`HALT_CRITERIA` item 13 (Rate-limit threshold 90%) was named a halt** — implied Founder restart required. Actually a pause with auto-resume.
2. **`HANDOFF_NOTE_TEMPLATES.md` line 33** mixed "budget watchdog 90%" with "halt reason" in the same handoff field.
3. **`WAVE_ZERO_DRY_RUN_v8_EXTENSION.md` validation 5** was called "Rate-limit halt dry-run" — the dry-run itself encoded the wrong pattern.

**Fixed in v8.1.2:**

- **NEW `PAUSE_DISCIPLINE_v8.1_ADDENDUM.md`** — formalizes PAUSE vs HALT. Defines state file schema (`.claude/state/last-verify.json`), pause sequence (finish atomic op → write state → exit clean), resume sequence (cron reads state → continues), quota reset windows (weekly Sunday 00:00 UTC, daily UTC day-start, hourly UTC hour-start). Cross-references items 13 + 17 as PAUSE items kept in HALT_CRITERIA for numbering stability only.
- **NEW HALT 24** (3 subtypes) — auto-resume failure. The ONE case where pause becomes a halt: if `last-verify.json` exists and `resume_after + 1h` has passed without resume firing, Founder is paged. This is the safety net under autonomous pause.
- **PATCH** `HALT_CRITERIA_v8_ADDENDUM.md` — items 13 + 17 cross-reference PAUSE_DISCIPLINE and explicitly flagged "FUNCTIONALLY A PAUSE, NOT A HALT"
- **PATCH** `HANDOFF_NOTE_TEMPLATES.md` — "Why it stopped" field split into PAUSE block + HALT block with distinct schemas
- **PATCH** `WAVE_ZERO_DRY_RUN_v8_EXTENSION.md` — validation 5 renamed "Rate-limit pause-and-resume dry-run"; pass criteria strengthened to require auto-resume on next cron (not just clean exit on pause)

**Critical invariant Founder locked:** if the orchestration team ever halts on a rate-limit boundary requiring Founder restart, that's a bug. Auto-resume is the contract.

---

## v8.1.2 — Two executable runbooks

These are the docs the orchestration team in Claude Code terminal pastes-and-executes.

### `WAVE_ZERO_DRY_RUN_RUNBOOK.md`

The pre-agents-loose gate. 12 validations with Setup → Execute → Verify → Record loop per validation. Includes:

- Pre-flight (verify clean repo, state dirs exist, cron paused, round-trip test green)
- Validations 1-12 per `WAVE_ZERO_DRY_RUN.md` (v4) + v7 extension + v8 extension
- Validation 5 explicitly validates pause-and-auto-resume per new discipline (the test the team must NOT confuse for a halt-and-wait)
- Validation 11 covers all 11 handoff scenarios using canonical scenario tokens per v8.1
- Validation 12 covers telemetry + report generation including operational view regen
- Summary report template + Founder ratification step
- Token budget: ~350k (10% of 3.5M weekly cap)

The runbook explicitly tells the team: pause discipline applies during the dry-run itself. If the dry-run hits 90% mid-execution, pause + resume — don't escalate to Founder.

### `FIRST_PROACTIVE_CYCLE_KICKOFF.md`

Locks Founder's directive: **the orchestration team owns dashboard improvement going forward.** Claude.ai writes governance and vision; the team executes via the proactive cycle.

The first proactive cycle's scope is bounded: review the three operational views (`discussion-bubbles.html`, `activity.html`, `proposals.html`) for readability and effectiveness. Surface 1-3 proposals via the proposal protocol. Founder reviews via `proposals.html`, approves via intent-capture + apply-decisions.sh.

Includes:
- Explicit out-of-scope items to prevent scope creep (no chrome changes, no time-windowed reports, no new views)
- Quality bar for proposals (auto-reject criteria, must-have schema fields)
- Discipline reminders: pause-don't-halt, audit-first, diagnostic-before-defense, single-author invariant, no design unilateralism
- Expected telemetry footprint
- Output deliverables + success/failure criteria

This kickoff fires immediately after Founder ratifies the dry-run summary and removes `cron-paused.json`.

---

## v8.1.1 — Discussion bubbles as threaded transcripts

`docs/reports/discussion-bubbles.html` is now a two-pane interface:

- **Left rail (360px):** scrollable thread list grouped by day with sticky day-dividers (Today / Yesterday / weekday / explicit date). Each thread shows status-color dot, topic, time + message count + status text, and a 2-line summary snippet. Filters: status + ship.
- **Right pane:** full transcript. Header with title, id, full date, vote tally badge, ship, message count. Claim block (italic, brass border). Then the message stream — each message has a 32px avatar with agent initials in agent's role color, author name + role badge + vote badge + timestamp, and a content bubble with left-border in agent's role color.
- **Mobile (≤900px):** panes stack; back button surfaces to return to list after selecting a thread.
- **Bug fix in v8.1.2:** added `[hidden] { display: none !important; }` to override CSS `display: flex` on the empty-state and thread-detail panes — previously both rendered stacked when one should be hidden.

**Schema extended** — discussion bubble state files at `.claude/state/discussion-bubbles/<id>.md` now carry `summary` and `messages[]` in frontmatter. The messages array holds the full agent-by-agent transcript with `author`, `role_in_bubble` (open/voting/contributing/bubble-only/decision/summary), `timestamp`, `content`, and `vote` (for voting messages). Vote tally MUST match the sum of votes in messages (HALT 23.7 fires on divergence).

**Agent role colors** are CSS-bound via `data-author` selectors — engineer=brass, critic=claret, orchestrator=moss, data-integrity=teal, security=claret, design-bot=violet, devil-advocate=claret, performance-load=amber, etc. Full table in `REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.2`.

**Going forward:** further design improvements to this view are owned by the orchestration team via the proactive cycle (per Founder directive locked in `FIRST_PROACTIVE_CYCLE_KICKOFF.md`).

---

## What's in v8.1

### New operational views (HTML, no markdown pair)
- `docs/reports/discussion-bubbles.html` — discussion bubble archive (vote tallies, transcripts, decision summaries)
- `docs/reports/activity.html` — chronological handoff feed (vertical timeline, scenario-colored dots)
- `docs/reports/proposals.html` — Founder proposal review with intent-capture (approve/reject/defer toggles + export JSON)

### New script
- `.claude/scripts/apply-decisions.sh` — consumes the JSON exported by `proposals.html`, moves proposal files between pending/approved/rejected/deferred directories, appends Founder's note, updates decisions log, single commit

### Updated existing files
- `docs/reports/dashboard.html` — proposals banner (hidden when 0 pending), quick links to 3 operational views, recent-handoffs seed uses canonical scenario tokens
- `docs/reports/index.html` — operational views section + workflow guidance referencing discussion bubbles

### New governance docs
- `docs/agents/REPORT_HTML_SPEC_v8.1_AMENDMENT.md` — specs for 3 operational view types (data shape, regen triggers, scenario token canonical mapping table)
- `docs/agents/REPORT_TEMPLATES_v8.1_AMENDMENT.md` — operational views are HTML-only (source data IS the markdown in state dirs)
- `docs/agents/PROTOCOLS_v8.1_ADDENDUM.md` — P18 operational view discipline
- `docs/agents/HALT_CRITERIA_v8.1_ADDENDUM.md` — item 23 operational view source-state read failure

### Updated skills
- `.claude/skills/parbaughs-report-generate/SKILL.md` — extended to 9 output types (6 time-windowed + 3 operational views); operational view regen pattern documented (surgical data-block swap, not full template render)
- `.claude/skills/parbaughs-handoff-note/SKILL.md` — references updated to discussion-bubble storage path; trigger to regen `discussion-bubbles.html` after writing discussion-bubble handoff
- `.claude/skills/parbaughs-telemetry-emit/SKILL.md` — `view_kind` discriminator on `report.generated` events; renamed bubble references to discussion bubble

### Tests
- `tests/round-trip-test.py` — end-to-end generator simulation. Seeds synthetic state tree, runs the read→swap→verify pipeline against all 4 HTML files + wiring cross-check. **Passing.**

---

## Apply order (critical)

```bash
# 1. From repo root, apply v8.1 files (replace existing where present)
cp -r path/to/governance-additions-v8.1/docs docs
cp -r path/to/governance-additions-v8.1/.claude .claude
cp -r path/to/governance-additions-v8.1/tests tests

# 2. State-directory rename (one-time migration)
git mv .claude/state/handoffs/bubbles .claude/state/handoffs/discussion-bubbles 2>/dev/null || true
git mv .claude/state/bubbles .claude/state/discussion-bubbles 2>/dev/null || true
# Either or both may not exist yet (agents haven't run); both commands are idempotent

# 3. Make apply-decisions.sh executable
chmod +x .claude/scripts/apply-decisions.sh

# 4. Run the round-trip test (proves dashboard wiring before agents-loose)
python3 tests/round-trip-test.py

# 5. Stage + commit
git add docs .claude tests
git commit -m "Governance v8.1: operational views + discussion-bubble rename"
```

### Rollback

If something goes wrong post-apply but pre-agents-loose:

```bash
git revert HEAD                          # reverts the v8.1 commit
git mv .claude/state/handoffs/discussion-bubbles .claude/state/handoffs/bubbles 2>/dev/null || true
```

Agents are not yet loose; no telemetry or state files reference the new schema yet. Safe to revert.

---

## Rename scope: bubble → discussion bubble

166 replacements across 14 files in the bubble→discussion-bubble rename, plus 40 cleanup replacements for double-rename artifacts from prior session interleaving. Covers:

- Prose: `bubble`, `bubbles`, `Bubble`, `Bubbles` → `discussion bubble`, `discussion bubbles`, `Discussion Bubble`, `Discussion Bubbles`
- Compound paths: `handoffs/bubbles/` → `handoffs/discussion-bubbles/`
- Telemetry events: `bubble.decision` → `discussion_bubble.decision` (5 event names)
- Snake/kebab IDs: `bubble_id` → `discussion_bubble_id`, `bubble-orchestrator` → `discussion-bubble-orchestrator`
- DOM IDs: `chart-bubbles` → `chart-discussion-bubbles`
- Tags: `[BUBBLE]` → `[DISCUSSION-BUBBLE]`

**Audit clean:** zero residual `bubble` references that should be `discussion bubble`; zero double-rename artifacts (e.g., `discussion-discussion bubble`).

---

## Canonical scenario token alignment

v8.1 also corrected a wider canonical-token drift surfaced during the rename audit. Six scenario tokens in `activity.html` (CSS classes, dropdown options, seed data) did not match the canonical scenario names in `HANDOFF_PROTOCOL.md`. This would have caused empty filter results once agents started emitting telemetry per protocol.

**Fixed in v8.1 (now canonical):**

| Old (non-canonical) | New (canonical per HANDOFF_PROTOCOL.md) |
|---|---|
| `deliberation` | `discussion-bubble-to-caller` |
| `subagent-returns` | `subagent-to-parent` |
| `halts` | `halt-to-resume` |
| `founder-responses` | `founder-to-agent` |
| `wave-transitions` | `wave-to-wave` |
| `dispatches` | `parent-to-subagent` |

**Storage folder mismatch (not fixed in v8.1):** The six storage folders on disk still use the old non-canonical names (`.claude/state/handoffs/subagent-returns/`, `halts/`, `founder-responses/`, `dispatches/`, `wave-transitions/`). The generator owns the folder→scenario translation per `REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.9`. Aligning folder names to scenario tokens is tracked as a follow-up cleanup ship.

---

## Operational view design pattern

All three operational views follow the same pattern:

1. **HTML is static** (lives in repo at `docs/reports/<view>.html`)
2. **Source data is the markdown in `.claude/state/`** (not telemetry aggregates)
3. **Regen is a surgical swap** of the `<script id="report-data" type="application/json">` block only — never a full template re-render
4. **Triggers** are state-change events (discussion bubble close, ship close, new proposal), not time windows

This keeps generation cost per view low (~2k tokens), keeps the HTML structure stable across regens, and means manual edits to the HTML chrome don't get blown away by regen.

---

## Proposals approval workflow

Founder workflow when reviewing proposals:

```
1. Visit docs/reports/proposals.html in browser
2. For each proposal: click Approve / Reject / Defer + optionally add a note
3. Click "Export decisions" → downloads decisions-<timestamp>.json
4. Drop the JSON into the repo (any path; e.g., ~/Downloads/decisions-...json)
5. Run: .claude/scripts/apply-decisions.sh ~/Downloads/decisions-...json
   (or add --dry-run to preview the moves before committing)
6. Script moves files, appends decision metadata, commits with structured message
7. Push when ready
```

Browser stores intent in `localStorage["parbaughs-proposal-decisions-v1"]` so a page reload doesn't lose unexported decisions. Export clears in-progress state (proposal moves to "exported" until next regen).

---

## Test before agents-loose

The round-trip test (`tests/round-trip-test.py`) is the smoke test before turning agents loose. It proves:

- Telemetry aggregates → dashboard.html data block: works
- Handoff state files → activity.html data block + correct scenario-token translation: works
- Discussion-bubble state files → discussion-bubbles.html data block: works
- Proposal state files → proposals.html data block: works
- All 4 HTML files post-swap are still valid HTML with valid JSON in the data block
- Every scenario token in activity data has a matching CSS class + dropdown option (wiring cross-check)

If the test passes after applying v8.1, governance is wired correctly. If not, fix before enabling cron.

---

## Known follow-ups (not in v8.1)

- Storage folder names → canonical scenario tokens (`subagent-returns` → `subagent-to-parent`, etc). Generator owns translation in the meantime.
- a11y polish on operational views (deferred to v8.2 per `REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.8`).
- v2-v7 governance docs in the repo may contain stranded `bubble` references. v8.1 rename only touched v8/v8.1 corpus. If older docs surface during work, fix opportunistically; no separate cleanup ship needed.

---

## Files in this drop

```
docs/agents/
├── HALT_CRITERIA_v8.1_ADDENDUM.md          (NEW)
├── PROTOCOLS_v8.1_ADDENDUM.md              (NEW)
├── REPORT_HTML_SPEC_v8.1_AMENDMENT.md      (NEW)
├── REPORT_TEMPLATES_v8.1_AMENDMENT.md      (NEW)
├── AGENT_WORKING_MODE_v8_ADDENDUM.md       (UPDATED — bubble rename)
├── HALT_CRITERIA_v8_ADDENDUM.md            (UPDATED — bubble rename)
├── HANDOFF_NOTE_TEMPLATES.md               (UPDATED — bubble rename)
├── HANDOFF_PROTOCOL.md                     (UPDATED — bubble rename)
├── PROTOCOLS_v8_ADDENDUM.md                (UPDATED — bubble rename)
├── REPORT_HTML_SPEC.md                     (UPDATED — bubble rename)
├── REPORT_TEMPLATES.md                     (UPDATED — bubble rename)
├── SESSION_JOURNAL_v8_ADDENDUM.md          (carried from v8)
├── TELEMETRY_PROTOCOL.md                   (UPDATED — bubble rename)
└── WAVE_ZERO_DRY_RUN_v8_EXTENSION.md       (UPDATED — bubble rename)

docs/reports/
├── _assets/
│   ├── dashboard.css                       (carried from v8)
│   ├── dashboard.js                        (UPDATED — bubble rename)
│   └── template.html                       (carried from v8)
├── activity.html                           (NEW)
├── dashboard.html                          (UPDATED — operational views section + canonical tokens)
├── discussion-bubbles.html                 (NEW)
├── index.html                              (UPDATED — operational views section)
└── proposals.html                          (NEW — intent-capture)

.claude/
├── scripts/
│   └── apply-decisions.sh                  (NEW — executable)
└── skills/
    ├── parbaughs-handoff-note/SKILL.md     (UPDATED)
    ├── parbaughs-report-generate/SKILL.md  (UPDATED — extended to 9 output types)
    └── parbaughs-telemetry-emit/SKILL.md   (UPDATED)

tests/
└── round-trip-test.py                      (NEW — smoke test)

HANDOFF_README_v8.1.md                       (THIS FILE)
```

Total: 4 new docs, 8 updated docs, 3 new HTML views, 2 updated HTML files, 1 new script, 3 updated skills, 1 test harness, 1 readme.

---

## Next session

After applying v8.1 + passing the round-trip test, one final Claude.ai session is needed before agents-loose:

1. W1.S1 + W2.S0 + `CROSS_WAVE_DEPENDENCIES.md` updates for shared palette tokens (open question: is `--accent-violet` canonical PARBAUGHS palette or report-only? Are `billiard-green #0f3d2e` + `chalk` cross-wave?)
2. Memory final pass
3. Final consolidated handoff zip

Then: Wave Zero Dry-Run session (Tier 3, 12 validations) → AGENTS-LOOSE.
