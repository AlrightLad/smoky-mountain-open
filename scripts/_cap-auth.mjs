// Authenticated visual capture via the PUBLIC staging URL (bypasses the wedged
// localhost). The staging-hosted bundle auths against the PROD Firebase project,
// so the real SMOKE_EMAIL/PASSWORD prod creds sign in and load real data. Usage:
//   node scripts/_cap-auth.mjs <route> [label] [theme]
// Captures full-page desktop + iPhone into .claude/state/cap-<label>/.
import { chromium, devices } from 'playwright';
import { readFileSync, mkdirSync, existsSync } from 'fs';
(function loadEnv(){ try { readFileSync('.env.local','utf8').split(/\r?\n/).forEach(function(l){l=l.trim();if(!l||l[0]==='#')return;var e=l.indexOf('=');if(e<1)return;var k=l.slice(0,e).trim(),v=l.slice(e+1).trim().replace(/^["']|["']$/g,'');if(!process.env[k])process.env[k]=v;});} catch(e){} })();

const ROUTE = process.argv[2] || 'shop';
const LABEL = process.argv[3] || ROUTE;
const THEME = process.argv[4] || '';
const EMAIL = process.env.SMOKE_EMAIL, PASS = process.env.SMOKE_PASSWORD;
if (!EMAIL || !PASS) { console.error('SMOKE creds missing'); process.exit(1); }
const OUT = '.claude/state/cap-' + LABEL;
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
async function shoot(tag, deviceOpts) {
  const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, deviceOpts));
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen','1'); sessionStorage.setItem('pb_wt_routed','1'); } catch(e){} });
  await page.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  try {
    await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
    await page.evaluate(async (c) => { await window.auth.signInWithEmailAndPassword(c.e, c.p); }, { e: EMAIL, p: PASS });
    await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
  } catch (e) { console.log(tag + ' sign-in note:', e.message.slice(0, 100)); }
  await page.waitForTimeout(1200);
  // Dismiss the tee-shot intro overlay (a real sign-in re-arms it by design, so
  // it covers the page in a full-page capture). Tear it down before navigating.
  await page.evaluate(() => { try { if (window.pbTeeIntro && window.pbTeeIntro.skip) window.pbTeeIntro.skip(); var el = document.getElementById('pbIntro'); if (el) el.remove(); } catch (e) {} });
  await page.waitForTimeout(500);
  if (THEME) { await page.evaluate((t) => { if (window.applyTheme) window.applyTheme(t); }, THEME); await page.waitForTimeout(400); }
  await page.evaluate((r) => { if (window.Router && window.Router.go) window.Router.go(r); }, ROUTE);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/${LABEL}-${tag}.png`, fullPage: true });
  const info = await page.evaluate(() => ({ items: document.querySelectorAll('.shop-item').length, page: (window.Router && window.Router.getPage) ? window.Router.getPage() : '?' }));
  console.log(`${tag} → ${JSON.stringify(info)}`);
  await ctx.close();
}
await shoot('desktop', { viewport: { width: 1366, height: 1024 }, deviceScaleFactor: 1 });
await shoot('iphone', devices['iPhone 13']);
await b.close();
console.log('done → ' + OUT);
