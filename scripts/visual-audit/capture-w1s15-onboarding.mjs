// W1.S15 Onboarding capture (CLUBHOUSE_SPEC-HQ-3n). Reuses the emulator +
// custom-token auth path from capture-w1s15-admin.mjs. Seeds a member with a
// pre-filled name/username (as registration would) but onboardingComplete:false
// so the route renders the first-run flow. Drives Router.go('onboarding') then
// advanceOnboarding() through the intro steps into renderProfileSetup(), and
// captures the split-screen felt/chalk editorial scaffold:
//   1. welcome    step 1 of 6 (felt aside + chalk welcome + brass progress)
//   2. parcoins   step 4 of 6 (mid-flow, progress strip advanced)
//   3. profile    step 6 of 6 (renderProfileSetup form: avatar + ff fields + toggle)
//
//   CAPTURE_OUT   base output dir (per-device subdir appended)
//   CAPTURE_PORT  dev-server port (default 5173)
//   CAPTURE_BASE  dev-server base (default /smoky-mountain-open/)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUTBASE = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s15-onboarding-2026-05-30';
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
const tsFromMs = (ms) => admin.firestore.Timestamp.fromMillis(ms);

// ── New member: name/username pre-filled (registration), onboardingComplete:false
//    so the first-run flow renders; range/homeCourse/bio left blank (placeholders). ──
await adb.collection('members').doc(UID).set({
  id: UID, name: 'Zach Boogher', username: 'zach', platformRole: 'member', role: 'member',
  level: 1, leagues: [LEAGUE], activeLeague: LEAGUE, onboardingComplete: false,
  createdAt: tsFromMs(Date.parse('2026-05-30T12:00:00Z'))
}, { merge: true });

console.log('onboarding seed: new member ' + UID + ' (onboardingComplete:false) | league ' + LEAGUE);

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
  console.log('Capturing onboarding at ' + v.key + ' -> ' + OUT);
  page.on('pageerror', (e) => console.log('  [pageerror] ' + e.message));

  await page.goto('http://127.0.0.1:' + PORT + BASE + '?emulator=1', { waitUntil: 'commit', timeout: 90000 });
  await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 90000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.evaluate(async (uid) => {
    try { var md = await db.collection('members').doc(uid).get(); if (md.exists) currentProfile = md.data(); } catch (e) {}
    try { window._activeLeagueName = 'The Parbaughs'; } catch (e) {}
  }, UID);

  // 1. Welcome — step 1 of 6, intro carousel start
  await page.evaluate(() => { try { Router.go('onboarding'); } catch (e) {} });
  await page.waitForFunction(() => !!document.querySelector('.onb .onb-headline'), { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1400);
  await page.screenshot({ path: OUT + '/01-welcome.png', fullPage: false });
  const counter1 = await page.evaluate(() => { var e = document.querySelector('.onb-counter'); return e ? e.textContent.trim() : null; });
  const eyebrow1 = await page.evaluate(() => { var e = document.querySelector('.onb-eyebrow'); return e ? e.textContent.trim() : null; });
  const fill1 = await page.evaluate(() => { var e = document.querySelector('.onb-progress__fill'); return e ? e.style.width : null; });
  const quoteShown = await page.evaluate(() => { var e = document.querySelector('.onb-quote'); return e ? getComputedStyle(e).display : null; });
  console.log('  ok 01-welcome (counter="' + counter1 + '", eyebrow="' + eyebrow1 + '", fill=' + fill1 + ', quoteDisplay=' + quoteShown + ')');

  // 2. ParCoins — advance 3 steps into the carousel (step 4 of 6)
  await page.evaluate(() => { try { advanceOnboarding(); advanceOnboarding(); advanceOnboarding(); } catch (e) {} });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: OUT + '/02-parcoins.png', fullPage: false });
  const counter2 = await page.evaluate(() => { var e = document.querySelector('.onb-counter'); return e ? e.textContent.trim() : null; });
  const eyebrow2 = await page.evaluate(() => { var e = document.querySelector('.onb-eyebrow'); return e ? e.textContent.trim() : null; });
  console.log('  ok 02-parcoins (counter="' + counter2 + '", eyebrow="' + eyebrow2 + '")');

  // 3. Profile setup — advance to the form (step 6 of 6)
  await page.evaluate(() => { try { advanceOnboarding(); advanceOnboarding(); } catch (e) {} });
  await page.waitForFunction(() => !!document.getElementById('onb-name'), { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: OUT + '/03-profile.png', fullPage: true });
  const counter3 = await page.evaluate(() => { var e = document.querySelector('.onb-counter'); return e ? e.textContent.trim() : null; });
  const eyebrow3 = await page.evaluate(() => { var e = document.querySelector('.onb-eyebrow'); return e ? e.textContent.trim() : null; });
  const hasForm = await page.evaluate(() => ['onb-name','onb-username','onb-range','onb-homecourse','onb-bio'].every(id => !!document.getElementById(id)));
  const hasToggle = await page.evaluate(() => !!document.querySelector('.onb-toggle__track'));
  const nameVal = await page.evaluate(() => { var e = document.getElementById('onb-name'); return e ? e.value : null; });
  const fill3 = await page.evaluate(() => { var e = document.querySelector('.onb-progress__fill'); return e ? e.style.width : null; });
  console.log('  ok 03-profile (counter="' + counter3 + '", eyebrow="' + eyebrow3 + '", allFields=' + hasForm + ', toggle=' + hasToggle + ', name="' + nameVal + '", fill=' + fill3 + ')');

  await ctx.close();
}
await b.close();
console.log('done -> ' + OUTBASE);
