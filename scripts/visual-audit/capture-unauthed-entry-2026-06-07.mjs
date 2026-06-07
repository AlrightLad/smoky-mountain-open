// Unauthed entry/login capture (2026-06-07). The true first impression a user
// (and the Founder) sees before signing in. The authed surfaces (home/feed/shop)
// already read premium; the login screen is the one front-door surface not yet
// captured this pass. Mobile iPhone viewport, served by local dev server.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/ui-upgrade-2026-06-07/captures';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
});
const page = await ctx.newPage();

// ?emulator=1 connects to the local emulator (empty auth) so we never touch prod
// Firebase. No sign-in -> the unauthed #authScreen renders.
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForSelector('#authScreen:not(.hidden)', { timeout: 15000 });
await page.waitForTimeout(1500);

await page.screenshot({ path: OUT + '/login-viewport.png', fullPage: false });
await page.screenshot({ path: OUT + '/login-full.png', fullPage: true });
console.log('captured login-viewport.png + login-full.png to ' + OUT);

await b.close();
