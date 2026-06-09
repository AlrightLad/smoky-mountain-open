// Re-capture the surfaces touched by the contrast sweep, post-edit, to vision-verify
// the fixes landed on the rendered surface (V1). Dev server HMR serves the working tree.
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT = '.claude/state/design-audit-2026-06-08/verify';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

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
await page.waitForTimeout(1200);

for (const s of ['feed', 'settings', 'awards', 'spectator']) {
  await page.evaluate((r) => Router.go(r), s);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/${s}.png`, fullPage: false });
  console.log('  ✓ ' + s);
}
// Re-measure the two text elements to confirm computed color changed
const m = await page.evaluate(() => {
  function eff(el){ while(el){ const c=getComputedStyle(el).backgroundColor; if(c && c!=='rgba(0, 0, 0, 0)' && c!=='transparent') return c; el=el.parentElement; } return 'none'; }
  const out = {};
  Router.go('feed');
  return out;
});
await page.evaluate((r) => Router.go(r), 'feed'); await page.waitForTimeout(1000);
const feedC = await page.evaluate(() => { const e=document.querySelector('.feed-composer__promptText'); return e?getComputedStyle(e).color:'n/a'; });
await page.evaluate((r) => Router.go(r), 'settings'); await page.waitForTimeout(1000);
const setC = await page.evaluate(() => { const e=document.querySelector('.set-row__desc'); return e?getComputedStyle(e).color:'n/a'; });
console.log('feed composer color now:', feedC, '(expect rgb(95, 92, 80) = ink-faint)');
console.log('settings desc color now:', setC, '(expect rgb(95, 92, 80) = ink-faint)');
await b.close();
console.log('verify → ' + OUT);
