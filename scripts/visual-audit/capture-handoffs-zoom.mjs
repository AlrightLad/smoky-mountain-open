import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const url = pathToFileURL(resolve(process.cwd(), 'docs/reports/dashboard.html')).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);

const out = process.argv[2] || 'scripts/visual-audit/handoffs-zoom.png';
const target = await page.$('#recent-handoffs-table');
await target.scrollIntoViewIfNeeded();
const section = target.evaluateHandle(el => el.closest('section'));
const sectionRect = await (await section).boundingBox?.();
// Just clip a 1280px wide rect around it.
const rect = await page.evaluate(() => {
  const t = document.querySelector('#recent-handoffs-table').closest('section');
  const r = t.getBoundingClientRect();
  return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
});
await page.screenshot({
  path: out,
  clip: rect,
  fullPage: true
});
console.log('Saved:', out);
await browser.close();
