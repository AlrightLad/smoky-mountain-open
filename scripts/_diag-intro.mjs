// One-off diagnostic: instrument the tee-shot intro on staging as a real member.
// Polls observable intro state over 6s so we can see (a) whether the capture
// browser reports reduce-motion, (b) when the lottie mounts + how many SVG nodes
// it has (proxy for "is it animating"), (c) when the hint flips to the finish
// gate. Run: node scripts/_diag-intro.mjs <uid>
import { chromium } from 'playwright';
import { existsSync } from 'fs';
const UID = process.argv[2] || '1GE683EauXO8TVhcStKfWiCCcRl2';
const URL = process.env.VERIFY_URL || 'https://parbaughs-staging.web.app/';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('MISSING ' + SA_PATH); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse((await import('fs')).readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken(UID);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, serviceWorkers: 'block', reducedMotion: 'no-preference' });
const page = await ctx.newPage();
await page.goto(URL + '?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
const t0 = Date.now();
const rows = [];
for (let i = 0; i < 22; i++) {
  const s = await page.evaluate(() => {
    var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var intro = document.getElementById('pbIntro');
    var lot = document.getElementById('pbi-lottie');
    var hint = document.getElementById('pbi-hint');
    var lottieReady = (typeof window.lottie !== 'undefined');
    // count SVG path nodes inside the lottie mount + grab a transform fingerprint
    var nodes = lot ? lot.querySelectorAll('path,g,svg').length : 0;
    var fp = '';
    try { var p = lot && lot.querySelector('g[transform]'); fp = p ? p.getAttribute('transform') : ''; } catch (e) {}
    return { reduce: reduce, introPresent: !!intro, lottieLib: lottieReady, nodes: nodes, hint: hint ? hint.textContent.trim() : '(none)', fp: fp };
  });
  rows.push({ ms: Date.now() - t0, ...s });
  await page.waitForTimeout(300);
}
console.log('reduce-motion (capture):', rows[0].reduce);
console.log('lottie lib loaded:', rows.some(r => r.lottieLib));
console.log('ms      intro nodes hint                          fp');
for (const r of rows) console.log(String(r.ms).padStart(5), '  ', String(r.introPresent).padStart(5), String(r.nodes).padStart(4), (r.hint || '').padEnd(28).slice(0, 28), (r.fp || '').slice(0, 24));
await b.close();
