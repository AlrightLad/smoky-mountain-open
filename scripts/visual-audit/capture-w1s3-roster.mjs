// W1.S3 roster capture (CLUBHOUSE_SPEC-HQ-3e). Reuses the emulator + custom-token
// auth path from capture-critique-2026-05-29.mjs, but waits for the roster table
// body to actually render (the members list does a {source:'server'} fetch that
// outlasts the generic 1600ms wait) before screenshotting.
//
//   CAPTURE_DEVICE  Playwright device descriptor (e.g. "iPhone 14 Pro", "Pixel 7")
//   CAPTURE_OUT     output directory

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s3-roster-2026-05-30/desktop';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const DEVICE = process.env.CAPTURE_DEVICE;
const ctxOptions = (DEVICE && devices[DEVICE])
    ? devices[DEVICE]
    : { viewport: { width: 1440, height: 900 } };

const b = await chromium.launch();
const ctx = await b.newContext(ctxOptions);
const page = await ctx.newPage();
console.log('Capturing roster at ' + (DEVICE && devices[DEVICE] ? DEVICE : 'desktop 1440x900') + ' -> ' + OUT);

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

// Members roster — wait for the real table body (rows or empty-row) to replace
// the "Loading the roster…" state, then settle for fonts/avatars.
await page.evaluate(() => Router.go('members'));
try {
    await page.waitForSelector('#rosterBody tr', { timeout: 12000 });
} catch (e) {
    console.log('  WARN roster body did not appear in 12s: ' + e.message.slice(0, 60));
}
await page.waitForTimeout(1400);
await page.screenshot({ path: OUT + '/members.png', fullPage: true });
const rowCount = await page.evaluate(() => document.querySelectorAll('#rosterBody tr').length);
console.log('  ok members (' + rowCount + ' rows)');

// Live-now tab + handicap sort quick states (desktop only — interaction proof).
if (!DEVICE) {
    await page.evaluate(() => { var s = document.querySelector('.roster-sort'); if (s) { s.value = 'handicap'; rosterSetSort('handicap'); } });
    await page.waitForTimeout(700);
    await page.screenshot({ path: OUT + '/members-sort-handicap.png', fullPage: true });
    console.log('  ok members-sort-handicap');
}

// Find Players.
await page.evaluate(() => Router.go('findplayers'));
await page.waitForTimeout(1800);
await page.screenshot({ path: OUT + '/findplayers.png', fullPage: true });
console.log('  ok findplayers');

await b.close();
console.log('done -> ' + OUT);
