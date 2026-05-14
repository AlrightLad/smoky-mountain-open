---
{
  "id": "PROP-012",
  "title": "Mandatory visual review protocol (amends PROP-010 design-bot)",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-14T20:55:00Z",
  "rationale": "Z.AI Vision MCP install (PROP-011 Plan B) was deferred because Z.AI is a paid subscription PARBAUGHS won't take. The team has built-in multimodal vision via the Read tool — iter 14 proved this produces a 21-row visual diff with zero new gaps surfaced. PROP-012 amends PROP-010 design-bot protocol to make the iter-14 reading discipline MANDATORY for every user-facing ship-close. Free path. No subscriptions. Just discipline.",
  "scope": "Four deliverables: (1) Amend PROP-010 design-bot protocol with the explicit visual-review reading steps that iter 14 demonstrated. (2) Update CRITIC.md / engineering-mindset with the protocol. (3) Define what 'Read both images + articulate per-element diff' means concretely so future design-bot work can't skip the discipline. (4) Document the optional future Ollama path (free local vision) if articulation-based review proves insufficient.",
  "estimate": {
    "cost_tokens": 4000,
    "duration_minutes": 12,
    "risk": "low"
  },
  "files_affected": [
    ".claude/state/proposals/pending/PROP-012-mandatory-visual-review-protocol.md (this file)",
    ".claude/state/lessons-learned/engineering-mindset.md — visual review protocol addendum",
    "docs/agents/CRITIC.md or peer addendum at apply-time — visual review gate"
  ],
  "fallback_plan": "Plan A (chosen): mandate iter-14 protocol via PROP-012. Plan B (deferred-future): if articulation-based review proves insufficient, install Ollama (free local) + Llama 3.2 Vision + Ollama MCP. Plan C (rejected): keep paid options (Z.AI, Gemini) — PARBAUGHS uses zero paid services beyond Firebase Blaze.",
  "rollback_strategy": "git revert; the protocol is additive. Reverts to PROP-010's general design-bot framing without the explicit Read-both-images mandate.",
  "round_trip_coverage": "No new round-trip block. Visual review is a Critic-protocol gate enforced at ship-close, not a sentinel. PROP-007 user-context-gate already verifies user-context capture exists; PROP-012 extends to require the design-review artifact contains articulated per-element diff.",
  "depends_on": ["PROP-010", "PROP-011"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 1500,
  "status": "pending",
  "operating_status": "Protocol operative immediately. iter 15 (this ship) applies it to dashboard.html as the second demonstration after iter 14's main-flows review."
}
---

# PROP-012 — Mandatory visual review protocol

Authored 2026-05-14 per Founder directive "Z.AI MCP — NOT INSTALLING".

## What changed since PROP-010

PROP-010 (pending) formalized design-bot as a separate ship-close
gate. PROP-011 (pending) installed Anthropic skills + documented
Z.AI MCP install path. Founder direction: Z.AI is paid, skip it.

What remains is the discipline iter 14 demonstrated: Read both
images, articulate per-element diff. PROP-012 codifies this as
mandatory.

## Mandatory protocol (operative)

For every user-facing ship-close, design-bot must perform:

### Step 1 — Capture current state

Via Playwright MCP (PROP-008) or founder-context-capture.mjs
(PROP-007):
- Real Chrome (channel:chrome where available, falls back to
  Playwright Chromium headed)
- Multiple viewports if responsive matters (default: 1920×1080;
  add 1440 + 1280 when scope warrants)
- Multiple scroll positions if the page is scrollable
- Multiple interaction states if applicable (no-flow-selected,
  flow-selected, hover, focus)

### Step 2 — Read each screenshot via Read tool

The Read tool surfaces rendered PNG content visually to the
multimodal LLM. Call `Read` on each captured screenshot. Each
Read returns visual content the agent can describe.

### Step 3 — Read reference frames or sibling pages

For "match the reference" ships: reference frames captured at
`.claude/state/<area>/reference-frames/`.

For "match the sibling pages" ships (e.g., dashboard.html consistency
with proposals.html): Read the sibling page screenshots.

For "match the design system" ships: Read design-system.html or
spec docs.

### Step 4 — Articulate per-element diff (the discipline)

In the design-review artifact:

1. **List what's in the reference** (or sibling). Forces actual
   looking. Example: "Title 'X' in display font, upper-left.
   Subtitle below. 6 colored legend dots. 6-column grid with..."

2. **List what's in the current capture.** Same depth.

3. **Compare element-by-element.** For each element:
   - ✓ MATCH — structural alignment
   - △ APPROXIMATION — visible difference, accepted given data delta
   - △ DEVIATION — visible difference, distinguish Founder-ratified
     vs unflagged
   - ✗ GAP — actual gap to fix or escalate

4. **For each ✗ GAP:** propose fix per AMD-015 with rationale, OR
   surface to Founder if it's a design-intent question.

### Step 5 — Author design-review-<timestamp>.md

Per PROP-010 format:
- Screenshots referenced or embedded
- Per-element diff table
- Explicit ship recommendation: approve / request fixes / block

### Step 6 — Ship-close gates

Both required:
- Critic verdict: approved (technical correctness)
- Design-bot verdict: approved (visual + interaction quality)
- Design-bot verdict must cite the articulated diff — not just
  "looks good"

## What 'articulated' means concretely

NOT acceptable:
- "Visually matches reference"
- "Looks clean"
- "5 distinct colors verified"

ACCEPTABLE (iter 14 template):
- "Reference: title 'ToDesktop — Architecture & Flows' in white
  upper-left, subtitle in yellow accent body text. Current: title
  'Architecture & Flows' in white chalk on green, subtitle in
  white body text. Verdict: ✓ MATCH (theme-deviated per iter 5)."

The difference: articulation FORCES the agent to actually look at
each element. Glance-and-assert is the failure mode the protocol
prevents.

## Anti-patterns the protocol rules out

- "Design-bot signed off because tests passed" — wrong gate
- "Screenshot looked fine to me" — no articulation, no diff
- "Verified via getComputedStyle" — measurement, not vision
- "Used the design-system page to validate" — not the actual feature
- "Diff was clean" — what specifically did you compare element-by-element?

## What Z.AI / Ollama would add (deferred / optional)

Automated programmatic ui_diff_check:
- Z.AI Vision MCP — paid, DEFERRED per Founder directive
- Ollama local + Llama 3.2 Vision + MCP — free local install, MAY
  be authored as future PROP-NNN if iter-14 protocol proves
  insufficient at scale

For current scope: iter-14 articulation protocol is sufficient.
14 iterations of progress + 1 iteration of systematic articulation
caught 0 new gaps — the discipline works.

## Operating status

PROP-012 protocol operative immediately. iter 14 (main-flows) is
the inaugural application. iter 15 (this ship) is the second
application — dashboard.html visual review using the same
articulated-diff methodology.

## Forward implications

Every user-facing ship from here forward inherits the protocol:
- Capture
- Read
- Articulate
- Diff
- Verdict

No more "shipped and Founder caught the visual issue" pattern.
The 6-layer verification stack (round-trip + scroll-reachability +
side-by-side + user-context + click-through + design-bot-articulated-
diff) provides defense in depth without paid subscriptions.
