// Second-pass capture: high-value core surfaces missed in pass 1.
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const ROOT = '.claude/state/design-audit-2026-06-08/pass2';
const VIEWPORTS = [
  { key: 'desktop', width: 1440, height: 900, isMobile: false, dsf: 1 },
  { key: 'mobile', width: 390, height: 844, isMobile: true, dsf: 2 },
];
// route + optional params. profile via own member id.
const SURFACES = [
  { name: 'playnow', route: 'playnow' },
  { name: 'tournament', route: 'tournament' },
  { name: 'seasonrecap', route: 'seasonrecap' },
  { name: 'profile', route: 'profile' },
  { name: 'member-detail', route: 'members', params: { id: 'test_zach_uid_01' } },
];
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
  await page.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 12000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
  await page.waitForTimeout(1200);
  console.log(`\n=== ${v.key} ===`);
  for (const s of SURFACES) {
    try {
      await page.evaluate(({ route, params }) => Router.go(route, params || undefined), s);
      await page.waitForTimeout(1600);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${ROOT}/${v.key}/${s.name}.png`, fullPage: false });
      console.log('  ✓ ' + s.name);
    } catch (e) { console.log('  ✗ ' + s.name + ' — ' + e.message.slice(0, 50)); }
  }
  await ctx.close();
}
await b.close();
console.log(`\npass2 → ${ROOT}`);
