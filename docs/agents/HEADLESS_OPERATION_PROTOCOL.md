# HEADLESS_OPERATION_PROTOCOL.md

> **Status:** Governance v7 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Define scheduled wake cycles for orchestration team. Agents work on cron schedule without Founder initiation. Three cycle types: Heartbeat (every 4 hours), Ship (daily), Proactive (weekly).
> **Goal:** Founder shifts from session-initiator to retrospective-reviewer. Orchestration team continues building on schedule.

---

## 0 — Architectural reality

**Headless ≠ daemon.** Orchestration agents are Claude Code instances invoked by scheduler (GitHub Actions). Each invocation:
1. Wakes from scheduler
2. Reads state from `.claude/state/`
3. Runs activities per cycle definition
4. Writes state back atomically
5. Closes

This is **scheduled wake cycles**, not continuous daemon operation. Implications:
- Each invocation has rate limits + token budgets
- State persistence across invocations is critical
- All activities must be **idempotent** (rerun safely if interrupted)
- Cost discipline matters more (scheduled cron multiplies token spend)
- No "ongoing" computation between cycles — only what state captures

---

## 1 — Three cycle types

### Cycle 1 — Heartbeat
**Frequency:** Every 4 hours, 24/7 (6 invocations/day)
**Cron:** `0 */4 * * *` (UTC)
**Duration cap:** 30 minutes max per cycle
**Cost cap:** 40k tokens max per cycle
**Total weekly cost:** ~1.68M tokens (42 invocations × 40k)

**Purpose:** Lightweight maintenance + monitoring. Catches drift early. Audits last cycle's outputs. Keeps system healthy between heavier cycles.

### Cycle 2 — Ship
**Frequency:** 1×/day at 11:00 UTC (~6 AM ET — accounts for DST drift across year)
**Cron:** `0 11 * * *`
**Duration cap:** 2 hours max per cycle
**Cost cap:** 200k tokens max per cycle
**Total weekly cost:** ~1.4M tokens (7 invocations × 200k)

**Purpose:** Primary production work. Execute next eligible ship per SHIP_INDEX. Full audit-first + decision-bubble + retrospective discipline.

### Cycle 3 — Proactive
**Frequency:** 1×/week at 01:00 UTC Monday (~8 PM ET Sunday)
**Cron:** `0 1 * * 1`
**Duration cap:** 90 minutes max per cycle
**Cost cap:** 120k tokens max per cycle
**Total weekly cost:** ~120k tokens (1 invocation × 120k)

**Purpose:** Generate proactive improvement proposals for Founder review. NO IMPLEMENTATION during this cycle — proposals only.

### Total cost budget
~3.2M tokens/week steady state. Founder cost-discipline monitors via existing cost dashboard (3i.5). Threshold breach surfaces as halt per HALT_CRITERIA item 5.

---

## 2 — Cycle invariants (all cycles)

Every cron cycle observes these invariants:

### 2.1 Cycle lock
First action of any cycle:
1. Check `.claude/state/cycle-lock.json` for existing lock
2. If locked AND lock is <2× max duration old → exit immediately ("previous cycle still running")
3. If locked AND lock is stale (>2× max duration old) → log stale lock + clear it + proceed
4. Acquire lock with `{cycle_type, started_at, pid}` payload
5. Lock released at cycle completion (success or failure)

This prevents concurrent cycle execution when scheduler fires while previous cycle still running.

### 2.2 Pre-flight checks
After lock acquisition:
1. Verify `.claude/state/last-verify.json` valid + recent
2. Read `.claude/state/founder_input_queue.json` — check for blocking entries (HALT-BLOCKING-FIQ)
3. Read `.claude/state/cycle-history.json` — check for repeated failures (3 consecutive failures = halt + escalate)
4. If any HALT condition active → exit immediately + log + escalate

### 2.3 Budget watchdog
Cycle internally tracks:
- Tokens consumed (running tally)
- Wall-clock time (started_at vs now)

When either approaches 90% of cap:
- Complete current atomic operation
- Mark cycle status as "approaching limit"
- Skip new operations
- Write state snapshot
- Exit gracefully

When either exceeds 100% of cap:
- HALT-CYCLE-OVERRUN per HALT_CRITERIA item 18
- Force-write current state
- Log overrun details
- Exit

### 2.4 State persistence
Every cycle writes (at minimum):
- `.claude/state/cycle-history.json` — append entry with outcomes
- `.claude/state/last-verify.json` — checksum of governance state
- `SESSION_JOURNAL.md` — full cycle entry

Cycle-specific state files (per cycle type, detailed below) also updated.

### 2.5 Cycle journal entry
Every cycle writes ONE journal entry summarizing:

```
[2026-05-19T11:00:00Z] [SHIP-CYCLE-START] cycle_id=ship-20260519-1100. Lock acquired. Pre-flight: clean.

[2026-05-19T12:45:00Z] [SHIP-CYCLE-END] cycle_id=ship-20260519-1100. Duration: 1h45m. Tokens: 187k. Outcome: SUCCESS. Ship advanced: W1.S4 → 70% complete. FIQ entries created: 2. Wellness checkpoints: 1.
```

Plus internal entries during cycle for major events (ship work entries, FIQ creates, drift flags, etc.).

### 2.6 Failure handling
If cycle crashes/errors mid-execution:
1. Lock auto-released by scheduler timeout (no orphan locks)
2. Next cycle invocation reads cycle-history, detects unclean exit
3. State files are READABLE even if mid-write was interrupted (atomic write pattern: write to `.tmp`, then rename)
4. After 3 consecutive failures → HALT-CYCLE-REPEATED-FAILURE per HALT_CRITERIA item 20 → Founder notification

---

## 3 — Cycle 1: Heartbeat — full activity definition

**Trigger:** every 4 hours
**Lock:** heartbeat
**Budget:** 40k tokens / 30 min

### 3.1 Activities (in order)

**1. Bug Triage Listener scan (10k token budget)**
- Read `.claude/state/bug-reports/` for new entries since last heartbeat
- Categorize each: severity (low/med/high/critical), surface affected, repeat occurrence detection
- High/critical bugs → FIQ entry priority=high
- Low/medium → batched into next proactive cycle proposal queue
- Output: bug-triage delta written to state

**2. Critic spot-check (10k token budget)**
- Pick 1 random output from last heartbeat OR last ship cycle (whichever more recent)
- Re-run audit checklist against it
- Drift detected → log + surface to FIQ
- Clean → log "spot-check passed"
- Output: spot-check entry in `.claude/state/critic-audit-log.json`

**3. Performance Agent synthetic benchmark (8k token budget)**
- If new code landed in repo since last heartbeat:
  - Run quick synthetic benchmark (page load, render time of changed surfaces)
  - Compare to baseline in `.claude/state/perf-baseline.json`
  - Regression >10% → FIQ entry priority=high
- If no new code → skip

**4. Wellness observance audit (5k token budget)**
- For each agent: read `.claude/state/wellness/<agent>.json`
- Check: did agent hit threshold and skip checkpoint?
- Agents past threshold without checkpoint → log + flag for next ship cycle to enforce
- Output: wellness audit entry

**5. FIQ queue health check (2k token budget)**
- Count active entries (resolved_at == null)
- 20+ entries → Critic flag "queue depth high"
- 50+ entries → HALT_CRITERIA item 11 (sanity halt)
- Count stale entries (raised_at > 14 days ago, no founder_response)
- Stale entries flagged for next Founder check-in

**6. Session journal completeness audit (5k token budget)**
- Verify last cycle wrote required journal entries
- Missing entries → log gap + fill from cycle history if possible
- Verify chronological consistency

### 3.2 Output
Heartbeat log entry to `.claude/state/heartbeat/<YYYY-MM-DD>.log`:

```markdown
## Heartbeat — 2026-05-19T16:00:00Z

**Duration:** 18 min
**Tokens:** 34k

### Bug Triage
- New bugs scanned: 3
- High/critical: 0 (none surfaced to FIQ)
- Low/medium queued for proactive: 3

### Critic Spot-Check
- Target: W1.S4 Hole-7 save flow
- Outcome: CLEAN

### Performance
- New code since last heartbeat: yes (commit abc1234)
- Benchmark: page load 240ms (baseline 235ms, +2.1%)
- Regression: none

### Wellness Observance
- Agents past threshold: 0
- Agents needing checkpoint next ship cycle: 0

### FIQ Health
- Active entries: 4
- Stale (>14 days): 0
- Queue depth: nominal

### Session Journal
- Last cycle entries complete: yes
- Chronological consistency: verified
```

---

## 4 — Cycle 2: Ship — full activity definition

**Trigger:** daily 11:00 UTC
**Lock:** ship
**Budget:** 200k tokens / 2 hours

### 4.1 Activities (in order)

**1. Pre-cycle setup (5k tokens)**
- Read `.claude/state/founder_input_queue.json` — incorporate any new Founder responses
- Apply any approved proactive proposals from previous week
- Read SHIP_INDEX — identify next eligible ship

**2. Ship selection (5k tokens)**
- Orchestrator selects next ship per dependency ordering in SHIP_INDEX
- Eligibility check: are dependencies complete? Are any blocking FIQ entries open for this ship?
- If no eligible ship → run governance maintenance OR proactive lane work (within scope)

**3. Pre-flight audit (P1) (30k tokens)**
- Per locked P1 protocol
- Engineer surfaces planned approach
- Critic audits planned approach
- Failures → halt + escalate

**4. Decision bubbles for ambiguous spec elements (30k tokens)**
- Per Interpretation B voting
- Required voters: Engineer + Critic + Performance/Load (W2+) + Security (Launch A+) + Data Integrity (W2+)
- Contributing: Orchestrator (tie-breaker), Flow Doc, UI Polisher, End User, Bug Triage
- Bubble-only: Devil's Advocate, Historical Pattern, Future Self, Plain English Translator
- Quorum 2; Orchestrator ties-break
- Plain English Translator produces Founder-readable summary

**5. Engineer execution (100k tokens — main work)**
- Per ship Vision
- P10 loop-and-verify discipline
- P12 extended thinking + deep research before consequential decisions
- Research artifacts in `.claude/research/<ship-id>/`
- Code changes committed atomically per logical unit
- Wellness checkpoints triggered per agent threshold

**6. Post-push retrospective (5-component) (20k tokens)**
- Per locked POST_PUSH_RETROSPECTIVE protocol
- All 5 components written
- Critic verifies completeness

**7. State persistence + cycle close (10k tokens)**
- Update ship progress in `.claude/state/ship-progress/<ship-id>.json`
- Update SHIP_INDEX if ship completed
- Write cycle history entry
- Write SESSION_JOURNAL summary
- Release ship cycle lock

### 4.2 Mid-cycle halt conditions
Cycle exits early if:
- Budget watchdog 90% threshold reached
- Blocking FIQ created (HALT-BLOCKING-FIQ)
- Any halt criterion (1-20) triggered
- Wellness halt declared
- Atomic operation completes; new operations skipped

State saved in resumable form. Next cycle resumes from saved state.

### 4.3 Ship-completion vs ship-progress
- Ship completes within cycle → SHIP_INDEX updated, next ship eligible tomorrow
- Ship doesn't complete → progress saved, next cycle resumes
- Multi-cycle ships: standard pattern for complex ships

### 4.4 Output
SHIP_CYCLE entry to SESSION_JOURNAL.md + ship progress state file.

---

## 5 — Cycle 3: Proactive — full activity definition

**Trigger:** weekly Monday 01:00 UTC
**Lock:** proactive
**Budget:** 120k tokens / 90 min

**CRITICAL:** This cycle generates PROPOSALS. It does NOT implement them. Founder reviews and approves before next ship cycle picks them up.

### 5.1 Activities (in order)

**1. Bug pattern analysis (20k tokens)**
- Aggregate last week's Bug Triage data
- Identify repeat patterns (same surface, same browser, same flow)
- For each pattern: severity + reproducibility + estimated investigation cost
- Generate Lane 2 proposals per `PROACTIVE_IMPROVEMENT_PROTOCOL.md` § 2.2

**2. UI polish scan (30k tokens — largest budget; biggest free wins)**
- UI Polisher scans recent ships for polish opportunities
- Scope per PROACTIVE_IMPROVEMENT_PROTOCOL.md § 2.1:
  - Typography refinements
  - Spacing consistency
  - Micro-interactions
  - Accessibility improvements
  - Loading state quality
  - Empty state copy
  - Error message improvements
- Generate Lane 1 proposals

**3. Performance optimization scan (25k tokens)**
- Performance Agent scans codebase for optimization opportunities
- Scope per § 2.3:
  - Unused CSS
  - Redundant Firestore listeners
  - Lazy-loading non-critical paths
  - Image compression audits
  - Bundle size monitoring
- Generate Lane 3 proposals

**4. Design system extension scan (20k tokens)**
- UI Polisher + Engineer audit recent ships
- Identify patterns where same value used 3+ times (token candidate)
- Identify utility class patterns used repeatedly
- Identify primitive components ripe for extraction
- Generate Lane 4 proposals per § 2.4

**5. Proposal queue assembly (15k tokens)**
- Aggregate all proposals into single queue document
- Sort by lane, then by estimated impact
- Risk-classify each (per template)
- Estimate total implementation cost (hours + tokens)
- Plain English Translator formats for Founder readability

**6. State persistence + cycle close (10k tokens)**
- Write proposal queue to `.claude/state/proactive-proposals/<YYYY-MM-DD>.md`
- Update cycle history
- Write SESSION_JOURNAL summary
- Release proactive cycle lock

### 5.2 What this cycle does NOT do
- Implement any proposals
- Merge any code changes
- Modify any ship Vision
- Touch FIQ queue (unless critical bug surfaces during scan — then standard FIQ create)
- Modify governance docs

### 5.3 Output
PROACTIVE_CYCLE entry to SESSION_JOURNAL.md + proposal queue file at `.claude/state/proactive-proposals/<YYYY-MM-DD>.md`.

Founder receives a notification (mechanism: GitHub Actions sends email/webhook on completion — see CRON_CONFIGURATION.md) with proposal count + queue link.

---

## 6 — Founder approval workflow

### 6.1 Reviewing weekly proposal queue

Founder reviews `.claude/state/proactive-proposals/<latest>.md`:
- Per proposal: Accept / Reject / Defer
- Decisions captured in file via simple edit (paste Founder decision into per-proposal section)
- Saved file becomes input to next ship cycle

### 6.2 Approved proposals enter ship queue

Next daily ship cycle (after Founder approval):
1. Reads approved proposals from queue
2. Treats them as ship-tasks (mini-ships within main ship cycle work)
3. Implements per standard ship discipline (audit-first, retrospective)
4. Marks proposals as implemented in queue file

### 6.3 Rejected/deferred proposals

- Rejected: marked + retained for historical audit; never auto-resurface
- Deferred: marked + auto-resurface in proactive cycle 4 weeks later

### 6.4 Proposal queue lifecycle

| State | Trigger | Retention |
|---|---|---|
| Open (proposed, awaiting Founder) | Proactive cycle creates | Until Founder decides |
| Approved (awaiting implementation) | Founder accepts | Until ship cycle implements |
| Implemented | Ship cycle completes | Permanent audit trail |
| Rejected | Founder rejects | Permanent audit trail |
| Deferred | Founder defers | Re-evaluated in 4 weeks |
| Stale (>30 days open, no Founder decision) | Auto-flag | Critic surfaces in heartbeat |

---

## 7 — Integration with existing governance

### 7.1 With FOUNDER_INPUT_QUEUE
Bugs/blockers surfaced during any cron cycle create FIQ entries per P11. Distinct from proactive proposals (FIQ = questions for Founder; proposals = improvement suggestions).

### 7.2 With AGENT_WELLBEING
Wellness checkpoints triggered during cron cycles per agent thresholds. Rest cycles observed even within cron execution — if agent due rest, agent does rest activities instead of new ship work that cycle.

### 7.3 With HALT_CRITERIA
New items 18-20 specific to cron operation:
- 18: Cycle cost overrun (budget watchdog at 100%)
- 19: Proactive scope violation (proactive work outside locked lanes)
- 20: Cron cycle repeated failure (3 consecutive cycle crashes)

### 7.4 With cost-discipline
Cron multiplies token spend significantly. Cost dashboard (3i.5) monitors weekly cron spend. Threshold breach surfaces to Founder.

### 7.5 With Wave Zero Dry-Run
WAVE_ZERO_DRY_RUN_v7_EXTENSION includes 2 new validations: heartbeat cycle dry-run + proactive cycle dry-run.

---

## 8 — Failure modes + recovery

### 8.1 Scheduler failure (GitHub Actions down)
- Cycle fires late or skips
- Next cycle picks up where last left off
- Cycle history captures skipped cycles
- No state corruption

### 8.2 Mid-cycle crash
- Lock auto-released by scheduler timeout
- State files written atomically (no partial writes)
- Next cycle detects unclean exit + logs
- After 3 consecutive crashes → HALT_CRITERIA item 20

### 8.3 Budget overrun
- Watchdog catches at 90%, exits gracefully
- Hard limit at 100% → HALT_CRITERIA item 18
- Either way, atomic operation completes first

### 8.4 Stale cycle lock
- Lock detected as stale (>2× max duration old)
- Force-clear lock with audit log entry
- Continue cycle normally
- Critic spot-checks the lock-clearing decision

### 8.5 Concurrent cycle attempt
- Lock prevents
- Second cycle exits immediately with "previous cycle still running" log entry
- No work lost

---

## 9 — Pause/resume control

### 9.1 Founder pause
Founder can pause all cron cycles via writing `.claude/state/cron-paused.json`:

```json
{
  "paused": true,
  "paused_at": "2026-05-19T08:00:00Z",
  "paused_by": "Founder",
  "reason": "Family vacation week",
  "auto_resume_at": "2026-05-26T08:00:00Z"
}
```

When paused: cycle wakes up, reads pause file, logs "paused", exits immediately. No work performed.

Auto-resume at `auto_resume_at` timestamp. Or Founder manually removes pause file.

### 9.2 Emergency halt
Founder can halt active cycle via writing `.claude/state/emergency-halt.json`:

```json
{
  "halt": true,
  "halt_at": "2026-05-19T11:30:00Z",
  "reason": "Detected unexpected production issue"
}
```

Active cycle checks this file every minute. If detected: complete atomic operation, write state, exit.

### 9.3 Selective cycle disable
Founder can disable specific cycles via `.claude/state/cycle-config.json`:

```json
{
  "heartbeat": {"enabled": true},
  "ship": {"enabled": true},
  "proactive": {"enabled": false}
}
```

Disabled cycles wake, read config, exit. Other cycles continue normally.

---

## 10 — Cross-references

- `PROACTIVE_IMPROVEMENT_PROTOCOL.md` (proactive lane definitions)
- `PROACTIVE_PROPOSAL_QUEUE_TEMPLATE.md` (proposal format)
- `CRON_CONFIGURATION.md` (GitHub Actions setup)
- `HALT_CRITERIA_v7_ADDENDUM.md` (items 18-20)
- `SESSION_JOURNAL_v7_ADDENDUM.md` (cycle entry types)
- `FOUNDER_INPUT_QUEUE.md` (P11 — FIQ creation from cycles)
- `AGENT_WELLBEING_PROTOCOL.md` (P13 — wellness within cycles)
- `EXTENDED_THINKING_DEEP_RESEARCH.md` (P12 — research within cycles)
- `WAVE_ZERO_DRY_RUN_v7_EXTENSION.md` (validations)

---

*Document authored 2026-05-12. Locked Founder ratification. Core to v7 governance and headless operation.*
