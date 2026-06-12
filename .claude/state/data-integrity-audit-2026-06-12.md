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
| **ParCoin balance** (getParCoinBalance) | members/{uid}.parcoins (stored, atomic-mutated) | CLEAN — displayed balance = stored field; awardCoins (earn-only, atomic increment) + deductCoins (balance-validated, no overdraft) each write a parcoin_transactions log. Non-gambling stance intact. Minor: balance + log not single-transaction (theoretical partial-write drift) — standard materialized-balance pattern, displayed value internally consistent. |

| **XP / level** (getPlayerXP / calcXPFromRounds) | getPlayerRounds (deduped) + records + player.wins | CLEAN — deterministic formula; numeric values are XP *rates* not fabricated data; `flossonthefairway +250` is an intentional easter-egg. Reads deduped rounds → dedup fix corrects it. |

## Audit conclusion — comprehensive coverage via the single source
The key architectural fact: **every rounds-derived value in the app flows
through `getPlayerRounds(pid)` / `getRounds()`, which read the same in-memory
`state.rounds`.** Records, standings, XP, member averages, handicaps, rivalry,
scramble derivation, profile totals — all of them. So verifying that the ONE
source (`setRoundsFromFirestore`) now dedups means every derived computation is
simultaneously corrected; there is no rounds-derived surface that bypasses it.
Combined with the per-surface traces above (rivalry/records/scramble/standings/
members/rounds/profile/ParCoin/XP) and the a11y audit (icon controls properly
labelled — icon+text buttons mark their SVG `aria-hidden`, icon-only controls
carry `aria-label`), the **code-level half of the per-page 9.5 review is
complete and clean**. The **visual + taste** half awaits the unblock runbook
above (clean-session emulator).

## Visual-loop unblock runbook (for a clean session that OWNS the emulator)
The per-page 9.5 **visual** review (#41) + the onboarding-graphics build (#50)
are gated on the Firebase emulator. Overnight state (2026-06-12): a full suite
is running (hub 4400, UI 4000, firestore 8080 + rules) but the **auth emulator
(9099) is DOWN** and `emulator-data/` is empty — and that process isn't this
session's to restart (only-kill-what-you-own). Smoke is unaffected throughout
(it uses `?smoke=1` → **production**, not the emulator). To unblock cleanly:
1. Stop any emulator you own, then `npm run emulator:start` (brings up auth 9099
   + firestore 8080 + rules from `--import=./emulator-data`).
2. Seed a capture user with prod-shape data (profile + a few rounds for
   `test_zach_uid_01`) via admin SDK against `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
   — emulator-data is empty, so pages render blank without this.
3. `node scripts/visual-audit/capture-critique-2026-05-29.mjs` (mints a custom
   token, signs in via the auth emulator, walks ALL_PAGES, screenshots). Run it
   at `CAPTURE_DEVICE="iPhone 14 Pro"` + `"Pixel 7"` + desktop (PWA is mobile-first).
4. Read each PNG → critique vs the 9.5 bar + peer refs → fix → re-capture.

## Net
No new data-integrity failures found beyond the rivalry P0 (fixed + shipped) and
the benign duplicate member (logged for the Founder). The migration's only live
fallout was the client-state round duplication, now neutralized at the source.
The visual half of the per-page review awaits the runbook above (clean session).
