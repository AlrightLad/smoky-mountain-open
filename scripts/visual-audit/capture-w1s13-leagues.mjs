// W1.S13 League hub capture (CLUBHOUSE_SPEC-HQ-3j). Reuses the emulator +
// custom-token auth + profile-repair path from capture-w1s11-composer.mjs.
// Seeds two leagues commissioned by the test user (a founding league + a
// non-founding public league with a pending join request) so the editorial
// surfaces render over real data, then drives the League routes and captures:
//   1. my-leagues       (3j.2 card grid, N>=2, active-scope brass top-border)
//   2. detail-weekend   (3j.1.A/B full commissioner view incl. danger zone)
//   3. detail-parbaughs  (founding league — Founding badge, no danger zone)
//   4. create            (editorial Create form)
//   5. join              (editorial Join form)
//   6. lonewolf          (3j.1.D takeover — currentProfile.leagues forced empty)
//
//   CAPTURE_OUT   base output dir (per-device subdir appended)
//   CAPTURE_PORT  dev-server port (default 5173)
//   CAPTURE_BASE  dev-server base (default /smoky-mountain-open/)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUTBASE = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s13-leagues-2026-05-30';
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

// ── Gather real member UIDs so the seeded roster resolves through PB.getPlayer ──
const memSnap = await adb.collection('members').limit(8).get();
const members = [];
memSnap.forEach((d) => { members.push({ uid: d.id, name: (d.data().name || d.data().username || d.id) }); });
// Guarantee the auth user is present (create a minimal profile if the emulator lacks one).
let me = members.find((m) => m.uid === UID);
if (!me) {
  me = { uid: UID, name: 'Zach Boogher' };
  await adb.collection('members').doc(UID).set({ name: 'Zach Boogher', username: 'zach', level: 7, handicap: 12.4 }, { merge: true });
  members.unshift(me);
}
const others = members.filter((m) => m.uid !== UID);
const memberUids = [UID].concat(others.slice(0, 5).map((m) => m.uid));
const adminUid = others.length ? others[0].uid : null;        // shows an Admin role + Remove-admin button
const requesterUid = others.length > 1 ? others[1].uid : 'pending_req_uid_01';
const requesterName = others.length > 1 ? others[1].name : 'Marcus Webb';
console.log('league seed: commissioner', UID, '| memberUids', memberUids.length, '| admin', adminUid, '| requester', requesterUid);

// ── My membership: two leagues, active = the-parbaughs ──
await adb.collection('members').doc(UID).set({ leagues: ['the-parbaughs', 'weekend-warriors'], activeLeague: 'the-parbaughs' }, { merge: true });

// ── Founding league (badge: founding → danger zone suppressed) ──
await adb.collection('leagues').doc('the-parbaughs').set({
  name: 'The Parbaughs', location: 'York, PA', founded: '2024-03-01', visibility: 'private',
  description: 'The founding twenty. Where it all started: one group chat, one standing tee time, and a trophy nobody will admit they want.',
  commissioner: UID, commissionerName: me.name, memberCount: memberUids.length, memberUids: memberUids,
  admins: adminUid ? [adminUid] : [], inviteCode: 'PARB24', requireApproval: false, badge: 'founding'
}, { merge: true });

// ── Non-founding public league (full commissioner surface incl. danger zone) ──
await adb.collection('leagues').doc('weekend-warriors').set({
  name: 'Weekend Warriors', location: 'York, PA', founded: '2025-04-12', visibility: 'public',
  description: 'Saturday-morning crew. Skins, mulligans, and the occasional sandbagger. Open clubhouse: request a spot and pull up.',
  commissioner: UID, commissionerName: me.name, memberCount: memberUids.length, memberUids: memberUids,
  admins: adminUid ? [adminUid] : [], inviteCode: 'WKND42', requireApproval: true, badge: ''
}, { merge: true });

// ── A pending join request so the Requests section has real content ──
await adb.collection('leagues').doc('weekend-warriors').collection('joinRequests').doc(requesterUid).set({
  status: 'pending', uid: requesterUid, name: requesterName, handicap: 9.2, homeCourse: 'Honey Run', level: 4,
  createdAt: admin.firestore.Timestamp.now()
}, { merge: true });
console.log('seeded 2 leagues + 1 pending join request');

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
  console.log('Capturing leagues at ' + v.key + ' -> ' + OUT);
  page.on('pageerror', (e) => console.log('  [pageerror] ' + e.message));

  await page.goto('http://127.0.0.1:' + PORT + BASE + '?emulator=1', { waitUntil: 'commit', timeout: 90000 });
  await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 90000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.evaluate(async (uid) => {
    try { var md = await db.collection('members').doc(uid).get(); if (md.exists) currentProfile = md.data(); } catch (e) {}
  }, UID);

  // 1. My Leagues card grid
  await page.evaluate(() => { try { Router.go('leagues'); } catch (e) {} });
  await page.waitForFunction(() => { var el = document.getElementById('leagueCards'); return el && el.querySelector('.league-card'); }, { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.screenshot({ path: OUT + '/01-my-leagues.png', fullPage: true });
  const cardCount = await page.evaluate(() => document.querySelectorAll('#leagueCards .league-card').length);
  console.log('  ok 01-my-leagues (' + cardCount + ' cards)');

  // 2. League detail — Weekend Warriors (full commissioner view)
  await page.evaluate(() => { try { Router.go('leagues', { id: 'weekend-warriors' }); } catch (e) {} });
  await page.waitForFunction(() => !!document.querySelector('#leagueDetail .league-hero'), { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1100);
  await page.screenshot({ path: OUT + '/02-detail-weekend.png', fullPage: true });
  const hasDanger = await page.evaluate(() => !!document.querySelector('.league-danger'));
  const rosterRows = await page.evaluate(() => document.querySelectorAll('#leagueMemberList .league-row').length);
  console.log('  ok 02-detail-weekend (dangerZone=' + hasDanger + ', rosterRows=' + rosterRows + ')');

  // 3. League detail — The Parbaughs (founding badge, no danger zone)
  await page.evaluate(() => { try { Router.go('leagues', { id: 'the-parbaughs' }); } catch (e) {} });
  await page.waitForFunction(() => !!document.querySelector('#leagueDetail .league-hero'), { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: OUT + '/03-detail-parbaughs.png', fullPage: true });
  const hasBadge = await page.evaluate(() => !!document.querySelector('.league-hero__badge'));
  console.log('  ok 03-detail-parbaughs (foundingBadge=' + hasBadge + ')');

  // 4. Create form
  await page.evaluate(() => { try { Router.go('leagues', { create: true }); } catch (e) {} });
  await page.waitForSelector('#cl-name', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/04-create.png', fullPage: true });
  console.log('  ok 04-create');

  // 5. Join form
  await page.evaluate(() => { try { Router.go('leagues', { join: true }); } catch (e) {} });
  await page.waitForSelector('#jl-code', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/05-join.png', fullPage: true });
  console.log('  ok 05-join');

  // 6. Lone Wolf — force the zero-league state in memory, re-render
  await page.evaluate(() => { try { if (currentProfile) currentProfile.leagues = []; renderLeagueList(); } catch (e) {} });
  await page.waitForFunction(() => !!document.querySelector('.lonewolf-grid'), { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT + '/06-lonewolf.png', fullPage: true });
  const lwCards = await page.evaluate(() => document.querySelectorAll('.lonewolf-card').length);
  console.log('  ok 06-lonewolf (' + lwCards + ' cards)');

  await ctx.close();
}
await b.close();
console.log('done -> ' + OUTBASE);
