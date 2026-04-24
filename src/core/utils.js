/* ================================================
   PARBAUGHS v5.7.66 — SHARE CARD REDESIGN · GOLF SYMBOLS · LOGO · FIRESTORE RULES · TEAM RENAME SYNC
   Phase 5 Firebase + Achievements + Live Spotlight
   ================================================ */

// ── App version — single source of truth ──
var APP_VERSION = "8.3.5";

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
    Router.toast("Verification email sent to " + email + " — check inbox and spam folder");
  }).catch(function(err) {
    var msg = "Failed to send verification email";
    if (err && err.code === "auth/too-many-requests") msg = "Too many attempts — wait a few minutes and try again";
    else if (err && err.message) msg = err.message;
    Router.toast(msg);
    pbWarn("[Auth] Verification email error:", err);
  });
}

// Email verification gate — returns true if verified or gate should be skipped
function requireVerified(actionName) {
  if (!currentUser) { Router.toast("Sign in required"); return false; }
  if (currentUser.emailVerified) return true;
  Router.toast("Verify your email to " + (actionName || "do this") + " — check Settings");
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
