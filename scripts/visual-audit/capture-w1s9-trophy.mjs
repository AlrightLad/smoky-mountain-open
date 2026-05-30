// W1.S9 Trophy Room capture (CLUBHOUSE_SPEC-HQ-3p). Reuses the emulator +
// custom-token auth path from capture-w1s8-calendar.mjs. Seeds a truthful
// spread of logged rounds (5 courses, scores trending down) + one hole-in-one
// into the SAME live state setters the real app uses (PB.setRoundsFromFirestore
// / PB.setRecord), so the genuine compute paths drive level, XP, achievements,
// best round, best nine, courses played and the ace count (P9 — real data
// renders, not stubbed markup). Captures the full editorial page plus the
// "Earned only" wall-filter state at desktop + iPhone.
//
//   CAPTURE_OUT     base output directory (per-device subdir is appended)
//   CAPTURE_PORT    dev-server port serving --base=/ (default 5173)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUTBASE = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s9-trophy-2026-05-30';
const PORT = process.env.CAPTURE_PORT || '5173';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const UID = 'test_zach_uid_01';
const token = await admin.auth().createCustomToken(UID);

// Seeded into the live state the app reads. Runs in the page context.
function seedAndRender(uid) {
    // 5 distinct PA courses, 13 rounds (12x18 + 1x9), scores trending down so
    // the improvement badge and personal bests are genuine. rating/slope make
    // them handicap-eligible. Dates ascending to read as a real season.
    var rounds = [
        { id: 'trd01', date: '2025-12-07', course: 'Honey Run Golf Club', player: uid, score: 96, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 70.4, slope: 128 },
        { id: 'trd02', date: '2025-12-21', course: 'Briarwood Golf Club', player: uid, score: 94, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 71, rating: 69.8, slope: 124 },
        { id: 'trd03', date: '2026-01-11', course: 'Heritage Hills', player: uid, score: 92, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 71.1, slope: 131 },
        { id: 'trd04', date: '2026-01-25', course: 'The Bridges Golf Club', player: uid, score: 91, tee: 'Blue', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 71.6, slope: 133 },
        { id: 'trd05', date: '2026-02-08', course: 'Out Door Country Club', player: uid, score: 89, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 71, rating: 70.0, slope: 126 },
        { id: 'trd06', date: '2026-02-22', course: 'Honey Run Golf Club', player: uid, score: 88, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 70.4, slope: 128 },
        { id: 'trd07', date: '2026-03-08', course: 'Briarwood Golf Club', player: uid, score: 86, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 71, rating: 69.8, slope: 124 },
        { id: 'trd08', date: '2026-03-22', course: 'Heritage Hills', player: uid, score: 84, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 71.1, slope: 131 },
        { id: 'trd09', date: '2026-04-05', course: 'The Bridges Golf Club', player: uid, score: 82, tee: 'Blue', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 71.6, slope: 133 },
        { id: 'trd10', date: '2026-04-19', course: 'Out Door Country Club', player: uid, score: 83, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 71, rating: 70.0, slope: 126 },
        { id: 'trd11', date: '2026-05-03', course: 'Honey Run Golf Club', player: uid, score: 79, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 72, rating: 70.4, slope: 128 },
        { id: 'trd12', date: '2026-05-17', course: 'Briarwood Golf Club', player: uid, score: 81, tee: 'White', holesPlayed: 18, holesMode: '18', format: 'stroke', coursePar: 71, rating: 69.8, slope: 124 },
        { id: 'trd13', date: '2026-03-15', course: 'Heritage Hills', player: uid, score: 39, tee: 'White', holesPlayed: 9, holesMode: 'front9', format: 'stroke', coursePar: 36, rating: 35.2, slope: 129 }
    ];
    try { PB.setRoundsFromFirestore(rounds); } catch (e) {}

    // Resolve the player's display name so the seeded ace matches both the
    // getAchievements ace check and _trAceCount (both key off player.name).
    var p = (typeof PB !== 'undefined' && PB.getPlayer) ? PB.getPlayer(uid) : null;
    var nm = (p && p.name) || 'Zach';
    try {
        PB.setRecord('holeInOnes', [
            { by: nm, course: 'The Bridges Golf Club', hole: 7, date: '2026-04-05', yards: 165 }
        ]);
    } catch (e) {}

    Router.go('trophyroom');
}

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
    console.log('Capturing trophy room at ' + v.key + ' -> ' + OUT);

    page.on('pageerror', (e) => console.log('  [pageerror] ' + e.message));
    await page.goto('http://127.0.0.1:' + PORT + '/?emulator=1', { waitUntil: 'commit', timeout: 90000 });
    await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 90000 });
    await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
    await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 30000 });
    await page.waitForTimeout(1200);

    await page.evaluate(seedAndRender, UID);
    await page.waitForFunction(() => !!document.querySelector('.tr-wrap .tr-standing') && !!document.querySelector('#trophyAchGrid .ach-card'), { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: OUT + '/trophy-all.png', fullPage: true });
    console.log('  ok trophy-all');

    // "Earned only" wall filter.
    await page.evaluate((uid) => { try { toggleTrophyFilter(uid); } catch (e) {} }, UID);
    await page.waitForTimeout(500);
    await page.screenshot({ path: OUT + '/trophy-earned-only.png', fullPage: true });
    console.log('  ok trophy-earned-only');

    await ctx.close();
}
await b.close();
console.log('done -> ' + OUTBASE);
