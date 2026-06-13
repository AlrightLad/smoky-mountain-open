// Find the follow-through "watching the shot" frame of the swing Lottie: mount
// the intro, seek to a series of progress points via pbTeeIntro._applyAt(t),
// screenshot each so we can pick where he's posed post-swing (ball gone) but
// hasn't recentered. Run: node scripts/_find-finish-frame.mjs
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
const UID = process.argv[2] || '1GE683EauXO8TVhcStKfWiCCcRl2';
const URL = process.env.VERIFY_URL || 'https://parbaughs-staging.web.app/';
const SA = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA)) { console.error('MISSING ' + SA); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse((await import('fs')).readFileSync(SA, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken(UID);
const OUT = '.claude/state/finish-frame';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, serviceWorkers: 'block', reducedMotion: 'no-preference', deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
await page.goto(URL + '?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
// mount the intro fresh + wait for the lottie to load
await page.evaluate(() => { try { var el = document.getElementById('pbIntro'); if (el) el.remove(); window.pbTeeIntro && window.pbTeeIntro.show && window.pbTeeIntro.show(); } catch (e) {} });
await page.waitForTimeout(1800);
const fracs = [0.50, 0.58, 0.64, 0.70, 0.76, 0.82, 0.90];
for (const f of fracs) {
  await page.evaluate((t) => { try { window.pbTeeIntro && window.pbTeeIntro._applyAt && window.pbTeeIntro._applyAt(t); } catch (e) {} }, f);
  await page.waitForTimeout(250);
  const frame = Math.round(f * 96);
  await page.screenshot({ path: `${OUT}/t${String(Math.round(f * 100))}-f${frame}.png` });
}
console.log('frames → ' + OUT);
await b.close();
