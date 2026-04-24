/* ═══════════════════════════════════════════════════════════════════════════
   HAPTIC BRIDGE (v8.3.3 · Ship 0b-iii)
   Platform-aware haptic feedback for three moments only:
     - Score entry on the scorecard → light impact
     - Round finish (saved + committed)       → success notification
     - Unlock moment (earned achievement)      → medium + 80ms delay + medium
   No other haptics — design principle: spend only where the moment is real.

   iOS + Android (via Capacitor Haptics plugin) = native pulse.
   Web (any desktop browser) = silent no-op.

   Capacitor is not installed in package.json today; this module detects
   window.Capacitor at runtime and stays silent until a native build wires
   @capacitor/haptics. When that ships, these helpers auto-activate — no
   code change required on this side.
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  var _haptics = null;
  var _isNative = false;

  function _detect() {
    try {
      var cap = (typeof window !== "undefined") ? window.Capacitor : null;
      if (!cap) return;
      var isNativeFn = cap.isNativePlatform;
      if (typeof isNativeFn !== "function" || !isNativeFn.call(cap)) return;
      _isNative = true;
      // Capacitor surface the plugin at Capacitor.Plugins.Haptics.
      var plugins = cap.Plugins || {};
      if (plugins.Haptics) _haptics = plugins.Haptics;
    } catch (e) { /* silent — bridge stays in no-op mode */ }
  }

  _detect();
  // Re-detect shortly after load in case Capacitor injects late.
  if (typeof window !== "undefined") {
    window.addEventListener("load", function() { if (!_haptics) _detect(); });
  }

  function _impact(style) {
    if (!_isNative || !_haptics || typeof _haptics.impact !== "function") return;
    try { _haptics.impact({ style: style }); } catch (e) { /* silent */ }
  }

  function _notification(type) {
    if (!_isNative || !_haptics || typeof _haptics.notification !== "function") return;
    try { _haptics.notification({ type: type }); } catch (e) { /* silent */ }
  }

  // Light tap — fires on score stepper taps during a round.
  window.hapticLight = function() { _impact("LIGHT"); };

  // Success — fires once when a round is committed to the data layer.
  window.hapticSuccess = function() { _notification("SUCCESS"); };

  // Unlock pattern — medium pulse, 80ms, medium pulse. Achievement moments.
  window.hapticUnlock = function() {
    _impact("MEDIUM");
    setTimeout(function() { _impact("MEDIUM"); }, 80);
  };
})();
