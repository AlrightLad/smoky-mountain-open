# Ship 5+2 — Tee Times Revival (v8.18.0)

**Status:** Spec locked, ready for implementation
**Authored:** 2026-05-04
**Audit lineage:** V1-V11 audit (in-conversation, post-v8.17.0)
**Scope ruling:** CTO 2026-05-04
**Version target:** v8.18.0

---

## Headline

The Tee Times surface has been latently broken since the v8.0 rules rewrite (April 2026): non-creator non-leadership members **cannot RSVP** because the Firestore update rule on `/teetimes/{teeId}` doesn't permit member-driven writes to the `responses` field. Members tap "In" / "Maybe" / "Out" and nothing happens — the update is silently rejected at the rules layer. There is **no `.catch()` handler** at the call site, so users get no feedback at all. The founding crew has been working around this informally via `scheduling_chat` and verbal coordination.

**Production verification:** zero tee time documents currently exist in production (admin SDK queried 2026-05-04). The feature has been effectively unused for ~1 month. This means **zero migration risk** for any rule or schema change.

This ship fixes the F3 RSVP bug, hardens the tee_cancelled / tee_withdrawal broadcast cascades to match v8.17.0 standards, adds three missing `.catch()` handlers, and bundles a small set of low-cost / high-value cleanups.

---

## Audit findings (V1-V11)

| # | Finding | Severity | Disposition |
|---|---|---|---|
| 1 | F3 RSVP silent failure (non-creator can't update `responses`) | CRITICAL | **CORE** |
| 2 | F6 withdrawal cascade unreachable (knock-on of #1) | CRITICAL | Auto-fixed by #1 |
| 3 | 3 missing `.catch()` handlers (RSVP, cancel, markOfficial) | HIGH | **CORE** |
| 4 | F5a/F6 broadcasts NOT v8.17.0-hardened | MEDIUM | **CORE** (defense-in-depth) |
| 5 | F5a/F6 missing explicit `page:` field | MEDIUM | **CORE** (consistency) |
| 6 | `tee_rsvp` cluster type has no writer | MEDIUM | **INCLUDED** (creator-notification feature) |
| 7 | Same-date time string lexical sort bug (home.js:2392) | MEDIUM | **INCLUDED** |
| 8 | Notification fatigue (no batching) | MEDIUM | DEFER |
| 9 | F4 edit not implemented | LOW | DEFER |
| 10 | `status: "completed"` dead state | LOW | DEFER |
| 11 | `visibility: "private"` collected but unenforced | LOW | **INCLUDED** |
| 12 | No pairing infrastructure (B.2/B.3) | LOW | DEFER (Phase 2) |
| 13 | No recurring tee times | LOW | DEFER |
| 14 | No calendar conflict detection | LOW | DEFER |
| 15 | No round → tee auto-completion | LOW | DEFER |

---

## Locked scope (12 items)

### CORE (must ship)

**1. Firestore rules expansion — `/teetimes/{teeId}` update**

`firestore.rules:525-529` — add a 4th OR-clause permitting any active league member to write to the `responses` field exclusively:

```
allow update: if amIActive() && (
  resource.data.createdBy == uid()
  || amILeagueLeadership(resource.data.leagueId)
  || amIFounder()
  || (amILeagueMember(resource.data.leagueId)
      && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['responses']))
);
```

Preserves all existing creator/leadership/founder permissions; adds the responses-only path for members.

**2. F3 client `.catch()` — `rsvpTeeTime()` line 198**

```js
db.collection("teetimes").doc(teeId).update(update)
  .then(...)
  .catch(function(err) {
    pbWarn("[teetimes] RSVP failed:", err.message);
    Router.toast("Couldn't RSVP — please try again");
  });
```

**3. F5a `.catch()` — `cancelTeeTime()` line 211**

```js
.catch(function(err) {
  pbWarn("[teetimes] cancel failed:", err.message);
  Router.toast("Couldn't cancel — please try again");
});
```

**4. F5c `.catch()` — `markOfficial()` line 228**

```js
.catch(function(err) {
  pbWarn("[teetimes] markOfficial failed:", err.message);
  Router.toast("Couldn't mark official — please try again");
});
```

**5. V4 broadcast hardening — `tee_cancelled` (F5a, line 215)**

Apply v8.17.0 two-layer filter pattern (matches `tee_posted` at line 181-186):

```js
var _writerIsTest = !!(currentProfile && currentProfile.isTestAccount);
var _teeLeagueId = tee.leagueId || (typeof getActiveLeague === "function" ? getActiveLeague() : null);
ids.forEach(function(uid) {
  var p = PB.getPlayer(uid);
  if (!p) return;
  if (_teeLeagueId && (!p.leagues || p.leagues.indexOf(_teeLeagueId) === -1)) return;
  if (!!p.isTestAccount !== _writerIsTest) return;
  sendNotification(uid, { type:"tee_cancelled", title:"Tee Time Cancelled", message:..., page:"teetimes" });
});
```

**6. V4 broadcast hardening — `tee_withdrawal` (F6, line 203)**

Same two-layer filter pattern.

**7. F5a/F6 explicit `page: "teetimes"` field**

Add to both `sendNotification` calls in items 5 + 6.

**8. Markup typo fix — `teetimes.js:105`**

```html
<!-- Before -->
<button ...>Maybe/button>

<!-- After -->
<button ...>Maybe</button>
```

**9. Spots upper bound enforcement — Firestore create rule**

```
allow create: if amIActive()
             && request.resource.data.createdBy == uid()
             && amILeagueMember(request.resource.data.leagueId)
             && !isBannedFromLeague(request.resource.data.leagueId, uid())
             && request.resource.data.spots is int
             && request.resource.data.spots >= 2
             && request.resource.data.spots <= 5;
```

### INCLUDED (low-cost, high-value bundles)

**10. `tee_rsvp` notification writer — `rsvpTeeTime()`**

Send notification to `tee.createdBy` ONLY when state transitions to `"accepted"` (not maybe/declined). Suppress when creator RSVPs to own tee (auto-RSVP at create time, where `tee.createdBy === currentUser.uid`).

```js
if (response === "accepted" && tee.createdBy && tee.createdBy !== currentUser.uid) {
  var rsvperName = currentProfile ? (currentProfile.name || currentProfile.username) : "A member";
  sendNotification(tee.createdBy, {
    type: "tee_rsvp",
    title: rsvperName + " is in",
    message: (tee.courseName || "Tee time") + " · " + tee.date + " · " + (tee.time || ""),
    page: "teetimes"
  });
}
```

**11. Same-date time sort fix — `home.js:2392`**

Add helper in `home.js`:

```js
function _parseTimeMinutes(t) {
  if (!t) return 0;
  var m = String(t).match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return 0;
  var h = parseInt(m[1], 10) % 12;
  if (/PM/i.test(m[3])) h += 12;
  return h * 60 + parseInt(m[2], 10);
}
```

Replace sort at `_getUpcomingTeeTimes`:

```js
upcoming.sort(function(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return _parseTimeMinutes(a.time) - _parseTimeMinutes(b.time);
});
```

**12. `visibility: "private"` enforcement — `teetimes.js:22`**

Add filter at render time. Private tees visible only to creator + league leadership + founder:

```js
var amCommish = isFounderRole(currentProfile);
var upcoming = liveTeeTimes.filter(function(t) {
  if (t.date < now || t.status === "cancelled") return false;
  if (t.visibility === "private"
      && t.createdBy !== (currentUser && currentUser.uid)
      && !amCommish) return false;
  return true;
});
```

(Apply parallel filter to `past` and `recentlyCancelled` arrays.)

---

## Deferred items (capture in backlog if not already)

- **F4 edit capability** — needs schema additions (editedAt, editedBy)
- **Recurring tee times** — schema work
- **Pairing/groups** — already captured B.2/B.3
- **Round → tee auto-completion** — would need linkage schema
- **`status: "completed"` dead state cleanup** — auto-transition or remove
- **Notification digest/batching** — fatigue mitigation
- **Calendar conflict detection** — multi-tee same date warnings
- **`time` as Timestamp / `cancelledAt` as Timestamp** — migration work; less urgent given empty production
- **Stale RSVP cleanup on member leave** — GC for left-league entries
- **Deep-link via `params: { id: tee._id }`** — UX polish

These will be added to `docs/POST_SHIP_4A_BACKLOG.md` as B.37 (or higher) entries during Caddy Notes step.

---

## Implementation phases

### Phase A — `firestore.rules` changes (items 1 + 9)
Edit + verify firestore.rules diff. **Hook 4 protected file — requires explicit authorization workflow** per CLAUDE.md:
1. Confirm CTO authorized rule edits in this conversation: ✅ (scope ruling explicitly references rule changes at items 1 + 9)
2. Add `"disableAllHooks": true` to `.claude/settings.local.json`
3. Make rule edits
4. Run lint
5. Deploy: `firebase deploy --only firestore:rules`
6. Immediately remove `disableAllHooks` per CLAUDE.md procedure

### Phase B — `teetimes.js` changes (items 2-8, 10, 12)
Multi-edit via targeted Edits. ~70 LOC delta.

### Phase C — `home.js` change (item 11)
Single helper + sort substitution. ~12 LOC delta.

### Phase D — Caddy Notes + version triple
Archive v8.17.0 → archiveNotes, populate v8.18.0 (3 entries + tagline), bump utils.js + package.json + sw.js.

### Phase E — Verification
- `npm run lint` — all files pass acorn syntax check
- `npm run build` — Vite production build succeeds
- `npm run smoke:full` — 12 scenarios × 4 browsers verify v8.17.0 still works (no regression)
- Manual browser smoke — log in as real account, post a tee time, RSVP from a different real account, verify response sticks

### Phase F — Implementation summary + push approval
Draft summary; CTO approves; commit + push + cache-bust verify.

---

## Estimated LOC delta

| File | Δ |
|---|---|
| `firestore.rules` | +5 / 0 |
| `src/pages/teetimes.js` | +60 / -10 |
| `src/pages/home.js` | +12 / -1 |
| `src/pages/caddynotes.js` | +14 / -8 |
| `src/core/utils.js` | +1 / -1 |
| `package.json` | +1 / -1 |
| `public/sw.js` | +1 / -1 |
| `docs/POST_SHIP_4A_BACKLOG.md` | +30 / 0 (B.37 entry for deferred items) |
| **TOTAL NET** | **~+115 / -22 = +93** |

Far smaller than v8.17.0's +916 net. Surgical scope.

---

## Caddy Notes proposal (member-facing, per CLAUDE.md writing standard)

```js
{ item: "RSVP to tee times now works. Tap In, Maybe, or Out and your response sticks — your friends see the live count of who's coming.", tag: "FIXED" },
{ item: "When someone RSVPs to your tee time, you get a notification on your phone. No more guessing if anyone's actually coming.", tag: "NEW" },
{ item: "Tee time list now respects 'private' visibility — only the host and league commissioners can see private tees.", tag: "FIXED" }
```

Tagline: `"Tee Times revival"` or `"RSVPs that actually work"`.

---

## Deploy order (zero-production-doc scenario)

Per V11.2: **rule deploy and client deploy are commutative** (rules are STRICT SUPERSET of current; old clients work, new clients gracefully handle either ruleset via `.catch()`). Going with:

1. Lint + build clean
2. Smoke clean (`npm run smoke:full`)
3. Caddy Notes update (Phase D)
4. Version triple bump (Phase D)
5. Commit "v8.18.0 — Tee Times revival (F3 RSVP fix + V4 hardening)"
6. **Deploy Firestore rules separately**: `firebase deploy --only firestore:rules` (this needs `firebase login`-authenticated CTO terminal — Hook bypass also needed for the staged rule edit)
7. Push code commit to `origin/main`
8. Verify on origin
9. Wait for GitHub Pages deploy
10. Cache-bust verification (APP_VERSION = 8.18.0)
11. Manual browser smoke — real account RSVPs to tee, response sticks

---

## Operational gotchas applicable to this ship

1. **`firestore.rules` is hook-protected** (Hook 4) — requires `disableAllHooks` bypass per CLAUDE.md authorized-edit pattern. Already authorized via this scope ruling.
2. **Firebase CLI auth required** for `firebase deploy --only firestore:rules` — CTO must run `firebase login:list` first; if no account, `firebase login` in their terminal before the deploy step.
3. **Cloud Functions runtime** — N/A (no Cloud Function changes)
4. **Firestore indexes** — N/A (no new query patterns; existing indexes cover everything)

---

## Out of scope (will not be done in v8.18.0)

- All items listed in "Deferred" above
- Schema additions (no new fields needed)
- New collections
- Cloud Function changes
- Page layout / visual redesign
- Mobile-specific UX polish

---

## Standing by

Spec locked. Implementation begins next.
