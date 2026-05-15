# H3 diagnostic — Parbaugh Round joined-players scorecard

**Finding ID:** H3 (P3 audit, 2026-05-14)
**Status:** Root cause confirmed via code trace. **Not a filter bug — a structural gap.**
**Authored:** 2026-05-14 by main agent
**Methodology:** P5 (diagnostic-first); no fix scoped until Founder direction on product intent.

## Original entry (CLAUDE.md, pre-sweep)

> 9. Parbaugh Round — joined players not appearing on scorecard (host-only display)

The "host-only display" framing implies a filter restricting render to the host. Trace shows that's incorrect.

## Data model trace

### 1. Live Parbaugh Round — single doc, all players (works)

`syncrounds/{roundId}` holds the entire group:
```
{
  players: { uid1: {name, scores[]}, uid2: {name, scores[]}, ... },
  format, courseName, holesMode, status: "active" | "completed", ...
}
```

`renderLiveScorecard(round, myId)` at `src/pages/syncround.js:128-205` enumerates `Object.keys(round.players)` and renders columns for every player. Host's own column is editable; others read-only. Multi-player display works end-to-end during live scoring. (Audit observation reproducible by code read.)

### 2. On finish — fan-out into per-player rounds (where the structure splits)

`finishSyncRound(roundId)` at `src/pages/syncround.js:233-305`:

```js
Object.keys(players).forEach(function(pid) {
  ...
  var round = {
    id: genId(),
    player: pid,
    playerId: pid,
    playerName: p.name,
    course: data.courseName,
    score: total,
    holeScores: scores.slice(startHole, endHole),
    ...
    syncedRound: true,
    syncRoundId: roundId        // ← back-pointer to original syncround
  };
  db.collection("rounds").doc(round.id).set(...);
});
db.collection("syncrounds").doc(roundId).update({ status: "completed" });
```

Each player gets their own `rounds/{id}` doc with their own `holeScores` array. The `syncRoundId` field links each per-player round back to the original group.

### 3. `syncRoundId` is written but never read

```
$ grep -rn "syncRoundId\|syncedRound" src/
src/core/data.js:1393:    var parbaughRounds = rounds.filter(function(r){return r.syncedRound});
src/pages/syncround.js:274:        syncedRound: true,
src/pages/syncround.js:275:        syncRoundId: roundId
```

The lone `syncedRound` consumer at `data.js:1393` is for the **achievement count only** (first_parbaugh / parbaugh_regular / parbaugh_veteran badges). It does not aggregate rounds by group. `syncRoundId` itself has **zero readers anywhere in the codebase**.

### 4. Share / export scorecard takes ONE player's data

`buildScorecardHTML(holeScores, holesData, defaultPars, played)` at `src/core/router.js:1109-1190` is the single shared renderer for the export/share card. Its first param is a single player's `holeScores` array. Two call sites at lines 981 and 1029 both pass one player's data into it.

Scramble rounds get special-cased earlier in the file (lines 933-947: team name + comma-joined member names). Parbaugh Rounds get no analogous treatment — they fall through to single-player rendering using whichever per-player `rounds/{id}` doc the viewer is looking at.

## Why "host-only" appears in practice

When the host triggers `finishSyncRound`, the function:
1. Creates N per-player `rounds/{id}` docs.
2. Marks the syncround `status: "completed"`.
3. Navigates the host to `Router.go("rounds")` (line 301).

The host lands on **their own** rounds page and sees **their own** new round. Tapping it surfaces a share card built from the host's per-player `rounds/{id}` doc — single-player by construction.

Joined player Nick's view a few minutes later: Nick opens his rounds, sees the same date entry, taps it, and gets a share card with **Nick's** scores. Not host's, not group's — Nick's.

So the bug is misnamed. It's **per-viewer-only display**, not "host-only display." Every player's view is restricted to their own data because every per-player `rounds/{id}` doc only contains their own data.

## What's actually missing

No code path exists to render a **group scorecard** for a completed Parbaugh Round. There's no view that:
- Takes a `syncRoundId`
- Queries all `rounds` where `syncRoundId == that id`
- Renders a multi-player layout analogous to `renderLiveScorecard`

The data exists (per-player rounds carry the back-pointer; the original syncround doc still exists with `status: "completed"`). The render path doesn't.

## Open product questions (Stage 1 design, NOT scoped here)

Per AMD-015 + the "Design Before Implementation" cadence in CLAUDE.md, the following questions must be answered before any code fix:

1. **Does a Parbaugh Round have a group scorecard view at all post-completion?** Current behavior: every player gets their own solo share card with their own scores. Alternative: a group scorecard (multi-player columns) lives alongside individual share cards.
2. **Where is the group scorecard accessed?** Options: (a) tap on completed syncround entry in calendar/feed, (b) "view group" button on any per-player round detail, (c) host-only access from the original Parbaugh Round flow.
3. **What does the export/share look like?** The current `pbShareTemplate` is sized for a single player. Multi-player layout requires either a wider template or a different layout (e.g., the live-scorecard table HTML adapted for static capture).
4. **Should existing per-player share cards change?** If group view exists, do solo share cards still render? (Probably yes — players still want their own card.)
5. **Does the answer differ for scramble Parbaugh Rounds?** Scramble already aggregates members into "team" naming; a Parbaugh Round in scramble format would compound the cases.

## Recommended path

1. **Founder + Agent-2 decision** on the 5 questions above (Stage 1 design).
2. **Tech design** mapping the chosen product behavior to render path + query path + share-card template changes (Stage 2).
3. **Implementation ship** delivering the new group view (Stage 3).

Pure code fix without Stage 1 would risk picking a behavior that doesn't match product intent — H3 has sat as a known bug long enough that any restored behavior should be deliberate.

## Files referenced

- `src/pages/syncround.js:128-205` — live multi-player scorecard (works)
- `src/pages/syncround.js:233-305` — `finishSyncRound` fan-out into per-player rounds
- `src/pages/syncround.js:274-275` — `syncedRound` + `syncRoundId` fields written here
- `src/core/data.js:1393-1396` — only `syncedRound` consumer (achievement count)
- `src/core/router.js:933-947` — scramble team name override in share-card path
- `src/core/router.js:1109-1190` — `buildScorecardHTML`, single-player only
- `src/core/router.js:981, 1029` — both call sites pass one player's data

## Cross-references

- `.claude/state/app-audit-2026-05-14/SUMMARY.md` (H3 row)
- `CLAUDE.md` Known Bugs (post-sweep, single entry)
- AMD-015 (propose-first, Stage 1 design required for product direction calls)
- P5 memory `feedback_p5_diagnostic_first.md`
