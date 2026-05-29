// Mobile-viewport design critique (2026-05-29). Members are mobile-PWA, but
// every prior critique capture was desktop 1440x900. This captures the key
// member surfaces at iPhone logical viewport (390x844, dpr 2, touch) so I can
// Read + critique the ACTUAL mobile first-impression: above-fold hierarchy,
// touch-target sizing, header density, horizontal overflow. Reuses the local
// emulator + dev-server auth path from capture-critique-2026-05-29.mjs.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/design-pass-2026-05-22/mobile-critique-2026-05-29';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Highest-value member surfaces for mobile first-impression critique.
const PAGES = [
    'home',
    'feed',
    'standings',
    'rounds',
    'trophyroom',
    'shop',
    'challenges',
    'bounties',
    'wagers',
    'settings',
    'more',
];

const b = await chromium.launch();
const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
});
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
        await page.waitForTimeout(1400);
        // viewport-only = the mobile first impression (above the fold)
        await page.screenshot({ path: OUT + '/' + p + '-viewport.png', fullPage: false });
        console.log('  ok ' + p);
    } catch (e) {
        errs.push({ page: p, err: e.message.slice(0, 100) });
        console.log('  XX ' + p + ' - ' + e.message.slice(0, 60));
    }
}

await b.close();
console.log('\nCaptured ' + (PAGES.length - errs.length) + '/' + PAGES.length + ' mobile viewports to ' + OUT);
if (errs.length) {
    console.log('Errors:');
    errs.forEach(e => console.log('  ' + e.page + ': ' + e.err));
}
