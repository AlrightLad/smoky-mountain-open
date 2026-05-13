# HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md — Item 13 Addendum

> **This file represents the addition of item 13 to the existing HALT_CRITERIA explicit halt list.** Apply by inserting item 13 into the Hard guardrails section (after item 12 — trial setups). The full HALT_CRITERIA document otherwise unchanged.

---

## Updated Hard guardrails section

Replace the existing items 8-12 section with the version below. Adds item 13 — Rate Limit Halt.

### Hard guardrails (vote/collaboration cannot override)

8. **Anything modifying production data without revert path** — halt regardless of vote
9. **Anything affecting auth, security, or Firestore rules** — halt regardless of vote
10. **Anything that would expose member data beyond intended visibility** — halt regardless of vote
11. **Anything that would commit a vendor bill within 30 days without prior Founder approval** — halt regardless of vote
12. **Trial setups of any kind** — halt regardless of vote (see Trial Setup Hard Rule)
13. **Rate limit threshold breach (90% usage)** — pause regardless of operation per RATE_LIMIT_DISCIPLINE.md

If a situation hits any of items 1-13, halt immediately. Do not vote, do not continue, do not infer. Escalate to Founder per applicable item (rate-limit pauses auto-resume on reset; other halts escalate to Founder synchronously).

---

## New section to add — Rate Limit Halt detail

Add this section after the "Trial Setup Hard Rule" section. Contains the rate-limit-specific halt mechanics.

### Rate Limit Halt (item 13)

Rate limit halts are operationally different from other halt criteria — they don't require Founder synchronous response, they resolve automatically when rate limit resets. But they ARE halts per discipline: agent stops cleanly, captures state, resumes when conditions allow.

**Activation:** when API rate limit usage reaches 90% of either token budget or request quota (whichever breaches first)

**Behavior:**

- Current atomic operation completes (file write, commit, tool call — never abandoned mid-execution)
- No new operation starts after current atomic operation completes
- State checkpoint written to `.claude/state/last-verify.json` with full pause context
- Session journal entry logged per SESSION_JOURNAL.md
- Agent waits for rate limit reset (no Founder synchronous involvement required)
- On reset: agent resumes from "would_have_been_next" operation per state checkpoint

**Vote/collaboration cannot override:** the 90% threshold is mechanical, not judgment-based. No bubble can vote to "push through this once." If usage projection breaches threshold, pause.

**Cost halt still takes precedence:** if an operation would breach cost-halt thresholds (per items 5 + 11), it halts per those items regardless of rate limit state. Cost halt is a higher-priority gate.

**Per RATE_LIMIT_DISCIPLINE.md and skill `parbaughs-rate-limit-aware-pause`:**

- Pre-operation self-check fires before starting work
- Continuous monitoring reads metadata on every API call
- Resume protocol verifies state consistency before continuing
- All pause + resume events logged to SESSION_JOURNAL.md

**Founder visibility:**

Rate limit pauses surface at post-push retrospective (per POST_PUSH_RETROSPECTIVE.md):
- Component 5 (Growth report) includes "rate limit pause events during period" if any occurred
- If pause exceeded 12 hours, agent surfaces at next session start so Founder is aware
- Retrospective metadata captures pause + resume timestamps for pattern recognition

**No graduation:** this halt criterion is permanent. Threshold cannot be raised even via Founder ratification — 90% is the locked operational floor.
