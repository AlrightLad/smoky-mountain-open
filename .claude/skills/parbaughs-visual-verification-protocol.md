---
name: parbaughs-visual-verification-protocol
description: Correction 2 protocol. Playwright screenshots per state per page per browser. Verify DOM, layout integrity, token rendering, cross-browser parity. Commit subset to tests/visual-verify/<ship-id>/. Critic eyeballs at review. Failure raises Sanity Halt category 9.
trigger: Engineer self-audit before Critic handoff; Critic implementation review; Sanity Halt category 9 escalation
owner: Engineer (captures), Critic (reviews), Orchestrator (coordinates push gate)
tier: T1 (skill content drafted at Phase 1)
# >>> agentshield-instrumentation
# Added 2026-05-18 to satisfy AgentShield ECC 2.0 skill-health checks
# (observation-hooks, feedback-hooks, version, rollback). Wires the skill to
# the real PARBAUGHS telemetry substrate; no fake telemetry. See
# parbaughs-telemetry-emit and HANDOFF_PROTOCOL.md for the consuming systems.
version: 1.0.0
observation_hooks:
  on_invoke:
    event_type: skill.invocation.start
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
  on_complete:
    event_type: skill.invocation.end
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
feedback_hooks:
  channel: handoff-note
  scenario: subagent-return
  template: HANDOFF_NOTE_TEMPLATES.md
  target_dir: .claude/state/handoffs/subagent-returns/
rollback:
  previous_version: null
  procedure: |
    git revert the commit that introduced the skill update; APPROVAL sidecar
    travels with the skill so revert restores both. Skill changes never co-mingle
    with code commits, so revert is mechanically clean.
  rollback_safe: true
# <<< agentshield-instrumentation
---

# Skill: parbaughs-visual-verification-protocol

Encodes Correction 2 (visual verification mandatory). Screenshots verify what text smoke logs cannot — layout breakage, missing states, cross-browser visual divergence, token rendering misses.

## When to invoke

- Engineer self-audit before Critic handoff
- Critic implementation review (screenshot diff review step)
- Any new member-facing surface (Wave 1 ships) — must capture
- Wave 2+ design ships — diff against design bot mocks

## When NOT to invoke

- Governance edits / docs/agents/ work (no UI)
- Pure infrastructure ships with no member-visible surface
- Lint-only commits (config / settings.json edits)

## Procedure

### Step 1 — Identify surfaces in scope

For the ship's diff, enumerate every member-facing surface touched:
- Pages: e.g., `src/pages/members.js` ships affect /members list + /members?id detail + /members?edit + /members?add
- Components: e.g., hero banner, masthead, scope band, footer
- States: empty / loading / populated / error / per permission tier (Author / Founder / Spectator)

### Step 2 — Use existing smoke capture API

`tests/smoke/helpers/capture.js` exposes `makeCapture(page, runDir, browserName)`. Already wired into 27 smoke scenarios. Adopt it for visual verification — don't reinvent.

```js
// Inside a smoke scenario or visual-verify spec:
var cap = makeCapture(page, runDir, browserName);
await page.goto('/members');
await cap.screenshot('members-list-populated');
// ... navigate to empty state ...
await cap.screenshot('members-list-empty');
```

Screenshots land in `tests/smoke/output/<ts>/<browser>/screenshots/` (gitignored).

### Step 3 — Capture across 4 browsers

Per P8 + DRIFT-2 correction: **chromium, firefox, webkit, webkit-mobile** (NOT msedge).

```sh
BROWSERS=chromium,firefox,webkit,webkit-mobile npm run smoke
```

Or run the smoke suite end-to-end:
```sh
npm run smoke:full
```

### Step 4 — Commit ship-relevant subset

At ship close, copy the relevant subset from smoke output → `tests/visual-verify/<ship-id>/`:

```sh
mkdir -p tests/visual-verify/<ship-id>
cp tests/smoke/output/<latest-ts>/<browser>/screenshots/<scenario>-* tests/visual-verify/<ship-id>/
```

Inferred decision per PHASE_1_FOUNDER_REVIEW.md Q2: `tests/visual-verify/<ship-id>/` is committed-path (NOT gitignored). Engineer copies subset to keep repo lean. Per-ship retention.

### Step 5 — Visual verification assertions

For each screenshot:
- **DOM existence** — page has rendered (selector matches expected element)
- **Non-zero size** — element has `getBoundingClientRect().width > 0` and `.height > 0` (no display:none regressions)
- **Non-transparent color** — computed `color` and `background-color` aren't `rgba(0,0,0,0)` or unresolved
- **SVG presence** — if surface uses SVG icons, verify they rendered (not 0×0)
- **Layout integrity** — no overflow / clipping / z-index regressions visible
- **State coverage** — empty / loading / populated / error / permission-tier all captured
- **Cross-browser parity** — chromium success ≠ pass alone; webkit-mobile must also pass

Per Founder memory feedback P8: "Visual-layer smoke assertions on engagement surfaces — must verify DOM existence, non-zero size, non-transparent color, SVG presence — not just data writes."

### Step 6 — Critic review

Critic opens `tests/visual-verify/<ship-id>/` and inspects each screenshot. Compare to:
- Wave 1: no design bot mocks yet; Critic eyeballs against established Clubhouse aesthetic + state coverage matrix
- Wave 2+: design bot mocks (per Phase 2B briefs). Pixel-level diff against committed mock files
- Wave 3+: mobile parity additionally verified

### Step 7 — On failure: Sanity Halt category 9

Per SANITY_HALT.md category 9 (new per Correction 2):
1. Halt the ship advance
2. Engineer reproduces locally (`npm run smoke:headed` to watch the failure live)
3. Critic identifies root cause: token miss / state gap / layout regression / cross-browser CSS
4. Fix in current ship; do NOT defer
5. Re-capture; re-verify
6. Document lesson if pattern emerges (skill or hook proposal candidate)

### Step 8 — Last-verify state file

Hook 6 (push protection) reads `.claude/state/last-verify.json`. Visual verification result writes:
```json
{
  "smoke": { "pass": true, "timestamp": "..." },
  "lint": { "pass": true, "timestamp": "..." },
  "visual": { "pass": true, "shipId": "<ship-id>", "timestamp": "..." }
}
```

If `visual.pass = false`, push protection hook blocks `git push`.

## Anti-patterns

- Capturing screenshots only in chromium — webkit-mobile catches iOS Safari bugs (real B.43 family)
- Skipping commit step — screenshots in `tests/smoke/output/` are gitignored; Critic can't review from local-only state
- Eyeballing one state, declaring pass — every state needs capture
- "Looks fine to me" without screenshot evidence — visual verification IS the evidence
- Manually flipping `last-verify.json` `visual.pass` to true without actually running verification — defeats Hook 6

## References

- `docs/agents/PROTOCOLS.md` § P8 (smoke + visual verification, expanded per Correction 2)
- `docs/agents/SANITY_HALT.md` Category 9 (visual verification failures)
- `tests/smoke/helpers/capture.js` (existing screenshot API)
- `tests/smoke/run.js` (4-browser runner)
- `feedback_p8_visual_smoke_assertions.md` (Founder memory P8)
- PHASE_1_FOUNDER_REVIEW.md Q2 (visual-verify path inferred decision)
- PHASE_1_CODEBASE_AUDIT.md DRIFT-6 (gitignore of smoke output → visual-verify path needed)
