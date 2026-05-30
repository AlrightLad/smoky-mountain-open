// V1 verify: load docs/reports/founder-checklist.html in headless Chrome,
// confirm the page rendered (not the JS-error fallback), the open items
// rendered with their dev-agnostic "Who can do this" line + a Mark-complete
// action, and the developer guide is present. Screenshot, exit 0 on PASS.

import { chromium } from 'playwright';
import path from 'path';

const SHOT = '.claude/state/visual-gate/founder-checklist.png';
const url = 'file://' + path.resolve('docs/reports/founder-checklist.html').replace(/\\/g, '/');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

await page.goto(url);
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(500);

const check = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const itemCount = document.querySelectorAll('#fc-items .fc-item').length;
    // Empty-state (0 open items) is a legitimate render, not a failure.
    const hasEmptyState = !!document.querySelector('#fc-items .fc-empty .fc-empty-title');
    return {
        renderFailed: /Failed to render/i.test(text),
        hasDevGuide: /How a developer uses this checklist/i.test(text),
        hasWhoCanDo: /Who can do this/i.test(text),     // dev-agnostic upgrade landed
        hasMarkComplete: /Mark complete/i.test(text),
        itemCount,
        hasEmptyState,
        bodyLen: text.length,
    };
});
console.log('Render check:', check);

await page.screenshot({ path: SHOT, fullPage: true });
console.log('Screenshot:', SHOT);

await b.close();

// PASS conditions:
//  - render did not fall into the catch() fallback
//  - the developer guide is present (multi-dev onboarding)
//  - EITHER open items rendered (with the dev-agnostic "Who can do this"
//    line + a Mark-complete action) OR the legitimate empty state shows.
const itemsOk = check.hasEmptyState
    || (check.itemCount > 0 && check.hasWhoCanDo && check.hasMarkComplete);

if (!check.renderFailed && check.hasDevGuide && itemsOk) {
    console.log('V1: PASS — checklist renders; dev guide present; items (or empty state) OK');
    process.exit(0);
} else {
    console.log('V1: FAIL — see render check above');
    process.exit(1);
}
