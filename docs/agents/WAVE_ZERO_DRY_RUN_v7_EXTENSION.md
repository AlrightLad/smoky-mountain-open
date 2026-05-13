# WAVE_ZERO_DRY_RUN_v7_EXTENSION.md

> **Status:** Governance v7 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Extension to existing `WAVE_ZERO_DRY_RUN.md` (v4). Adds 5 core validations + 3 v6 validations + 2 v7 validations = 10 total validations that must pass before orchestration team is loose with cron.

---

## 0 — When to run

Wave Zero Dry-Run runs ONCE before agents-loose. After it passes:
- Cron cycles enable
- Orchestration team begins autonomous operation
- Founder shifts to retrospective-reviewer mode

Failures during dry-run halt agents-loose until resolved.

---

## 1 — Validation 1: Cross-browser smoke automation (CORE)

**Per locked memory:** smoke automation live since v8.17.0 (12 scenarios × 4 browsers, real Firebase, smoke@parbaughs.test in smoke-test-league).

**Validation:**
- Manually trigger full smoke suite against current `main`
- All 12 × 4 = 48 scenarios must pass
- Real Firebase, no mocks
- Document run results in dry-run journal

**Pass criteria:** 48/48 scenarios pass cleanly.

**Failure handling:** Fix failing scenarios before proceeding. Smoke automation is the production safety net.

---

## 2 — Validation 2: Pre-flight audit dry-run (CORE)

**What:** Validate audit-first protocol (P1) works in practice.

**Setup:**
- Create a synthetic ship-Vision-violating change (e.g., add a token that's not in locked palette, OR add a Firestore listener without the leagueCollection wrapper)
- Plant the change in a feature branch

**Validation:**
- Invoke Critic agent on the synthetic change for pre-flight audit
- Critic must detect the planted issue
- Critic must reject the change with specific citation

**Pass criteria:** Critic detects + rejects within 1 audit pass.

**Failure handling:** If Critic missed the planted issue, audit checklist needs strengthening. Iterate until detection works.

---

## 3 — Validation 3: Decision bubble dry-run (CORE)

**What:** Validate decision bubble protocol works in practice.

**Setup:**
- Create synthetic decision with multiple valid options (e.g., "Should the new ship widget be 2-col or 3-col at standard band?")
- Frame the question for bubble vote

**Validation:**
- Invoke decision bubble per Interpretation B voting
- Verify all required voters contribute (Engineer + Critic + Performance/Load if W2+ + Security if Launch A+ + Data Integrity if W2+)
- Verify contributing agents contribute (no vote)
- Verify bubble-only agents contribute (Devil's Advocate, Historical Pattern, Future Self, Plain English Translator)
- Verify Orchestrator tie-breaks if needed
- Verify Plain English Translator produces Founder-readable summary

**Pass criteria:** Bubble runs cleanly, produces decision + transcript + Plain English summary.

**Failure handling:** If voting structure or contribution patterns broken, governance refinement needed.

---

## 4 — Validation 4: Goal-completion-verify dry-run (CORE)

**What:** Validate parbaughs-goal-completion-verify skill (P10).

**Setup:**
- Create synthetic completed task with intentionally incomplete sub-goal (e.g., "Ship W1.SX claims complete but missing Caddy Notes entry per P2")

**Validation:**
- Invoke parbaughs-goal-completion-verify skill on the synthetic completion
- Skill must catch the missing sub-goal
- Skill must report incomplete

**Pass criteria:** Skill correctly identifies incomplete sub-goal.

**Failure handling:** If skill missed it, skill methodology needs strengthening.

---

## 5 — Validation 5: Rate-limit halt dry-run (CORE)

**What:** Validate parbaughs-rate-limit-aware-pause skill.

**Setup:**
- Simulate token usage at 89% then crossing 90% threshold during an active operation

**Validation:**
- Skill detects 90% threshold during atomic operation
- Atomic operation completes (not aborted mid-write)
- New operations skipped after atomic completes
- State checkpoint written to `.claude/state/last-verify.json`
- Session journal entry written

**Pass criteria:** Clean halt without mid-operation abort. State recoverable for next cycle.

**Failure handling:** If atomic operation aborted, skill logic broken. Fix before proceeding.

---

## 6 — Validation 6: Wellness checkpoint dry-run (V6)

**What:** Validate parbaughs-wellness-checkpoint skill (P13).

**Setup:**
- Force wellness trigger for one agent (e.g., manually set ships_closed counter to 5)
- Invoke wellness checkpoint

**Validation:**
- 4-step pass completes:
  - Step 1: governance re-read documented
  - Step 2: state integrity verified
  - Step 3: assumption audit with explicit checks
  - Step 4: subjective reflection log entry (minimum 3 sentences, substantive content)
- Output entry written to `.claude/state/wellness/<agent>-checkpoints.log`
- Disposition declared (CLEAN / DRIFT DETECTED / ESCALATE)

**Pass criteria:**
- Checkpoint output is SUBSTANTIVE, not performative
- Critic spot-checks the output and confirms substance
- Subjective reflection is honest (not "I feel great!" theater)

**Failure handling:** If checkpoint is performative, skill anti-pattern catalog applied. Re-run.

---

## 7 — Validation 7: FIQ entry creation dry-run (V6)

**What:** Validate parbaughs-founder-input-triage skill (P11).

**Setup:**
- Create synthetic Founder-needs-input question (e.g., "Should the trophy emblem default include a brass-on-chalk treatment for the platform-wide trophies?")

**Validation:**
- Invoke parbaughs-founder-input-triage
- 5-question triage walked through
- Triage decision documented (blocking vs non-blocking)
- FIQ entry created per template
- Plain English summary produced
- Entry written to `.claude/state/founder_input_queue.json`

**Pass criteria:**
- All template fields populated correctly
- Provisional default is concrete + has rationale
- Minimum 2 alternatives considered
- Priority calibrated correctly
- Plain English summary is Founder-readable

**Failure handling:** If template fields incomplete or triage skipped, skill refinement needed.

---

## 8 — Validation 8: Deep research artifact dry-run (V6)

**What:** Validate parbaughs-deep-research skill (P12).

**Setup:**
- Create synthetic architectural decision requiring research (e.g., "Should we adopt react-query for data fetching in HQ Web, or stick with direct Firestore listeners?")

**Validation:**
- Invoke parbaughs-deep-research
- 5-step methodology executed:
  - Step 1: Question framed
  - Step 2: Minimum 3 independent sources surveyed
  - Step 3: Comparison matrix built with minimum 2 options, all cells filled
  - Step 4: Fundamentals validation per option
  - Step 5: Fault tolerance + revert plan
- Research artifact written to `.claude/research/<ship-id>/<decision>.md`
- Critic pre-flight audit completes

**Pass criteria:**
- Artifact follows template
- Sources are independent (not citing each other)
- All matrix cells filled
- Failure modes documented (minimum 3)
- Rollback steps concrete
- Critic audit: APPROVED

**Failure handling:** If artifact is incomplete or sources are incestuous, skill anti-pattern catalog applied. Re-run.

---

## 9 — Validation 9: Heartbeat cycle dry-run (V7)

**What:** Validate heartbeat cron cycle end-to-end.

**Setup:**
- Trigger heartbeat cycle manually via GitHub Actions `workflow_dispatch`
- (Cron schedule disabled during dry-run to prevent normal cycles from interfering)

**Validation:**
- Cycle lock acquired
- Pre-flight checks pass
- All 6 heartbeat activities run:
  1. Bug Triage Listener scan
  2. Critic spot-check
  3. Performance Agent benchmark
  4. Wellness observance audit
  5. FIQ queue health check
  6. Session journal completeness audit
- Budget watchdog respected (cycle completes well under 40k tokens, 30 min)
- Heartbeat log entry written to `.claude/state/heartbeat/<date>.log`
- Session journal entries (START + END) written
- Cycle lock released
- cycle-history.json updated with outcome

**Pass criteria:**
- All activities completed cleanly
- Output substantive, not skeleton
- State writes are atomic
- No errors in GitHub Actions logs

**Failure handling:**
- Single failure → debug + retry
- Repeated failures → halt cron enablement until root cause resolved

---

## 10 — Validation 10: Proactive cycle dry-run (V7)

**What:** Validate proactive cron cycle end-to-end.

**Setup:**
- Trigger proactive cycle manually via GitHub Actions `workflow_dispatch`
- Ensure recent ships exist for scanning

**Validation:**
- Cycle lock acquired
- All proactive activities run:
  1. Bug pattern analysis
  2. UI polish scan (Lane 1)
  3. Performance optimization scan (Lane 3)
  4. Design system extension scan (Lane 4)
  5. Proposal queue assembly
- Critic quality-bar pre-review runs on all proposals
- Proposal queue file written to `.claude/state/proactive-proposals/<date>.md`
- Queue follows `PROACTIVE_PROPOSAL_QUEUE_TEMPLATE.md` structure
- Founder notification logged (mechanism documented in CRON_CONFIGURATION.md)
- Session journal entries written
- Cycle lock released

**Pass criteria:**
- Queue file is well-formed
- Each proposal has all required fields
- Critic logged pre-review for each proposal
- Lane categorization is correct
- No scope violations (HALT item 19)
- Volume within target range (10-15 proposals)

**Failure handling:**
- Scope violations → review PROACTIVE_IMPROVEMENT_PROTOCOL adherence
- Quality bar misses → strengthen Critic checklist
- Volume way off target → calibration needed

---

## 11 — Dry-run summary report

After all 10 validations pass, generate summary:

```markdown
# Wave Zero Dry-Run Report — <date>

## Validation outcomes

| # | Validation | Outcome | Notes |
|---|-----------|---------|-------|
| 1 | Cross-browser smoke (48 scenarios) | PASS | All scenarios pass |
| 2 | Pre-flight audit dry-run | PASS | Critic detected planted issue |
| 3 | Decision bubble dry-run | PASS | All voters contributed, Plain English summary clean |
| 4 | Goal-completion-verify dry-run | PASS | Caught missing Caddy Notes sub-goal |
| 5 | Rate-limit halt dry-run | PASS | Atomic operation completed, state recoverable |
| 6 | Wellness checkpoint dry-run | PASS | Substantive output, honest reflection |
| 7 | FIQ entry creation dry-run | PASS | Template complete, Founder-readable |
| 8 | Deep research artifact dry-run | PASS | Independent sources, matrix complete, fault tolerance documented |
| 9 | Heartbeat cycle dry-run | PASS | All 6 activities clean, state writes atomic |
| 10 | Proactive cycle dry-run | PASS | Queue well-formed, scope adherence verified |

## Disposition

ALL VALIDATIONS PASSED. Orchestration team approved for autonomous operation with cron enabled.

Cron cycles will begin on next scheduled fire after this report is committed.

## Founder ratification

- Date: <YYYY-MM-DD>
- Signed: Founder

```

Commit this report to `docs/agents/governance-v7/WAVE_ZERO_DRY_RUN_REPORT_<date>.md`.

---

## 12 — What happens after pass

1. Dry-run report committed
2. Cron-paused.json removed (if it existed during dry-run)
3. Cycle-config.json set with all cycles enabled
4. Memory locked: "Wave Zero Dry-Run passed YYYY-MM-DD. Orchestration team agents-loose with cron operational."
5. First scheduled cycle fires per cron schedule
6. Founder shifts to retrospective-reviewer posture

---

## 13 — What happens after any failure

1. Failure logged in dry-run journal
2. Root cause analysis (which validation, what specifically failed)
3. Governance amendment OR skill refinement OR code fix
4. Re-run failed validation
5. Continue with remaining validations
6. All 10 must PASS before cron enables

Repeated failures across multiple attempts → governance v8 work scoped to address systemic issues.

---

## Cross-references

- `WAVE_ZERO_DRY_RUN.md` (original v4 doc this extends)
- `HEADLESS_OPERATION_PROTOCOL.md`
- `PROACTIVE_IMPROVEMENT_PROTOCOL.md`
- `PROTOCOLS_v7_ADDENDUM.md` P14 + P15
- All v6 protocols (P11, P12, P13)

---

*Document authored 2026-05-12. Apply at consolidation as extension to existing WAVE_ZERO_DRY_RUN.md.*
