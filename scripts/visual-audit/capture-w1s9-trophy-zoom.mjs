// W1.S9 Trophy Room — readable viewport crops for V1 verification. Same seed
// as capture-w1s9-trophy.mjs, but scrolls to each section and shoots the
// viewport (fullPage:false) so typography + states are legible.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/design-pass-2026-05-22/w1s9-trophy-2026-05-30/zoom';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const PORT = process.env.CAPTURE_PORT || '5173';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const UID = 'test_zach_uid_01';
const token = await admin.auth().createCustomToken(UID);

function seedAndRender(uid) {
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
    var p = (typeof PB !== 'undefined' && PB.getPlayer) ? PB.getPlayer(uid) : null;
    var nm = (p && p.name) || 'Zach';
    try { PB.setRecord('holeInOnes', [{ by: nm, course: 'The Bridges Golf Club', hole: 7, date: '2026-04-05', yards: 165 }]); } catch (e) {}
    Router.go('trophyroom');
}

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:' + PORT + '/?emulator=1', { waitUntil: 'commit', timeout: 90000 });
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 90000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 30000 });
await page.waitForTimeout(1000);
await page.evaluate(seedAndRender, UID);
await page.waitForFunction(() => !!document.querySelector('.tr-wrap .tr-standing') && !!document.querySelector('#trophyAchGrid .ach-card'), { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(900);

// Section-by-section element screenshots (legible).
async function shot(sel, name) {
    const el = page.locator(sel).first();
    if (await el.count()) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(250);
        await el.screenshot({ path: OUT + '/' + name + '.png' }).catch((e) => console.log('  skip ' + name + ': ' + e.message));
        console.log('  ok ' + name);
    } else { console.log('  missing ' + sel); }
}

await shot('.roster-masthead', '01-masthead');
await shot('.tr-standing', '02-standing');
await shot('.tr-marquee', '03-marquee');
await shot('.tr-records', '04-records');
// Wall: capture the first category head + grid (earned + locked mix lives here).
await shot('#trophyAchGrid', '05-wall-full');
await shot('.tr-titles', '06-titles');

await b.close();
console.log('done -> ' + OUT);
