import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PAGE = pathToFileURL(resolve('C:/Users/Zach/smoky-mountain-open/docs/reports/token-usage.html')).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(PAGE);
await page.waitForLoadState('networkidle');
// Capture default view (agent_role active)
await page.waitForTimeout(400);
await page.screenshot({ path: 'C:/Users/Zach/smoky-mountain-open/scripts/visual-audit/T6-pie-final/token-usage-agent-role.png', fullPage: false });
await browser.close();
console.log('OK');
