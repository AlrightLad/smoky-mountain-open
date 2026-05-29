# Tournament Builder — design spec

**Date:** 2026-05-29
**Status:** Approved-intent (Founder feature request); building on staging per overnight-continue workflow.

## Founder request (verbatim)

> "I would also like an easy way to make tournaments but only comissioner of that league can make them. It should not use an API of claude but something free that can generate tournaments based on players entered and their stats. The comissioner should be able to name the tournament as well as what the title for the winner is but it must be submitted before the start of the tournament. This should include different formats, game types, team style types, and point systems, it should mimic the smokey mountain open layout but be modernized based on our new design system."

## Decomposed requirements

1. Easy tournament creation, **commissioner-only** (commissioner of that specific league).
2. **Free / algorithmic** generation from entered players + their stats. **No Claude/LLM API** (P4 OSS-first).
3. Commissioner names (a) the tournament and (b) the winner's title; both **locked before the tournament starts**.
4. Multiple **formats, game types, team styles, point systems**.
5. **Mimic the Smoky Mountain Open layout, modernized to Clubhouse design tokens.**

## Key prior-art findings (reuse, don't rebuild)

- **Free generator already exists** in `src/pages/trips.js`:
  - `generateFairPairings(memberIds, style)` — snake-draft team balancing by handicap; individual tee-group mode.
  - `getTournamentFormats(style, numRounds)` — 6 presets (classic/mixed/parbaugh/ryder/skins/scramble).
  - `groupPlayersForTee(players)` — balanced mixed-skill foursomes.
  - Handicaps via `PB.calcHandicap(PB.getPlayerRounds(id))`.
- **LLM path is dead code**: `src/core/router-ai-tournament.js` (orphaned — defined, never routed; calls `api.anthropic.com` with no key) + a disabled "COMING SOON" chip at `trips.js:117`. Safe to replace wholesale (zero regression risk).
- **Persistence**: tournaments = a `trip` doc with `type:'tournament'`. `firestore.rules:610` already permits `trips` create (league member) + update (leadership). Write via `db.collection("trips").doc(id).set(leagueDoc("trips", doc))` — `leagueDoc()` stamps `leagueId` from active league (`utils.js:34`). **No firestore.rules change** (which is AMD-018-gated + gate-protected). Scores reuse `tripscores`.
- **Commissioner check**: `league.commissioner === currentUser.uid` (`leagues.js:219`).

## Architecture decision

Tournaments are a **specialized Trip** (`type:'tournament'`), not a new collection — because (a) `wave-2a-ratification.md:112` already equates "Smoky Mountain Open-style multi-day events" with Trips, (b) the rules file has NO catch-all so a new `tournaments` collection would be denied-by-default and require a blocked rules deploy, (c) the existing trip/tripscores infra (scorecard, sync, leaderboard) is reused.

### Catalog

- **Formats:** Stroke, Net (Parbaugh handicap-adjusted), Stableford, Scramble, Best Ball, Shamble, Match Play, Skins.
- **Team styles:** Individual, Pairs (2s), Foursomes (4s), Ryder Cup (two squads).
- **Point systems:** Cumulative Strokes, Cumulative Net, Stableford Points, Position Points (1st=10/2nd=7/3rd=5…), Match Points.
- **Presets** bundle format-per-round + team style + point system; **Smoky Mountain Open (Classic)** is the namesake default (Stableford rounds, cumulative Stableford points, individual).

### Generation engine (free, deterministic, stats-based)

Reuse + extend the existing handicap snake-draft + tee-grouping; add match-play bracket seeding by handicap. Pure functions, unit-testable.

### Lock-before-start

`name` + `winnerTitle` editable only while `status==='upcoming'` AND `now < startAt`; immutable after (UI gate + rules restrict trip update to leadership). Lock indicator shown.

### Commissioner gate

Create button + builder route render only when `league.commissioner === uid`. Residual note (surfaced to Founder, YELLOW per P8, not RED): trip create-rule allows any league member, so true server-side commissioner-only enforcement would need a rules change (deferred — cosmetic-coin stakes, self-league-scoped, non-modifiable-by-attacker because update is leadership-only; matches existing Trips posture).

## Increments (each ships to staging)

1. **Engine + data model + gate** — repurpose `router-ai-tournament.js` into the engine module; extend `addTrip` whitelist + add Firestore write; remove the dead AI chip; commissioner-gated entry on Events page.
2. **Modernized creation flow** — Clubhouse-token multi-step builder (Identity → Shape → Field → Review & Lock).
3. **Modernized tournament view + leaderboard** — Smoky Mountain Open layout, editorial masthead, schedule, leaderboard under chosen point system, champion crowning.
