// Diagnostic: open docs/reports/dashboard.html in Playwright, capture all
// console errors + warnings, count populated KPI cells, screenshot.
//
// Purpose: identify EXACT JS exception making the dashboard blank.

import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const PAGE = resolve(ROOT, 'docs', 'reports', 'dashboard.html');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

const consoleMsgs = [];
const errors = [];

page.on('console', (msg) => {
  consoleMsgs.push({
    type: msg.type(),
    text: msg.text(),
    location: msg.location(),
  });
});
page.on('pageerror', (err) => {
  errors.push({
    name: err.name,
    message: err.message,
    stack: err.stack ? err.stack.slice(0, 1000) : '',
  });
});

const url = 'file://' + PAGE.replace(/\\/g, '/');
console.log(`Loading: ${url}`);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);  // let JS settle

// Count populated KPI cells (those whose textContent isn't '—' or empty)
const kpiStats = await page.evaluate(() => {
  const all = document.querySelectorAll('[data-kpi], [data-fq], [data-act-badge], [data-idx-badge]');
  let populated = 0;
  let unpopulated = 0;
  const unpopulatedList = [];
  for (const el of all) {
    const txt = (el.textContent || '').trim();
    if (txt === '' || txt === '—' || txt === '...') {
      unpopulated += 1;
      const key = el.getAttribute('data-kpi') || el.getAttribute('data-fq') || el.getAttribute('data-act-badge') || el.getAttribute('data-idx-badge');
      unpopulatedList.push(key);
    } else {
      populated += 1;
    }
  }
  return { populated, unpopulated, totalKpi: all.length, sampleUnpopulated: unpopulatedList.slice(0, 20) };
});

// Total visible text length on page
const textLen = await page.evaluate(() => {
  return (document.body.innerText || '').length;
});

// Screenshot for visual confirmation
await page.screenshot({
  path: resolve(ROOT, '.claude', 'state', 'visual-audit-2026-05-21', 'diag-dashboard.png'),
  fullPage: false,
});

await browser.close();

console.log('\n=== Console output ===');
for (const m of consoleMsgs) {
  console.log(`  [${m.type}] ${m.text}`);
}

console.log('\n=== Page errors ===');
if (errors.length === 0) console.log('  (none)');
for (const e of errors) {
  console.log(`  [${e.name}] ${e.message}`);
  if (e.stack) console.log('    Stack: ' + e.stack.split('\n').slice(0, 4).join(' | '));
}

console.log('\n=== KPI population ===');
console.log(`  Total tracked: ${kpiStats.totalKpi}`);
console.log(`  Populated:     ${kpiStats.populated}`);
console.log(`  Unpopulated:   ${kpiStats.unpopulated}`);
console.log(`  Body text len: ${textLen} chars`);
if (kpiStats.unpopulated > kpiStats.populated) {
  console.log('  Unpopulated sample (first 20):');
  for (const k of kpiStats.sampleUnpopulated) console.log('    -', k);
}

process.exit(errors.length > 0 ? 1 : 0);
