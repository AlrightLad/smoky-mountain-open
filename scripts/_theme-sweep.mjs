// THEME × ROUTE sweep (Founder PL16: every page tested in every theme, with
// screenshot evidence). Signs in ONCE against staging (authed, real prod data),
// then loops all 7 themes × the key routes, applying each theme + navigating +
// capturing. Output → .claude/state/theme-sweep/{theme}__{route}.png (iPhone).
// Run: node scripts/_theme-sweep.mjs
import { chromium, devices } from 'playwright';
import { readFileSync, mkdirSync, existsSync } from 'fs';
(function loadEnv(){ try { readFileSync('.env.local','utf8').split(/\r?\n/).forEach(function(l){l=l.trim();if(!l||l[0]==='#')return;var e=l.indexOf('=');if(e<1)return;var k=l.slice(0,e).trim(),v=l.slice(e+1).trim().replace(/^["']|["']$/g,'');if(!process.env[k])process.env[k]=v;});} catch(e){} })();
const EMAIL = process.env.SMOKE_EMAIL, PASS = process.env.SMOKE_PASSWORD;
if (!EMAIL || !PASS) { console.error('SMOKE creds missing'); process.exit(1); }
const THEMES = ['clubhouse','twilight_links','linen_draft','azalea','champion_sunday','bourbon_room','course_record'];
const ROUTES = ['home','playnow','rounds','feed','members','courses','standings','scramble','wagers','bounties','partygames','shop','richlist','trophyroom','records','settings','trips','seasonrecap'];
const OUT = '.claude/state/theme-sweep';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, devices['iPhone 13']));
const page = await ctx.newPage();
await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen','1'); sessionStorage.setItem('pb_wt_routed','1'); } catch(e){} });
await page.goto('https://parbaughs-staging.web.app/?nocache=' + (Math.floor(1)), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
try {
  await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 15000 });
  await page.evaluate(async (c) => { await window.auth.signInWithEmailAndPassword(c.e, c.p); }, { e: EMAIL, p: PASS });
  await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 25000 });
} catch (e) { console.log('sign-in note:', e.message.slice(0,120)); }
await page.waitForTimeout(1500);
await page.evaluate(() => { try { if (window.pbTeeIntro && window.pbTeeIntro.skip) window.pbTeeIntro.skip(); var el = document.getElementById('pbIntro'); if (el) el.remove(); } catch (e) {} });
let ok = 0, fail = 0;
for (const t of THEMES) {
  await page.evaluate((th) => { if (window.applyTheme) window.applyTheme(th); }, t);
  await page.waitForTimeout(350);
  for (const r of ROUTES) {
    try {
      await page.evaluate((rt) => { if (window.Router && window.Router.go) window.Router.go(rt); }, r);
      await page.waitForTimeout(1400);
      await page.screenshot({ path: `${OUT}/${t}__${r}.png`, fullPage: true });
      ok++;
    } catch (e) { console.log(`FAIL ${t}/${r}: ${e.message.slice(0,80)}`); fail++; }
  }
  console.log(`theme ${t} done`);
}
await ctx.close();
await b.close();
console.log(`\nTHEME SWEEP done: ${ok} captured / ${fail} failed → ${OUT}/  (${THEMES.length} themes x ${ROUTES.length} routes)`);
