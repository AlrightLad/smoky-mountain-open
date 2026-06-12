import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT = '.claude/state/onboarding-rebuild-2026-06-12/flow';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('1GE683EauXO8TVhcStKfWiCCcRl2');
const b = await chromium.launch();
const ctx = await b.newContext(devices['iPhone 14 Pro']);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
// NOTE: deliberately do NOT preset pb_intro_seen / pb_wt_routed — we WANT the
// intro swing + the FTUE to actually run so we can verify the new flow.
await page.goto('http://localhost:5173/smoky-mountain-open/?emulator=1', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 15000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 }).catch(() => {});
async function shot(n, label) { await page.screenshot({ path: OUT + '/' + n + '.png' }); console.log('shot', n, label); }
// 1) the swing intro should mount + auto-play; wait for it to reach the "tap to enter" hold
await page.waitForTimeout(1200);
const introUp = await page.evaluate(() => !!document.getElementById('pbIntro'));
console.log('intro mounted:', introUp);
await page.waitForTimeout(4200);                       // swing autoplay(1100)+anim(2500)+ -> finishHold
const hint = await page.evaluate(() => { const h = document.getElementById('pbi-hint'); return h ? h.textContent : '(no hint)'; });
console.log('intro hint after swing:', JSON.stringify(hint));
await shot('1-intro-enter', 'swing finished, tap-to-enter');
// 2) tap to enter -> intro teardown -> FTUE
await page.evaluate(() => { const i = document.getElementById('pbIntro'); if (i) i.click(); });
await page.waitForTimeout(900);
await shot('2-ftue-welcome', 'FTUE beat 0 (welcome card)');
const hasWalk = await page.evaluate(() => !!document.getElementById('pbWalk'));
console.log('pbWalk mounted after intro:', hasWalk);
// 3) Show me around -> calibrate
await page.evaluate(() => { const p = document.getElementById('pbw-primary'); if (p) p.click(); });
await page.waitForTimeout(700);
await shot('3-ftue-calibrate', 'FTUE beat 1 (calibrate)');
// 4) pick "Just me" -> beat 2 spotlight nav-play
await page.evaluate(() => { const c = document.querySelector('.pbw-choice'); if (c) c.click(); });
await page.waitForTimeout(800);
const spot1 = await page.evaluate(() => { const s = document.getElementById('pbw-spot'); const e = document.querySelector('.pbw-eyebrow'); return { hasSpot: !!s, eyebrow: e ? e.textContent : null, spotRect: s ? { top: Math.round(s.getBoundingClientRect().top), left: Math.round(s.getBoundingClientRect().left) } : null }; });
console.log('beat2 spotlight:', JSON.stringify(spot1));
await shot('4-ftue-spotlight-play', 'beat 2 spotlight on real Play nav');
// 5) Got it -> beat 3 spotlight nav-home
await page.evaluate(() => { const p = document.getElementById('pbw-primary'); if (p) p.click(); });
await page.waitForTimeout(700);
await shot('5-ftue-spotlight-home', 'beat 3 spotlight on Home nav');
// 6) Got it -> beat 4 spotlight nav-courses
await page.evaluate(() => { const p = document.getElementById('pbw-primary'); if (p) p.click(); });
await page.waitForTimeout(700);
await shot('6-ftue-spotlight-courses', 'beat 4 spotlight on Courses nav');
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify([...new Set(errs)])) : 'no page errors');
await b.close(); process.exit(0);
