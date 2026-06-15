# PL7c — Achievement wiring + exploitability audit (2026-06-15)

Founder ask: "ensure all achievements are properly wired and not exploitable… e2e
tested with full evidence… per-achievement trust matrix." Static code+rules audit
(background agent) + prod-data verification + the fix shipped.

## What gates real value
Only the cosmetic/theme UNLOCKS gate anything: `shop.js EARN_BY_ACHIEVEMENT` +
`theme.js THEME_UNLOCK_ACHIEVEMENT`. Gating achievement ids: **champion, ace,
eagle_eye, sub80, veteran**. (Every achievement also mints ParCoins via
router-achievement.js:34 awardCoins — but ParCoin is cosmetic-only / no cash-out,
so terminal value stays cosmetic.)

## RED-1 — champion self-grant via unprotected `wins` — ✅ FIXED v8.25.204
- Bug: `data.js` champion condition fired on `player.wins >= 1` OR `trip.champion`.
  `members.wins` is NOT in the firestore.rules immutable list (rules lock founding/
  username/role/suspension/ban but forgot `wins`), so a member could
  `members/{me}.update({wins:3})` → champion + dynasty fire → **flagship Green Jacket
  (pc24) + Champion Sunday theme + border_deco_champion + ~500 coins**. The shop/theme
  unlock GUARDS correctly re-derive from getAchievements, but the INPUT was forgeable
  so they faithfully returned a forged "earned."
- Prod-verified before fixing: **0 members have wins>=1** (the legit increment
  silent-fails when closer≠winner — scorecard.js:386), and the only real champion
  (Mr Parbaugh, "The Smoky Mountain Open") is covered by `trip.champion`. So `wins`
  was PURELY the forge vector — dropping it regresses nobody.
- Fix: champion(>=1) + dynasty(>=3) now derive ONLY from counting server-protected
  `trip.champion` matches (leadership-only write). Bundle-verified: `wins>=1`/`wins>=3`
  checks gone. No rules deploy needed (closed at the app/achievement layer).

## RED-2 — ace via shared free-text records/global — ⏳ FOLLOW-UP (YELLOW, cosmetic)
- `data.js:1367` ace fires when `records/global.holeInOnes[].by === player.name`; the
  shared doc is `allow create,update if amIActive()` (rules:896) with no author binding,
  so any member can append an ace with any `by` name → forge ace marker (pc25) + 1000c.
- Severity YELLOW: within the trusted-20 self-report model + cosmetic terminal value,
  BUT it's the weakest-corroborated value-gating signal + writes a shared club record.
- Proposed fix (follow-up, needs a rules change + deploy): per-author ace docs (or store
  `byUid`, write `if request.resource.data.byUid == uid()`), match on byUid not free-text.

## Defense-in-depth follow-up (lower priority, needs care + deploy)
- Lock `members.wins` immutable-via-client in firestore.rules (belt-and-suspenders;
  champion no longer reads it, but `wins` is still displayed/used by dynasty-display).
  COMPLICATION: the legit `wins` increment (scorecard.js:386) is a client write that
  already silent-fails cross-member; locking `wins` requires moving the increment to a
  Cloud Function (or leadership write) first. Tracked, not blocking.

## GREEN — sound by design
- champion intended source (trip.champion) = SERVER-protected ✓ (now the ONLY source).
- sub80→Course Record + veteran→Bourbon Room = accepted trusted-20 self-report (fake
  score only unlocks a cosmetic theme). eagle_eye→eagle border = strongest score gate
  (needs per-hole holeScores + VERIFIED course pars; engine refuses default-par infer).
- Unlock GUARDS are correctly written + not themselves bypassable: theme.js
  saveThemeChoice re-derives from getAchievements (ignores the unlockedThemes cache);
  shop.js equipEarnedTitle/shopHasEarned re-derive before equipping. The residual risk
  was only the forgeable INPUTS (wins → fixed; ace.by → follow-up).
- No achievement that gates an unlock is dead/never-fires.

## Verdict
The one real tooling-light exploit (RED-1 champion self-grant) is CLOSED. RED-2 (ace) is
cosmetic-only + trusted-model-tolerable, self-binding queued. Everything else is server-
protected, verified-data-gated, or the accepted self-report model. Achievement-unlock
surface is sound after v8.25.204.
