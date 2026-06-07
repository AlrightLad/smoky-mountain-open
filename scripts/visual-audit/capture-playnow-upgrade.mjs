// Authed capture of the v8.23.87 Play now setup-card upgrade. Reuses the
// emulator custom-token auth path from capture-home-upgrade.mjs. Play now was
// the lone flat surface (fields sat muddy on the same canvas ground); this
// verifies the new elevated --cb-paper "form sheet" card lifts off the canvas
// with crisp inset field wells. Dev server reflects the live src/ edit via HMR.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = 'scratch/playnow-upgrade-2026-06-07';
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
    await page.evaluate(() => Router.go('playnow'));
    await page.waitForTimeout(2200);
    // Confirm the new card actually rendered + report its computed bg so the
    // capture isn't a pre-paint frame (P9 — verify the truth, not just a render).
    const diag = await page.evaluate(() => {
        const card = document.querySelector('.pn-setup-card');
        if (!card) return { card: false };
        const cs = getComputedStyle(card);
        const r = card.getBoundingClientRect();
        return { card: true, bg: cs.backgroundColor, shadow: cs.boxShadow.slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
    });
    console.log('  ' + label + ' diag: ' + JSON.stringify(diag));
    await page.screenshot({ path: OUT + '/playnow-' + label + '-viewport.png', fullPage: false });
    await page.screenshot({ path: OUT + '/playnow-' + label + '-full.png', fullPage: true });
    console.log('  ok ' + label);
    await ctx.close();
}

await capture('iphone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await capture('desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

await b.close();
console.log('\nCaptured playnow (iphone + desktop) to ' + OUT);
