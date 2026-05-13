# parbaughs-founder-input-triage

> **Skill purpose:** Triage Founder-needs-input moments cleanly. Decide blocking vs non-blocking. Draft FIQ entries that Founder can actually act on. Default to forward motion.
> **Owner:** Any agent identifying a Founder-input moment. Orchestrator tie-breaks if disputed.
> **Related protocol:** P11 (Founder Input Queue Triage Discipline)
> **Related docs:** `FOUNDER_INPUT_QUEUE.md`

---

## When to invoke this skill

Use when:
- Agent encounters a question requiring Founder direction
- Need to decide: halt all work, or queue + continue?
- Need to draft a Founder-readable FIQ entry
- Critic challenges an existing triage decision

Do NOT use for:
- Decisions Critic + Engineer can resolve together (just decide)
- Decisions answered by locked governance (apply governance, no Founder needed)
- Routine work where bubble vote reaches consensus

---

## 5-question triage checklist

Run this BEFORE deciding to queue or halt:

**Q1. Is the answer in locked governance somewhere?**
- Re-read PROTOCOLS, ship Vision, design specs, locked memory entries
- If yes → apply governance, NO queue needed
- If no → continue triage

**Q2. Can Critic + Engineer resolve together?**
- Run a quick decision bubble if helpful
- If bubble reaches 4/5 vote OR clear consensus → decide internally
- If split or genuinely needs Founder direction → continue triage

**Q3. Does this block ALL parallel ships in current wave?**
- Check: are other ships unaffected? Can other work continue?
- If unaffected ships exist → NON-BLOCKING (proceed to Q4)
- If all blocked → BLOCKING (halt per HALT_CRITERIA item 14, create FIQ priority=critical)

**Q4. Is there a reasonable provisional default?**
- Conservative default: easiest to reverse, aligned with locked governance
- If yes → queue + apply default + continue current ship work
- If no → pause current ship; pivot to other parallel work; queue priority=high

**Q5. Is the answer cheaply reversible?**
- If yes (e.g., visual choice, copy edit, naming) → priority=low/medium
- If no (e.g., architecture, data model, compliance) → priority=high; prioritize Founder check-in

---

## Decision tree (visual)

```
Question raised
  │
  ├─ Q1: In locked governance? → YES → apply, no queue
  │                              NO → continue
  │
  ├─ Q2: Bubble can decide? → YES → decide, no queue
  │                           NO → continue
  │
  ├─ Q3: Blocks ALL parallel? → YES → HALT + FIQ priority=critical
  │                             NO → continue (non-blocking)
  │
  ├─ Q4: Reasonable default? → YES → queue + apply default + continue
  │                            NO → pause this ship; pivot; queue priority=high
  │
  └─ Q5: Reversibility?
      ├─ Cheaply reversible → priority=low/medium
      └─ Not reversible → priority=high
```

---

## FIQ entry template (paste-ready)

```yaml
- id: FIQ-{NNN}
  raised_at: {ISO 8601 UTC NOW}
  raised_by: {AgentName}
  ship: {ShipID or "platform"}
  blocking: {true|false from Q3}
  category: {design|scope|data|external_dependency|governance|other}
  priority: {low|medium|high|critical from Q5}
  question: |
    {One sentence question. Concrete. Answerable.}
  context: |
    What's known:
    - {fact 1}
    - {fact 2}
    
    What's unknown:
    - {gap 1}
    - {gap 2}
    
    What can proceed without answer:
    - {parallel work that continues}
    
    What's blocked by answer:
    - {scope of impact}
  proposed_default: |
    Default action: {what we'll do if Founder doesn't answer by next check-in}
    Rationale: {why this default}
  alternatives_considered:
    - {option A: description + tradeoffs}
    - {option B: description + tradeoffs}
    - {option C: description + tradeoffs (if applicable)}
  decision_bubble_outcome: |
    {Vote summary if bubble was run. Plain English summary of agent reasoning. "N/A" if no bubble.}
  founder_response: null
  founder_response_at: null
  resolved_at: null
  ratification_artifact: null
```

---

## Plain English check-in summary template

For Plain English Translator to format batch check-ins:

```markdown
# Founder Check-In — {Date}

## Summary
- {N} entries awaiting Founder
- {N} critical (need immediate decision)
- {N} stale (>14 days waiting)

## Critical (decide now)
### FIQ-XXX [ship]
**Question:** {plain English}
**What we did:** {provisional default applied}
**Why we ask:** {1-2 sentence rationale}
**Options if you want different:**
- A: {brief}
- B: {brief}
**Decide:** Accept / Override / Defer

## High priority (decide this session)
{same format}

## Medium priority (decide if time)
{same format}

## Stale (>14 days waiting)
{same format with raised-at date and "still waiting" note}

## Auto-resolved since last check-in
- FIQ-XXX: brief summary + why auto-resolved
```

---

## Anti-pattern catalog

### Anti-pattern 1: Queueing trivia

❌ "FIQ-005: What color should the disband button be?"

If Critic + UI Polisher can decide (design system has claret for destructive), just decide. Don't waste Founder time on choices any competent agent can make.

✅ Better: Apply design system; no queue needed.

---

### Anti-pattern 2: Queueing as procrastination

❌ "Let's queue this and wait for Founder before we continue."

If non-blocking + reasonable default exists, work continues with default. The queue is for batch Founder review, not for stalling agent work.

✅ Better: Apply default, continue work, surface at next check-in.

---

### Anti-pattern 3: Priority inflation

❌ Every FIQ entry labeled `priority: critical`.

Erodes signal value. If every question is critical, none are.

✅ Calibration:
- `critical` — blocks all parallel work
- `high` — blocks current ship; affects future ships
- `medium` — current ship can proceed with default; ratify later
- `low` — purely future-state decision; no current ship affected

---

### Anti-pattern 4: Vague provisional defaults

❌ "Default: figure it out as we go."

Defaults must be concrete and actionable. If you can't articulate the default, you can't actually continue work.

✅ Better: "Default: use chalk background per design system Part 1 § 2.4 since no specific direction is locked. Conservative choice; trivially reversible if Founder wants different."

---

### Anti-pattern 5: Single-option matrix

❌ alternatives_considered: only one option listed.

If only one option was considered, you didn't actually do P12 extended thinking. Re-run.

✅ Better: minimum 2 options, ideally 3+. "Status quo / do nothing" is always a valid option.

---

### Anti-pattern 6: Queue stacking on one ship

5+ FIQ entries on a single ship indicates ship Vision drift, not many small questions.

✅ Better: Halt per HALT_CRITERIA. Escalate ship Vision review to Founder. Don't paper over Vision gaps with stacked FIQ entries.

---

## Skill self-check before submitting FIQ entry

Before writing the entry, confirm:

- [ ] Q1-Q5 triage actually walked through (not skipped)
- [ ] Question is one sentence, concrete, answerable
- [ ] Context distinguishes "known" from "unknown" from "blocked vs proceeds"
- [ ] Provisional default is concrete + has rationale
- [ ] Minimum 2 alternatives considered
- [ ] Priority matches Q3+Q4+Q5 outcomes
- [ ] Category is one of the 6 (not invented)
- [ ] If decision bubble ran, outcome is summarized
- [ ] Entry is Plain English Translator-friendly (low jargon)

If any unchecked, revise before submitting.

---

## Performance review

Self-review cadence: every 10 FIQ entries you create.

Review questions:
1. Did Founder accept your provisional defaults? (Acceptance rate >70% suggests good calibration)
2. Did Founder override any priorities? (Frequent overrides suggest priority calibration drift)
3. Did any entries auto-resolve? (Auto-resolve rate >30% suggests over-queueing)
4. Did any entries get marked stale? (Stale entries suggest poor Founder readability)
5. Did Critic ever challenge your triage? (Successful challenges suggest blocking-vs-non-blocking miscalibration)

Log review outcomes per `SKILL_PERFORMANCE_REVIEW.md` discipline.

---

*Skill v1.0 — authored 2026-05-12 as part of governance v6.*
