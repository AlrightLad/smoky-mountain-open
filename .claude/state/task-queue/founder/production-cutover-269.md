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

## THE FINDING (read this first) — this is almost certainly why "UI still looks like shit"

I fetched all three live surfaces today (2026-06-07):

| Surface | URL | Live version |
|---|---|---|
| **PRODUCTION** (GitHub Pages — the canonical app) | https://alrightlad.github.io/smoky-mountain-open/ | **v8.23.1** ← STALE |
| Staging hosting (Firebase) | https://parbaughs-staging.web.app | **v8.23.92** |
| Staging branch (GitHub) | origin/staging | **v8.23.92** |

**Production is 91 ships behind.** Everything from the design marathon — the
side-stripe removal, the depth/figure-ground foundation, the premium home
front-door redesign, every W1-W4 page redesign, the page-transition motion, the
honest icons — landed on **staging only**. Production has served **none** of it
since v8.23.1.

So if you have been judging the UI from the production URL, or from the app
icon on your phone's home screen (an installed PWA caches hard and keeps serving
the old version), **you have not seen any of the upgrade work.** That is the
single most likely reason the UI "still looks like shit."

## FASTEST fix — see the work right now (no permission needed, zero risk)

Open this on your phone or desktop:

> **https://parbaughs-staging.web.app**

That is v8.23.92, live, with all 91 ships. Nothing to approve, nothing for me to
run. If it looks dramatically better than what you've been seeing, the problem
was staleness, not the design.

**PWA caveat:** if you added the app to your home screen, that installed copy is
pinned to the old production URL and an old cached build. To see current work on
your phone either (a) open the staging URL above in a normal browser tab, or
(b) after the production cutover below, force-refresh / remove and re-add the
home-screen app so the service worker fetches the new build.

## To make it live on the real production URL — one action, irreducibly yours

The agent **cannot** open this gate itself. On 2026-05-30 a prior agent tried to
set the push override after your verbal consent and the auto-mode safety
classifier blocked it (logged in `founder-decisions/2026-05-30.ndjson`). The
gate-opening bootstrap is yours by design. After you open it once, I execute the
cutover end-to-end hands-free, exactly per your 2026-05-30 autonomy decision.

**Path A — you paste one command (most explicit, done in 5 seconds).** In this
chat, prefix with `!` to run it in-session, or run it yourself in PowerShell from
the repo root. This pushes the *verified staging tip* straight to production,
independent of any local branch state:

```powershell
$env:CLAUDE_PARBAUGHS_FOUNDER_PUSH='1'; git fetch origin; git push origin origin/staging:main --force-with-lease; Remove-Item Env:\CLAUDE_PARBAUGHS_FOUNDER_PUSH
```

GitHub Pages auto-deploys on push to `main` (`.github/workflows/deploy.yml`), so
production will rebuild to v8.23.92 within a few minutes.

**Path B — you authorize, I execute.** Set the env var persistently once
(`[System.Environment]::SetEnvironmentVariable('CLAUDE_PARBAUGHS_FOUNDER_PUSH','1','User')`,
then restart my shell), and reply "do the prod cutover." I run the push, verify
production serves v8.23.92, write the DONE marker, and report.

## The cutover is SAFE — re-verified today, no work is lost

Live divergence right now: **origin/staging is 831 ahead of origin/main; origin/main
is 88 ahead of staging.** I triaged the full 88-commit main-only range. It touches
**only these 5 files**, all machine-regenerated:

- `.claude/state/cycle-history.json` (cron bookkeeping)
- `.claude/state/dashboard-health/post-commit-hook.log` (cron log)
- `.claude/state/proactive-proposals/2026-06-01.md` (cron output)
- `docs/agents/SESSION_JOURNAL.md` (cron journal)
- `docs/reports/app-health.html` (regenerated dashboard)

**Zero** changes to `src/`, `functions/`, `public/`, or `firestore.rules`. There
is no member-facing production work the cutover would overwrite — the 88 are
cron/dashboard noise the automation regenerates on `main` after the push. That is
why this is a `--force-with-lease` replication, not a fast-forward.

## Evidence the gate requires — GREEN

Staging is byte-verified live at v8.23.92 (sw.js `CACHE_NAME = parbaughs-v8.23.92`
on both the Firebase runtime and the GitHub branch). The page-transition ship
(v8.23.92) passed full Playwright E2E: **190 passed / 0 failed / 0 flaky** across
all three viewports (chromium + iphone-14 + pixel-7), log read in full per your
"even 1 flaky violates the gate" rule. Detail under `.claude/state/e2e-evidence/`.

## Mark complete

After a verified successful cutover the agent writes
`.claude/state/founder-decisions/production-cutover-DONE.md` (satisfies the
verify above). To check:

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 production-cutover-269
```
