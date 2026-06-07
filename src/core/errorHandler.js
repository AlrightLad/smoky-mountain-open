/**
 * PARBAUGHS error handler — Sentry integration.
 *
 * Authored 2026-05-22 per Founder Checklist sentry-signup walkthrough Step 4.
 *
 * Loaded as the FIRST import in src/main.js so Sentry hooks the global error
 * handlers BEFORE Firebase init runs. Catches uncaught exceptions, promise
 * rejections, and explicit captureException() calls from any module.
 *
 * RUNTIME-SAFE: if VITE_SENTRY_DSN is missing or malformed, this no-ops
 * cleanly (logs once to console.warn, otherwise silent). Local dev without
 * a .env file works fine.
 *
 * Release tagging: matches APP_VERSION from src/core/utils.js — Sentry
 * groups errors by release so we can see which version regression introduced.
 *
 * Sample rate: 0.1 (10%) for performance tracing. Free tier covers
 * 5K errors/month + 100K performance transactions; 0.1 keeps us well below
 * the cap at 20-member scale.
 */

import * as Sentry from '@sentry/browser';

var __sentryInitialized = false;

export function initSentry(opts) {
  if (__sentryInitialized) return;

  // Sentry runs only for real users on real deployments. Skip it in:
  //   - non-production builds — `npm run dev` (import.meta.env.PROD === false),
  //     which is exactly what the Playwright E2E webServer runs against; and
  //   - any loopback / emulator context (a prod build served from localhost or
  //     pointed at the Firebase emulator via ?emulator=1).
  // Why this guard exists: Sentry's session + trace envelopes are fire-and-forget
  // POSTs to ingest.us.sentry.io. In the E2E env they outlive the page and abort
  // as "Failed to load resource: net::ERR_FAILED" — a URL-less console error that
  // flaked flow 01's strict zero-console-error baseline (pixel-7 testuser_01,
  // 2026-06-07). A bare net::ERR_FAILED filter would be unsafe (it could mask a
  // real bundle 404), so the correct fix is to not fire the beacon in test/dev at
  // all. It also keeps dev/test errors out of the production Sentry project.
  // Production + staging are both `vite build` (PROD === true) → Sentry stays on.
  var isLoopbackOrEmulator =
    (typeof location !== 'undefined') &&
    (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ||
     /[?&]emulator=1\b/.test(location.search || ''));
  if (!import.meta.env.PROD || isLoopbackOrEmulator) {
    return;
  }

  var dsn = (opts && opts.dsn) || import.meta.env.VITE_SENTRY_DSN || '';
  var release = (opts && opts.release) || import.meta.env.VITE_APP_VERSION || 'unknown';
  var environment = (opts && opts.environment) || import.meta.env.MODE || 'production';
  var tracesSampleRate = (opts && opts.tracesSampleRate != null) ? opts.tracesSampleRate : 0.1;

  // Validate DSN shape before init — Sentry's own init throws on bad DSN
  // (e.g. Loader Script URL instead of SDK DSN). Catch the common shape
  // mismatch ourselves so the runtime stays unbroken even if Founder pastes
  // the wrong value into .env.
  var validDsn = /^https:\/\/[a-f0-9]+@o[0-9]+\.ingest\.(us|de|eu)\.sentry\.io\/[0-9]+$/.test(dsn);
  if (!dsn) {
    console.warn('[errorHandler] VITE_SENTRY_DSN missing — Sentry inactive');
    return;
  }
  if (!validDsn) {
    console.warn(
      '[errorHandler] VITE_SENTRY_DSN format invalid (got "' + dsn.slice(0, 40) + '..."). ' +
      'Expected: https://<key>@o<orgId>.ingest.us.sentry.io/<projectId>. ' +
      'Sentry inactive.'
    );
    return;
  }

  try {
    Sentry.init({
      dsn: dsn,
      release: 'parbaughs@' + release,
      environment: environment,
      tracesSampleRate: tracesSampleRate,
      // Capture sessions for release-health visibility
      autoSessionTracking: true,
      // Beforesend hook: drop expected-noise errors we don't want to bill against quota
      beforeSend: function(event, hint) {
        var msg = (event && event.message) || (hint && hint.originalException && hint.originalException.message) || '';
        // Skip ResizeObserver loop notices (Chrome/Firefox known harmless)
        if (/ResizeObserver loop/i.test(msg)) return null;
        // Skip CORS preflight failures from file:// in local dev
        if (/Cross-Origin Request Blocked/i.test(msg)) return null;
        return event;
      },
    });
    __sentryInitialized = true;
  } catch (e) {
    console.warn('[errorHandler] Sentry.init failed: ' + (e && e.message));
  }
}

export function captureException(err, context) {
  if (!__sentryInitialized) return;
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch (e) {
    // Suppress — error handler must never throw
  }
}

export function captureMessage(msg, level) {
  if (!__sentryInitialized) return;
  try {
    Sentry.captureMessage(msg, level || 'info');
  } catch (e) {
    // Suppress
  }
}

export function isSentryActive() {
  return __sentryInitialized;
}
