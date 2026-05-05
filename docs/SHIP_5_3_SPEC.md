# Ship 5+3 — Clubhouse Revival (v8.19.0)

**Status:** Spec locked, ready for implementation
**Authored:** 2026-05-04
**Audit lineage:** V1-V11 audit (in-conversation, post-v8.18.0)
**Scope ruling:** CTO 2026-05-04
**Version target:** v8.19.0

---

## Headline

The Clubhouse (chat / activity feed surface at `/chat`) has the **same architectural bug pattern** as Tee Times (Ship 5+2): the v8.0 Firestore rules rewrite (April 2026) introduced an author-only update rule on `/chat/{msgId}` that silently rejects member-driven writes to `likes`, `comments`, and `commentLikes`. Members tap a heart, post a comment, give kudos to a comment — the optimistic UI shows the action lands, but the Firestore write is rejected at the rules layer. There is **no `.catch()` handler** at any of the 4 writer call sites, so users see no feedback at all.

The optimistic UI re-renders before the snapshot listener reconciles. The next refresh / page nav reverts the UI to the rules-actual state — kudos disappear, comments vanish — without explanation. This is a textbook gaslighting UX pattern.

**Production verification (2026-05-04):**
- 26 chat documents in production; **all 26 are system-generated** (`authorId === "system"` for round logs, achievement unlocks, etc.).
- Zero human-authored chat messages exist in production.
- Inference: members likely tried to interact with the feed early in the v8.0 lifecycle, saw kudos/comments fail to stick, and abandoned the feature. This matches the pattern observed in Tee Times (zero docs, rule-induced dormancy).

**This ship is the third instance of the same root cause.** v8.0 rules rewrite shipped author-only update rules across `/teetimes/{teeId}`, `/chat/{msgId}`, and at least one more not-yet-audited collection. Ship 5+1 (v8.17.0) caught the members.js direct query bypass via Path B+. Ship 5+2 (v8.18.0) fixed `/teetimes`. Ship 5+3 fixes `/chat`. The remaining surfaces are tracked in B.36.

This ship rules-fixes the 4 writer sites, hardens the feed_reply broadcast cascade to v8.17.0 standards, adds `.catch()` handlers with optimistic-state revert + toast, and bundles the small B.26 home.js avatar fix.

---

## Audit findings (V1-V11)

| # | Finding | Severity | Disposition |
|---|---|---|---|
| 1 | F3 toggleLike silent failure (member can't update `likes`) | CRITICAL | **CORE** |
| 2 | F4 submitComment silent failure (member can't update `comments`) | CRITICAL | **CORE** |
| 3 | F5 toggleCommentLike silent failure (member can't update `commentLikes`) | CRITICAL | **CORE** |
| 4 | F8 deleteComment silent failure (any non-author member can't update `comments`) | HIGH | **CORE** |
| 5 | 4 missing `.catch()` handlers on chat update writers | HIGH | **CORE** |
| 6 | feed_reply cascade NOT v8.17.0-hardened (no league + test/real filter) | MEDIUM | **CORE** (defense-in-depth) |
| 7 | Optimistic UI doesn't revert on rejection (gaslighting UX) | MEDIUM | **CORE** (toast + revert) |
| 8 | B.26 — home.js feed avatars use single-letter placeholder, not renderAvatar | LOW | **INCLUDED** |
| 9 | feed_like / feed_comment / comment_like clusters not v8.17.0-hardened | LOW | DEFER (creator-only paths, lower abuse surface) |
| 10 | `/chat` create rule allows likes/comments writes by author at create time but no schema validation | LOW | DEFER |
| 11 | No notification batching for high-engagement threads | LOW | DEFER |
| 12 | No soft-delete for comments (splice destroys index for any pinned commentLikes references) | LOW | DEFER (production has zero comments) |
| 13 | No max-comment-length / max-comments-per-post enforcement | LOW | DEFER |
| 14 | `comments[]` array unbounded growth | LOW | DEFER |
| 15 | No moderation tooling for chat (kick, mute, report) | LOW | DEFER |

---

## Locked scope (5 items)

### CORE (must ship)

**1. Firestore rules expansion — `/chat/{msgId}` update**

`firestore.rules:341-342` — add 4th OR-clause permitting any active league member to write to the engagement subfields `likes`, `comments`, `commentLikes` only:

```
allow update: if amIActive() && (
  resource.data.authorId == uid()
  || (amILeagueMember(resource.data.leagueId)
      && request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['likes', 'comments', 'commentLikes']))
);
```

Preserves existing author-edit permissions; adds the engagement-only path for members. Uses the same `diff().affectedKeys().hasOnly([...])` pattern as Ship 5+2 (`/teetimes` update rule). Strict superset — old clients work, new clients can write engagement fields.

**2. Four `.catch()` handlers with optimistic-state revert + toast**

Each writer site captures the pre-write local state, performs optimistic UI, then runs the Firestore update. On rejection, revert local state and show a toast.

- `toggleLike` (chat.js:581) — `Couldn't add kudos — please try again`
- `submitComment` (chat.js:650) — `Couldn't post comment — please try again`
- `toggleCommentLike` (chat.js:706) — `Couldn't add kudos — please try again`
- `deleteComment` (chat.js:780) — `Couldn't delete comment — please try again`

The revert pattern: snapshot the relevant `localMsg.{likes|comments|commentLikes}` before the optimistic mutation, restore it in `.catch()`, then re-render the feed.

**3. v8.17.0 broadcast hardening — feed_reply cascade (chat.js:667)**

The feed_reply cascade fires `sendNotification(c.uid, ...)` for every prior commenter when a new comment lands. This must apply the v8.17.0 two-layer filter pattern — drop recipients who aren't in the chat's league, and drop recipients on the wrong side of the test/real account boundary:

```js
var _writerIsTest = !!(currentProfile && currentProfile.isTestAccount);
var _chatLeagueId = data.leagueId || (typeof getActiveLeague === "function" ? getActiveLeague() : null);
comments.forEach(function(c) {
  if (c.uid && !notified[c.uid]) {
    notified[c.uid] = true;
    var p = (typeof PB !== "undefined" && PB.getPlayer) ? PB.getPlayer(c.uid) : null;
    if (!p) return;
    if (_chatLeagueId && (!p.leagues || p.leagues.indexOf(_chatLeagueId) === -1)) return;
    if (!!p.isTestAccount !== _writerIsTest) return;
    sendNotification(c.uid, { type: "feed_reply", title: "New Reply", message: name + " also commented on a post you commented on", page: "chat" });
  }
});
```

**4. Toast feedback strings** — covered by item 2 above (each `.catch()` shows its own toast).

### INCLUDED (low-cost, high-value bundle)

**5. B.26 — home.js feed avatars use renderAvatar (home.js:1649)**

Replace the single-letter placeholder with a proper `renderAvatar()` call that draws on PB.getPlayer when an actor UID is available, falling back to a synthetic player object built from `actorName` when only a name is available. ~5 LOC.

```js
// Before:
var initial = (it.actorName.charAt(0) || "?").toUpperCase();
b += '<div class="hq-feed-card__avatar">' + escHtml(initial) + '</div>';

// After:
var actorPlayer = (it.actorUid && typeof PB !== "undefined" && PB.getPlayer) ? PB.getPlayer(it.actorUid) : null;
b += renderAvatar(actorPlayer || { name: it.actorName || "?", id: "" }, 32, !!actorPlayer);
```

Plus 2-line plumbing: store `actorUid: r.player` in the rounds items.push and `actorUid: a.uid || a.playerId || ""` in the activity items.push.

---

## Deferred items (capture in backlog)

Items #9-#15 from the audit table. Of particular note:

- **feed_like / feed_comment / comment_like cluster hardening** (#9) — these notifications target a single recipient (author / comment author), not a fan-out. The abuse surface is much smaller than feed_reply. Captured for B.36 phase 2 (full multi-league cluster hardening sweep).
- **Soft-delete for comments** (#12) — irrelevant in production today (zero human comments). Becomes relevant once comments accumulate.
- **Max-length / rate-limit / moderation tooling** (#13-15) — pre-launch features tied to Phase 4 / App Store submission.

These will be added to `docs/POST_SHIP_4A_BACKLOG.md` as B.38 (chat hardening phase 2) during Caddy Notes step.

---

## Implementation phases

### Phase A — `firestore.rules` change (item 1)
Edit + verify firestore.rules diff. **Hook 4 protected file** — requires explicit authorization workflow per CLAUDE.md:
1. Confirm CTO authorized rule edits in this conversation: ✅ (scope ruling explicitly references rule change at item 1)
2. Add `"disableAllHooks": true` to `.claude/settings.local.json`
3. Make rule edit
4. Run lint
5. Deploy (or confirm post-implementation deploy step in Phase F)
6. Immediately remove `disableAllHooks` per CLAUDE.md procedure

### Phase B — `chat.js` changes (items 2 + 3)
Multi-edit via targeted Edits. ~80 LOC delta. 4 writer sites + 1 cascade hardening site.

### Phase C — `home.js` change (item 5)
Single avatar substitution + 2 actorUid plumbing changes. ~5 LOC delta.

### Phase D — Caddy Notes + version triple
Archive v8.18.0 → archiveNotes, populate v8.19.0 (2 entries + tagline), bump utils.js + package.json + sw.js to 8.19.0.

### Phase E — Verification
- Bump S1 + _demo smoke version assertions to 8.19.0
- `npm run lint` — all files pass acorn syntax check
- `npm run build` — Vite production build succeeds
- `npm run smoke:full` — 12 scenarios × 4 browsers verify v8.18.0 still works (no regression)
- Manual browser smoke (CTO post-deploy) — log in as real account, give kudos to a chat post, post a comment, kudos a comment, verify all stick after refresh

### Phase F — Implementation summary + push approval
Draft summary; CTO approves; commit + push + cache-bust verify + Firestore rules deploy.

---

## Estimated LOC delta

| File | Δ |
|---|---|
| `firestore.rules` | +4 / -1 |
| `src/pages/chat.js` | +120 / -10 |
| `src/pages/home.js` | +6 / -2 |
| `src/pages/caddynotes.js` | +12 / -8 |
| `src/core/utils.js` | +1 / -1 |
| `package.json` | +1 / -1 |
| `public/sw.js` | +1 / -1 |
| `tests/smoke/scenarios/_demo.js` | +1 / -1 |
| `tests/smoke/scenarios/s1-auth.js` | +1 / -1 |
| `docs/POST_SHIP_4A_BACKLOG.md` | +20 / 0 (B.38 entry) |
| `docs/SHIP_5_3_SPEC.md` | +250 / 0 (this file) |
| **TOTAL NET** | **~+150-200** |

---

## Caddy Notes proposal (member-facing, per CLAUDE.md writing standard)

Per ruling — DO NOT acknowledge gaslighting / "broken since v8.0" / "reactions used to disappear" framing. Forward-looking copy only.

```js
{ item: "Kudos and comments stick now. Tap a heart, post a comment — it stays. Notifications fire to the original poster.", tag: "FIXED" },
{ item: "Profile photos show in the HQ Home activity feed. Single-letter placeholders are gone.", tag: "IMPROVED" }
```

Tagline: `"Clubhouse revival"`.

---

## Deploy order (zero-production-engagement scenario)

Per V11 audit: **rule deploy and client deploy are commutative** (rules are STRICT SUPERSET of current; old clients can still write to `likes` only when they're the author, new clients can write to engagement subfields as members). Going with:

1. Lint + build clean
2. Smoke clean (`npm run smoke:full`)
3. Caddy Notes update (Phase D)
4. Version triple bump (Phase D)
5. Commit "v8.19.0 — Clubhouse revival (Ship 5+3)"
6. **Deploy Firestore rules separately**: `firebase deploy --only firestore:rules` (CTO terminal — Hook bypass also needed for the staged rule edit)
7. Push code commit to `origin/main`
8. Verify on origin
9. Wait for GitHub Pages deploy
10. Cache-bust verification (APP_VERSION = 8.19.0)
11. Manual browser smoke — real account gives kudos, posts comment, kudos comment; refresh and verify all stick

---

## Operational gotchas applicable to this ship

1. **`firestore.rules` is hook-protected** (Hook 4) — requires `disableAllHooks` bypass per CLAUDE.md authorized-edit pattern. Already authorized via this scope ruling.
2. **Firebase CLI auth required** for `firebase deploy --only firestore:rules` — CTO must run `firebase login:list` first; if no account, `firebase login` in their terminal before the deploy step.
3. **Cloud Functions runtime** — N/A (no Cloud Function changes)
4. **Firestore indexes** — N/A (no new query patterns; existing indexes cover everything)
5. **Smoke S1 hardcoded version** — `tests/smoke/scenarios/s1-auth.js` and `_demo.js` both assert `APP_VERSION === '8.18.0'`. Must bump to `'8.19.0'` BEFORE running smoke:full or it will fail.

---

## Out of scope (will not be done in v8.19.0)

- All items listed in "Deferred" above
- Schema additions (no new fields needed on chat docs)
- Cloud Function changes
- Page layout / visual redesign
- New chat features (mentions, threads, reactions other than kudos, etc.)
- Mobile-specific UX polish on /chat surface

---

## Standing by

Spec locked. Implementation begins in Phase A.
