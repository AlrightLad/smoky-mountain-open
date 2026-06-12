import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT = '.claude/state/visual-9.5-2026-06-12/verify';
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
await page.goto('http://localhost:5173/smoky-mountain-open/?emulator=1');
await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 12000 });
await page.evaluate(async (t) => { try { sessionStorage.setItem('pb_intro_seen','1'); } catch(e){} await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 }).catch(()=>{});
await page.waitForTimeout(2500);
for (const p of ['home','scramble','shop']) {
  await page.evaluate((n) => { var i=document.getElementById('pbIntro'); if(i) i.remove(); Router.go(n); }, p);
  await page.waitForTimeout(1400);
  await page.evaluate(() => { var i=document.getElementById('pbIntro'); if(i) i.remove(); });
  await page.screenshot({ path: OUT + '/' + p + '.png', fullPage: false });  // viewport only (no fixed-nav stitch artifact)
}
console.log('verify captures done: home, scramble, shop (viewport, intro removed)');
await b.close(); process.exit(0);
