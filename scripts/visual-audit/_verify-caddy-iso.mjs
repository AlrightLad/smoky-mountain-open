import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT = '.claude/state/onboarding-rebuild-2026-06-12/caddy-iso';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('1GE683EauXO8TVhcStKfWiCCcRl2');
const b = await chromium.launch();
const ctx = await b.newContext(devices['iPhone 14 Pro']);
const page = await ctx.newPage();
await page.goto('http://localhost:5173/smoky-mountain-open/?emulator=1', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 15000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);
// build a clean isolated stage + mount the caddy figure large
await page.evaluate(() => {
  var i = document.getElementById('pbIntro'); if (i) i.remove();
  var w = document.getElementById('pbWalk'); if (w) w.remove();
  var d = document.createElement('div');
  d.id = 'isoStage';
  d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#F4EFE4;display:flex;align-items:center;justify-content:center';
  d.innerHTML = '<div id="isoFig" style="width:300px;height:340px"></div>';
  document.body.appendChild(d);
  if (window.pbCaddy && window.pbCaddy.mount) { try { window.pbCaddy.mount('#isoFig', { size: 300 }); window.pbCaddy.setPose('tipCap'); } catch (e) {} }
});
await page.waitForTimeout(700);
for (const id of ['caddy', 'oldtom', 'birdie', 'bagroom']) {
  await page.evaluate((cid) => { if (window.pbCaddy && window.pbCaddy.setCaddy) { try { window.pbCaddy.setCaddy(cid); window.pbCaddy.setPose('tipCap'); } catch (e) {} } }, id);
  await page.waitForTimeout(600);
  const el = await page.$('#isoStage');
  if (el) await el.screenshot({ path: OUT + '/' + id + '.png' });
  console.log('iso shot', id);
}
await b.close(); process.exit(0);
