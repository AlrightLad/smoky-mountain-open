/* ═══════════════════════════════════════════════════════════════════════════
   THEME SYSTEM (v8.3.5 · Ship 0d-i · Part B foundation)

   Six editorial themes replace the prior light/dark appearance axis. Each
   theme ships a complete palette — there's no second axis to compose.

     Default  · clubhouse         — quiet confidence, tournament-program
     Default  · twilight_links    — dusk over coastal course, cool-leaning
     Default  · linen_draft       — "Bluebird": crisp white + navy ink + tour-blue (id kept)
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
  linen_draft:     { id: "linen_draft",     name: "Bluebird",        availability: "default", order: 3 },
  azalea:          { id: "azalea",          name: "Azalea",          availability: "default", order: 4 },  // v8.25.64 — a theme for the ladies (Augusta's azaleas; refined rose + aubergine)
  // v8.25.9 — all unlockables show in the picker as locked teasers (Founder wants
  // the full set visible). hidden_until_unlocked dropped so Champion Sunday +
  // Course Record join Bourbon Room as visible-but-locked.
  champion_sunday: { id: "champion_sunday", name: "Champion Sunday", availability: "unlock",  order: 5, hidden_until_unlocked: false, preview_progress: true },
  bourbon_room:    { id: "bourbon_room",    name: "Bourbon Room",    availability: "unlock",  order: 6, hidden_until_unlocked: false, preview_progress: true },
  course_record:   { id: "course_record",   name: "Course Record",   availability: "unlock",  order: 7, hidden_until_unlocked: false, preview_progress: true },
  // v8.25.238 — the LEVEL-100 reward (Founder asked repeatedly). The loud
  // rubber-hose palette; the rarest unlock, gated on the lvl100 "G.O.A.T." achievement.
  rubber_hose:     { id: "rubber_hose",     name: "Rubber Hose",     availability: "unlock",  order: 8, hidden_until_unlocked: false, preview_progress: true }
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
  var html = document.documentElement;
  // v8.24.12 — Sunlight coexistence: while Sunlight mode holds data-theme
  // ("sunlight" is a contrast overlay, not a palette), the chosen palette is
  // stashed in data-palette-theme (settings.js toggleSunlightMode). Writing
  // data-theme here would silently kill Sunlight while pb_sunlight=1 persists;
  // park the palette instead — it applies the moment Sunlight switches off.
  if (html.getAttribute("data-theme") === "sunlight") {
    html.setAttribute("data-palette-theme", themeId);
  } else {
    html.setAttribute("data-theme", themeId);
  }
  try { localStorage.setItem("pb_theme", themeId); } catch (e) { /* quota or private mode */ }
  syncThemeLogos();
}

function getCurrentTheme() {
  // Palette attr wins while Sunlight mode is borrowing data-theme.
  var palette = document.documentElement.getAttribute("data-palette-theme");
  if (palette && THEMES[palette]) return palette;
  var attr = document.documentElement.getAttribute("data-theme");
  return (attr && THEMES[attr]) ? attr : DEFAULT_THEME_ID;
}

/* pbThemeLogoUrl — the per-theme P+rose brandmark (Founder-approved IMG_4603,
   recolored per theme by .claude/state/_logotheme.mjs → public/img/logo/themes/app/).
   In-app surfaces (sidebar mark, auth coaster) call this so the logo's colorway
   tracks the active palette. Base-aware (GitHub Pages subpath vs Firebase root). */
function pbThemeLogoUrl(themeId) {
  themeId = themeId || getCurrentTheme();
  if (!THEMES[themeId]) themeId = DEFAULT_THEME_ID;
  var base = (typeof window !== "undefined" && window.__PB_BASE__) ? window.__PB_BASE__ : "/";
  return base + "img/logo/themes/app/" + themeId + ".png";
}

/* syncThemeLogos — point every [data-pb-logo] element at the current theme's
   logo. Called from applyTheme so a theme switch recolors the brandmark live. */
function syncThemeLogos() {
  if (typeof document === "undefined") return;
  try {
    var url = pbThemeLogoUrl();
    var els = document.querySelectorAll("[data-pb-logo]");
    for (var i = 0; i < els.length; i++) {
      if (els[i].getAttribute("src") !== url) els[i].setAttribute("src", url);
    }
  } catch (e) { /* pre-DOM or detached — applyTheme re-runs and reconciles */ }
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
  // PL7b — never APPLY a locked unlock-tier theme. The picker already hides locked
  // picks; this guards a direct API call (defense-in-depth against malicious
  // "unlock"). Unlock status is DERIVED from achievements (isThemeUnlocked), never
  // from a client-writable flag — so a member can't self-grant by editing their doc.
  if (THEMES[themeId].availability === "unlock" && !isThemeUnlocked(themeId)) {
    _logWarn("[Theme] Blocked apply of locked theme: " + themeId);
    return Promise.reject(new Error("Theme locked: " + themeId));
  }
  applyTheme(themeId);
  if (typeof db !== "undefined" && typeof currentUser !== "undefined" && currentUser) {
    return db.collection("members").doc(currentUser.uid).update({ theme: themeId });
  }
  return Promise.resolve();
}

/* ───────────────────────────────────────────────────────────────────────────
   ACTIVITY-LOCKED THEME UNLOCKS (PL7b, v8.25.x)

   The three unlock-tier themes were never wired — grantThemeUnlock was a stub, so
   they stayed locked forever even after a member earned them (the Founder: "won an
   event but Champion Sunday is still locked"). They now unlock the moment the
   qualifying activity is recorded, AUTO + with a notification, and are EXPLOIT-PROOF.

   How: each unlock-tier theme is gated on a real ACHIEVEMENT id (PB.getAchievements,
   the Trophy-Room engine — derived from rounds/standings/trip data). Deriving the
   unlock from achievements rather than a client-writable flag is the anti-exploit
   guarantee: the picker (settings.js) and the apply-guard (saveThemeChoice) both
   read the DERIVED truth, so a member can't self-grant by writing a field. champion
   comes from the commissioner-set trip champion (not self-declarable); the score /
   tenure gates ride the app's existing self-reported-rounds trust model
   (cosmetic-only, no economy impact).
   ─────────────────────────────────────────────────────────────────────────── */
var THEME_UNLOCK_ACHIEVEMENT = {
  champion_sunday: "champion",  // win an event / season (worn after a win)
  course_record:   "sub80",     // card a sub-80 (18) — rarest, scoring-based ledger
  bourbon_room:    "veteran",   // 50 rounds logged — tenure / time put in
  rubber_hose:     "lvl100"     // reach Level 100 (G.O.A.T.) — the loud reward theme
};

// The achievement ids the signed-in member currently holds (live, derived).
// Returns null if not computable yet (no auth / data not loaded) — callers treat
// null as "unknown, try later" and never as "nothing earned" (so a cold-load
// never falsely shows a theme as locked-then-unlocked).
function _memberAchievementIds() {
  try {
    var uid = (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : null;
    if (!uid || typeof PB === "undefined" || !PB.getAchievements) return null;
    return (PB.getAchievements(uid) || []).map(function (a) { return a && a.id; });
  } catch (e) { return null; }
}

// Derived set of unlock-tier theme ids this member has EARNED. Pass achievement
// ids to reuse a computed list, or omit to read live. Returns null (NOT []) when
// achievements aren't computable yet (no auth / data still loading) so callers can
// distinguish "earned nothing" (authoritative []) from "don't know yet" (null →
// fall back to the cache placeholder). This prevents a stale/forged unlockedThemes
// cache from ever overriding a real, computed "you've earned nothing".
function getUnlockedThemeIds(achievementIds) {
  var ids = achievementIds || _memberAchievementIds();
  if (!ids) return null;
  var unlocked = [];
  Object.keys(THEME_UNLOCK_ACHIEVEMENT).forEach(function (themeId) {
    if (ids.indexOf(THEME_UNLOCK_ACHIEVEMENT[themeId]) !== -1) unlocked.push(themeId);
  });
  return unlocked;
}

// Is a single theme available to this member? Default themes always; unlock-tier
// only when its achievement is held (derived). Unknown-yet derives as locked.
function isThemeUnlocked(themeId, achievementIds) {
  if (!THEMES[themeId]) return false;
  if (THEMES[themeId].availability === "default") return true;
  return (getUnlockedThemeIds(achievementIds) || []).indexOf(themeId) !== -1;
}

/* reconcileThemeUnlocks — the AUTO-UNLOCK + NOTIFY pass. Detects unlock-tier
   themes that are newly EARNED (derived) vs already-announced
   (members/{uid}.themesNotified) and, for each new one, fires a toast +
   confetti + a notification-panel entry, then records it so it never re-fires.
   Idempotent + safe to call repeatedly. ADDS only, never revokes — so a transient
   pre-data-load state just delays the announce. Tampering with themesNotified only
   suppresses the toast; it never grants a theme (access is derived). */
function reconcileThemeUnlocks() {
  try {
    if (typeof currentUser === "undefined" || !currentUser) return;
    if (typeof currentProfile === "undefined" || !currentProfile) return;
    var achIds = _memberAchievementIds();
    if (!achIds) return; // not computable yet — a later scheduled pass will catch it
    var earned = getUnlockedThemeIds(achIds);
    if (!earned.length) return;
    var notified = Array.isArray(currentProfile.themesNotified) ? currentProfile.themesNotified.slice() : [];
    var fresh = earned.filter(function (id) { return notified.indexOf(id) === -1; });
    if (!fresh.length) return;

    var merged = notified.concat(fresh);
    currentProfile.themesNotified = merged;
    // unlockedThemes is kept as a cache (back-compat + offline read); the picker's
    // authority is still the derived set, so this write grants nothing on its own.
    var cache = Array.isArray(currentProfile.unlockedThemes) ? currentProfile.unlockedThemes.slice() : [];
    earned.forEach(function (id) { if (cache.indexOf(id) === -1) cache.push(id); });
    currentProfile.unlockedThemes = cache;
    try {
      if (typeof db !== "undefined") {
        db.collection("members").doc(currentUser.uid).set({ themesNotified: merged, unlockedThemes: cache }, { merge: true }).catch(function () {});
      }
    } catch (e) {}

    fresh.forEach(function (id, i) {
      var name = (THEMES[id] && THEMES[id].name) || id;
      setTimeout(function () {
        try { if (typeof Router !== "undefined" && Router.toast) Router.toast("New theme unlocked: " + name + " — Settings → Display"); } catch (e) {}
        try { if (typeof window !== "undefined" && window.pbCelebrate) window.pbCelebrate({ key: "theme_unlock_" + id, once: true }); } catch (e) {}
        // Persistent notification-panel entry (self-write: fromUserId==self per rules).
        try {
          if (typeof db !== "undefined" && typeof fsTimestamp === "function") {
            db.collection("notifications").add({
              toUserId: currentUser.uid, fromUserId: currentUser.uid, type: "theme_unlock",
              title: "New theme unlocked", dest: "settings",
              message: "You unlocked the " + name + " theme — wear it in Settings → Display.",
              read: false, createdAt: fsTimestamp()
            }).catch(function () {});
          }
        } catch (e) {}
      }, 700 + i * 1700);
    });
  } catch (e) { _logWarn("[Theme] reconcileThemeUnlocks: " + (e && e.message)); }
}

/* scheduleThemeUnlockCheck — run the reconcile a few times after app entry, since
   the achievement engine needs rounds/trips/standings loaded (which arrives async
   after sign-in). Idempotent + announce-once, so the repeats are harmless and just
   guarantee the check fires once everything (incl. trip-champion data) has landed. */
function scheduleThemeUnlockCheck() {
  [3500, 9000, 18000].forEach(function (ms) {
    setTimeout(function () { reconcileThemeUnlocks(); }, ms);
  });
}

/* grantThemeUnlock — retained for any future explicit-grant flow; writes the
   unlockedThemes cache. Access remains DERIVED from achievements, so this is a
   convenience cache, not an authority. */
function grantThemeUnlock(userId, themeId) {
  if (!THEMES[themeId]) return Promise.reject(new Error("Invalid theme: " + themeId));
  if (typeof db === "undefined" || !userId) return Promise.resolve();
  try {
    return db.collection("members").doc(userId).set(
      { unlockedThemes: firebase.firestore.FieldValue.arrayUnion(themeId) }, { merge: true }
    );
  } catch (e) { return Promise.resolve(); }
}

// ── Expose globals (matches bottomsheet/transitions/haptics/loading pattern) ──
if (typeof window !== "undefined") {
  window.THEMES = THEMES;
  window.DEFAULT_THEME_ID = DEFAULT_THEME_ID;
  window.applyTheme = applyTheme;
  window.getCurrentTheme = getCurrentTheme;
  window.pbThemeLogoUrl = pbThemeLogoUrl;
  window.syncThemeLogos = syncThemeLogos;
  window.getAvailableThemes = getAvailableThemes;
  window.initTheme = initTheme;
  window.reconcileThemeFromProfile = reconcileThemeFromProfile;
  window.saveThemeChoice = saveThemeChoice;
  window.grantThemeUnlock = grantThemeUnlock;
  // PL7b — activity-locked theme unlocks (derived, auto-notify, exploit-proof).
  window.THEME_UNLOCK_ACHIEVEMENT = THEME_UNLOCK_ACHIEVEMENT;
  window.getUnlockedThemeIds = getUnlockedThemeIds;
  window.isThemeUnlocked = isThemeUnlocked;
  window.reconcileThemeUnlocks = reconcileThemeUnlocks;
  window.scheduleThemeUnlockCheck = scheduleThemeUnlockCheck;
}

// Run initTheme as early as possible — belt + suspenders with the no-flash
// inline script in index.html. Safe to run multiple times (idempotent).
if (typeof window !== "undefined") initTheme();
