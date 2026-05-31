// Auth helper for Playwright tests.
// Mints a custom token against the Auth emulator via firebase-admin,
// then injects it into the browser context using the app's compat SDK.

// Use 127.0.0.1 (IPv4) not localhost. Node 20+ on Windows resolves
// `localhost` to ::1 (IPv6); the Firebase Auth emulator binds 127.0.0.1
// IPv4-only -> auth/network-request-failed across the whole smoke suite.
// The app-side fix landed in src/core/firebase.js 2026-05-21; this is
// the matching firebase-admin (Node) side.
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';

const admin = require('firebase-admin');
const users = require('../setup/fixtures/users.js').users;

function ensureAdmin() {
  if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
}

// The initial navigation can transiently fail with `net::ERR_ABORTED; maybe
// frame was detached?` when the first paint races the service-worker
// registration (or an early client reload). It is never a real app fault, so
// a bounded retry self-heals it and keeps the suite at zero-flaky. Waiting on
// 'domcontentloaded' (not the default 'load') also shrinks the abort window:
// the SDK-ready waitForFunction below is the real readiness gate, so we don't
// need to block on every sub-resource finishing.
async function gotoEmulator(page) {
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto('/?emulator=1', { waitUntil: 'domcontentloaded' });
      return;
    } catch (e) {
      lastErr = e;
      const msg = String((e && e.message) || '');
      if (!/ERR_ABORTED|frame was detached/i.test(msg)) throw e;
      await page.waitForTimeout(500);
    }
  }
  throw lastErr;
}

async function loginAs(page, testUserKey) {
  const user = users.find(u => u.key === testUserKey);
  if (!user) throw new Error('Unknown test user: ' + testUserKey);

  ensureAdmin();
  const token = await admin.auth().createCustomToken(user.uid);

  // Land on the auth screen with emulator mode on. The app's auth
  // screen is visible before sign-in; we sign in via the compat SDK.
  await gotoEmulator(page);

  // Wait for the compat Firebase SDK to have initialised.
  await page.waitForFunction(() => {
    return typeof window.firebase !== 'undefined'
        && typeof window.auth !== 'undefined'
        && window._pbEmulator === true;
  }, { timeout: 10000 });

  await page.evaluate(async (tok) => {
    await window.auth.signInWithCustomToken(tok);
  }, token);

  // Wait until enterApp() runs: #mainApp loses .hidden and #authScreen gets .hidden.
  await page.waitForFunction(() => {
    const main = document.getElementById('mainApp');
    const auth = document.getElementById('authScreen');
    return main && !main.classList.contains('hidden')
        && auth && auth.classList.contains('hidden');
  }, { timeout: 20000 });

  // Wait for THIS user's profile to land in fbMemberCache (the claimedFrom
  // merge the round-count assertion depends on needs the current user's own
  // profile, not all 26 members). fbMemberCache is populated atomically by the
  // single members.get({source:'server'}) in firebase-photos.js, so gating on
  // the current uid flips true at the same instant the old >=26 check did, but
  // is robust to seed member-count drift: a missing/slow seed write for some
  // OTHER member no longer hangs this gate to its timeout. Timeout stays
  // generous because the emulator's forced long-polling transport
  // (experimentalForceLongPolling, emulator-only) is slower than production
  // WebChannel for the initial bulk members.get(). Production is unaffected.
  await page.waitForFunction((uid) => {
    return window.fbMemberCache && !!window.fbMemberCache[uid];
  }, user.uid, { timeout: 30000 });

  // Brief settle so the post-load home re-render completes.
  await page.waitForTimeout(300);
}

async function logout(page) {
  await page.evaluate(async () => {
    if (window.auth) await window.auth.signOut();
  });
  await page.waitForFunction(() => {
    const auth = document.getElementById('authScreen');
    return auth && !auth.classList.contains('hidden');
  }, { timeout: 5000 });
}

module.exports = { loginAs, logout };
