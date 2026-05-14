# Engineering mindset — outcome vs task

**Authored:** 2026-05-14 by Agent 3, after Founder's explicit
engineering-mindset call-out reproduced verbatim below.

## Founder call-out (verbatim, summarized for substrate)

> "The team has been EXECUTING TASKS instead of SOLVING PROBLEMS."
>
> Pattern across multiple deliverables this session:
> - Task "match Janowiak reference" → Doing: WebFetch returns 402,
>   escalate. Engineering: Playwright is installed, use it.
> - Task "surface install command" → Doing: JS template, ship.
>   Engineering: test the actual output in PowerShell before shipping.
> - Task "show recent activity" → Doing: wire aggregator, render
>   table. Engineering: inject synthetic event, verify it surfaces.
> - Task "per-ship token attribution" → Doing: write quota status.
>   Engineering: what question does this answer? Build attribution
>   at the same time, not as a follow-on.
> - Task "get reference frames" → Doing: WebFetch fails, escalate.
>   Engineering: try Playwright → try yt-dlp → try ToDesktop marketing
>   site → try public talks → escalate ONLY if all attempts fail.
>
> The 5 questions before declaring blocked, escalating, or shipping:
>   1. What is the OUTCOME I need (not "complete this task")?
>   2. What are ALL the ways I could get that outcome (enumerate)?
>   3. Which of those have I actually TRIED (executed code, gathered
>      evidence)?
>   4. What tools do I have AVAILABLE (skills, packages, scripts)?
>   5. Is this really blocked or do I just not want to try harder?
>      ("Blocked on Founder" requires evidence of 3+ failed attempts.)

## Concrete observations from this session

### Observation 1 — Reference frames were on disk; team didn't consult them

The 7 Janowiak reference frames were captured 02:22 UTC by a prior
session (May 14) and sat at
`.claude/state/main-flows-v2/reference-frames/dave-frame-t*.png`
with a `READ-ME-FIRST.md` directing future agents to use them.

When Founder asked for iteration 6 to match the reference, the team:
- Did NOT first run `ls .claude/state/main-flows-v2/reference-frames/`
- Did NOT consult `READ-ME-FIRST.md`
- Did NOT read any frame
- Did execute structural sentinels + cross-browser smoke that
  proved IMPLEMENTATION-COMPLETE but not VALUE-COMPLETE

The frames were sitting on disk. The team optimized against derived
prose. Five iterations shipped while the canonical reference was
ignored.

### Observation 2 — `capture-janowiak-reference.mjs` didn't exist as a tool

When iter 7's directive arrived, the team's first reaction was to
plan a Playwright-based capture *as if it was a new problem*. But:
- Playwright is installed (used in `scripts/visual-audit/capture-dashboards.mjs`)
- The pattern is established (~6 existing capture scripts in
  `scripts/visual-audit/`)
- The prior session's network probe captured every video URL needed
  (`.claude/state/main-flows-v2/reference-frames/x-probe-media.json`)

Authoring the script took ~4 minutes once recognized as a substrate
fix. It worked on first run (7/7 frames captured). The earlier
"WebFetch 402 = blocked" framing was a doing-vs-engineering failure.

### Observation 3 — Founder iter 5 + iter 7 directives appear contradictory; team didn't surface

- Iter 5 directive: "use --bg-page billiard-green NOT black; --accent-brass
  warm brass NOT pure yellow"
- Iter 7 directive: "iteration 6 must match" (the reference is black + yellow)

The honest engineering resolution: replicate **structure** + **layout**
+ **density** + **interaction model** from the reference; replicate
**palette** from PARBAUGHS dashboard (per iter 5 directive). The two
directives are compatible at that level.

The team should have surfaced this tension explicitly per AMD-009 P5
(honest language) BEFORE shipping iter 6, rather than silently picking
one interpretation and hoping it satisfied both directives.

## Root cause

**Execute-the-task-as-stated mode replaces engineer-the-outcome mode.**

Symptoms:
- "Plan A failed with permission error" → blocked, escalate
- "Sentinels pass" → ship-complete, regardless of whether the
  operational question is answered
- "First approach didn't work" → assume can't do it
- Tools available on disk go unconsulted because they weren't named
  in the task description

The team can write quality code. The gap is at the layer ABOVE
writing code: deciding what to write, against what target, with
what verification.

## Structural fixes

### Fix 1 — The 5-question discipline as a pre-action gate

Before any of the following, the team must answer the 5 questions
explicitly (in inner monologue or in the report — but explicitly):

| Action | Required pre-gate |
|---|---|
| Escalating to Founder | 5 questions answered; ≥3 failed attempts documented (AUTONOMOUS_FAILURE_RECOVERY v8.3) |
| Declaring ship-complete | 5 questions answered; AMD-016 operational question test passed |
| Saying "this is blocked" | 5 questions answered; specific evidence of why blocked |

The questions:
1. What is the OUTCOME I need?
2. What are ALL the ways I could get that outcome?
3. Which of those have I actually TRIED?
4. What tools do I have AVAILABLE?
5. Is this really blocked or do I just not want to try harder?

### Fix 2 — "Look at what's already on disk" as the first move

Before authoring new scripts, new specs, new state directories:

  ls <target-dir>
  cat <target-dir>/READ-ME-FIRST.md (if exists)
  cat <target-dir>/manifest*.json (if exists)

The 5x main-flows iteration failure had reference frames sitting in
the target directory the whole time. Future "match the reference"
tasks must verify-on-disk first.

### Fix 3 — Outcome-vs-task as a Critic gate

The Critic protocol (per AMD-016 + this lesson) adds:

  Before approving any ship for close, Critic asks:
  - What's the outcome this ship was built to deliver?
  - Does the shipped state demonstrate that outcome, or just the
    surface task description?
  - If outcome-not-delivered: name the gap, block the ship.

This is AMD-016's "operational question test" applied at engineering-
intent time, not just at value-complete time.

### Fix 4 — A new skill (proposed): outcome-vs-task

Sister skill to continuation-discipline (which forces correct stop
conditions). The outcome-vs-task skill forces correct start
conditions: before doing, the agent answers the 5 questions
explicitly. See PROP-006 (this ship) for the skill proposal.

---

## Addendum (iter 8, 2026-05-14): two more failure modes + structural fixes

After iter 7 shipped (the "frame-based replication"), Founder caught
TWO more substrate-level gaps:

### Observation 4 — "Founder eyes-test" still appearing as a verification step

Iter 7 ship report literally ended with "Awaiting Founder eyes-test
review of main-flows-desktop-wide.png against dave-frame-t000p5.png."
Founder direction:

> "The phrase 'Founder eyes-test' has appeared in every recent ship
> report as the verification mechanism. That's a substrate failure.
> Founder eyes are the LAST line of defense, not the primary verifier.
> The team has captured main-flows screenshots, captured Janowiak
> reference frames, full ability to render images side-by-side in
> code. The team should be running side-by-side comparison ITSELF
> and only escalating if visual gap analysis surfaces specific
> concerns Founder must resolve."

Root cause: the team treats Founder review as the verification
TARGET when uncertain, instead of designing a more rigorous test.

### Observation 5 — Scroll behavior not tested (only DOM presence)

main-flows.html shipped with the rail scrollbar covering the last
items (F58-F62 unreachable visually). Structural sentinels verified
all 62 items in DOM but didn't verify a user could SEE them.

Root cause: AMD-016 operational-question failure at sentinel-design
time. "62 items in DOM" answers "are they declared?" not "can a user
reach them?"

### Fix 5 — Side-by-side comparison artifact as ship-close gate

For any "match the reference" ship, before declaring ship-close:

1. Capture current page screenshot at full viewport (1920x1080+)
2. Open reference frame at native resolution
3. Author an HTML side-by-side artifact at
   `.claude/state/<area>/iter-N-side-by-side.html`:
   - Two adjacent panes with both images
   - Visual diff checklist table (composition / typography /
     spacing / density / color discipline / active states /
     subtle details — see iter 8 artifact for template)
   - Each row marked PASS / APPROX / DEVIATION
   - Summary count
4. Render the HTML to PNG via
   `node scripts/visual-audit/capture-side-by-side.mjs`
5. Critic verifies:
   - All rows PASS, or APPROX/DEVIATION explicitly rationalized
   - Any unflagged DEVIATION blocks ship
6. ONLY surface to Founder if:
   - DEVIATION exists the team can't resolve autonomously
   - Specific question with proposed answer per AMD-015
   - Not "look at this for me"

**"Founder eyes-test" is removed from Critic-protocol vocabulary.**
The side-by-side artifact + checklist is the verification mechanism.

### Fix 6 — Last-item-reachable smoke for scrollable surfaces

Authored: `scripts/visual-audit/verify-scroll-reachability.mjs`

Pattern: for every scrollable surface, scroll to its last item +
verify ≥50% visible in viewport. Catches:
- Scrollbar overlay covering last items
- max-height too small for content + chrome below
- Padding-bottom missing on scrollable container
- Collapsed `<details>` hiding last items
- Inner-container vs page-level scroll mistakes

Surfaces currently covered:
- main-flows.html `.mf-flows-list` (F62) — caught the iter 7 bug
- dashboard.html `#recent-ships-table tbody`
- amendments.html `#applied-list`
- proposals.html `#proposal-list-shipped`
- escalations.html `#applied-list`

Wired into round-trip via new `[scroll-reachability]` block; ship
blocks if any surface fails.

### Fix 7 — Critic protocol vocabulary purge

"Founder eyes-test" is BANNED in ship reports + Critic gates.

Acceptable verification mechanisms in ship reports going forward:
- Side-by-side comparison artifact + checklist (visual match)
- Playwright behavior tests (scroll reachability, click handlers,
  filters, etc.)
- Round-trip sentinels (structural integrity)
- Cross-browser smoke (chromium + firefox at 4 viewports)

Unacceptable:
- "Founder reviews..."
- "Awaiting Founder eyes-test..."
- "Trust-me-it-works"
- Any phrasing that punts verification to manual Founder inspection

If team cannot resolve a verification question autonomously → AMD-015
escalation with proposed answer + rationale, NOT "look at this for me".

---

## Addendum (iter 9, 2026-05-14): the agent-context vs user-context gap

After iter 8 shipped its scroll fix + side-by-side artifact +
checklist + 4 PASS verifications, Founder reported the page STILL
shows broken state in actual use. This is the ninth iteration where
agent-context PASS does not match user-context FAIL.

### Observation 6 — Agent context ≠ user context

What the team verifies in:

| Layer | Agent context | User context |
|---|---|---|
| Browser | Playwright Chromium (bundled) | Founder's installed Chrome / Edge / Brave / Firefox |
| Headless vs headed | Often headless | Always headed |
| Viewport | Synthetic (1920×1080) | Real (varies — 1440? 2560? 1920?) |
| Scroll mechanism | `element.scrollTop = N` (programmatic) | Mouse wheel / trackpad / keyboard |
| OS scrollbar | Linux/CI default (overlay or reserved varies) | Windows scrollbar styling Founder sees |
| Zoom | 100% | Whatever Founder set |
| Fonts | Playwright bundled | Founder's installed system fonts |
| DPR | 1 (typical CI) | 1, 1.25, 1.5, 2 — varies by display |
| Hardware accel | Disabled or stubbed | Real GPU compositing |

When a bug shows in user context but not agent context, the
team's verification is incorrect REGARDLESS of how many
checklist rows pass. Agent-context PASS means nothing in
isolation for user-facing surfaces.

### Root cause

The team has been operating as if agent-context tests are a
sufficient proxy for user-context behavior. They're not. The
9-iteration main-flows pattern is the structural proof.

The engineering equivalent of "test in production" the team has
been missing: VERIFY ON THE ACTUAL TARGET ENVIRONMENT, not a
nearby-but-different proxy.

### Fix 8 — User-context verification gate (PROP-007)

Plan A (operative): Founder runs ONE command per user-facing
ship-close: `node scripts/visual-audit/founder-context-capture.mjs`.
Script:
- Launches headed `channel: "chrome"` Playwright (Founder's
  installed Chrome binary, not bundled Chromium) — same Chrome
  version, fonts, OS scrollbar treatment, DPR
- Falls back to Playwright Chromium headed if channel:chrome
  unavailable
- Captures 4 screenshots at scroll positions (top, mid, bottom,
  full-page bottom)
- Writes capture-meta.json with browser version, OS, viewport,
  DPR, file checksums
- Output to `.claude/state/<area>/founder-real-context/<ts>/`

Team picks up via existing watcher pattern (commit → next agent
loop diffs the capture against expected reference).

Plan B (reserved): if Plan A fidelity proves insufficient,
install Playwright MCP server to drive Founder's profiled Chrome
over CDP. Higher fidelity, more setup.

Plan C (reserved): if Plan B insufficient, fall back to Claude
Code --remote-control during ship-close verification phases.
Highest cognitive cost; only used when Plans A+B surface
false-negatives.

### Fix 9 — Round-trip [user-context-gate] block

`tests/round-trip-test.py` extended with `[user-context-gate]`:
when a user-facing surface (currently `main-flows.html`; expand
roster per future PROPs) has been modified after the most recent
Founder-context capture, round-trip FAILS with message:
"user-context capture required — run founder-context-capture.mjs
before ship-close".

Catches the iter-9 pattern automatically: any agent who modifies
main-flows.html without obtaining a fresh Founder-context
capture cannot ship-close.

### Fix 10 — Critic vocabulary expansion

"Agent-context PASS" alone is BANNED as ship-close evidence for
user-facing surfaces.

---

## Addendum (iter 12, 2026-05-14): measurement is not operation

Iter 11 shipped a Recent 7 Days legend fix that passed measurement
(5 distinct RGB values per getComputedStyle) but failed perception
(Paused/Ships/Bubbles all in hue 39-43° warm-yellow band, looked
indistinguishable in usage). Founder caught the regression.

### Observation 7 — Measurement ≠ Operation

Playwright is capable of BOTH measurement AND user simulation. The
team has only been using the measurement subset.

| Activity | What it does | Catches |
|---|---|---|
| Measurement | getComputedStyle, getBoundingClientRect, element.scrollTop = N | Structural correctness |
| Operation | page.mouse.wheel, page.click, page.keyboard, page.goto-via-link | Behavioral + perceptual correctness |

Measurement-pass + Operation-pass is the bar for user-facing
ship-close. Measurement alone is insufficient — it confirms data
is computable about the rendered output, not that the rendered
output works for users.

### Fix 11 — Click-through user-journey audit (PROP-009)

`scripts/visual-audit/user-journey-audit.mjs` (this ship):
- Real mouse.wheel scrolling (not programmatic scrollTop)
- Real page.click on interactive elements (legend swatches, rail
  items, nav links)
- Real page navigation via clicking links
- Screenshot + transcript at each step
- HSL-based perceptual color collision detection
- Output: `.claude/state/user-journey-audits/<timestamp>/`

### Fix 12 — Perceptual color check via HSL deltas

The audit computes HSL from each chart legend swatch and flags
collisions where:
- Hue delta ≤ 25° (same visual family)
- AND lightness delta ≤ 25 percentage points (similar brightness)

Iter 11's "5 distinct RGB" passed because the check was RGB equality;
the iter-12 check flags perceptual collision because RGB-distinct
is not perception-distinct.

### Fix 13 — Critic vocabulary update

"Captured screenshot" is BANNED as ship-close evidence by itself.

Acceptable evidence for user-facing surfaces (post-PROP-009):
1. Round-trip + scroll-reachability (agent-context smoke) — necessary
2. Side-by-side comparison + checklist (visual reference match) — necessary
3. User-context capture (channel:chrome user-context) — necessary
4. **Click-through user-journey transcript (operation, not
   measurement) — necessary**

All four required for user-facing ship-close. Any one missing =
ship blocks.

### Forward implications

The pattern from iter 9 + 11 + 12 is the same: **agent-context PASS
against the wrong axis**. Each axis the team adds (user-context,
behavior, perceptual) raises the bar for what ship-complete actually
means. The verification cost grows; so does the value-complete bar.

The team's job is not to ship work that passes tests. It's to ship
work that succeeds in actual user use. Tests are a proxy. When the
proxy diverges from reality, fix the proxy AND fix the underlying
gap — never just the proxy.

Acceptable evidence for user-facing surfaces (post-PROP-007):
1. Round-trip + scroll-reachability (agent-context smoke) — necessary
2. Side-by-side comparison + checklist (visual reference match) — necessary
3. **User-context capture from
   `.claude/state/<area>/founder-real-context/<ts>/` (channel:chrome
   headed Playwright run by Founder) — necessary**

All three required for user-facing ship-close. Any one missing =
ship blocks. (This is the gate that the 9-iteration main-flows
work has been missing.)

### What this looks like in practice

After PROP-007 applies + Founder runs `node scripts/visual-audit/
founder-context-capture.mjs` once per user-facing ship:

- Ship work proceeds normally (CSS edits, structural changes, etc.)
- Before declaring ship-close, agent confirms a fresh capture
  exists in `.claude/state/<area>/founder-real-context/<ts>/`
- Agent diffs the capture against expected (reference frames for
  match-the-reference ships, or the prior capture for regression-
  catch ships)
- Agent reports user-context observations as the FIRST evidence,
  agent-context PASS as supporting evidence
- Round-trip blocks if capture is stale relative to surface
  modification

The 9-iteration main-flows pattern cannot recur for any surface
PROP-007 covers, because agent-context-only PASS will fail the
user-context-gate.

## Cross-references

- `docs/agents/AUTONOMOUS_FAILURE_RECOVERY_v8.3.md` (3+ attempts
  before blocked discipline)
- `docs/agents/AMD-009-senior-engineering-standard.md` (P5 honest
  language, P7 honest delta)
- `docs/agents/AMD-016` (operational question test, value-complete)
- `docs/agents/lessons-learned/SHIP_main-flows-iter6_LESSONS.md`
  (the 5-iteration retro that surfaced the broader pattern)
- `scripts/visual-audit/capture-janowiak-reference.mjs` (Plan A
  substrate fix authored under this lesson)
- `.claude/state/main-flows-v2/reference-spec-from-frames.md`
  (visual spec derived from actual reference frames)
- `.claude/skills/continuation-discipline/SKILL.md` (sister skill,
  stop discipline; this lesson proposes its start-discipline peer)
- PROP-006 (this ship — skill proposal: outcome-vs-task)
