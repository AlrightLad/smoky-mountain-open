// W4.S2 3r Hole Heat Map capture (CLUBHOUSE_SPEC-HQ-3r).
// Reuses the emulator + custom-token auth path from capture-w1-3d-leaderboard.mjs.
//
// P9 note: the committed seed fixtures (tests/e2e/setup/fixtures/rounds.js) carry
// holePars but never holeScores, so calcCourseBreakdown() returns null for every
// seed user and only the LOCKED heat-map state is seed-renderable. To verify the
// POPULATED state against honest, real Firestore data we inject three
// holeScores-bearing rounds at runtime, directly into the emulator's `rounds`
// collection (fixed ids -> idempotent overwrite). Nothing here touches the
// committed fixtures, so the E2E production-push gate is unaffected.
//
//   CAPTURE_DEVICE  Playwright device descriptor (e.g. "iPhone 14 Pro", "Pixel 7")
//   CAPTURE_OUT     output directory
//   CAPTURE_URL     app origin (default http://localhost:5173)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = process.env.CAPTURE_OUT || '.claude/state/design-iteration/2026-06-06-w4s2-heatmap/desktop';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const URL = process.env.CAPTURE_URL || 'http://localhost:5173';

const DEVICE = process.env.CAPTURE_DEVICE;
const ctxOptions = (DEVICE && devices[DEVICE])
    ? devices[DEVICE]
    : { viewport: { width: 1440, height: 900 } };
const label = (DEVICE && devices[DEVICE]) ? DEVICE : 'desktop 1440x900';

// ── Inject honest hole-by-hole rounds into the emulator (real Firestore data) ──
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });

// par 72: two par-3s + two par-5s per nine
const HOLE_PARS = [4,4,3,5,4,4,3,5,4, 4,4,3,5,4,4,3,5,4];
// Three rounds engineered to span all three tiers + a steady/streaky mix.
const HOLE_SCORES = [
  [5,4,2,7,4,5,4,6,5, 4,5,3,6,4,5,4,6,4],
  [4,5,2,6,5,4,3,7,4, 5,5,4,5,5,4,3,5,5],
  [5,4,3,6,4,6,4,6,4, 4,4,3,7,4,5,3,6,4],
];
const DATES = ['2026-05-16', '2026-05-23', '2026-05-30'];
const sum = (a) => a.reduce((x, y) => x + y, 0);

const db = admin.firestore();
for (let i = 0; i < HOLE_SCORES.length; i++) {
  const hs = HOLE_SCORES[i];
  await db.collection('rounds').doc('hm_verify_a' + (i + 1)).set({
    id: 'hm_verify_a' + (i + 1),
    player: 'test_zach_uid_01',
    playerName: 'Test Zach',
    course: 'Test Course A',
    date: DATES[i],
    score: sum(hs),
    holesPlayed: 18,
    format: 'stroke',
    holePars: HOLE_PARS,
    holeScores: hs,
    // leagueQuery("rounds") filters by leagueId; testZach.activeLeague = test-league-01.
    // Without this the app's loadRoundsFromFirestore() drops these rounds from state.rounds.
    leagueId: 'test-league-01',
  });
}
console.log('Injected 3 hole-by-hole rounds at Test Course A (scores ' + HOLE_SCORES.map(sum).join('/') + ')');

const token = await admin.auth().createCustomToken('test_zach_uid_01');

// ── Browser ──
const b = await chromium.launch();
const ctx = await b.newContext(ctxOptions);
const page = await ctx.newPage();
console.log('Capturing heat map at ' + label + ' -> ' + OUT);

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

await page.goto(URL + '/?emulator=1');
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(1500);

async function gotoRoundHistory(course) {
  await page.evaluate((c) => { window._rhFilter = 'all'; window._rhCourse = c; Router.go('roundhistory', {}, true); }, course);
  await page.waitForTimeout(900);
}

// 1) Populated heat map (Test Course A, 3 hole-by-hole rounds)
await gotoRoundHistory('Test Course A');
try { await page.waitForSelector('.hm:not(.hm--locked) .hm-cell:not(.hm-cell--empty)', { timeout: 8000 }); }
catch (e) { console.log('  WARN populated heat map cells did not appear: ' + e.message.slice(0, 70)); }
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + '/rh-heatmap-populated.png', fullPage: true });

const hmDiag = await page.evaluate(() => {
  const hm = document.querySelector('.hm:not(.hm--locked)');
  if (!hm) return { found: false };
  const cells = hm.querySelectorAll('.hm-cell:not(.hm-cell--empty)');
  const tiers = { under: 0, par: 0, over: 0 };
  cells.forEach((c) => { if (c.classList.contains('hm-cell--under')) tiers.under++; else if (c.classList.contains('hm-cell--over')) tiers.over++; else tiers.par++; });
  const stats = Array.from(hm.querySelectorAll('.hm__stat-val')).map((s) => s.textContent);
  const course = (hm.querySelector('.hm__course') || {}).textContent || '';
  const numsOn = hm.classList.contains('hm--nums');
  return { found: true, cellCount: cells.length, tiers, stats, course, numsOn };
});
console.log('  hmDiag: ' + JSON.stringify(hmDiag));

// 2) Cell-detail bottom sheet (click the first scored cell)
try {
  await page.click('.hm:not(.hm--locked) .hm-cell:not(.hm-cell--empty)', { timeout: 4000 });
  await page.waitForSelector('.hm-detail', { timeout: 5000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT + '/rh-heatmap-celldetail.png', fullPage: true });
  const detDiag = await page.evaluate(() => {
    const d = document.querySelector('.hm-detail');
    if (!d) return { found: false };
    return {
      found: true,
      avg: (d.querySelector('.hm-detail__avg') || {}).textContent || '',
      strip: Array.from(d.querySelectorAll('.hm-detail__v')).map((v) => v.textContent),
      rounds: d.querySelectorAll('.hm-detail__round').length,
      links: d.querySelectorAll('.hm-detail__round--link').length,
    };
  });
  console.log('  detDiag: ' + JSON.stringify(detDiag));
  await page.evaluate(() => { if (typeof closeBottomSheet === 'function') closeBottomSheet(); });
  await page.waitForTimeout(500);
} catch (e) { console.log('  WARN cell-detail capture failed: ' + e.message.slice(0, 70)); }

// 3) Locked state (Test Course B has no hole-by-hole rounds)
await gotoRoundHistory('Test Course B');
try { await page.waitForSelector('.hm--locked', { timeout: 6000 }); }
catch (e) { console.log('  WARN locked heat map did not appear: ' + e.message.slice(0, 70)); }
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + '/rh-heatmap-locked.png', fullPage: true });
const lockDiag = await page.evaluate(() => {
  const l = document.querySelector('.hm--locked');
  if (!l) return { found: false };
  return { found: true, title: (l.querySelector('.hm__lock-title') || {}).textContent || '', progress: (l.querySelector('.hm__lock-progress') || {}).textContent || '' };
});
console.log('  lockDiag: ' + JSON.stringify(lockDiag));

// 4) Profile (members?id=) heat map — Stats-surface integration.
// The heat map renders inside the profile's STATS tab (#ptab-stats), which is
// display:none by default (Overview is the landing tab). Activate Stats first,
// then target #ptab-stats .hm so we don't match the leftover roundhistory locked
// heat map living in the now-hidden roundhistory page container.
await page.evaluate(() => Router.go('members', { id: 'test_zach_uid_01' }));
try {
  await page.waitForSelector('#ptab-stats', { state: 'attached', timeout: 8000 });
  // Own-profile view triggers a one-time stats-materialization write -> member-doc
  // onSnapshot -> renderMemberDetailWithData re-render, which resets the tab to the
  // Overview default (#ptab-stats back to display:none). Let that settle, then
  // activate-and-shoot in a retry loop so a stray re-render can't win the race.
  await page.waitForTimeout(3000);
  var shotOk = false;
  for (var attempt = 0; attempt < 6 && !shotOk; attempt++) {
    var sized = await page.evaluate(() => {
      document.querySelectorAll('[data-ptab]').forEach((e) => { e.style.display = 'none'; });
      var stats = document.getElementById('ptab-stats');
      if (!stats) return false;
      stats.style.display = 'block';
      var hm = stats.querySelector('.hm');
      if (!hm) return false;
      hm.scrollIntoView({ block: 'center' });
      var r = hm.getBoundingClientRect();
      return r.width > 50 && r.height > 50;
    });
    if (sized) {
      try {
        await page.locator('#ptab-stats .hm').first().screenshot({ path: OUT + '/profile-heatmap.png', timeout: 3000 });
        shotOk = true;
      } catch (_) { await page.waitForTimeout(400); }
    } else { await page.waitForTimeout(400); }
  }
  const profDiag = await page.evaluate(() => {
    const hm = document.querySelector('#ptab-stats .hm');
    const r = hm ? hm.getBoundingClientRect() : null;
    return { found: !!hm, locked: hm ? hm.classList.contains('hm--locked') : null, course: hm ? ((hm.querySelector('.hm__course') || {}).textContent || '') : '', size: r ? Math.round(r.width) + 'x' + Math.round(r.height) : 'n/a' };
  });
  console.log('  profDiag(shotOk=' + shotOk + '): ' + JSON.stringify(profDiag));
} catch (e) { console.log('  WARN profile heat map did not appear: ' + e.message.slice(0, 70)); }

console.log('  consoleErrors(' + consoleErrors.length + '): ' + JSON.stringify(consoleErrors.slice(0, 8)));
await b.close();
console.log('done -> ' + OUT);
