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
| Staging hosting (Firebase) | https://parbaughs-staging.web.app | **v8.23.94** |
| Staging branch (GitHub) | origin/staging | **v8.23.94** |

**Production is 93 ships behind.** Everything from the design marathon — the
side-stripe removal, the depth/figure-ground foundation, the premium home
front-door redesign, every W1-W4 page redesign, the page-transition motion, the
honest icons, and now the brass front-door CTA + login entrance — landed on
**staging only**. Production has served **none** of it since v8.23.1.

So if you have been judging the UI from the production URL, or from the app
icon on your phone's home screen (an installed PWA caches hard and keeps serving
the old version), **you have not seen any of the upgrade work.** That is the
single most likely reason the UI "still looks like shit."

### See it for yourself — same login screen, two versions

`.claude/state/ui-upgrade-2026-06-07/staleness-comparison-v8.23.1-vs-v8.23.94.png`
is a labeled side-by-side I captured live today: the **left** is the actual
production sign-in screen you see now (flat cream, flat button, no depth); the
**right** is the same screen on staging (deep felt green, brass spotlight behind
the badge, a floating sign-in card, a sheened CTA). Both pulled from the live
URLs minutes ago — production's runtime literally reports `APP_VERSION = 8.23.1`.

I also re-walked the **deployed** staging app today at iPhone width and captured
six surfaces unedited (`deployed-sweep-2026-06-07/`): Home, Range, Courses,
Events, More, and the Profile. Every one renders premium — serif headlines,
real figure-ground depth, branded course monograms, the champion-badge event
card, the brass-ringed profile portrait. None of that exists on production.
**The design isn't the problem; the staleness is.**

## FASTEST fix — see the work right now (no permission needed, zero risk)

Open this on your phone or desktop:

> **https://parbaughs-staging.web.app**

That is v8.23.94, live, with all 93 ships. Nothing to approve, nothing for me to
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
production will rebuild to v8.23.94 within a few minutes.

**Path B — you authorize, I execute.** Set the env var persistently once
(`[System.Environment]::SetEnvironmentVariable('CLAUDE_PARBAUGHS_FOUNDER_PUSH','1','User')`,
then restart my shell), and reply "do the prod cutover." I run the push, verify
production serves v8.23.94, write the DONE marker, and report.

## The cutover is SAFE — re-verified today, no work is lost

Live divergence right now (re-measured after today's v8.23.94 staging push):
**origin/staging is 847 ahead of origin/main; origin/main is 2 ahead of staging.**
Those 2 main-only commits are **both cron-routine** — `d36905ab` (dashboard regen)
and `32faab9e` (a heartbeat timestamp). They are telemetry/dashboard artifacts the
cron loop regenerates continuously, not member-facing work and not even cron-*feature*
work. A cutover would replace them, but they are re-emitted within minutes, so there
is **no real loss**.

**Zero member-facing main-only work** means **zero** risk of overwriting anything
that matters — the only thing on production's branch that staging lacks is those two
auto-regenerated cron commits. The push is issued as `--force-with-lease` (the two
branches diverged historically), folding the verified v8.23.94 staging tip onto
production as a clean replication.

## Evidence the gate requires — GREEN

Staging is byte-verified live at v8.23.94 (Firebase runtime serves
`APP_VERSION = 8.23.94` and sw.js `CACHE_NAME = parbaughs-v8.23.94`; the GitHub
branch tip is `70958db1`, both checked live today). The latest front-door ship
(v8.23.94 — entry-screen depth: brass spotlight glow behind the badge, felt-anchored
vignette, a convincingly floating sign-in card, and a brass-sheen CTA) passed full
Playwright E2E: **190 passed / 0 failed / 0 flaky / 23 skipped** across all three
viewports (chromium + iphone-14 webkit + pixel-7 mobile-chromium), flows 01-10, log
read in full per your "even 1 flaky violates the gate" rule. Full log committed at
`.claude/state/ui-upgrade-2026-06-07/e2e-v8.23.94.log` (commit `7b0cd484`). The one
historical flaky — a `net::ERR_FAILED` from Sentry's fire-and-forget beacon outliving
the test page — was root-caused and fixed earlier (commit `cb18ba0a`: Sentry no longer
initializes in dev/test/loopback); every full run since, including this one, is clean.

## Mark complete

After a verified successful cutover the agent writes
`.claude/state/founder-decisions/production-cutover-DONE.md` (satisfies the
verify above). To check:

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 production-cutover-269
```
