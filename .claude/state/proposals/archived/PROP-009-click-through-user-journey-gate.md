---
{
  "id": "PROP-009",
  "title": "Click-through user-journey gate (operation, not measurement)",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-14T20:11:00Z",
  "rationale": "Iter 11 shipped a Recent 7 Days legend fix that passed measurement tests (5 distinct RGB values per getComputedStyle) but failed perception — Paused, Ships, Bubbles all landed in hue 39-43° (warm yellow). Founder caught the regression in actual usage. Root cause: team used Playwright as a measurement tool (getComputedStyle, getBoundingClientRect) instead of as a user-simulation tool (mouse.wheel, click events, navigation). PROP-009 codifies the click-through user-journey audit as a hard ship-close gate for user-facing surfaces.",
  "scope": "Three deliverables: (1) Author scripts/visual-audit/user-journey-audit.mjs (already done this ship — Playwright script that performs real user actions: mouse wheel scrolling, clicks on interactive elements, navigation between pages, capture at each step + transcript.md output). (2) Add round-trip [user-journey-audit] block that requires a recent transcript for any modified user-facing surface. (3) Update Critic protocol: any user-facing surface ship-close requires (a) user-journey transcript exists, (b) all flagged anomalies addressed or accepted, (c) screenshots show actual rendered + interacted state.",
  "estimate": {
    "cost_tokens": 5000,
    "duration_minutes": 15,
    "risk": "low"
  },
  "files_affected": [
    "scripts/visual-audit/user-journey-audit.mjs (new, authored this ship)",
    "docs/reports/_assets/design-tokens.css — added --chart-rose + --chart-violet (chart-specific palette per perceptual fix)",
    "docs/reports/dashboard.html — Ships/Bubbles fill via chart-rose/chart-violet (hue-distinct)",
    "tests/round-trip-test.py — new [user-journey-audit] block at apply-time",
    "docs/agents/CRITIC.md or peer addendum — click-through gate at apply-time",
    ".claude/state/lessons-learned/engineering-mindset.md — measurement vs operation addendum",
    ".claude/state/proposals/pending/PROP-009-click-through-user-journey-gate.md (this file)"
  ],
  "fallback_plan": "Plan A: ship the user-journey-audit.mjs script + Critic gate + round-trip block as one bundle. Plan B: ship the script only, defer Critic gate to follow-on if governance-protection blocks CRITIC.md edit at apply-time. Plan C: keep the lessons-learned doc as the authoritative source; team operates from lesson text alone. Abandon: Playwright's click/scroll APIs prove unreliable for surfacing perceptual issues — unlikely; iter 12 already demonstrated the HSL perceptual check works.",
  "rollback_strategy": "git revert; the audit script is opt-in (runs on demand). The chart-rose/chart-violet tokens revert dashboard.html to the iter-11 brass-stop state. The round-trip [user-journey-audit] block is additive.",
  "round_trip_coverage": "New [user-journey-audit] block at apply-time. Checks: when a user-facing surface mtime > most recent user-journey audit's transcript.md mtime, round-trip warns (not fails — audit is heavyweight). Failures (perceptual collisions, broken click handlers, unreachable items) block ship-close per Critic protocol.",
  "depends_on": ["PROP-007", "PROP-008"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 2000,
  "status": "pending",
  "operating_status": "Click-through audit operates immediately per Founder directive. The script is authored + tested + applied to dashboard + main-flows + amendments this ship."
}
---

# PROP-009 — Click-through user-journey gate

Authored 2026-05-14 per Founder directive "USE THE DAMN BROWSER LIKE
A USER".

## Why this proposal

Iter 11 fixed Recent 7 Days legend colors so 5 series had 5 distinct
RGB values. Measurement-pass, perception-fail: three of the five
hues (Paused, Ships, Bubbles) landed in the 39-43° warm-yellow band
and looked indistinguishable in actual use.

Founder direction:

> "The team has been treating browser-control as ANOTHER MEASUREMENT
> TOOL instead of as a USER SIMULATION TOOL. Playwright is capable
> of both. The team has only been using the measurement subset."

PROP-009 codifies the user-simulation subset as a mandatory gate.

## What the audit does

`scripts/visual-audit/user-journey-audit.mjs`:

| Step | Real user action | Verification |
|---|---|---|
| Open page | `page.goto(file://...)` | Screenshot 01-opened |
| Scroll to section | `page.mouse.move(center) + page.mouse.wheel(0, 500)` repeated until target visible | scrollY-plateau detection |
| Read perceptual properties | `getComputedStyle` → HSL conversion → hue-delta check | Flags collisions ≤25° hue with similar lightness |
| Click interactive element | `page.click(selector)` | Verify post-click state changed (hasSelection class, populated steps, modal open, etc) |
| Navigate to next page | `page.click('nav a:has-text("Label")')` | Verify URL contains expected href |

Output:
- `.claude/state/user-journey-audits/<timestamp>/<page>/<step>.png`
- `transcript.md` — markdown log of every action + observation

## Findings from the iter-12 run (committed in this ship)

| Page | Check | Result |
|---|---|---|
| dashboard | Recent 7 Days perceptual hue distinguishability | **FAIL** — 3 collisions in 39-43° band (Paused/Ships/Bubbles). Fixed by hue-distinct tokens (rose 329° + violet 284°). |
| dashboard | Cron banner text | ✓ benign "NEWLY INSTALLED" |
| dashboard | 6 nav links | ✓ all navigate correctly |
| main-flows | F62 visible after wheel scroll of rail | ✓ rect bounds inside viewport |
| main-flows | F1 click → flow selection | ✓ grid has-selection + steps populated |
| amendments | Scroll until last item visible | ✓ after fixing mouse-position-over-viewport-center (was the test infrastructure limit, not the page) |

## Three options evaluated (per AMD-015)

### Option A — Mandatory click-through audit before user-facing ship-close (CHOSEN)

Every user-facing surface modification triggers a re-run of
`scripts/visual-audit/user-journey-audit.mjs`. Critic verifies the
generated transcript + flagged anomalies addressed.

**Pros:** Catches measurement-pass-perception-fail at sentinel time.
**Cons:** ~30s per audit run; some friction for hot-fix workflows.

### Option B — Audit on heavyweight ships only

Skip the audit for tiny edits; require only on substantive changes.

**Dismissed** because "tiny edits" misjudgments were exactly what
shipped iter 11's regression. The bar should be uniform.

### Option C — Audit as a periodic batch job

Run weekly via cron; surface accumulated issues for triage.

**Dismissed** because per-ship verification catches earlier than
weekly.

## Decision: Plan A = Option A

Plan A: **Option A — Mandatory click-through audit**.

Rationale:
- Iter 11 perceptual regression would have been caught at ship-close
  if the audit existed then.
- Audit runtime is small (30s for 3 surfaces).
- Output is human-readable transcript + screenshots Founder can
  spot-check if Critic gate is uncertain.
- Compatible with existing PROP-007 user-context-capture (each
  audit IS a user-context capture, more comprehensive than the
  ad-hoc capture pattern).

Plan B (Option B): reserved if click-through audit proves too heavy
for the high-frequency edit cadence.

## What "perceptual collision" means

Two swatches collide perceptually if BOTH:
- hue delta ≤ 25° (within same visual family)
- lightness delta ≤ 25 percentage points (similar brightness)

The audit script computes HSL from rendered RGB and flags pairs.
The team can override with explicit rationale per swatch if needed
(e.g. intentional grayscale palette for an accessibility mode).

## Path to apply

Once Founder approves:
1. Move PROP-009 from approved/ to applied/
2. Add round-trip [user-journey-audit] block (warns on stale audit)
3. Update CRITIC.md per click-through gate (governance-protection
   bypass justified by this proposal)
4. Document in CLAUDE.md the user-facing-ship workflow:
   > "Before declaring any user-facing ship complete:
   >  1. Run user-journey-audit.mjs against the modified pages
   >  2. Inspect transcript.md for flagged anomalies
   >  3. Address every anomaly OR document rationale for accepting it
   >  4. Commit the transcript + screenshots as ship evidence"

## Forward implications

This is the third layer of the verification stack alongside
PROP-007 (user-context capture for visual fidelity) and PROP-008
(browser-control install via Playwright MCP).

| Layer | What it catches | Authoring helper |
|---|---|---|
| Round-trip sentinels | Structural integrity | tests/round-trip-test.py |
| User-context capture | Visual fidelity | scripts/visual-audit/founder-context-capture.mjs |
| Click-through user-journey | Behavior + perceptual UX | scripts/visual-audit/user-journey-audit.mjs |

All three required for user-facing ship-close post-PROP-009.

## Operating status

Audit operates immediately. Critic gate operates at the agent's
discretion. This proposal codifies both for the next agent loop.

---

## Archive metadata

```
archived_at: 2026-05-19T03:00:00Z
archived_by: founder-blanket-approval-2026-05-19
obsoleted_by: SHIPPED — scripts/visual-audit/user-journey-audit.mjs on disk; used in session 2 design-bot reviews; click-every coverage incorporated. Triage source: .claude/state/task-queue/founder/proposal-triage-2026-05-19.md Batch B row 4.
```
