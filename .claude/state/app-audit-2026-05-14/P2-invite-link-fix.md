# P2 — Invite link auto-apply fix

**Authored:** 2026-05-14 per Founder PARBAUGHS PRIORITY EXECUTION P2.
**Severity:** CRITICAL (blocks multi-league onboarding — users joining
non-founding leagues land in "the-parbaughs" instead of intended league).

## Root cause

Two-layer bug:

1. **`createInviteDoc` (src/pages/invite.js:31) never stored leagueId on
   the invite document.** Every invite was just `{code, createdBy,
   usedBy, status, createdAt, expiresAt}`.

2. **`validateInviteCode` (functions/index.js:87) never returned
   leagueId.** Even if invite docs HAD a leagueId field, the function
   wouldn't surface it to the client.

3. **Client fallback `_invLeague = inv.leagueId || "the-parbaughs"`
   (src/core/firebase.js:353) handled the missing field by defaulting
   to the founding league.** The fallback masked the upstream gap —
   the registration flow technically "worked" but every new member
   ended up in the wrong league.

The client-side fallback was the original "fix" for missing leagueId
data, but it created a silent correctness bug: registration succeeded
+ member doc created + user landed somewhere — just not where the
invite intended.

## Fix

Two-part:

### Fix A — `src/pages/invite.js` `createInviteDoc`

Now persists `leagueId: currentProfile.activeLeague` on the invite
document. Inviter's active league becomes the invite's target.

### Fix B — `functions/index.js` `validateInviteCode`

Now returns `leagueId: d.leagueId || null` alongside the existing
`createdBy` field. Client's existing fallback handles the null case
(legacy invites created before iter 16 don't have leagueId, so they
still default to "the-parbaughs" — preserves backward compatibility).

## End-to-end verification status

- Fix A (client-side): committed in iter 16. Takes effect on next
  page load.
- Fix B (Cloud Function): committed in iter 16. **REQUIRES DEPLOY
  to take effect.** Until deployed, validateInvite continues
  returning the old shape (no leagueId).

**Deploy command (Founder authorization required):**

```powershell
firebase deploy --only functions:validateInvite
```

Per CLAUDE.md operational gotchas:
- Firebase CLI authentication is a prerequisite — Founder must have
  run `firebase login` first
- `firebase.json` config changes don't apply this — code change does
- Verify via `firebase functions:list` after deploy

## End-to-end Playwright verification

Once deployed, end-to-end verification (Founder directive):

1. Generate fresh invite link from a non-founding league
2. Open in incognito Chrome via Playwright MCP
3. Sign up as fresh test user
4. Verify member profile lands in the inviter's league (not
   "the-parbaughs")
5. Verify user can see league members, rounds, etc.
6. Repeat with second fresh user for consistency

Test infrastructure: `tests/e2e/flows/` Playwright suite + Firebase
emulator. The smoke-test-league fixture covers single-league
membership; a multi-league fixture would exercise this fix
specifically. Adding the fixture is follow-on scope.

## Honest delta (AMD-009 P5 + P7)

**Why did this ship for 20 members?**
The original PARBAUGHS launch had ONE league ("the-parbaughs"). Every
member belonged to that league. The fallback `_invLeague || "the-parbaughs"`
was correct behavior in that context. Multi-league support was added
later (per CLAUDE.md "Multi-League Architecture" section), but the
invite flow wasn't updated to carry leagueId through. The fallback
behavior preserved correctness for the-parbaughs but silently broke
correctness for any other league.

**Why didn't tests catch it?**
The e2e Playwright suite exercises smoke-test-league which IS not
"the-parbaughs", but the fixture creates members directly via the
Admin SDK rather than via the invite flow. The invite-specific test
path was an absent fixture.

**Structural fix:**
Per AMD-016 operational question test — for every multi-league
mechanism, e2e fixture must exercise the cross-league flow, not just
the single-league case. Adding a "join via invite into smoke-test-
league" fixture would have caught this bug.

## Status

- Code fix: committed
- Deploy: PENDING (requires `firebase deploy --only functions:validateInvite`)
- E2E verification: PENDING (Founder runs deploy then verifies)
- Follow-on: add multi-league-invite e2e fixture (deferred per
  AMD-015 — Wave 1 ship plan should include)
