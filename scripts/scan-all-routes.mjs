// scan-all-routes.mjs — authed-staging full-route structural scan (T2 harness, v8.25.240)
//
// WHAT: signs in as a real member (custom token), then drives Router.go() across every
//   registered route at a phone viewport and flags STRUCTURAL defects per route:
//     - H-SCROLL      : documentElement.scrollWidth exceeds the viewport (real sideways scroll)
//     - OVERFLOW       : a non-fixed, on-screen element extends past the right edge
//     - BROKEN-IMG     : a VISIBLE img (offsetParent!==null) failed to load (naturalWidth===0)
//     - ERR            : a console error that is NOT the benign cold-sign-in permission race
//
// WHY THE FALSE-POSITIVE GATES MATTER (learned during the v8.25.240 T2 pass):
//   - overflow is only real when scrollW>vw — the off-canvas notification drawer sits at
//     x=750 by design and is NOT a defect, so it must be gated on actual horizontal scroll.
//   - broken-img must require offsetParent!==null — the shop's lazy/below-the-fold decoration
//     images report naturalWidth===0 until scrolled into view but are HTTP 200 (not broken).
//   - permission/insufficient console errors are the documented self-healing cold-sign-in
//     Firestore-rules-propagation race (routed through pbWarn, never persisted) — filtered out.
//
// USAGE:  node scripts/scan-all-routes.mjs
//   Requires scripts/.secrets/prod-service-account.json (gitignored). Targets the staging
//   hosting URL. Re-run after any structural change to confirm the app stays clean.
//
// RESULT of the inaugural run (v8.25.240): 34/34 routes structurally clean. The only real
//   finding was two onSnapshot listeners missing error callbacks (tee-times + range-session),
//   fixed the same ship. See BACKLOG.md "T2" + memory [[reference_harness_tooling]].

import { chromium } from 'playwright';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const SA_PATH = 'scripts/.secrets/prod-service-account.json';
const MEMBER_UID = '1fwuewlis6Yvrtvlk7m0I3rRYwQ2'; // FatalBert69420 — a real, fully-onboarded member
const STAGING_URL = 'https://parbaughs-staging.web.app';
const VIEWPORT = { width: 430, height: 932 }; // iPhone-class phone viewport (member-primary)
const SETTLE_MS = 1400; // per-route render-settle before inspection

const ROUTES = [
  'home', 'feed', 'rounds', 'courses', 'members', 'standings', 'records', 'trophyroom',
  'shop', 'merch', 'more', 'settings', 'wagers', 'bounties', 'challenges', 'richlist',
  'scramble', 'teetimes', 'calendar', 'trips', 'tournament', 'awards', 'seasonrecap',
  'aces', 'drills', 'faq', 'rules', 'caddynotes', 'leagues', 'findplayers', 'range',
  'partygames', 'invite', 'profile-edit',
];

const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const token = await admin.auth().createCustomToken(MEMBER_UID);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, serviceWorkers: 'block' });
const p = await ctx.newPage();
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });

// Suppress the tee-shot intro so it doesn't sit over the first route.
await p.addInitScript(() => {
  try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {}
});
await p.goto(STAGING_URL + '/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);
await p.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
await p.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await p.waitForFunction(() => { const m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await p.evaluate(() => {
  try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); const i = document.getElementById('pbIntro'); if (i) i.remove(); } catch (e) {}
});

const report = [];
for (const r of ROUTES) {
  errs.length = 0;
  try {
    await p.evaluate((rt) => window.Router.go(rt), r);
    await p.waitForTimeout(SETTLE_MS);
    await p.evaluate(() => { const i = document.getElementById('pbIntro'); if (i) i.remove(); });
    // Scroll through the page in steps to trigger loading="lazy" images, then return to
    // top — otherwise below-the-fold lazy imgs report naturalWidth===0 and false-positive
    // as "broken" (they are HTTP 200, just not decoded yet). Give them time to load.
    await p.evaluate(async () => {
      const sc = document.scrollingElement || document.documentElement;
      const max = sc.scrollHeight;
      for (let y = 0; y <= max; y += window.innerHeight * 0.8) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(500);
    const d = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      // Real overflow: a non-fixed/non-offscreen element extending past the viewport right edge.
      let maxRight = 0, offender = '';
      document.querySelectorAll('#mainApp *').forEach((el) => {
        const s = getComputedStyle(el); if (s.position === 'fixed' || s.display === 'none') return;
        const rc = el.getBoundingClientRect();
        if (rc.width > 0 && rc.left >= -2 && rc.right > maxRight) {
          maxRight = rc.right;
          if (rc.right > vw + 2) offender = (el.className && el.className.toString ? el.className.toString() : el.tagName).slice(0, 30);
        }
      });
      // Only VISIBLE imgs — lazy/hidden shop imgs report naturalWidth0 but aren't broken.
      const imgs = [...document.querySelectorAll('#mainApp img')].filter((i) => i.offsetParent !== null);
      const broken = imgs.filter((i) => i.getAttribute('src') && (!i.complete || i.naturalWidth === 0)).map((i) => i.src.split('/').pop());
      return { vw, scrollW: document.documentElement.scrollWidth, overflowRight: Math.round(maxRight), offender, broken };
    });
    const flags = [];
    if (d.scrollW > d.vw + 2) flags.push('H-SCROLL scrollW=' + d.scrollW);
    if (d.scrollW > d.vw + 2 && d.overflowRight > d.vw + 2) flags.push('OVERFLOW ' + d.offender + '@' + d.overflowRight);
    if (d.broken.length) flags.push('BROKEN-IMG ' + d.broken.slice(0, 3).join(','));
    const realErrs = errs.filter((e) => !/permission|insufficient/i.test(e));
    if (realErrs.length) flags.push('ERR ' + realErrs.slice(0, 2).join(' | '));
    report.push({ r, flags });
  } catch (e) {
    report.push({ r, flags: ['NAV-FAIL ' + e.message.slice(0, 40)] });
  }
}
await b.close();

console.log('\n===== ROUTE SCAN (' + ROUTES.length + ' routes) =====');
const bad = report.filter((x) => x.flags.length);
report.forEach((x) => console.log((x.flags.length ? '⚠ ' : '  ok ') + x.r.padEnd(14) + (x.flags.join(' ; ') || '')));
console.log('\n' + bad.length + ' routes with flags, ' + (ROUTES.length - bad.length) + ' clean.');
process.exit(bad.length ? 1 : 0);
