/* ================================================
   PARBAUGHS v5.7.66 — SHARE CARD REDESIGN · GOLF SYMBOLS · LOGO · FIRESTORE RULES · TEAM RENAME SYNC
   Phase 5 Firebase + Achievements + Live Spotlight
   ================================================ */

var PB_DEBUG = false; // Set true for console output
function pbLog() { if (PB_DEBUG && console.log) console.log.apply(console, arguments); }
function pbWarn() { if (PB_DEBUG && console.warn) console.warn.apply(console, arguments); }

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
