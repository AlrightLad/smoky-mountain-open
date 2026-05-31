// W1.S16 profile-detail capture (CLUBHOUSE_SPEC-HQ-3o). Reuses the emulator +
// custom-token auth path from capture-w1s3-roster.mjs. Navigates to the member
// detail view (own profile via the `profile` route) and waits for the profile
// name (.pf-headline) to render before screenshotting.
//
//   CAPTURE_DEVICE  Playwright device descriptor (e.g. "iPhone 14 Pro")
//   CAPTURE_OUT     output directory

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s16-profile-2026-05-30/desktop';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const DEVICE = process.env.CAPTURE_DEVICE;
const ctxOptions = (DEVICE && devices[DEVICE])
    ? devices[DEVICE]
    : { viewport: { width: 1440, height: 1000 } };

const b = await chromium.launch();
const ctx = await b.newContext(ctxOptions);
const page = await ctx.newPage();
console.log('Capturing profile at ' + (DEVICE && devices[DEVICE] ? DEVICE : 'desktop 1440x1000') + ' -> ' + OUT);

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(1200);

// Own profile via the `profile` route (redirects to members?id=<own uid>).
await page.evaluate(() => Router.go('profile'));
try {
    await page.waitForSelector('.pf-headline', { timeout: 12000 });
} catch (e) {
    console.log('  WARN .pf-headline did not appear in 12s: ' + e.message.slice(0, 60));
}
await page.waitForTimeout(1600);
await page.screenshot({ path: OUT + '/profile-overview.png', fullPage: true });
const nm = await page.evaluate(() => { var el = document.querySelector('.pf-headline'); return el ? el.textContent.trim() : '(none)'; });
console.log('  ok profile-overview (name: ' + nm + ')');

// Stats tab (analytics dashboard) — desktop only.
if (!DEVICE) {
    await page.evaluate(() => {
        document.querySelectorAll('[data-ptab]').forEach(function(e){e.style.display='none'});
        var t = document.getElementById('ptab-stats'); if (t) t.style.display='block';
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: OUT + '/profile-stats.png', fullPage: true });
    console.log('  ok profile-stats');

    // Social tab (head-to-head, all rounds).
    await page.evaluate(() => {
        document.querySelectorAll('[data-ptab]').forEach(function(e){e.style.display='none'});
        var t = document.getElementById('ptab-social'); if (t) t.style.display='block';
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: OUT + '/profile-social.png', fullPage: true });
    console.log('  ok profile-social');
}

await b.close();
console.log('done -> ' + OUT);
