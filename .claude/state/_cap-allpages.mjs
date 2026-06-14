// Batch page-capture: sign in ONCE as a member, navigate to many routes, shoot
// each. Foundation of the "all pages to 9.5" pass — triage which read bland.
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync } from 'fs';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('no prod SA'); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
const OUT = '.claude/state/allpages'; mkdirSync(OUT, { recursive: true });
const ROUTES = (process.argv[2] || 'feed,profile,courses,trips,chat,wagers,bounties,challenges,calendar,teetimes,scramble,trophyroom,more,leagues,partygames,drills').split(',');
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, serviceWorkers: 'block', deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
await page.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 15000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
await page.waitForTimeout(4000);
for (const r of ROUTES) {
  try {
    await page.evaluate((rt) => window.Router && window.Router.go && window.Router.go(rt), r);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${OUT}/${r}.png` });
    console.log('shot', r);
  } catch (e) { console.log('ERR', r, String(e).slice(0, 60)); }
}
await b.close();
console.log('done →', OUT);
