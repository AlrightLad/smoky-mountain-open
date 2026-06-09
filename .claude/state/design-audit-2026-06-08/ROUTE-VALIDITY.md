# Route-validity diagnostic — design audit 2026-06-08

Diagnostic-first (P5) before trusting audit findings. Captured 34 surface names;
diffed against the canonical registered-route list (`grep Router.register` → 50 routes).

## Invalid routes in my capture set → blank PNGs → FALSE-POSITIVE findings (EXCLUDE)

| Captured name | Registered? | Reality |
|---|---|---|
| `leaderboard` | ❌ NOT registered | Sidebar **label** "Leaderboard" routes to `standings` (`router-sidebar.js:13 _sidebarRoutes` + `quick-search.js:33 route:'standings'`). `Router.go('leaderboard')` hits no renderer → blank. NOT a user-facing bug. |
| `social` | ❌ NOT registered | `social.js` exists as a page file but no `Router.register('social')`. Likely a sub-view/deprecated. Blank on direct nav. |
| `spectator` | ❌ NOT registered | `spectator.js` + `spectator-stream.js` exist but no `Router.register('spectator')`. Reachable only from a live-round context, not a standalone route. Blank on direct nav. |

**Action:** Any audit finding of the form "leaderboard/social/spectator renders blank/broken"
is an artifact of an invalid route name in the capture harness, NOT a real defect. Drop at synthesis.

## Minor real robustness note (LOW, not a design finding)
`router.js:55` — `if (pages[page]) pages[page](params)` renders nothing for an unknown route
(no 404/not-found empty state). Not user-reachable today (no nav links to invalid routes), so LOW.

## Coverage gap — registered core surfaces NOT yet captured (follow-up)
`playnow` (the core scoring/log-a-round flow — highest-value omission), `tournament`,
`seasonrecap`, `profile`/`members-detail` (need id param), `round`, `scorecard`, `merch`, `caddynotes`.
The current audit covers the 31 valid primary surfaces. A second pass should add `playnow` + detail views.

## Valid captured surfaces (31, audit-trustworthy)
home, feed, activity, rounds, roundhistory, range, drills, courses, teetimes, calendar,
standings, records, awards, aces, shop, richlist, wagers, bounties, challenges, members,
findplayers, leagues, chat, dms, scramble, trips, partygames, more, settings, invite, trophyroom
