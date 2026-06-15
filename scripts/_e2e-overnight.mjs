// Overnight E2E function + evidence sweep (Founder 2026-06-15 overnight ask).
// Signs in as a given member via custom token (test user OR the real Founder),
// walks EVERY route, SCREENSHOTS each as proof, captures console errors / broken
// states, and inventories every button/tappable per page (presence + a dead-control
// check — the #39 "every button works" floor). SAFE-ONLY: renders + navigates +
// opens; does NOT fire destructive/shared-prod writes (post round, set bounty,
// delete) — those mutate PROD data through the staging bundle and need the emulator.
//
//   node scripts/_e2e-overnight.mjs <uid> <label>
//
// Output: .claude/state/e2e-overnight/<label>/<route>.png + _report.json
import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const UID = process.argv[2] || '1fwuewlis6Yvrtvlk7m0I3rRYwQ2';
const LABEL = process.argv[3] || 'testuser';
const URL = 'https://parbaughs-staging.web.app/';
const SA = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA)) { console.error('MISSING ' + SA); process.exit(3); }
const OUT = '.claude/state/e2e-overnight/' + LABEL;
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  'home', 'playnow', 'rounds', 'standings', 'members', 'feed', 'chat', 'shop',
  'merch', 'settings', 'richlist', 'courses', 'wagers', 'bounties', 'challenges',
  'trips', 'scramble', 'records', 'seasonrecap', 'trophyroom', 'drills', 'teetimes',
  'aces', 'awards', 'social', 'leagues',
  // v8.25.199 convergence-marathon: extend to the remaining safe top-level routes
  // (param-routes like round/scorecard/dm-thread/scramble-live need context, skipped here).
  'activity', 'caddynotes', 'calendar', 'dms', 'faq', 'findplayers', 'partygames',
  'profile', 'profile-edit', 'range', 'rules', 'roundhistory', 'wrapped', 'tournament', 'bugreport'
];

const admin = (await import('firebase-admin')).default;
const sa = JSON.parse((await import('fs')).readFileSync(SA, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken(UID);

// VIEWPORT env: 'desktop' (HQ, 1440x900) or default mobile (430x932) — directive #4
// (HQ gets the same critique + E2E as mobile).
const VP = process.env.VIEWPORT === 'desktop' ? { width: 1440, height: 900 } : { width: 430, height: 932 };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: VP, serviceWorkers: 'block', deviceScaleFactor: 2 });
const page = await ctx.newPage();
let errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));

await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
await page.goto(URL + '?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); var el = document.getElementById('pbIntro'); if (el) el.remove(); } catch (e) {} });
await page.waitForTimeout(4500); // league listeners hydrate

const results = [];
for (const r of ROUTES) {
  errors = [];
  let info = { route: r, ok: false };
  try {
    await page.evaluate((rt) => { if (window.Router && window.Router.go) window.Router.go(rt); }, r);
    // Wait for the ACTIVE page container to settle (async data-loading pages —
    // profile/tournament/etc. — populate after nav; a fixed 1600ms snapshot caught
    // them empty = false FAIL while the screenshot caught them full). Poll the real
    // router container (#mainApp [data-page=rt]) until it has content, cap 5s.
    await page.waitForFunction(() => {
      // Measure the ACTIVE (un-hidden) router container — NOT [data-page=rt],
      // because several routes REDIRECT (profile→members{id}, etc.) so the named
      // container stays empty while content renders into the real active one.
      var el = document.querySelector('#mainApp [data-page]:not(.hidden)');
      return el && (el.innerText || '').trim().length > 60;
    }, null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    info = await page.evaluate((rt) => {
      // The visible active container (handles redirect-routes); fall back to the
      // named container, then the shell.
      var el = document.querySelector('#mainApp [data-page]:not(.hidden)') || document.querySelector('#mainApp [data-page="' + rt + '"]') || document.getElementById('mainApp');
      var txt = el ? (el.textContent || '').trim() : '';
      var html = el ? el.innerHTML : '';
      var isSpinner = /class="loading"|class="spinner"/.test(html) && txt.length < 40;
      // tightened (2026-06-15): only CLEAR broken-state strings. The earlier
      // /failed to|NaN/ over-flagged innocuous copy (shop + home fallback render fine).
      var isError = /Something went wrong|Couldn.t load|\[object Object\]|undefined is not a|is not a function|TypeError|ReferenceError/i.test(txt);
      // button/tappable inventory — presence + dead-control check (no onclick/href/handler)
      var ctrls = Array.prototype.slice.call((el || document).querySelectorAll('button,[onclick],.tappable,[role="button"],a[href]'));
      var dead = ctrls.filter(function (c) {
        var hasClick = c.getAttribute('onclick') || c.href || c.onclick || c.getAttribute('data-action') ||
          c.className.indexOf('tappable') !== -1 || c.closest('[onclick]');
        return !hasClick && c.tagName === 'BUTTON' && !c.disabled && !c.type;
      });
      return { route: rt, len: txt.length, isSpinner: isSpinner, isError: isError, controls: ctrls.length, deadControls: dead.length };
    }, r);
    info.consoleErrors = errors.slice();
    info.ok = info.len > 30 && !info.isSpinner && !info.isError;
    await page.screenshot({ path: OUT + '/' + r + '.png', fullPage: true });
  } catch (e) { info.err = String(e).slice(0, 160); info.ok = false; }
  results.push(info);
}

const pass = results.filter(r => r.ok).length;
const report = { user: LABEL, uid: UID, routes: results.length, pass, fail: results.length - pass, results };
writeFileSync(OUT + '/_report.json', JSON.stringify(report, null, 2));
console.log('E2E SWEEP (' + LABEL + ' / ' + UID.slice(0, 8) + '): ' + pass + ' OK / ' + (results.length - pass) + ' issues of ' + results.length);
for (const r of results) {
  if (!r.ok || (r.consoleErrors && r.consoleErrors.length) || r.deadControls) {
    var n = [];
    if (r.isSpinner) n.push('SPINNER'); if (r.isError) n.push('ERROR-STATE'); if (r.err) n.push('THREW:' + r.err);
    if (r.deadControls) n.push(r.deadControls + ' dead-ctrl'); if (r.consoleErrors && r.consoleErrors.length) n.push(r.consoleErrors.length + ' console-err');
    console.log('  [' + (r.ok ? 'WARN' : 'FAIL') + '] ' + r.route.padEnd(12) + ' ctrls=' + (r.controls || 0) + (n.length ? ' · ' + n.join(' · ') : ''));
    (r.consoleErrors || []).slice(0, 2).forEach(e => console.log('         ! ' + e));
  }
}
console.log('screenshots → ' + OUT);
await b.close();
process.exit(0);
