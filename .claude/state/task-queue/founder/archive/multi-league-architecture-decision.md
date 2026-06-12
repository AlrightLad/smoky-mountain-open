---
status: closed
severity: green
priority: HIGH
authored_at: 2026-06-10T16:00:00Z
authored_by: agent (parallel fleet)
founder_action_required: true
decision_type: architecture-sign-off
cost: $0
execute_by: agent (after approval)
---

# Multi-league round attribution — APPROVE THE MODEL

## Decisions you need to make

1. F1 — Approve the core model: rounds are personal-first (owned by the player forever) with a leagueIds[] publish array on a single round doc; leagues become visibility windows, not owners. Recommended: YES.
2. F2 — Join-date windows are enforced at PUBLISH time only (client picker + Firestore rules date check vs leagues/{id}.memberJoinedAt); read side trusts the array, so rejoining members keep their prior-stint rounds visible and cannot back-publish gap rounds. Recommended: YES.
3. F3 — Grandfather all existing members with the '0000-00-00' sentinel join date so migration day produces ZERO visible change in The Parbaughs. Recommended: YES.
4. F4 — A round published to multiple leagues shares ONE like/comment/reaction thread across them (v1); per-league threads deferred to a future publications-collection model if ever needed. Recommended: ACCEPT for v1.
5. F5 — Leaving a league keeps your already-published rounds in that league's history (no retroactive standings/season changes). Recommended: YES.
6. F6 — publishAllDuringSeason is a commissioner-set DEFAULT that pre-checks the league in the log-time picker during the season; the member can always uncheck (member sovereignty, not forced publishing). Recommended: DEFAULT-ONLY.
7. F7 — Handicap is GLOBAL everywhere including league standings, computed from ALL personal rounds (private and unpublished included) — the anti-sandbag guarantee; standings.js switches from league-local calcHandicap to the member doc's global computedHandicap. Recommended: YES.
8. F8 — Picker defaults: active league pre-checked, in-season auto-check for publishAllDuringSeason leagues, remembered un-checks stored on the member doc (publishDefaults, Firestore-first, no new localStorage key). Single-league members (all 20 today) see zero added friction. Recommended: YES.
9. F9 — Cap of 4 leagues per round publish (Firestore rules cannot loop; validation is unrolled to 4 slots, staying under the 10-doc-access rules limit). Recommended: YES.
10. F10 — AMD-018 gate 1 pre-authorization for two Cloud Function deploys: (a) joinLeague writes memberJoinedAt[uid] in its existing transaction; (b) onLeagueDelete STOPS cascade-deleting round docs (discovered landmine at functions/index.js:591) and instead arrayRemoves the leagueId, preserving members' personal golf history when a league is deleted. Recommended: APPROVE.
11. F11 — Pre-authorization for one-time composite-index creation (4 new rounds indexes incl. leagueIds array-contains variants) via Firebase console or gcloud, since the proven seed-deploy-rules.mjs REST path covers rules but not indexes. Recommended: APPROVE.

---

# Multi-League Round Attribution — Founder Decision Doc

**Task #35 · v1.0 · 2026-06-10 · Status: AWAITING FOUNDER APPROVAL**
**Author: Claude Code (Engineer) · Scope: architecture decision + build plan · No code changes yet**

---

## 0. The question this answers

> *"If a member is in two leagues and plays a round, whose round is it? And when someone joins a league, does their whole history dump in? This feels like a data nightmare."* — Founder

Today it IS a latent nightmare: every round is branded with exactly one `leagueId` at save time (the active league), permanently. A member of two leagues who logs a round while "The Parbaughs" is active produces a round that *does not exist* in their second league — wrong standings, wrong handicap inputs, wrong feed. Switching the active league silently changes where future rounds land. There are no second leagues yet, so nothing is broken *today* — which is exactly why now is the time to fix the model.

**The agreed model:** A round belongs to the PERSON, forever. Leagues are *visibility windows* onto a member's personal golf history. A round carries a `leagueIds[]` publish array — the list of leagues the member chose to share it with. Handicap is GLOBAL (computed from every round the member ever logged, published or not, public or private) so nobody can sandbag a league by hiding good rounds. Join date bounds what a new member can publish into a league — your history doesn't dump in when you join.

---

## 1. Current state (grounded in code, verified 2026-06-10)

| Fact | Where |
|---|---|
| `rounds` is in `LEAGUE_SCOPED`; all reads go through `leagueQuery("rounds")` = `where("leagueId","==",activeLeague)` | `src/core/utils.js:13-39` |
| `syncRound` stamps `d.leagueId = getActiveLeague()` on every write | `src/core/sync.js:155` |
| League round loader: `leagueQuery("rounds").orderBy("date","desc").limit(500)` → `PB.setRoundsFromFirestore` → in-memory `state.rounds` powers **standings, records, rounds page, The Chase, Course Legend, analytics, XP** | `src/core/sync.js:296-323` |
| Feed: `leagueQuery("rounds").where("visibility","==","public").orderBy("createdAt","desc").limit(40)` | `src/pages/feed.js:76` |
| Activity feed: `leagueQuery("rounds").orderBy("createdAt","desc").limit(30)` | `src/core/router-activity-feed.js:107` |
| Member stats are **already GLOBAL**: `persistPlayerStats` queries `db.collection("rounds").where("player","==",id)` across ALL leagues and persists `computedHandicap` to the member doc | `src/core/sync.js:158-218` |
| …but standings recomputes handicap from **league-local** `state.rounds` (`calcHandicap(allRounds)`) — an inconsistency the new model resolves | `src/core/data.js:2012` |
| Rules: rounds **read = `amIReadable()`** (any non-banned signed-in member — league isolation is query-level, NOT rules-level, today); create requires `player == uid()` + `amILeagueMember(leagueId)` + not league-banned; update has author/leadership/founder/engagement branches; delete author/founder | `firestore.rules:307-338` |
| League membership: `leagues/{id}.memberUids[]` + `members/{uid}.leagues[]` + `activeLeague`. **No join timestamp exists anywhere** | `firestore.rules:138-152`, `functions/index.js:800-806`, `src/core/firebase.js:372,388` |
| Composite indexes on rounds: `(leagueId,date↓)`, `(leagueId,createdAt↓)`, `(leagueId,visibility,createdAt↓)` | `firestore.indexes.json` |
| Handicap math excludes scrambles + sub-18 rounds; includes private rounds | `src/core/handicap.js:68-115`, `sync.js:182` |
| **LANDMINE:** `onLeagueDelete` cascade-**DELETES** all round docs for a deleted league. Under personal-first this would destroy members' personal golf history — must change to un-publish | `functions/index.js:576-593` (`CASCADE_DELETE_COLLECTIONS` includes `'rounds'`) |
| Pre-existing wart: `members-edit.js:337` queries `playerId` while `addRound` writes `player` (claim path writes both) — backfill normalizes | `src/pages/members-edit.js:337`, `src/core/data.js:351` |

**Alternatives considered (P5):** (a) per-league round *copies* (fan-out) — rejected: duplicate engagement threads, N-way edit sync, storage churn; (b) **`leagueIds[]` array on the single round doc — CHOSEN**: one doc, one truth, Firestore `array-contains` queries are first-class; (c) separate `round_publications/{roundId_leagueId}` join collection — the non-obvious option; most flexible (per-league comment threads, per-league unpublish audit) but doubles query counts and rules complexity for a 20-member platform. Revisit (c) only if per-league engagement threads become a real demand.

---

## 2. Schema changes (exact)

### 2.1 `rounds/{roundId}` — add `leagueIds[]`, keep `leagueId` during transition

```js
// AFTER (example: round published to two leagues)
{
  id: "m3k9xq1a",
  player: "uid_zach",            // OWNER — unchanged, the anchor of the model
  playerName: "Zach",
  course: "Heritage Hills",
  score: 84, date: "2026-06-12", rating: 70.1, slope: 124,
  format: "stroke", holesPlayed: 18, visibility: "public",
  timestamp: 1781280000000, createdAt: <serverTimestamp>,

  leagueIds: ["the-parbaughs", "york-muni-crew"],   // NEW — publish array. [] = personal-only
  leagueId: "the-parbaughs",                        // LEGACY — mirror of leagueIds[0]; kept through
                                                    // Phase 4, write stops in Phase 5
  // likes / comments / commentLikes / reactions — unchanged (one shared thread; see §6.4)
}
```

**Field semantics (the contract):**
- `leagueIds: string[]` — leagues this round is published to. Max 4 entries (rules-enforced, see §3). `[]` = personal-only round.
- `visibility: "public" | "private"` — unchanged meaning, now orthogonal: `private` = hidden from feeds AND profile viewers (and `leagueIds` forced to `[]` by the picker). `public` + `leagueIds: []` = visible on your profile, in no league.
- **Every round, regardless of `visibility`/`leagueIds`, counts toward GLOBAL handicap** (anti-sandbag — already true via `persistPlayerStats`, now made the single source).

### 2.2 `leagues/{leagueId}` — add join-date map + season-publish setting

```js
{
  // ...existing: name, commissioner, admins[], memberUids[], memberCount, bans[], visibility, badge...
  memberJoinedAt: {                 // NEW — YYYY-MM-DD date strings (string compare works in
    "uid_zach":  "0000-00-00",      //   rules AND client; matches rounds.date format).
    "uid_newguy": "2026-06-15"      //   "0000-00-00" sentinel = grandfathered, full history eligible.
  },
  publishAllDuringSeason: false     // NEW — commissioner toggle, default false. See §2.4.
}
```

Placed on the league doc (not member docs) because: (1) rules already `get()` the league doc for membership checks — the map rides along at zero extra reads; (2) the client already loads the league doc at startup (`loadActiveLeagueName`, sync.js:12); (3) one writer — the `joinLeague` Cloud Function adds `memberJoinedAt[uid] = today` inside its existing transaction (functions/index.js:800-806).

### 2.3 `members/{uid}` — one optional field

```js
{
  // ...existing: leagues[], activeLeague, computedHandicap, ...
  publishDefaults: { "york-muni-crew": false }   // NEW, optional — remembered picker un-checks.
}                                                 // Firestore-first (no new localStorage key).
```

### 2.4 League setting: `publishAllDuringSeason`

When `true`, the log-time picker **pre-checks** that league for any round dated inside the platform season window (Mar 1 – Nov 30, `SEASON_CONFIG`). The member can still uncheck it — it is a default, not a mandate (Founder decision F6). Commissioner toggles it in league settings.

---

## 3. firestore.rules diff sketch

```diff
     function isBannedFromLeague(leagueId, memberUid) {
       return memberUid in leagueDoc(leagueId).get('bans', []);
     }
+
+    // ─── Round publish validation (multi-league, v8.25) ──────────────
+    // canPublishTo: member of the league, not banned, and the round's
+    // play date is on/after their join date (join-window enforcement —
+    // history cannot be dumped into a league you just joined).
+    // '0000-00-00' sentinel (grandfathered members) always passes.
+    function canPublishTo(lid) {
+      return amILeagueMember(lid)
+        && !isBannedFromLeague(lid, uid())
+        && request.resource.data.date >=
+             leagueDoc(lid).get('memberJoinedAt', {}).get(uid(), '0000-00-00');
+    }
+    // Rules can't loop; unrolled to the 4-league cap. Each unique league
+    // doc get() is cached within one evaluation — worst case 4 doc reads,
+    // well under the 10-access limit.
+    function leagueIdsValid(ids) {
+      return ids is list && ids.size() <= 4
+        && (ids.size() < 1 || canPublishTo(ids[0]))
+        && (ids.size() < 2 || canPublishTo(ids[1]))
+        && (ids.size() < 3 || canPublishTo(ids[2]))
+        && (ids.size() < 4 || canPublishTo(ids[3]));
+    }

     // ─── Rounds (personal-first, league-published) ──────────────────
     match /rounds/{roundId} {
       allow read: if amIReadable();
       allow create: if amIActive()
                    && request.resource.data.player == uid()
-                   && amILeagueMember(request.resource.data.leagueId)
-                   && !isBannedFromLeague(request.resource.data.leagueId, uid());
+                   && (
+                     // NEW shape: leagueIds publish array (may be empty = personal round)
+                     leagueIdsValid(request.resource.data.get('leagueIds', []))
+                     // LEGACY shape accepted through Phase 4 (dual-write window);
+                     // this whole branch is DELETED in Phase 5.
+                     || (request.resource.data.get('leagueIds', null) == null
+                         && amILeagueMember(request.resource.data.leagueId)
+                         && !isBannedFromLeague(request.resource.data.leagueId, uid()))
+                   );
       allow update: if amIActive() && (
-        resource.data.player == uid()
+        // Author: full edit; if leagueIds changed, re-validate the new set
+        // (re-publish/unpublish goes through the same join-window gate).
+        (resource.data.player == uid()
+         && (!request.resource.data.diff(resource.data).affectedKeys()
+                .hasAny(['leagueIds'])
+             || leagueIdsValid(request.resource.data.get('leagueIds', []))))
         || amILeagueLeadership(resource.data.leagueId)        // see note below
         || amIFounder()
         || (amILeagueMember(resource.data.leagueId)
             && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['likes', 'comments', 'commentLikes', 'reactions'])
             && !isBlockedBy(resource.data.player))
       );
       allow delete: if amIActive()
                    && (resource.data.player == uid() || amIFounder());
     }
```

**Notes for the build:**
- **Read stays `amIReadable()`.** Honest statement: league isolation remains *query-level*, exactly as today (utils.js calls this "nuclear" but rules never enforced per-league reads — firestore.rules:309). It must stay broad because GLOBAL handicap requires reading a player's rounds across all leagues. Acceptable on an invite-only 20-member platform; revisit if leagues between strangers ever ship.
- **Leadership/engagement branches** reference `resource.data.leagueId` today. In Phase 4 these become `request.auth`-side checks against the array: leadership of **any** league in `leagueIds` may moderate (`leagueIds[0]`-anchored during transition is fine since leagueId mirrors it; full multi-league moderation unrolls the same 4-slot pattern). Engagement: replace `amILeagueMember(resource.data.leagueId)` with membership in any of `resource.data.leagueIds` (same unrolled helper, reading `resource` instead of `request.resource`).
- **Deploy path:** `node scripts/seed-deploy-rules.mjs <project>` (proven staging+prod; the in-session classifier blocks `firebase deploy`). Rules-emulator tests FIRST, seeding the real app-written doc shape per the scrambleTeams lesson (tests must seed `leagueIds` arrays exactly as `syncRound` writes them).

---

## 4. Required composite indexes

New (add in Phase 1; `array-contains` + orderBy requires composites with `arrayConfig: CONTAINS`):

```json
{ "collectionGroup": "rounds", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "leagueIds", "arrayConfig": "CONTAINS" },
  { "fieldPath": "date", "order": "DESCENDING" } ] },
{ "collectionGroup": "rounds", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "leagueIds", "arrayConfig": "CONTAINS" },
  { "fieldPath": "createdAt", "order": "DESCENDING" } ] },
{ "collectionGroup": "rounds", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "leagueIds", "arrayConfig": "CONTAINS" },
  { "fieldPath": "visibility", "order": "ASCENDING" },
  { "fieldPath": "createdAt", "order": "DESCENDING" } ] },
{ "collectionGroup": "rounds", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "player", "order": "ASCENDING" },
  { "fieldPath": "date", "order": "DESCENDING" } ] }
```

The fourth (player+date) serves the personal-history surfaces (profile round list, global handicap detail) with server-side ordering. Firestore allows max ONE `array-contains` per query — every flipped query below respects that. The three legacy `leagueId` composites stay until Phase 5, then are deleted. Index deploys are config-only (no code path) but sit AMD-018-adjacent — listed as a Founder pre-auth item (F11) since the proven REST rules-deploy script does not cover indexes (path: Firebase console or `gcloud firestore indexes composite create`, one-time).

---

## 5. Query + code changes per surface

| Surface | Today | After (Phase 4) |
|---|---|---|
| **League rounds loader** (`sync.js:296-323`) — feeds standings/records/Chase/Legend/XP via `state.rounds` | `where("leagueId","==",L).orderBy("date","desc").limit(500)` | `where("leagueIds","array-contains",L).orderBy("date","desc").limit(500)` — one-line change inside `leagueQuery` (see below); zero changes in the ~dozen consumers of `state.rounds` |
| **`leagueQuery("rounds")`** (`utils.js:18-30`) | equality filter | special-case: `if (name === "rounds") return db.collection(name).where("leagueIds","array-contains",league);` — every other LEAGUE_SCOPED collection unchanged |
| **`syncRound`** (`sync.js:155`) | stamps single `leagueId` | carries `r.leagueIds` (from picker) through; mirrors `d.leagueId = (r.leagueIds[0] || null)` until Phase 5 |
| **Feed** (`feed.js:76`) | `leagueQuery + visibility=="public" + createdAt↓` | same call — inherits array-contains from `leagueQuery`; needs index #3 |
| **Activity feed** (`router-activity-feed.js:107`) | `leagueQuery + createdAt↓` | same — index #2 |
| **Standings / The Chase** (`standings.js`, `data.js:1991-2030`) | `state.rounds` (auto-correct after loader flip) + **league-local** `calcHandicap(allRounds)` (data.js:2012) | `state.rounds` unchanged; handicap line switches to the member doc's **global** `computedHandicap` (already persisted by `persistPlayerStats`) — the anti-sandbag change |
| **Course Legend** (`analytics.js:343`) | `PB.getCourseRounds` → `state.rounds` | unchanged — inherits loader flip |
| **Global handicap / member stats** (`sync.js:160-218`) | already global `where("player","==",id)` | unchanged (becomes the celebrated canonical path, not the exception) |
| **Profile data deletion** (`members-edit.js:337`) | `leagueQuery("rounds").where("playerId","==",uid)` — misses other-league rounds today (bug) | `db.collection("rounds").where("player","==",uid)` — personal-first fixes a real existing data-deletion gap |
| **Log a Round / Play Now finish** (`playnow.js`, `data.js:344-394`) | implicit active league | league picker (§7) supplies `leagueIds`; `addRound` passes it through |
| **`onLeagueDelete` CF** (`functions/index.js:591`) | cascade-**deletes** round docs | remove `'rounds'` from `CASCADE_DELETE_COLLECTIONS`; instead batch `leagueIds: FieldValue.arrayRemove(lid)` — members keep their golf history when a league dies. **Cloud Function deploy = AMD-018 gate 1 Founder pre-auth** |
| **`joinLeague` CF** (`functions/index.js:780-822`) | no join timestamp | inside the existing transaction: `tx.update(leagueRef, { ['memberJoinedAt.' + uid]: todayDateString })` — same gate 1 deploy |

---

## 6. Edge cases (decided here, Founder can veto)

1. **Leave a league** → published rounds KEEP their `leagueIds` entry. League history and past-season standings stay intact (today's behavior has the same property; nobody's season retroactively changes because a member left). Member doc `leagues[]` shrinks; `activeLeague` reassigns if needed.
2. **Rejoin** → `memberJoinedAt[uid]` is overwritten with the NEW join date. Prior-stint rounds remain visible (their `leagueIds` already carry the league — publish-time validation is the gate, read-time trusts the array). Rounds logged during the gap CANNOT be back-published (`date < new joinedAt`, rules-enforced). No history dump, no history loss. This is why enforcement is **publish-time only** — a read-time window filter would wrongly hide prior-stint rounds after a rejoin.
3. **Round delete** → one doc, deletes everywhere (profile + every league + its likes/comments). Same blast radius as today. Handicap recomputes on next `persistPlayerStats`.
4. **Shared engagement thread** → a round published to 2 leagues has ONE like/comment/reaction thread visible from both. v1 accepts this (the audience is one friend group; community-over-competition). Per-league threads = the §1(c) publications model, deferred. Engagement rules branch requires membership in at least one of the round's leagues, so a stranger-league member can't comment into a league they don't share — at current scale all leagues are friends.
5. **Scrambles** → scramble rounds stay effectively single-league: they're league EVENTS (`scrambleTeams` keeps its single `leagueId`, untouched). Picker is locked to the event's league for scramble formats. Already excluded from handicap (`handicap.js:77`).
6. **Retroactive rounds (B.44 paper scorecards)** → `date` predates a league's `joinedAt` → that league's chip is disabled in the picker with the reason inline ("Played before you joined York Muni Crew"); rules enforce the same server-side. Honest by design.
7. **League-banned member** → rules block new publishes to that league (`canPublishTo`); existing published rounds remain but league leadership's update branch lets them unpublish (moderation parity with today).
8. **Private rounds** → `leagueIds: []` forced by picker; still counted in global handicap (anti-sandbag, unchanged from today's `persistPlayerStats` behavior).
9. **Listener limit** → 500-round league cap (`sync.js:298`) unchanged in cost or shape; `array-contains` reads bill identically to equality reads.
10. **Pre-existing `player`/`playerId` dual-field wart** → backfill normalizes `playerId = player` on every round doc while it's already touching them (no reader changes required; closes the members-edit.js query gap).

---

## 7. Log-time league picker UX

On the round save screen (Play Now finish + Log a Round), a single new block — invisible complexity for today's users:

```
POST TO
[✓ The Parbaughs]  [  York Muni Crew]  [ Private — just me ]
```

- One chip per league in `currentProfile.leagues`, plus a Private toggle (sets `visibility:"private"`, `leagueIds:[]`).
- **Defaults:** active league checked; other leagues checked when their `publishAllDuringSeason` is on and the round date is in season; member's remembered un-checks (`publishDefaults`) respected. Last-used wins on conflict.
- Disabled chips show why (join-window, scramble lock, league ban).
- **Single-league members — all 20 current users — see one pre-checked chip: zero added friction, pixel-for-pixel today's flow.** The picker only *grows* when a second league exists.
- 44pt touch targets, Clubhouse tokens, no new colors.

---

## 8. Migration plan

**Order of operations is the safety story: every phase is independently shippable and reversible.**

- **Phase 0 — Backups + tests (no deploys).** Fresh origin backup + Firestore export (prod-push gate standard). Write rules-emulator tests for BOTH doc shapes, seeding exactly what `syncRound` writes (scrambleTeams lesson). E2E: log-round flow with picker behind a flag.
- **Phase 1 — Compat rules + indexes.** Deploy rules accepting both shapes (§3) via `seed-deploy-rules.mjs`. Create the 4 new composites (F11 pre-auth). Nothing user-visible. *Rollback: redeploy previous rules file (kept in git).*
- **Phase 2 — Dual-write client.** `syncRound` writes `leagueIds` (picker output; for now hard-defaulted to `[activeLeague]`) + legacy `leagueId` mirror. All readers still on `leagueId`. Ship → staging → prod per ship-cycle. *Rollback: revert client; old docs unaffected (extra field is inert).*
- **Phase 3 — Backfill.** `scripts/migrate-rounds-leagueids.mjs` (Admin SDK, same SA/token pattern as `seed-deploy-rules.mjs`):
  - For every `rounds` doc missing `leagueIds`: set `leagueIds = leagueId ? [leagueId] : []`; normalize `playerId = player`. Keep `leagueId`.
  - For every `leagues` doc: `memberJoinedAt = { each memberUid: "0000-00-00" }` (grandfathered — **zero visible change on migration day**, every existing member keeps full history in their league).
  - Batched 400 writes/commit, idempotent (skips docs that already have `leagueIds` — safe to re-run), `--dry-run` flag prints counts first, final report asserts `count(leagueIds exists) == count(all rounds)`.
  - Verify via Firestore REST spot-checks (proven prod-triage path).
  - *Rollback: none needed — purely additive; readers ignore the new field until Phase 4.*
- **Phase 4 — Read flip + features.** `leagueQuery("rounds")` → `array-contains`; members-edit deletion query → `player`-global; standings handicap → global `computedHandicap`; picker UI live; `joinLeague` + `onLeagueDelete` CF changes deployed (AMD-018 gate 1 pre-auth, F10). Full E2E (3 viewports, zero-fail) before prod. *Rollback: revert client to equality reads — both fields exist on every doc, instant.*
- **Phase 5 — Cleanup (≥2 weeks green).** Stop writing legacy `leagueId`; delete the legacy rules branch; drop 3 old composites. Old docs keep the inert `leagueId` field (harmless; optional scrub script later).

---

## 9. Cost, risk, P-compliance

- **Cost:** zero new collections, zero fan-out, ~4 extra cached doc-reads per round *create* (rules validation), identical query billing. Fits Blaze free-tier headroom at 20 members and at 10x (P3).
- **Biggest real risk:** the Phase 4 read flip racing the backfill → mitigated by ordering (backfill completes + verifies before flip) and by dual fields making rollback a pure client revert.
- **Security (P8):** rules-emulator suite + AgentShield before each phase ship; no new secrets; read-surface honestly documented (§3 note 1).
- **Data truthfulness (P9):** grandfather sentinel guarantees no round disappears from any surface on migration day; backfill report gives exact before/after counts for the retrospective.

---

## 10. Founder decisions requested

| # | Decision | Recommendation |
|---|---|---|
| F1 | Approve the model: rounds personal-first, `leagueIds[]` publish array, single doc (no copies) | **Yes** — resolves the data nightmare at the root |
| F2 | Join-window enforced at **publish time only**; read side trusts the array (rejoin keeps prior-stint rounds visible) | **Yes** — only coherent rejoin story |
| F3 | Grandfather all existing members (`"0000-00-00"`) — zero visible change on migration day | **Yes** |
| F4 | One shared like/comment thread on multi-league rounds (v1) | **Accept for v1**; per-league threads deferred |
| F5 | Leaving a league keeps your published rounds in its history (no retroactive standings change) | **Yes** — protects past seasons |
| F6 | `publishAllDuringSeason` is a *default*, member can still uncheck (member sovereignty) vs. hard-forced | **Default-only** — community over surveillance |
| F7 | GLOBAL handicap everywhere, including league standings; private + unpublished rounds still count (anti-sandbag) | **Yes** — this is the integrity feature |
| F8 | Picker defaults: active league pre-checked + in-season auto-check + remembered un-checks on member doc | **Yes** |
| F9 | 4-league cap per round publish (rules unroll limit) | **Yes** — revisit if anyone ever has 5 leagues |
| F10 | Pre-auth two Cloud Function changes (AMD-018 gate 1): `joinLeague` writes `memberJoinedAt`; `onLeagueDelete` stops deleting rounds (arrayRemove instead) | **Approve** — the onLeagueDelete fix protects member data |
| F11 | Pre-auth one-time composite-index creation (console or gcloud; rules-REST script doesn't cover indexes) | **Approve** |

**Approve F1–F11 as recommended and the build proceeds Phase 0 → 5 with no further Founder touch points except the two pre-auth'd deploys and final visible verification.**


---
**CLOSED 2026-06-11:** APPROVED by Founder 2026-06-11. Migration + rules ship is now agent work (guarded scripts unblocked); no further founder action.
