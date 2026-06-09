# Overnight community marathon — Waves 1–4 review + polish (2026-06-09)

Founder directive: make the UI/branding/community better than bland golf apps; bridge the
"loads of personal data, no community" gap. North star (from the competitive-vision research
workflow `wf_60de1519-221`): **"Parbaughs feels like a printed club newsletter being written,
in real time, ABOUT your twenty friends — the clubhouse is inhabited and someone is keeping count."**

## What shipped (all client-side, existing data, no new backend / no Firestore-rules change)
| Wave | Feature | Version | Files |
|---|---|---|---|
| 1 | **The Chase** — relational standings tension (title race + viewer's tug-of-war vs the members directly above/below) | v8.24.0 | standings.js, utils.js (ordinalNum), components.css |
| 2 | **Nemesis / Rivalry card** — first-class H2H on the profile + HQ greeting hook (the buried Social-tab ledger promoted) | v8.24.1 | analytics.js (computeRivalries, rivalryCaddyLine), members-detail.js, home-hq.js, components.css |
| 3 | **The Caddy's Front Page** — asymmetric editorial lead story crowning the feed + same-course/day H2H chips | v8.24.2 | feed.js (_feedLeadPick/_renderLeadStory/_feedRoundFooter/_feedH2HOpponent), components.css |
| 4 | **The Caddy's Weekly Report** — felt-green digest box: Round of the Week / Grinder / Hot Hand / Sandbagger Watch | v8.24.3 | feed.js (_caddyWeeklyReport/_renderWeeklyReport), components.css |

Each wave: vision-verified (mobile + desktop), gated (lint 0 errors, smoke 26/26, version-synced),
Caddy Notes written, committed + pushed to origin/staging. Backup checkpoint: tag/branch
`pre-marathon-2026-06-09` (pushed to origin).

## Code review (subagent, full diff `pre-marathon-2026-06-09..HEAD`) + actions
- **[MEDIUM · security] FIXED v8.24.4:** `escHtml` only escaped `& < >`, not `"`/`'` — an
  attribute-breakout stored-XSS vector (user names in aria-labels), pre-existing project-wide but
  widened by the new editorial surfaces. Hardened `escHtml` to escape all five chars (text + attribute
  safe), app-wide. Re-validated: full E2E exit 0 + smoke 26/26.
- **[MEDIUM · P9] FIXED v8.24.4:** Weekly Report "Round of the Week" compared 9-hole and 18-hole
  to-par as equals (could over-crown a 9-hole round). Added the 18-hole guard the Hot Hand block
  already had.
- **Verified clean:** null/zero guards (empty standings, missing holes, no-round players), design
  tokens (no hardcoded hex), `var` usage, reduced-motion gating, version/cache sync, honest empty
  states (P9), focus-visible affordances.

## Deferred LOW follow-ups (tracked, not blocking)
1. **id-escaping consistency** — some onclick id interpolations use `.replace(/'/g,"\\'")`, some raw.
   Not exploitable (ids are Firebase UIDs / base36 genIds, no quotes). Pick one convention.
2. **`_feedLeadPick` stamps scratch fields** (`it._nws` etc.) on shared items — works, but violates
   immutability; return a descriptor instead.
3. **`computeRivalries` perf** — O(players² × rounds) across roster on each HQ/profile load. Trivial
   at 20 players / 55 rounds; memoize per data-load if the league scales to thousands.
4. **`_feedRoundFooter` DRY debt** — lead story uses the shared footer; the satellite round card keeps
   its own smoke-locked inline copy. Migrate the satellite to the shared helper once smoke assertions
   are updated.
5. **Magic editorial thresholds** (`aheadGap<=4`, `hotDelta>=3/8`, `bestNws>=25`, newsworthiness
   weights) — taste knobs; consider naming them for future tuning.

Verdict: ship-ready after the two MEDIUM fixes (applied). Remaining items are LOW and safe to follow up.
