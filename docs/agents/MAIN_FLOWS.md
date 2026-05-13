# PARBAUGHS — Main Flows

> **Status:** Draft authored by the orchestration team for Founder review.
> **Authority:** This document is the orchestration team's RECOMMENDATION. Founder is the product source of truth. Edit freely.
> **Apply path:** When Founder ratifies, this draft moves to `docs/agents/MAIN_FLOWS.md` (Founder applies — governance-protection hook blocks orchestration-team writes to `docs/agents/`).
> **Bubble of record:** `db-2026-05-13-004` (approved-with-dissent, 3-1-1)

---

## What this document is — and what it is NOT

**This document IS:**
- The single canonical list of the critical user journeys through PARBAUGHS — the paths that, if any one of them breaks, members notice immediately.
- A filter for engineering work: "does this serve a Main Flow?" If the answer is "no" or "not directly," the work either gets reclassified (Code-Quality lane, deferred polish, etc.) or rejected.
- A shared reference for Founder's product decisions, the orchestration team's scope discipline, and any future Engineer onboarding (new actors orient by reading this first).

**This document is NOT:**
- A roadmap. `docs/agents/ROADMAP.md` answers "what ships next, in what order, with what dependencies." MAIN_FLOWS answers "what does the product DO for members." Two different questions, two different audiences, no replacement.
- A status board. There is no "in-flight" / "blocked" / "%-complete" column. Each flow names the ships that contribute to it; for execution state, read ROADMAP and the individual ship files.
- A complete UX spec. Screens-in-order is named at the resolution of "which named view in the app" — pixel-level mocks live in `docs/CLUBHOUSE_SPEC*.md`.

## The filter rule (how this document is used)

Any proposed work, before reaching pre-flight audit, answers two questions:

1. **Which Main Flow (MF-NN) does this serve?**
2. **Which specific screen, state, or edge case in that flow does this improve?**

If question 2 cannot be answered with a concrete screen/state/edge-case named below, the proposal fails the filter. Refactor proposals citing "code health" without a screen/state/edge-case fail the filter — that work routes to the Lane 4 Code Quality stream and is evaluated on its own merits, not against the Main Flows surface.

Cross-reference: F5 Metric Integrity Protocol's "purpose / failure-mode / cross-check" framework applies to this filter directly. Devil's-Advocate's standing question — "whose metrics does this proposal flatter?" — is asked in every bubble that proposes "this serves Main Flow X."

## The Main Flows (ranked)

Eight flows, MF-01 through MF-08. Ranked by member-frequency × member-value (the orchestration team's recommendation; Founder edits the ranking). Each flow's ID is permanent; renumbering on a future edit requires explicit Founder ratification and a follow-up bubble.

---

### MF-01 — Log a round (start → score → close → see handicap update)

**Primary user goal:** Capture an 18-hole (or 9-hole) round during or after play, see the score reflected in personal stats and league context.

**Screens / states (in order):**
1. Home → "Log a round" tap (or active-round resume)
2. Course selection (GolfCourseAPI search → local-cache hit)
3. Tee selection + scorecard layout
4. Hole-by-hole entry — score, FIR, GIR, putts per hole
5. Submit confirmation
6. Round detail view (player, score, handicap differential)
7. Home returns showing updated handicap + last-round summary

**Known edge cases:**
- 9-hole round (don't render holes 10-18 in summary)
- Joined players in a Parbaugh Round must show on host's scorecard (Known Bug #9)
- Sub-noon timestamp rounding for "Xd ago" feedTimeAgo (S26 sub-test 1 issue)
- Offline-entered round: localStorage `pb_liveState` resume after browser crash
- Course not in API: manual par-array entry forbidden per CLAUDE.md "Zero guessing on course/par data"

**Served by ships:** W1.S4 (Round capture core), W1.S2 (HQ chrome surfaces handicap update), W1.S1 (design tokens consumed)

**Status served:** Built in v8.0-pre-Wave-1 form; W1.S4 redesigns on the Clubhouse system + adds hole-by-hole capture as default.

---

### MF-02 — View the League Pulse / leaderboard

**Primary user goal:** See what my league is doing right now — recent rounds, who's hot, where I stand.

**Screens / states (in order):**
1. Home → League Pulse band (above the fold)
2. Tap a Pulse card → round detail OR member profile
3. Leagues tab → standings → per-season points
4. Per-member detail line (handicap, last score, live-now indicator)

**Known edge cases:**
- Empty league (founder is sole member) — empty-state copy not "0 rounds"
- 9-hole vs 18-hole rounds in same standings (split column per known bug #4)
- Multi-league member sees only ACTIVE league's standings; not concatenation
- Spectator mode (W1.S5) treats non-league-members as read-only

**Served by ships:** W1.S2 (HQ Home Pulse), W1.S11 (Feed + Activity), W1.S13 (Leagues page), W1.S5 (Spectator overlay), W1.S3 (member rows)

**Status served:** Built in v8.22.0 (Ship 5+7) state for HQ Home Pulse; Wave 1 ships rebuild on the new design system.

---

### MF-03 — Find a player + add as friend

**Primary user goal:** Search for / discover another PARBAUGHS member, see their public profile, send a friend request.

**Screens / states (in order):**
1. Members directory (A-Z by username)
2. Profile tap → public-profile view
3. Friend-request CTA → request sent state
4. Recipient's notification → accept / decline
5. Bidirectional friend relationship visible in both friend lists

**Known edge cases:**
- Privacy default is PUBLIC per locked Founder decision; per-member opt-OUT to private
- Friend request to a private member: still allowed; respondent decides
- Cross-league friendship (any member can friend any member)
- Founding 20 are auto-friended per memory #28 — no manual request needed
- Discord-style `username#discriminator` per W4.I1 future schema (renumbering main flow OK if v9.1 ships)

**Served by ships:** W1.S3 (Members + Find Players)

**Status served:** Built in legacy form; W1.S3 rebuilds with public-default + friend-system at Firestore rule layer.

---

### MF-04 — Post and settle a wager (ParCoin)

**Primary user goal:** Challenge another member to a stakes round (any amount the poster has), watch the round play out, claim winnings or pay out cleanly.

**Screens / states (in order):**
1. Wagers section → "Post a wager" CTA
2. Wager composition (opponent, stakes, terms)
3. Opponent's notification → accept / decline
4. On accept: ParCoins escrowed from BOTH players' balances
5. Round played (MF-01) → outcome determines winner
6. Settlement screen → winner takes both stacks; ledger entry on both sides

**Known edge cases:**
- Wager cancelled before acceptance → no escrow ever happened, no refund needed
- Wager accepted then opponent never plays the round → expiry policy (currently manual; Bounty-expiry-refund TODO from CLAUDE.md "Known TODOs" applies here too)
- Wager between members of different leagues → cross-league wagers allowed per friend system

**Served by ships:** W1.S6 (Parcoin economy — Wagers / Bounties / Challenges), W1.S3 (cross-league friendship gate)

**Status served:** Wagers exist in legacy form; W1.S6 lands the consolidated economy with escrow integrity.

---

### MF-05 — Book or RSVP to a tee time

**Primary user goal:** Find a posted tee time matching your availability, RSVP, see who else is in.

**Screens / states (in order):**
1. Calendar tab → upcoming tee times
2. Post a tee time → date / course / openings count
3. Other members see the posted tee time in feed → RSVP button
4. Tee time fills → ParCoin reward to poster (15 coins per CLAUDE.md economy table)
5. Day of: tee time event card surfaces in Home

**Known edge cases:**
- Tee time host cancels → all RSVPs notified, ParCoin reward NOT awarded
- Tee time conflict with another tee time → no auto-conflict-detection (Founder discretion)
- Spectator mode users see tee times for their leagues only

**Served by ships:** W1.S8 (Calendar + Tee Times + Trips)

**Status served:** Built in legacy form; W1.S8 rebuilds with the new Calendar surface.

---

### MF-06 — Earn an achievement / see Trophy Room update

**Primary user goal:** Hit a milestone (personal best, season champion, range-session-streak, etc.), see the celebration, browse the Trophy Room.

**Screens / states (in order):**
1. Round / range session / wager-win triggers an achievement
2. Toast celebration (post-action, before navigation)
3. Achievement card lands in Activity / Feed
4. Trophy Room tab shows the new achievement in the "Recent" rail
5. ParCoin reward credited per CLAUDE.md economy table

**Known edge cases:**
- Achievement deduplication (a member who plays 2 personal-best rounds in a week earns ONE PB achievement, not two)
- Reduced-motion accessibility — `ach-celebrate` keyframe respects `prefers-reduced-motion` per v8.1.3
- Achievement earned in spectator-mode round (W1.S5) is the SPECTATOR's achievement or the player's — locked Founder decision pending
- Achievement loss / restoration (Nick achievement restore script precedent in scripts/)

**Served by ships:** W1.S9 (Trophy Room + Awards + Records + Aces)

**Status served:** Built in legacy form; W1.S9 lands the redesigned room + records.

---

### MF-07 — Range session log

**Primary user goal:** Log a practice session (range, putting green, short game), track drill focus, see range-history aggregate.

**Screens / states (in order):**
1. Home → "Log a range session" CTA
2. Session timer (start / pause / stop)
3. Focus areas + drill tags
4. Feel rating (1-5 stars)
5. Submit → session summary card → activity feed entry
6. Range tab shows per-week aggregates (CLAUDE.md "Season Recap + Range" features)

**Known edge cases:**
- Session < 30 min: ParCoin reward not awarded (per CLAUDE.md economy table — "Range session (30+ min)")
- Session paused for > 60 min: prompt to discard or commit
- Multi-day range tracker — sessions don't aggregate across calendar days

**Served by ships:** W1.S10 (Season Recap + Range)

**Status served:** Built in legacy form; W1.S10 redesigns with Clubhouse tokens + adds drill-focus visualization.

---

### MF-08 — Spectator + Caddy verify

**Primary user goal:** As a non-league-member, watch a member's round live (per league privacy rules), let "the Caddy" surface insights.

**Screens / states (in order):**
1. Live round in progress in any public-or-friend league
2. Spectator HUD overlay → score, hole, last shot
3. Caddy Notes inline (rule-based insights for non-Pro tier, AI-Caddie for Pro per Phase 4 roadmap)
4. End of round: spectator sees same final card as player
5. Spectator's own activity feed shows "watched X play Y" if opted-in

**Known edge cases:**
- Private league round visible only to league members; spectator who isn't gets the access-denied empty state
- Caddy Notes verify (W1.S5) — the AI Caddie's "verify" pass cross-checks rule-based output against round data before showing
- Live round vs replayed-after-completion round — different visual treatment

**Served by ships:** W1.S5 (Spectator + Caddy Notes verify), W1.S11 (Feed activity surfacing of spectator events)

**Status served:** Spectator HUD built in v8.21.0; W1.S5 lands the formal Caddy verify protocol.

---

## Flow-to-ship matrix (read flow → ships)

| Flow | Primary ship | Contributing ships |
|------|--------------|--------------------|
| MF-01 Log a round | W1.S4 | W1.S2, W1.S1 |
| MF-02 League Pulse | W1.S11 | W1.S2, W1.S13, W1.S5, W1.S3 |
| MF-03 Find + friend a player | W1.S3 | — |
| MF-04 Wager (ParCoin) | W1.S6 | W1.S3, W1.S4 (round outcome feeds settlement) |
| MF-05 Tee time | W1.S8 | W1.S11 (feed surfacing) |
| MF-06 Achievement / Trophy Room | W1.S9 | W1.S4, W1.S6, W1.S10 (any can trigger) |
| MF-07 Range session | W1.S10 | W1.S2 (Home CTA) |
| MF-08 Spectator + Caddy verify | W1.S5 | W1.S11 (feed surfacing) |

This matrix is the cross-reference table. Read flow → ships, not ship → flows.

## Open questions for Founder

1. **Ranking:** Engineer's draft ranks by recommended member-frequency × value. Founder may reorder.
2. **Flow count:** 8 is the current best fit to the 14 Wave 1 ships. Founder may add (e.g., "onboarding flow," "settings flow") or merge.
3. **Visual surface (db-005):** should MAIN_FLOWS become a 4th operational view at `docs/reports/main-flows.html` (cycle 2 ship, not cycle 1)? Design-Bot has voting rights at db-005.
4. **Cycle of update:** when does this document get amended? Recommendation: at every wave-close (W1 → W2 transition) + on any ship that materially changes a flow's screens-in-order.

## Cross-references

- Bubble of record: `.claude/state/discussion-bubbles/db-2026-05-13-004.md`
- F5 metric-integrity protocol: `.claude/state/wave-zero-dry-run/remediation/proposed-METRIC_INTEGRITY_PROTOCOL.md` (this doc's filter rule depends on F5)
- ROADMAP (NOT replaced): `docs/agents/ROADMAP.md`
- Ship Visions referenced: `docs/agents/ships/W1.S1.md` through `docs/agents/ships/W1.S14.md`
- Source-pattern reference: critical user journey literature (Nielsen Norman Group, Sequoia Linear spotlight, Product School). Founder's specific referent — Dave Janowiak X post — is not directly fetchable (paywall); the working hypothesis tracks the general industry pattern.

---

*Draft authored 2026-05-13 by orchestration-team during Wave Zero Dry-Run remediation pass F4. Awaiting Founder review + ratification + move to `docs/agents/MAIN_FLOWS.md`.*
