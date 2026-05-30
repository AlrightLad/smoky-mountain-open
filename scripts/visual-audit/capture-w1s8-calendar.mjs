// W1.S8 Calendar capture (CLUBHOUSE_SPEC-HQ-3f). Reuses the emulator +
// custom-token auth path from capture-w1s6-shop.mjs. Seeds a realistic spread
// of league activity (tee times, a multi-day trip, a user event, logged rounds,
// a range session) into the SAME live globals + state injectors the real app
// uses (P9 — the genuine _calBuildEventMap path renders, not stubbed markup),
// all anchored to the current month so today's marker + truthful counts show.
// Captures the four states the redesign owns: grid with chips, grid + day
// detail, chronological List view, and the empty-month editorial block.
//
//   CAPTURE_DEVICE  Playwright device descriptor (e.g. "iPhone 14 Pro", "Pixel 7")
//   CAPTURE_OUT     output directory
//   CAPTURE_PORT    dev-server port serving --base=/ (default 5173)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s8-calendar-2026-05-30/desktop';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const DEVICE = process.env.CAPTURE_DEVICE;
const PORT = process.env.CAPTURE_PORT || '5173';
const ctxOptions = (DEVICE && devices[DEVICE])
    ? devices[DEVICE]
    : { viewport: { width: 1440, height: 1000 } };

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const UID = 'test_zach_uid_01';
const token = await admin.auth().createCustomToken(UID);

const b = await chromium.launch();
const ctx = await b.newContext(ctxOptions);
await ctx.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
const page = await ctx.newPage();
console.log('Capturing calendar at ' + (DEVICE && devices[DEVICE] ? DEVICE : 'desktop 1440x1000') + ' -> ' + OUT);

await page.goto('http://localhost:' + PORT + '/?emulator=1', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(1200);

// Seed a truthful spread of activity into the SAME globals/state the app reads,
// anchored to the current month, then render the calendar on that month.
await page.evaluate((uid) => {
    var now = new Date();
    var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var d = function (day) { return ym + '-' + String(day).padStart(2, '0'); };

    try {
        liveTeeTimes = [
            { id: 't1', date: d(6), courseName: 'Honey Run Golf Club', time: '8:10 AM', spots: 4, responses: { [uid]: 'accepted', m2: 'accepted', m3: 'accepted' }, status: 'open' },
            { id: 't2', date: d(20), courseName: 'Briarwood', time: '1:30 PM', spots: 4, responses: { [uid]: 'accepted', m2: 'accepted', m3: 'accepted', m4: 'accepted' }, status: 'open' }
        ];
    } catch (e) {}

    try {
        liveRangeSessions = [
            { _id: 'r1', date: d(9), durationMin: 45, playerName: 'Zach', playerId: uid, visibility: 'league' }
        ];
    } catch (e) {}

    try {
        _liveCalEvents = [
            { _id: 'e1', name: 'Member-Guest Mixer', startDate: d(15), endDate: d(15), location: 'The Clubhouse' }
        ];
        window._liveCalEvents = _liveCalEvents;
    } catch (e) {}

    try {
        PB.setRoundsFromFirestore([
            { id: 'rd1', date: d(2), course: 'Honey Run Golf Club', player: uid, score: 84, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72 },
            { id: 'rd2', date: d(11), course: 'Briarwood', player: uid, score: 79, tee: 'Blue', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 71 }
        ]);
    } catch (e) {}

    try {
        PB.addTripFromFirestore({
            id: 'tr1', name: 'Pinehurst Weekend', startDate: d(23), endDate: d(25),
            location: 'Pinehurst, NC', members: [uid],
            courses: [{ d: 'Saturday', n: 'Pinehurst No. 2', f: 'Stroke' }, { d: 'Sunday', n: 'Pinehurst No. 4', f: 'Scramble' }]
        });
    } catch (e) {}

    calMonth = now.getMonth();
    calYear = now.getFullYear();
    calView = 'grid';
    calSelectedDate = null;
    Router.go('calendar');
}, UID);

await page.waitForFunction(() => !!document.querySelector('.cal-table .cal-cell'), { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + '/calendar-grid.png', fullPage: true });
console.log('  ok calendar-grid');

// Select a seeded day (the 15th — Member-Guest Mixer) to render the day detail.
await page.evaluate(() => {
    var now = new Date();
    var ds = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-15';
    selectCalDay(ds);
});
await page.waitForFunction(() => !!document.querySelector('#cal-day-detail .cal-dcard'), { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + '/calendar-grid-detail.png', fullPage: true });
console.log('  ok calendar-grid-detail');

// List view.
await page.evaluate(() => { setCalView('list'); });
await page.waitForFunction(() => !!document.querySelector('.cal-listday'), { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + '/calendar-list.png', fullPage: true });
console.log('  ok calendar-list');

// Empty month: jump forward 4 months (no seeded activity there) in grid view.
await page.evaluate(() => {
    calView = 'grid';
    calSelectedDate = null;
    calMonth += 4;
    while (calMonth > 11) { calMonth -= 12; calYear += 1; }
    Router.go('calendar');
});
await page.waitForFunction(() => !!document.querySelector('.cal-empty'), { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + '/calendar-empty.png', fullPage: true });
console.log('  ok calendar-empty');

await b.close();
console.log('done -> ' + OUT);
