// Real authed home capture for the 2026-06-07 premium upgrade (green focal
// hero + figure-ground depth). Reuses the emulator custom-token auth path from
// capture-mobile-critique-2026-05-29.mjs. Captures the REAL home (dev server
// reflects live src/ edits) at iPhone (390x844 dpr2 touch) and desktop
// (1440x900) so the green hero + floating cards can be Read + vision-verified
// against the actual app chrome, not just the scratch swatch.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = 'scratch/home-upgrade-2026-06-07';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173/smoky-mountain-open/?emulator=1';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();

async function capture(label, vp) {
    const ctx = await b.newContext(vp);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.waitForFunction(
        () => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true,
        { timeout: 12000 }
    );
    await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
    await page.waitForFunction(
        () => !document.getElementById('mainApp')?.classList.contains('hidden'),
        { timeout: 15000 }
    );
    await page.evaluate(() => Router.go('home'));
    await page.waitForTimeout(1800);
    await page.screenshot({ path: OUT + '/home-' + label + '-viewport.png', fullPage: false });
    await page.screenshot({ path: OUT + '/home-' + label + '-full.png', fullPage: true });
    console.log('  ok ' + label);
    await ctx.close();
}

await capture('iphone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await capture('desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

await b.close();
console.log('\nCaptured home (iphone + desktop) to ' + OUT);
