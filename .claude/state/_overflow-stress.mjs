// #72 STRESS — the body doesn't overflow for the test user, so the Founder's
// "running off the edges" is data-dependent: a long name/username/course string
// in a flex row missing min-width:0/ellipsis. Inject a long unbreakable token
// into name-like elements and report which container breaks past the viewport.
import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'fs';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('no prod SA'); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
const ROUTES = (process.argv[2] || 'profile,standings,feed,chat,more,settings,richlist,records,courses,trips,teetimes').split(',');
const LONG = 'Bartholomewxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 360, height: 850 }, serviceWorkers: 'block', deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
await page.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 15000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
await page.waitForTimeout(2500);
// Validate the #72 fix without a deploy: inject the candidate guard CSS.
if (process.env.WITH_FIX) {
  await page.addStyleTag({ content: '#mainApp{overflow-wrap:anywhere}#mainApp [class*="row"],#mainApp [class*="card"],#mainApp [class*="item"],#mainApp [class*="__main"],#mainApp [class*="__name"],#mainApp [class*="-name"],#mainApp [class*="-info"],#mainApp [class*="__info"],#mainApp [class*="__head"],#mainApp [class*="-head"],#mainApp [class*="__body"],#mainApp [class*="-left"],#mainApp [class*="-right"],#mainApp [class*="__col"],#mainApp [class*="__meta"]{min-width:0}' });
  console.log('[fix injected]');
}
for (const r of ROUTES) {
  try {
    await page.evaluate((rt) => window.Router && window.Router.go && window.Router.go(rt), r);
    await page.waitForTimeout(900);
    const res = await page.evaluate((LONG) => {
      // Inject the long token into likely name/username/value leaf elements.
      const SEL = '[class*="name" i],[class*="user" i],[class*="title" i],[class*="player" i],[class*="member" i],[class*="course" i],[class*="league" i],[class*="handle" i],h1,h2,h3';
      let injected = 0;
      document.querySelectorAll('#mainApp ' + SEL).forEach(el => {
        // only leaf-ish text holders, skip if has element children with text
        if (el.children.length === 0 && el.textContent && el.textContent.trim().length > 0 && el.textContent.length < 40) { el.textContent = LONG; injected++; }
      });
      // measure overflow origins
      const vw = document.documentElement.clientWidth;
      const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      const off = [];
      for (const el of document.querySelectorAll('#mainApp *')) {
        const rc = el.getBoundingClientRect();
        if (rc.width < 2 || rc.height < 2) continue;
        if (rc.right > vw + 2 || rc.left < -2) {
          const p = el.parentElement; const pr = p ? p.getBoundingClientRect() : { right: vw, left: 0 };
          // skip known-intentional off-canvas / scroll-rail / a11y-skip
          const cls = (el.getAttribute('class') || '');
          if (/notif-panel|-skip|shop-shelf__rail|shop-item|drawer|sheet|modal|toast/i.test(cls)) continue;
          if (pr.right <= vw + 2 && pr.left >= -2) off.push({ tag: el.tagName, cls: cls.slice(0, 46), w: Math.round(rc.width), R: Math.round(rc.right) });
        }
      }
      return { vw, docW, hScroll: docW - vw, injected, off: off.slice(0, 10) };
    }, LONG);
    const flag = res.hScroll > 2 ? ' ⚠ H-SCROLL +' + res.hScroll : ' (no page scroll)';
    console.log(`[${r}] injected=${res.injected}${flag}` + (res.off.length ? '' : '  ✓ no broken containers'));
    res.off.forEach(o => console.log(`    <${o.tag} class="${o.cls}"> w=${o.w} R=${o.R}`));
  } catch (e) { console.log(`[${r}] ERR ${String(e).slice(0, 70)}`); }
}
await b.close();
console.log('\ndone');
