// Capture the UNAUTHED entry surface (#authScreen) at iPhone viewport. The
// authed sweeps sign in programmatically and skip the login/landing screen
// entirely — yet that is the literal first impression of the whole app. If the
// front door reads weak, the whole app "looks like shit" from second one. No
// custom-token sign-in here on purpose: we want what a brand-new visitor sees.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = 'scratch/auth-entry-2026-06-07';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173/smoky-mountain-open/?emulator=1';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(BASE);

// Wait for the auth screen to be visible (not .hidden). enterApp() only hides it
// after a successful sign-in, which never happens here.
await page.waitForFunction(
    () => {
        const a = document.getElementById('authScreen');
        return a && !a.classList.contains('hidden');
    },
    { timeout: 12000 }
).catch(() => console.log('  (authScreen visibility wait timed out — capturing whatever rendered)'));
await page.waitForTimeout(1500);

await page.screenshot({ path: OUT + '/auth-full.png', fullPage: true });
await page.screenshot({ path: OUT + '/auth-fold.png', clip: { x: 0, y: 0, width: 390, height: 844 } });

// Probe what's actually on the auth screen so the critique is grounded in DOM,
// not just pixels.
const probe = await page.evaluate(() => {
    const a = document.getElementById('authScreen');
    if (!a) return { present: false };
    const txt = (a.innerText || '').trim().slice(0, 400);
    const btns = Array.from(a.querySelectorAll('button')).map((x) => (x.innerText || '').trim()).filter(Boolean);
    const inputs = Array.from(a.querySelectorAll('input')).map((x) => x.placeholder || x.type);
    const imgs = Array.from(a.querySelectorAll('img')).map((x) => x.getAttribute('src'));
    return { present: true, hidden: a.classList.contains('hidden'), text: txt, buttons: btns, inputs, imgs };
});
console.log(JSON.stringify(probe, null, 2));

// The register + forgot forms share the same .auth-form card but carry inline
// legacy tokens (var(--gold)/var(--muted)/var(--cream)). Capture each state to
// confirm legibility on the new cream card — not just the default login form.
await page.evaluate(() => window.showRegister && window.showRegister());
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + '/auth-register-fold.png', clip: { x: 0, y: 0, width: 390, height: 844 } });

await page.evaluate(() => window.showForgot && window.showForgot());
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + '/auth-forgot-fold.png', clip: { x: 0, y: 0, width: 390, height: 844 } });

await ctx.close();
await b.close();
console.log('\nCaptured unauthed entry (login + register + forgot) → ' + OUT);
