// Above-the-fold (viewport-only) captures of the core surfaces, to correctly
// judge first-impression composition + fixed-element placement (which fullPage
// screenshots distort). Dismisses the one-time welcome toast first.
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const ROOT = '.claude/state/design-audit-2026-06-08/viewport';
const VIEWPORTS = [
  { key: 'desktop', width: 1440, height: 900, isMobile: false, dsf: 1 },
  { key: 'mobile', width: 390, height: 844, isMobile: true, dsf: 3 },
];
const SURFACES = ['home', 'feed', 'rounds', 'range', 'courses', 'standings', 'leaderboard', 'members', 'shop', 'chat', 'more', 'settings'];

for (const v of VIEWPORTS) { const d = `${ROOT}/${v.key}`; if (!existsSync(d)) mkdirSync(d, { recursive: true }); }

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();
for (const v of VIEWPORTS) {
  const ctx = await b.newContext({ viewport: { width: v.width, height: v.height }, isMobile: v.isMobile, hasTouch: v.isMobile, deviceScaleFactor: v.dsf });
  const page = await ctx.newPage();
  // Pre-set the welcome flag so the one-time toast never covers the first impression.
  await page.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 12000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
  await page.waitForTimeout(1200);
  console.log(`\n=== ${v.key} viewport-only ===`);
  for (const s of SURFACES) {
    try {
      await page.evaluate((name) => Router.go(name), s);
      await page.waitForTimeout(1400);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${ROOT}/${v.key}/${s}.png`, fullPage: false });
      console.log(`  ✓ ${s}`);
    } catch (e) { console.log(`  ✗ ${s} — ${e.message.slice(0, 50)}`); }
  }
  await ctx.close();
}
await b.close();
console.log(`\nViewport captures → ${ROOT}`);
