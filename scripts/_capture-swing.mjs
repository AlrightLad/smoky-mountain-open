// Capture the tee-shot swing at key phases on the PUBLIC staging URL (bypasses
// the wedged localhost + needs no auth — the intro is a self-contained overlay
// exposed as window.pbTeeIntro). Poses the golfer at each t and shoots, so the
// motion can be judged frame-by-frame against real golf-swing kinematics.
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT = '.claude/state/swing-audit-2026-06-12';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const FRAMES = [0, 0.25, 0.45, 0.53, 0.62, 0.66, 0.69, 0.82, 1.0];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 760 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
const page = await ctx.newPage();
// Suppress the auto-play swing (maybeShow returns early when seen) so the rAF
// doesn't fight our static _applyAt poses; we then drive frames manually.
await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); } catch (e) {} });
await page.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const hasIntro = await page.evaluate(() => typeof window.pbTeeIntro !== 'undefined');
console.log('window.pbTeeIntro present:', hasIntro);
if (!hasIntro) { console.log('intro module not exposed — abort'); await b.close(); process.exit(1); }
// Mount the overlay once.
await page.evaluate(() => { window.pbTeeIntro.show(); });
await page.waitForTimeout(400);
for (const t of FRAMES) {
  await page.evaluate((tt) => { window.pbTeeIntro._applyAt(tt); }, t);
  await page.waitForTimeout(200);
  const label = String(t).replace('.', 'p');
  await page.screenshot({ path: `${OUT}/swing-t${label}.png` });
}
console.log('captured ' + FRAMES.length + ' swing frames → ' + OUT);
await b.close();
