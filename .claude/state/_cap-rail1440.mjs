// Verify the CRITICAL right-rail clipping at 1440 (FIX-QUEUE #1). Authed home +
// standings at 1440 wide; screenshot the right edge region.
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync } from 'fs';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('no prod SA'); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
const OUT = '.claude/state/cap-rail1440'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
for (const route of ['home', 'standings']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
  await page.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
  await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
  await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
  await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
  await page.waitForTimeout(2500);
  await page.evaluate((r) => window.Router && window.Router.go && window.Router.go(r), route);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${route}-1440.png` });
  // also report any element overflowing the viewport right edge
  const over = await page.evaluate(() => {
    const vw = window.innerWidth, bad = [];
    document.querySelectorAll('#mainApp *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1 && r.left < vw) {
        const cls = (el.className && el.className.toString) ? el.className.toString().slice(0, 40) : '';
        bad.push(el.tagName + '.' + cls + ' right=' + Math.round(r.right));
      }
    });
    return { vw, count: bad.length, sample: bad.slice(0, 8) };
  });
  console.log(route, JSON.stringify(over));
  await ctx.close();
}
await b.close();
console.log('done →', OUT);
