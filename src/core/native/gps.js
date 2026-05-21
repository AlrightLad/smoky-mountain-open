// PB.native.gps — geolocation.
//
// Native: @capacitor/geolocation (high-accuracy, background-permission aware).
// Web fallback: navigator.geolocation.

(function() {
  if (typeof PB === 'undefined' || !PB.native) return;

  function caps() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation;
  }

  PB.native.gps = {
    // Returns { latitude, longitude, accuracy, timestamp }
    current: function(opts) {
      opts = opts || {};
      if (PB.native.isNative() && caps()) {
        return caps().getCurrentPosition({
          enableHighAccuracy: opts.highAccuracy !== false,
          timeout: opts.timeout || 10000
        }).then(function(p) {
          return {
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
            accuracy: p.coords.accuracy,
            timestamp: p.timestamp
          };
        });
      }
      // Web fallback
      if (!navigator.geolocation) {
        return Promise.reject(new Error('Geolocation not supported'));
      }
      return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(
          function(p) {
            resolve({
              latitude: p.coords.latitude,
              longitude: p.coords.longitude,
              accuracy: p.coords.accuracy,
              timestamp: p.timestamp
            });
          },
          function(err) { reject(err); },
          {
            enableHighAccuracy: opts.highAccuracy !== false,
            timeout: opts.timeout || 10000,
            maximumAge: opts.maxAge || 60000
          }
        );
      });
    },

    // Cleanup: stop any watchers (no-op in M1 — watch added in M3 Play tab)
    stop: function() { /* no-op */ }
  };
})();
