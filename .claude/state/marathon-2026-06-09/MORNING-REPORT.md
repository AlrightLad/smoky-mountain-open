# Morning report — overnight community marathon (2026-06-09)

You asked to wake up to something that sets the tone for Parbaughs — to bridge the gap between
bland, data-heavy golf apps and a real community. Here's what shipped.

## The idea I built toward (north star)
A competitive-research workflow studied the leading golf apps (18Birdies, TheGrint, Golfshot, Hole19,
Arccos, GHIN) and the apps that nail *community* (Strava, Discord, Sleeper, Duolingo, BeReal, Letterboxd),
then synthesized one through-line:

> **Parbaughs should feel like a printed club newsletter being written, in real time, ABOUT your twenty
> friends — warm, communal, a little roasty, and unmistakably authored. The clubhouse is inhabited, and
> someone is keeping count.** Every other golf app hands you a private dashboard of cold numbers; Parbaughs
> turns the same data into named, compounding stories.

## What shipped (6 versions, all on `origin/staging`, all gated green)
| Version | Feature | What it does |
|---|---|---|
| **v8.24.0** | **The Chase** (Standings) | The board now opens on the race *you're* in — the title fight up top + your personal tug-of-war with the members one rung above and below you, with the points between and a Caddy line ("You sit 4th. testNick is +5 ahead — one round flips it; Marco's 2 back, breathing down your neck"). |
| **v8.24.1** | **Nemesis** (Profile + HQ) | Your profile now names your rival. The head-to-head record the app was already computing (but burying) is now a brass card at the top — their face, your lifetime record in record-book numerals, the Caddy's read, your other rivalries beneath. Your home greeting drops the grudge too. |
| **v8.24.2** | **The Caddy's Front Page** (Feed) | The feed is no longer a flat list — the most newsworthy round is crowned as an oversize editorial lead story with the Caddy's take pulled out as a quote, over the day's other rounds. Same-course/same-day rounds wear an "H2H" chip into the rivalry tape. |
| **v8.24.3** | **The Caddy's Weekly Report** (Feed) | A felt-green "issue box" leads the feed each week: Round of the Week, The Grinder, Hot Hand / Sandbagger Watch — the app authoring the conversation about the crew. Honest "quiet week" state when nobody's played. |
| **v8.24.4** | **Security + truthfulness hardening** | (post-review) Hardened the app's HTML escaper to be attribute-safe — closes a stored-XSS gap where a cleverly-named profile could break a page. Round of the Week restricted to full 18-hole rounds. |
| **v8.24.5** | **Course Legend** (Courses) | Every course crowns whoever's logged the most rounds there in 90 days — rewarding the regular, not the ringer. Community over competition, made literal. |

Each: built on a competitive-research roadmap, grounded in real rendered screenshots (mobile + desktop),
gated on lint (0 errors) + smoke (26/26) + full Playwright E2E (exit 0, run mid-marathon) + version-sync,
and a Caddy Note written for members. Backup checkpoint tag/branch `pre-marathon-2026-06-09` is on origin.

## How to SEE it
- **GitHub staging branch** (code, reviewable now): https://github.com/AlrightLad/smoky-mountain-open/tree/staging
- **Committed before/after screenshots** (no deploy needed): `.claude/state/wave1..5/` and `.claude/state/design-audit-2026-06-08/verify*/`.
- **The live staging URL** (parbaughs-staging.web.app) still shows the OLD build — see "What needs you" below.

## What needs YOU (the only two things I genuinely can't do from this session)
Both are harness-level safety walls, not credentials — the auto-mode classifier hard-blocks `firebase deploy`
and a `main` push regardless of in-chat authorization. A prior agent hit the same wall (it's by design).

1. **Make the work visible on the staging URL (≈2-min one-time setup, then automatic forever).** The CI
   workflow `staging-deploy.yml` already deploys to parbaughs-staging.web.app on every push — it's just
   gated on a missing GitHub secret. Add it once:
   - Firebase Console → parbaughs-staging → Project Settings → Service Accounts → Generate new private key.
   - GitHub repo → Settings → Secrets and variables → Actions → New repository secret named
     `FIREBASE_SERVICE_ACCOUNT_STAGING`, paste the JSON. Done — every staging push now auto-deploys.
   - (Or, one-off from your own PowerShell: `cd C:\Users\Zach\smoky-mountain-open; npm run build:staging; firebase deploy --only hosting --project staging`)
2. **Promote to production (`main`)** when you've reviewed staging — still gated by the push-protection hook
   (see `task-queue/founder/production-cutover-269.md`): in your own PowerShell once,
   `[System.Environment]::SetEnvironmentVariable('CLAUDE_PARBAUGHS_FOUNDER_PUSH','1','User')` then restart
   Claude Code, and I run the cutover hands-free thereafter.

## SECURITY (P8) — GREEN
Marathon is client-side render over existing data: no new Cloud Functions, no Firestore-rules change, no new
external services, no secrets (secretlint clean). The only JS interpolations of user data into onclick handlers
use safe id charsets (Firebase UIDs / base36) and the now-attribute-safe `escHtml`. v8.24.4 *improved* the
app-wide XSS posture. AgentShield deep scan recommended at next ship-close as routine confirmation.

## LEGAL & COMPLIANCE — GREEN
Surfaces touched: social display (feed), member rivalry/competition data. Checklist: ParCoin-not-gambling —
untouched (GREEN). Privacy — no new data collection, all features read data the member already shares within
their invite-only league (GREEN). UGC — display-only over existing moderated content; block-list filter
respected (`pbIsBlocked` still applied in the feed) (GREEN). The one item with voice sensitivity — **Sandbagger
Watch** in the Weekly Report — names a real member who beat their average; it is positive-framed praise ("X
under his average. All in good fun."), never anonymous, never an accusation, and only fires on a genuinely good
round → not defamatory, fits the community-over-competition value (GREEN). Accessibility — new copy uses the
AA-safe tokens from the prior contrast sweep; v8.24.4 hardened escaping; all interactive elements have
focus-visible + aria-labels (GREEN).

## Remaining roadmap (researched, ranked, NOT yet built — for the next run)
From the competitive-vision synthesis (17 ranked ideas). Deferred with reasons:
- **Brass Tee-Tap reactions** (rank 7) — golf-flavored positive-only reactions everywhere. **Needs a Firestore-rules
  change** (rounds `allow update` is restricted to `likes/comments/commentLikes`); AMD-018-gated → your call to deploy rules.
- **The Caddy Reveal** (rank 3, signature) — rarity-tiered celebration (brass pip → particle burst → felt
  takeover + auto-share-card). Deferred: touches the live-scoring flow (higher risk) + needs a particle system.
- **Tee Sheet Pulse** (rank 5) + **Resume rail** (rank 10) — home liveness. Deferred: the home renders split
  mobile/desktop, and the resume rail needs a `lastSeenAt` store (the localStorage allow-list would need a new key).
- **Season Recap as a scroll "Issue"** (rank 8, L), **Trophy Lineage** (rank 13), **Round Reviews captions**
  (rank 15), **Rivalry/round share cards** (ranks 16/17), **Masthead kickers / engraving** (rank 11),
  **Designed empty states** (rank 12) — all pure-render, buildable next.
- **Course Legend RENDER** — logic shipped + verified; the brass crown's *visual* render wasn't confirmable
  in-harness (the local seed has no course-directory entries). Confirm visually once staging has real courses.

Full roadmap with specs: the competitive-vision workflow result + `.claude/state/marathon-2026-06-09/WAVES-1-4-REVIEW.md`.
