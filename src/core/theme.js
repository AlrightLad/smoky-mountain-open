/* ═══════════════════════════════════════════════════════════════════════════
   THEME SYSTEM (v8.3.5 · Ship 0d-i · Part B foundation)

   Six editorial themes replace the prior light/dark appearance axis. Each
   theme ships a complete palette — there's no second axis to compose.

     Default  · clubhouse         — quiet confidence, tournament-program
     Default  · twilight_links    — dusk over coastal course, cool-leaning
     Default  · linen_draft       — bright outdoor light, reading chair
     Unlock   · champion_sunday   — burgundy, worn after a win
     Unlock   · bourbon_room      — lodge/whiskey-bar, tenure-based
     Unlock   · course_record     — ledger paper, silver-brass, rarest

   CSS variables for the 9 core tokens are overridden by [data-theme="..."]
   blocks in base.css. This module owns state, migration, persistence, and
   the public JS API. The theme picker UI ships in 0d-ii.

   Storage: document.documentElement[data-theme] + localStorage("pb_theme")
            + Firestore members/{uid}.theme (written on saveThemeChoice).

   Migration (Ship 0d-i, from pre-theme-system users):
     - localStorage pb_appearance="light" → pb_theme="clubhouse"
     - localStorage pb_appearance="dark"  → pb_theme="twilight_links"
     - Firestore .appearance="light"      → .theme="clubhouse"
     - Firestore .appearance="dark"       → .theme="twilight_links"
     - Pre-v8.1.0 legacy theme IDs        → empty map; retired in v8.1.0
   ═══════════════════════════════════════════════════════════════════════════ */

var THEMES = {
  clubhouse:       { id: "clubhouse",       name: "Clubhouse",       availability: "default", order: 1 },
  twilight_links:  { id: "twilight_links",  name: "Twilight Links",  availability: "default", order: 2 },
  linen_draft:     { id: "linen_draft",     name: "Linen Draft",     availability: "default", order: 3 },
  champion_sunday: { id: "champion_sunday", name: "Champion Sunday", availability: "unlock",  order: 4, hidden_until_unlocked: true },
  bourbon_room:    { id: "bourbon_room",    name: "Bourbon Room",    availability: "unlock",  order: 5, hidden_until_unlocked: false, preview_progress: true },
  course_record:   { id: "course_record",   name: "Course Record",   availability: "unlock",  order: 6, hidden_until_unlocked: true }
};

var DEFAULT_THEME_ID = "clubhouse";

// Legacy ID migration — the 8 pre-v8.1.0 themes were stripped in v8.1.0,
// no data to map from. Kept as empty map for future safety.
var LEGACY_THEME_MIGRATION = {};

// Appearance → theme migration (Option B: retires light/dark axis).
var APPEARANCE_TO_THEME = {
  "light": "clubhouse",
  "dark":  "twilight_links"
};

function _logWarn(msg) {
  if (typeof pbWarn === "function") pbWarn(msg);
  else if (typeof console !== "undefined") console.warn(msg);
}

function applyTheme(themeId) {
  if (!THEMES[themeId]) {
    _logWarn("[Theme] Unknown theme: " + themeId + " — falling back to " + DEFAULT_THEME_ID);
    themeId = DEFAULT_THEME_ID;
  }
  document.documentElement.setAttribute("data-theme", themeId);
  try { localStorage.setItem("pb_theme", themeId); } catch (e) { /* quota or private mode */ }
}

function getCurrentTheme() {
  var attr = document.documentElement.getAttribute("data-theme");
  return (attr && THEMES[attr]) ? attr : DEFAULT_THEME_ID;
}

function getAvailableThemes(unlockedIds) {
  unlockedIds = unlockedIds || [];
  var list = [];
  Object.keys(THEMES).forEach(function(key) {
    var t = THEMES[key];
    var isUnlocked = t.availability === "default" || unlockedIds.indexOf(t.id) !== -1;
    if (!isUnlocked && t.hidden_until_unlocked) return;
    list.push({
      id: t.id,
      name: t.name,
      availability: t.availability,
      order: t.order,
      locked: !isUnlocked,
      preview_progress: !!t.preview_progress
    });
  });
  list.sort(function(a, b) { return a.order - b.order; });
  return list;
}

/* initTheme — runs before first render. The no-flash inline script in
   index.html already set data-theme; this function reconciles against
   legacy storage keys (pb_appearance) and the theme registry. Idempotent. */
function initTheme() {
  var stored = null;
  try { stored = localStorage.getItem("pb_theme"); } catch (e) {}

  // Legacy-appearance migration — happens once on first boot post-upgrade.
  if (!stored) {
    var legacy = null;
    try { legacy = localStorage.getItem("pb_appearance"); } catch (e) {}
    if (legacy && APPEARANCE_TO_THEME[legacy]) {
      stored = APPEARANCE_TO_THEME[legacy];
      try { localStorage.setItem("pb_theme", stored); } catch (e) {}
    }
  }

  // Legacy theme-ID migration (kept wired for future safety).
  if (stored && LEGACY_THEME_MIGRATION[stored]) {
    stored = LEGACY_THEME_MIGRATION[stored];
    try { localStorage.setItem("pb_theme", stored); } catch (e) {}
  }

  if (!stored || !THEMES[stored]) stored = DEFAULT_THEME_ID;
  applyTheme(stored);
}

/* reconcileThemeFromProfile — runs once currentProfile has been loaded
   from Firestore. If the profile carries a legacy .appearance field (and
   no .theme yet), migrate and write back. If .theme exists, apply. */
function reconcileThemeFromProfile(profile) {
  if (!profile) return;

  var themeId = profile.theme || null;

  // Fall back to appearance-field migration if no theme stored yet.
  if (!themeId && profile.appearance && APPEARANCE_TO_THEME[profile.appearance]) {
    themeId = APPEARANCE_TO_THEME[profile.appearance];
    // Write migration back so the user's Firestore doc gets the new field.
    try {
      if (typeof db !== "undefined" && typeof currentUser !== "undefined" && currentUser) {
        db.collection("members").doc(currentUser.uid).update({ theme: themeId }).catch(function(){});
      }
    } catch (e) {}
  }

  if (!themeId) return;

  // Legacy theme-ID migration (empty map today; wired for future safety).
  if (LEGACY_THEME_MIGRATION[themeId]) {
    themeId = LEGACY_THEME_MIGRATION[themeId];
    try {
      if (typeof db !== "undefined" && typeof currentUser !== "undefined" && currentUser) {
        db.collection("members").doc(currentUser.uid).update({ theme: themeId }).catch(function(){});
      }
    } catch (e) {}
  }

  if (!THEMES[themeId]) return;

  // Only reapply if it differs from what's on the DOM (prevents thrashing).
  if (themeId !== getCurrentTheme()) {
    applyTheme(themeId);
  }
}

/* saveThemeChoice — persist a user-selected theme to DOM, localStorage,
   and Firestore. Returns a Promise that resolves once the Firestore write
   completes (or immediately if no auth / no db). */
function saveThemeChoice(themeId) {
  if (!THEMES[themeId]) return Promise.reject(new Error("Invalid theme: " + themeId));
  applyTheme(themeId);
  if (typeof db !== "undefined" && typeof currentUser !== "undefined" && currentUser) {
    return db.collection("members").doc(currentUser.uid).update({ theme: themeId });
  }
  return Promise.resolve();
}

/* grantThemeUnlock — placeholder for Ship 0d-ii. Theme unlocks will live
   in a members/{uid}.unlockedThemes array (or subcollection) whose schema
   is defined by the unlock-flow work in 0d-ii. For now, log and stub. */
function grantThemeUnlock(userId, themeId) {
  if (!THEMES[themeId]) return Promise.reject(new Error("Invalid theme: " + themeId));
  _logWarn("[Theme] grantThemeUnlock stub: " + userId + " → " + themeId + " (wired in Ship 0d-ii)");
  // TODO(0d-ii): persist unlock once unlock storage schema is defined.
  return Promise.resolve();
}

// ── Expose globals (matches bottomsheet/transitions/haptics/loading pattern) ──
if (typeof window !== "undefined") {
  window.THEMES = THEMES;
  window.DEFAULT_THEME_ID = DEFAULT_THEME_ID;
  window.applyTheme = applyTheme;
  window.getCurrentTheme = getCurrentTheme;
  window.getAvailableThemes = getAvailableThemes;
  window.initTheme = initTheme;
  window.reconcileThemeFromProfile = reconcileThemeFromProfile;
  window.saveThemeChoice = saveThemeChoice;
  window.grantThemeUnlock = grantThemeUnlock;
}

// Run initTheme as early as possible — belt + suspenders with the no-flash
// inline script in index.html. Safe to run multiple times (idempotent).
if (typeof window !== "undefined") initTheme();
