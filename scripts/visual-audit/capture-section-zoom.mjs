// Zoom on a specific section by data-attr or selector.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const target_html = process.argv[4] || 'docs/reports/dashboard.html';
const url = pathToFileURL(resolve(process.cwd(), target_html)).href;
const selector = process.argv[2] || 'h3 + .pb-kpi-grid';
const out = process.argv[3] || 'scripts/visual-audit/section-zoom.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);

const target = await page.$(selector);
if (!target) { console.error('No element matched:', selector); process.exit(1); }
await target.scrollIntoViewIfNeeded();
await target.screenshot({ path: out });
console.log('Saved:', out);
await browser.close();
