// W1.S14 Settings capture (CLUBHOUSE_SPEC-HQ-3h). Reuses the emulator +
// custom-token auth + profile-repair path from capture-w1s13-leagues.mjs.
// Seeds one founder profile (so the conditional Management + Data-reseed
// sections render) with a real join date (→ "MEMBER SINCE 2024" eyebrow),
// a ParCoin balance, and a public profile (→ share-link block), then drives
// the Settings route and captures:
//   1. default        full page, location State A (not set), notif default
//   2. location-set   location State B (currentProfile.location present)
//   3. deeplink-data  Router.go('settings',{section:'data'}) → scroll + nav-active
//
//   CAPTURE_OUT   base output dir (per-device subdir appended)
//   CAPTURE_PORT  dev-server port (default 5173)
//   CAPTURE_BASE  dev-server base (default /smoky-mountain-open/)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUTBASE = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s14-settings-2026-05-30';
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

// ── Seed a founder member profile so every section (incl. Management +
//    Data-reseed) renders over real data. createdAt → "MEMBER SINCE 2024". ──
await adb.collection('members').doc(UID).set({
  name: 'Zach Boogher', username: 'zach', platformRole: 'founder', role: 'commissioner',
  level: 7, handicap: 12.4, parcoins: 1240, profilePublic: true,
  maxInvites: 5, invitesUsed: 1,
  createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-03-01T12:00:00Z'))
}, { merge: true });
console.log('settings seed: founder', UID, '| parcoins 1240 | profilePublic true | joined 2024');

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
  console.log('Capturing settings at ' + v.key + ' -> ' + OUT);
  page.on('pageerror', (e) => console.log('  [pageerror] ' + e.message));

  await page.goto('http://127.0.0.1:' + PORT + BASE + '?emulator=1', { waitUntil: 'commit', timeout: 90000 });
  await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 90000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.evaluate(async (uid) => {
    try { var md = await db.collection('members').doc(uid).get(); if (md.exists) currentProfile = md.data(); } catch (e) {}
  }, UID);

  // 1. Default — full settings page, location State A
  await page.evaluate(() => { try { if (currentProfile) delete currentProfile.location; Router.go('settings'); } catch (e) {} });
  await page.waitForFunction(() => !!document.querySelector('.set-wrap .roster-headline'), { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.screenshot({ path: OUT + '/01-default.png', fullPage: true });
  const secCount = await page.evaluate(() => document.querySelectorAll('.set-section').length);
  const navCount = await page.evaluate(() => document.querySelectorAll('.set-nav__link').length);
  const swatches = await page.evaluate(() => document.querySelectorAll('.set-swatch').length);
  console.log('  ok 01-default (' + secCount + ' sections, ' + navCount + ' nav links, ' + swatches + ' swatches)');

  // 2. Location set — State B (currentProfile.location present), re-render
  await page.evaluate(() => {
    try {
      currentProfile.location = { lat: 39.96, lng: -76.73, name: 'York, PA', source: 'manual', setAt: { toDate: function(){ return new Date(Date.now() - 2*86400000); } } };
      Router.go('settings', {}, true);
    } catch (e) {}
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/02-location-set.png', fullPage: true });
  const hasLocB = await page.evaluate(() => !!Array.prototype.find.call(document.querySelectorAll('#location-section .set-link'), function(el){ return /Change location/.test(el.textContent); }));
  console.log('  ok 02-location-set (changeLink=' + hasLocB + ')');

  // 3. Deeplink to Data section — verifies scroll + sticky-nav active state
  await page.evaluate(() => { try { if (currentProfile) delete currentProfile.location; Router.go('settings', { section: 'data' }); } catch (e) {} });
  await page.waitForTimeout(1100);
  await page.screenshot({ path: OUT + '/03-deeplink-data.png', fullPage: false });
  const activeNav = await page.evaluate(() => { var a = document.querySelector('.set-nav__link--active'); return a ? a.getAttribute('data-sec') : null; });
  console.log('  ok 03-deeplink-data (activeNav=' + activeNav + ')');

  await ctx.close();
}
await b.close();
console.log('done -> ' + OUTBASE);
