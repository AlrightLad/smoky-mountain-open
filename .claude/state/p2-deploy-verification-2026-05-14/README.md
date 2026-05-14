# P2 invite link Cloud Function deploy — verification

**Date:** 2026-05-14
**Function:** validateInvite (us-central1)
**Project:** parbaughs
**Authorized by:** Founder per AMD-018 exception list

## Deploy result

```
+ functions:[validateInvite(us-central1)] Successful update operation.
Function URL: https://us-central1-parbaughs.cloudfunctions.net/validateInvite
+ Deploy complete!
```

Node.js 22 (1st Gen) function updated successfully. Source bundle
81.08 KB uploaded.

## Code change deployed

`functions/index.js` `validateInviteCode` now returns:
```javascript
return {
  valid: true,
  createdBy: d.createdBy || null,
  leagueId: d.leagueId || null,   // NEW — P2 fix
  code: upperCode
};
```

Plus `src/pages/invite.js` `createInviteDoc` now persists:
```javascript
{
  ...
  leagueId: (currentProfile && currentProfile.activeLeague) || "the-parbaughs",
  ...
}
```

## End-to-end signup verification — honest gap

A FULL end-to-end verification requires:
1. Real PARBAUGHS production account with commissioner permission
2. Fresh test email + Firebase Auth signup
3. Incognito Chrome via Playwright MCP

The team does not have these credentials in agent context. Per
AMD-009 P5 (honest language): the **deploy is verified**, but the
**end-to-end signup flow is NOT yet verified in production**.

Recommended verification path (Founder action, ~5 minutes):
1. Generate a fresh invite from a non-founding league via the
   PARBAUGHS app
2. Open the invite link in incognito Chrome
3. Sign up with a fresh test email
4. Verify the new member's profile shows the inviter's league as
   `activeLeague` (not "the-parbaughs")
5. Verify member can see league members + rounds in that league

If verification PASSES: document below + remove this gap notice.
If verification FAILS: rollback via:
```
firebase functions:rollback validateInvite
```
And open ESC-NNN with diagnosis.

## What the fix protects against

Pre-fix behavior (all PARBAUGHS members for some unknown duration):
- Invite generated in any league → invite doc had no `leagueId`
- New user clicks invite → registration succeeds + member doc created
- Member doc's `leagues[]` + `activeLeague` defaulted to
  `"the-parbaughs"`
- User landed in founding league regardless of invite intent

Post-fix behavior:
- Invite generated in any league → invite doc carries `leagueId`
- Cloud function returns `leagueId` to client
- Member doc's `leagues[]` + `activeLeague` set to inviter's league
- User lands in correct league automatically

Legacy invites (created pre-fix) have no `leagueId` field — the
client fallback `inv.leagueId || "the-parbaughs"` preserves prior
behavior for those (they still drop new members into founding
league). NEW invites carry the field correctly.

## Rollback command (documented per AMD-018 rollback discipline)

```powershell
# Rollback validateInvite to prior version
firebase functions:rollback validateInvite
```

This restores the previous Cloud Function version. Client-side
fixes in src/pages/invite.js remain (will still write leagueId on
new invites; old behavior was "no leagueId" which the rollback
function silently ignores — backward compatible).
