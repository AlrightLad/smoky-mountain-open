import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT = '.claude/state/onboarding-rebuild-2026-06-12/caddies';
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
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.goto('http://localhost:5173/smoky-mountain-open/?emulator=1', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 15000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);
// dismiss any live intro, then jump straight to the caddy-pick beat (beat 7)
await page.evaluate(() => { var i = document.getElementById('pbIntro'); if (i) i.remove(); if (window.pbWalk && window.pbWalk.runFtue) window.pbWalk.runFtue(7); });
await page.waitForTimeout(1000);
await page.screenshot({ path: OUT + '/caddy-default.png' }); console.log('shot caddy-default (The Caddy)');
for (const id of ['oldtom', 'birdie', 'caddy']) {
  const clicked = await page.evaluate((cid) => { var btn = document.querySelector('.pbw-caddie-pick[data-id="' + cid + '"]'); if (btn && !btn.disabled) { btn.click(); return true; } return false; }, id);
  await page.waitForTimeout(900);
  await page.screenshot({ path: OUT + '/caddy-' + id + '.png' }); console.log('shot caddy-' + id, 'clicked=' + clicked);
}
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify([...new Set(errs)])) : 'no page errors');
await b.close(); process.exit(0);
