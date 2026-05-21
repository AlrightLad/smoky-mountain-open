// ========== M1 — NATIVE RUNTIME ABSTRACTION ==========
//
// Uniform native-helper interface per CLUBHOUSE_SPEC-4-Wave3-implementation.md
// § 7.4 — each module exposes the SAME signature whether the runtime is
// Capacitor native (iOS via Wave 3 / Android via Launch Phase B) or web
// (current production deploy + M1-M5 emulation workflow).
//
// Screen code in M2-M6 imports from these modules WITHOUT conditional
// branches: the module handles runtime detection internally and falls back
// to web APIs when Capacitor isn't present.
//
// Modules:
//   PB.native.device   — platform / OS / version
//   PB.native.storage  — key-value persistence
//   PB.native.gps      — current position + watch
//   PB.native.camera   — capture photo + pick from gallery
//   PB.native.haptics  — vibrate / impact / notification
//   PB.native.share    — share text / URL / image
//   PB.native.push     — register + receive (architected only — activation Launch Phase B)
//
// Runtime detection:
//   window.Capacitor.isNativePlatform() — true when running inside the iOS app
//   Otherwise: web (browser, PWA, or Capacitor web preview)

(function() {
  if (typeof window === 'undefined') return;

  // Runtime detection — Capacitor exposes window.Capacitor when bundled
  function isNative() {
    try {
      return typeof window.Capacitor !== 'undefined'
        && typeof window.Capacitor.isNativePlatform === 'function'
        && window.Capacitor.isNativePlatform();
    } catch (e) { return false; }
  }

  function getPlatform() {
    try {
      if (typeof window.Capacitor !== 'undefined' && typeof window.Capacitor.getPlatform === 'function') {
        return window.Capacitor.getPlatform();  // 'ios' | 'android' | 'web'
      }
    } catch (e) { /* fall through */ }
    return 'web';
  }

  if (typeof PB === 'undefined') window.PB = {};
  PB.native = PB.native || {};
  PB.native.isNative = isNative;
  PB.native.platform = getPlatform;

  // Initialize sub-modules (each module attaches itself to PB.native.<name>).
  // Modules are loaded as separate <script> tags via vite.config.js CORE_FILES;
  // this file just declares the namespace.

  if (typeof pbLog === 'function') {
    pbLog('[native] runtime=' + getPlatform() + ' isNative=' + isNative());
  }
})();
