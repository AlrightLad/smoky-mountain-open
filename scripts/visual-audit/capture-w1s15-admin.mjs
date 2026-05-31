// W1.S15 Admin capture (CLUBHOUSE_SPEC-HQ-3i). Reuses the emulator +
// custom-token auth + profile-repair path from capture-w1s14-settings.mjs.
// Seeds a founder profile (so the 404 guard passes) plus enough peripheral
// data that the five auto-loaded sections render populated panels with pill +
// row + button variety: reports, members (founder/active/suspended), invites
// (active/used), one feature request, one error. Then drives Router.go('admin')
// and captures:
//   1. full        full page, founder, all sections populated
//   2. scrolled    scrolled to the invites section (desktop sticky-nav active)
//   3. notfound    non-founder profile → editorial 404 ("Nothing here.")
//
//   CAPTURE_OUT   base output dir (per-device subdir appended)
//   CAPTURE_PORT  dev-server port (default 5173)
//   CAPTURE_BASE  dev-server base (default /smoky-mountain-open/)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUTBASE = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s15-admin-2026-05-30';
const PORT = process.env.CAPTURE_PORT || '5173';
const BASE = process.env.CAPTURE_BASE || '/smoky-mountain-open/';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const adb = admin.firestore();
const UID = 'test_zach_uid_01';
const token = await admin.auth().createCustomToken(UID);
const LEAGUE = 'the-parbaughs';
const now = admin.firestore.Timestamp.now;
const tsFromMs = (ms) => admin.firestore.Timestamp.fromMillis(ms);

// ── Founder profile — passes isFounderRole guard; activeLeague scopes invites. ──
await adb.collection('members').doc(UID).set({
  id: UID, name: 'Zach Boogher', username: 'zach', platformRole: 'founder', role: 'commissioner',
  level: 7, handicap: 12.4, parcoins: 1240, maxInvites: 5, invitesUsed: 1,
  leagues: [LEAGUE], activeLeague: LEAGUE,
  createdAt: tsFromMs(Date.parse('2024-03-01T12:00:00Z'))
}, { merge: true });

// ── Two more members: an active member (stepper + moderation buttons) and a
//    suspended one (--bad pill + claret "Suspended until" line). ──
await adb.collection('members').doc('mbr_active_01').set({
  id: 'mbr_active_01', name: 'Marcus Reed', username: 'marc', platformRole: 'member', role: 'member',
  level: 4, maxInvites: 3, invitesUsed: 2, leagues: [LEAGUE], activeLeague: LEAGUE
}, { merge: true });
await adb.collection('members').doc('mbr_susp_01').set({
  id: 'mbr_susp_01', name: 'Davey Crews', username: 'davey', platformRole: 'suspended', role: 'member',
  level: 3, maxInvites: 3, invitesUsed: 0, leagues: [LEAGUE], activeLeague: LEAGUE,
  suspendedUntil: tsFromMs(Date.now() + 5 * 86400000),
  suspendedReason: 'Trash-talk channel cleanup'
}, { merge: true });

// ── Invites: one active (not expired → --ok + Revoke), one used (--warn). ──
await adb.collection('invites').doc('PB-7QK4MZ').set({
  code: 'PB-7QK4MZ', status: 'active', createdByName: 'Zach Boogher', leagueId: LEAGUE,
  createdAt: now(), expiresAt: tsFromMs(Date.now() + 14 * 86400000)
}, { merge: true });
await adb.collection('invites').doc('PB-2HN8RD').set({
  code: 'PB-2HN8RD', status: 'used', createdByName: 'Zach Boogher', leagueId: LEAGUE,
  usedBy: 'mbr_active_01', createdAt: tsFromMs(Date.now() - 6 * 86400000)
}, { merge: true });

// ── One feature request (new → --ok pill). ──
await adb.collection('feature_requests').doc('fr_01').set({
  request: 'Add a skins game mode for Sunday rounds.', status: 'new',
  fromName: 'Marcus Reed', createdAt: now()
}, { merge: true });

// ── One unresolved error (claret title + Resolve button). ──
await adb.collection('errors').doc('err_01').set({
  message: 'TypeError: cannot read properties of undefined (reading toDate)',
  stack: 'at loadFeed (feed.js:212)\n  at HTMLDivElement.<anonymous>', resolved: false,
  page: 'feed', userName: 'Davey Crews', timestamp: Date.now() - 3 * 3600000
}, { merge: true });

// ── One pending report (claret reason row in the first section). ──
await adb.collection('reports').doc('rep_01').set({
  reason: 'Inappropriate language', reportedUser: 'mbr_susp_01', reportedBy: 'mbr_active_01',
  details: 'Kept it up after a warning in the group thread.', resolved: false, createdAt: Date.now() - 7200000
}, { merge: true });

console.log('admin seed: founder ' + UID + ' + 2 members + 2 invites + 1 request + 1 error + 1 report | league ' + LEAGUE);

const VIEWPORTS = [
  { key: 'desktop', opts: { viewport: { width: 1440, height: 1000 } } },
  { key: 'iphone14', opts: devices['iPhone 14 Pro'] }
];

const b = await chromium.launch();
for (const v of VIEWPORTS) {
  const OUT = OUTBASE + '/' + v.key;
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  const ctx = await b.newContext(v.opts);
  await ctx.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  console.log('Capturing admin at ' + v.key + ' -> ' + OUT);
  page.on('pageerror', (e) => console.log('  [pageerror] ' + e.message));

  await page.goto('http://127.0.0.1:' + PORT + BASE + '?emulator=1', { waitUntil: 'commit', timeout: 90000 });
  await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 90000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.evaluate(async (uid) => {
    try { var md = await db.collection('members').doc(uid).get(); if (md.exists) currentProfile = md.data(); } catch (e) {}
  }, UID);

  // 1. Full — founder, all auto-loaded sections populated
  await page.evaluate(() => { try { Router.go('admin'); } catch (e) {} });
  await page.waitForFunction(() => !!document.querySelector('.adm-wrap .adm-headline'), { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1600);
  await page.screenshot({ path: OUT + '/01-full.png', fullPage: true });
  const secCount = await page.evaluate(() => document.querySelectorAll('.adm-section').length);
  const navCount = await page.evaluate(() => document.querySelectorAll('.adm-nav__link').length);
  const pills = await page.evaluate(() => document.querySelectorAll('.adm-pill').length);
  const eyebrow = await page.evaluate(() => { var e = document.querySelector('.adm-eyebrow'); return e ? e.textContent.trim() : null; });
  console.log('  ok 01-full (' + secCount + ' sections, ' + navCount + ' nav links, ' + pills + ' pills, eyebrow="' + eyebrow + '")');

  // 2. Scrolled to invites — desktop sticky-nav active state
  await page.evaluate(() => { try { adminScrollToSection('invites'); } catch (e) {} });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + '/02-scrolled.png', fullPage: false });
  const activeNav = await page.evaluate(() => { var a = document.querySelector('.adm-nav__link--active'); return a ? a.getAttribute('data-sec') : null; });
  console.log('  ok 02-scrolled (activeNav=' + activeNav + ')');

  // 3. Not-found — non-founder profile → editorial 404
  await page.evaluate(() => {
    try {
      if (currentProfile) { currentProfile.platformRole = 'member'; currentProfile.role = 'member'; }
      Router.go('home');
    } catch (e) {}
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => { try { Router.go('admin'); } catch (e) {} });
  await page.waitForFunction(() => !!document.querySelector('.adm-404'), { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT + '/03-notfound.png', fullPage: false });
  const has404 = await page.evaluate(() => { var h = document.querySelector('.adm-404__headline'); return h ? h.textContent.trim() : null; });
  console.log('  ok 03-notfound (headline="' + has404 + '")');

  await ctx.close();
}
await b.close();
console.log('done -> ' + OUTBASE);
