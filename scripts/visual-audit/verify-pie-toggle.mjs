import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PAGE = pathToFileURL(resolve('C:/Users/Zach/smoky-mountain-open/docs/reports/token-usage.html')).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(PAGE);
await page.waitForLoadState('networkidle');
// Click Top Sessions toggle and screenshot
await page.click('[data-pie-toggle="session_top10"]');
await page.waitForTimeout(400);
await page.screenshot({ path: 'C:/Users/Zach/smoky-mountain-open/scripts/visual-audit/T6-pie-final/token-usage-top-sessions.png', fullPage: false });
await page.click('[data-pie-toggle="work_category"]');
await page.waitForTimeout(400);
await page.screenshot({ path: 'C:/Users/Zach/smoky-mountain-open/scripts/visual-audit/T6-pie-final/token-usage-work-category.png', fullPage: false });
await browser.close();
console.log('OK');
