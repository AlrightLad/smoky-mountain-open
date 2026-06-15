/* ================================================
   PARBAUGHS v5.7.66 — SHARE CARD REDESIGN · GOLF SYMBOLS · LOGO · FIRESTORE RULES · TEAM RENAME SYNC
   Phase 5 Firebase + Achievements + Live Spotlight
   ================================================ */

// ── App version — single source of truth ──
var APP_VERSION = "8.25.231";

// ── Onboarding walkthrough (FTUE) — foundation constants/helpers ──
// WALKTHROUGH_MAJOR is decoupled from APP_VERSION so a patch bump never
// re-fires the first-time tour (the Clippy regression). Bump to 2 only on a
// breaking FTUE change. members/{uid}.walkthrough.ftueVersion is compared to it.
var WALKTHROUGH_MAJOR = 2;

// Whole-day gap between two YYYY-MM-DD local-date strings (0 if either missing
// or unparseable). Used to detect a 30+ day lapse for the "while you were gone"
// welcome-back flow, off lastLoginDate (the only real recency field).
function _daysBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return 0;
  var a = new Date(fromStr + "T00:00:00");
  var b = new Date(toStr + "T00:00:00");
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

// ══════════════════════════════════════════════════════════════════════════
// LEAGUE ISOLATION — Nuclear approach. Makes leaking PHYSICALLY IMPOSSIBLE.
// ══════════════════════════════════════════════════════════════════════════

var LEAGUE_SCOPED = ["rounds","chat","trips","teetimes","wagers","bounties","challenges","scrambleTeams","calendar_events","scheduling_chat","social_actions","invites","syncrounds","liverounds","league_battles","tripscores","rangeSessions","partygames"];

// leagueQuery(name) — returns a Firestore query pre-filtered by leagueId.
// Use this for ALL reads on league-scoped collections.
// For global collections, use db.collection(name) directly.
function leagueQuery(name) {
  if (!db) return null;
  if (LEAGUE_SCOPED.indexOf(name) === -1) {
    pbWarn("[LeagueQuery] Called on non-scoped collection:", name);
    return db.collection(name);
  }
  var league = getActiveLeague();
  if (!league) {
    pbWarn("[LeagueQuery] No active league for:", name);
    return db.collection(name).where("leagueId", "==", "NONE_SHOULD_MATCH");
  }
  return db.collection(name).where("leagueId", "==", league);
}

// leagueDoc(name, data) — injects leagueId into data before write.
// Use this for ALL writes (.add, .set) on league-scoped collections.
function leagueDoc(name, data) {
  if (LEAGUE_SCOPED.indexOf(name) !== -1 && data && typeof data === "object") {
    data.leagueId = getActiveLeague();
  }
  return data;
}

// ══════════════════════════════════════════════════════════════════════════
// THE CADDY — single canonical bot identity (v8.25.x consolidation)
// ══════════════════════════════════════════════════════════════════════════
// Founder requirement: every automated / scheduled / "league message from a
// bot" post collapses into ONE "The Caddy" user with a Parbaughs-branded
// avatar, IDENTICAL across all leagues, so it reads instantly as automated
// vs. a human post. Before this, bot writers used a grab-bag of authors
// ("The Caddy", "Parbaughs", authorId "system") with no consistent flag, so
// some rendered like a human member (the bug). This is the single source of
// truth all bot WRITES route through. PB_CADDY.id is a reserved sentinel —
// no real member can ever own it (Firebase UIDs are 28 chars), so the
// render-layer match below can never collide with a human.
// v8.25.161 (#73, Founder) — renamed the bot identity "The Caddy" -> "The Caddies"
// (it speaks for the whole crew — Murphy, Old Tom, Birdie, Bag Room Guy — and now
// wears a crew portrait). id stays "the-caddy" so all routing/detection + already-
// stored bot docs (authored "The Caddy") keep matching; detection accepts BOTH
// names (no Firestore migration).
var PB_CADDY = { id: "the-caddy", authorId: "the-caddy", name: "The Caddies", bot: true };

// isCaddyAuthor(doc) — TRUE when a stored doc is bot content, under either the
// new canonical identity OR a legacy shape. Used by the render layer to
// normalize already-stored docs without a Firestore migration (Founder: no
// risky prod data migration). Legacy bot docs were authored authorId "system"
// and/or authorName "The Caddy"/"Parbaughs"; some carried system:true.
function isCaddyAuthor(d) {
  if (!d || typeof d !== "object") return false;
  if (d.bot === true) return true;
  if (d.authorId === PB_CADDY.id || d.id === PB_CADDY.id) return true;
  if (d.authorId === "system" || d.system === true) return true;
  var nm = d.authorName || d.author || d.name;
  return nm === "The Caddy" || nm === "Parbaughs";
}

// caddyChatDoc(text, extra) — builds a league-scoped chat doc stamped with the
// canonical Caddy identity. ALL bot chat writers build their doc through this
// so the stored author/flag are identical everywhere. extra merges in
// site-specific fields (tripId, linkType, pinned, type, etc.). The caller
// owns the db.collection("chat").add(...) so each site keeps its own
// .then()/.catch() and side effects.
function caddyChatDoc(text, extra) {
  var doc = {
    id: genId(),
    text: String(text == null ? "" : text),
    authorId: PB_CADDY.id,
    authorName: PB_CADDY.name,
    bot: true,
    system: true,
    createdAt: fsTimestamp()
  };
  if (extra && typeof extra === "object") {
    for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) doc[k] = extra[k]; }
  }
  return leagueDoc("chat", doc);
}

// postCaddyChat(text, extra) — one-call convenience: build + write a Caddy
// chat post on the active league. Returns the add() promise so callers can
// chain (or ignore). Errors swallowed by default; pass extra._rethrow to opt
// out. Use this for fire-and-forget announcements; use caddyChatDoc directly
// when the call site needs the doc inline (e.g. inside a larger .then chain).
function postCaddyChat(text, extra) {
  if (typeof db === "undefined" || !db) return Promise.resolve();
  var rethrow = !!(extra && extra._rethrow);
  var clean = extra;
  if (extra && extra._rethrow) { clean = {}; for (var k in extra) { if (k !== "_rethrow" && Object.prototype.hasOwnProperty.call(extra, k)) clean[k] = extra[k]; } }
  var p = db.collection("chat").add(caddyChatDoc(text, clean));
  return rethrow ? p : p.catch(function() {});
}

// Global array of active league-scoped listeners for cleanup on league switch
var _leagueListeners = [];

var PB_DEBUG = false; // Set true for console output

// Send email verification with proper error handling and user feedback
function sendVerificationEmail() {
  if (!currentUser) { Router.toast("Sign in first"); return; }
  if (currentUser.emailVerified) { Router.toast("Email already verified!"); return; }
  var email = currentUser.email || "";
  Router.toast("Sending verification to " + email + "...");
  currentUser.sendEmailVerification().then(function() {
    Router.toast("Verification email sent to " + email + ", check inbox and spam folder");
  }).catch(function(err) {
    Router.toast(pbErrMsg(err, "Couldn't send the verification email. Please try again."));
  });
}

// Email verification gate — returns true if verified or gate should be skipped
function requireVerified(actionName) {
  if (!currentUser) { Router.toast("Sign in required"); return false; }
  if (currentUser.emailVerified) return true;
  // v8.24.22 — was a vanishing toast pointing at Settings (a dead end at the
  // exact moment the member wants to act). Now a recovery card: explains the
  // gate and offers Resend inline via the pbConfirm atom.
  if (typeof pbConfirm === "function") {
    pbConfirm({
      title: "Verify your email first",
      message: "To " + (actionName || "do this") + " you need a verified email — it keeps wagers and the shop honest. We can send the link again right now.",
      confirmLabel: "Resend email",
      cancelLabel: "Not now"
    }).then(function(ok) { if (ok) sendVerificationEmail(); });
  } else {
    Router.toast("Verify your email to " + (actionName || "do this") + ", check Settings");
  }
  return false;
}

// ── Global defaults for cross-file variables ──
// These are re-declared with full state in their owning pages (playnow.js, range.js, etc.)
// but must exist as globals BEFORE home.js renders to prevent ReferenceError.
if (typeof liveState === "undefined") var liveState = {active:false,course:"",scores:[],fir:[],gir:[],putts:[],currentHole:0,holesMode:"full18",format:"stroke",startTime:null};
if (typeof onlineMembers === "undefined") var onlineMembers = {};
if (typeof liveTeeTimes === "undefined") var liveTeeTimes = [];
if (typeof liveRangeSessions === "undefined") var liveRangeSessions = [];
if (typeof liveNotifications === "undefined") var liveNotifications = [];

// ── Platform role resolution (v8.0 client-side) ──────────────────────
// Mirrors the Firestore rules helper platformRoleOf() so client and
// server stay consistent during the v8.0 → v8.2 transition window
// where both `platformRole` (v8) and `role` (legacy) may be present.
//
// Preference: v8 `platformRole` field if set. Otherwise falls back to
// legacy `role` mapping:
//   role === "commissioner"  →  founder  (Zach only had this in v7.x)
//   role === "suspended"     →  suspended
//   role === "removed"       →  banned
//   anything else            →  user
//
// Returns null if member is nullish. Returns one of:
//   "founder" | "user" | "suspended" | "banned"
function platformRoleOf(member) {
  if (!member) return null;
  if (member.platformRole) return member.platformRole;
  if (member.role === "commissioner") return "founder";
  if (member.role === "suspended") return "suspended";
  if (member.role === "removed") return "banned";
  return "user";
}

// Convenience: returns true if member is the platform founder.
function isFounderRole(member) { return platformRoleOf(member) === "founder"; }

// Convenience: returns true if member is platform-banned (was "removed"
// in v7 terminology — legacy fallback handles that).
function isBannedRole(member) { return platformRoleOf(member) === "banned"; }

// ── Member block list (App Store Guideline 1.2 — UGC moderation) ──────
// Each member stores blockedUsers (an array of uids) on their OWN member
// doc. Client-side filtering hides a blocked member's posts, chat, comments,
// and direct messages from the blocker. Stored on the blocker's own doc so
// no Firestore rules change is required (a member may already write their own
// member doc). Server-enforced blocking (denying the blocked user's writes)
// is a documented follow-up. The blocker side is what App Store 1.2 requires:
// the ability to stop seeing and being contacted by an abusive user.
// ── Invite quota (v8.24.14) ───────────────────────────────────────────
// Founder directive 2026-06-10: "users need to be able to invite friends and
// currently that option is unavailable." Members who exhausted the original
// 3-invite cap lost every invite entry point (Settings hid the button; the
// Members page showed a dead end). Invites are the league's growth engine —
// every member gets a 25-invite floor regardless of the legacy quota stored
// on their doc. Admin can still grant MORE via the existing quota tool;
// abuse control is moderation (suspend/ban), not invite scarcity.
var PB_INVITE_FLOOR = 25;
function pbMaxInvites(profile) {
  if (!profile) return 0;
  if (typeof isFounderRole === "function" && isFounderRole(profile)) return Infinity;
  return Math.max(profile.maxInvites || 0, PB_INVITE_FLOOR);
}
function pbInvitesLeft(profile) {
  if (!profile) return 0;
  var max = pbMaxInvites(profile);
  if (max === Infinity) return Infinity;
  return Math.max(0, max - (profile.invitesUsed || 0));
}

// ── pbConfirm (v8.24.15) — branded in-app confirm replacing native confirm() ──
// Native browser dialogs broke the Clubhouse design system at exactly the
// moments that matter (delete/finish/discard). Promise<boolean>; Esc/backdrop
// cancel; danger:true renders the confirm action in claret. Pattern extracted
// from the aces.js inline-confirm (the one good confirm in the app).
function pbConfirm(opts) {
  opts = opts || {};
  return new Promise(function(resolve) {
    var prev = document.getElementById("pbConfirmOverlay");
    if (prev) prev.remove();
    var ov = document.createElement("div");
    ov.id = "pbConfirmOverlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", opts.title || "Confirm");
    ov.style.cssText = "position:fixed;inset:0;z-index:10000;background:var(--scrim, rgba(20,19,15,.42));display:flex;align-items:center;justify-content:center;padding:24px";
    var danger = !!opts.danger;
    ov.innerHTML = '<div style="background:var(--cb-paper);border:1px solid var(--cb-mute-3);border-radius:14px;max-width:340px;width:100%;padding:20px 18px;box-shadow:var(--el-4, 0 12px 32px rgba(0,0,0,.18))">'
      + '<div style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--cb-ink);margin-bottom:6px">' + escHtml(opts.title || "You sure?") + '</div>'
      + (opts.message ? '<div style="font-size:12px;color:var(--cb-mute);line-height:1.5;margin-bottom:14px">' + escHtml(opts.message) + '</div>' : '<div style="margin-bottom:10px"></div>')
      + '<div style="display:flex;gap:8px">'
      + '<button type="button" id="pbConfirmNo" style="flex:1;min-height:44px;background:transparent;border:1px solid var(--cb-mute-3);border-radius:10px;font-weight:600;font-size:13px;color:var(--cb-ink);cursor:pointer">' + escHtml(opts.cancelLabel || "Not yet") + '</button>'
      + '<button type="button" id="pbConfirmYes" style="flex:1;min-height:44px;background:' + (danger ? "var(--cb-claret)" : "var(--cb-felt)") + ';border:none;border-radius:10px;font-weight:700;font-size:13px;color:var(--cb-chalk);cursor:pointer">' + escHtml(opts.confirmLabel || "Confirm") + '</button>'
      + '</div></div>';
    function close(val) { ov.remove(); document.removeEventListener("keydown", onKey); resolve(val); }
    function onKey(e) { if (e.key === "Escape") close(false); }
    ov.addEventListener("click", function(e) { if (e.target === ov) close(false); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ov);
    document.getElementById("pbConfirmNo").onclick = function() { close(false); };
    var yesBtn = document.getElementById("pbConfirmYes");
    yesBtn.onclick = function() { close(true); };
    yesBtn.focus();
  });
}

// ── pbPrompt (v8.24.34) — branded text-input dialog replacing native prompt() ──
// Sibling of pbConfirm. Promise<string|null>: resolves the trimmed value on
// confirm, null on cancel/Escape/backdrop. Enter submits.
function pbPrompt(opts) {
  opts = opts || {};
  return new Promise(function(resolve) {
    var prev = document.getElementById("pbPromptOverlay");
    if (prev) prev.remove();
    var ov = document.createElement("div");
    ov.id = "pbPromptOverlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", opts.title || "Input");
    ov.style.cssText = "position:fixed;inset:0;z-index:10000;background:var(--scrim, rgba(20,19,15,.42));display:flex;align-items:center;justify-content:center;padding:24px";
    ov.innerHTML = '<div style="background:var(--cb-paper);border:1px solid var(--cb-mute-3);border-radius:14px;max-width:340px;width:100%;padding:20px 18px;box-shadow:var(--el-4, 0 12px 32px rgba(0,0,0,.18))">'
      + '<div style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--cb-ink);margin-bottom:6px">' + escHtml(opts.title || "One thing first") + '</div>'
      + (opts.message ? '<div style="font-size:12px;color:var(--cb-mute);line-height:1.5;margin-bottom:12px">' + escHtml(opts.message) + '</div>' : '')
      + '<input id="pbPromptInput" type="text" class="ff-input" style="width:100%;min-height:44px;margin-bottom:12px" placeholder="' + escHtml(opts.placeholder || "") + '" value="' + escHtml(opts.value || "") + '">'
      + '<div style="display:flex;gap:8px">'
      + '<button type="button" id="pbPromptNo" style="flex:1;min-height:44px;background:transparent;border:1px solid var(--cb-mute-3);border-radius:10px;font-weight:600;font-size:13px;color:var(--cb-ink);cursor:pointer">' + escHtml(opts.cancelLabel || "Cancel") + '</button>'
      + '<button type="button" id="pbPromptYes" style="flex:1;min-height:44px;background:var(--cb-felt);border:none;border-radius:10px;font-weight:700;font-size:13px;color:var(--cb-chalk);cursor:pointer">' + escHtml(opts.confirmLabel || "Save") + '</button>'
      + '</div></div>';
    function close(val) { ov.remove(); document.removeEventListener("keydown", onKey); resolve(val); }
    function submit() { var el = document.getElementById("pbPromptInput"); close(el ? el.value.trim() : null); }
    function onKey(e) {
      if (e.key === "Escape") close(null);
      else if (e.key === "Enter") { e.preventDefault(); submit(); }
    }
    ov.addEventListener("click", function(e) { if (e.target === ov) close(null); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ov);
    document.getElementById("pbPromptNo").onclick = function() { close(null); };
    document.getElementById("pbPromptYes").onclick = submit;
    var inp = document.getElementById("pbPromptInput");
    inp.focus(); if (opts.value) inp.select();
  });
}

// ── pbCreateShareLink (v8.24.43, growth #1) — public share pages ────────
// Writes a frozen, member-authored snapshot to the publicly-gettable
// `shares` collection (unguessable id; rules cap shape + sizes; display
// names only, never uids) and resolves the share URL. The snapshot is the
// no-account artifact a guest can open — the acquisition surface.
function pbCreateShareLink(snapshot) {
  if (!db || typeof currentUser === "undefined" || !currentUser) {
    return Promise.reject(new Error("not-signed-in"));
  }
  var bytes = new Uint8Array(16);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  var id = Array.prototype.map.call(bytes, function(b) { return ("0" + b.toString(36)).slice(-2); }).join("").substring(0, 24);
  var doc = {
    type: snapshot.type,
    title: String(snapshot.title || "").substring(0, 120),
    leagueName: String(snapshot.leagueName || window._activeLeagueName || "Parbaughs").substring(0, 80),
    rows: (snapshot.rows || []).slice(0, 30),
    createdBy: currentUser.uid,
    createdAt: fsTimestamp(),
    appVersion: APP_VERSION
  };
  if (snapshot.meta) doc.meta = String(snapshot.meta).substring(0, 300);
  return db.collection("shares").doc(id).set(doc).then(function() {
    // Resolve against the canonical public host so a link cut on staging or
    // localhost still opens for a guest with no access to either.
    return "https://alrightlad.github.io/smoky-mountain-open/share.html?id=" + id;
  });
}

function pbBlockedUids() {
  return (typeof currentProfile !== "undefined" && currentProfile && Array.isArray(currentProfile.blockedUsers)) ? currentProfile.blockedUsers : [];
}
function pbIsBlocked(uid) {
  if (!uid) return false;
  return pbBlockedUids().indexOf(uid) !== -1;
}
// pbSetBlocked(uid, shouldBlock) — add/remove a uid from the signed-in
// member's own blockedUsers array. Updates currentProfile in memory first so
// filtering takes effect immediately, then persists the full computed array
// (no concurrent writer to one's own list, so a full-array write is race-safe
// and avoids a FieldValue dependency). Returns a Promise.
function pbSetBlocked(uid, shouldBlock) {
  if (!uid || typeof currentUser === "undefined" || !currentUser || typeof currentProfile === "undefined" || !currentProfile) {
    return Promise.reject(new Error("not-ready"));
  }
  var list = Array.isArray(currentProfile.blockedUsers) ? currentProfile.blockedUsers.slice() : [];
  var idx = list.indexOf(uid);
  if (shouldBlock && idx === -1) list.push(uid);
  else if (!shouldBlock && idx !== -1) list.splice(idx, 1);
  currentProfile.blockedUsers = list;
  if (!db) return Promise.resolve();
  return db.collection("members").doc(currentUser.uid).update({ blockedUsers: list });
}

function pbLog() { if (PB_DEBUG && console.log) console.log.apply(console, arguments); }
function pbWarn() {
  // Surface Firestore critical errors to the console. v8.25.161 — SPLIT the two
  // critical classes: INDEX / FAILED_PRECONDITION errors are always real +
  // actionable (a missing composite index), so they still write to the prod
  // `errors` collection for the admin panel. PERMISSION-DENIED, however, is
  // almost always the self-healing cold-sign-in rules-context race (a
  // league-scoped listener firing before profile/league context hydrates; it
  // succeeds on the next tick) — writing it to `errors` just SPAMS the
  // maintenance loop (the recurring scrambleTeams/Trip/wagers/chat rows). So we
  // still console.error it (visible for dev + caught by E2E/rules tests) but do
  // NOT persist it. A genuine rules gap surfaces via the rules test suite +
  // console, not auto-error rows.
  var msg = arguments.length > 0 ? String(arguments[arguments.length > 1 ? 1 : 0]) : "";
  var isIndex = /index|FAILED_PRECONDITION|requires an index/i.test(msg);
  var isPermission = /permission|PERMISSION_DENIED|insufficient permissions/i.test(msg);
  if (isIndex || isPermission) {
    console.error("[PB CRITICAL]", Array.prototype.slice.call(arguments).join(" "));
    if (isIndex) {
      // Real, actionable → admin panel errors collection.
      try {
        if (typeof db !== "undefined" && db) {
          db.collection("errors").add({
            message: Array.prototype.slice.call(arguments).map(String).join(" ").substring(0, 500),
            type: "query_error",
            page: typeof Router !== "undefined" ? Router.getPage() : "unknown",
            appVersion: APP_VERSION,
            timestamp: new Date().toISOString(),
            resolved: false
          }).catch(function(){});
        }
      } catch(e) {}
    }
  } else if (PB_DEBUG && console.warn) {
    console.warn.apply(console, arguments);
  }
}

// pbErrMsg(err, fallback) — user-safe error text for toasts. Maps known
// Firebase error codes to friendly, actionable copy; otherwise returns the
// caller's fallback. Always logs the raw error via pbWarn (admin panel +
// errors collection); NEVER returns the raw SDK message, which leaks internal
// detail to members and reads as a defect (P10 actionable surfacing).
function pbErrMsg(err, fallback) {
  pbWarn("[Action error]", err);
  var code = (err && err.code) || "";
  if (code === "permission-denied" || code === "auth/insufficient-permission") return "You don't have permission to do that.";
  if (code === "unavailable" || code === "auth/network-request-failed") return "You appear to be offline. Check your connection and try again.";
  if (code === "unauthenticated") return "Please sign in again to continue.";
  if (code === "resource-exhausted" || code === "auth/too-many-requests") return "Too many attempts. Wait a moment and try again.";
  return fallback || "Something went wrong. Please try again.";
}

// ========== SECURITY UTILITIES ==========
function validatePassword(pw) {
  if (!pw || pw.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(pw)) return "Password needs at least 1 uppercase letter";
  if (!/[0-9]/.test(pw)) return "Password needs at least 1 number";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return "Password needs at least 1 symbol (!@#$%^&*)";
  return null;
}
var loginAttempts = 0, loginLockUntil = 0;
function checkLoginRateLimit() {
  if (Date.now() < loginLockUntil) return "Too many attempts. Try again in " + Math.ceil((loginLockUntil - Date.now()) / 1000) + "s.";
  return null;
}
function recordLoginFailure() { loginAttempts++; if (loginAttempts >= 5) { loginLockUntil = Date.now() + 300000; loginAttempts = 0; } }
function resetLoginAttempts() { loginAttempts = 0; loginLockUntil = 0; }
function lockButton(btn) { if (!btn) return; btn.disabled = true; btn.dataset.originalText = btn.textContent; btn.textContent = "Working..."; btn.style.opacity = "0.5"; }
function unlockButton(btn) { if (!btn) return; btn.disabled = false; btn.textContent = btn.dataset.originalText || "Submit"; btn.style.opacity = "1"; }
var FOUNDING_CODE_MAX_USES = 4;
function checkFoundingCodeAvailability() {
  if (!db) return Promise.resolve(true);
  return db.collection("members").where("isFoundingFour", "==", true).get().then(function(s) { return s.size < FOUNDING_CODE_MAX_USES; }).catch(function() { return true; });
}
// HTML-escape for both text AND attribute contexts. Escapes all five special
// chars — including " and ' — so user-controlled strings (member names, course
// names) are safe when interpolated into double/single-quoted attributes
// (aria-label, title, data-*), closing the attribute-breakout stored-XSS vector
// the old textContent-only escape left open. Pure string replace (no DOM alloc).
function escHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Dismiss mobile keyboard by blurring the active input
function pbDismissKeyboard() {
  if (document.activeElement && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }
}

// Global tap-outside handler: dismiss keyboard when tapping non-input areas on mobile
document.addEventListener("touchend", function(e) {
  var tag = e.target.tagName;
  if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
    var ae = document.activeElement;
    if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) {
      // Small delay so the tap's onclick fires first (e.g. selecting a search result)
      setTimeout(function() { ae.blur(); }, 50);
    }
  }
}, { passive: true });
function fsTimestamp() { return (typeof firebase !== "undefined" && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(); }
// tsMillis(v) — normalize any createdAt/timestamp shape to epoch millis.
// Firestore Timestamp (.toMillis) is the prod shape; offline fsTimestamp() falls
// back to an ISO string, legacy/seed rows can be raw numbers. Unguarded .toMillis()
// throws on string/number and (caught silently) blanks the whole feed — see feed.js.
function tsMillis(v) {
  if (!v) return 0;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v.toDate === "function") return v.toDate().getTime();
  if (typeof v === "number") return v;
  if (typeof v === "string") { var t = Date.parse(v); return isNaN(t) ? 0 : t; }
  return 0;
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }
function localDateStr(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
// Ordinal label for a rank/position: 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 11 -> "11th".
// Used wherever the app names a standings/race position in editorial copy.
function ordinalNum(n) {
  n = parseInt(n, 10) || 0;
  var rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return n + "th";
  switch (n % 10) { case 1: return n + "st"; case 2: return n + "nd"; case 3: return n + "rd"; default: return n + "th"; }
}

// ========== SHARED UI HELPERS ==========
// These are used across multiple pages — must be in core, not in a page file.

function statBox(val, label) {
  var isNum = !isNaN(parseFloat(val)) && isFinite(val) && val !== "—";
  return '<div class="stat-box"><div class="stat-val"' + (isNum ? ' data-count="' + val + '"' : '') + '>' + (isNum ? '0' : val) + '</div><div class="stat-label">' + label + '</div></div>';
}

function formField(label, id, value, type, placeholder) {
  return '<div class="ff"><label class="ff-label">' + label + '</label><input type="' + (type || "text") + '" class="ff-input" id="' + id + '" value="' + (value || "").toString().replace(/"/g, "&quot;") + '"' + (placeholder ? ' placeholder="' + placeholder + '"' : "") + '></div>';
}

function toggleSection(id) {
  var el = document.getElementById(id);
  var toggle = document.getElementById(id + "-toggle");
  if (!el) return;
  var isHidden = el.classList.contains("hidden") || el.style.display === "none";
  if (isHidden) {
    el.classList.remove("hidden");
    el.style.display = "block";
    if (toggle) toggle.style.transform = "rotate(90deg)";
  } else {
    el.style.display = "none";
    if (toggle) toggle.style.transform = "rotate(0deg)";
  }
}

// ========== PWA SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  // v8.25.28 — fresh-code delivery fix. The SW skipWaiting()s + clients.claim()s,
  // so a new version ACTIVATES on deploy — but the already-open page kept running
  // the STALE bundle until a manual reload. That is why shipped fixes (e.g. the
  // tee-shot swing) kept looking unchanged on the installed PWA: the home-screen
  // app rarely fully closes, so the old JS lingered for days. Now:
  //   1. controllerchange → reload ONCE so the page picks up the new code. Guarded
  //      to only fire when a controller already existed (skips the first-visit
  //      initial-claim, which would otherwise reload an already-fresh first load).
  //   2. reg.update() on load + every 30 min so long-lived PWA sessions discover
  //      new versions without waiting for a full app close.
  var _swReloading = false;
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (_swReloading) return;
      _swReloading = true;
      window.location.reload();
    });
  }
  window.addEventListener('load', function() {
    navigator.serviceWorker.register((window.__PB_BASE__ || '/') + 'sw.js').then(function(reg) {
      pbLog('[SW] Registered:', reg.scope);
      try { reg.update(); } catch (e) {}
      setInterval(function() { try { reg.update(); } catch (e) {} }, 30 * 60 * 1000);
    }).catch(function(err) {
      pbWarn('[SW] Registration failed:', err);
    });
  });
}
