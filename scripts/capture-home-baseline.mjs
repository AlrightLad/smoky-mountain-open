// Capture current state of HQ home (member-facing) at 3 widths for
// design-iteration baseline. Founder reviews against subsequent
// iterations to confirm visible improvement.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/design-iteration/2026-05-22-baseline';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const WIDTHS = [
    { name: '1920', width: 1920, height: 1080 }, // desktop
    { name: '1366', width: 1366, height: 768 },  // laptop
    { name: '375',  width: 375,  height: 812 },  // iPhone-ish (mobile)
];

const b = await chromium.launch();

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

for (const w of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width: w.width, height: w.height } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:5173/?emulator=1');
    await page.waitForFunction(() =>
        typeof window.firebase !== 'undefined' &&
        typeof window.auth !== 'undefined' &&
        window._pbEmulator === true, { timeout: 10000 });
    await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
    await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
    await page.waitForTimeout(3000); // let animations + Firestore listeners settle
    await page.screenshot({ path: OUT + '/home-' + w.name + '.png', fullPage: true });
    console.log('captured ' + w.name + ' -> home-' + w.name + '.png');
    await ctx.close();
}
await b.close();
console.log('\nBaselines saved to ' + OUT);
