// Third pass: the remaining HIGH-value uncaptured surfaces — first-run onboarding
// and the live round-detail / scorecard (core scoring experience).
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const ROOT = '.claude/state/design-audit-2026-06-08/pass3';
const VIEWPORTS = [
  { key: 'desktop', width: 1440, height: 900, isMobile: false, dsf: 1 },
  { key: 'mobile', width: 390, height: 844, isMobile: true, dsf: 2 },
];
for (const v of VIEWPORTS) { const d = `${ROOT}/${v.key}`; if (!existsSync(d)) mkdirSync(d, { recursive: true }); }
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');
// grab a real round id (prefer one owned by the test user, else any)
const db = admin.firestore();
const snap = await db.collection('rounds').limit(20).get();
let roundId = null, ownRound = null;
snap.forEach(d => { if (!roundId) roundId = d.id; const r = d.data(); if (!ownRound && (r.uid === 'test_zach_uid_01' || r.playerId === 'test_zach_uid_01')) ownRound = d.id; });
roundId = ownRound || roundId;
console.log('using roundId=' + roundId);

const b = await chromium.launch();
for (const v of VIEWPORTS) {
  const ctx = await b.newContext({ viewport: { width: v.width, height: v.height }, isMobile: v.isMobile, hasTouch: v.isMobile, deviceScaleFactor: v.dsf });
  const page = await ctx.newPage();
  // do NOT pre-set welcomed for onboarding (we want to see it); set for others via re-nav
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 12000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
  await page.waitForTimeout(1200);
  console.log(`\n=== ${v.key} ===`);
  const shots = [
    { name: 'round', fn: async () => { await page.evaluate((id) => Router.go('round', { id }), roundId); } },
    { name: 'onboarding', fn: async () => { await page.evaluate(() => Router.go('onboarding')); } },
    { name: 'rules', fn: async () => { await page.evaluate(() => Router.go('rules')); } },
    { name: 'faq', fn: async () => { await page.evaluate(() => Router.go('faq')); } },
  ];
  for (const s of shots) {
    try {
      await s.fn();
      await page.waitForTimeout(1800);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${ROOT}/${v.key}/${s.name}.png`, fullPage: false });
      console.log('  ✓ ' + s.name);
    } catch (e) { console.log('  ✗ ' + s.name + ' — ' + e.message.slice(0, 50)); }
  }
  await ctx.close();
}
await b.close();
console.log(`\npass3 → ${ROOT}`);
