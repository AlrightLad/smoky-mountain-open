// W1.3d Season Standings / Leaderboard capture (CLUBHOUSE_SPEC-HQ-3d).
// Reuses the emulator + custom-token auth path from capture-w1s3-roster.mjs.
// Waits for the editorial standings table body (or the branded empty state)
// to render before screenshotting, and records console errors so the render
// can be proven JS-clean (V1 + P9).
//
//   CAPTURE_DEVICE  Playwright device descriptor (e.g. "iPhone 14 Pro", "Pixel 7")
//   CAPTURE_OUT     output directory

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = process.env.CAPTURE_OUT || '.claude/state/design-iteration/2026-06-06-w1-3d-leaderboard/desktop';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const DEVICE = process.env.CAPTURE_DEVICE;
const ctxOptions = (DEVICE && devices[DEVICE])
    ? devices[DEVICE]
    : { viewport: { width: 1440, height: 900 } };

const b = await chromium.launch();
const ctx = await b.newContext(ctxOptions);
const page = await ctx.newPage();
const label = (DEVICE && devices[DEVICE]) ? DEVICE : 'desktop 1440x900';
console.log('Capturing standings at ' + label + ' -> ' + OUT);

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

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

const SEASON = process.env.CAPTURE_SEASON || null;
const YEAR = process.env.CAPTURE_YEAR ? parseInt(process.env.CAPTURE_YEAR) : null;
await page.evaluate(({ season, year }) => {
    var params = {};
    if (year) params.year = year;
    if (season) params.season = season;
    Router.go('standings', Object.keys(params).length ? params : undefined);
}, { season: SEASON, year: YEAR });
try {
    await page.waitForSelector('.roster-table tbody tr, .std-empty', { timeout: 12000 });
} catch (e) {
    console.log('  WARN standings body did not appear in 12s: ' + e.message.slice(0, 60));
}
await page.waitForTimeout(1400);
await page.screenshot({ path: OUT + '/standings.png', fullPage: true });

const diag = await page.evaluate(() => {
    const rows = document.querySelectorAll('.roster-table tbody tr').length;
    const hasMasthead = !!document.querySelector('.roster-masthead .roster-headline');
    const hasTabs = document.querySelectorAll('.roster-tab').length;
    const hasTrophies = document.querySelectorAll('.std-trophy').length;
    const hasRail = !!document.querySelector('.hq-grid__rail-right');
    const railVisible = (() => {
        const el = document.querySelector('.hq-grid__rail-right');
        if (!el) return false;
        return window.getComputedStyle(el).display !== 'none';
    })();
    const empty = !!document.querySelector('.std-empty');
    const deck = (document.querySelector('.std-deck') || {}).textContent || '';
    return { rows, hasMasthead, hasTabs, hasTrophies, hasRail, railVisible, empty, deck };
});
console.log('  diag: ' + JSON.stringify(diag));
console.log('  consoleErrors(' + consoleErrors.length + '): ' + JSON.stringify(consoleErrors.slice(0, 8)));

await b.close();
console.log('done -> ' + OUT);
