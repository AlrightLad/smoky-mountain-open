---
status: closed
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
| Staging hosting (Firebase) | https://parbaughs-staging.web.app | **v8.23.95** |
| Staging branch (GitHub) | origin/staging | **v8.23.95** |

**Production is 94 ships behind.** Everything from the design marathon — the
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
is a labeled side-by-side I captured live: the **left** is the actual
production sign-in screen you see now (flat cream, flat button, no depth); the
**right** is the same screen on staging (deep felt green, brass spotlight behind
the badge, a floating sign-in card, a sheened CTA). Production's runtime literally
reports `APP_VERSION = 8.23.1`. The sign-in screen is byte-identical at the current
staging tip v8.23.95 (the only change since v8.23.94 is the one-time welcome-back
toast, a post-login surface), so this comparison still shows exactly what you get.

I also re-walked the **deployed** staging app today at iPhone width and captured
six surfaces unedited (`deployed-sweep-2026-06-07/`): Home, Range, Courses,
Events, More, and the Profile. Every one renders premium — serif headlines,
real figure-ground depth, branded course monograms, the champion-badge event
card, the brass-ringed profile portrait. None of that exists on production.
**The design isn't the problem; the staleness is.**

## FASTEST fix — see the work right now (no permission needed, zero risk)

Open this on your phone or desktop:

> **https://parbaughs-staging.web.app**

That is v8.23.95, live, with all 94 ships. Nothing to approve, nothing for me to
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

**Path A — you paste one command in your OWN PowerShell terminal (prod live in ~3 min).**
The production freeze is a *Claude Code* session hook; a normal PowerShell window
outside this chat has no such hook, so no override variable is needed there. From
the repo root, this pushes the *verified staging tip* straight to production:

```powershell
cd C:\Users\Zach\smoky-mountain-open
git fetch origin
git push origin origin/staging:main --force-with-lease
```

GitHub Pages auto-deploys on push to `main` (`.github/workflows/deploy.yml`), so
production will rebuild to v8.23.95 within a few minutes.

**Path B — you authorize once, I execute forever after.** In your own PowerShell,
set the override variable persistently a single time, then fully restart Claude Code
(close and reopen):

```powershell
[System.Environment]::SetEnvironmentVariable('CLAUDE_PARBAUGHS_FOUNDER_PUSH','1','User')
```

After that one restart, the override lives in my launch environment, the push-to-main
hook recognizes your standing authorization, and I run this cutover plus every future
one hands-free — backup-first, E2E-gated — so you never type a git command again. (An
inline `VAR=1 git push` does NOT work: the hook runs as its own process before the
command and never sees a variable set on the command line. The variable must be in my
launch environment, which is why this is a one-time set-and-restart.)

## The cutover is SAFE — re-verified 2026-06-07, no work is lost

Live divergence right now: **origin/staging is 863 ahead of origin/main; origin/main
is 4 ahead of staging.** Those 4 main-only commits are **all cron-routine** — heartbeat
timestamps + dashboard/telemetry regen (current prod tip `0e0aae4f`), pushed straight
to `main` by the scheduled cron task that runs outside this session. They are
auto-regenerated artifacts, not member-facing work; the app code on those commits is
identical to the backup point. A cutover replaces them and they re-emit within minutes,
so there is **no real loss**.

**Zero member-facing main-only work** means **zero** risk of overwriting anything that
matters. A fresh backup of the exact current production tip is already on origin —
branch `backup/prod-pre-cutover-2026-06-07` and tag `prod-pre-cutover-2026-06-07` at
`0e0aae4f` — so rollback is a single push if ever needed. The cutover is issued as
`--force-with-lease`, folding the verified v8.23.95 staging tip onto production as a
clean replication.

## Evidence the gate requires — GREEN

Staging is byte-verified live at v8.23.95 (the Firebase deploy built and released
`the-parbaughs@8.23.95`; APP_VERSION, package.json, and sw.js `CACHE_NAME =
parbaughs-v8.23.95` are version-synced and committed). The latest ship (v8.23.95 —
the one-time welcome-back toast redesigned into a high-contrast felt announcement
card, lifted clear of the bottom-nav, fixing a ~2.4:1 light-on-brass contrast bug it
inherited; on top of the front-door entry-screen depth from v8.23.94) passed full
Playwright E2E: **190 passed / 0 failed / 0 flaky / 23 skipped** across all three
viewports (chromium + iphone-14 webkit + pixel-7 mobile-chromium), flows 01-10, log
read in full per your "even 1 flaky violates the gate" rule (zero retry/flaky markers,
zero failure markers in the log, exit 0). Full log committed at
`.claude/state/ui-upgrade-2026-06-07/e2e-v8.23.95.log`. The one historical flaky — a
`net::ERR_FAILED` from Sentry's fire-and-forget beacon outliving the test page — was
root-caused and fixed earlier (commit `cb18ba0a`: Sentry no longer initializes in
dev/test/loopback); every full run since, including this v8.23.95 run, is clean.

## Mark complete

After a verified successful cutover the agent writes
`.claude/state/founder-decisions/production-cutover-DONE.md` (satisfies the
verify above). To check:

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 production-cutover-269
```


---
**CLOSED 2026-06-11:** Complete — prod is live and current (v8.24.46); founder-decisions/production-cutover-DONE.md exists (the item’s own verify_command passes).
