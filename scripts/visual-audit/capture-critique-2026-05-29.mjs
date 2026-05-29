// Wave-2 design critique pass (2026-05-29). Captures full-page baselines of
// every HQ-tier surface at desktop width so I can Read + critique each one
// against peer references and find the next genuine design improvement.
// Reuses the local emulator + dev-server auth path from capture-many-pages.mjs.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/design-pass-2026-05-22/critique-2026-05-29';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const PAGES = [
    'home',
    'feed',
    'rounds',
    'roundhistory',
    'standings',
    'trophyroom',
    'shop',
    'courses',
    'calendar',
    'teetimes',
    'bounties',
    'wagers',
    'challenges',
    'range',
    'drills',
    'scramble',
    'trips',
    'partygames',
    'richlist',
    'awards',
    'records',
    'aces',
    'chat',
    'dms',
    'social',
    'activity',
    'findplayers',
    'leagues',
    'invite',
    'settings',
    'more',
];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

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
await page.waitForTimeout(1500);

const errs = [];
for (const p of PAGES) {
    try {
        await page.evaluate((name) => Router.go(name), p);
        await page.waitForTimeout(1600);
        await page.screenshot({ path: OUT + '/' + p + '.png', fullPage: true });
        console.log('  ok ' + p);
    } catch (e) {
        errs.push({ page: p, err: e.message.slice(0, 100) });
        console.log('  XX ' + p + ' - ' + e.message.slice(0, 60));
    }
}

await b.close();
console.log('\nCaptured ' + (PAGES.length - errs.length) + '/' + PAGES.length + ' pages to ' + OUT);
if (errs.length) {
    console.log('Errors:');
    errs.forEach(e => console.log('  ' + e.page + ': ' + e.err));
}
