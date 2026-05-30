// W1.S11 Feed v2 capture (CLUBHOUSE_SPEC-HQ-3k). Reuses the emulator +
// custom-token auth path from capture-w1s9-trophy.mjs. UNLIKE trophy, the feed
// reads its three sources from Firestore via leagueQuery (rounds + chat), NOT
// from local PB state — so this seeds rounds (visibility:public) + chat into the
// emulator (Admin SDK, so a 2nd author + the system Caddy message are allowed)
// under the SAME league the signed-in test user is active in, with varied
// createdAt Timestamps so the real loader drives the render (P9 — real data, not
// stubbed markup) and the day-eyebrow grouping (TODAY / YESTERDAY / older) is
// exercised. Author uids are real league members so avatars + usernames resolve
// from the live PB cache. Idempotent: prior _w1s11seed docs are cleared first.
// Captures the League stream (desktop + iPhone) plus the Community editorial
// empty state (§ 3k.4).
//
//   CAPTURE_OUT     base output directory (per-device subdir is appended)
//   CAPTURE_PORT    dev-server port (default 5173)
//   CAPTURE_BASE    dev-server base path (default /smoky-mountain-open/)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUTBASE = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s11-feed-2026-05-30';
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

// ── Resolve the active league + a few real member authors (Admin SDK) ──
const memberSnap = await adb.collection('members').doc(UID).get();
const LID = (memberSnap.exists && memberSnap.data().activeLeague) || 'the-parbaughs';
const leagueSnap = await adb.collection('leagues').doc(LID).get();
const memberUids = (leagueSnap.exists && Array.isArray(leagueSnap.data().memberUids)) ? leagueSnap.data().memberUids : [UID];
// Pick up to 2 co-authors that have a member doc (so PB.getPlayer resolves them).
const others = [];
for (const u of memberUids) {
  if (u === UID) continue;
  const md = await adb.collection('members').doc(u).get();
  if (md.exists) { others.push(u); if (others.length >= 2) break; }
}
const A2 = others[0] || UID; // co-author 1 (falls back to zach if league is solo)
const A3 = others[1] || UID; // co-author 2
console.log('seeding feed into league', LID, '| co-authors:', A2, A3);

// ── Clear prior seed (idempotent re-runs) ──
for (const coll of ['rounds', 'chat']) {
  const snap = await adb.collection(coll).where('_w1s11seed', '==', true).get();
  for (const d of snap.docs) await d.ref.delete();
}

// ── Seed rounds + chat (varied createdAt across TODAY / YESTERDAY / 4d-ago) ──
const now = Date.now();
const H = 3600000, D = 86400000;
const TS = (msAgo) => admin.firestore.Timestamp.fromMillis(now - msAgo);

const pars18 = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];          // par 72
const zachScores = [4, 5, 3, 6, 4, 5, 3, 4, 5, 5, 4, 4, 5, 4, 5, 3, 4, 6];      // 79 (+7)
const fir = [true, false, false, true, true, false, false, true, true, false, true, false, true, true, false, false, true, true];
const gir = [true, false, false, false, true, false, false, true, true, false, true, false, false, true, false, false, true, false];
const putts = [2, 2, 1, 2, 2, 3, 1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 3];
const pars9 = [4, 4, 3, 5, 4, 4, 3, 4, 5];                                      // par 36
const zach9 = [4, 5, 3, 5, 4, 4, 3, 5, 6];                                      // 39 (+3)

const rounds = [
  { course: 'Honey Run Golf Club', player: UID, score: 79, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 70.4, slope: 128, date: '2026-05-30', holeScores: zachScores, holePars: pars18, frontScore: 39, backScore: 40, firData: fir, girData: gir, puttsData: putts, createdAt: TS(2 * H) },
  { course: 'Heritage Hills', player: A2, score: 88, tee: 'Blue', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 71.1, slope: 131, date: '2026-05-30', holeScores: [], holePars: [], likes: [UID], createdAt: TS(5 * H) },
  { course: 'Briarwood Golf Club', player: UID, score: 39, tee: 'White', holesPlayed: 9, holesMode: 'front9', format: 'stroke', coursePar: 36, rating: 35.2, slope: 124, date: '2026-05-29', holeScores: zach9, holePars: pars9, createdAt: TS(28 * H) },
  { course: 'The Bridges Golf Club', player: A3, score: 84, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 71.6, slope: 133, date: '2026-05-26', holeScores: [], holePars: [], createdAt: TS(4 * D) }
];
const chats = [
  { text: 'Anyone up for a Saturday morning 18 at Honey Run? Tee time around 8.', authorId: UID, createdAt: TS(3 * H) },
  { text: 'Fresh slate, fresh scorecards. The range is open, gents. Go put in the work. ⛳', system: true, createdAt: TS(30 * H) }
];

for (const r of rounds) {
  await adb.collection('rounds').add(Object.assign({ leagueId: LID, visibility: 'public', status: 'completed', comments: [], commentLikes: {}, likes: r.likes || [], _w1s11seed: true }, r));
}
for (const c of chats) {
  await adb.collection('chat').add(Object.assign({ leagueId: LID, _w1s11seed: true }, c));
}
console.log('seeded', rounds.length, 'rounds +', chats.length, 'chat msgs');

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
  console.log('Capturing feed at ' + v.key + ' -> ' + OUT);

  page.on('pageerror', (e) => console.log('  [pageerror] ' + e.message));
  await page.goto('http://127.0.0.1:' + PORT + BASE + '?emulator=1', { waitUntil: 'commit', timeout: 90000 });
  await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 90000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 30000 });
  await page.waitForTimeout(1500);

  // Custom-token sessions leave currentProfile as {} (no activeLeague), so
  // getActiveLeague() falls back to "the-parbaughs" and leagueQuery misses. Repair
  // it from the real members doc so the feed queries the user's actual league.
  await page.evaluate(async (uid) => {
    try { var md = await db.collection('members').doc(uid).get(); if (md.exists) currentProfile = md.data(); } catch (e) {}
  }, UID);

  await page.evaluate(() => { try { Router.go('feed'); } catch (e) {} });
  await page.waitForFunction(() => !!document.querySelector('.feed-wrap .feed-card'), { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.screenshot({ path: OUT + '/feed-league.png', fullPage: true });
  console.log('  ok feed-league');

  // Community scope — editorial empty state (§ 3k.4).
  await page.evaluate(() => { try { setFeedScope('community'); } catch (e) {} });
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + '/feed-community-empty.png', fullPage: true });
  console.log('  ok feed-community-empty');

  await ctx.close();
}
await b.close();
console.log('done -> ' + OUTBASE);
