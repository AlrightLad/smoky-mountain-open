// Authed mobile capture (2026-06-07) for the post-rejection UI upgrade pass.
// Founder rejected the UI twice ("still looks like shit, upgrade it"). Production
// is stale at v8.23.1; staging is v8.23.92. This captures the CURRENT staging
// build (served by the local dev server) at iPhone viewport so I can Read the
// real first-impression and find genuine remaining gaps vs peer references.
// Reuses the proven emulator auth path from capture-mobile-critique-2026-05-29.mjs.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/ui-upgrade-2026-06-07/captures';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Most-seen member surfaces — the first impression that drives "looks like shit".
const PAGES = ['home', 'feed', 'standings', 'rounds', 'shop', 'trophyroom', 'profile', 'more'];

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
        await page.screenshot({ path: OUT + '/' + p + '-viewport.png', fullPage: false });
        // full page for home so I can judge below-fold rhythm too
        if (p === 'home') await page.screenshot({ path: OUT + '/' + p + '-full.png', fullPage: true });
        console.log('  ok ' + p);
    } catch (e) {
        errs.push({ page: p, err: e.message.slice(0, 100) });
        console.log('  XX ' + p + ' - ' + e.message.slice(0, 60));
    }
}

await b.close();
console.log('\nCaptured ' + (PAGES.length - errs.length) + '/' + PAGES.length + ' to ' + OUT);
if (errs.length) errs.forEach(e => console.log('  ' + e.page + ': ' + e.err));
