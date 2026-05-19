---
{
  "id": "PROP-007",
  "title": "User-context verification gate (bridge agent-context to user-context)",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-14T19:15:00Z",
  "rationale": "Nine iterations of main-flows.html have shipped 'fixed' in agent context (Playwright headless Chromium, DOM sentinels, computed CSS) while Founder eyes catch regressions in user context (real Chrome, real OS scrollbar treatment, real fonts, real DPR). Per Founder directive 2026-05-14: agent-context PASS is meaningless when user-context shows broken. This proposal codifies the bridge as a hard gate before any user-facing surface ships.",
  "scope": "Five deliverables: (1) Author scripts/visual-audit/founder-context-capture.mjs as the canonical Founder-run-once-per-ship diagnostic (channel:chrome headed Playwright; falls back to Playwright Chromium headed if channel:chrome unavailable). (2) Add round-trip [user-context-gate] block that checks for a recent founder-real-context capture before declaring user-facing dashboards ship-ready. (3) Update Critic protocol: any user-facing surface (.html under docs/reports/, plus members-facing app pages once Wave 1+ ships) requires user-context-capture before ship-close. (4) Surface the single command to Founder this ship for diagnosing the current main-flows main-flows bug. (5) Lessons-learned addendum + Critic vocabulary purge ('agent-context PASS' alone is BANNED as ship-close evidence).",
  "estimate": {
    "cost_tokens": 6000,
    "duration_minutes": 15,
    "risk": "low"
  },
  "files_affected": [
    "scripts/visual-audit/founder-context-capture.mjs (new, already authored under this proposal)",
    "tests/round-trip-test.py — new [user-context-gate] block",
    "docs/agents/CRITIC.md or peer addendum — user-context gate at apply-time",
    ".claude/state/lessons-learned/engineering-mindset.md — agent-vs-user-context addendum",
    ".claude/state/proposals/pending/PROP-007-user-context-verification-gate.md (this file)"
  ],
  "fallback_plan": "Plan A (chosen): Option C from Founder's directive — Founder-run-once-per-ship diagnostic. channel:chrome headed Playwright closes most of the agent/user gap; Founder runs ONE command per user-facing ship-close. Plan B: Option B — install Playwright MCP server so agent can drive headed browser without Founder action. Adds MCP setup complexity; marginal gain over channel:chrome headed. Plan C: Option A — remote control of Founder's machine. Highest fidelity but highest ongoing cognitive cost. Abandon: if even channel:chrome headed Playwright produces meaningfully different rendering than Founder's actual Chrome — unlikely (same Blink engine, same Chrome version when channel:chrome resolves).",
  "rollback_strategy": "git revert; user-context-capture script is opt-in (Founder runs it manually); the round-trip [user-context-gate] block is additive and gracefully skips if no recent capture is found.",
  "round_trip_coverage": "New [user-context-gate] block in tests/round-trip-test.py — checks .claude/state/main-flows-v2/founder-real-context/ for a capture within the last 7 days when main-flows.html has been modified in the same window. Round-trip fails (and ship blocks) if main-flows.html was modified post-last-Founder-capture without a new capture.",
  "depends_on": ["AMD-009", "AMD-015", "AMD-016", "PROP-006"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 2000,
  "status": "pending",
  "operating_status": "Script + Critic gate operate immediately per Founder directive even before formal approval. This proposal codifies it for the next agent loop."
}
---

# PROP-007 — User-context verification gate

Authored 2026-05-14 per Founder directive "END THE AGENT-CONTEXT VS
USER-CONTEXT VERIFICATION GAP".

## Why this proposal, why now

Nine iterations of main-flows.html shipped agent-context PASS while
Founder caught user-context FAIL. The gap is NOT effort, NOT skill,
NOT test coverage. It's the verification SUBSTRATE: agent context
(Playwright headless Chromium, DOM sentinels, computed CSS,
synthetic scroll) does not match user context (Founder's real
Chrome on real Windows with real fonts, real OS scrollbar
treatment, real DPR, real interaction).

Every "PASS" the team ships against agent-context tests means
nothing when Founder-context shows broken state. The 9 iterations
prove this isn't theoretical.

## Three options evaluated (per Founder directive + AMD-015)

| Option | Fidelity to user | Ongoing Founder cost | Substrate fit |
|---|---|---|---|
| A — Remote Control | Highest (literally Founder's machine) | High per-ship (active session required) | New surface — Claude Code --remote-control flag |
| B — Playwright MCP / browser-use MCP | High (real browser, agent-driven) | Low after install | Moderate — MCP server install + integration |
| C — Founder-runs-diagnostic | High (channel:chrome uses Founder's real Chrome binary) | Low per-ship (one command, ~30s) | High — matches existing AMD/PROP/ESC paste-into-Downloads pattern |

## Decision: Plan A = Option C

Plan A: **Option C (Founder-runs-diagnostic once per user-facing ship)**.

Rationale:
- **Substrate fit is decisive.** PARBAUGHS already operates on a
  Founder-takes-one-action + team-does-rest pattern: AMD/PROP/ESC
  decisions paste JSON into ~/Downloads, watcher picks up, team
  applies. PROP-007 extends this exact pattern to visual
  verification: Founder runs ONE command, output lands in a known
  path, team picks up + diffs.
- **channel:chrome closes most of the agent/user fidelity gap.**
  Playwright supports launching the user's installed Chrome binary
  (not Playwright's bundled Chromium). Same Chrome version, same
  fonts, same OS scrollbar treatment, same DPR. The remaining
  gap (interaction-style differences, alternate browsers, real
  user zoom levels) is small enough to be acceptable for an
  internal tool platform with one Founder.
- **No MCP install complexity.** Option B requires installing +
  configuring an MCP server. channel:chrome is a launch flag.
- **Founder cognitive cost is one command per user-facing
  ship-close.** ~30 seconds. The team does ALL diagnosis +
  diffing work against the captured pixels.

Plan B (Option B): if channel:chrome rendering proves to differ
meaningfully from Founder's actual Chrome (e.g. extension
interactions, profile-specific font settings), install Playwright
MCP server to drive Founder's profiled Chrome over CDP. Reserves
this for if Plan A fidelity proves insufficient.

Plan C (Option A): if even Plan B is insufficient, fall back to
Claude Code --remote-control during ship-close verification
phases. Highest cognitive cost; reserved for cases where Plan A +
B both surface false-negatives.

## Implementation

### Already operative (authored in this proposal)

- `scripts/visual-audit/founder-context-capture.mjs` — ONE command:
  `node scripts/visual-audit/founder-context-capture.mjs`
  Launches headed channel:chrome (fallback Playwright Chromium
  headed), opens the target page, captures 4 screenshots at
  scroll positions, writes capture-meta.json with browser version
  + OS + viewport + DPR + file checksums.
  Output goes to
  `.claude/state/main-flows-v2/founder-real-context/<timestamp>/`.

### Pending Founder approval

- `tests/round-trip-test.py` — new `[user-context-gate]` block:
  When `docs/reports/main-flows.html` has been modified more
  recently than the most recent
  `.claude/state/main-flows-v2/founder-real-context/<ts>/` capture,
  round-trip FAILS with message "user-context capture required —
  run `node scripts/visual-audit/founder-context-capture.mjs`
  before ship-close". Skips with PASS if main-flows.html has not
  been modified since the last capture.

- `docs/agents/CRITIC.md` (or peer addendum at apply-time, after
  governance-protection bypass per CLAUDE.md operational gotcha
  pattern) — extend ship-close gate:
  > "For any user-facing surface (`.html` under `docs/reports/`,
  > or member-facing app pages), Critic verifies a
  > user-context-capture from `.claude/state/<area>/founder-real-
  > context/<ts>/` dated AFTER the most recent surface
  > modification. If absent: ship blocks. Side-by-side
  > comparison + checklist alone is INSUFFICIENT for user-facing
  > surfaces — both gates required."

- `.claude/state/lessons-learned/engineering-mindset.md` —
  addendum capturing the agent-vs-user-context observation,
  the three-option evaluation, the Plan A/B/C fallback chain,
  the iter 9 substrate fix pattern, and the Critic vocabulary
  purge (agent-context PASS alone is BANNED as ship-close
  evidence for user-facing surfaces).

## Operating immediately (per Founder directive)

The script operates immediately. The Critic gate operates
immediately at the agent's discretion (any user-facing surface
ship-close requires the capture). This proposal codifies it for
the next agent loop.

## Path to apply

Once Founder approves:
1. Author the round-trip `[user-context-gate]` block (Python edit)
2. Update CRITIC.md per the addendum text above (governance-
   protection bypass justified by this approved proposal)
3. Move PROP-007 from approved/ to applied/
4. Round-trip green (with the new block PASSing — Founder
   already runs the capture per this ship's directive)
5. Single commit: "PROP-007 applied: user-context verification
   gate"

## Forward implications

After PROP-007 lands, every future user-facing ship reports
include a `.claude/state/.../founder-real-context/<ts>/` capture
as evidence. "Agent-context PASS" alone stops counting as
ship-close evidence for user-facing work. The 9-iteration
main-flows pattern cannot recur for any surface PROP-007 covers.

---

## Archive metadata

```
archived_at: 2026-05-19T03:00:00Z
archived_by: founder-blanket-approval-2026-05-19
obsoleted_by: SHIPPED — scripts/visual-audit/founder-context-capture.mjs on disk; round-trip [user-context-gate] block at tests/round-trip-test.py:1833 operative; cited in CONSOLIDATION session 2. Triage source: .claude/state/task-queue/founder/proposal-triage-2026-05-19.md Batch B row 2.
```
