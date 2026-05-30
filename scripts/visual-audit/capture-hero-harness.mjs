// Standalone render harness for the HQ home felt-green hero (v8.23.67 Wave 2).
// Loads the running dev server (real base.css tokens + fonts + global render
// fns), injects a mock ctx, renders _renderEditorialGreetingHero +
// _renderStatsSnapshotQuartet, and screenshots at lead-column widths. No auth,
// no emulator, no seed — deterministic visual verification of the render fn.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const BASE = process.env.HARNESS_URL || 'http://localhost:5175/smoky-mountain-open/';
const OUT = '.claude/state/design-iteration/2026-05-30-felt-hero';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Mock ctx: 6 individual rounds → LATEST ROUND branch; latest within 7 days.
const now = Date.now();
const day = 86400000;
const par72 = [4,4,3,4,5,4,3,4,4, 4,4,3,4,5,4,3,4,5]; // sums to 72
function mkRound(score, daysAgo, course) {
  const ts = now - daysAgo * day;
  return { score, timestamp: ts, date: new Date(ts).toISOString().slice(0, 10),
    course, format: 'stroke', holePars: par72, holesPlayed: 18 };
}
const ctx = {
  firstName: 'Zach',
  handicap: 12.4,
  bestRound: 78,
  totalRounds: 24,
  season: { start: new Date(now - 120 * day).toISOString().slice(0, 10),
            end: new Date(now + 60 * day).toISOString().slice(0, 10) },
  state: 'idle',
  myRounds: [
    mkRound(82, 3, 'Heritage Hills Golf Resort'),
    mkRound(85, 9, 'Briarwood Golf Club'),
    mkRound(80, 16, 'Heritage Hills Golf Resort'),
    mkRound(88, 23, 'Range End Golf Club'),
    mkRound(83, 31, 'Briarwood Golf Club'),
    mkRound(79, 44, 'Heritage Hills Golf Resort'),
  ],
};

const widths = [
  { name: 'bandB-600', w: 600, page: 980 },
  { name: 'bandA-860', w: 860, page: 760 },
];

const b = await chromium.launch();
const page = await b.newContext({ deviceScaleFactor: 2 }).then(c => c.newPage());
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
// Give the bundle a moment to define globals.
await page.waitForTimeout(2500);

const probe = await page.evaluate(() => ({
  hero: typeof _renderEditorialGreetingHero,
  quartet: typeof _renderStatsSnapshotQuartet,
  router: typeof Router,
}));
console.log('globals:', JSON.stringify(probe));
if (probe.hero !== 'function') {
  console.log('FAIL: _renderEditorialGreetingHero not global on this page. Pivot needed.');
  await b.close();
  process.exit(2);
}

for (const { name, w, page: vp } of widths) {
  await page.setViewportSize({ width: w + 96, height: vp });
  await page.evaluate(({ ctx, colWidth }) => {
    document.body.style.cssText = 'margin:0;background:var(--cb-chalk);min-height:100vh';
    document.body.innerHTML =
      '<div style="max-width:' + colWidth + 'px;margin:0 auto;padding:48px 24px;display:flex;flex-direction:column;gap:var(--sp-6)">' +
      _renderEditorialGreetingHero(ctx) +
      _renderStatsSnapshotQuartet(ctx) +
      '</div>';
  }, { ctx, colWidth: w });
  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT + '/hero-' + name + '.png', fullPage: true });
  console.log('  ok ' + name + ' (' + w + 'px col)');
}

await b.close();
console.log('\nCaptured felt-hero harness to ' + OUT);
