---
status: open
severity: yellow
priority: MEDIUM
authored_at: 2026-05-29T12:30:00Z
authored_by: agent
founder_action_required: true
gate: AMD-018 gate 2 (Firestore rules deploy)
---

# Server-enforce member blocking (App Store 1.2 — Phase 2 hardening)

## What

The block feature shipped in v8.23.25 is **client-side / blocker-side**:
when you block a member, your app stops showing you their posts,
comments, and direct messages, and they disappear from your DM list.
The block list lives on your own member doc (`members/{uid}.blockedUsers`),
so it needed **no** Firestore rules change and is safe to ship now.

This proposal is the **Phase 2** follow-up: also deny the blocked
member's *writes that target you* at the server (Firestore rules), so a
blocked person cannot, for example, keep sending you DMs that pile up
unseen, or comment on your round. That requires deploying Firestore
rules, which is AMD-018 gate 2, so it needs your go-ahead.

## Why the shipped (client-side) version is already enough for the guideline

App Store Review Guideline 1.2 requires UGC apps to let a user **block
abusive users** so they stop seeing and being contacted by them. From
the blocker's experience, v8.23.25 already delivers that: blocked
members vanish from your feed, comments, and messages, and you can
unblock from Settings. Apple evaluates the blocker's experience, which
is fully satisfied. So this Phase 2 is **hardening, not a compliance
blocker** — hence severity yellow.

## What Phase 2 adds

True mutual non-contact, enforced server-side:

- A blocked member's **new DM messages to the blocker are rejected** at
  write time (not just hidden on the blocker's screen).
- A blocked member **cannot comment on the blocker's rounds** or
  otherwise attach UGC to the blocker's content.

## Why it needs a rules deploy (and the engineering shape)

Rules must check the *target's* block list on each write. Sketch:

- **DMs** (`dms/{cid}/messages` create): the convo id encodes both
  participants. The rule resolves the *other* participant and calls
  `get(/databases/$(db)/documents/members/$(otherUid))`, then denies if
  `request.auth.uid in that.data.blockedUsers`. Cost: one extra
  document read per message send.
- **Round comments**: deny the comment create if the round owner's
  `blockedUsers` contains the commenter (one `get()` of the owner's
  member doc).

This is a standard pattern, but it is real rules surface area + a small
read-cost increase, and rules changes are gate 2, so it is a deliberate,
reviewed deploy rather than an autonomous one.

## What the agent already did (no deploy)

- Shipped the full blocker-side experience in v8.23.25: `pbIsBlocked` /
  `pbSetBlocked` / `pbBlockedUids` in `src/core/utils.js`; filtering in
  `feed.js`, `feed-comments.js`, `dms.js`; Block/Unblock on the member
  profile (`members-detail.js`); a Blocked Members manager in
  `settings.js`; and a branded report flow (`admin.js`) that replaced the
  native `prompt()`.
- Confirmed writing `blockedUsers` to your own member doc needs **no**
  rules change (members may already update their own doc;
  `firestore.rules` field-locks only `platformRole` / suspension / ban).

## What you need to do (when you choose to)

**Who can do this:** any maintainer with production Firebase deploy
access. This is AMD-018 gate 2 (Firestore rules deploy), so it needs
the Founder's explicit go-ahead before the agent runs it — the gate is
the authorization, the maintainer is the executor.

1. Approve a rules change that adds the two block checks above. The
   agent will draft the exact `firestore.rules` diff + verify it against
   the local emulator (allowed-write and denied-write cases) before any
   deploy.
2. Deploy is gate 2:
   ```
   firebase deploy --only firestore:rules --project parbaughs
   ```
   Run it directly (in a Claude Code session, prefix with `! ` so the
   agent sees the output) or reply "approved, you deploy" to authorize
   the agent for this one ship.

## Risk

- Rules `get()` calls add a per-write read and a little latency on DM
  send + comment create. Bounded (one read each), but worth noting.
- A rules bug could over-deny legitimate writes. Mitigated by emulator
  verification of both allow and deny paths before deploy, and rules
  changes are instantly revertible (redeploy the previous file).
- No production data is touched; this only governs future writes.

## Recommendation

Ship-as-is is correct for now (guideline satisfied, zero gated deploy).
Schedule Phase 2 when you next batch a reviewed Firestore rules deploy,
so the blocked member also cannot generate unseen content aimed at the
blocker.
