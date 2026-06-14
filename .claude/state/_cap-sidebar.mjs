// Desktop (reading-room sidebar) capture to verify the brandmark in the rail.
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync } from 'fs';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('no prod SA'); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
const OUT = '.claude/state/cap-sidebar'; mkdirSync(OUT, { recursive: true });
const URL = 'https://parbaughs-staging.web.app/';
const b = await chromium.launch();
for (const theme of ['clubhouse', 'azalea']) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'block', deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await page.addInitScript((th) => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); localStorage.setItem('pb_theme', th); } catch (e) {} }, theme);
  await page.goto(URL + '?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
  await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
  await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
  await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
  await page.waitForTimeout(2500);
  const el = await page.$('.rr-sidebar__mark');
  if (el) { await el.screenshot({ path: `${OUT}/mark-${theme}.png` }); }
  await page.screenshot({ path: `${OUT}/full-${theme}.png` });
  await ctx.close();
  console.log('captured', theme);
}
await b.close();
console.log('done →', OUT);
