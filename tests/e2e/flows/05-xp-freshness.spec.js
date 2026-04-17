// v7.9 regression test — session-start persistPlayerStats refreshes stale XP.
//
// Setup: write a deliberately low xp onto a user's member doc, bypassing
// persistPlayerStats. This simulates the drift that happens in production
// when a user earns XP in paths that don't persist (achievements, range
// sessions, chat activity bonuses) and then opens the app.
//
// Expected behavior after v7.9: loginAs fires enterApp → preloadMemberPhotos
// → persistPlayerStats(currentUser.uid). The idempotency gate lets the
// write through because the stale value does NOT match the fresh
// computation. The _memberProfileUnsub onSnapshot listener picks up the
// write and updates currentProfile.xp.

const { test, expect } = require('@playwright/test');
const admin = require('firebase-admin');
const { loginAs, logout } = require('../helpers/auth.js');
const { users } = require('../setup/fixtures/users.js');

function ensureAdmin() {
  if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
}

test.describe('v7.9 — session-start persistPlayerStats refreshes stale XP', () => {

  test('stale persisted xp is refreshed to live computation at session start', async ({ page }) => {
    ensureAdmin();
    const user = users.find(u => u.key === 'testZach');
    expect(user, 'testZach fixture present').toBeDefined();

    // Capture browser console for diagnostics if something goes wrong.
    const logs = [];
    page.on('console', msg => { logs.push(`[${msg.type()}] ${msg.text()}`); });

    const docRef = admin.firestore().collection('members').doc(user.uid);

    // Capture the live-persisted baseline. If a prior test already ran
    // session-start persist in this session, this is the live value. If
    // the fixture seed is untouched, this is MATERIALIZED_XP.testZach
    // (which was authored to mirror the live computation).
    const beforeSnap = await docRef.get();
    const baselineXp = beforeSnap.data() && beforeSnap.data().xp;
    expect(baselineXp, 'fixture seeds testZach with non-zero xp').toBeGreaterThan(0);

    // Simulate drift: overwrite with a value we know is lower than live.
    const STALE_XP = 42;
    await docRef.update({ xp: STALE_XP, level: 1 });

    // Log in. This fires enterApp → preloadMemberPhotos → persistPlayerStats.
    // persistPlayerStats does its own global rounds fetch and then writes if
    // values differ. The _memberProfileUnsub listener then updates currentProfile.
    await loginAs(page, 'testZach');

    // Wait for currentProfile.xp to move above the stale value. Generous
    // timeout because persistPlayerStats Promise.all → Firestore write →
    // onSnapshot round-trip can take a moment on a cold emulator.
    try {
      await page.waitForFunction(
        (stale) => window.currentProfile && typeof window.currentProfile.xp === 'number' && window.currentProfile.xp > stale,
        STALE_XP,
        { timeout: 10000 }
      );
    } catch (e) {
      const clientState = await page.evaluate(() => ({
        xp: window.currentProfile && window.currentProfile.xp,
        level: window.currentProfile && window.currentProfile.level,
        totalRounds: window.currentProfile && window.currentProfile.totalRounds,
      }));
      console.log('[test] clientState:', JSON.stringify(clientState));
      console.log('[test] browser logs:', logs.filter(l => l.includes('Stats') || l.includes('persist')).slice(-20).join('\n'));
      throw e;
    }

    // Give the write a moment to settle in Firestore before the final read.
    await page.waitForTimeout(500);

    const refreshedClientXp = await page.evaluate(() => window.currentProfile.xp);
    expect(refreshedClientXp).toBeGreaterThan(STALE_XP);

    // And the Firestore doc itself converges back to the live value.
    const afterSnap = await docRef.get();
    const refreshedXp = afterSnap.data().xp;
    if (refreshedXp <= STALE_XP) {
      console.log('[test] doc state:', JSON.stringify(afterSnap.data()));
      console.log('[test] clientXp:', refreshedClientXp);
      console.log('[test] browser Stats logs:', logs.filter(l => l.includes('Stats')).join('\n'));
    }
    expect(refreshedXp).toBeGreaterThan(STALE_XP);
    expect(refreshedXp).toBe(refreshedClientXp);

    // Sign out to avoid leaking auth state into subsequent tests.
    await logout(page);
  });

});
