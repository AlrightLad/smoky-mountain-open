import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const THEME = process.env.PB_THEME || 'default';
const OUT = '.claude/state/visual-9.5-2026-06-12/verify-v15' + (THEME === 'default' ? '' : '-' + THEME);
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
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await page.goto('http://localhost:5173/smoky-mountain-open/?emulator=1', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 15000 });
await page.evaluate(async (t) => { try { sessionStorage.setItem('pb_intro_seen','1'); } catch(e){} await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 }).catch(()=>{});
await page.waitForTimeout(2500);
if (THEME !== 'default') {
  await page.evaluate((t) => { try { if (window.PB && PB.setTheme) PB.setTheme(t); else document.documentElement.setAttribute('data-theme', t); } catch(e){} }, THEME);
  await page.waitForTimeout(800);
}
const PAGES = ['home','records','trophyroom','shop','settings','teetimes','standings','calendar','feed','more'];
for (const p of PAGES) {
  try {
    await page.evaluate((n) => { var i=document.getElementById('pbIntro'); if(i) i.remove(); Router.go(n); }, p);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { var i=document.getElementById('pbIntro'); if(i) i.remove(); });
    await page.screenshot({ path: OUT + '/' + p + '.png', fullPage: false });
    console.log('captured', p);
  } catch (e) { console.log('FAIL', p, String(e).slice(0,120)); }
}
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify([...new Set(errs)])) : 'no page errors');
console.log('theme=' + THEME + ' -> ' + OUT);
await b.close(); process.exit(0);
