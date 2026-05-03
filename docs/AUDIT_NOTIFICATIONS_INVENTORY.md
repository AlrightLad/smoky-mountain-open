# Ship 5+1 Notifications Upgrade — Read-Only Inventory

**Audit type:** Read-only. NO code changes. Pre-Ship-5+1 implementation kickoff.
**Surfaced:** v8.16.0 audit V1 (existing notifications infrastructure discovered while locating user-utility row).
**Bottom line up front:** Ship 5+1 is **NOT greenfield** — most of the foundation already ships in production. Scope estimate at end of report.

---

## I1 — EXISTING UI SURFACES

### I1a. Bell icon component
**FOUND** — fully wired:
- `index.html:201` — `<div id="notifBell" role="button" aria-label="Notifications" onclick="toggleNotifPanel()">`
- SVG bell glyph (lines from `M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9`) — real glyph, not placeholder, color `var(--muted)`, 22×22px
- `#notifBadge` child div (line 203) — unread count badge, hidden by default (`display:none`), positioned absolute top-right, claret-equivalent `var(--alert)` background, white text, 16×16px min, "2px solid var(--bg)" border
- `padding:10px;margin:-6px` — 44pt-equivalent tap target

### I1b. Notification panel/dropdown
**FOUND** — slide-in side panel (NOT a dropdown anchored below bell):
- Markup at `index.html:276-286`:
  - `.notif-overlay` (#notifOverlay) — full-viewport translucent backdrop
  - `.notif-panel` (#notifPanel) — fixed right slide-in, 320px wide on mobile / 400px desktop
- CSS at `src/styles/components.css:687-694`:
  - `position: fixed; top: 0; right: 0; height: 100vh` — full-height side drawer
  - `transform: translateX(100%)` default → `translateX(0)` when `.open`
  - `transition: transform var(--duration-med)`
  - `overflow-y: auto`
- Header inside panel (index.html:278-284):
  - "Notifications" title in gold
  - "Mark all read" button → `markAllNotifsRead()`
  - Close × button → `closeNotifPanel()`
- `#notifList` div (line 285) — populated by `renderNotifPanel()`

**Gap vs design bot scaffold:** scaffold proposed "dropdown anchored below bell, positioned per existing user-utility patterns." Production reality is a **full-height side drawer**, not an anchored dropdown. UX architecture decision needed for Ship 5+1.

### I1c. Unread count badge
**FOUND** — real-time, capped at "9+":
- `updateNotifBadge()` at `router.js:501-511`:
  - Reads `liveNotifications.length`
  - Shows `count > 9 ? "9+" : count` in `#notifBadge`
  - Hides badge (`display:none`) when count is 0
- Updated on every listener fire via override at `router.js:556-571`
- Visual: claret/alert background, white text, 16×16px, 2px chalk border

### I1d. Other notification surfaces
**FOUND** — multiple adjacent systems:
- **Toast** (`Router.toast`): orthogonal in-app transient notice, not persisted. The notification listener also fires `Router.toast(message)` on the most-recent unread message at startup (`router.js:402`). New unread → toast pops + bell badge updates.
- **DM unread badge** (`#dmBadge`, index.html:207) — separate listener (`dmUnreadListener` at `router.js:517-541`), separate badge update (`updateDmBadge` at `router.js:543-552`). Architectural twin of notifications but for DM threads. NOT integrated with notifications collection.
- **In-app banner**: none beyond the email-verify banner (which is unrelated).
- **FCM web push**: real, gated on VAPID key + member fcmToken (more in I2/I3 sections).

---

## I2 — EXISTING DATA LAYER

### I2a. Firestore collection schema
**FOUND** — minimal, derived from `sendNotification` helper at `router.js:381-393`:

| Field | Type | Source | Required |
|---|---|---|---|
| `toUserId` | string (uid) | `sendNotification(toUserId, ...)` arg | YES |
| `read` | boolean | always `false` on create | YES |
| `createdAt` | server timestamp | `fsTimestamp()` | YES |
| `type` | string | caller passes (e.g. `"feed_like"`, `"tee_posted"`) | callers pass it; not enforced |
| `title` | string | caller passes | callers pass it |
| `message` | string | caller passes (notification body) | callers pass it |
| `page` | string (route name) | caller passes; deep-link target (e.g. `"chat"`, `"teetimes"`) | optional |
| `linkPage` | string (route name) | alternate; chat.js uses this instead of `page` | optional |

**No `payload`, `body`, `readAt`, or `leagueId` fields.** `message` ≡ design bot's `body`. `page`/`linkPage` ≡ design bot's `payload.dest`.

**Inconsistency to flag:** `page` vs `linkPage` — chat.js uses `linkPage`, all other writers use `page`. `renderNotifPanel` at `router.js:448` reads `n.linkPage || "home"` then overrides via type-switch (`router.js:450-452`). This dual field is technical debt.

### I2b. Write paths to notifications collection
**FOUND** — single helper, 19+ call sites:
- **Helper:** `sendNotification(toUserId, notif)` at `router.js:381-393`
  - Adds `toUserId`, `read:false`, `createdAt` automatically
  - Writes to `db.collection("notifications").add(notif)`
  - Also queues `pendingPush` doc for FCM delivery (5 fields: toUserId, title, body, data:{type,page}, createdAt)
- **Direct writes** (no `sendNotification`): one at `router.js:1482` inside an achievement-unlock path
- **Cloud Function writes:** none. All client-side.

**19 call sites cataloged** (search summary):
| File | Lines | Purpose |
|---|---|---|
| `router.js` | 384, 1482, 2753 | Helper + achievement + (TBD self-target at 2753) |
| `chat.js` | 584, 653, 667, 711 | feed_like, feed_comment, feed_reply, comment_like |
| `dms.js` | 185 | dm |
| `bounties.js` | 234 | bounty_claimed |
| `leagues.js` | 333, 402, 412 | league_request, league_approved, league_denied |
| `members.js` | 1693 | invite_request |
| `rounds.js` | 391 | round_posted |
| `social.js` | 114 | (type TBD) |
| `teetimes.js` | 178, 194, 206 | tee_posted, tee_withdrawal, tee_cancelled |
| `wagers.js` | 258, 287, 309, 422 | wager_challenge, wager_accepted, wager_declined, wager_result |
| `faq.js` | 89 | feature_request |
| `admin.js` | 337, 356, 379, 397, 437 | report + 4 admin actions |

### I2c. Read paths
**FOUND** — single real-time listener:
- `startNotificationListener` at `router.js:394-404`, **overridden** at `router.js:555-571` to also call `updateNotifBadge()`
- Final query (the override version):
  ```js
  db.collection("notifications")
    .where("toUserId", "==", currentUser.uid)
    .where("read", "==", false)
    .limit(30)
    .onSnapshot(...)
  ```
- Populates global `liveNotifications` array, sorted by `createdAt` descending
- **Limit 30** unread shown in the panel; older unread silently truncated. **No pagination for read history** — read notifications drop off the listener entirely (filtered out by `where read == false`).
- No caching layer beyond the in-memory `liveNotifications` array.

### I2d. Mark-as-read flow
**FOUND** — direct Firestore writes, optimistic local UI:
- `handleNotifClick(notifId, linkPage)` at `router.js:472-478` — sets `read: true` + closes panel + Router.go(linkPage). Optimistic UI is implicit (listener fires next tick, item drops out of `liveNotifications`).
- `dismissNotif(notifId)` at `router.js:480-487` — sets `read: true` + removes from local array immediately + re-renders panel. Truly optimistic.
- `markAllNotifsRead()` at `router.js:489-498` — iterates `liveNotifications`, writes `read: true` for each, clears array, re-renders, toasts "All caught up".

**Gap:** No `readAt` timestamp captured on read. Design bot scaffold proposed `readAt` for "when did you read it" telemetry. Production just flips boolean.

---

## I3 — EXISTING NOTIFICATION TYPES (TRIGGERS)

### I3a. Types written today
**FOUND** — 17+ unique type strings across 12 files:

| Type | Written by | Trigger | Link target |
|---|---|---|---|
| `feed_like` | chat.js:585 | toggleLike (now Kudos) | chat |
| `comment_like` | chat.js:712 | toggleCommentLike | chat |
| `feed_comment` | chat.js:653 | submitComment | chat |
| `feed_reply` | chat.js:667 | reply to comment | chat |
| `dm` | dms.js:186 | DM sent | dms |
| `bounty_claimed` | bounties.js:234 | bounty claim | bounties |
| `league_request` | leagues.js:333 | join request sent | leagues |
| `league_approved` | leagues.js:402 | commissioner approves | leagues |
| `league_denied` | leagues.js:412 | commissioner denies | leagues |
| `invite_request` | members.js:1694 | invite to league | (TBD) |
| `round_posted` | rounds.js:392 | round logged | (TBD) |
| `tee_posted` | teetimes.js:178 | tee time created | teetimes |
| `tee_withdrawal` | teetimes.js:194 | player withdraws | (no `page` field) |
| `tee_cancelled` | teetimes.js:206 | tee cancelled | (no `page` field) |
| `wager_challenge` | wagers.js:259 | wager proposed | wagers |
| `wager_accepted` | wagers.js:288 | wager accepted | wagers |
| `wager_declined` | wagers.js:310 | wager declined | wagers |
| `wager_result` | wagers.js:422 | wager resolved | wagers |
| `feature_request` | faq.js:89, 105 | user feature request | (admin route) |
| `achievement` | router.js:1484 | achievement unlocked | (TBD) |
| `report` | admin.js:438 | flagged content | (admin) |
| `(4 admin types)` | admin.js:337, 356, 379, 397 | suspension/ban/transfer actions | (admin) |
| `welcome` | rendered in switch but no writer found in current grep | — | — |
| `tee_rsvp` | rendered in switch but no writer found | — | teetimes |

### I3b. Types READ/HANDLED today
**FOUND** — `renderNotifPanel` at `router.js:438-470`:
- Per-type icon dispatch on line 447 — long ternary covering feed_like, feed_comment, feed_reply, dm, tee_rsvp, tee_cancelled, tee_withdrawal, welcome, report.
- **Only `feed_like` has a real SVG icon** (heart glyph). All others have empty-string icon. Visual gap.
- Per-type link override on lines 450-452 — `dm`→dms, feed_*→chat, tee_*→teetimes. The 17+ written types listed above are NOT all handled by this dispatch. Most fall through to `n.linkPage || "home"` from line 448.

**Gap:** ~13 written types have no per-type rendering treatment. They render with empty icon, generic title/message. Design bot's "type icon (mapped per design bot palette)" is mostly aspirational.

### I3c. Missing types per design bot Ship 5+1 plan
Design bot recommended for Ship 5+2 (Tee Times):
- `tee_time_invited` — **NOT WRITTEN**
- `tee_time_confirmed` — **NOT WRITTEN**
- `tee_time_declined` — **NOT WRITTEN**
- `tee_time_spot_opened` — **NOT WRITTEN**

Production has adjacent but different types: `tee_posted`, `tee_withdrawal`, `tee_cancelled`. These are *broadcast* notifications (to participants of an existing tee time) rather than *invitation* notifications (to a person being invited). Ship 5+2 needs both schemas.

---

## I4 — EXISTING FIRESTORE RULES + INDEXES

### I4a. notifications collection rules
**FOUND** — `firestore.rules:353-358`:
```
match /notifications/{notifId} {
  allow read: if isAuth() && resource.data.toUserId == uid();
  allow create: if amIActive();
  allow update: if isAuth() && resource.data.toUserId == uid();
  allow delete: if isAuth() && resource.data.toUserId == uid();
}
```
- **Read:** owner only ✓
- **Create:** any active (non-suspended/banned) authenticated user ✓ — note this means **clients** write notifications (no Cloud Function gate). Suspended users can't queue notifications (anti-harassment).
- **Update:** owner only ✓ (used for `read: true`)
- **Delete:** owner only ✓

### I4b. Composite indexes
**FOUND** — `firestore.indexes.json`:
1. `(toUserId ASC, read ASC)` — supports the unread-listener query.
2. `(read ASC, toUserId ASC, createdAt DESC)` — supports ordered queries (currently unused in code; appears reserved for "fetch read history sorted").

### I4c. pendingPush rules + index
**FOUND** — `firestore.rules:389-392`:
```
match /pendingPush/{pushId} {
  allow create: if amIActive();
  allow read, update, delete: if false;
}
```
Write-only by clients. Read/update/delete restricted to Cloud Function (which uses Admin SDK, bypasses rules).

---

## I5 — EXISTING NOTIFICATION PERSISTENCE BEHAVIOR

### I5a. Lifetime
**FOUND** — no cleanup. Notifications persist forever in Firestore (until `delete: true` is set, which UI never does — only `read: true`). Read notifications fall out of the listener filter (`where read == false`) but remain in the collection.

**Gap:** Design bot scaffold mentioned no specific lifetime; production reality is unbounded growth. For 20-member league this is a non-issue. At platform scale this becomes a concern (B-tier backlog candidate).

### I5b. Caps
**FOUND:**
- Listener `.limit(30)` — only 30 unread visible at a time
- Badge caps display at "9+"
- No total-stored cap

### I5c. Real-time vs polling
**FOUND** — pure `onSnapshot` real-time listener, no polling. Listener attached on auth-ready, detached on logout (`router.js:703` shows the cleanup `_notifUnsub` call).

---

## I6 — INTEGRATION POINTS WITH FUTURE SHIPS

### I6a. Ship 5+2 (Tee Times) integration
- **Helper signature accepts** `type` + arbitrary fields. New types `tee_time_invited`, etc. drop in cleanly — no schema migration required.
- `linkPage`/`page` field is flat string; design bot's `payload.dest` could land as a string-encoded route (e.g. `"teetimes?id=abc"`). Working today.
- **Gap:** invitation flow needs a *recipient list* (users invited but not yet RSVP'd) — that's a `teetimes/{teeId}` schema concern, not notifications. Out of Ship 5+1 scope.

### I6b. Ship 5+3 (Activity Feed B-tier) integration
- **Kudos persistence** — already lives via `feed_like` type + `toggleLike` in chat.js (post-v8.16.0 terminology = Kudos). The Kudos PERSISTENCE for feed cards in HQ Home (currently markup-removed per v8.16.1 Item 3) needs a parallel implementation against `rounds` collection (the `likeFeedRound` function in router.js:1811 already does this for feed-of-rounds). May not need Ship 5+1 schema work.
- **Comment threading** — `feed_comment` + `feed_reply` types already written. Comment data is on chat doc itself (`comments[]` field), not notifications.
- **@ mention parsing** — `mention_received` type **does NOT exist**. Ship 5+3 adds it.

### I6c. Ship 5+4 (Personal Bests) integration
- `personal_best_achieved` type **does NOT exist**. Ship 5+4 adds it.
- Existing `achievement` type is the closest analog. May extend or add new type per design bot ruling.

---

## I7 — SCHEMA RECONCILIATION (DESIGN BOT vs PRODUCTION)

### Design bot Ship 5+1 scaffold
```
notifications/{id}: { id, userId, type, title, body, payload, createdAt, readAt, leagueId }
```

### Production reality
```
notifications/{id}: { toUserId, type, title, message, page|linkPage, read, createdAt }
                    + pendingPush companion doc for FCM
```

### Field-by-field comparison

| Design bot | Production | Status |
|---|---|---|
| `id` | `id` (auto-generated by `.add()`) | Same. |
| `userId` | `toUserId` | Equivalent. **Migration cost = full collection write.** Verdict: keep `toUserId`. |
| `type` | `type` | Same ✓. |
| `title` | `title` | Same ✓. |
| `body` | `message` | Equivalent. **Migration cost = full collection write.** Verdict: keep `message` OR alias on read. |
| `payload` | `page` (and `linkPage` in chat.js) | Production uses flat string for deep-link route. Design bot's `payload` is an object. Keep flat string for current types; if richer payload needed for Ship 5+2 invitations, **add** `payload` field as optional. |
| `createdAt` | `createdAt` | Same ✓. |
| `readAt` | `read` (boolean) | Production loses the *when read* timestamp. **Add** `readAt` field on next mark-as-read write — backward compatible (old notifs still have boolean only). |
| `leagueId` | (absent) | Production notifications are not league-scoped. Add `leagueId` field optional going forward; backfill not needed. |

**Schema reconciliation recommendation:** **Keep production schema as-is.** Add optional `readAt` (timestamp) and `leagueId` (string) fields to new writes when relevant. **No migration writes.** Reconcile via aliasing in any new helpers (e.g., `getNotificationBody(n) → n.body || n.message`).

**Cost of full migration to design bot schema:** ~thousands of doc writes (current production volume is ~100s of notifications) + brittle reader code that has to handle both shapes during transition. **Recommendation: don't migrate.**

---

## SHIP 5+1 SCOPE ESTIMATE

### Already in production, NO WORK NEEDED ✓
- Bell icon UI + unread badge (real-time updating)
- Notification panel (slide-in side drawer style)
- "Mark all read" + per-item dismiss + click-to-mark-read
- Empty state ("All caught up")
- 19+ trigger call sites across 12 files
- `sendNotification` helper (handles dual notifications + pendingPush write)
- Firestore rules + 2 composite indexes
- Cloud Function `sendPushNotification` for FCM web push delivery
- VAPID key + member.fcmToken plumbing
- Real-time `onSnapshot` listener pattern + cleanup

### Polish/extension work — SMALL
- **Per-type SVG icons** — currently only `feed_like` has a real glyph; ~13 types render with empty-string icon. Add design-bot-palette icons per type. (Pure render-side change in `renderNotifPanel`.)
- **`page` vs `linkPage` field unification** — chat.js uses `linkPage`, all others use `page`. Pick one, normalize. (Read-side aliasing or write-side normalization in `sendNotification`.)
- **Type vocabulary documentation** — there's no central list of valid types. Add a `NOTIFICATION_TYPES = {...}` constants block to make it grep-able + new-trigger-friendly.

### Architectural decision needed (medium)
- **Drop-down vs side-drawer** — design bot Ship 5+1 scaffold says "dropdown anchored below bell." Production is a full-height side drawer. **Q: keep side drawer, or rewrite as dropdown?**
  - Side drawer: works on mobile (full-screen takeover), familiar from existing platform UI.
  - Dropdown: tighter, less disruptive on desktop, harder to fit on narrow viewports.
  - Recommendation: keep side drawer for now (zero work), add this as a B-tier UX backlog if design bot wants the dropdown specifically.

### Net-new work — REAL
- **Optional `readAt` + `leagueId` fields** in new writes. Schema-additive. Trivial in helper.
- **Older-notifications scroll** — listener queries `read == false`. To show *read* history (per design bot scaffold "scroll for older"), need a second query path that fetches recent reads. Reuses the existing `(read, toUserId, createdAt)` index.
- **New types for Ship 5+2/5+3/5+4** — add to constants block; triggers wired in their own ships.

### Schema migration — NONE NEEDED ✓
Production schema (toUserId/read/message/page) is the canonical schema going forward. Design bot's userId/readAt/body/payload is overspecification for the actual codebase state. Reconcile via additive optional fields, not migration.

### Estimated gate count
**Original design bot estimate:** 3 gates (greenfield: schema + bell + dropdown).
**Revised estimate based on this audit:** **1 gate**, possibly **2** if architecturally deciding side-drawer-vs-dropdown.

**Gate 1 (revised) — Notifications polish + extension:**
- Per-type SVG icon vocabulary (~13 icons added to `renderNotifPanel` dispatch)
- Type constants module (NOTIFICATION_TYPES) for grep-ability
- `page`/`linkPage` field unification
- Optional `readAt` + `leagueId` fields on new writes
- Extend listener with second query path for read-history scroll-back (older notifications)
- Document the existing system (architecture comment in router.js + this audit gets archived to `docs/`)

**Optional Gate 2 — UX redesign (only if CTO + design bot want dropdown vs drawer):**
- Rewrite `.notif-panel` to anchor under `#notifBell`
- Reposition, dismiss-on-outside-click, etc.

**P21 implication:** Per "pick the simplest tool for scope," Gate 2 isn't needed unless the side-drawer pattern actively hurts UX. The drawer works today. Defer until design bot specifically rules.

### Out-of-scope for Ship 5+1 (clean separation)
- **Tee Time invitation types** — Ship 5+2 wires the triggers AND extends the schema if invitations need richer payload than flat `page`. Ship 5+1 just defines the type vocabulary placeholders.
- **Mention type** — Ship 5+3.
- **Personal-best type** — Ship 5+4.
- **Notification cleanup/lifetime** — B-tier backlog for platform scale; not blocking 20-member league.

---

## Closing notes for Ship 5+1 implementation kickoff

1. **Open this audit before drafting any code.** The existing system has more than the v8.16.0 "infrastructure exists" finding implied — it's nearly complete.
2. **Don't migrate schema.** Production schema is the canonical schema.
3. **Side-drawer vs dropdown is a UX decision, not a code one.** Either preserves all existing functionality.
4. **The largest concrete deliverable is per-type SVG icons** — aspirational coverage today (only feed_like has a glyph). Design bot needs to provide the icon palette for ~13 types.
5. **Don't touch `sendNotification`'s pendingPush write** — that's the FCM bridge; modifying it changes web-push delivery semantics. Treat as load-bearing.
6. **Don't touch the side-drawer DOM** — it's wired to non-notification systems via the same overlay/close-handler patterns (`closeNotifPanel()` is called from at least the DM inbox click at index.html:205). Ripple-aware change scope.
7. **The Notification listener is overridden post-load** at `router.js:555-571` — there are TWO definitions of `startNotificationListener`. The second one wins. This is unusual; it adds the badge update side effect. Verify that override pattern is intentional (likely was a hot-fix that should be merged into the original definition during Ship 5+1 cleanup — minor refactor candidate, easy win).

**Reference for Ship 5+1 audit kickoff:** load this file (`docs/AUDIT_NOTIFICATIONS_INVENTORY.md`) + a fresh read of `router.js:300-700`, `firestore.rules:353-358`, `firestore.indexes.json` notifications block, `functions/index.js:189-262`, `index.html:195-216` + 270-290.
