// PB.native.push — push notifications (architected, INACTIVE until Launch Phase B).
//
// Per M1 spec: "Push provider architecture installs but activates only Launch
// Phase B." This file defines the interface but doesn't yet REGISTER for push
// (because that requires Apple Developer Account + APNs cert which are
// Founder workstreams gating Launch Phase B).
//
// Native (Launch Phase B): @capacitor/push-notifications.
// Web today: FCM via firebase-messaging-compat (existing — see src/core/firebase.js).

(function() {
  if (typeof PB === 'undefined' || !PB.native) return;

  function caps() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications;
  }

  PB.native.push = {
    // Register for push notifications.
    // Returns: Promise<{ token: string, platform: 'ios' | 'web' }>
    register: function() {
      if (PB.native.isNative() && caps()) {
        // Launch Phase B activation point — currently returns "not yet active"
        if (!PB.native.push._launchPhaseBActive) {
          return Promise.resolve({ token: null, platform: 'ios', status: 'awaiting-launch-phase-b' });
        }
        return caps().requestPermissions().then(function(p) {
          if (p.receive !== 'granted') {
            return { token: null, platform: 'ios', status: 'permission-denied' };
          }
          return caps().register().then(function() {
            return new Promise(function(resolve) {
              caps().addListener('registration', function(t) {
                resolve({ token: t.value, platform: 'ios', status: 'active' });
              });
            });
          });
        });
      }
      // Web fallback: FCM via firebase-messaging-compat already wired in
      // src/core/firebase.js as window.fcmRequestToken (when implemented)
      if (typeof window.fcmRequestToken === 'function') {
        return window.fcmRequestToken().then(function(token) {
          return { token: token, platform: 'web', status: 'active' };
        });
      }
      return Promise.resolve({ token: null, platform: 'web', status: 'fcm-not-wired' });
    },

    // Launch Phase B activation flag — flip this when Apple Developer + APNs ready
    _launchPhaseBActive: false,

    // Listen for incoming push notifications (foreground)
    onMessage: function(callback) {
      if (PB.native.isNative() && caps()) {
        caps().addListener('pushNotificationReceived', callback);
        return;
      }
      // Web: FCM message handling lives in firebase-messaging-compat
      if (typeof window.fcmOnMessage === 'function') {
        window.fcmOnMessage(callback);
      }
    }
  };
})();
