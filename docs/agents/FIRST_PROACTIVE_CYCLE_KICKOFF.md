# FIRST_PROACTIVE_CYCLE_KICKOFF.md

> **For:** Orchestration team (proactive-orchestrator + voting agents)
> **From:** Founder (Mr Parbaugh) via Claude.ai CTO planning
> **Status:** Executable immediately after Wave Zero Dry-Run passes + Founder ratifies + cron-paused.json removed
> **Cadence:** This is the first real proactive cycle. Subsequent cycles fire Monday 01:00 UTC per P15.

---

## Founder directive (verbatim, locked)

> "Have the orchestration team provide the discussion bubble update as they can and should be making those dashboards cleaner and more effective for viewing. I am just providing the governance and vision for them to work."

Translation: **dashboard design + improvement is the orchestration team's responsibility going forward.** Claude.ai's role is governance, spec, and vision — not dashboard implementation. The Founder reviews proposals via `proposals.html` and approves/rejects through the intent-capture workflow.

---

## Mission for cycle 1

**Scope:** Review the three operational views — `discussion-bubbles.html`, `activity.html`, `proposals.html` — for readability, effectiveness, and any UX issues. Surface 1-3 proposals that would make them measurably cleaner or more effective for Founder review.

**Out of scope (defer or reject if surfaced):**
- The four time-windowed reports (dashboard / daily / weekly / ship / wave / quarterly) — they're under separate governance; touching them this cycle is scope creep
- The page-shell, header nav, or footer chrome — chrome stays stable across the operational view set
- Anything that requires backend, auth, or DB — the static-architecture invariant is locked
- Cosmetic-only color or font tweaks — go after structural / informational clarity issues
- Anything that breaks the data-block-swap regen pattern (P18 operational view discipline)

**Token budget:** 120k (per P15 proactive cycle cap).

**Time budget:** 90 minutes of compute (per P15).

---

## Inputs to read first (in this order)

1. `docs/agents/REPORT_HTML_SPEC_v8.1_AMENDMENT.md` §amendment.2, .3, .4 — the data shape + UI element contract for each view
2. `docs/reports/discussion-bubbles.html` — the live file in repo
3. `docs/reports/activity.html` — same
4. `docs/reports/proposals.html` — same
5. `docs/agents/PROTOCOLS_v8.1_ADDENDUM.md` P18 — operational view discipline (regen pattern, Founder-modifiable zones)
6. `tests/round-trip-test.py` — the smoke test you must NOT break

After reading, run a manual visual review by opening each HTML in a browser (or via headless screenshot if available). Look at:
- Information density: too much? not enough? wrong info above the fold?
- Findability: can Founder locate a specific discussion bubble / handoff / proposal quickly?
- Scannability: do colors / spacing / typography support fast pattern-match across many entries?
- Empty states: do they actually convey state or look like bugs?
- Mobile responsive behavior (<900px viewport)
- Filter interactions: do they do what Founder expects?
- Cross-pane consistency: do the three views feel like one product?

---

## Proposal protocol

For each improvement you want to propose:

1. Open a discussion bubble per P3e (Engineer + Critic + Data-Integrity voters; Design-Bot contributes; Devil's-Advocate bubble-only).
2. The bubble decides: **is this a real improvement, or scope creep / personal preference?**
3. If approved, the proposal lands in `.claude/state/proposals/pending/PROP-NNN-<slug>.md` per P15 proposal schema.
4. Each proposal MUST include:
   - `id` (PROP-NNN, next available — check `proposals/{pending,approved,rejected,deferred}/` for max)
   - `title` (concise, scannable in proposals.html list)
   - `lane` (Lane 1: UX/Polish, Lane 2: Information Architecture, Lane 3: Performance, Lane 4: Code Quality — pick the closest)
   - `rationale` (the problem this solves, observable evidence)
   - `scope` (specific files + sections; bounded; revertable)
   - `estimate_tokens` (your honest read; <50k preferred)
   - `files_affected` (full paths)
   - `ship_target` (next available Wave 1 patch slot, likely W1.S1.1 or similar — check ROADMAP.md)

5. Max 3 proposals total this cycle. If you find more issues, write them up briefly in `.claude/state/proactive-backlog.md` for future cycles. Don't dilute Founder's review queue.

---

## Quality bar for proposals (Founder will reject otherwise)

A good proposal:
- **States the problem in terms of Founder's review experience**, not internal architecture (e.g., "Day-divider gets lost when scrolling past 20 threads — Founder loses temporal context" not "sticky positioning has z-index conflict with header")
- **Identifies the specific cost-of-not-fixing** (e.g., "Founder must scroll past 40 closed bubbles to find the 2 open ones, every review session")
- **Proposes ONE specific fix** with clear before/after
- **Is small enough to revert** if Founder hates the result (< 200 LOC changed, single ship slot)
- **Has been stress-tested by Devil's-Advocate** during the bubble (what could go wrong, what edge cases break the proposed fix)
- **Has been audited by Critic** for spec drift (does the proposal match REPORT_HTML_SPEC_v8.1_AMENDMENT.md? if not, is the spec wrong or the proposal wrong?)

A bad proposal (auto-reject):
- "Refactor X for cleaner code" without observable Founder-facing benefit
- "Add feature Y" if Founder didn't ask for it and there's no clear evidence Founder needs it
- "Change the color of Z" without information-architecture justification
- Anything that touches scope outside the three operational views

---

## Discipline reminders

**Pause-don't-halt.** If you hit 90% of weekly token budget during this cycle, follow PAUSE_DISCIPLINE_v8.1_ADDENDUM.md. Finish current atomic op, write `.claude/state/last-verify.json`, exit. Next cron after reset reads state + resumes. Do NOT escalate to Founder for rate-limit boundaries.

**Audit-first.** Before proposing a fix, audit the current implementation. Does the perceived problem actually exist in the code? Memory cited a problem at line 642 of components.css; verify it's still there at line 642 — code drifts. Hypothesis vs. confirmed must stay distinguished.

**Diagnostic before defense.** If a voting agent challenges a proposal, default to gathering more data ("let me re-read the file") not defending the original position ("but I already considered that"). Three distinct root causes have been found through diagnosis in prior cycles (v8.11.5-9 reference).

**Single-author invariant.** Two agents must not write the same proposal file. Coordinate via the discussion bubble; one agent owns the write, others contribute via the bubble messages.

**No design unilateralism.** Design questions go through Design-Bot consultation within the bubble. Engineer does not pick UX patterns alone.

---

## Telemetry expected this cycle

- `proactive.cycle.start` (1 event)
- `discussion_bubble.opened` (1-3 events, one per proposal candidate)
- `discussion_bubble.message` (10-30 events across all bubbles)
- `discussion_bubble.decision` (1-3 events, one closing per bubble)
- `proposal.written` (1-3 events for accepted proposals)
- `proposal.rejected_in_bubble` (0-N events for ideas that didn't survive the bubble)
- `operational_view.regenerated` (1-2 events for discussion-bubbles.html and proposals.html refreshes)
- `proactive.cycle.complete` (1 event with token usage + proposal count + bubble count)

---

## Output deliverables

By cycle end (within token + time budget):

1. **0-3 proposal files** at `.claude/state/proposals/pending/PROP-NNN-*.md`
2. **1-3 discussion bubble files** at `.claude/state/discussion-bubbles/db-2026-MM-DD-NNN.md` (with full transcripts per the v8.1.1 schema)
3. **Regenerated `discussion-bubbles.html`** (data block swap) reflecting the new bubbles
4. **Regenerated `proposals.html`** (data block swap) reflecting the new proposals
5. **`.claude/state/proactive-backlog.md`** entry IF additional issues were surfaced but not promoted to proposals this cycle
6. **Scenario 5 handoff** (proactive-to-ship) at `.claude/state/handoffs/proactive-to-ship/` IF any proposals are tagged urgent
7. **Cycle summary** at `.claude/state/proactive/<cycle-id>-summary.md` per P15 template
8. **Founder handoff** (Scenario 7, founder-to-agent direction not required for proactive cycles — proposals.html IS the review surface; just ensure proposals.html is updated and surfaces them visibly via the pending-banner on dashboard.html)

---

## Success criteria

Cycle 1 is successful if:
- ≥1 proposal lands in pending/ AND survives Founder review (gets approved)
- All proposals have full schema
- All bubbles have full transcript with consistent vote tallies (HALT 23.7 negative)
- All operational views regenerate cleanly (no HALT 23)
- Token budget respected
- Pause discipline honored if rate-limit boundary hit
- Founder's "make dashboards cleaner" intent visibly progressed (Founder is the judge)

Cycle 1 is a failure if:
- Zero proposals reach Founder (the team didn't surface anything actionable)
- Proposals are auto-rejected for scope creep / out-of-bounds
- Operational views break (regen produces invalid HTML or JSON)
- Founder has to manually fix the dashboards because the team didn't

---

## After cycle 1

Founder reviews proposals.html, exports decisions JSON, runs `apply-decisions.sh`. Approved proposals get implemented in a subsequent ship cycle (next ship-cycle window assigned by ship-orchestrator per W1 ROADMAP).

The team does NOT implement the approved proposals during this same proactive cycle — proactive cycles SURFACE work; ship cycles EXECUTE work. Crossing that line is a P15.4 scope violation.

After Founder ratifies cycle 1, the cron schedule takes over: next proactive cycle fires Monday 01:00 UTC.

---

## What this is NOT

- NOT a free pass to redesign the dashboards. Three operational views, surgical improvements, Founder review.
- NOT permission to invent new operational views. Adding a "fourth view" is a Vision-level decision, not a proactive cycle scope.
- NOT a place to fix bugs you find in unrelated files. Note them in proactive-backlog.md.
- NOT a one-time exercise. Cycle 1 sets the cadence; this work repeats weekly forever.
