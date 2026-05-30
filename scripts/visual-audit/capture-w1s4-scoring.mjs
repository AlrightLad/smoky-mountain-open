// W1.S4 Live Scorecard / Play Now capture (CLUBHOUSE_SPEC-HQ-3g). Reuses the
// emulator + custom-token auth path from capture-w1s3-roster.mjs, then SEEDS an
// active live round into liveState and renders the scoring surface directly so
// we capture the in-round entry view (3g.1) without having to drive the start
// form. Deterministic: renders renderLiveScoring() against a fixed seed.
//
//   CAPTURE_DEVICE  Playwright device descriptor (e.g. "iPhone 14 Pro", "Pixel 7")
//   CAPTURE_OUT     output directory

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s4-scoring-2026-05-30/desktop';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const DEVICE = process.env.CAPTURE_DEVICE;
const PORT = process.env.CAPTURE_PORT || '5173';
const ctxOptions = (DEVICE && devices[DEVICE])
    ? devices[DEVICE]
    : { viewport: { width: 1440, height: 1000 } };

const b = await chromium.launch();
const ctx = await b.newContext(ctxOptions);
// Dismiss the first-run Clubhouse welcome toast so it doesn't obscure the
// scoring surface in captures (it overlapped the masthead in the V1 baseline).
await ctx.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
const page = await ctx.newPage();
console.log('Capturing scoring at ' + (DEVICE && devices[DEVICE] ? DEVICE : 'desktop 1440x1000') + ' -> ' + OUT);

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

await page.goto('http://localhost:' + PORT + '/?emulator=1', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(1200);

// Seed an active, mid-round live state and render the scoring surface directly.
// Hole 7 of 18, six holes scored, a mix of FIR/GIR/putts, real per-hole metadata.
await page.evaluate(() => {
    var pars   = [4,5,3,4,4,5,4,3,4, 4,4,3,5,4,4,5,3,4];
    var yards  = [388,512,168,402,440,548,372,196,415, 404,358,182,531,420,396,505,205,430];
    var hcp    = [7,3,15,5,1,11,9,17,13, 8,4,16,2,6,10,12,18,14];
    var holes  = pars.map(function(p,i){ return { par: p, yardage: yards[i], handicap: hcp[i] }; });

    Router.go('playnow'); // create the [data-page="playnow"] container

    liveState.active = true;
    liveState.player = 'test_zach_uid_01';
    liveState.course = 'Honey Run Golf Club';
    liveState.courseId = '';
    liveState.format = 'stroke';
    liveState.holesMode = '18';
    liveState.tee = 'Blue';
    liveState.currentHole = 6; // hole 7
    liveState.scores  = ['4','5','2','4','5','6','','','','','','','','','','','',''];
    liveState.fir     = [true,false,false,true,false,true, false,false,false,false,false,false,false,false,false,false,false,false];
    liveState.gir     = [true,true,false,true,false,false, false,false,false,false,false,false,false,false,false,false,false,false];
    liveState.putts   = ['2','2','1','2','2','3','','','','','','','','','','','',''];
    liveState.bunker  = Array(18).fill(null);
    liveState.sand    = Array(18).fill(null);
    liveState.upDown  = Array(18).fill(null);
    liveState.miss    = Array(18).fill(null);
    liveState.penalty = Array(18).fill(0);
    liveState.holes   = holes;
    liveState.rating  = 72.3;
    liveState.slope   = 131;
    liveState.par     = 72;
    liveState.startTime = Date.now() - 1000 * 60 * 134; // ~2:14 elapsed

    renderLiveScoring();
});
await page.waitForTimeout(900);
await page.screenshot({ path: OUT + '/scoring-hole7.png', fullPage: true });
console.log('  ok scoring-hole7');

// Advanced-stats expanded state (desktop only — interaction proof of the pad).
if (!DEVICE) {
    await page.evaluate(() => { if (typeof toggleAdvancedStats === 'function') toggleAdvancedStats(6); });
    await page.waitForTimeout(500);
    await page.screenshot({ path: OUT + '/scoring-hole7-advanced.png', fullPage: true });
    console.log('  ok scoring-hole7-advanced');
}

// Turn-summary state: jump to hole 18 (index 17) with a fuller card.
await page.evaluate(() => {
    liveState.scores = ['4','5','2','4','5','6','4','3','5', '4','4','3','6','4','5','5','3','5'];
    liveState.currentHole = 17;
    renderLiveScoring();
});
await page.waitForTimeout(700);
await page.screenshot({ path: OUT + '/scoring-hole18.png', fullPage: true });
console.log('  ok scoring-hole18');

await b.close();
console.log('done -> ' + OUT);
