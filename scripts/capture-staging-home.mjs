// Capture the LIVE staging URL home page (post-sign-in) for design review.
// Uses the seeded staging Firestore so screenshots show real data shape.

import { chromium } from 'playwright';
import { readFileSync, mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/design-iteration/2026-05-22-staging-live';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const key = JSON.parse(readFileSync('scripts/.service-account.json', 'utf-8'));
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(key),
        projectId: 'parbaughs-staging',
    });
}

// Mint a custom token for testZach against parbaughs-staging
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

await page.goto('https://parbaughs-staging.web.app/');
await page.waitForTimeout(2000);

// Try to sign in via the page's auth API
try {
    await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined', { timeout: 10000 });
    await page.evaluate(async (tok) => {
        await window.auth.signInWithCustomToken(tok);
    }, token);
    await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
} catch (e) {
    console.log('sign-in attempt errored (may be expected if staging app doesn\'t expose window.auth):', e.message.slice(0, 100));
}
await page.waitForTimeout(3000);
await page.screenshot({ path: OUT + '/staging-home-1920.png', fullPage: true });
console.log('captured staging home');
await b.close();
