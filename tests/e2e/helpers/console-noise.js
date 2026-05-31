// Spec-level console-noise filter for E2E flows.
//
// The core console-error catcher lives in the Founder-gated assertions.js
// (setupConsoleErrorCatcher) and is intentionally strict: it records every
// console.error / pageerror so real app bugs (e.g. a render-time
// ReferenceError) fail the test. This module is the *local* counterpart the
// 07-mobile-viewport.spec.js comment calls for: it drops specifically
// enumerated, observed, third-party / emulator-only messages that are NOT app
// bugs, so they can't flake the strict zero-error assertions. Each pattern
// must point at an explained non-bug and be keyed narrowly enough that it can
// never mask a real error.
//
// Why here and not in assertions.js IGNORE_PATTERNS: the gated global list is
// for universal app-level suppression and changing it needs a Founder
// handshake. Environment / third-party network noise is the wrong scope for
// that list, so it is filtered locally while every other error still asserts.

// Firebase Auth *emulator* serves its widget from http://127.0.0.1:9099. The
// app CSP sets no frame-src, so framing falls back to default-src, which
// (correctly, for production) omits loopback. Chromium logs "Framing '...'
// violates ... Content Security Policy"; WebKit logs "Refused to load ...
// because it appears in neither the frame-src ... directive". Same emulator-
// only artifact: in production the SDK frames the real auth domain, not
// loopback, and custom-token login (loginAs) succeeds regardless.
const EMULATOR_FRAME_NOISE =
  /(?:Framing '|Refused to load )https?:\/\/(?:127\.0\.0\.1|localhost):9099[\s\S]*Content Security Policy/i;

// gapi (pulled in by Firebase Auth) fires a connectivity beacon to Google's
// 1x1 tracking pixel www.google.com/images/cleardot.gif during init. Our CSP
// connect-src deliberately omits www.google.com, so the tracker stays blocked
// (the CSP working as designed) and never signals a PARBAUGHS bug. The block is
// pure third-party telemetry and fires non-deterministically inside the render
// window (intermittent flake: pixel-7 testuser_09 then iphone-14 testZach,
// 01-all-users-baseline, 2026-05-31). Each engine words it differently:
//   Chromium: "Connecting to 'https://...cleardot.gif' violates ... Content Security Policy"
//   WebKit:   "Refused to connect to https://...cleardot.gif because it does not
//              appear in the connect-src directive ..." plus ".../cleardot.gif due
//              to access control checks." (two separate console entries)
// Keyed on the exact cleardot.gif resource name — a Google tracker with no
// legitimate app use — so it can only ever match this one beacon, in any
// engine's phrasing, and never a real app resource.
const GOOGLE_TELEMETRY_NOISE = /cleardot\.gif/i;

const KNOWN_NOISE = [EMULATOR_FRAME_NOISE, GOOGLE_TELEMETRY_NOISE];

// WebKit also emits URL-less companion lines alongside a CSP-blocked resource:
// "Blocked by Content Security Policy." and "Failed to load resource: Blocked by
// Content Security Policy." They carry no URL, so on their own they're ambiguous
// between our known beacons and a hypothetical real violation. We drop them ONLY
// when a known non-app beacon (emulator frame or cleardot) is present in the same
// batch, i.e. they're orphaned echoes of noise we already classified. A real app
// CSP violation always emits its own URL-bearing line (which is neither beacon),
// so it survives this filter and still fails the test.
const CSP_GENERIC_COMPANION =
  /^\s*(?:Blocked by Content Security Policy\.|Failed to load resource: Blocked by Content Security Policy\.)\s*$/i;

// Wrap a setupConsoleErrorCatcher getter, dropping only the enumerated noise
// above while preserving every other console error for the assertion.
function appErrors(getErrors) {
  const all = getErrors();
  const hasKnownBeacon = all.some((e) => KNOWN_NOISE.some((re) => re.test(e)));
  return all.filter((e) => {
    if (KNOWN_NOISE.some((re) => re.test(e))) return false;
    if (hasKnownBeacon && CSP_GENERIC_COMPANION.test(e)) return false;
    return true;
  });
}

module.exports = { appErrors, EMULATOR_FRAME_NOISE, GOOGLE_TELEMETRY_NOISE };
