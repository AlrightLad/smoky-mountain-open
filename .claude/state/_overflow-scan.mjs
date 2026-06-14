// #72 DIAGNOSTIC — Founder: "content running off the edges". Sign in as a
// member, visit every route at narrow mobile widths, and report the elements
// whose box extends past the viewport (the overflow ORIGIN = parent fits but
// child breaks out). Catches the structural cause regardless of which user.
import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'fs';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('no prod SA'); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
const WIDTHS = [390, 360];
const ROUTES = (process.argv[2] || 'feed,profile,standings,courses,trips,chat,wagers,bounties,challenges,calendar,teetimes,scramble,trophyroom,more,leagues,shop,settings,richlist,records,wrapped').split(',');
const b = await chromium.launch();
for (const W of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width: W, height: 850 }, serviceWorkers: 'block', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
  await page.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 15000 });
  await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
  await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
  await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
  await page.waitForTimeout(2500);
  console.log(`\n========== VIEWPORT ${W}px ==========`);
  for (const r of ROUTES) {
    try {
      await page.evaluate((rt) => window.Router && window.Router.go && window.Router.go(rt), r);
      await page.waitForTimeout(900);
      const res = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const offenders = [];
        const all = document.querySelectorAll('#mainApp *');
        for (const el of all) {
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          if (r.right > vw + 2 || r.left < -2) {
            const p = el.parentElement; const pr = p ? p.getBoundingClientRect() : { right: vw, left: 0 };
            const isOrigin = (pr.right <= vw + 2 && pr.left >= -2);
            if (isOrigin) offenders.push({ tag: el.tagName, cls: (el.getAttribute('class') || '').slice(0, 46), right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width), txt: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34) });
          }
        }
        return { vw, docW, hScroll: docW - vw, offenders: offenders.slice(0, 8) };
      });
      const flag = res.hScroll > 2 ? ' ⚠ H-SCROLL +' + res.hScroll : '';
      console.log(`[${r}] vw=${res.vw} docW=${res.docW}${flag}` + (res.offenders.length ? '' : '  ok'));
      res.offenders.forEach(o => console.log(`    <${o.tag} class="${o.cls}"> w=${o.w} L=${o.left} R=${o.right} :: "${o.txt}"`));
    } catch (e) { console.log(`[${r}] ERR ${String(e).slice(0, 60)}`); }
  }
  await ctx.close();
}
await b.close();
console.log('\ndone');
