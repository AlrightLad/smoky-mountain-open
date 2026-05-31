// Wave 3 M3-M6 mobile diagnostic (2026-05-30). M1 (Capacitor harness) + M2
// (mobile Home) are complete-baseline. Mobile is a responsive breakpoint
// (<720px) in the same page files, NOT a separate native app. Before scoping
// any M3-M6 mobile build, capture the CURRENT mobile rendering of the Play /
// Stats / Feed / More tab surfaces at iPhone logical viewport (390x844, dpr 2,
// touch) so I can Read + critique actual state and fix only real gaps (P5
// diagnostic-first, AMD-028 vision-verify-first). Reuses the authed emulator
// path from capture-mobile-critique-2026-05-29.mjs.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/design-pass-2026-05-22/wave3-m3m6-mobile-2026-05-30';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// M3 Play / M4 Stats / M5 Feed / M6 More tab surfaces (Wave 3 scope).
// Canonical route names verified against src/pages/*.js Router.register calls
// (2026-05-30). NOTE: scramble-live is hyphenated; the prior 'scramblelive'
// pass navigated to a non-existent route, so the router hid every [data-page]
// container and the body rendered blank — a capture artifact, NOT an app bug.
const PAGES = [
    // M3 — Play tab
    'playnow',
    'syncround',
    'scramble-live',
    'partygames',
    // M4 — Stats tab
    'roundhistory',
    'records',
    'aces',
    'awards',
    'seasonrecap',
    // M5 — Feed tab
    'feed',
    'chat',
    'dms',
    'activity',
    // M6 — More tab
    'more',
    'settings',
    'profile',
    'admin',
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

const BASE = process.env.PB_DEV_URL || 'http://localhost:5173';
await page.goto(BASE + '/?emulator=1');
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(1500);

const errs = [];
for (const p of PAGES) {
    try {
        await page.evaluate((name) => Router.go(name), p);
        await page.waitForTimeout(1400);
        // Source of truth = the active (un-hidden) page container, not a stray
        // masthead h1/h2. 'NONE' here means the route did not resolve (blank).
        const route = await page.evaluate(() => {
            var active = document.querySelector('#mainApp [data-page]:not(.hidden)');
            return (active ? active.getAttribute('data-page') : 'NONE') + ' :: ' + ((active && active.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50));
        });
        await page.screenshot({ path: OUT + '/' + p + '-viewport.png', fullPage: false });
        await page.screenshot({ path: OUT + '/' + p + '-full.png', fullPage: true });
        console.log('  ok ' + p + '  -> ' + route);
    } catch (e) {
        errs.push({ page: p, err: e.message.slice(0, 100) });
        console.log('  XX ' + p + ' - ' + e.message.slice(0, 60));
    }
}

await b.close();
console.log('\nCaptured ' + (PAGES.length - errs.length) + '/' + PAGES.length + ' mobile surfaces to ' + OUT);
if (errs.length) {
    console.log('Errors:');
    errs.forEach(e => console.log('  ' + e.page + ': ' + e.err));
}
