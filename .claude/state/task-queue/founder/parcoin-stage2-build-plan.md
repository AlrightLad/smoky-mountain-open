---
status: open
severity: yellow
priority: HIGH (approved 2026-06-11 — "do stage 2 for the parcoin hardening as well")
authored_at: 2026-06-11T15:30:00Z
authored_by: agent
founder_action_required: 8 design decisions + Cloud Function deploys (AMD-018 gate 1 + gate 4)
gate: economy code (gate 4, APPROVED) + Cloud Functions deploy (gate 1, deploy still gated)
---

# ParCoin Stage 2 — server-authoritative coin minting (build plan)

You approved Stage 2 (close pentest exploit #16: client-written balances). A
design workflow fanned out 6 facets + synthesis. Verdict: the earn surface is
small + contained — all 13 live mint reasons route through ONE client helper
(awardCoins, parcoins.js:42), nothing else writes members.parcoins.

## LOAD-BEARING CATCH (affects Stage 1 too)
The client bundle has ZERO functions-SDK transport — every Cloud Function call
is a raw `fetch()` to the cloudfunctions.net URL (validateInvite, deleteMyAccount
all do this). **purchaseCosmetic (Stage 1) was written as `onCall`, which has no
working client transport here — so as-built it would never fire.** grantCoins
(Stage 2) MUST be `functions.https.onRequest` + Bearer ID-token, mirroring the
proven deleteMyAccount. **Recommend: refactor purchaseCosmetic to onRequest in
the same pass** so Stage 1 actually works when you deploy it.

## The 13 earn reasons (all enumerated with server re-derivation + dedup keys)
round_complete (base+attested split), personal_best_18h, personal_best_9h,
range_session, achievement, daily_login (10 single-uid self-service); +
attest_round, bounty_claim, wager_win/tie/refund (cross-uid transfers — the
hard part: port _resolveWager/_resolveNassau server-side + server-owned escrow).
5 dead PARCOIN_RATES entries (event_win, season_champion, invite_joined,
new_member_welcome, tee_time_filled) are EXCLUDED — no live trigger.

## Phasing (no member loses a coin)
- **Phase 0 (agent, INERT — I can do now):** functions/lib/parcoin-rates.js
  shared rate table; grantCoins built as onRequest+Bearer with REASON_HANDLERS +
  parcoin_grants idempotency ledger + rate limits; rules tests; SHADOW-mode flag
  + a read-only drift-compare script. Committed, NOT deployed.
- **Phase 1 (YOU, gated):** `firebase deploy --only functions:grantCoins` staging
  then prod. (Classifier walls firebase-deploy in-session even under the autonomy
  grant — needs your hand.)
- **Phase 2 (agent):** dual-write SHADOW window — grantCoins derives + records but
  does NOT increment (client write stays the only balance mutation → zero double-
  count); a weekend of real play proves server derivation == reality.
- **Phase 3 (agent + 1 gated deploy):** flip SHADOW→LIVE, rewire client to
  server-only, deploy settleWager/claimBounty (gated) for the two-party transfers,
  and LAST tighten firestore.rules to lock parcoins/lifetime/ownedCosmetics to
  function-only. STRICT ORDER (deploy fn → rewire client → lock rules); locking
  rules first freezes the whole earn economy.

## 8 decisions I need from you (recommendations in brackets)
1. **Offline earns:** optimistic "pending +N" that commits on reconnect (may
   correct down) + a durable pb_parcoin_queue, vs earns don't show until online.
   [Rec: optimistic-pending + queue — right for on-course offline; needs
   pb_parcoin_queue added to the localStorage allow-list. OK?]
2. **Range 1/day cap:** code comment says 1/day but prod does NOT enforce it
   (farmable). Enforce 1/day server-side (minor economy change) or keep as-is?
3. **Lifetime leaderboard:** wager/bounty payouts currently inflate Rich List
   "lifetime" (zero-sum transfers counted as earnings). Exclude transfers from
   parcoinsLifetime (cleaner) or keep current?
4. **Wager/bounty architecture:** settleWager/claimBounty as participant-invoked
   HTTP callables with full server re-resolution [Rec], vs a Firestore trigger.
5. **Bounty pot authority:** pots are client-set; server-deriving bounty_claim
   only fully closes the hole if the pot is escrowed/trusted at CREATE. Harden
   bounty-pot in Stage 2 or as a follow-on?
6. **Welcome bonus genesis:** does onboarding seed parcoins:25 at member CREATE?
   If yes, the create-rule (parcoins==0) would BLOCK onboarding and the +25 must
   become a server grant. (I'll grep before locking — flagging the dependency.)
7. **Founder escape hatch:** keep `|| amIFounder()` able to write parcoins/
   ownedCosmetics for manual ops corrections [Rec], or strict server-only?
8. **Pre-lock reconciliation:** run a one-time audit (parcoins vs sum-of-ledger)
   BEFORE locking rules to catch any pre-existing self-minted balances, rather
   than freezing an inflated balance as legitimate? [Rec: yes]

Reply with answers (even "all recommended") and I'll build Phase 0 + queue your
deploy. Full spec: workflow run wf_59361dca-05b. Nothing deployed; economy unchanged.
