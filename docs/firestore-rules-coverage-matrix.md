# Firestore rules coverage matrix

**Generated:** 2026-05-21 by Goal 2 A7 Architecture audit (audit-spec-2026-05-19).
**Source:** `firestore.rules` (733 lines, rules_version='2', last reviewed v8.20.0 Ship 5+5).
**Purpose:** Every Firestore collection × every operation × who's allowed, with the rule clause that gates it. Defense-in-depth pairing with Cloud Function callable-bypass.

## Legend

- **C**: create
- **R**: read
- **U**: update
- **D**: delete
- **F**: Founder only (`amIFounder()`)
- **A**: active member (`amIActive()` — not banned + not suspended)
- **L**: league member (`amILeagueMember(leagueId)`)
- **LL**: league leadership (commissioner OR admin: `amILeagueLeadership()`)
- **LC**: league commissioner (`amILeagueCommissioner()`)
- **R**: readable (`amIReadable()` — not banned; suspended OK)
- **O**: doc owner (specific uid field match)
- **CF**: Cloud Function only (Admin SDK bypass; rules block client)
- **×**: forbidden for all clients (write blocked, allowed via CF Admin SDK)

## Coverage matrix

| Collection | C | R | U | D | Sub-collections | Notes |
|---|---|---|---|---|---|---|
| `members/{memberId}` | self only, must init `platformRole='user'` | self always; others if `amIReadable` | self+`A` OR `F`; `platformRole`/`suspension`/`ban` immutable via client | `F` | `erasure_requests/` | Decision 3.5.a |
| `members/{uid}/erasure_requests/{id}` | self, not banned | self OR `F` | × (CF only) | × (legal record) | — | GDPR anonymization |
| `platformConfig/{docId}` | × | `A` (founder identity is public) | × | × | — | Read-only; CF owns writes |
| `platform_announcements/{id}` | `F` | `A` | `F` | × | — | v8.0/v8.2 broadcasts |
| `founder_access_logs/{logId}` | × (CF only) | `R` + (league membership OR `F`) | × | × | — | Decision 3.5.a |
| `platform_audit_log/{logId}` | × (CF only) | `F` | × | × | — | Decision 8.1 |
| `banned_emails/{emailHash}` | × | × | × | × | — | Admin SDK only (CF) |
| `transfer_requests/{id}` | self-initiated, `LC` or `F` | participants OR `LL` (commissioner type) OR `F` | toUid accepting, fromUid cancelling within cooling-off, OR `F` | × (historical) | — | Cooling-off enforced |
| `rounds/{roundId}` | `A`+`L`+not-banned-from-league+author=self | `R` | author OR `LL` OR `F` OR (`L` + diff-only=`['likes','comments','commentLikes']`) | author OR `F` | — | v8.20.0 engagement diff-only |
| `dms/{dmId}` | `A` + self in participants | participant + not platform-banned | participant + not platform-banned | `F` | `messages/` | v8.11.2 — uses parent get() |
| `dms/{dmId}/messages/{msgId}` | `A` + `isDMParticipant(dmId)` | not-banned + dmId regex (v8.12 cleanup pending) | × | `F` | — | Read uses path regex |
| `chat/{msgId}` | `A` + `L` + not-banned + author=self | `R` + (`L` OR `F`) | author OR (`L` + diff-only) | author OR `LL` OR `F` | — | v8.19.0 engagement diff-only |
| `notifications/{notifId}` | `A` | self (`toUserId==uid`) | self | self | — | — |
| `invites/{inviteId}` | `A` | any auth | creator OR `LC` OR `F` | `F` | — | — |
| `config/{docId}` | `F` | any auth | `F` | `F` | — | Platform-level config |
| `parcoin_transactions/{txnId}` | `A` + `uid==self` | self (`uid==self`) | × | `F` | — | Gap 7 fix preserved |
| `pendingPush/{pushId}` | `A` | × | × | × | — | CF processes |
| `leagues/{leagueId}` | `A` + commissioner=self + initial single-member | `R` + (public OR member OR `F`) | `LC` OR `F` | `LC` + memberCount≤1 + not founding | `joinRequests/`, `moderation_log/` | Founding hard-gated |
| `leagues/{id}/joinRequests/{uid}` | `A` + self=requester + not-banned-from-league + not-already-member | self OR `LL` OR `F` | `A` + `LL` OR `F` | `F` | — | Fills Gap 8 |
| `leagues/{id}/moderation_log/{logId}` | `A` + `LL`/`F` + actor=self | `LL` OR `F` OR (target + not private) | `F` | `F` | — | Decision 8.3.a |
| `wagers/{wagerId}` | `A` + fromUid=self + `L` + not-banned-from-league | `R` + (participant OR `LL` OR `F`) | `A` + (participant OR `LL` OR `F`) | `F` | — | — |
| `bounties/{bountyId}` | `A` + createdBy=self + `L` + not-banned-from-league | `R` + `L` | `A` + (creator OR claimer OR new-claimer OR `LL` OR `F`) | `LC` OR `F` | — | Gap 4 fix preserved |
| `courses/{courseId}` | `A` | `R` | `A` | `A` | — | Community-writable per v7.x precedent |
| `course_reviews/{reviewId}` | `A` + userId=self | `R` | `A` + (author OR `F`) | `A` + (author OR `F`) | — | — |
| `photos/{photoId}` | `A` + uploadedBy=self | `R` | `A` + (uploader OR `F`) | `A` + (uploader OR `F`) | — | — |
| `teetimes/{teeId}` | `A` + createdBy=self + `L` + not-banned + 2≤spots≤5 (int) | `R` + `L` | `A` + (creator OR `LL` OR `F` OR `L`+responses-only) | `A` + (creator OR `LL` OR `F`) | — | v8.18.0 RSVP diff-only |
| `scrambleTeams/{teamId}` | `A` + `L` + not-banned | `R` + `L` | `A` + (member OR `LL` OR `F`) | `LC` OR `F` | — | — |
| `calendar_events/{eventId}` | `A` + createdBy=self + `L` | `R` + `L` | `A` + (creator OR `LL` OR `F`) | `A` + (creator OR `LL` OR `F`) | — | — |
| `scheduling_chat/{msgId}` | `A` + `L` + authorId=self | `R` + `L` | × | `LL` OR `F` | — | Immutable msgs |
| `trips/{tripId}` | `A` + `L` | `R` + `L` | `A` + `LL` | `LC` OR `F` | — | — |
| `tripscores/{scoreId}` | `A` + (self OR leagueId+`LL`) | `R` + `L` (denorm OR via trip get) | `A` + (self OR leagueId+`LL` OR `F`) | `F` | — | DESIGN NEEDED 3.3.2 |
| `social_actions/{actionId}` | `A` + fromUid=self | `R` | × | × | — | Immutable |
| `syncrounds/{roundId}` | `A` | `R` | `A` | `A` | — | Live state |
| `liverounds/{roundId}` | `A` + roundId=uid | `R` | `A` + roundId=uid | `A` + roundId=uid | — | Self-scoped by ID |
| `presence/{userId}` | `A` + userId=uid | `R` | `A` + userId=uid | `A` + userId=uid | — | Self-scoped by ID |
| `rangeSessions/{sessionId}` | `A` + playerId=self | `R` | `A` + playerId=self | `A` + (player OR `F`) | — | Gap 6 fix preserved |
| `errors/{errorId}` | any auth | `F` | `F` | `F` | — | Error log |
| `pending_celebrations/{celebId}` | `A` | `R` | × | × | — | Immutable broadcast |
| `feature_requests/{reqId}` | `A` | `F` | `F` | `F` | — | Backlog |
| `reports/{reportId}` | `A` | `F` | `F` | `F` | — | User-submitted abuse reports |
| `attestations/{attId}` | `A` | `R` | `A` | `A` | — | Round attestation log |
| `partygames/{gameId}` | `A` + `L` | `R` | `A` + `L` | `A` + `L` | — | Per-league |

## Identified gaps (action items)

### Gap A — `dms/{dmId}/messages/{msgId}` read still uses path regex

```javascript
allow read: if isAuth()
           && !isPlatformBanned(uid())
           && (dmId.matches(uid() + '_.*') || dmId.matches('.*_' + uid()));
```

**Risk:** v8.11.2 hardened CREATE but left READ on the older regex pattern. Same `'https://alrightlad.github.io.evil.com'` style edge case applies if a `dmId` is crafted to falsely match.

**Action:** Refactor read to use `isDMParticipant(dmId)` like create does. Deferred to v8.12.x cleanup per inline comment.

### Gap B — `tripscores` rule references both denormalized + chained get

```javascript
allow read: if amIReadable() && (
  'leagueId' in resource.data
    ? amILeagueMember(resource.data.leagueId)
    : amILeagueMember(get(/databases/$(database)/documents/trips/$(resource.data.tripId)).data.leagueId)
);
```

**Risk:** Pre-rc2 trip scores without denorm `leagueId` field trigger an extra Firestore get() per read — billing scales linearly with trip-score reads.

**Action:** Backfill `leagueId` on all `tripscores` docs (Cloud Function migration). Decision 3.3.2 placeholder open since v8.0.

### Gap C — `courses` community-writable

```javascript
match /courses/{courseId} {
  allow read: if amIReadable();
  allow write: if amIActive();
}
```

**Risk:** Any active member can overwrite or delete any course doc. With 20 members in a tight friend-group this is acceptable; opens a vandalism vector if member count grows or trust breaks.

**Action:** Tighten to `(creator OR LL)` write once moderation flow exists.

### Gap D — `syncrounds` write rule

```javascript
match /syncrounds/{roundId} {
  allow read: if amIReadable();
  allow write: if amIActive();
}
```

**Risk:** Any active member can overwrite anyone else's syncround. Same vandalism risk as Gap C.

**Action:** Add `request.resource.data.player == uid()` constraint on writes.

### Gap E — `attestations`, `courses`, `partygames` lack diff-only constraint

Members can write entire docs, including fields they shouldn't own (e.g., overwriting attestation timestamps to fake history). Lower-risk than Gaps A/D but worth tightening for industry-grade posture.

## Coverage verification

The matrix above accounts for **all 33 explicitly-defined collections + 4 sub-collections** in `firestore.rules`. The rules file ends with `// NO CATCH-ALL. Every collection must have explicit rules above.` which provides defense-in-depth — any new collection added to the schema without a corresponding rule will be denied by default.

## Test coverage

Companion: `tests/firestore-rules/v8-rules.spec.js` (run via `npm run test:rules`). Coverage at last verification: targeted on members, dms, chat, parcoin_transactions, leagues, wagers. **Not yet covering:** tripscores edge paths, presence/liverounds self-scoping, erasure_requests subcollection, banned_emails CF-only constraint.

**Action:** expand test:rules to hit the gaps above (separate ship).

## Cross-reference

- `firestore.rules` — the source of truth
- `docs/v8.0-technical-design.md` Section 3 — design intent
- `docs/v8-decisions-log.md` — decisions 2.1.a, 3.1.a, 3.3.2, 3.5.a, 5.2.c, 7.1.c.1, 8.1, 8.3.a
- `tests/firestore-rules/v8-rules.spec.js` — companion runtime test
- `functions/index.js` — Admin-SDK callable bypasses for joinLeague + onMemberRoleChange + onLeagueDelete
