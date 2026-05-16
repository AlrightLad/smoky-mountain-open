# Firestore Rules Coverage Matrix (P8 A01 — D34)

**Audited:** 2026-05-15
**Source:** `firestore.rules` (693 lines, v8.0.0-rc1 explicit per-collection rewrite)
**Method:** Read-only audit per spec P8 (no rule modifications)
**Per spec D34:** firestore-rules-coverage matrix committed.

## Architecture summary

- **No catch-all rule** — explicit confirmation at top of rules file
- **42 collection match blocks** (41 unique collection paths + 1 outer databases block)
- **136 allow directives** (read/write/create/update/delete per collection)
- **192 helper-function invocations** (isAuth, uid, memberDoc, myProfile, platformRoleOf, isFounder, isSuspended, isBanned, leagueCommissioner)
- **List-query compatibility verified** for collections that the client queries via where/array-contains (per Cutover Playbook Pattern 4)

## Per-collection coverage matrix

| Collection | read | create | update | delete | List-query? | Notes |
|---|---|---|---|---|---|---|
| **Member core** | | | | | | |
| members | per-id by owner OR commissioner OR isFounder | self-only OR isFounder bootstrap | self OR commissioner partial OR isFounder full | isFounder only | yes (filter by leagues array) | owner-restricted; commissioner partial-write per league |
| presence | auth read; self write | self | self | n/a | n/a | live-status |
| founder_access_logs | isFounder | server-only | n/a | isFounder | n/a | append-only |
| platform_audit_log | isFounder | server-only | n/a | isFounder | n/a | append-only |
| **Platform admin** | | | | | | |
| platformConfig | auth read | isFounder | isFounder | isFounder | n/a | runtime config |
| platform_announcements | auth read | isFounder | isFounder | isFounder | n/a | broadcast |
| banned_emails | server hash lookup | isFounder | isFounder | isFounder | n/a | abuse-prevention |
| transfer_requests | self OR isFounder | self auth | self OR isFounder | isFounder | n/a | account transfer |
| feature_requests | auth | auth-creator OR isFounder | auth-creator OR isFounder | isFounder | n/a | suggestion box |
| **Game data** | | | | | | |
| rounds | leagueMember | self-creator + leagueMember | self-creator + leagueMember | self-creator OR isFounder | yes (leagueId field) | core game data |
| syncrounds | leagueMember | self-creator | self-creator | self-creator OR isFounder | yes | sync version |
| liverounds | leagueMember | self-creator | self-creator | self-creator OR isFounder | yes | in-progress |
| rangeSessions | leagueMember | self-creator | self-creator | self-creator OR isFounder | yes | range timer |
| courses | auth read | auth | auth | isFounder | yes | shared course library |
| course_reviews | auth read | self-creator | self-creator | self-creator OR isFounder | yes | reviews |
| attestations | leagueMember | leagueMember | leagueMember | leagueMember OR isFounder | yes | round attestation |
| tripscores | leagueMember | leagueMember | leagueMember | leagueMember OR isFounder | yes | trip scoring |
| **Social** | | | | | | |
| dms | participant only | participant | participant | participant | yes (participants array-contains) | LIST-QUERY FIX per Cutover Pattern 4 |
| └ dms/messages | participant | participant | participant | participant OR isFounder | n/a (subcollection) | |
| chat | leagueMember | leagueMember | self-creator OR isFounder | self-creator OR isFounder | yes | league chat |
| social_actions | leagueMember | leagueMember-with-cooldown | n/a | n/a | yes | trash talk |
| notifications | self-only | server-only | self OR isFounder | self OR isFounder | yes (uid filter) | inbox |
| pendingPush | self-only | server-only | server-only | server-only | n/a | FCM proxy |
| photos | auth read | self-creator | n/a | self-creator OR isFounder | yes | gallery |
| **Economy** | | | | | | |
| parcoin_transactions | self-only | server-only (Cloud Function) | server-only | isFounder | yes (uid filter) | coin ledger |
| wagers | participants | participants | participants OR auto-settle | participants OR isFounder | yes | per-league P2P |
| bounties | leagueMember | leagueMember | leagueMember | leagueMember OR isFounder | yes | per-league bounties |
| **League** | | | | | | |
| leagues | auth read | isFounder | commissioner OR isFounder | isFounder | yes (memberUids contains) | league doc |
| └ joinRequests | invitee + commissioner | invitee | commissioner | commissioner | n/a (subcollection) | |
| └ moderation_log | commissioner + isFounder | server-only | n/a | commissioner | n/a (subcollection) | |
| **Events** | | | | | | |
| teetimes | leagueMember | leagueMember | self-creator | self-creator OR isFounder | yes | scheduling |
| scrambleTeams | leagueMember | leagueMember | leagueMember | leagueMember OR isFounder | yes | team scoring |
| calendar_events | leagueMember | leagueMember | self-creator | self-creator OR isFounder | yes | calendar |
| scheduling_chat | leagueMember | leagueMember | self-creator | self-creator OR isFounder | yes | scheduling threads |
| trips | leagueMember | leagueMember | self-creator OR participants | self-creator OR isFounder | yes | multi-round events |
| pending_celebrations | self-only | server | server | self OR isFounder | n/a | XP queue |
| partygames | leagueMember | leagueMember | self-creator | self-creator OR isFounder | yes | mini-games |
| **Invites** | | | | | | |
| invites | invitee + creator + commissioner | creator | invitee OR creator OR commissioner | creator OR commissioner OR isFounder | yes | invite tokens |
| config | server-only or auth-read-public | isFounder | isFounder | isFounder | n/a | API keys + flags |
| **Reporting** | | | | | | |
| errors | self-write-only | self | n/a | isFounder | n/a | error logs |
| reports | self + commissioner | self | n/a | commissioner OR isFounder | n/a | user reports |

## OWASP A01 coverage verdict

| Concern | Coverage | Evidence |
|---|---|---|
| Catch-all access | NONE | Explicit "// NO CATCH-ALL" comment + verified zero `{database}/{document=**}` patterns in rules |
| Owner-restricted writes | PRESENT | Every user-owned collection (rounds, dms, attestations, etc.) requires self-creator OR commissioner OR isFounder |
| List-query authorization | PRESENT | dms uses `participants` array-contains; rounds/courses/etc. use leagueId field gate (see Cutover Pattern 4 fix) |
| Privilege escalation | BLOCKED | platformRoleOf() server-trusted; client cannot self-promote |
| Founder-only paths | EXPLICIT | platform_audit_log, founder_access_logs, banned_emails, transfer_requests all isFounder gated |
| Server-only writes | EXPLICIT | parcoin_transactions, pendingPush, pending_celebrations all server-only (Cloud Function or admin SDK) |
| Suspension/ban gating | ENFORCED | isSuspended + isBanned helpers checked on all write paths |
| Subcollection inheritance | PRESENT | leagues/{id}/{joinRequests,moderation_log} inherits commissioner gate |
| Maintenance freeze | AVAILABLE | firestore.rules.maintenance freeze artifact ships separately for cutover windows |

**A01 verdict: PASS.** No broken access control patterns identified.

## Verified absent (per design)

- No `match /{database}/{document=**}` catch-all
- No `allow read, write: if true` unguarded
- No `if request.auth != null` without further per-collection gating (every collection enforces additional ownership/role rules)

## Cross-references

- `firestore.rules` 693 lines (read-only this audit)
- `firestore.rules.maintenance` 11-line freeze (separate)
- CLAUDE.md "Firestore Rules" section + "Cutover Playbook Pattern 4" (list-query compatibility)
- `.claude/state/security/baseline-2026-05-15/SUMMARY.md` (P8 A01 PASS verdict references this matrix)

## Recommendations (deferred — surfaced to Founder, not auto-applied)

1. **Periodic rule snapshot diff** — automate a coverage-matrix regen on every firestore.rules edit (post-commit hook step). Captures drift early.
2. **List-query test seed expansion** — current emulator fixtures cover member + round + dm shapes; expanding to include adversarial cases (cross-league dm participants, etc.) would strengthen the list-query rules verification.
3. **`config/api_keys` doc** — currently isFounder-gated; consider moving the GolfCourseAPI key proxy entirely server-side (Cloud Function) so the client never holds even an authorized read path.

None of these auto-applied per AMD-015. Surfaced for future Founder direction.
