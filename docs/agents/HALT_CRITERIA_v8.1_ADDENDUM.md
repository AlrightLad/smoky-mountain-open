# HALT_CRITERIA — v8.1 addendum

Adds item 23 to the halt criteria stack.

Status: **RATIFIED** governance v8.1
Cross-refs: HALT_CRITERIA.md (items 1-13, v1-v4), HALT_CRITERIA_v6_ADDENDUM.md (14-17), HALT_CRITERIA_v7_ADDENDUM.md (18-20), HALT_CRITERIA_v8_ADDENDUM.md (21-22)

---

## Item 23 — Operational view source-state failure

**Halt condition:** Any failure encountered when generating or regenerating an operational view (discussion-bubbles.html, activity.html, proposals.html) from its source state store.

This is a HALT not a soft-warning because operational views drive Founder decision-making. A view showing stale or inconsistent data can lead the Founder to approve the wrong proposal, miss a halt-triggering discussion bubble, or lose track of agent activity. Better to fail loudly.

### 23.1 — State directory unreadable

**Trigger:**
- `.claude/state/discussion-bubbles/` cannot be listed (permission denied, missing directory after expected init)
- `.claude/state/handoffs/` cannot be listed
- `.claude/state/proposals/pending/` cannot be listed

**Resolution path:**
1. Verify repo working directory
2. Verify `.claude/state/` permissions (`ls -la .claude/state/`)
3. Verify scenario subdirectories exist for handoffs
4. If genuinely missing, recreate with `mkdir -p` and log structural recovery event
5. Re-run skill

**Recovery deadline:** 30 minutes. Beyond that, escalate via FIQ to Founder for manual repo inspection.

### 23.2 — State file parse failure

**Trigger:**
- A markdown file in a state directory fails to parse (malformed frontmatter, missing required fields)
- For discussion bubbles: missing `topic`, `claim`, `status`, `vote_tally`, `decision`, or `messages[]` array; any message missing `author`, `role_in_bubble`, `timestamp`, or `content`
- For handoffs: missing `scenario`, `from_agent`, `to_agent`, `created_at`
- For proposals: missing `id`, `title`, `lane`, `estimate`, or `files_affected`

**Resolution path:**
1. Identify the failing file (skill must log path + first parse error)
2. Compare to the schema in REPORT_HTML_SPEC_v8.1_AMENDMENT.md
3. If recoverable (typo, missing optional field gone wrong), patch the file manually
4. If unrecoverable (file truncated, corrupted), restore from git history (`git show HEAD~1:<path>`)
5. If never written correctly (originator agent bug), regenerate from originating cycle's session journal
6. Re-run skill

**Recovery deadline:** 60 minutes for a single file; 4 hours for multiple files (suggests systemic write bug).

**Common causes:**
- Concurrent write during read (file half-written)
- Originating skill bug (e.g., parbaughs-discussion-bubble-write produced invalid frontmatter)
- Manual editor save left trailing characters
- Encoding issue (non-UTF-8 bytes)

### 23.3 — JSON serialization or round-trip failure

**Trigger:**
- Data object built from state cannot be serialized to JSON (cycle reference, non-serializable type)
- Data block replaced in HTML, but re-parsing the modified HTML yields different data than original

**Resolution path:**
1. Identify the problematic field (skill must log key path)
2. Check for cycle references in nested data
3. Check for non-string keys or non-serializable values (functions, undefined, BigInt)
4. Patch the skill's data-building logic to handle the case
5. Re-run

**Recovery deadline:** 2 hours. This is a skill-logic bug, not a data bug.

### 23.4 — Operational view structural integrity drift

**Trigger:**
- Operational view HTML file is missing required elements:
  - discussion-bubbles.html: filter bar, discussion bubble list container, raw data debug section
  - activity.html: filter bar, stream container, agent/ship dropdowns
  - proposals.html: summary bar, filter bar, proposal list container, export button, help banner
- HTML cannot be parsed (unclosed tags after expected Founder edits)

**Resolution path:**
1. Restore from git (`git checkout HEAD -- docs/reports/<view>.html`)
2. If Founder edits were on the structural elements, surface that — Founder-modifiable zones do NOT include the required structural elements (per P18.8)
3. After restore, re-run skill to populate data block
4. Notify Founder via FIQ if structural elements were modified intentionally — may need spec update

**Recovery deadline:** 15 minutes. Restore-from-git is fast; this should rarely block forward progress.

### 23.5 — Decision log write failure

**Trigger:**
- `apply-decisions.sh` cannot append to `.claude/state/proposals/decisions-log.ndjson`
- Decision log file ends mid-line (last write was incomplete)
- Decision log file fails NDJSON parse (one line invalid)

**Resolution path:**
1. If file ends mid-line, manually truncate to last newline
2. If a line is invalid JSON, locate via `jq -c . < decisions-log.ndjson > /dev/null` (will print first failure)
3. Reconstruct the failing line from git history or the original decisions JSON export
4. Re-run apply-decisions with same input — script is idempotent for already-applied moves (skip if file already in destination)

**Recovery deadline:** 30 minutes.

### 23.6 — Decision-script git failure mid-apply

**Trigger:**
- `apply-decisions.sh` moves files but `git commit` fails (uncommitted local changes, hook rejection, lockfile)

**Resolution path:**
1. Resolve git issue (`git status`, `git stash`, etc.)
2. Stage moved files + log: `git add .claude/state/proposals .claude/state/proposals/decisions-log.ndjson`
3. Commit manually with the structured message printed in the script output

**Recovery deadline:** 15 minutes.

### 23.7 — Discussion bubble tally divergence

**Trigger:**
- A discussion bubble state file's `vote_tally` does not match the votes derived from its `messages[]` array
- A message with `role_in_bubble: "voting"` is missing a non-null `vote` field
- A message has `role_in_bubble: "voting"` and a `vote` value outside the canonical enum (`approve` / `reject` / `abstain`)
- A bubble has `status: "approved-with-dissent"` but `vote_tally.reject == 0`
- A bubble has `status: "tied"` but `vote_tally.approve != vote_tally.reject`

**Resolution path:**
1. Identify the failing bubble (skill must log the bubble id + both the declared tally and the message-derived tally)
2. If a voting message is missing `vote`: trace back through session journal to recover the cast vote; patch
3. If declared tally is wrong: recompute from messages, update `vote_tally`
4. If status is inconsistent with tally: fix status to match (approved / approved-with-dissent / rejected / tied)
5. Re-run regen

**Recovery deadline:** 30 minutes. This is a write-side discipline failure in the bubble-orchestrator agent; if it recurs, raise a skill bug.

**Why it's a halt:** the discussion-bubbles.html view is Founder's audit trail of agent reasoning. A bubble whose declared outcome doesn't match its transcript is corrupted governance evidence.

---

## Item 24 — Pause auto-resume failure

**Halt condition:** A previously-paused cycle (per PAUSE_DISCIPLINE_v8.1_ADDENDUM.md) has not auto-resumed within 1 hour after its `resume_after` timestamp passes.

This IS a halt (unlike the underlying rate-limit pause) because if the auto-resume machinery itself is broken, agents would loop in pause indefinitely without Founder ever knowing. Better to fire halt and have Founder investigate than to silently stall.

### 24.1 — State file present, resume_after passed, no resume

**Trigger:**
- `.claude/state/last-verify.json` exists
- Current time ≥ `resume_after` + 3600 seconds
- No `cycle.resumed` telemetry event between `resume_after` and now
- Cron has fired at least once in the gap

**Resolution path:**
1. Read `last-verify.json`, identify pause reason and saved resume point
2. Check cron logs for the most recent fire — did it exit immediately? Did it crash?
3. Common causes:
   - State file readable but malformed (bad JSON, missing required fields)
   - `next_atomic_unit` references a file path that no longer exists
   - `context_required` files have moved or been deleted
   - Cron worker has a different working directory than expected
4. Manually trigger one cycle, verify it lands cleanly + deletes `last-verify.json`
5. If a bug in resume logic, patch + add a regression test

**Recovery deadline:** 4 hours. Beyond that, manually flush `last-verify.json`, log the lost cycle, and restart the affected ship cycle from its last-known-good handoff.

### 24.2 — State file unreadable on resume attempt

**Trigger:**
- Cron fires, attempts to read `.claude/state/last-verify.json`
- Read fails (permission denied, file corrupted, JSON parse error)

**Resolution path:**
1. Restore `last-verify.json` from git history (`git log -- .claude/state/last-verify.json`)
2. If not in git (legitimate — state files often gitignored), reconstruct from `cycle.paused` telemetry event
3. If telemetry also missing, manually identify last completed atomic operation from journal + cycle-history.json
4. Write a fresh `last-verify.json` with the reconstructed state + manually trigger resume

**Recovery deadline:** 2 hours.

### 24.3 — Multiple-quota pause deadlock

**Trigger:**
- Two or more quota types paused simultaneously (e.g., weekly tokens AND hourly requests)
- Both `resume_after` timestamps have passed
- Cycle has not resumed because the resume logic reads only the first state file entry

**Resolution path:**
1. Audit `last-verify.json` schema: must support array of quota entries OR multiple state files (one per quota)
2. Patch resume logic to handle multi-quota state
3. Manually clear all pause entries with passed `resume_after`, trigger resume

**Recovery deadline:** 4 hours. Likely a one-time pre-agents-loose finding; once fixed, recurrence indicates fundamental quota-tracking bug.

---

## HALT criteria consolidation summary (1-24)

| # | Trigger | Source | Type |
|---|---|---|---|
| 1-12 | Various (v1-v4 foundation) | v1-v4 | HALT |
| **13** | **Rate-limit threshold (90% usage)** | v4 | **PAUSE** |
| 14 | Founder Input Queue overflow | v6 | HALT |
| 15 | Extended thinking budget breach | v6 | HALT |
| 16 | Agent wellness degradation | v6 | HALT |
| **17** | **Rest cycle** | v6 | **PAUSE** |
| 18 | Headless cron failure | v7 | HALT |
| 19 | Proactive cycle budget breach | v7 | HALT |
| 20 | Workflow doc state corruption | v7 | HALT |
| 21 | Handoff discipline failure (4 subtypes) | v8 | HALT |
| 22 | Telemetry integrity (5 subtypes) | v8 | HALT |
| 23 | Operational view source-state (7 subtypes) | v8.1 | HALT |
| **24** | **Pause auto-resume failure (3 subtypes)** | **v8.1** | **HALT** |

PAUSE items (13, 17) preserve numbering for backward compat but are governed by PAUSE_DISCIPLINE_v8.1_ADDENDUM.md, not the halt protocols.


---

# Proposed HALT 25 — Pause Meter Unavailable

> **Status:** Draft authored 2026-05-13 by the orchestration team for Founder ratification.
> **Apply path:** When Founder ratifies, this moves to `docs/agents/HALT_CRITERIA_v8.1_ADDENDUM.md` as a new item 25 (Founder applies; governance hook blocks orchestration-team writes to `docs/agents/`).
> **Bubble of record:** `db-2026-05-13-003` (approved-with-dissent, 2-1-1).
> **Critic's binding rider satisfied:** HALT 25 × HALT 24 interaction documented in § 4 below.

---

## 1 — Trigger

HALT 25 fires when an agent cannot confirm its own usage state before crossing a discipline boundary that the meter is supposed to gate. Specifically:

- Agent is about to perform an atomic operation
- PAUSE_DISCIPLINE § 2.1 says: "check meter at every operation boundary"
- Agent cannot read `.claude/state/usage-snapshot.json` (sidecar absent or stale > 60s)
- AND the per-session defensive heuristic (agent-feel pacing with N=5 / M=10 guideposts) suggests near-cap proximity
- AND the org-monthly cap is at unknown state

The first three are necessary; the fourth is sufficient to fire HALT 25 even when the first three look clean. **In the absence of meter data, treat unknown == near-cap.** Over-pause beats under-pause.

## 2 — Why this is a HALT, not a PAUSE

PAUSE expects predictable boundaries (rate-limit-90pct, wellness-rest, heartbeat). HALT 25 fires when the agent doesn't know WHICH boundary it's near. That's not a predictable resource event — it's an integrity gap in the discipline itself. Auto-resume on the next cron without a working meter would be the same bug all over again.

HALT 25 → Founder reviews → confirms or restores meter → clears via standard halt-clearance flow.

## 3 — State written at fire

`.claude/state/halts/halt-25-meter-unavailable-<ISO-8601>.json`:

```json
{
  "halt_id": 25,
  "halt_name": "pause-meter-unavailable",
  "fired_at": "<ISO-8601>",
  "agent": "<agent-id>",
  "cycle_id": "<cycle-id>",
  "ship_id": "<ship-id or null>",
  "last_atomic_unit_completed": "<file or commit>",
  "next_atomic_unit_attempted": "<what was about to happen>",
  "meter_status": {
    "sidecar_present": false,
    "sidecar_last_write": null,
    "agent_feel": "near-cap" | "fine" | "unknown",
    "ops_since_last_pause_check": <int>,
    "minutes_since_last_pause_check": <float>
  },
  "resolution_required": "Founder verifies meter status (sidecar running OR billing dashboard) and clears halt by deleting this file."
}
```

## 4 — Interaction with HALT 24 (auto-resume failure)

HALT 24 fires when a previously-paused cycle does not auto-resume within 1 hour of `resume_after`. HALT 25 can fire on the resume cycle if the meter is still unavailable.

**Interaction rule:** If both halts can fire, HALT 25 takes precedence — the agent must NOT auto-resume into a meter-unavailable state. Specifically:

1. Resume cycle fires.
2. Resume cycle reads `last-verify.json`.
3. Resume cycle checks meter status BEFORE proceeding with the next atomic operation.
4. If meter unavailable: HALT 25 fires, supersedes the resume. The pause cycle remains paused; HALT 25's halt-file is created; HALT 24's 1-hour timer continues but is now subordinate.
5. Founder resolution clears HALT 25 first; that allows the resume to proceed; HALT 24's timer may or may not have elapsed (Founder judges; HALT 24 clearance is auto-handled when the meter is restored AND the resume completes).

**Why HALT 25 supersedes HALT 24:** HALT 24 is a flow-control halt (something didn't happen on time). HALT 25 is an integrity halt (we don't know what state we're in). Integrity halts always win over flow-control halts.

## 5 — Recovery semantics

Founder clears HALT 25 by:

1. Verify meter is now reading (run `scripts/cron/usage-snapshot.ps1` once OR check the billing dashboard manually OR start the sidecar process per PROP-003).
2. Delete the halt-25 state file.
3. (If HALT 24 was deferred under HALT 25, re-evaluate after clearance.)
4. Next cron fire proceeds.

If meter cannot be restored (e.g., billing dashboard down, sidecar broken), Founder may TEMPORARILY clear HALT 25 with a `force-clear: true` flag in the deletion artifact, accepting the risk that the next cycle operates blind. This is a Founder-only escape hatch — not for agents.

## 6 — Sunset condition

HALT 25 retires when:
1. PROP-003 (token-meter-wiring-sidecar) ships AND
2. Sidecar runs reliably for 7 consecutive days without an out-of-band quota event AND
3. Founder ratifies sunset via discussion bubble

Until then, HALT 25 is permanent.

## 7 — Cross-references

- PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 2.1 (90% pause trigger — the discipline HALT 25 protects)
- HALT_CRITERIA_v8.1_ADDENDUM.md item 24 (auto-resume failure — the cousin halt; § 4 above documents interaction)
- F1a-token-meter-gap-diagnostic.md (evidence of the gap this halt closes)
- PROP-003 (token-meter-wiring-sidecar — heuristic-sunset path)
- F5 metric-integrity protocol (HALT 25 is the integrity guardrail for the metric "tokens consumed")

---

*Draft authored 2026-05-13 by orchestration-team during Wave Zero Dry-Run remediation pass F1. Awaiting Founder review + ratification + move to `docs/agents/HALT_CRITERIA_v8.1_ADDENDUM.md` as item 25.*

