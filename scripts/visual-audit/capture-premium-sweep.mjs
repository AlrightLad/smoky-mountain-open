// Premium-survey sweep: authed-capture the daily-use member surfaces at iPhone
// viewport so each can be Read + judged for figure-ground depth (does the page
// read premium, or flat?). Reuses the emulator custom-token auth path. Founder
// 2nd-rejection bar: the WHOLE app must read App-Store-grade, not just home.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = 'scratch/dashed-fix-2026-06-07';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173/smoky-mountain-open/?emulator=1';
const ROUTES = ['wagers', 'bounties', 'challenges', 'teetimes', 'partygames', 'courses'];

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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

for (const route of ROUTES) {
    try {
        await page.evaluate((r) => Router.go(r), route);
        await page.waitForTimeout(1800);
        await page.screenshot({ path: OUT + '/' + route + '.png', fullPage: true });
        console.log('  ok ' + route);
    } catch (e) {
        console.log('  FAIL ' + route + ': ' + e.message.slice(0, 80));
    }
}

await ctx.close();
await b.close();
console.log('\nSwept ' + ROUTES.length + ' surfaces to ' + OUT);
