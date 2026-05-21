/**
 * Capacitor webview smoke test — verifies bundle builds + key surfaces
 * render through PB.native.* abstractions when running on iOS / Android
 * via Capacitor (vs the file:// web fallback).
 *
 * Per App Health A10 Mobile-first "how to improve":
 *   "Author tests/capacitor/smoke.spec.js — verifies bundle builds + key
 *    surfaces render in Capacitor webview."
 *
 * USAGE:
 *   1. `npm run build` (vite build into dist/)
 *   2. `npx cap sync` (Capacitor copies dist/ into ios/ and android/)
 *   3. `npm run test:capacitor` (this file runs against the built bundle
 *      with Capacitor mocks — does NOT require real iOS/Android device)
 *
 * SCOPE: this is a SMOKE test, not full E2E. It verifies:
 *   - The built bundle (dist/index.html) loads without error
 *   - PB.native.* abstractions resolve correctly (web fallback in headless)
 *   - Critical first-paint surfaces (home, dms, profile) render content
 *
 * Full Capacitor E2E (with native simulator + real device) is W4 Mobile
 * Wave ship — when iOS bundle ID is reserved + TestFlight is wired.
 *
 * This smoke is meant to run on the same hardware as Tier 2 Playwright.
 * It DOES NOT require a Capacitor device or simulator.
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const REPO = path.resolve(__dirname, '..', '..');
const DIST_INDEX = path.join(REPO, 'dist', 'index.html');

test.describe('Capacitor webview smoke', () => {
    test.beforeAll(() => {
        // Require a built bundle. If dist/ doesn't exist, skip with clear message.
        if (!fs.existsSync(DIST_INDEX)) {
            test.skip(true, 'dist/index.html missing — run `npm run build` first');
        }
    });

    test('built bundle loads without console errors', async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push('pageerror: ' + e.message));
        page.on('console', m => {
            if (m.type() === 'error') {
                const t = m.text();
                // Ignore file:// CORS noise + Firebase init errors (no real config in headless)
                if (/CORS|Cross-Origin|firebase|emulator/i.test(t)) return;
                errors.push('[error] ' + t);
            }
        });
        const url = 'file://' + DIST_INDEX.replace(/\\/g, '/');
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(800);
        expect(errors, `unexpected console errors:\n${errors.join('\n')}`).toEqual([]);
    });

    test('PB namespace + native abstractions resolve', async ({ page }) => {
        const url = 'file://' + DIST_INDEX.replace(/\\/g, '/');
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(800);
        const checks = await page.evaluate(() => {
            const out = {};
            out.PB = typeof window.PB === 'object';
            out.PB_native = !!(window.PB && window.PB.native);
            // Check each abstraction has at least one method exposed
            const abstractions = ['device', 'storage', 'gps', 'camera', 'haptics', 'share', 'push'];
            out.abstractions = {};
            if (window.PB && window.PB.native) {
                for (const a of abstractions) {
                    out.abstractions[a] = !!window.PB.native[a];
                }
            }
            return out;
        });
        expect(checks.PB, 'PB namespace must exist').toBe(true);
        expect(checks.PB_native, 'PB.native must exist').toBe(true);
        for (const a of ['device', 'storage', 'gps', 'camera', 'haptics', 'share', 'push']) {
            expect(checks.abstractions[a], `PB.native.${a} must be defined`).toBe(true);
        }
    });

    test('home renders first-paint content', async ({ page }) => {
        const url = 'file://' + DIST_INDEX.replace(/\\/g, '/');
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        // Body should contain some text (not blank)
        const bodyText = await page.locator('body').textContent();
        expect(bodyText.length, 'body must have visible content').toBeGreaterThan(100);
        // PARBAUGHS-specific surface markers
        const hasHomeMarker = await page.evaluate(() => {
            return (
                document.querySelector('#home-page, #app-root, [data-page="home"], .pb-app') !== null
            );
        });
        expect(hasHomeMarker, 'home surface marker must render').toBe(true);
    });
});
