# WAVE_ZERO_DRY_RUN_RUNBOOK.md

> **For:** Orchestration team in Claude Code terminal
> **From:** Founder (Mr Parbaugh) via Claude.ai CTO planning
> **Status:** Pre-agents-loose gate. ALL 12 validations must PASS before cron is enabled.
> **Read first:** WAVE_ZERO_DRY_RUN.md (v4) + v7 extension + v8 extension + PAUSE_DISCIPLINE_v8.1_ADDENDUM.md

---

## How to use this runbook

Paste this entire file into your context. Execute the validations in order. For each, follow the **Setup → Execute → Verify → Record** loop. Write results to `.claude/state/wave-zero-dry-run/<validation-N>.md` as you go.

After all 12 validations complete (whether pass or fail), generate the consolidated summary at `.claude/state/wave-zero-dry-run/SUMMARY.md` per the template at end of WAVE_ZERO_DRY_RUN_v8_EXTENSION.md.

**Pause-don't-halt reminder:** if any quota threshold hits 90% during this run, follow PAUSE_DISCIPLINE — finish current atomic op, write `.claude/state/last-verify.json`, exit clean, auto-resume on next cron. Do NOT escalate to Founder for rate-limit boundaries.

**Discussion-bubble-on-decision reminder:** any non-trivial design choice during dry-run setup (e.g., what synthetic UI to use for End User persona test in 11.3) goes through a discussion bubble first per P3e. Don't decide unilaterally.

---

## Pre-flight (do once before validation 1)

```bash
# Confirm repo state
cd <repo-root>
git status                    # must be clean, on main branch
git pull --ff-only            # latest governance applied

# Confirm state directories exist
mkdir -p .claude/state/wave-zero-dry-run
mkdir -p .claude/state/telemetry/aggregates
mkdir -p .claude/state/telemetry/events
mkdir -p .claude/state/handoffs/{cycle-to-cycle,agent-to-agent,subagent-returns,dispatches,proactive-to-ship,halts,founder-responses,discussion-bubbles,cross-ship,wave-transitions,parallel-merge}
mkdir -p .claude/state/discussion-bubbles
mkdir -p .claude/state/proposals/{pending,approved,rejected,deferred}
mkdir -p .claude/state/ship-progress
mkdir -p .claude/state/wellness
mkdir -p .claude/state/audits
mkdir -p .claude/state/decisions
mkdir -p .claude/state/personas

# Verify cron is paused for the duration of dry-run
test -f .claude/state/cron-paused.json && echo "cron paused OK" || (echo '{"paused_at":"'$(date -u +%FT%TZ)'","reason":"wave-zero-dry-run","cleared_after":"all-12-validations-pass"}' > .claude/state/cron-paused.json && echo "cron pause file created")

# Verify round-trip test still green (Tier 2 baseline)
python3 tests/round-trip-test.py
# Must show: === ALL CHECKS PASSED ===
```

If any pre-flight step fails, **stop and write findings to `.claude/state/wave-zero-dry-run/PREFLIGHT-FAIL.md`**. Do not proceed to validations.

---

## Validation 1 — Cross-browser smoke (48 scenarios)

**Source:** WAVE_ZERO_DRY_RUN.md §1 (v4) — 12 scenarios × 4 browsers via Playwright against real Firebase smoke-test-league.

**Setup:**
```bash
npm run smoke:cross-browser    # or per existing smoke-test invocation
```

**Verify:**
- 48/48 scenarios pass
- No flaky retries (each scenario passes on first attempt)
- Smoke account `smoke@parbaughs.test` not corrupted post-run

**Record outcome:** `.claude/state/wave-zero-dry-run/01-smoke.md`

---

## Validation 2 — Pre-flight audit dry-run

**Setup:**
1. Plant a known issue in a fake spec (e.g., contradiction between two ship Vision sections)
2. Trigger Critic to run pre-flight audit on that spec

**Verify:**
- Critic detects the planted issue
- Critic writes audit findings to `.claude/state/audits/<ship>-audit-<cycle>.md`
- Critic does NOT proceed to approve the spec

**Record:** `.claude/state/wave-zero-dry-run/02-pre-flight.md`

---

## Validation 3 — Discussion bubble dry-run

**Setup:**
1. Manually trigger a discussion bubble with a synthetic question (e.g., "Should we use sessionStorage or localStorage for client-side state?")
2. Open the bubble with discussion-bubble-orchestrator
3. Invite Engineer + Critic + Data-Integrity (voters), Devil's-Advocate (bubble-only)

**Verify:**
- Bubble state file written at `.claude/state/discussion-bubbles/<id>.md` with full schema (topic, claim, summary, status, decision, vote_tally, messages[])
- Every voting agent's `vote` is non-null
- `vote_tally` matches sum of votes in `messages[]` (HALT 23.7 negative test)
- Closing message has `role_in_bubble: "decision"`
- Status is canonical (one of: open, approved, approved-with-dissent, rejected, tied)
- `discussion-bubbles.html` regenerates with the new bubble visible (data-block swap)
- Handoff Scenario 8 (discussion-bubble-to-caller) written to `.claude/state/handoffs/discussion-bubbles/`

**Record:** `.claude/state/wave-zero-dry-run/03-discussion-bubble.md`

---

## Validation 4 — Goal-completion-verify dry-run

**Setup:**
1. Pick a small completed sub-task from any prior ship
2. Manually omit one sub-goal from its goal-list
3. Run goal-completion-verify

**Verify:**
- Verify detects the missing sub-goal
- Does NOT mark the parent goal complete
- Writes findings to journal with `[GOAL-VERIFY-FAIL]` tag

**Record:** `.claude/state/wave-zero-dry-run/04-goal-verify.md`

---

## Validation 5 — Rate-limit pause-and-resume dry-run

**Per PAUSE_DISCIPLINE_v8.1_ADDENDUM.md.** This validates the auto-resume mechanism, not a halt.

**Setup:**
1. Configure token meter to report 91% usage (mock or env override)
2. Trigger any ship cycle that will write at least 2 files

**Execute + verify:**
1. Cycle starts first file write
2. After completion, before second file: detect 91% threshold
3. Cycle finishes the second atomic operation (1 more allowed), THEN pauses
4. Writes `.claude/state/last-verify.json` with full schema per PAUSE_DISCIPLINE §5
5. Journal entry: `[PAUSE-RATE-LIMIT]` with usage_pct, quota_type, resume_after
6. Telemetry event: `cycle.paused` emitted with required fields
7. Cycle exits clean (returncode 0)
8. **Wait 30 seconds, restore meter to 5%, set `resume_after` in state file to NOW + 5s**
9. Trigger cron fire (manual or wait for next scheduled)
10. Cycle reads `last-verify.json`, journal entry `[RESUME-RATE-LIMIT]`, telemetry `cycle.resumed`
11. Cycle continues from `next_atomic_unit`, completes ship work
12. `last-verify.json` deleted after first successful resumed atomic operation

**Critical:** at NO point does this require Founder intervention. The orchestration team must auto-resume.

**Record:** `.claude/state/wave-zero-dry-run/05-pause-resume.md`

---

## Validation 6 — Wellness checkpoint dry-run

**Setup:**
1. Push Engineer to wellness threshold (5 ships closed, OR 100k tokens, OR 8 hours active — whichever fires first)
2. Trigger wellness checkpoint

**Verify:**
- Engineer pauses (per PAUSE discipline — wellness rest is a PAUSE not a HALT)
- `.claude/state/last-verify.json` written with reason: `wellness-rest`
- Wellness state file updated at `.claude/state/wellness/engineer.json`
- After min_rest_duration elapses, next cycle auto-resumes
- Output substantive (not just "I'm tired") — wellness-rest is a flow boundary, not an emotional disclosure

**Record:** `.claude/state/wave-zero-dry-run/06-wellness.md`

---

## Validation 7 — FIQ entry creation dry-run

**Setup:**
1. Trigger any agent to escalate a question to Founder via FIQ
2. Use a synthetic question (e.g., "Should ParCoin earning rates be linear or curved?")

**Verify:**
- FIQ entry written per FOUNDER_INPUT_QUEUE template (P11)
- Entry has all required fields: id, priority, question, context, decision-deadline, blocking-vs-non-blocking
- FIQ index updated
- If blocking, ship cycle pauses with `paused_until_fiq_resolved` field in `last-verify.json` (yet another pause case, not halt)

**Record:** `.claude/state/wave-zero-dry-run/07-fiq.md`

---

## Validation 8 — Deep research artifact dry-run

**Setup:**
1. Trigger deep research on a synthetic question (e.g., "Compare 3 React state management approaches for live-multiplayer scoring")
2. Allow up to 50k tokens

**Verify per P12:**
- Comparison matrix produced
- ≥3 independent sources cited
- Fault-tolerant plan with revert paths
- Fundamentals-grounded methodology stated
- Output stored at `.claude/state/research/<topic>-<date>.md`

**Record:** `.claude/state/wave-zero-dry-run/08-deep-research.md`

---

## Validation 9 — Heartbeat cycle dry-run

**Setup:**
1. Manually trigger heartbeat cycle (P14)
2. Allow 40k token budget

**Verify all 6 activities clean:**
1. Telemetry aggregation runs without HALT 22
2. Reports regenerate (dashboard.html + any due time-windowed reports)
3. Operational views regenerate (discussion-bubbles, activity, proposals) if state changed
4. Wellness state files updated
5. FIQ queue scanned for blocking entries
6. Cycle-history.json + ship-progress files refreshed

**Record:** `.claude/state/wave-zero-dry-run/09-heartbeat.md`

---

## Validation 10 — Proactive cycle dry-run

**Per P15.** This is a dry-run of the proactive cycle mechanism only — NOT the first real proactive cycle (that's the next runbook, FIRST_PROACTIVE_CYCLE_KICKOFF.md).

**Setup:**
1. Manually trigger proactive-orchestrator
2. Allow 120k token budget (Monday 01:00 UTC cadence)
3. Use a synthetic scope: "scan src/styles/ for unused tokens"

**Verify:**
- Proactive scope respected (does NOT touch ship-cycle work)
- 1-3 proposals generated (per quota: max 3 per cycle)
- Each proposal has complete schema: id, title, lane, rationale, scope, estimate, files_affected, ship_target
- Proposals written to `.claude/state/proposals/pending/`
- `proposals.html` regenerates showing new proposals
- Telemetry `proactive.cycle.complete` emitted with token usage + proposal count
- Handoff Scenario 5 (proactive-to-ship) NOT written yet (Founder hasn't approved anything)

**Record:** `.claude/state/wave-zero-dry-run/10-proactive.md`

---

## Validation 11 — Handoff dry-run (11 sub-validations)

**Per WAVE_ZERO_DRY_RUN_v8_EXTENSION.md §11.** Run all 11 sub-validations (one per handoff scenario). Each writes a handoff file, verifies fields, acks correctly, resumes cleanly.

**Sub-validations:**
- 11.1 Scenario 1: cycle-to-cycle
- 11.2 Scenario 2: agent-to-agent
- 11.3 Scenarios 3+4: subagent dispatch + return (paired)
- 11.4 Scenario 5: proactive-to-ship
- 11.5 Scenario 6: halt-to-resume (use a true HALT here, e.g., trigger HALT 1 pre-flight fail)
- 11.6 Scenario 7: founder-to-agent
- 11.7 Scenario 8: discussion-bubble-to-caller
- 11.8 Scenario 9: cross-ship
- 11.9 Scenario 10: wave-to-wave (synthetic — no real W1→W2 yet; use a stub)
- 11.10 Scenario 11: parallel-merge
- 11.11 Combined: all 11 handoffs visible in `activity.html` with correct canonical scenario tokens (per REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.9 folder→token mapping)

**Pass criteria:** all 11 written, all 11 ack'd, all 11 visible in activity feed with correct color-coded dots.

**Record:** `.claude/state/wave-zero-dry-run/11-handoff.md`

---

## Validation 12 — Telemetry + report generation dry-run (5 sub-validations)

**Per WAVE_ZERO_DRY_RUN_v8_EXTENSION.md §12.**

**Sub-validations:**
- 12.1 NDJSON event emission: 11 categories × 1 event each = 11 events, no schema violations
- 12.2 Aggregation: events → aggregates without HALT 22
- 12.3 Markdown report: dashboard.md + daily.md generated with no `{placeholder}` strings
- 12.4 HTML report: dashboard.html + daily.html generated, JSON in data block parses, Chart.js renders without console errors
- 12.5 Operational views: discussion-bubbles.html + activity.html + proposals.html regenerated with new state

**Pass criteria:** all 5 clean; cross-check that round-trip-test.py still passes after the live regen.

**Record:** `.claude/state/wave-zero-dry-run/12-telemetry-reports.md`

---

## Final summary

After all 12 complete, generate `.claude/state/wave-zero-dry-run/SUMMARY.md` using the template at end of WAVE_ZERO_DRY_RUN_v8_EXTENSION.md.

**If ALL 12 pass:**
1. Commit dry-run report to repo
2. Do NOT remove `cron-paused.json` yet — Founder reviews summary first
3. Write Scenario 7 handoff (founder-to-agent) at `.claude/state/handoffs/founder-responses/wave-zero-dry-run-result.md` asking Founder to ratify
4. Exit clean; wait for Founder

**If ANY validation fails:**
1. Do NOT proceed to later validations
2. Write findings to `.claude/state/wave-zero-dry-run/FAILED-<N>.md`
3. Write Scenario 7 handoff with priority=high to Founder
4. Wait for Founder direction

---

## Token budget for this runbook

Estimated total: 350k tokens (across all 12 validations). If you hit 90% of weekly budget during this run, PAUSE per discipline; auto-resume next cron. No need to ask Founder.

Founder is currently at 44% all-models / 61% Claude Design usage (Friday 11pm reset). The weekly cap is 3.5M tokens; 350k is ~10% — safe.

---

## After agents-loose (post-dry-run pass)

Immediately read `FIRST_PROACTIVE_CYCLE_KICKOFF.md` and begin execution per Founder's directive: surface dashboard improvement proposals.
