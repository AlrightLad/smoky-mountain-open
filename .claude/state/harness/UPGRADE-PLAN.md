# PARBAUGHS Autonomous-Agent Upgrade Plan — Reactive → Proactive

> Verified against live repo 2026-06-15 (6-agent review). CORE FINDING: the proactive-QA
> infra is ALREADY BUILT (axe-core, pixelmatch, lhci, `_gemini-critique.mjs`, `visual:check`,
> `check-round-integrity.mjs`, `ship-gate.js`) — **almost none is WIRED into a gate.** The win
> is WIRING + closing the loop, not buying tools. Founder granted full autonomy to implement +
> author skills (2026-06-15). Implement in the marathon, sequenced below.

## One-sentence diagnosis
The harness optimizes for **commits landed** (Stop-hook = "open `- [ ]` exists"; push gate =
"no explicit pass:false"), not **quality verified** — so unverified/sub-bar work reaches the
Founder/users by default, and the QA kit sits unwired on disk.

## TOP 5 (do first, in order)
1. **`quality-gate.yml` CI as required check before prod deploy `[M]`** — push to main/staging:
   `npm ci → lint → build → serve dist → axe a11y+contrast (hard-fail serious/critical) →
   visual:check → lighthouse a11y≥0.9 HARD`. `deploy.yml` build job `needs: quality-gate`.
   (Today prod gates on lint+build ONLY.) Hermetic against static dist.
2. **`push-protection.sh` FAIL-CLOSED `[M]`** — missing smoke/lint/visual pass keys = BLOCK
   (today = ALLOW, a no-op; last-verify.json is 3wks stale wellness schema); block if
   last-verify older than HEAD or sha≠HEAD; only the verification RUNNERS write it (never by hand).
3. **ONE reusable capture harness + un-orphan `visual:check` `[L]`** — `scripts/qa/capture.mjs
   <routes> <viewports>` authed via `_cap-auth.mjs`; repoint `tests/visual-regression/run.mjs`
   (today reads a FROZEN 2026-05-22 dir + skips→green=false confidence); skip→FAIL; re-bless;
   retire the ~60 one-off capture-*.mjs. Foundation for #1/#4/#5.
4. **VLM judge → mandatory pre-Founder gate (`parbaughs-visual-qa` skill) `[M]`** — upgrade
   `_gemini-critique.mjs` → `scripts/qa/vlm-judge.mjs`: per-dim JSON vs taste-scoring/RUBRIC.md,
   cap 9.4 (AMD-028), 3-call median, INCLUDE peer-reference screenshot (side-by-side), exit
   non-zero <9.0; write visual.score to last-verify.json. Chain capture→axe→ssim→vlm as the skill.
   (Today the critique tool is referenced by NO skill/hook.) Shifts Founder from first-critic→final-approver.
5. **Single-driver lockfile in `stop-continue.sh` `[M]`** — `.driver-lock {session_id,pid,heartbeat}`;
   2nd session ≠ owner → ALLOW + stand-down log; `CLAUDE_PARBAUGHS_SCOPED=1` makes the hook inert
   for cron/scoped sessions; `git fetch+merge-before-push` as a hook not a habit. (Collision was
   SEV-2 ×2; already dropped a feature commit.)

## NEW SKILLS to author
| Skill | Charter |
|---|---|
| **parbaughs-visual-qa** | pre-ship: capture every touched page (3 vp × 6 themes) → axe → ssim → VLM≥9.0 → write last-verify.json; blocks ship on fail. THE #1 win. ALSO catches RINGS-FLUSH + overlap/misalignment + industry-standard layout (Founder 2026-06-15) via DOM checks. |
| **parbaughs-brand-fit-judge** | before any generated asset is wired, score the finished PNG vs BRAND-BRIEF lane/palette/motif (rubber-hose-leads / brass-is-frame / ring-frames-never-covers / dual-register); pass required. Kills rings-rejected-twice + off-brand slop. |
| **parbaughs-self-judge** | generate → 7-dim score (brand-fit/palette/motif/lane/material/focal-peak/anti-generic) → regen the failing variable before surfacing; best-of-N; "3 regens on one tool then SWITCH tool" rule. |
| **parbaughs-prod-healthwatch** | cycle-close: fetch live prod URL (boots) + errors collection (new sigs/spikes) + version/rules drift → auto-append BACKLOG `- [ ]`. |
| **parbaughs-design-critique** | 3 parallel sub-agents over the PNG (Brand-Fit / Peer-Benchmark side-by-side / anti-generic); all ≥8; disagreement ≥1.5 → regen. |
| **parbaughs-data-integrity-watch** | scheduled: check-round-integrity + dup/orphan/multi-uid/no-leagueId + prod-errors → BACKLOG `- [ ]` on any finding. |
Plus: port the design-bot's 3 binding constraints (≤3 font-sizes on screen, ≤2 brass elements, every interactive el has :hover/:focus-visible/:active/:disabled) into parbaughs-visual-qa as DOM checks.

## LOOP/HARNESS hardening
- Collision lockfile + CLAUDE_PARBAUGHS_SCOPED (TOP #5) — non-negotiable.
- **Backlog taxonomy `(verifiable)` vs `(taste)`**: Stop-hook force-continues only on `(verifiable)`;
  `(taste)` items build→staging→capture→ONE consolidated Founder packet, non-blocking. (Stops the
  build→reject→rebuild churn — the hook today counts all items uniformly + force-continues into
  Founder-taste cosmetics = where sub-bar ships.)
- Blocked top-item (credential/taste/login) → route to next VERIFIABLE item, don't global-STOP.
- DONE-definition for a UI item = "ran parbaughs-visual-qa (axe+ssim+VLM≥9.0) on every touched page AND passed, artifact in .claude/state." Quality, not "a commit landed."
- Anti-cheat on "green": positive-assertion library (visible + non-zero box + non-transparent color + value-traces-to-source) + seed-shape parity check + committed evidence manifest.
- **Brief-the-brand-first HARD GATE**: PreToolUse hook on `_gen-vertex-art|_finish-art|stitch|recraft|imagen` that BLOCKS unless a per-asset brief stub (lane + 4 palette hexes + 1 motif + ref URL) exists in `.claude/state/design/briefs/<asset>.md` this session.

## "Other tools" verdict
NO new tools needed — ~90% WIRING what's on disk. Add only `ssim.js` (+ optional `odiff`) for a
perceptual 2nd-stage diff (suppresses pixelmatch false-fails). Do NOT add Percy/Chromatic/Applitools
(duplicates owned kit, costs money, P4 violation). Invest effort in PROMPTING/critique quality:
peer-reference in the judge prompt, per-dimension rubric scoring, two-model cross-check.

## Sequencing
1. #3 capture harness + #5 lockfile (parallel — foundation + stop bleeding).
2. #2 push-protection fail-closed + #1 quality-gate CI (both need runners writing last-verify.json).
3. #4 vlm-judge + parbaughs-visual-qa (needs #3).
4. Remaining skills + loop-discipline rules.
Est. ~3–4 autonomous cycles to flip the whole kit reactive-manual → proactive-mandatory.
