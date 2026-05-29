// Reading Room sidebar + page transitions + connection status. Extracted per W1.A5.

// ========== READING ROOM SIDEBAR (v8.3.0 · Ship 0a) ==========
// Wires desktop sidebar nav clicks, active-state sync, and user footer.
// Sidebar markup lives in index.html. Below 960px viewport the sidebar is
// hidden via CSS; helpers still run (cheap) so state stays correct if the
// viewport widens post-init.
// v8.22.0 (Ship 5+7) — "playnow" removed from sidebar nav per locked HQ-vs-
// Clubhouse architecture (live round logging belongs to mobile Clubhouse).
// Resume banner (line ~2176), home-page CTAs (home.js Bands B/C/D hero
// cards), and the spectator entry path remain — only the persistent sidebar
// link is removed.
var _sidebarRoutes = ["home","rounds","feed","standings","members","shop","trophyroom"];

// BL-008 (2026-05-29): Band A (720-959px) is the ONLY band where #rrSidebar
// behaves as a modal off-canvas drawer. At desktop (>=960px) the same element
// is a persistent visible nav rail; below 720px it is CSS-hidden (bottom-sheet
// nav is used). Dialog semantics (role=dialog + aria-modal + aria-hidden
// gating) must therefore apply ONLY in drawer mode. Applying them at all bands
// (the pre-fix A.8 behavior) left the visible desktop nav aria-hidden="true"
// and mislabeled role="dialog" — i.e. hidden from screen readers (WCAG 4.1.2 /
// 2.4.1 / 1.3.1). _applyDrawerA11y() sets the correct semantics for the
// current band + open state; the matchMedia listener re-applies on band flips.
var _drawerBandMQ = window.matchMedia("(min-width: 720px) and (max-width: 959px)");

function _applyDrawerA11y() {
  var sidebar = document.getElementById("rrSidebar");
  if (!sidebar) return;
  if (_drawerBandMQ.matches) {
    // Drawer mode: modal dialog, hidden from AT unless open.
    sidebar.setAttribute("role", "dialog");
    sidebar.setAttribute("aria-modal", window._drawerOpen ? "true" : "false");
    sidebar.setAttribute("aria-hidden", window._drawerOpen ? "false" : "true");
    sidebar.setAttribute("aria-label", "Navigation drawer");
  } else {
    // Persistent nav rail (desktop) or CSS-hidden (mobile): plain landmark,
    // never hidden from or mislabeled to assistive tech.
    sidebar.removeAttribute("role");
    sidebar.removeAttribute("aria-modal");
    sidebar.removeAttribute("aria-hidden");
    sidebar.setAttribute("aria-label", "Primary navigation");
  }
}

function _wireSidebar() {
  var sidebar = document.getElementById("rrSidebar");
  if (!sidebar || sidebar._pbWired) return;
  sidebar._pbWired = true;
  _bindHQDrawerSwipe();
  // Apply band-aware a11y semantics now + on every band change.
  _applyDrawerA11y();
  _drawerBandMQ.addEventListener("change", function() {
    // Leaving drawer band while open: collapse to persistent-nav semantics.
    if (!_drawerBandMQ.matches && window._drawerOpen) { _closeHQDrawer(); return; }
    _applyDrawerA11y();
  });
  sidebar.addEventListener("click", function(e) {
    var item = e.target.closest(".rr-sidebar__item");
    if (!item) return;
    var route = item.dataset.route;
    if (route) {
      Router.go(route);
      // Auto-close drawer after nav at Band A
      if (window._drawerOpen) _closeHQDrawer();
    }
  });
  sidebar.addEventListener("keydown", function(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var item = e.target.closest(".rr-sidebar__item");
    if (!item) return;
    e.preventDefault();
    var route = item.dataset.route;
    if (route) {
      Router.go(route);
      if (window._drawerOpen) _closeHQDrawer();
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// HQ DRAWER (v8.6.2 · Ship 2) — Band A (720-959px) drawer-mode interaction.
// The same #rrSidebar element becomes an off-canvas drawer at this band via
// CSS transform (see components.css Band A drawer block). This module handles
// open/close state, focus trap, ESC/swipe dismiss, and body scroll lock.
//
// Single drawer state, single source of truth — drawer is shared across all
// HQ pages (home + future Ships 2-7 page migrations). Hamburger buttons in
// any HQ masthead call window._toggleHQDrawer().
// ═══════════════════════════════════════════════════════════════════════════
window._drawerOpen = false;
var _drawerLastFocused = null;
var _drawerFocusables = [];

window._toggleHQDrawer = function() {
  if (window._drawerOpen) _closeHQDrawer();
  else _openHQDrawer();
};

window._openHQDrawer = function() {
  var sidebar = document.getElementById("rrSidebar");
  if (!sidebar) return;
  // Capture trigger so we can restore focus on close (typically the hamburger).
  _drawerLastFocused = document.activeElement;
  window._drawerOpen = true;
  document.body.classList.add("hq-drawer-open");
  _applyDrawerA11y(); // aria-hidden=false + aria-modal=true (drawer band)
  // Build focusable list inside drawer. Skip aria-disabled (Notifications stub).
  _drawerFocusables = Array.prototype.slice.call(
    sidebar.querySelectorAll('a, button:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])')
  );
  if (_drawerFocusables.length > 0) {
    setTimeout(function() { _drawerFocusables[0].focus(); }, 50);
  }
  document.addEventListener("keydown", _drawerKeydown);
};

window._closeHQDrawer = function() {
  var sidebar = document.getElementById("rrSidebar");
  if (!sidebar) return;
  window._drawerOpen = false;
  document.body.classList.remove("hq-drawer-open");
  _applyDrawerA11y(); // closed-drawer (or desktop persistent-nav) semantics
  document.removeEventListener("keydown", _drawerKeydown);
  // Restore focus to the element that opened the drawer (typically hamburger).
  if (_drawerLastFocused && typeof _drawerLastFocused.focus === "function") {
    _drawerLastFocused.focus();
  }
};

function _drawerKeydown(e) {
  if (e.key === "Escape") {
    _closeHQDrawer();
    return;
  }
  if (e.key !== "Tab" || _drawerFocusables.length === 0) return;
  var first = _drawerFocusables[0];
  var last = _drawerFocusables[_drawerFocusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// Swipe-left to dismiss (touch only). Bound once via guard flag.
function _bindHQDrawerSwipe() {
  var sidebar = document.getElementById("rrSidebar");
  if (!sidebar || sidebar._pbSwipeBound) return;
  sidebar._pbSwipeBound = true;
  var startX = 0;
  sidebar.addEventListener("touchstart", function(e) {
    if (!window._drawerOpen) return;
    startX = e.touches[0].clientX;
  }, { passive: true });
  sidebar.addEventListener("touchend", function(e) {
    if (!window._drawerOpen) return;
    var deltaX = e.changedTouches[0].clientX - startX;
    if (deltaX < -50) _closeHQDrawer();  // swipe left ≥50px dismisses
  }, { passive: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST PRIMITIVE (v8.7.0 — Ship 3a · spec v9.0.2 §1.9)
// Public API: PB.toast({type, eyebrow, message, action, duration})
//   type:     'info' | 'success' | 'action' | 'error'  (default: 'info')
//   duration: ms; default 4000 info/success, 8000 action, persistent (0) error
//   action:   {label, handler}  — optional inline button
// Returns: numeric id; pass to PB.toastDismiss(id) for early dismiss.
//
// NOTE: Router.toast(msg) (line ~80) is the legacy mobile primitive — single
// element, single message, fixed timing. Coexists with PB.toast for now;
// migration deferred to Ship 11+ when auth surface refactors.
// ═══════════════════════════════════════════════════════════════════════════
var _pbToastStack = null;
var _pbToastSeq = 0;
var _pbToasts = [];

function _pbToastInit() {
  if (_pbToastStack) return;
  _pbToastStack = document.createElement("div");
  _pbToastStack.id = "pb-toast-stack";
  _pbToastStack.setAttribute("aria-live", "polite");
  _pbToastStack.setAttribute("role", "status");
  document.body.appendChild(_pbToastStack);
}

function _pbToastDismiss(id) {
  var t = _pbToasts.find(function(x) { return x.id === id; });
  if (!t) return;
  t.el.classList.remove("pb-toast--enter");
  t.el.classList.add("pb-toast--exit");
  setTimeout(function() {
    if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
    _pbToasts = _pbToasts.filter(function(x) { return x.id !== id; });
  }, 200);
}

PB.toast = function(opts) {
  _pbToastInit();
  opts = opts || {};
  var type = opts.type || "info";
  var duration = opts.duration;
  if (duration === undefined) {
    duration = type === "error" ? 0 : type === "action" ? 8000 : 4000;
  }

  var id = ++_pbToastSeq;
  var el = document.createElement("div");
  el.className = "pb-toast pb-toast--" + type;
  el.setAttribute("role", "alert");

  var html = "";
  if (opts.eyebrow) {
    html += '<div class="pb-toast__eyebrow">' + escHtml(opts.eyebrow) + "</div>";
  }
  if (opts.message) {
    html += '<div class="pb-toast__message">' + escHtml(opts.message);
    if (opts.action && typeof opts.action === "object") {
      html += '<button class="pb-toast__action" data-toast-action="' + id + '">' +
              escHtml(opts.action.label || "Undo") + "</button>";
    }
    html += "</div>";
  }
  el.innerHTML = html;

  // Stack overflow handling — max 3 visible
  while (_pbToasts.length >= 3) {
    _pbToastDismiss(_pbToasts[0].id);
  }

  _pbToastStack.appendChild(el);
  _pbToasts.push({ id: id, el: el, opts: opts });

  if (opts.action && typeof opts.action === "object" && typeof opts.action.handler === "function") {
    el.querySelector("[data-toast-action]").addEventListener("click", function() {
      try { opts.action.handler(); } catch (e) {}
      _pbToastDismiss(id);
    });
  }

  // Trigger enter animation on next frame so transition fires from initial state
  requestAnimationFrame(function() { el.classList.add("pb-toast--enter"); });

  if (duration > 0) {
    setTimeout(function() { _pbToastDismiss(id); }, duration);
  }
  return id;
};

PB.toastDismiss = _pbToastDismiss;

// ═══════════════════════════════════════════════════════════════════════════
// BANNER PRIMITIVE (v8.7.0 — Ship 3a · spec v9.0.2 §1.10)
// Public API: PB.banner({id, type, eyebrow, message, button})
//   id:      stable identifier; subsequent calls with same id are no-ops (dedupe)
//   type:    'info' | 'success' | 'error'  (default: 'info')
//   button:  {label, handler}  — optional right-side action
// Returns: id; pass to PB.bannerDismiss(id) when underlying condition resolves.
//
// Coexists with the inline _renderEmailVerifyBanner in home.js — that block is
// home-page-only and renders inside the page DOM. PB.banner is system-wide,
// rendered above the masthead, persistent across pages.
// ═══════════════════════════════════════════════════════════════════════════
var _pbBannerStack = null;
var _pbBanners = {};

function _pbBannerInit() {
  if (_pbBannerStack) return;
  _pbBannerStack = document.getElementById("pb-banner-stack");
  if (_pbBannerStack) return;
  _pbBannerStack = document.createElement("div");
  _pbBannerStack.id = "pb-banner-stack";
  // Insert at top of body — above authScreen, mainApp, everything. System-level
  // banners (maintenance) should appear pre-auth as well as post-auth.
  document.body.insertBefore(_pbBannerStack, document.body.firstChild);
}

PB.banner = function(opts) {
  _pbBannerInit();
  opts = opts || {};
  if (!opts.id) opts.id = "banner-" + Date.now();
  if (_pbBanners[opts.id]) return opts.id;  // already shown — dedupe

  var type = opts.type || "info";
  var el = document.createElement("div");
  el.className = "pb-banner pb-banner--" + type;
  el.setAttribute("data-banner-id", opts.id);
  el.setAttribute("role", "status");

  var html = '<div class="pb-banner__content">';
  if (opts.eyebrow) {
    html += '<div class="pb-banner__eyebrow">' + escHtml(opts.eyebrow) + "</div>";
  }
  if (opts.message) {
    html += '<div class="pb-banner__message">' + escHtml(opts.message) + "</div>";
  }
  html += "</div>";
  if (opts.button && typeof opts.button === "object") {
    html += '<button class="pb-banner__action" data-banner-action="' + opts.id + '">' +
            escHtml(opts.button.label || "Action") + "</button>";
  }
  el.innerHTML = html;

  if (opts.button && typeof opts.button === "object" && typeof opts.button.handler === "function") {
    el.querySelector("[data-banner-action]").addEventListener("click", function() {
      try { opts.button.handler(); } catch (e) {}
    });
  }

  _pbBannerStack.appendChild(el);
  _pbBanners[opts.id] = el;
  return opts.id;
};

PB.bannerDismiss = function(id) {
  var el = _pbBanners[id];
  if (!el) return;
  if (el.parentNode) el.parentNode.removeChild(el);
  delete _pbBanners[id];
};

function _updateSidebarActive(page) {
  var sidebar = document.getElementById("rrSidebar");
  if (!sidebar) return;
  // Only highlight if the current page is one the sidebar actually lists.
  // Non-sidebar pages (e.g., settings, courses) leave every item inactive.
  var match = _sidebarRoutes.indexOf(page) !== -1 ? page : null;
  sidebar.querySelectorAll(".rr-sidebar__item").forEach(function(item) {
    item.classList.toggle("rr-sidebar__item--active", item.dataset.route === match);
  });
}

function _sidebarInitials(p) {
  if (!p) return "P";
  var name = p.name || p.username || "Parbaugh";
  var parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function refreshSidebarUser() {
  var avatarEl = document.getElementById("rrSidebarAvatar");
  var nameEl = document.getElementById("rrSidebarName");
  var metaEl = document.getElementById("rrSidebarMeta");
  if (!avatarEl || !nameEl || !metaEl) return;
  var p = (typeof currentProfile !== "undefined") ? currentProfile : null;
  var display = p ? (PB.getDisplayName ? PB.getDisplayName(p) : (p.name || p.username || "Parbaugh")) : "Parbaugh";
  var username = p ? (p.username || "member") : "member";
  var level = 1;
  try {
    if (p && typeof currentUser !== "undefined" && currentUser
        && typeof PB !== "undefined" && PB.getPlayerXPForDisplay && PB.calcLevelFromXP) {
      var xp = PB.getPlayerXPForDisplay(currentUser.uid);
      var lvl = PB.calcLevelFromXP(xp);
      if (lvl && lvl.level) level = lvl.level;
    }
  } catch(e) { /* fall through to level 1 */ }
  avatarEl.textContent = _sidebarInitials(p);
  nameEl.textContent = display;
  metaEl.textContent = "@" + username + " · LVL " + level;
}

// Hook into Router.go to show/hide the banner on non-playnow pages
var _origRouterGo = Router.go;
Router.go = function(page, params) {
  // v8.13.7 Gate 6 — Detach Spectator HUD listener when leaving /round
  // dispatch. Idempotent; safe if state is null. Runs BEFORE _origRouterGo
  // so Router.getPage() still reports the prior page during the check.
  var fromPage = (typeof Router.getPage === "function") ? Router.getPage() : null;
  if (fromPage === "round" && page !== "round") {
    if (typeof PB !== "undefined" && PB.spectator && typeof PB.spectator.detachListener === "function") {
      PB.spectator.detachListener();
    }
  }
  // Always close notification panel when navigating
  closeNotifPanel();
  _origRouterGo(page, params);
  // Always reconcile the RIP banner. renderRipBanner is self-healing
  // (removes existing, re-adds only if liveState.active). On the playnow
  // page the banner is redundant — the page itself shows round state.
  if (page === "playnow") {
    var existing = document.getElementById("ripBanner");
    if (existing) existing.remove();
  } else {
    setTimeout(renderRipBanner, 50);
  }
  // Auto-animate any data-count elements on the new page
  setTimeout(initCountAnimations, 80);
  // Sync sidebar active state + lazily wire click handler on first nav
  _wireSidebar();
  _updateSidebarActive(page);
};

// ========== PAGE TRANSITIONS (v8.3.2 · Ship 0b-ii) ==========
// Outer wrap: orchestrates the three-tier transition (Cut / Lift / Masthead).
// Defers to the v8.3.0 wrap above (which handles RIP banner, sidebar, counts).
// getTransitionTier, applyTransition, _clearTransition come from transitions.js,
// loaded before router.js in CORE_FILES so the references are live at wrap time.
var _transitionInner = Router.go;   // the v8.3.0 wrap
var _hasNavigated = false;

Router.go = function(page, params) {
  var from = _hasNavigated ? Router.getPage() : null;
  _hasNavigated = true;
  var back = !!(params && params.__back === true);

  var tier = (typeof getTransitionTier === "function")
    ? getTransitionTier(from, page)
    : "cut";

  // Reduced motion forces Cut regardless of tier.
  if (typeof prefersReducedMotion === "function" && prefersReducedMotion()) {
    tier = "cut";
  }

  var fromEl = from ? document.querySelector('#mainApp [data-page="' + from + '"]') : null;
  var toEl = document.querySelector('#mainApp [data-page="' + page + '"]');

  if (tier === "cut") {
    if (fromEl) _clearTransition(fromEl);
    if (toEl) _clearTransition(toEl);
    _transitionInner(page, params);
    return;
  }

  if (tier === "lift") {
    // Exit on outgoing page, then swap + enter on incoming.
    if (fromEl && fromEl !== toEl) applyTransition(fromEl, "lift", "out", back);
    setTimeout(function() {
      _transitionInner(page, params);
      if (toEl) applyTransition(toEl, "lift", "in", back);
      // Strip attrs after anim completes so future navigations start fresh.
      setTimeout(function() {
        if (fromEl) _clearTransition(fromEl);
        if (toEl) _clearTransition(toEl);
      }, 400);
    }, 200);
    return;
  }

  if (tier === "masthead") {
    // Entrance only — skip exit. Swap synchronously, then apply enter attrs
    // in the same tick so the browser paints the initial "from" state of
    // the fill-mode:both animation on the first frame of the new page.
    _transitionInner(page, params);
    if (toEl) applyTransition(toEl, "masthead", "in", back);
    setTimeout(function() {
      if (toEl) _clearTransition(toEl);
    }, 820); // 120ms delay + 640ms sweep + margin
    return;
  }
};


// ========== CONNECTION STATUS BAR ==========
var connStatus = "live";


function initConnStatus() {
  if (!db) return;
  
  // Only use browser online/offline events as a supplement, not the primary signal
  // Firestore initSync already confirmed connectivity — don't override it
  window.addEventListener("offline", function() { setSyncStatus("offline"); });
  window.addEventListener("online", function() { 
    // Re-verify with Firestore before claiming online
    db.collection("config").doc("app").get().then(function() {
      setSyncStatus("online");
    }).catch(function() { setSyncStatus("offline"); });
  });
  
  // Don't set initial state here — initSync already handled it
}


