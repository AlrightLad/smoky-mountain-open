---
{
  "id": "PROP-010",
  "title": "Design-bot role formalization (Playwright MCP mandatory, ship-close gate)",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-14T20:30:00Z",
  "rationale": "Founder directive 2026-05-14 'DESIGN-BOT IS NOT DOING ITS JOB': backend infrastructure is solid; UI/UX is poor. Pattern across many ships: data correct, presentation broken; counts accurate, perception wrong; tests pass, page doesn't feel right; scroll exists, scroll behaves weirdly (the iter-11/iter-13 rail expand/contract bug is the canonical example). The team has a design-bot role per the three-agent model but it's been reviewing checklists, not operating the product. PROP-010 formalizes the role with mandatory Playwright MCP browser-control + a ship-close gate.",
  "scope": "Five deliverables: (1) Author docs/agents/DESIGN_BOT.md (or addendum exempt from governance-protection) codifying the role + protocol. (2) Update Critic protocol: design-bot approval is a separate ship-close gate alongside Critic. (3) Define the design-review artifact format (.claude/state/<area>/design-review-<timestamp>.md with screenshots + observations + ship recommendation). (4) Wire round-trip [design-review] block that warns when a user-facing surface modification has no recent design-review. (5) Document the design-bot user-journey discipline: scroll everything, click everything, navigate everything, assess holistically — not just 'does the test pass'.",
  "estimate": {
    "cost_tokens": 6000,
    "duration_minutes": 20,
    "risk": "low"
  },
  "files_affected": [
    "docs/agents/lessons-learned/DESIGN_BOT_role.md (governance-exempt sister doc, deferred to apply-time)",
    "tests/round-trip-test.py — [design-review] block at apply-time",
    "docs/agents/CRITIC.md or peer addendum — design-bot gate at apply-time",
    ".claude/state/lessons-learned/engineering-mindset.md — design-bot vs Critic separation addendum",
    ".claude/state/proposals/pending/PROP-010-design-bot-role-formalization.md (this file)"
  ],
  "fallback_plan": "Plan A: ship the role-formalization doc + Critic gate + round-trip block as one bundle. Plan B: ship the doc only, defer Critic/round-trip wiring to follow-on. Plan C: keep the lessons-learned doc as the authoritative source. Abandon: 'design-bot role' itself isn't a workable abstraction — unlikely since the three-agent model already documents it; this just makes it operative.",
  "rollback_strategy": "git revert; the role formalization is an additive practice. Without it, the team continues current (failing) approach. With it, design-bot blocks ship-close on UX issues Critic alone can't catch.",
  "round_trip_coverage": "New [design-review] block at apply-time: when a user-facing surface mtime > most recent .claude/state/<area>/design-review-*.md mtime, round-trip warns (similar to user-context-gate). Failures don't auto-block (heavyweight check) but Critic protocol gate at ship-close is hard.",
  "depends_on": ["PROP-006", "PROP-007", "PROP-008", "PROP-009"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 2500,
  "status": "pending",
  "operating_status": "Design-bot protocol operative immediately per Founder directive. This proposal codifies it for the next agent loop."
}
---

# PROP-010 — Design-bot role formalization

Authored 2026-05-14 per Founder directive "DESIGN-BOT IS NOT DOING ITS
JOB".

## Why this proposal

Founder named the pattern explicitly:

> "Backend infrastructure is solid. UI/UX is poor. Pattern across many
> ships: data correct, presentation broken; counts accurate, perception
> wrong; tests pass, page doesn't feel right; scroll exists, scroll
> behaves weirdly (rail expands/contracts based on scroll position —
> current bug)."

The rail expand/contract bug (iter 11-13) is the canonical case. The
team shipped iter 11 with JS that recomputed rail max-height on every
scroll event, causing visible expand/contract as the user scrolled.
Measurement passed (scrollHeight, max-height value, isIntersecting).
Operation failed (jittery rail feel).

A design-bot reviewing the SHIPPED page in real Chrome — actually
scrolling it, watching the rail respond — would have caught the
jitter immediately. Sentinels wouldn't. Critic alone, looking at
correctness signals, wouldn't.

## The design-bot role (formalized)

Per the three-agent model, design-bot is a sub-role of Agent 3
focused on visual + interaction quality. It is distinct from Critic
(technical correctness):

| Role | Gate | What it asks |
|---|---|---|
| Critic | Technical correctness | "Is the data accurate? Are tests green? Do edge cases handle?" |
| Design-bot | Visual + interaction quality | "Does it feel intentional? Does it jitter? Is the visual hierarchy correct?" |

Both must approve for user-facing ship-close. Either can block.

## Design-bot protocol (mandatory)

For every user-facing surface ship-close:

1. **Open the page via Playwright MCP browser-control (REAL Chrome,
   real interaction, not headless).**
   - Use `channel: "chrome"` so rendering matches user environment
   - Use headed mode so behavior matches user environment

2. **Perform the user journey for the feature:**
   - Scroll through everything scrollable (slow + fast + reverse)
   - Click everything clickable (legend, rail items, nav, buttons)
   - Navigate between pages via nav links
   - Test responsive: resize viewport 1920 / 1440 / 1280
   - Test interaction edge cases: rapid scroll, click during transitions

3. **Assess as a designer would:**
   - Does it feel intentional?
   - Does it feel polished?
   - Does anything jank, flicker, or behave inconsistently?
   - Does the visual hierarchy guide the user correctly?
   - Are interactions discoverable?
   - Is information density appropriate?
   - Do colors, spacing, typography compose coherently?

4. **NOT just "does the test pass" — "does this feel like a designed
   product".**

5. **Author design-review artifact:**
   - Path: `.claude/state/<area>/design-review-<timestamp>.md`
   - Includes: screenshots of the user journey at each interaction point
   - Includes: specific observations (positives + negatives)
   - Includes: ship recommendation — `approve` / `request fixes` / `block`

6. **Ship-close gate (both required):**
   - Critic verdict: approved
   - Design-bot verdict: approved
   - Either blocks → ship blocks

## Anti-patterns the protocol rules out

- "Design-bot signed off because all sentinels passed" — wrong gate
- "Captured screenshot at scroll position N" — measurement, not operation
- "Design-bot didn't catch this because the test didn't cover it" — design-bot is required to assess BEYOND tests
- "Design-bot reviewed the spec" — design-bot reviews the SHIPPED PAGE
- "Design-bot used the design-system page to verify components" — design-bot uses the ACTUAL FEATURE PAGE

## How design-bot is distinct from PROP-009 click-through audit

| Capability | PROP-009 user-journey-audit (automated) | PROP-010 design-bot (semi-automated) |
|---|---|---|
| Scrolls everything | ✓ programmatic | ✓ + qualitative assessment of feel |
| Clicks everything | ✓ verifies state change | ✓ + assesses whether it FELT intentional |
| Perceptual color check | ✓ HSL delta | ✓ + assesses overall visual hierarchy |
| Output | transcript.md | design-review-<ts>.md with recommendation |
| Gate type | sentinel (pass/fail) | judgment (approve/request/block) |
| Catches structural issues | ✓ | ✓ |
| Catches "doesn't feel right" | ✗ (no judgment layer) | ✓ |

PROP-009 is the necessary-but-not-sufficient automated layer.
PROP-010 is the judgment layer on top.

## Three options evaluated (per AMD-015)

### Option A — Formalize design-bot as separate gate (CHOSEN)

Design-bot is a peer to Critic at ship-close. Both must approve.
Design-bot is the agent (still Agent 3) operating in a different
mode — explicitly judgment-oriented, explicitly using real Chrome,
explicitly empowered to block.

### Option B — Roll design-bot into Critic

Don't separate. Critic's role expands to include UX judgment.

**Dismissed** because Critic and design-bot ask fundamentally different
questions. Mixing them dilutes both. A Critic also doing design-bot
work tends to skip the judgment layer ("tests pass, ship it") when
under token pressure.

### Option C — Skip formal design-bot; mandate user-journey audit

Treat PROP-009 as sufficient. Drop the judgment layer.

**Dismissed** because automated audits caught the perceptual color
collision but DIDN'T catch the rail jitter (jitter isn't a measurable
RGB/dimension/position — it's a felt behavior). Need the judgment
layer.

## Decision: Plan A = Option A

Plan A: **Option A — Design-bot as separate ship-close gate**.

Rationale:
- Founder named the gap explicitly
- The rail jitter is the proof: automated tests pass + Critic
  approved + Founder saw broken
- Separating Critic + design-bot preserves both gates
- Real-Chrome interaction via Playwright MCP makes the design-bot
  protocol operative

## Path to apply

Once Founder approves:
1. Author `docs/agents/lessons-learned/DESIGN_BOT_role.md`
   (governance-exempt subdir)
2. Move PROP-010 from approved/ to applied/
3. Add round-trip [design-review] block (warns on stale review)
4. Update CRITIC.md per design-bot gate (governance-protection
   bypass justified by this proposal)
5. Document in CLAUDE.md the user-facing-ship workflow:
   > "Before declaring any user-facing ship complete:
   >  1. Critic approval (technical correctness)
   >  2. Design-bot approval (visual + interaction quality)
   >  3. Both verdicts recorded as artifacts; either blocks ship"

## Forward implications

Adding the design-bot gate increases per-ship verification cost.
That's the point: ship cost was understated previously by skipping
the judgment layer. The actual ship cost includes "does this feel
right?" — that work has to be done somewhere; better at agent time
than at Founder-review time.

## Operating status

Design-bot protocol operates immediately. This proposal codifies it
for the next agent loop. Iter 13 (this ship) is the first to apply
the protocol — design-review artifacts authored alongside the
PROP-010 + iter-13 code changes.

---

## Approval metadata

```
status: approved
approved_at: 2026-05-19T03:00:00Z
approved_by: founder-blanket-approval-2026-05-19
disposition: STILL-RELEVANT — content ratified. NOTE: approval does NOT mean ship-now. Closure is gated by Phase G design-batch per spec D39 ("PROP-010 + design-bot APPROVE on every dashboard surface"). Founder accepts the proposal's content; team ships when Phase G closes. parbaughs-design-bot.md skill already operative; remaining gap is docs/agents/DESIGN_BOT.md formalization.
triage_source: .claude/state/task-queue/founder/proposal-triage-2026-05-19.md Batch A row 2.
```
