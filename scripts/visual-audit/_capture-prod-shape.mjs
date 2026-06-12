import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT = '.claude/state/visual-9.5-2026-06-12';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const ZACH = '1GE683EauXO8TVhcStKfWiCCcRl2';
const token = await admin.auth().createCustomToken(ZACH);
const PAGES = ['profile','members','chat','dms','wrapped','partygames','aces','trips'];
const b = await chromium.launch();
const ctx = await b.newContext(devices['iPhone 14 Pro']);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0,80)));
await page.goto('http://localhost:5173/smoky-mountain-open/?emulator=1');
await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 12000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 }).catch(()=>{});
await page.waitForTimeout(2500);
const done = [];
for (const p of PAGES) {
  try {
    await page.evaluate((n) => Router.go(n), p);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: OUT + '/' + p + '.png', fullPage: true });
    done.push(p);
  } catch(e) { errs.push(p+': '+e.message.slice(0,50)); }
}
console.log('captured: ' + done.join(', '));
if (errs.length) console.log('errors: ' + errs.slice(0,8).join(' | '));
await b.close(); process.exit(0);
