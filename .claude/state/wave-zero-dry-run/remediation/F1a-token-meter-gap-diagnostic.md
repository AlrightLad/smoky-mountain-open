# F1(a) — Token Meter Gap Diagnostic

**Author:** wave-zero-dry-run-orchestrator (Claude Code agent)
**Timestamp:** 2026-05-13T13:00:00Z (resume window after V7 stall)
**Trigger:** Founder remediation directive Finding 1 sub-cause (a) — "No working token meter."
**Disposition:** **CONFIRMED. Gap is real and observed in-session.** This document is the evidence used by db-2026-05-13-003 and by the HALT 25 proposed-criterion.

---

## What was supposed to exist (per PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 2.1)

A telemetry mechanism emits `cycle.budget.checkpoint` events at 25 / 50 / 75 / 90% of the active quota (weekly-tokens, daily-tokens, hourly-requests). At 90%, the agent finishes its current atomic operation, writes `last-verify.json` with `reason: rate-limit-90pct`, and exits clean. Cron re-fires after `resume_after`; resume reads the state file and continues.

## What actually exists (verified from inside Claude Code right now)

I have searched the available tool surface for any way to read my own token consumption or the org-account state:

1. **No `/cost` tool.** `/cost` is a Claude Code slash command for the human operator; it does not exist as a callable tool for me. I cannot invoke it.
2. **No status-bar reader.** The status line shown to the user is rendered by Claude Code's UI; I cannot programmatically read it.
3. **No `anthropic` API for self-introspection.** The Anthropic Messages API does not expose "my own current usage." Even if I could call out to it from Bash, the org-monthly usage cap is enforced at a layer above the API, not in the response.
4. **No process I can fork that reports usage.** `claude --version`, `claude config`, `claude doctor` — none surface a usage figure I can read.
5. **The Bash `Monitor` tool's stdout stream is limited to my script's output.** I have no script that can determine my consumption.

The token meter that PAUSE_DISCIPLINE assumes is **not wired**. The 90% checkpoint cannot fire because nothing reads the meter. This is not a bug in PAUSE_DISCIPLINE — the discipline is correct given a meter. It is a wiring gap.

## What actually happened in the prior session

The prior session ran V1-V6 cleanly. It then started V7 (FIQ entry creation), and during V7 the **org-level monthly cap** was reached. There was no `cycle.budget.checkpoint` at 90% because no meter was reading; the session crossed 100% silently and the request layer started returning quota errors. The session stalled mid-atomic-operation.

This is a triple failure:
1. **No meter.** Couldn't see 90% coming.
2. **Wrong quota.** Even if a meter existed for weekly-tokens, the org-monthly cap is a different axis.
3. **Hard stop, not pause.** No `last-verify.json` was written before stall. Resume in this session had to be driven from Founder's directive instead of from auto-resume state.

The dry-run's V5 (rate-limit pause-and-resume) passed because it was simulated against a *synthetic* meter — values were hard-coded in the validation. The real-world test failed because the synthetic-meter assumption doesn't hold in production.

## Defensive heuristic active (Finding 1(d) until db-003 ratifies a different one)

Until a real meter wires up, I'm operating under:

- **Every ~5 atomic operations**, pause to consider whether to write `last-verify.json` and exit clean. The actual choice is judgment, not threshold-driven — but every 5 ops is the rhythm of the check.
- **Every ~10 minutes wall-clock**, same.
- **At any sign of approaching limits** (slower response, timeout retries, anthropic 429s in any tool result) — pause immediately, write state, exit.
- **Over-pause beats under-pause.** A spurious pause costs one cron cycle. A missed pause costs an entire session.

Better-than-defensive heuristic for the remediation pass itself: I am running the full 5-finding remediation in **one session**, sequenced explicitly by Founder. Mid-session pause would split the remediation across sessions, which is acceptable but less Founder-readable. If I sense approach to limits, I will pause and resume with the remaining findings prioritized.

## Implications for V7-V12 resume

V7-V12 are paused per Founder directive until quota refreshes. During the remediation pass that fills the wait, I will:
- Not start any new ndjson event emission for V7-V12.
- Not write any new FIQ entries until F3 (rubric) is authored — premature FIQ writing without the rubric would generate ungraded entries that F3 then has to retroactively grade.
- Not invoke any tool that I expect to consume large quantities of tokens (e.g., I will favor `Read` and `Edit` over `Agent` subagent dispatches for this remediation; subagents bear their own context and amplify cost).

## What feeds into db-2026-05-13-003

This document. The bubble's four decision points (per Founder directive) are:

1. **How does the orchestration team observe its own token consumption mid-session?** Diagnosis here: it does not, with current tools. Either a wrapper around Claude Code's CLI that reads `/cost`-equivalent output and re-injects as a fake tool result, or a side-channel file the human writes that the agent reads each turn, or treat the absence as a permanent design constraint and over-engineer the defensive heuristic.
2. **Add `org-monthly` as a 4th `quota_type` to `last-verify.json` schema.** Concretely: extend `PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 5` schema with `"quota_type": "weekly-tokens" | "daily-tokens" | "hourly-requests" | "org-monthly" | null`. The `resume_after` for org-monthly resets at the org billing-cycle boundary (typically calendar month UTC).
3. **HALT 25 — "Pause meter unavailable."** Draft in `proposed-halt-25.md`. Fires when agent cannot confirm own usage before crossing a discipline boundary. Resolution: agent pauses at the last known good checkpoint and exits clean. Better over-pause than under-pause.
4. **Concrete defensive heuristic.** Bubble decides N (atomic ops) and M (minutes). My posture above (N=5, M=10) is a starting bid; bubble may tune.

## References

- PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 2.1, § 5
- HALT_CRITERIA_v8.1_ADDENDUM.md item 24 (auto-resume failure — close cousin to HALT 25)
- Prior V5 record (simulated successfully, didn't catch the wiring gap): `.claude/state/wave-zero-dry-run/05-pause-resume.md`
- Bubble that consumes this diagnostic: `.claude/state/discussion-bubbles/db-2026-05-13-003.md`
