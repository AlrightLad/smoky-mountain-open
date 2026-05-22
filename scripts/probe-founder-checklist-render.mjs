// V1 verify: load docs/reports/founder-checklist.html in headless Chrome,
// confirm sentry-auth-token card is visible, screenshot, exit 0 on PASS.

import { chromium } from 'playwright';
import path from 'path';

const SHOT = '.claude/state/visual-gate/founder-checklist-2026-05-22.png';
const url = 'file://' + path.resolve('docs/reports/founder-checklist.html').replace(/\\/g, '/');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

await page.goto(url);
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(500);

// Probe: does the page have the sentry-auth-token card visible?
const cardCheck = await page.evaluate(() => {
    const text = document.body.innerText || '';
    return {
        hasSentryAuth: /Sentry Auth Token/i.test(text),
        hasGreenSeverity: /green/i.test(text),
        hasViewWalkthrough: /view walkthrough/i.test(text),
        bodyLen: text.length,
    };
});
console.log('Card check:', cardCheck);

await page.screenshot({ path: SHOT, fullPage: false });
console.log('Screenshot:', SHOT);

await b.close();

if (cardCheck.hasSentryAuth && cardCheck.hasViewWalkthrough) {
    console.log('V1: PASS — sentry-auth-token card visible with walkthrough button');
    process.exit(0);
} else {
    console.log('V1: FAIL — card or walkthrough button missing');
    process.exit(1);
}
