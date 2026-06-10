# Parbaughs Wrapped — build plan (started 2026-06-10, v8.24.44 target)

Growth #2 from MARKET-STRATEGY-BRIEF-2026-06-10 (story-format season recap;
Spotify Wrapped drove +21% downloads in release week; must land before the
founding league's season ends ~Sep 30).

## Design (chosen: A — story-format tap-through, the brief's explicit ask)

New page `src/pages/wrapped.js` registered as route "wrapped":
- Full-screen story overlay (fixed inset 0, z below pbConfirm) — 6 slides,
  tap right 2/3 = next, left 1/3 = back, progress segments on top,
  X to exit (Router.back to seasonrecap). Reduced-motion: no slide
  animations, content still readable.
- Slide deck (per signed-in member, current season via PB.getSeasonStandings):
  1. Cold open — "Your {seasonLabel}, wrapped." felt-green, serif.
  2. Rounds — count + total holes + most-played course.
  3. Scoring — best round (course + date), avg, handicap now vs season start
     (reuse roundhistory/seasonrecap computation patterns).
  4. Superlatives — nemesis/rivalry record (PB nemesis logic from home),
     longest streak, biggest blowup hole (from holeScores when present).
  5. League context — final/current rank, points, league superlative
     (champion or chase position), league name.
  6. Finale — confetti (pbCelebrate, key wrapped_{season}), share CTA:
     pbCreateShareLink({type:'recap', title:'{name}'s {seasonLabel}, wrapped',
     rows: top stats as rank/name/value rows}) -> clipboard, public page
     (share.html already renders type-agnostic rows).

Entry points: seasonrecap.js hero button "Play your Wrapped" + More menu
(The Season section). No auto-prompt in v1.

## Ship checklist (the standard loop)
node --check, lint 0 errors, build, smoke 27/27 (+ extend S27 with
wrapped route render check if cheap), V1 screenshots of at least 3 slides
both viewports, version trio 8.24.44, caddy note, commit, push main +
staging, seed-deploy-staging-hosting, curl-verify both, regen dashboards,
error sweep.

## Status
- [x] Plan written
- [ ] wrapped.js story engine + slides
- [ ] entries (seasonrecap + More menu)
- [ ] share finale wiring
- [ ] tests + V1 + ship
