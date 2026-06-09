// Full design-audit sweep: every primary member-facing surface at desktop
// (1440x900) + mobile (iPhone-14 390x844), grounded in the running seeded
// local emulator. Output: OUT/{viewport}/{surface}.png + a manifest.
import { chromium } from 'playwright';
import { mkdirSync, existsSync, writeFileSync } from 'fs';

const ROOT = '.claude/state/design-audit-2026-06-08/sweep';
const VIEWPORTS = [
  { key: 'desktop', width: 1440, height: 900, isMobile: false },
  { key: 'mobile', width: 390, height: 844, isMobile: true },
];
// Primary + secondary member-facing surfaces (route names → Router.go).
const SURFACES = [
  'home', 'feed', 'activity', 'rounds', 'roundhistory', 'range', 'drills',
  'courses', 'teetimes', 'calendar', 'standings', 'leaderboard', 'records',
  'awards', 'aces', 'shop', 'richlist', 'wagers', 'bounties', 'challenges',
  'members', 'findplayers', 'leagues', 'chat', 'dms', 'scramble', 'trips',
  'partygames', 'social', 'more', 'settings', 'invite', 'trophyroom', 'spectator',
];

for (const v of VIEWPORTS) {
  const d = `${ROOT}/${v.key}`;
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const manifest = { generated_at_note: 'stamp after run', viewports: VIEWPORTS.map(v => v.key), surfaces: {} };
const b = await chromium.launch();

for (const v of VIEWPORTS) {
  const ctx = await b.newContext({
    viewport: { width: v.width, height: v.height },
    isMobile: v.isMobile,
    hasTouch: v.isMobile,
    deviceScaleFactor: v.isMobile ? 3 : 1,
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 12000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
  await page.waitForTimeout(1500);

  console.log(`\n=== ${v.key} (${v.width}x${v.height}) ===`);
  for (const s of SURFACES) {
    manifest.surfaces[s] = manifest.surfaces[s] || {};
    try {
      const ok = await page.evaluate((name) => { try { Router.go(name); return true; } catch (e) { return false; } }, s);
      if (!ok) { manifest.surfaces[s][v.key] = 'route-error'; console.log(`  ✗ ${s} (route)`); continue; }
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `${ROOT}/${v.key}/${s}.png`, fullPage: true });
      manifest.surfaces[s][v.key] = 'ok';
      console.log(`  ✓ ${s}`);
    } catch (e) {
      manifest.surfaces[s][v.key] = 'fail: ' + e.message.slice(0, 60);
      console.log(`  ✗ ${s} — ${e.message.slice(0, 60)}`);
    }
  }
  await ctx.close();
}
await b.close();
writeFileSync(`${ROOT}/manifest.json`, JSON.stringify(manifest, null, 2));
const okCount = Object.values(manifest.surfaces).reduce((n, m) => n + Object.values(m).filter(x => x === 'ok').length, 0);
console.log(`\nCaptured ${okCount} screenshots across ${VIEWPORTS.length} viewports → ${ROOT}`);
