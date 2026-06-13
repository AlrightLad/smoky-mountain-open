// Closeout regression sweep: sign in as a real member, navigate EVERY member
// route, and report per-route render health — container non-empty, no error
// state, and any console errors/page exceptions. Text output only (no image
// reads) so it's cheap to run after a big batch of ships. This is the
// programmatic floor of the "every page ≥9.0 (renders cleanly)" re-rate; the
// visual 9.5 call stays the Founder's (AMD-028).
import { chromium } from 'playwright';
import { existsSync } from 'fs';

const UID = process.argv[2] || '1fwuewlis6Yvrtvlk7m0I3rRYwQ2';
const URL = 'https://parbaughs-staging.web.app/';
const SA = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA)) { console.error('MISSING ' + SA); process.exit(3); }

const ROUTES = [
  'home', 'rounds', 'standings', 'members', 'feed', 'shop', 'settings',
  'richlist', 'merch', 'courses', 'wagers', 'trips', 'scramble', 'records',
  'seasonrecap', 'trophyroom', 'playnow', 'chat', 'bounties', 'challenges',
  'drills', 'teetimes', 'aces', 'awards', 'social', 'leagues'
];

const admin = (await import('firebase-admin')).default;
const sa = JSON.parse((await import('fs')).readFileSync(SA, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken(UID);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, serviceWorkers: 'block', reducedMotion: 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 160)));

await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
await page.goto(URL + '?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
await page.waitForTimeout(4000); // league listeners hydrate

const results = [];
for (const r of ROUTES) {
  errors.length = 0;
  let info = { route: r, ok: false, len: 0, err: '' };
  try {
    await page.evaluate((rt) => { if (window.Router && window.Router.go) window.Router.go(rt); }, r);
    await page.waitForTimeout(1400);
    info = await page.evaluate((rt) => {
      // find the visible page container for this route
      var el = document.querySelector('[data-page="' + rt + '"]') ||
               document.querySelector('.page.active') ||
               document.getElementById('mainApp');
      var txt = el ? (el.textContent || '').trim() : '';
      var html = el ? el.innerHTML : '';
      var isSpinner = /class="loading"|class="spinner"/.test(html) && txt.length < 40;
      var isErrorState = /Something went wrong|Couldn.t load|failed to|undefined is not|\[object Object\]/i.test(txt);
      return { route: rt, len: txt.length, isSpinner: isSpinner, isErrorState: isErrorState };
    }, r);
    info.consoleErrors = errors.slice();
    info.ok = info.len > 30 && !info.isSpinner && !info.isErrorState;
  } catch (e) { info.err = String(e).slice(0, 120); }
  results.push(info);
}

let pass = 0, fail = 0;
console.log('ROUTE RENDER SWEEP (member ' + UID.slice(0, 8) + ', staging):');
for (const r of results) {
  var status = r.ok ? 'OK ' : 'FAIL';
  if (r.ok) pass++; else fail++;
  var notes = [];
  if (r.isSpinner) notes.push('STUCK-SPINNER');
  if (r.isErrorState) notes.push('ERROR-STATE');
  if (r.err) notes.push('THREW:' + r.err);
  if (r.consoleErrors && r.consoleErrors.length) notes.push(r.consoleErrors.length + ' console-err');
  console.log('  [' + status + '] ' + r.route.padEnd(12) + ' len=' + String(r.len || 0).padEnd(6) + (notes.length ? ' · ' + notes.join(' · ') : ''));
  if (r.consoleErrors && r.consoleErrors.length) r.consoleErrors.slice(0, 2).forEach(e => console.log('         ! ' + e));
}
console.log('\nSUMMARY: ' + pass + ' OK / ' + fail + ' FAIL of ' + results.length + ' routes');
await b.close();
process.exit(fail > 0 ? 1 : 0);
