# Data-integrity audit — 2026-06-12 (overnight, code-level / P9)

> Founder directive: "all data integrity checks pass... every visible value
> must trace to source." Visual capture is emulator-blocked tonight (auth 9099
> down, shared with the smoke gate — unsafe to restart unattended), so this is
> the **code-level** half of the per-page review: trace each surface's displayed
> values to their source and confirm no fabrication / no duplicate-inflation /
> correct post-migration. The visual + taste half runs in a clean session.

## Root fix this session (the P0)
`setRoundsFromFirestore` now dedups incoming rounds by id **and** content
signature. The Founder's 7-0 rivalry was duplicate rounds in client state (the
league migration regenerated trip rounds under new ids). Because **every
rounds-derived surface reads the same deduped `state.rounds`**, this one fix
corrects all of them at once. Verified by faithful sim (7→4) + the audits below.

## Surfaces audited (all trace to source; clean unless noted)

| Surface | Source | Verdict |
|---|---|---|
| **Rivalry** (renderRivalryDetail / calcH2H) | getPlayerRounds (deduped) | FIXED — match list now dedups by normCourse\|date + excludes scramble, consistent with the score. 7-0 → true 4-0. |
| **Records** (records.js) | getRounds() + calcH2H | CLEAN — Best 18/9 from deduped rounds; H2H via fixed calcH2H; averages alias-correct; longestDrive/putt from records/global (legit "—" when unset). |
| **Scramble teams** (detail/list/records/profile) | team.matches + _deriveTeamScrambleRounds | FIXED — one shared all-members-present derivation across all 4 surfaces; SMO Sequoyah 77 surfaces; no cross-team bleed. |
| **Standings** (getSeasonStandings) | getPlayers() + getPlayerRounds (deduped) | CLEAN — points/avg/best/hcap all trace to deduped rounds; roster deduped (no double-count); scramble excluded from points; no fabricated values. Dedup fix corrects season points too. |
| **Members** (prod collection) | Firestore members | CLEAN — 1 commissioner + 26 members; usernames unique except one benign duplicate (@middleagedgolfer ×2, display-deduped, logged task #56). |
| **Rounds** (prod collection) | Firestore rounds | CLEAN — 27 docs, correct leagueId, zero duplicate docs (the 7-0 dup was client-state only). |
| **Profile round count → all rounds** (members-detail) | getPlayerRounds (deduped) | FIXED — navigates to scoped full history; removed a hardcoded `|| r.player === "zach"` that leaked the Founder's rounds into every member's handicap. |

## Still to audit (next clean session / cron fires)
Home-HQ stats strip, feed activity counts, ParCoin balances, XP/achievements,
awards — all rounds/event-derived, expected clean post-dedup but not yet traced.
Plus the **visual + taste** half of every page (the 9.5 bar) once the emulator
is back.

## Net
No new data-integrity failures found beyond the rivalry P0 (fixed + shipped) and
the benign duplicate member (logged for the Founder). The migration's only live
fallout was the client-state round duplication, now neutralized at the source.
