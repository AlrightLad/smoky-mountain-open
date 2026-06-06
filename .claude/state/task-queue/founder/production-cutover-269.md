---
status: open
severity: yellow
priority: HIGH
founder_action_required: true
cost: "$0 (marginal Firebase Blaze only; no paid deps, no new SaaS)"
gate: "Gate 3 (push-protection.sh main freeze) + AMD-018 gate-8 (force-push to main) — Founder bootstrap, agent cannot self-grant"
execute_by: founder-opens-gate-then-agent-executes
verify_command: Test-Path .claude/state/founder-decisions/production-cutover-DONE.md
verify_expected: "True"
---

# Production cutover — replicate staging → origin/main (#269)

**Who can do this:** Founder opens the gate (one-time bootstrap); the agent
then executes the cutover hands-free per the 2026-05-30
`production-autonomy-scope-and-cadence` decision ("push to main hands-free
AFTER the one-time founder permission bootstrap; agent executes end-to-end").
The bootstrap is irreducibly yours — the auto-mode classifier blocks the agent
from setting the push-gate override itself (confirmed 2026-05-30).

**This is the single biggest pending decision.** It promotes the entire
W1-W4 + marathon body (786 commits) from staging to the live production
branch that GitHub Pages serves.

## Evidence the gate requires — GREEN

Full 3-project Playwright E2E sweep, 2026-06-06 (raw log read in full, not
just exit code, per your prod-push rule "even 1 flaky violates the gate"):

| Project | Result | Passed | Skipped | Failed | Flaky |
|---|---|---:|---:|---:|---:|
| chromium | EXIT=0 | 66 | 1 | 0 | 0 |
| iphone-14 | EXIT=0 | 56 | 11 | 0 | 0 |
| pixel-7 | EXIT=0 | 56 | 11 | 0 | 0 |
| **Total** | | **178** | **23** | **0** | **0** |

0 failed, 0 flaky across all three viewports. The 23 skips are deliberate
`test.skip` (desktop-only drawer-a11y + hole-edit tests, which run and pass on
chromium; one universally-skipped "Online Now" test). Detail:
`.claude/state/e2e-evidence/2026-06-06-full-sweep.md`.

## The cutover is SAFE — verified no work is lost

The branch state: local `main` == `origin/staging` (both at a588f039).
`origin/main` is **786 behind, 76 ahead**. I triaged all 76 commits that
`origin/main` has and staging does not:

- 38 `cron(routine): post-commit dashboard regen` (automation)
- 32 `chore(cycle): heartbeat` (automation)
- 6 `feat(ship): cycle …` — each touches **only** `.claude/state/cycle-history.json`
  + `docs/agents/SESSION_JOURNAL.md` (cron bookkeeping)

Full-range diff confirms the 76 commits touch **only** `.claude/` (3 files)
and `docs/` (2 files). **Zero** changes to `src/`, `functions/`, `public/`,
or `firestore.rules`. So there is no member-facing production work that the
cutover would overwrite — the 76 are cron/bookkeeping noise that the cron
system regenerates on `main` after the push. This is why the cutover is a
`--force-with-lease` replication (not a fast-forward): only that automation
noise diverges.

## Remaining cadence preconditions (per the 2026-05-30 decision)

Your cadence was: "after in-flight compliance items land + a full green
E2E/smoke/visual sweep, do one deliberate evidenced staging→prod cutover."

- [x] **Full green E2E** — done (above).
- [ ] **Green smoke sweep** — agent runs next; will record beside the E2E evidence.
- [ ] **Green visual sweep** — agent runs next.
- [ ] **In-flight compliance items landed** — the code/doc compliance fixes
  shipped (#249); the remaining compliance items are themselves Founder-gated
  (legal entity, support email, store assets) and are not code blockers to the
  cutover. Your call whether any must precede the promotion.

## How to open the gate (your one action)

Two equivalent paths — pick one:

**Path A (you run it; most explicit).** In this chat, type the leading `!` to
run it in-session, OR run it yourself in PowerShell from the repo root:

```
$env:CLAUDE_PARBAUGHS_FOUNDER_PUSH=1; git push origin main --force-with-lease; Remove-Item Env:\CLAUDE_PARBAUGHS_FOUNDER_PUSH
```

**Path B (you authorize, agent executes).** Set
`CLAUDE_PARBAUGHS_FOUNDER_PUSH=1` in the environment (your bootstrap), then
reply "do the prod cutover" — the agent runs the force-with-lease push,
verifies `origin/main` serves the staging build, writes the DONE marker, and
reports. This matches your "agent executes end-to-end on approve" decision.

If you'd rather **not** force-push main (preserve the 76 cron commits in
history), reply "merge instead" and the agent will merge `origin/main` into
the staging line first, then fast-forward — no history rewrite, at the cost of
one ugly merge commit carrying the cron noise into staging.

## Mark complete

The agent writes `.claude/state/founder-decisions/production-cutover-DONE.md`
after a verified successful cutover, which satisfies the verify above.
To check:

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 production-cutover-269
```
