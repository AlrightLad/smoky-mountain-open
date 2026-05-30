// W1.S11 Chip Composer capture (CLUBHOUSE_SPEC-HQ-3l.1). Reuses the emulator +
// custom-token auth + profile-repair path from capture-w1s11-feed.mjs. Seeds a
// little feed content so the composer opens over a populated stream (real loader,
// P9), then drives the composer modal through its spec'd states and captures each:
//   1. open + empty       (Post disabled, count 280/280, eyebrow = league)
//   2. short text         (Post enabled, count default)
//   3. near limit         (count brass .near, ≤20 remaining)
//   4. over limit         (count + textarea claret .over, Post disabled)
//   5. community scope     (note shown, Post disabled — Community defer)
//   6. posted             (modal closed, new chip card in the feed)
// Viewport screenshots (fullPage:false) since the composer is a fixed overlay.
//
//   CAPTURE_OUT   base output dir (per-device subdir appended)
//   CAPTURE_PORT  dev-server port (default 5173)
//   CAPTURE_BASE  dev-server base (default /smoky-mountain-open/)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUTBASE = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s11-composer-2026-05-30';
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

const memberSnap = await adb.collection('members').doc(UID).get();
const LID = (memberSnap.exists && memberSnap.data().activeLeague) || 'the-parbaughs';
console.log('composer capture against league', LID);

// Light seed so the composer opens over a populated feed (idempotent).
for (const coll of ['rounds', 'chat']) {
  const snap = await adb.collection(coll).where('_w1s11cseed', '==', true).get();
  for (const d of snap.docs) await d.ref.delete();
}
const now = Date.now();
const H = 3600000;
const TS = (msAgo) => admin.firestore.Timestamp.fromMillis(now - msAgo);
const chats = [
  { text: 'Anyone up for a Saturday morning 18 at Honey Run? Tee time around 8.', authorId: UID, authorName: 'Zach', createdAt: TS(3 * H) },
  { text: 'Fresh slate, fresh scorecards. The range is open, gents.', system: true, createdAt: TS(30 * H) }
];
for (const c of chats) await adb.collection('chat').add(Object.assign({ leagueId: LID, _w1s11cseed: true }, c));
console.log('seeded', chats.length, 'chat msgs');

// NEAR sliced to exactly 268 chars → 12 remaining, inside the brass .near band (≤20, ≥0).
const NEAR = ('Played the back nine at dusk and the light was unreal across every fairway. ' +
  'Long shadows, fast greens, and the kind of quiet that makes you want to keep walking. ' +
  'Anyone else getting out before the heat really sets in this weekend, or am I the only one chasing twilight tee times these days.').slice(0, 268);
const OVER = 'Played the back nine at dusk and the light was unreal across every fairway. '.repeat(5);                    // over 280

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
  console.log('Capturing composer at ' + v.key + ' -> ' + OUT);
  page.on('pageerror', (e) => console.log('  [pageerror] ' + e.message));

  await page.goto('http://127.0.0.1:' + PORT + BASE + '?emulator=1', { waitUntil: 'commit', timeout: 90000 });
  await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 90000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.evaluate(async (uid) => {
    try { var md = await db.collection('members').doc(uid).get(); if (md.exists) currentProfile = md.data(); } catch (e) {}
  }, UID);
  await page.evaluate(() => { try { Router.go('feed'); } catch (e) {} });
  await page.waitForFunction(() => !!document.querySelector('.feed-wrap'), { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(900);

  // 1. open + empty
  await page.evaluate(() => { try { openChipComposer('league'); } catch (e) {} });
  await page.waitForSelector('#chipOverlay.open', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(450);
  await page.screenshot({ path: OUT + '/01-open-empty.png' });
  console.log('  ok 01-open-empty');

  // 2. short text → Post enabled
  await page.fill('#chipText', 'Saturday 18 at Honey Run, who is in? Tee at 8 sharp.');
  await page.waitForTimeout(250);
  await page.screenshot({ path: OUT + '/02-short.png' });
  console.log('  ok 02-short');

  // 3. near limit → count brass
  await page.fill('#chipText', NEAR);
  await page.waitForTimeout(250);
  const rem3 = await page.evaluate(() => document.getElementById('chipCount')?.textContent);
  await page.screenshot({ path: OUT + '/03-near.png' });
  console.log('  ok 03-near (count=' + rem3 + ')');

  // 4. over limit → claret + Post disabled
  await page.fill('#chipText', OVER);
  await page.waitForTimeout(250);
  const rem4 = await page.evaluate(() => document.getElementById('chipCount')?.textContent);
  const dis4 = await page.evaluate(() => document.getElementById('chipPost')?.disabled);
  await page.screenshot({ path: OUT + '/04-over.png' });
  console.log('  ok 04-over (count=' + rem4 + ', postDisabled=' + dis4 + ')');

  // 5. community scope → note + Post disabled
  await page.fill('#chipText', 'A note meant for the whole community feed someday.');
  await page.evaluate(() => { try { setChipScope('community'); } catch (e) {} });
  await page.waitForTimeout(300);
  const noteVis = await page.evaluate(() => { const n = document.getElementById('chipNote'); return n ? getComputedStyle(n).display !== 'none' : false; });
  const dis5 = await page.evaluate(() => document.getElementById('chipPost')?.disabled);
  await page.screenshot({ path: OUT + '/05-community.png' });
  console.log('  ok 05-community (noteVisible=' + noteVis + ', postDisabled=' + dis5 + ')');

  // 6. post a league chip → modal closes → chip card appears
  await page.evaluate(() => { try { setChipScope('league'); } catch (e) {} });
  const stamp = 'E2E composer verify ' + Date.now();
  await page.fill('#chipText', stamp);
  await page.waitForTimeout(200);
  await page.evaluate(() => { try { postChip(); } catch (e) {} });
  await page.waitForTimeout(1400);
  const closed = await page.evaluate(() => !document.getElementById('chipOverlay'));
  const landed = await page.evaluate((s) => Array.from(document.querySelectorAll('.feed-wrap')).some(el => el.textContent.includes(s)), stamp);
  await page.screenshot({ path: OUT + '/06-posted.png' });
  console.log('  ok 06-posted (modalClosed=' + closed + ', chipInFeed=' + landed + ')');

  await ctx.close();
}
await b.close();
console.log('done -> ' + OUTBASE);
