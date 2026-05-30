// W1.S3 roster ZOOM capture — 2x deviceScaleFactor, viewport-only (not fullPage),
// so the masthead + scope bar + first rows + rail top render at legible resolution.
// Reuses the emulator + custom-token auth path from capture-w1s3-roster.mjs.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s3-roster-2026-05-30/zoom';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
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
await page.evaluate(() => Router.go('members'));
await page.waitForSelector('#rosterBody tr', { timeout: 12000 });
await page.waitForTimeout(1400);

// Viewport-only (no fullPage) at 2x — top region: masthead, scope, first rows, rail.
await page.screenshot({ path: OUT + '/members-top-2x.png' });
console.log('  ok members-top-2x');

// Scroll so a mid-table band + rail leaderboards are centered, capture again.
await page.evaluate(() => window.scrollTo(0, 360));
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + '/members-mid-2x.png' });
console.log('  ok members-mid-2x');

await b.close();
console.log('done -> ' + OUT);
