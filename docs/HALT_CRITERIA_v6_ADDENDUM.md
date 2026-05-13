# HALT_CRITERIA_v6_ADDENDUM.md

> **Status:** Governance v6 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Four new halt items (14-17) to be appended to existing `HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md`. Apply at consolidation.

---

## Item 14 — Blocking Founder Question

**Trigger condition:** Question raised that prevents progress on EVERY active ship in current wave, with no reasonable provisional default.

**Halt action:**
1. Complete current atomic operation (no mid-write halt)
2. Update `.claude/state/last-verify.json`
3. Log halt to `SESSION_JOURNAL.md` as `[HALT-BLOCKING-FIQ]`
4. Create FIQ entry per `FOUNDER_INPUT_QUEUE.md` § 7.1:
   - `blocking: true`
   - `priority: critical`
   - Full context + alternatives + proposed default (if any salvageable default exists)
5. Surface to Founder via dedicated escalation path (not just queue)
6. All agents pause until Founder responds

**Resume condition:** Founder response received + applied + Critic verifies application correctness.

**Examples:**
- "What's the production deployment target? Need to know before we set up CI/CD." (Wave 1 ship dependent)
- "Should we adopt the new auth model that requires breaking change to existing data?" (Architecture-locking)
- "Cost threshold breached — continue or halt?" (Founder cost-discipline)

---

## Item 15 — Non-blocking Founder Question (CLARIFYING ITEM)

**This is NOT a halt criterion.** Documented here for clarity to prevent agents from erroneously halting on non-blocking questions.

**Trigger condition:** Question raised that:
- Affects current ship but other parallel ships can proceed, OR
- Has reasonable provisional default that allows current ship to continue

**Action (NOT halt):**
1. Apply triage per `FOUNDER_INPUT_QUEUE.md` § 2.2
2. Create FIQ entry with provisional default
3. Continue work
4. Surface in next Founder check-in batch

**Why this is documented in HALT_CRITERIA:**
Agents trained on conservative halt behavior may default to halting whenever Founder input could be useful. This item explicitly says: do NOT halt for non-blocking questions. Queue + continue.

---

## Item 16 — Wellness Halt

**Trigger condition:** Agent declares need for self-healing per `AGENT_WELLBEING_PROTOCOL.md` § 2.1:
- Drift detected during wellness checkpoint
- Agent self-declares uncertainty about current understanding
- Critic flags suspected context drift
- Decision bubble splits 50/50 with no clear path
- FIQ resolution reveals misalignment with what agent had been doing

**Halt action:**
1. Complete current atomic operation
2. Log halt to journal as `[HALT-WELLNESS]`
3. Run 5-step self-healing pass per `AGENT_WELLBEING_PROTOCOL.md` § 2.2
4. Surface any drift to FIQ per protocol
5. Resume with corrected understanding logged

**Resume condition:** Self-healing pass complete + first post-healing output verified by Critic.

**Penalty discipline:**
- Critic does NOT penalize agents who declare self-healing
- Critic DOES penalize agents who SHOULD have declared but didn't (caught later via audit)
- Self-doubt is a useful signal — better caught early than late

**Examples:**
- Engineer mid-ship realizes they've been applying outdated governance assumption
- Critic in audit notices their own audit checklist seems incomplete vs locked governance
- Performance Agent suspects their last benchmark result contradicts a prior recommendation

---

## Item 17 — Rest Cycle

**Trigger condition:** Per `AGENT_WELLBEING_PROTOCOL.md` § 3.1:
- A complex ship closes (Critic-flagged complexity = high/critical)
- 3 consecutive ships in same wave with this agent's participation
- Wave boundary crossed (W1 → W2, etc.)
- Founder mandates rest cycle

**Not a halt for ALL agents** — only for the specific agent observing rest. Other agents continue.

**During rest cycle, the agent:**
- Does NOT start new ship execution
- Does NOT accept new ship assignments
- Does NOT run decision bubbles for new work
- Does NOT write production code

**During rest cycle, the agent CAN:**
- Run skill performance review
- Review recently-amended governance
- Conduct deep research on upcoming complex ships
- Run wellness checkpoint
- Catch up on session journal entries

**Duration:** minimum 1 session pause, maximum 1 wave-boundary worth (typically 1-3 sessions).

**Founder override:**
- Founder CAN override for production-critical work
- Override logged with reason
- Rest cycle owed afterward; Founder cannot permanently skip

**Resume condition:** Rest duration elapsed.

---

## Numbering reference

Existing halt items (locked v4/v5):
1. Pre-flight audit failure
2. State file corruption
3. Test failure cascade
4. Production deploy failure
5. Cost threshold breach
6. Security audit flag
7. Data integrity audit flag
8. Schema migration failure
9. Cross-wave dependency violation
10. Locked memory violation
11. Sanity halt (catch-all unsafe state)
12. Critic veto on Engineer output
13. Rate-limit threshold (90% usage)

New v6 halt items:
14. Blocking Founder Question (NEW)
15. Non-blocking Founder Question (CLARIFYING — not a halt; documented to prevent erroneous halts)
16. Wellness halt
17. Rest cycle

---

## Cross-references

- `FOUNDER_INPUT_QUEUE.md` (items 14-15)
- `AGENT_WELLBEING_PROTOCOL.md` (items 16-17)
- `PROTOCOLS_v6_ADDENDUM.md` P11/P12/P13
- `SESSION_JOURNAL.md` (halt logging types)

---

*Document authored 2026-05-12. Apply to HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md at consolidation.*
