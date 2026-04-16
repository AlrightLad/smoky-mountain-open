// Auth helper for Playwright tests.
// Mints a custom token against the Auth emulator via firebase-admin,
// then injects it into the browser context using the app's compat SDK.

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';

const admin = require('firebase-admin');
const users = require('../setup/fixtures/users.js').users;

function ensureAdmin() {
  if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
}

async function loginAs(page, testUserKey) {
  const user = users.find(u => u.key === testUserKey);
  if (!user) throw new Error('Unknown test user: ' + testUserKey);

  ensureAdmin();
  const token = await admin.auth().createCustomToken(user.uid);

  // Land on the auth screen with emulator mode on. The app's auth
  // screen is visible before sign-in; we sign in via the compat SDK.
  await page.goto('/?emulator=1');

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
  }, { timeout: 15000 });

  // Wait for fbMemberCache to be populated so the claimedFrom merge
  // has taken effect (this is what the v7.6.5 fix depends on).
  await page.waitForFunction((expected) => {
    return window.fbMemberCache
      && Object.keys(window.fbMemberCache).length >= expected;
  }, users.length, { timeout: 15000 });

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
