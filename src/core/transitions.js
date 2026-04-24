/* ═══════════════════════════════════════════════════════════════════════════
   PAGE TRANSITIONS — three-tier system (v8.3.2 · Ship 0b-ii)
   Tiers:
     cut      — default, 0ms, no animation (same-route re-nav, hole-to-hole)
     lift     — 200ms, 6px Y translate + fade; back-nav inverts Y
     masthead — 320ms content fade (120ms delayed) + 640ms brass hairline
                sweep. Entrance-only — no exit animation per design intent
                ("Masthead is about the ENTRANCE being the moment").

   Works with router.js: router sets attributes on [data-page] elements at
   the right moments, CSS drives the animation. This module is loaded BEFORE
   router.js in CORE_FILES so the wrap in router.js can reference these
   functions directly.
   ═══════════════════════════════════════════════════════════════════════════ */

// Masthead edges — trimmed to actual routes. "splash" is the pseudo-route
// for the first Router.go after auth (from=null). "any" matches any from.
var MASTHEAD_EDGES = {
  "splash→home": true,
  "onboarding→home": true,
  "any→playnow": true,
  "playnow→rounds": true
};

function getTransitionTier(from, to) {
  // Same-route re-navigation (including scorecard hole-to-hole via
  // Router.go("playnow") with no params) is always Cut per design.
  if (from != null && to != null && from === to) return "cut";

  // First Router.go after auth: from=null → treat as "splash".
  var fromKey = from == null ? "splash" : from;
  if (MASTHEAD_EDGES[fromKey + "→" + to]) return "masthead";
  if (MASTHEAD_EDGES["any→" + to]) return "masthead";

  // Default for every other route change.
  return "lift";
}

function applyTransition(el, tier, direction, isBack) {
  if (!el) return;
  if (tier === "cut") { _clearTransition(el); return; }
  el.setAttribute("data-transition", tier);
  el.setAttribute("data-direction", direction);
  if (isBack) el.setAttribute("data-nav", "back");
  else el.removeAttribute("data-nav");
}

function _clearTransition(el) {
  if (!el) return;
  el.removeAttribute("data-transition");
  el.removeAttribute("data-direction");
  el.removeAttribute("data-nav");
}

// Expose globals so router.js wrap can reference without import plumbing.
if (typeof window !== "undefined") {
  window.getTransitionTier = getTransitionTier;
  window.applyTransition = applyTransition;
  window._clearTransition = _clearTransition;
  window.PB_MASTHEAD_EDGES = MASTHEAD_EDGES;
}
