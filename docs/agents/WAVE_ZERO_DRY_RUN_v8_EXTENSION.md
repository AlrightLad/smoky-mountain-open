# WAVE_ZERO_DRY_RUN_v8_EXTENSION.md

> **Status:** Governance v8 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Extension to existing `WAVE_ZERO_DRY_RUN.md`. Adds 2 new validations (11, 12) for v8 handoff + telemetry/reporting infrastructure. Total: 12 validations.

---

## Updated total validation count

| Pass | Range | Description |
|---|---|---|
| Core (v4) | 1-5 | Smoke, pre-flight, discussion bubbles, goal-verify, rate-limit pause-and-resume |
| v6 additions | 6-8 | Wellness, FIQ, deep research |
| v7 additions | 9-10 | Heartbeat cycle, proactive cycle |
| v8 additions | 11-12 | Handoff, telemetry/reporting |

**All 12 validations must PASS before orchestration team is loose with cron + full v8 governance.**

---

## 11 — Validation 11: Handoff dry-run

**What:** Validate the 11-scenario handoff protocol works end-to-end.

**Setup:** This is a multi-step validation testing all 11 scenarios.

### 11.1 Scenario 1 sub-validation (cycle-to-cycle)

**Setup:**
- Trigger ship cycle manually
- Force budget watchdog at 90% during execution (simulate)
- Watch for cycle-to-cycle handoff write

**Validation:**
- Handoff note written to `.claude/state/handoffs/cycle-to-cycle/`
- All universal fields populated
- All Scenario 1 fields populated (ship_id, ship_progress_pct, last_atomic_unit_completed, etc.)
- `[HANDOFF-WRITE]` entry in journal
- Next ship cycle dry-run: reads handoff first, verifies state, resumes correctly
- `[HANDOFF-RESUME]` entry in journal

**Pass criteria:** Clean handoff, clean resume, no state drift.

### 11.2 Scenario 2 sub-validation (agent-to-agent)

**Setup:**
- Trigger pre-flight audit
- Critic completes, transitions to Engineer

**Validation:**
- Critic writes Scenario 2 handoff with `decisions_locked` + `veto_or_concerns` populated
- Engineer logs `[HANDOFF-ACK]` before proceeding
- Engineer honors `decisions_locked`

**Pass criteria:** Handoff written, ack logged, decisions honored.

### 11.3 Scenarios 3 + 4 sub-validation (subagent dispatch + return)

**Setup:**
- Orchestrator dispatches one End User persona (e.g., Beginner) to evaluate a synthetic UI

**Validation:**
- Orchestrator writes Scenario 4 dispatch handoff with task_specification + scope_boundaries
- Subagent reads dispatch, acknowledges, executes
- Subagent writes Scenario 3 return handoff with findings + recommendations
- Orchestrator reads return, integrates findings

**Pass criteria:** Both handoffs clean, subagent stayed in scope, parent integrated findings.

### 11.4 Scenario 5 sub-validation (proactive-to-ship)

**Setup:**
- Pick approved proposal from synthetic queue (or create one for test)
- Trigger ship cycle that should pick it up

**Validation:**
- Proactive-to-ship handoff written
- Ship cycle reads handoff, treats as mini-ship
- Implementation discipline applied (P1 audit, retrospective)
- Proposal marked implemented in queue file

**Pass criteria:** Handoff complete, ship implements faithfully.

### 11.5 Scenario 6 sub-validation (halt-to-resume)

**Setup:**
- Force HALT trigger (e.g., simulate halt criterion 5 — cost threshold breach)
- Allow halt sequence to complete
- Simulate Founder resolution
- Next cycle should resume

**Validation:**
- Halt handoff written with all fields, especially preconditions_for_resume
- Resume cycle reads handoff, runs verification_steps
- Resume proceeds only after preconditions verified
- Critic spot-checks resumer's first action
- `[HANDOFF-HALT-RESUME]` entry in journal

**Pass criteria:** Halt clean, resume clean, verification successful.

### 11.6 Scenario 7 sub-validation (Founder-to-agent)

**Setup:**
- Create synthetic FIQ entry
- Simulate Founder response in `.claude/state/founder_input_queue.json`
- Next cycle should pick up resolution

**Validation:**
- Founder-to-agent handoff written
- Receiving agent applies founder_decision exactly
- Provisional defaults updated to match
- Downstream agents notified via Scenario 2 handoffs

**Pass criteria:** Decision propagated correctly, no agent freelancing.

### 11.7 Scenario 8 sub-validation (discussion-bubble-to-caller)

**Setup:**
- Trigger a synthetic discussion bubble (use Validation 3 from core dry-run if not yet run)

**Validation:**
- Discussion Bubble handoff written with all voting records
- Plain English summary present and Founder-readable
- Calling agent applies decision_outcome
- Tie-break (if used) documented with rationale
- Minority concerns acknowledged

**Pass criteria:** Discussion Bubble closes cleanly, decision propagates, summary clean.

### 11.8 Scenario 9 sub-validation (cross-ship)

**Setup:**
- Use ANY two synthetic ships with related context
- Mark first as complete
- Start second; cross-ship handoff should be authored at second's pre-flight

**Validation:**
- Cross-ship handoff written
- Receiving ship reads carries_decisions
- Receiving ship addresses carries_open_questions in scope
- Receiving ship applies extra Critic scrutiny to known_brittleness areas

**Pass criteria:** Context carries forward; receiving ship operates with awareness.

### 11.9 Scenario 10 sub-validation (wave-to-wave)

**Setup:**
- Simulate Wave 1 close (or use a synthetic mini-wave for testing)
- Wave 2 start triggered

**Validation:**
- Wave-to-wave handoff written with full closing wave summary
- All key_decisions_locked_this_wave captured
- Design system state at close documented
- Opening Wave prerequisites listed
- Receiving Wave verifies prerequisites before starting

**Pass criteria:** Clean wave transition with full context transfer.

### 11.10 Scenario 11 sub-validation (multi-agent parallel merge)

**Setup:**
- Simulate proactive cycle generating proposals from multiple lane agents in parallel
- Orchestrator merges into proposal queue

**Validation:**
- Per-actor outputs captured
- Conflict detection runs
- Merger applies resolution_strategy
- Merged output (proposal queue) is coherent
- Residual concerns documented

**Pass criteria:** Merge complete, no lost proposals, no double-counted proposals.

### 11.11 Handoff verification failure sub-validation

**Setup:**
- Manually corrupt a handoff note (e.g., remove required field)
- OR alter code state to drift from handoff's files_modified list

**Validation:**
- Receiving actor detects corruption/drift
- HALT item 21 triggered (subtype 21b or 21d)
- FIQ entry created if applicable (21c)
- Halt logged with subtype

**Pass criteria:** Detection works, halt triggers, recovery path clear.

### 11.12 Overall Validation 11 pass criteria

ALL 11 sub-validations must pass. Single sub-validation failure → debug + retry only that sub-validation.

---

## 12 — Validation 12: Telemetry + report generation dry-run

**What:** Validate telemetry capture + aggregation + report generation works end-to-end.

### 12.1 Inline emission sub-validation

**Setup:**
- Trigger heartbeat cycle manually
- Watch telemetry event stream

**Validation:**
- Events written to `.claude/state/telemetry/events/<date>.ndjson`
- Each event is valid JSON
- All required universal fields present
- Event types match TELEMETRY_PROTOCOL.md catalog
- No content/code/PII in events

**Pass criteria:** Clean event stream, all events well-formed.

### 12.2 Aggregation sub-validation

**Setup:**
- After multiple cycles, trigger aggregation
- (Or use synthetic event stream to test aggregation alone)

**Validation:**
- `cycles.json` updated with new cycle entries
- `agents.json` updated with new agent rollups
- `current-snapshot.json` regenerated
- Aggregates internally consistent (sum of role tokens = total tokens, etc.)
- Aggregation idempotent (running twice on same events yields same output)

**Pass criteria:** Aggregates accurate + consistent + idempotent.

### 12.3 Markdown report generation sub-validation

**Setup:**
- After aggregation, trigger report generation
- Test each report type: dashboard, daily, weekly, ship, wave

**Validation:**
- Each report type generates correctly
- Template variables substituted properly
- No `{placeholder}` strings remaining unsubstituted
- Markdown is valid (renders in GitHub preview)
- All data tables populated correctly
- Cross-references resolve

**Pass criteria:** All 5 report types render correctly in markdown.

### 12.4 HTML report generation sub-validation

**Setup:**
- After markdown generation, trigger HTML generation

**Validation:**
- HTML files written to `docs/reports/{type}/{name}.html`
- Open in browser locally — page loads
- Open in browser locally — charts render via Chart.js
- Embedded data is valid JSON (no syntax errors in `<script id="report-data">`)
- All sections present per template
- Interactive features work (sortable tables, expandable sections, etc.)
- Page renders correctly on mobile viewport (375px)
- Accessibility: semantic HTML, ARIA labels, keyboard navigation
- `docs/reports/index.html` updated with new report links

**Pass criteria:** All HTML reports load + render cleanly. Charts display.

### 12.5 Failure mode sub-validation

**Setup:**
- Simulate telemetry emission failure (e.g., disk full)
- Simulate corrupted event file
- Simulate aggregate divergence

**Validation:**
- 5+ emission failures triggers HALT item 22a
- Corrupted NDJSON triggers HALT item 22b on aggregation
- Aggregate divergence triggers HALT item 22c
- Recovery paths work (regenerate from raw events, archive corrupted file, etc.)

**Pass criteria:** Failure detection works, recovery paths functional.

### 12.6 Overall Validation 12 pass criteria

ALL 5 sub-validations must pass.

---

## 13 — Dry-run summary report update

After all 12 validations pass, generate updated summary:

```markdown
# Wave Zero Dry-Run Report — <date>

## Validation outcomes

| # | Validation | Outcome | Notes |
|---|-----------|---------|-------|
| 1 | Cross-browser smoke (48 scenarios) | PASS | All scenarios pass |
| 2 | Pre-flight audit dry-run | PASS | Critic detected planted issue |
| 3 | Discussion bubble dry-run | PASS | All voters contributed, summary clean |
| 4 | Goal-completion-verify dry-run | PASS | Caught missing sub-goal |
| 5 | Rate-limit pause-and-resume dry-run | PASS | Atomic op completed, state file written, next cron auto-resumed, state file deleted |
| 6 | Wellness checkpoint dry-run | PASS | Substantive output |
| 7 | FIQ entry creation dry-run | PASS | Template complete |
| 8 | Deep research artifact dry-run | PASS | Independent sources, matrix complete |
| 9 | Heartbeat cycle dry-run | PASS | All 6 activities clean |
| 10 | Proactive cycle dry-run | PASS | Queue well-formed |
| 11 | Handoff dry-run (11 sub-validations) | PASS | All scenarios work |
| 12 | Telemetry + report generation dry-run (5 sub-validations) | PASS | Events, aggregates, MD+HTML clean |

## Disposition

ALL VALIDATIONS PASSED. Orchestration team approved for autonomous operation with cron + handoff + telemetry enabled.

Cron cycles will begin on next scheduled fire after this report is committed.

## Founder ratification

- Date: <YYYY-MM-DD>
- Signed: Founder
```

---

## 14 — What happens after pass

1. Dry-run report committed
2. Cron-paused.json removed
3. First scheduled cycle fires
4. Telemetry stream begins
5. First report generated at first heartbeat
6. Founder shifts to retrospective-reviewer posture with reports as guide

---

## Cross-references

- `WAVE_ZERO_DRY_RUN.md` (v4 original)
- `WAVE_ZERO_DRY_RUN_v7_EXTENSION.md` (v7 extension this builds on)
- `HANDOFF_PROTOCOL.md` (validation 11 source)
- `TELEMETRY_PROTOCOL.md` (validation 12 source)
- `REPORT_TEMPLATES.md` + `REPORT_HTML_SPEC.md` (validation 12 source)

---

*Document authored 2026-05-12. Apply at consolidation as extension to existing WAVE_ZERO_DRY_RUN.md (with v7 extension already applied).*
