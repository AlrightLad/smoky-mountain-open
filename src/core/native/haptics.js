// PB.native.haptics — touch feedback.
//
// Native: @capacitor/haptics (iOS Taptic Engine via UIImpactFeedbackGenerator).
// Web fallback: navigator.vibrate() (Android Chrome only — iOS Safari has no vibrate).

(function() {
  if (typeof PB === 'undefined' || !PB.native) return;

  function caps() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
  }

  PB.native.haptics = {
    // Tap feedback — buttons, toggles
    tap: function() {
      if (PB.native.isNative() && caps()) {
        return caps().impact({ style: 'LIGHT' }).catch(function() {});
      }
      if (navigator.vibrate) navigator.vibrate(8);
      return Promise.resolve();
    },

    // Stronger impact — important actions (Save, Submit)
    impact: function() {
      if (PB.native.isNative() && caps()) {
        return caps().impact({ style: 'MEDIUM' }).catch(function() {});
      }
      if (navigator.vibrate) navigator.vibrate(15);
      return Promise.resolve();
    },

    // Success — completed action
    success: function() {
      if (PB.native.isNative() && caps()) {
        return caps().notification({ type: 'SUCCESS' }).catch(function() {});
      }
      if (navigator.vibrate) navigator.vibrate([10, 60, 10]);
      return Promise.resolve();
    },

    // Error / warning
    error: function() {
      if (PB.native.isNative() && caps()) {
        return caps().notification({ type: 'ERROR' }).catch(function() {});
      }
      if (navigator.vibrate) navigator.vibrate([20, 40, 20, 40, 20]);
      return Promise.resolve();
    }
  };
})();
