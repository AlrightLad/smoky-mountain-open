// PB.native.storage — key-value persistence.
//
// Native: @capacitor/preferences plugin (SQLite-backed, survives app reinstall on iOS only when iCloud backup enabled).
// Web fallback: localStorage.

(function() {
  if (typeof PB === 'undefined' || !PB.native) return;

  function caps() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
  }

  PB.native.storage = {
    set: function(key, value) {
      var serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (PB.native.isNative() && caps()) {
        return caps().set({ key: key, value: serialized });
      }
      try {
        localStorage.setItem(key, serialized);
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    },

    get: function(key) {
      if (PB.native.isNative() && caps()) {
        return caps().get({ key: key }).then(function(r) { return r ? r.value : null; });
      }
      try {
        return Promise.resolve(localStorage.getItem(key));
      } catch (e) {
        return Promise.reject(e);
      }
    },

    remove: function(key) {
      if (PB.native.isNative() && caps()) {
        return caps().remove({ key: key });
      }
      try {
        localStorage.removeItem(key);
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    },

    keys: function() {
      if (PB.native.isNative() && caps()) {
        return caps().keys().then(function(r) { return r.keys || []; });
      }
      try {
        var ks = [];
        for (var i = 0; i < localStorage.length; i++) ks.push(localStorage.key(i));
        return Promise.resolve(ks);
      } catch (e) {
        return Promise.resolve([]);
      }
    }
  };
})();
