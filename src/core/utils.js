/* ================================================
   PARBAUGHS v5.7.66 — SHARE CARD REDESIGN · GOLF SYMBOLS · LOGO · FIRESTORE RULES · TEAM RENAME SYNC
   Phase 5 Firebase + Achievements + Live Spotlight
   ================================================ */

// ── App version — single source of truth ──
var APP_VERSION = "8.23.29";

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
  Router.toast("Verify your email to " + (actionName || "do this") + ", check Settings");
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
  // Always surface Firestore critical errors (index missing, permission denied)
  var msg = arguments.length > 0 ? String(arguments[arguments.length > 1 ? 1 : 0]) : "";
  var isCritical = /index|permission|FAILED_PRECONDITION|PERMISSION_DENIED|requires an index/i.test(msg);
  if (isCritical) {
    console.error("[PB CRITICAL]", Array.prototype.slice.call(arguments).join(" "));
    // Log to Firestore errors collection so it shows in admin panel
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
function escHtml(s) { if (!s) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

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
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').then(function(reg) {
      pbLog('[SW] Registered:', reg.scope);
    }).catch(function(err) {
      pbWarn('[SW] Registration failed:', err);
    });
  });
}
