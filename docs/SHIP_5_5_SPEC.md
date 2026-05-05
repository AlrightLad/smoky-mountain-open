# Ship 5+5 — Engagement Architecture (v8.20.0)

**Status:** Spec locked, ready for implementation
**Authored:** 2026-05-05
**Audit lineage:** V12 audit (in-conversation, post-v8.19.0)
**Scope ruling:** CTO 2026-05-05
**Version target:** v8.20.0

---

## Headline

v8.19.0 fixed engagement (kudos / comments) on `/chat` (Clubhouse) — a surface with **zero human engagement** in production (26 system-only docs). The actual user pain is on `/feed` (Activity Feed) and HQ Home League Pulse cards, where members log rounds and want to react. Audit found:

- `/feed` round card action row is **3 of 4 actions broken**: Kudos absent, Comment is a /chat-redirect stub, Share calls undefined `shareScorecard()` (silent no-op)
- `/rounds/{roundId}` Firestore update rule is **author-only** (same v8.0 pattern as /chat and /teetimes — fourth instance of the silent-failure architectural bug)
- HQ Home League Pulse round cards have **no action row** (markup REMOVED in v8.16.1 with explicit annotation "Returns in Ship 5+3" — missed in Ship 5+3 audit)
- HQ Home `state.activity` items have **no `dest`** plumbing — orphan cards, not clickable
- `shareScorecard()` is **undefined globally** — Share button click is silent no-op

This ship restores engagement on /feed + HQ Home League Pulse with the same architectural pattern proven in Ships 5+1 / 5+2 / 5+3 (4th OR-clause + diff().affectedKeys() + .catch() with optimistic-state revert + v8.17.0 two-layer broadcast hardening), defines `shareScorecard()`, expands NOTIFICATION_META with surface-aware deep-linking, plumbs `dest` for orphan HQ Home cards, and **adds 5 mandatory smoke scenarios (S13-S17)** that close the surface-coverage gap that allowed v8.19.0 to ship without catching the actual user pain.

---

## V12 Audit findings

| # | Finding | Severity | Disposition |
|---|---|---|---|
| V12.1 | /feed round card: 3 of 4 actions broken (Kudos absent, Comment is stub, Share is dead) | CRITICAL | **CORE** |
| V12.2 | /rounds doc has `likes` (dead-code path), no `comments`/`commentLikes` | HIGH | **CORE** (additive) |
| V12.3 | Existing `feedReact()` writer unwired, no .catch(), no notification | HIGH | **CORE** (rewrite) |
| V12.4 | /rounds update rule author-only (4th instance of v8.0 architectural bug) | CRITICAL | **CORE** |
| V12.5 | Production engagement = zero (rule blocks members, no UI to engage) | HIGH | Auto-fixed by V12.1 + V12.4 |
| V12.6 | Scorecard icon on /feed works ✅ | — | No change |
| V12.7 | shareScorecard() undefined globally; Share is dead code | HIGH | **CORE** |
| V12.8 | HQ Home action row REMOVED v8.16.1 with "Returns in Ship 5+3" annotation; state.activity items have no `dest` | HIGH | **CORE** |
| V12.9 | Action row architecture: OPTION B (4 on /feed, 2 on HQ Home + card-tap) | DECISION | **CORE** |
| V12.10 | Notification routing: existing feed_* types deep-link to /chat (wrong for round engagement) | MEDIUM | **CORE** (Option N1: new round_* types) |

---

## Process corrections (P1-P4) — locked for all future ship audits

These are amendments based on v8.19.0 retrospective. Apply to every audit before any code is written.

**P1 — Surface-first audit.** V1 file inventory MUST include explicit answer to "Where would a member tap to do X?" Surface taxonomy precedes code path analysis.

**P2 — Annotation capture.** V1 file inventory MUST grep for explicit scope markers in code comments (e.g., `Returns in Ship 5+X`, `TODO Ship 5+X`, `Deferred to vN+1`). The home.js v8.16.1 comment "Returns in Ship 5+3" was a literal scope assignment that v8.19.0 missed.

**P3 — Smoke surface coverage.** Every ship's smoke MUST include at least 1 scenario that:
1. Navigates to the user-visible surface for the headline feature
2. Performs the user action
3. Verifies persistence

Mechanic-level scenarios (panel render, listener startup) do NOT satisfy this requirement.

**P4 — V12-style sweep before next ship.** Bounties, wagers, scrambles, trips, and any other surfaces with user-interaction writes against author-only rules likely have the same v8.0 damage pattern. Conduct V12-style sweep (~30 min of grep work) BEFORE each new ship's audit begins. Could surface 1-3 more silently broken surfaces per sweep.

---

## Locked scope (13 items)

### CORE (must ship)

**1. firestore.rules /rounds/{roundId} update — 4th OR-clause**

`firestore.rules:296-300` — add 4th OR-clause permitting league members to write `hasOnly(['likes','comments','commentLikes'])` only:

```
allow update: if amIActive() && (
  resource.data.player == uid()
  || amILeagueLeadership(resource.data.leagueId)
  || amIFounder()
  || (amILeagueMember(resource.data.leagueId)
      && request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['likes', 'comments', 'commentLikes']))
);
```

Strict superset. Same `diff().affectedKeys()` pattern as Ship 5+2 (/teetimes) and Ship 5+3 (/chat). 4th instance of the pattern; pre-validated.

**2. feed.js — restore Kudos button + new `feedToggleLike(roundId)` writer**

Restore Kudos button in round card action row at `feed.js:239-244`, position **between Scorecard and Comment** per Option B. New writer mirrors chat.js `toggleLike` pattern:
- Optimistic UI on `window._feedItems.find(roundId).likes`
- Snapshot `prevLikes` before mutation
- `db.collection("rounds").doc(roundId).update({ likes: likes })`
- `.catch()` revert + `Router.toast("Couldn't add kudos — please try again")`
- On success: `sendNotification(round.player, { type: "round_like", title: "New Kudos", message: name + " gave kudos to your round at " + course, page: "feed" })` (suppress when self-like)

**3. feed.js — rewrite Comment button + new `feedSubmitComment(roundId)` writer**

Replace `Router.go('chat')` stub with inline comment input (mirror chat.js `showCommentInput` + `submitComment` pattern). Adds `comments[]` field to /rounds docs. Optimistic UI + `.catch()` revert + toast. v8.17.0 two-layer cascade hardening on `round_reply` broadcast.

**4. feed.js — `feedToggleCommentLike(roundId, commentIdx)` + `feedDeleteComment(roundId, commentIdx)`**

Mirror chat.js `toggleCommentLike` + `deleteComment` patterns. Optimistic UI + revert + toast on each.

**5. feed.js — `shareScorecard(roundId)` definition**

Define globally:
```js
function shareScorecard(roundId) {
  if (!roundId) return;
  var url = window.location.origin + window.location.pathname + '?roundId=' + encodeURIComponent(roundId);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      Router.toast("Link copied");
    }).catch(function() {
      Router.toast("Couldn't copy link");
    });
  } else {
    Router.toast("Share not supported on this browser");
  }
}
```

Native Share API (Capacitor) deferred to post-native shell.

**6. NOTIFICATION_META — 4 new round-engagement types (Option N1)**

Add to `src/core/notification-types.js`:

```js
NOTIFICATION_TYPES additions:
  ROUND_LIKE: "round_like",
  ROUND_COMMENT: "round_comment",
  ROUND_REPLY: "round_reply",
  ROUND_COMMENT_LIKE: "round_comment_like"

NOTIFICATION_META additions:
  round_like:         { cluster: "social", page: "feed" },
  round_comment:      { cluster: "social", page: "feed" },
  round_reply:        { cluster: "social", page: "feed" },
  round_comment_like: { cluster: "social", page: "feed" }
```

Tapping these notifications deep-links to /feed (correct surface) instead of /chat. Cluster icons unchanged (still "social").

**7. home.js — restore .hq-feed-card__actions on round-type League Pulse cards**

Reinstate the action row markup that was removed in v8.16.1 with [Kudos | Comment] 2-action row. Wired to same `feedToggleLike(it.roundId)` / `feedSubmitComment(it.roundId)` as /feed (shared engagement model). Same `.catch()` + revert pattern.

The data layer already has `roundId` available in `_collectActivityItems` round path (see home.js:1707 — `dest` references `r.id`). Add `roundId: r.id` to the items.push payload.

CSS rules `.hq-feed-card__actions` and `.hq-feed-card__action` are already in `components.css` (preserved per v8.16.1 comment).

**8. home.js — dest plumbing for state.activity items (V12.8 cleanup)**

In `_collectActivityItems` at home.js:1711-1725, add `dest` to each `items.push` based on `a.type`:

```js
var dest = "";
if (a.type === "trip_created") dest = "Router.go('trips')";
else if (a.type === "review") dest = "Router.go('courses')";
else if (a.type === "post") dest = "Router.go('feed')";
else if (a.type === "member_joined") dest = "Router.go('members')";
items.push({ ts: a.ts, actorName: actor, actorUid: a.uid || a.playerId || "", text: text, sub: "", timeAgo: feedTimeAgo(a.ts), dest: dest, entityType: entityType });
```

### INCLUDED — Smoke gap closure (MANDATORY)

**9-13. Five new smoke scenarios (S13-S17)**

Per Amendment A, these are MANDATORY. Ship 5+5 does not push without them.

**S13 — `/feed` action row integrity (DOM assertion only)**
Auth as smoke. Navigate to /feed. Wait for first round card to render. Assert action row has 4 buttons (Scorecard / Kudos / Comment / Share). For each button, assert `onclick` attribute is present, non-empty, and not a typeof-guarded no-op (Share has guard but resolves to `shareScorecard(...)` directly when defined).

**S14 — kudos persistence (Firestore round-trip)**
Auth as smoke. Seed a test round in smoke-test-league owned by a synthetic uid (NOT smoke account — tests member non-author path). Navigate to /feed. Programmatically click Kudos. Wait 2s for Firestore round-trip. Assert /rounds/{seededId} `likes` field contains smoke uid.

**S15 — comment persistence (Firestore round-trip)**
Auth as smoke. Seed test round. Navigate to /feed. Programmatically post a comment via `feedSubmitComment(roundId)` directly (bypasses input field for stability). Wait 2s. Assert /rounds/{seededId} `comments` field contains an entry with smoke uid + the test text.

**S16 — HQ Home action row markup**
Auth as smoke. Seed a test round (visible on League Pulse). Navigate to HQ Home. Assert at least one `.hq-feed-card__actions` element is present in the DOM containing both Kudos AND Comment buttons.

**S17 — HQ Home state.activity click handlers (V12.8 cleanup verification)**
Auth as smoke. Force `state.activity` to contain a synthetic event (e.g., `{ type: "trip_created", name: "test", ts: Date.now() }`). Trigger HQ Home re-render. Assert the resulting `.hq-feed-card[data-type-is-activity]` (or by chip text `TRIP`) has a non-empty `onclick` attribute.

Helper: `tests/smoke/setup/seed-rounds.js` (new) — Admin SDK helper to insert/clear test rounds in smoke-test-league with arbitrary owner uids. Mirrors `seed-notifications.js` shape.

---

## Deferred items

- Native Share API integration via Capacitor (post-native shell)
- Notification batching on high-engagement rounds
- Achievement integration (kudos count triggering achievements)
- Mobile-specific tap target polish on HQ Home action row
- Tiered action row variants by viewport band
- **Other post types (range sessions, tee times, photos, achievements) engagement** — Ship 5+5.5 or absorbed into Ship 5+4 (Personal Bests + Event Surface)
- Per-P4: V12-style sweep on bounties, wagers, scrambles, trips (likely silent-failure surfaces from same v8.0 rules pattern)

---

## Implementation phases

### Phase A — `firestore.rules` change
Edit + verify diff. **Hook 4 protected file** — requires `disableAllHooks` bypass per CLAUDE.md.
1. Confirm CTO authorized rule edits in this conversation: ✅ (CORE 1)
2. Add `"disableAllHooks": true` to `.claude/settings.local.json`
3. Make rule edit
4. Run lint
5. Immediately remove `disableAllHooks`

### Phase B — `feed.js` writers + UI restoration
Multi-edit. ~250 LOC delta. Restore Kudos in action row, rewrite Comment button + handler, add 4 writers (feedToggleLike, feedSubmitComment, feedToggleCommentLike, feedDeleteComment) with optimistic UI + revert + toast + sendNotification + v8.17.0 cascade hardening on round_reply.

### Phase C — `home.js` action row + dest plumbing
~50 LOC delta. Restore .hq-feed-card__actions markup with [Kudos | Comment] on round-type cards, add `roundId` to items.push for round path, add `dest` plumbing for state.activity items.

### Phase D — `notification-types.js` expansion
~10 LOC delta. 4 new entries each in NOTIFICATION_TYPES + NOTIFICATION_META.

### Phase E — `shareScorecard` definition
~12 LOC. Add to feed.js (or core/router.js if globally needed; recommend feed.js since that's the only caller).

### Phase F — 5 new smoke scenarios (MANDATORY)
- `tests/smoke/setup/seed-rounds.js` — Admin SDK helper (new file, ~80 LOC)
- `tests/smoke/scenarios/s13-feed-action-row.js`
- `tests/smoke/scenarios/s14-feed-kudos-persistence.js`
- `tests/smoke/scenarios/s15-feed-comment-persistence.js`
- `tests/smoke/scenarios/s16-hq-home-action-row.js`
- `tests/smoke/scenarios/s17-hq-home-state-activity-clickable.js`

### Phase G — Caddy Notes + version triple
Archive v8.19.0 → archiveNotes. Populate v8.20.0 currentNotes (3 entries per ruling). Bump utils.js + package.json + sw.js to 8.20.0. Bump smoke S1 + _demo asserts.

### Phase H — Verification
- `npm run lint` clean
- `npm run build` clean
- `npm run smoke:full` — must achieve 17/17 × 4 browsers (68/68); webkit S10 flake tolerated if isolated-retry passes
- Manual browser smoke (CTO post-deploy): real account kudos a round, post a comment, kudos a comment, delete own comment, copy share link

### Phase I — Implementation summary + push approval
Draft summary; CTO approves; commit + push + cache-bust verify + Firestore rules deploy.

---

## Estimated LOC delta

| File | Δ |
|---|---|
| `firestore.rules` | +5 / -1 |
| `src/pages/feed.js` | +260 / -10 |
| `src/pages/home.js` | +45 / -3 |
| `src/core/notification-types.js` | +10 / 0 |
| `src/pages/caddynotes.js` | +13 / -7 |
| `src/core/utils.js` | +1 / -1 |
| `package.json` | +1 / -1 |
| `public/sw.js` | +1 / -1 |
| `tests/smoke/scenarios/_demo.js` | +1 / -1 |
| `tests/smoke/scenarios/s1-auth.js` | +1 / -1 |
| `tests/smoke/setup/seed-rounds.js` | +90 / 0 (new) |
| `tests/smoke/scenarios/s13-*.js` | +50 / 0 (new) |
| `tests/smoke/scenarios/s14-*.js` | +60 / 0 (new) |
| `tests/smoke/scenarios/s15-*.js` | +60 / 0 (new) |
| `tests/smoke/scenarios/s16-*.js` | +40 / 0 (new) |
| `tests/smoke/scenarios/s17-*.js` | +40 / 0 (new) |
| `docs/SHIP_5_5_SPEC.md` | +400 / 0 (this file) |
| **TOTAL NET** | **~+1080 / -25 ≈ +1055** |

Larger than Ship 5+3 (+150) but proportionate to scope: 4 writers + UI restoration + 5 smoke scenarios + new admin helper.

---

## Caddy Notes copy (per CTO ruling, Amendment B)

DO NOT acknowledge v8.19.0's scoping miss. Frame v8.20.0 as the engagement ship.

```js
{ item: "Round posts are social now. Kudos and comment on rounds in your activity feed and on HQ Home League Pulse. The poster gets a notification when someone reacts.", tag: "NEW" },
{ item: "Share a round — copy a direct link to any scorecard with one tap.", tag: "NEW" },
{ item: "HQ Home activity cards now navigate where they should. Tap a trip card to see the trip, a course review to see the course, etc.", tag: "FIXED" }
```

Tagline: `"Engagement architecture"` or `"Round posts go social"`.

---

## Deploy order (per ruling)

Strict-superset rule change → deploy order between code and rules is commutative.

1. Lint + build clean
2. Smoke clean (`npm run smoke:full` — 17/17 × 4 browsers)
3. Caddy Notes update (Phase G)
4. Version triple bump (Phase G)
5. Commit "v8.20.0 — Engagement architecture (Ship 5+5)"
6. **Deploy Firestore rules separately:** `firebase deploy --only firestore:rules` (CTO terminal — `firebase login:list` first; bypass needed for staged rule edit)
7. Push code commit to origin/main
8. Verify on origin
9. Wait for GitHub Pages deploy
10. Cache-bust verify (APP_VERSION = 8.20.0 served)
11. Manual browser smoke per Phase H

---

## Operational gotchas

1. **`firestore.rules` is hook-protected** (Hook 4) — `disableAllHooks` bypass per CLAUDE.md. Authorized via this ruling.
2. **Firebase CLI auth required** for `firebase deploy --only firestore:rules`.
3. **Smoke S1 hardcoded version** — `s1-auth.js` and `_demo.js` assert `APP_VERSION === '8.19.0'`. Bump to `'8.20.0'` BEFORE smoke run.
4. **Webkit S10 flake** — known intermittent, unrelated to Ship 5+5 code paths. Tolerate per ruling if isolated-retry passes.
5. **seed-rounds.js requires service-account** — already present from Ship 5+1 setup at `scripts/.service-account.json`. New helper just imports.

---

## Out of scope

- Engagement on non-round post types (range, tee, photo, achievement) — captured for Ship 5+5.5 / Ship 5+4
- Native Share API
- Notification batching
- Achievement triggers from kudos
- Mobile tap polish on HQ Home action row
- Tiered action row by viewport band
- New visual design on /feed or HQ Home
- /chat changes (Ship 5+3 closed)

---

## Standing by

Spec locked. Implementation begins in Phase A.
