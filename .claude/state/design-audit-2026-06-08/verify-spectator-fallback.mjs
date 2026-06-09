// Exercise the spectator !round defensive fallback directly (the in-prod path is
// unreachable via normal nav), to vision-verify the friendly empty state renders.
import { chromium } from 'playwright';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 12000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.evaluate((r) => Router.go(r), 'feed');
await page.waitForTimeout(1000);

const res = await page.evaluate(() => {
  if (typeof _renderSpectatorHUDShell !== 'function') return { ok: false, why: 'fn not global' };
  const html = _renderSpectatorHUDShell(null);
  const main = document.getElementById('mainApp') || document.body;
  main.innerHTML = '<div style="padding:16px">' + html + '</div>';
  return { ok: true, len: html.length, hasEmpty: /class="empty"/.test(html), hasLink: /Router.go\('rounds'\)/.test(html) };
});
await page.waitForTimeout(400);
await page.screenshot({ path: '.claude/state/design-audit-2026-06-08/verify/spectator-fallback.png', fullPage: false });
await b.close();
console.log(JSON.stringify(res));
