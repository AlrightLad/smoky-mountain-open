import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const url = pathToFileURL(resolve(process.cwd(), 'docs/reports/dashboard.html')).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);

// Zoom on the "This week" KPI grid.
const grid = await page.$('.pb-kpi-grid.is-this-week');
const out = process.argv[2] || `scripts/visual-audit/cycle1-zoom-thisweek.png`;
await grid.screenshot({ path: out });
console.log('Saved:', out);

// Also zoom on the supporting cards row.
const heroBox = await page.$eval('.pb-kpi-card.is-hero', el => {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log('Hero box:', heroBox);

await browser.close();
